# 개발자 전용 TTS 진단 패널 구현 완료 보고서

## 📋 작업 개요
**목표**: 개발자가 TTS 상태를 즉시 확인하고 디버깅할 수 있는 진단 패널 구현

**완료 일시**: 2026-01-21

---

## ✅ 구현 완료 사항

### 1. **TTS 상태 저장소 (ttsDiagnostics.ts)**
**파일**: `src/lib/tts/ttsDiagnostics.ts` (신규 생성)

#### 역할:
TTS 동작 상태를 전역으로 관리하고 추적하는 상태 저장소

#### 주요 기능:
```typescript
interface TtsStatus {
  supported: boolean;              // 브라우저 지원 여부
  voicesLoaded: boolean;          // 음성 목록 로드 여부
  voicesCount: number;            // 사용 가능한 음성 수
  selectedVoiceName: string | null;  // 선택된 음성 이름
  selectedVoiceLang: string | null;  // 선택된 음성 언어
  speaking: boolean;              // 현재 재생 중
  pending: boolean;               // 대기 중
  lastAction: TtsAction;          // 마지막 액션
  lastError: TtsError | null;     // 마지막 에러
  lastSpokenTextLen: number;      // 마지막 재생 텍스트 길이
  lastSpokenLang: TtsLanguage;    // 마지막 재생 언어
  lastUpdated: number;            // 업데이트 시간
}
```

#### 제공 함수:
- `getTtsStatus()`: 현재 상태 반환
- `updateTtsStatus()`: 상태 업데이트
- `resetTtsStatus()`: 상태 리셋
- `addTtsStatusListener()`: 상태 변경 리스너 등록
- `recordTtsError()`: 에러 기록
- `recordTtsAction()`: 액션 기록
- `logTtsDiagnostics()`: 콘솔에 진단 정보 출력

---

### 2. **통합 TTS 실행 함수 (speakText.ts)**
**파일**: `src/lib/tts/speakText.ts` (신규 생성)

#### 역할:
TTS 실행의 단일 진입점, 모든 안정화 로직 통합

#### 실행 순서:
1. ✅ 브라우저 지원 체크
2. ✅ 상태 업데이트 (speaking/pending)
3. ✅ `speechSynthesis.cancel()` 실행
4. ✅ 80-120ms 안정화 지연 (개발: 100ms, 프로덕션: 50ms)
5. ✅ voices 준비 확인 (최대 3회 재시도, 100ms 간격)
6. ✅ 언어에 맞는 음성 선택
7. ✅ `SpeechSynthesisUtterance` 생성 (rate=0.95, pitch=1.0)
8. ✅ 이벤트 핸들러 설정 (onstart, onend, onerror)
9. ✅ `speechSynthesis.speak()` 실행

#### 제공 함수:
```typescript
async function speakText(text: string, lang: 'kr' | 'en'): Promise<boolean>
function stopSpeaking(): void
```

#### 특징:
- 실패 시 throw하지 않고 boolean 반환
- 모든 단계에서 상태 업데이트
- 에러 발생 시 `lastError`에 기록

---

### 3. **자동 셀프테스트 (selfTestTts.ts)**
**파일**: `src/lib/tts/selfTestTts.ts` (신규 생성)

#### 역할:
TTS 안정성 검증을 위한 자동 테스트

#### 테스트 문구:
- **한국어**: "테스트 문장입니다."
- **영어**: "This is a test sentence."

#### 제공 함수:
```typescript
async function runTtsSelfTest(
  lang: 'kr' | 'en',
  onProgress?: (current: number, total: number) => void
): Promise<SelfTestResult>

async function runQuickTest(lang: 'kr' | 'en'): Promise<boolean>
```

#### 테스트 결과:
```typescript
interface SelfTestResult {
  pass: number;      // 성공 횟수
  fail: number;      // 실패 횟수
  errors: Array<{    // 에러 목록
    round: number;
    error: TtsError | null;
  }>;
  totalTime: number; // 총 소요 시간
}
```

#### 동작 방식:
1. 10회 반복 테스트 실행
2. 각 회차마다 `speakText()` 호출
3. `onend`까지 대기 후 다음 회차
4. 실패 시 에러 정보 수집
5. 진행률 콜백으로 UI 업데이트

---

### 4. **개발자 전용 UI 패널 (DevTtsPanel.tsx)**
**파일**: `src/components/DevTtsPanel.tsx` (신규 생성)

#### 역할:
개발자가 TTS 상태를 실시간으로 확인하고 제어하는 UI

#### 화면 위치:
우측 하단 (고정 위치, z-index: 50)

