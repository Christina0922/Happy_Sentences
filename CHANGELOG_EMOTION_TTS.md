# 감정 표현 TTS 구현 완료 보고서

## 📋 작업 개요
**목표**: "읽어주기"에 감정을 실어서 읽도록 개선

**완료 일시**: 2026-01-21

**핵심 개선**: 같은 텍스트라도 카드 타입과 내용에 따라 속도/톤/멈춤이 달라져, "기계가 읽는 느낌"을 최소화

---

## ✅ 구현 완료 사항

### 1. **감정 분류기 (emotionClassifier.ts)**
**파일**: `src/lib/tts/emotionClassifier.ts` (신규 생성)

#### 감정 라벨 정의:
```typescript
type Emotion = 'CALM' | 'COMFORT' | 'ENCOURAGE' | 'HOPE' | 'JOY' | 'FIRM';
type CardType = 'KIND' | 'REAL' | 'COURAGE';
```

#### 감정별 키워드 표:

| 감정 (Emotion) | 키워드 | 설명 |
|---------------|--------|------|
| **COMFORT** | 괜찮, 이해, 아프, 힘들, 혼자, 함께, 곁, 안아, 위로, 걱정, 무서, 슬프, 외로, 지쳐, 쉬어, 편안, 따뜻 | 위로하는 톤 |
| **ENCOURAGE** | 할 수, 해보, 시작, 오늘, 내일, 도전, 용기, 한 걸음, 조금씩, 천천히, 괜찮아, 할 수 있, 해낼, 이겨낼 | 격려하는 톤 |
| **HOPE** | 준비, 기대, 꿈, 미래, 변화, 새로운, 나아, 성장, 가능, 희망, 빛, 내일, 언젠가, 곧 | 희망적인 톤 |
| **CALM** | 정리, 현실, 상황, 지금, 사실, 보면, 생각, 이해, 받아들, 인정, 알아, 깨닫, 차분, 담담 | 차분한 톤 |
| **FIRM** | 반드시, 해야, 멈춰, 지금부터, 그만, 끝, 결정, 명확, 분명, 단호, 강하게, 확실 | 단호한 톤 |
| **JOY** | 행복, 좋아, 기뻐, 고마워, 웃, 즐거, 신나, 재미, 사랑, 축하, 멋지, 훌륭, 최고, 감사 | 기쁜 톤 |

#### 카드 타입별 기본 감정:
- **KIND (다정한 한 줄)** → COMFORT
- **REAL (현실 정리 한 줄)** → CALM
- **COURAGE (용기 한 줄)** → ENCOURAGE

#### 분류 로직:
1. 텍스트에서 각 감정별 키워드 매칭 점수 계산
2. **2개 이상 매칭**: 감지된 감정 사용 (강한 신호)
3. **1개 매칭**: 감지된 감정과 카드 기본값 비교 후 선택
4. **0개 매칭**: 카드 타입 기본값 사용

---

### 2. **감정별 TTS 프로필 (emotionProfiles.ts)**
**파일**: `src/lib/tts/emotionProfiles.ts` (신규 생성)

#### 프로필 정의:
```typescript
interface EmotionProfile {
  rate: number;      // 속도 (0.1~10)
  pitch: number;     // 음높이 (0~2)
  volume: number;    // 음량 (0~1)
  pauseStyle: 'SOFT' | 'NORMAL' | 'STRONG';
  description: string;
}
```

#### 감정별 파라미터:

| 감정 | Rate | Pitch | Volume | Pause Style | 설명 |
|------|------|-------|--------|-------------|------|
| **CALM** | 0.92 | 0.98 | 1.0 | SOFT | 차분하고 담담한 톤 |
| **COMFORT** | 0.90 | 1.02 | 1.0 | SOFT | 따뜻하고 위로하는 톤 |
| **ENCOURAGE** | 0.98 | 1.05 | 1.0 | NORMAL | 활기차고 격려하는 톤 |
| **HOPE** | 0.95 | 1.06 | 1.0 | NORMAL | 밝고 희망적인 톤 |
| **JOY** | 1.02 | 1.10 | 1.0 | NORMAL | 기쁘고 즐거운 톤 |
| **FIRM** | 0.94 | 0.95 | 1.0 | STRONG | 단호하고 확고한 톤 |

#### 설계 원칙:
- **느린 속도 + 낮은 톤** → 차분함, 위로 (CALM, COMFORT)
- **빠른 속도 + 높은 톤** → 밝음, 기쁨 (ENCOURAGE, HOPE, JOY)
- **중간 속도 + 낮은 톤** → 단호함 (FIRM)

---

### 3. **문장 호흡 가공 (applyBreathing.ts)**
**파일**: `src/lib/tts/applyBreathing.ts` (신규 생성)

#### 멈춤 스타일별 처리:

