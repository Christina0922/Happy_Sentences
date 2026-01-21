/**
 * 감정 분류기
 * 문장 내용과 카드 타입을 기반으로 감정을 분류
 */

export type Emotion = 'CALM' | 'COMFORT' | 'ENCOURAGE' | 'HOPE' | 'JOY' | 'FIRM';
export type CardType = 'KIND' | 'REAL' | 'COURAGE';

// 감정별 키워드
const EMOTION_KEYWORDS: Record<Emotion, string[]> = {
  COMFORT: [
    '괜찮', '이해', '아프', '힘들', '혼자', '함께', '곁', '안아', '위로',
    '걱정', '무서', '슬프', '외로', '지쳐', '쉬어', '편안', '따뜻',
  ],
  ENCOURAGE: [
    '할 수', '해보', '시작', '오늘', '내일', '도전', '용기', '한 걸음',
    '조금씩', '천천히', '괜찮아', '할 수 있', '해낼', '이겨낼',
  ],
  HOPE: [
    '준비', '기대', '꿈', '미래', '변화', '새로운', '나아', '성장',
    '가능', '희망', '빛', '내일', '언젠가', '곧',
  ],
  CALM: [
    '정리', '현실', '상황', '지금', '사실', '보면', '생각', '이해',
    '받아들', '인정', '알아', '깨닫', '차분', '담담',
  ],
  FIRM: [
    '반드시', '해야', '멈춰', '지금부터', '그만', '끝', '결정',
    '명확', '분명', '단호', '강하게', '확실',
  ],
  JOY: [
    '행복', '좋아', '기뻐', '고마워', '웃', '즐거', '신나', '재미',
    '사랑', '축하', '멋지', '훌륭', '최고', '감사',
  ],
};

// 카드 타입별 기본 감정
const DEFAULT_EMOTION_BY_CARD: Record<CardType, Emotion> = {
  KIND: 'COMFORT',
  REAL: 'CALM',
  COURAGE: 'ENCOURAGE',
};

/**
 * 텍스트에서 감정 키워드 매칭 점수 계산
 */
function calculateEmotionScore(text: string, keywords: string[]): number {
  let score = 0;
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      score += 1;
    }
  }

  return score;
}

/**
 * 문장 내용과 카드 타입을 기반으로 감정 분류
 * @param text 분석할 텍스트
 * @param cardType 카드 타입 (선택)
 * @returns 분류된 감정
 */
export function classifyEmotion(text: string, cardType?: CardType): Emotion {
  console.log(`[Emotion Classifier] Analyzing text (cardType: ${cardType || 'none'})`);

  // 각 감정별 점수 계산
  const scores: Record<Emotion, number> = {
    CALM: calculateEmotionScore(text, EMOTION_KEYWORDS.CALM),
    COMFORT: calculateEmotionScore(text, EMOTION_KEYWORDS.COMFORT),
    ENCOURAGE: calculateEmotionScore(text, EMOTION_KEYWORDS.ENCOURAGE),
    HOPE: calculateEmotionScore(text, EMOTION_KEYWORDS.HOPE),
    JOY: calculateEmotionScore(text, EMOTION_KEYWORDS.JOY),
    FIRM: calculateEmotionScore(text, EMOTION_KEYWORDS.FIRM),
  };

  console.log('[Emotion Classifier] Keyword scores:', scores);

  // 가장 높은 점수를 가진 감정 찾기
  let maxScore = 0;
  let detectedEmotion: Emotion | null = null;

  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion as Emotion;
    }
  }

  // 카드 타입 기본값
  const defaultEmotion = cardType ? DEFAULT_EMOTION_BY_CARD[cardType] : 'CALM';

  // 키워드 매칭이 있으면 우선, 없으면 카드 타입 기본값 사용
  let finalEmotion: Emotion;

  if (maxScore >= 2) {
    // 2개 이상의 키워드 매칭 → 강한 감정 신호
    finalEmotion = detectedEmotion!;
    console.log(`[Emotion Classifier] Strong signal detected: ${finalEmotion} (score: ${maxScore})`);
  } else if (maxScore === 1) {
    // 1개 키워드 매칭 → 카드 타입과 비교
    if (detectedEmotion && detectedEmotion !== defaultEmotion) {
      // 감지된 감정이 기본값과 다르면 감지된 감정 우선
      finalEmotion = detectedEmotion;
      console.log(`[Emotion Classifier] Weak signal, using detected: ${finalEmotion}`);
    } else {
      // 기본값 사용
      finalEmotion = defaultEmotion;
      console.log(`[Emotion Classifier] Weak signal, using default: ${finalEmotion}`);
    }
  } else {
    // 키워드 매칭 없음 → 카드 타입 기본값
    finalEmotion = defaultEmotion;
    console.log(`[Emotion Classifier] No signal, using default: ${finalEmotion}`);
  }

  console.log(`[Emotion Classifier] Final emotion: ${finalEmotion}`);
  return finalEmotion;
}

/**
 * 감정을 한글로 변환
 */
export function getEmotionLabel(emotion: Emotion): string {
  const labels: Record<Emotion, string> = {
    CALM: '차분한',
    COMFORT: '위로하는',
    ENCOURAGE: '격려하는',
    HOPE: '희망적인',
    JOY: '기쁜',
    FIRM: '단호한',
  };
  return labels[emotion];
}