#### 표시 정보:
```
📊 TTS Dev Panel

✅ Supported: ✅/❌
✅ Voices: 15 ✅ (voicesCount)
🔊 Speaking: YES/NO
⏳ Pending: YES/NO

Selected Voice:
  Microsoft Heami - Korean (Korea)
  ko-KR

Last Action: SPEAK
  Lang: KR | Text: 45 chars

❌ Last Error:
  Code: no-speech
  Message: No speech detected
  2026-01-21 10:30:45

🧪 Test Result: 8/10
  ✅ Pass: 8
  ❌ Fail: 2
  Time: 12345ms
  Success Rate: 80.0%
```

#### 버튼:
1. **🔄 Reload Voices**: `initBasicTts()` 재호출
2. **⛔ Cancel**: `speechSynthesis.cancel()` + 상태 갱신
3. **⚡ Quick Test**: 1회 빠른 테스트
4. **🧪 Self Test x10**: 10회 자동 테스트
5. **📋 Log to Console**: `logTtsDiagnostics()` 호출

#### 특징:
- ✅ 실시간 상태 업데이트 (리스너 기반)
- ✅ 최소화/최대화 토글
- ✅ 테스트 진행률 표시 (프로그레스 바)
- ✅ 프로덕션에서는 절대 렌더링되지 않음

---

### 5. **basicTts.ts 통합**
**파일**: `src/lib/tts/basicTts.ts` (수정)

#### 변경 사항:
`initBasicTts()` 함수에 진단 상태 업데이트 추가

```typescript
export function initBasicTts(): void {
  const player = getBasicTtsPlayer();
  console.log('[Basic TTS] Initialized');
  
  // 진단 상태 업데이트 (개발 모드만)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    import('./ttsDiagnostics').then(({ updateTtsStatus, recordTtsAction }) => {
      const voices = player.getVoices();
      updateTtsStatus({
        supported: player.isAvailable(),
        voicesLoaded: voices.length > 0,
        voicesCount: voices.length,
      });
      recordTtsAction('preload', {...});
    });
  }
}
```

---

### 6. **기존 코드 통합**

#### app/layout.tsx
- `DevTtsPanel` 컴포넌트 추가
- 화면 최하단에 렌더링

```typescript
<body>
  <Providers>
    <TtsInitializer />
    {children}
    <DevTtsPanel />  {/* 추가 */}
  </Providers>
</body>
```

#### components/ResultCards.tsx
- 개발 모드에서 `speakText()` 사용
- 프로덕션에서는 기존 `basicTts.speak()` 유지

```typescript
if (process.env.NODE_ENV !== 'production') {
  const { speakText } = await import('@/src/lib/tts/speakText');
  const success = await speakText(textToSpeak, language);
} else {
  await basicTts.speak(textToSpeak, language, {...});
}
```

#### components/Composer.tsx
- ResultCards와 동일한 패턴 적용

---

## 📁 생성/수정된 파일 목록

### 신규 생성 (4개):
1. **`src/lib/tts/ttsDiagnostics.ts`**
   - TTS 상태 저장소 및 리스너 관리

2. **`src/lib/tts/speakText.ts`**
   - 통합 TTS 실행 함수 (안정화 로직 포함)

3. **`src/lib/tts/selfTestTts.ts`**
   - 자동 셀프테스트 (10회 연속)

4. **`src/components/DevTtsPanel.tsx`**
   - 개발자 전용 진단 UI 패널

### 수정 (4개):
5. **`src/lib/tts/basicTts.ts`**
   - `initBasicTts()`에 진단 상태 업데이트 추가

6. **`app/layout.tsx`**
   - `DevTtsPanel` 컴포넌트 추가

7. **`components/ResultCards.tsx`**
   - 개발 모드에서 `speakText()` 사용

8. **`components/Composer.tsx`**
   - 개발 모드에서 `speakText()` 사용

---

## 🎯 Self Test 실행 방법

### 1. **화면에서 찾기**
- 브라우저 새로고침 (F5)
- **우측 하단**에 `📊 TTS Dev Panel` 버튼 확인
- 버튼 클릭하여 패널 열기

### 2. **Self Test x10 실행**
- 패널 하단의 **🧪 Self Test x10** 버튼 클릭
- 진행률 표시: `Testing... 3/10` (프로그레스 바)
- 완료 시 결과 표시:
  ```
  🧪 Test Result: 8/10
  ✅ Pass: 8
  ❌ Fail: 2
  Time: 12345ms
  Success Rate: 80.0%
  ```

### 3. **Quick Test 실행 (1회만)**
- 패널 하단의 **⚡ Quick Test** 버튼 클릭
- 즉시 1회 테스트 실행
- 콘솔에 결과 출력: `[Dev Panel] Quick test ✅ PASS` 또는 `❌ FAIL`