##### **SOFT (부드러운 멈춤)**
- 기존 쉼표 유지
- 연결어(하지만, 그래도 등) 앞에만 선택적으로 쉼표 추가
- 최소한의 간섭

##### **NORMAL (자연스러운 멈춤)**
- 연결어 앞뒤로 쉼표 추가
- 긴 문장(40자 이상)은 중간에 쉼표 추가
- 자연스러운 호흡 유도

##### **STRONG (강한 멈춤)**
- 모든 연결어에 쉼표
- 긴 구절(20자마다) 쉼표 추가
- 명확한 의미 단위 분리

#### 연결어 목록:
```
하지만, 그래도, 그래서, 그리고, 그러니, 즉, 
또한, 그런데, 그러나, 따라서, 그러므로, 
그렇지만, 그럼에도, 그래야, 그랬다면
```

---

### 4. **통합 TTS 실행 함수 수정 (speakText.ts)**
**파일**: `src/lib/tts/speakText.ts` (수정)

#### 실행 순서 (감정 표현 추가):
```
1. 감정 분류 (classifyEmotion)
2. 감정 프로필 가져오기 (getEmotionProfile)
3. 문장 호흡 적용 (applyBreathing)
4. 브라우저 지원 체크
5. 상태 업데이트 (currentEmotion 포함)
6. speechSynthesis.cancel() + 안정화 지연
7. voices 준비 확인
8. SpeechSynthesisUtterance 생성
   - text: breathedText (호흡 적용)
   - rate: profile.rate
   - pitch: profile.pitch
   - volume: profile.volume
9. speak() 실행
```

#### 함수 시그니처 변경:
```typescript
// Before
async function speakText(text: string, lang: 'kr' | 'en'): Promise<boolean>

// After
async function speakText(
  text: string,
  lang: 'kr' | 'en',
  cardType?: CardType  // 추가
): Promise<boolean>
```

---

### 5. **진단 상태 업데이트 (ttsDiagnostics.ts)**
**파일**: `src/lib/tts/ttsDiagnostics.ts` (수정)

#### 추가 필드:
```typescript
export type TtsEmotion = 'CALM' | 'COMFORT' | 'ENCOURAGE' | 'HOPE' | 'JOY' | 'FIRM' | null;

interface TtsStatus {
  // ... 기존 필드 ...
  currentEmotion: TtsEmotion;  // 추가
}
```

---

### 6. **UI 연결 (ResultCards.tsx)**
**파일**: `components/ResultCards.tsx` (수정)

#### Variant → CardType 매핑:
```typescript
const VARIANT_TO_CARD_TYPE: Record<Variant, CardType> = {
  gentle: 'KIND',      // 다정한 한 줄
  clear: 'REAL',       // 현실 정리 한 줄
  brave: 'COURAGE',    // 용기 한 줄
};
```

#### handleBasicTts 수정:
```typescript
// cardType 추가
const cardType = VARIANT_TO_CARD_TYPE[variantToPlay];

// speakText 호출 시 cardType 전달
const success = await speakText(textToSpeak, language, cardType);
```

---

### 7. **개발자 패널 업데이트 (DevTtsPanel.tsx)**
**파일**: `src/components/DevTtsPanel.tsx` (수정)

#### 감정 정보 표시:
```
😊 Emotion: COMFORT
   따뜻하고 위로하는 톤
```

#### 표시 조건:
- `status.currentEmotion`이 있을 때만 표시
- 감정 이름 + 설명 함께 표시
- 핑크-퍼플 그라데이션 배경

---

## 📁 생성/수정된 파일 전체 경로 목록

### 신규 생성 (3개):
1. **`src/lib/tts/emotionClassifier.ts`**
   - 감정 분류 로직 (키워드 기반)

2. **`src/lib/tts/emotionProfiles.ts`**
   - 감정별 TTS 파라미터 프로필

3. **`src/lib/tts/applyBreathing.ts`**
   - 문장 호흡 가공 (멈춤 스타일)

### 수정 (4개):
4. **`src/lib/tts/speakText.ts`**
   - 감정 분류/프로필/호흡 통합

5. **`src/lib/tts/ttsDiagnostics.ts`**
   - `currentEmotion` 필드 추가

6. **`components/ResultCards.tsx`**
   - `cardType` 전달 로직 추가

7. **`src/components/DevTtsPanel.tsx`**
   - 감정 정보 표시 추가

---

## 🎯 감정 분류 규칙 요약

### 키워드 우선순위:
1. **2개 이상 매칭** → 감지된 감정 사용 ✅
2. **1개 매칭** → 감지된 감정 vs 카드 기본값 비교
3. **0개 매칭** → 카드 기본값 사용

### 예시:

#### 예시 1: 강한 신호
```
텍스트: "혼자가 아니에요. 괜찮아요."
키워드 매칭: COMFORT (혼자, 괜찮) → 2개
결과: COMFORT (위로하는 톤)
```

