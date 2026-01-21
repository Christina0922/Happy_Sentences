'use client';

import { useEffect } from 'react';
import { getBasicTtsPlayer } from '@/src/lib/tts/basicTts';

/**
 * TTS 초기화 컴포넌트
 * 앱 시작 시 speechSynthesis voices를 프리로드합니다.
 * iOS Safari에서 TTS 성공률을 높이기 위해 필요합니다.
 */
export default function TtsInitializer() {
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      console.log('[TTS Initializer] Preloading TTS voices...');
      const tts = getBasicTtsPlayer();
      
      // 음성 목록 확인
      setTimeout(() => {
        const voices = tts.getVoices();
        console.log(`[TTS Initializer] ✅ ${voices.length} voices available`);
      }, 500);
    }
  }, []);

  return null; // UI 렌더링 없음
}