### 4. **기타 기능**
- **🔄 Reload Voices**: 음성 목록 재로드
- **⛔ Cancel**: 현재 재생 중단
- **📋 Log to Console**: 현재 상태를 콘솔에 테이블 형태로 출력

---

## 🔍 사용 예시

### 개발 모드 (NODE_ENV !== 'production'):
```
1. 브라우저 새로고침
2. 우측 하단에 "📊 TTS Dev Panel" 버튼 표시됨
3. 버튼 클릭하여 패널 열기
4. "🧪 Self Test x10" 클릭
5. 진행률 확인: "Testing... 7/10"
6. 결과 확인: "✅ Pass: 9 | ❌ Fail: 1"
7. 실패한 경우 "Last Error" 섹션에서 원인 확인
```

### 프로덕션 빌드:
```
1. npm run build
2. npm start
3. 우측 하단에 DevTtsPanel 표시되지 않음 ✅
4. 진단 로그 출력되지 않음 ✅
```

---

## 📊 완료 조건 체크리스트

- ✅ DevTtsPanel에서 현재 TTS 상태를 실시간으로 확인 가능
- ✅ voices 로드 여부, speaking/pending 상태 확인 가능
- ✅ 마지막 에러의 code/message/time 표시
- ✅ Self Test x10 실행 시 pass/fail 숫자 표시
- ✅ 진행률 표시 (3/10)
- ✅ 테스트 성공률 표시 (80.0%)
- ✅ 프로덕션 빌드에서 DevTtsPanel 절대 노출되지 않음
- ✅ 개발 모드에서 실패 원인이 lastError에 기록됨
- ✅ Reload Voices/Cancel/Quick Test 버튼 정상 동작

---

## 🎨 UI 스크린샷 설명

### 최소화 상태:
```
┌─────────────────────┐
│ 📊 TTS Dev Panel    │  ← 우측 하단 고정
└─────────────────────┘
```

### 최대화 상태:
```
┌───────────────────────────────────┐
│ 📊 TTS Dev Panel     [━]  DEV ONLY│
├───────────────────────────────────┤
│ Supported: ✅    Voices: 15 ✅   │
│ Speaking: 🔊 YES  Pending: NO     │
│                                   │
│ Selected Voice:                   │
│   Microsoft Heami - Korean...     │
│   ko-KR                           │
│                                   │
│ Last Action: SPEAK                │
│   Lang: KR | Text: 45 chars       │
│                                   │
│ ❌ Last Error:                    │
│   Code: no-speech                 │
│   Message: No speech detected     │
│   10:30:45                        │
│                                   │
│ 🧪 Test Result: 8/10              │
│   ✅ Pass: 8                      │
│   ❌ Fail: 2                      │
│   Time: 12345ms                   │
│   Success Rate: 80.0%             │
│                                   │
│ [🔄 Reload] [⛔ Cancel]           │
│ [⚡ Quick]  [🧪 Test x10]         │
│ [📋 Log to Console]               │
│                                   │
│ Updated: 10:30:45                 │
└───────────────────────────────────┘
```

---

## 🔧 디버깅 팁

### 1. **Voices가 0개일 때**
- "🔄 Reload Voices" 버튼 클릭
- 콘솔에서 `[Basic TTS] Loaded X voices` 확인

### 2. **Self Test 실패율이 높을 때**
- "Last Error" 섹션 확인
- 에러 코드별 해결 방법:
  - `no-speech`: 마이크 권한 또는 입력 문제
  - `not-allowed`: 브라우저 권한 거부
  - `network`: 네트워크 연결 문제

### 3. **Speaking이 계속 true일 때**
- "⛔ Cancel" 버튼으로 강제 중지
- `speechSynthesis.speaking` 상태 리셋됨

### 4. **상세 로그 확인**
- "📋 Log to Console" 버튼 클릭
- 브라우저 콘솔(F12)에서 테이블 형태로 전체 상태 확인

---

## ✨ 결론

**개발자 전용 TTS 진단 패널이 완벽하게 구현되었습니다!**

- ✅ 실시간 TTS 상태 모니터링
- ✅ 자동 셀프테스트 (10회 연속)
- ✅ 상세한 에러 정보 추적
- ✅ 프로덕션 완전 격리

**이제 개발 중에 TTS 문제를 즉시 진단하고 해결할 수 있습니다!** 🎉

우측 하단의 **📊 TTS Dev Panel** 버튼을 클릭하고 **🧪 Self Test x10**을 실행해보세요!