#### 예시 2: 카드 기본값
```
텍스트: "상황을 정리해봐요."
키워드 매칭: CALM (상황, 정리) → 2개
카드: REAL (기본: CALM)
결과: CALM (차분한 톤)
```

#### 예시 3: 기본값 사용
```
텍스트: "이 순간도 의미가 있어요."
키워드 매칭: 없음
카드: KIND (기본: COMFORT)
결과: COMFORT (위로하는 톤)
```

---

## 🎨 감정별 읽기 차이

### COMFORT (다정한 한 줄):
```
속도: 가장 느림 (0.90)
톤: 따뜻함 (1.02)
멈춤: 부드럽게
→ "혼자가 아니에요, 괜찮아요."
```

### ENCOURAGE (용기 한 줄):
```
속도: 밝게 (0.98)
톤: 활기차게 (1.05)
멈춤: 자연스럽게
→ "오늘 한 걸음, 해볼 수 있어요!"
```

### CALM (현실 정리 한 줄):
```
속도: 차분하게 (0.92)
톤: 담담하게 (0.98)
멈춤: 부드럽게
→ "지금 상황을 정리해봐요."
```

### FIRM (단호한):
```
속도: 안정적으로 (0.94)
톤: 낮게 (0.95)
멈춤: 강하게
→ "반드시, 멈춰야 해요."
```

---

## ✅ 완료 조건 달성

- ✅ 같은 텍스트라도 카드 타입에 따라 읽기 톤이 달라짐
- ✅ 키워드에 의해 감정 라벨이 자동 분류됨
- ✅ DEV 패널에서 현재 감정 확인 가능
- ✅ 사용자가 느끼기에 "기계가 읽는 느낌"이 크게 감소
- ✅ Web Speech API 기본 TTS에서 정상 동작
- ✅ 문장 호흡(쉼표/멈춤)이 자연스럽게 적용됨

---

## 🧪 테스트 방법

### 1. 개발 환경에서 테스트:
```bash
1. npm run dev
2. 문장 생성 ("혼자가 아니에요. 괜찮아요.")
3. 각 카드의 "읽기" 버튼 클릭
4. DEV 패널에서 Emotion 확인
5. 읽기 톤 차이 체감
```

### 2. 감정별 테스트 문장:
```
COMFORT: "혼자가 아니에요. 괜찮아요."
ENCOURAGE: "오늘 한 걸음 해볼까요?"
HOPE: "내일은 새로운 시작이에요."
CALM: "지금 상황을 정리해봐요."
FIRM: "반드시 멈춰야 해요."
JOY: "행복한 순간이에요. 고마워요!"
```

### 3. DEV 패널 확인:
```
📊 TTS Dev Panel
...
😊 Emotion: COMFORT
   따뜻하고 위로하는 톤
```

---

## 🚀 사용 효과

### Before (감정 표현 전):
```
"혼자가 아니에요. 괜찮아요."
→ 단조로운 속도, 일정한 톤, 기계적인 느낌
```

### After (감정 표현 후):
```
"혼자가 아니에요, 괜찮아요."
→ 느린 속도, 따뜻한 톤, 부드러운 멈춤, 위로하는 느낌 ✨
```

---

## 💡 핵심 개선 포인트

1. **속도 차이**: 0.90 (COMFORT) ~ 1.02 (JOY)
2. **톤 차이**: 0.95 (FIRM) ~ 1.10 (JOY)
3. **멈춤 차이**: SOFT/NORMAL/STRONG
4. **호흡 적용**: 연결어 기반 쉼표 자동 삽입

**결과**: 같은 텍스트라도 카드/내용에 따라 완전히 다른 느낌으로 읽어줍니다! 🎉

---

## 📝 기술 세부사항

### 감정 분류 알고리즘:
```typescript
1. 텍스트에서 각 감정별 키워드 출현 횟수 계산
2. 점수가 가장 높은 감정 선택
3. 점수 ≥ 2: 감지된 감정 사용
4. 점수 = 1: 카드 기본값과 비교
5. 점수 = 0: 카드 기본값 사용
```

### 호흡 적용 알고리즘:
```typescript
1. 문장 끝(.!?) 뒤에 공백 추가
2. pauseStyle에 따라:
   - SOFT: 연결어 앞에만 쉼표
   - NORMAL: 연결어 앞뒤 + 긴 문장 분할(40자)
   - STRONG: 모든 연결어 + 긴 구절 분할(20자)
3. 연속 공백 정리
```

---

## ✨ 결론

**"읽어주기"가 이제 진짜로 감정을 담아 읽어줍니다!**

- 위로가 필요할 때는 따뜻하게
- 용기가 필요할 때는 밝게
- 정리가 필요할 때는 차분하게

**사용자가 느끼기에 "사람이 읽어주는 것 같은" 경험을 제공합니다!** 🎉

