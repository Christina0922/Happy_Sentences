/**
 * 감정별 TTS 파라미터 프로필
 * Web Speech API용 rate/pitch/volume 설정
 */

import { Emotion } from './emotionClassifier';

export type PauseStyle = 'SOFT' | 'NORMAL' | 'STRONG';

export interface EmotionProfile {
  rate: number;      // 속도 (0.1 ~ 10, 기본: 1.0)
  pitch: number;     // 음높이 (0 ~ 2, 기본: 1.0)
  volume: number;    // 음량 (0 ~ 1, 기본: 1.0)
  pauseStyle: PauseStyle;  // 멈춤 스타일
  description: string;     // 설명
}

/**
 * 감정별 TTS 프로필
 * 
 * 설계 원칙:
 * - CALM: 느리고 낮은 톤, 부드러운 멈춤
 * - COMFORT: 가장 느리고 따뜻한 톤, 부드러운 멈춤
 * - ENCOURAGE: 밝고 활기찬 톤, 자연스러운 멈춤
 * - HOPE: 밝고 희망적인 톤, 자연스러운 멈춤
 * - JOY: 빠르고 높은 톤, 자연스러운 멈춤
 * - FIRM: 안정적이고 단호한 톤, 강한 멈춤
 */
export const EMOTION_PROFILES: Record<Emotion, EmotionProfile> = {
  CALM: {
    rate: 0.92,
    pitch: 0.98,
    volume: 1.0,
    pauseStyle: 'SOFT',
    description: '차분하고 담담한 톤',
  },
  
  COMFORT: {
    rate: 0.90,
    pitch: 1.02,
    volume: 1.0,
    pauseStyle: 'SOFT',
    description: '따뜻하고 위로하는 톤',
  },
  
  ENCOURAGE: {
    rate: 0.98,
    pitch: 1.05,
    volume: 1.0,
    pauseStyle: 'NORMAL',
    description: '활기차고 격려하는 톤',
  },
  
  HOPE: {
    rate: 0.95,
    pitch: 1.06,
    volume: 1.0,
    pauseStyle: 'NORMAL',
    description: '밝고 희망적인 톤',
  },
  
  JOY: {
    rate: 1.02,
    pitch: 1.10,
    volume: 1.0,
    pauseStyle: 'NORMAL',
    description: '기쁘고 즐거운 톤',
  },
  
  FIRM: {
    rate: 0.94,
    pitch: 0.95,
    volume: 1.0,
    pauseStyle: 'STRONG',
    description: '단호하고 확고한 톤',
  },
};

/**
 * 감정에 맞는 TTS 프로필 가져오기
 */
export function getEmotionProfile(emotion: Emotion): EmotionProfile {
  return EMOTION_PROFILES[emotion];
}

/**
 * 프로필 정보 로깅
 */
export function logEmotionProfile(emotion: Emotion): void {
  const profile = EMOTION_PROFILES[emotion];
  console.log(`[Emotion Profile] ${emotion}:`, {
    rate: profile.rate,
    pitch: profile.pitch,
    pauseStyle: profile.pauseStyle,
    description: profile.description,
  });
}

