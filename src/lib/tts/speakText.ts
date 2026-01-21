/**
 * 통합 TTS 실행 함수
 * 개발자 진단과 안정성을 위한 단일 진입점
 * 감정 표현 기능 포함
 */

import { updateTtsStatus, recordTtsError, recordTtsAction, getTtsStatus } from './ttsDiagnostics';
import { classifyEmotion, type CardType, type Emotion } from './emotionClassifier';
import { getEmotionProfile, logEmotionProfile } from './emotionProfiles';
import { applyBreathing } from './applyBreathing';

// 개발 모드 체크
const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * 텍스트를 음성으로 읽기 (감정 표현 포함)
 * @param text 읽을 텍스트
 * @param lang 언어 ('kr' 또는 'en')
 * @param cardType 카드 타입 (선택, 감정 분류에 사용)
 * @returns 성공 여부
 */
export async function speakText(
  text: string,
  lang: 'kr' | 'en',
  cardType?: CardType
): Promise<boolean> {
  console.log(`[speakText] Starting TTS (lang: ${lang}, textLen: ${text.length}, cardType: ${cardType || 'none'})`);
  
  // 1. 감정 분류
  const emotion: Emotion = classifyEmotion(text, cardType);
  console.log(`[speakText] Detected emotion: ${emotion}`);

  // 2. 감정 프로필 가져오기
  const profile = getEmotionProfile(emotion);
  logEmotionProfile(emotion);

  // 3. 문장 호흡 적용
  const breathedText = applyBreathing(text, profile.pauseStyle);
  console.log(`[speakText] Applied breathing (${profile.pauseStyle})`);

  // 4. 브라우저 지원 체크
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    recordTtsError('not-supported', 'Speech synthesis not supported in this browser');
    return false;
  }

  const synth = window.speechSynthesis;

  try {
    // 5. 상태 업데이트 (시작)
    const currentStatus = getTtsStatus();
    updateTtsStatus({
      speaking: true,
      pending: false,
      lastSpokenTextLen: text.length,
      lastSpokenLang: lang,
      currentEmotion: emotion,  // 감정 상태 추가
    });
    recordTtsAction('speak', {
      lastSpokenTextLen: text.length,
      lastSpokenLang: lang,
      currentEmotion: emotion,
    });

    // 3. speechSynthesis.cancel() 실행
    if (synth.speaking || synth.pending) {
      console.log('[speakText] Canceling previous speech');
      synth.cancel();
      recordTtsAction('cancel');
    }

    // 4. 안정화 지연 (개발 모드: 100ms, 프로덕션: 50ms)
    const delayMs = IS_DEV ? 100 : 50;
    console.log(`[speakText] Waiting ${delayMs}ms for stabilization...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // 5. voices 준비 확인 (최대 3회 재시도)
    let voices = synth.getVoices();
    let retries = 0;
    const maxRetries = 3;

    while (voices.length === 0 && retries < maxRetries) {
      console.log(`[speakText] Voices not loaded, retrying... (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 100));
      voices = synth.getVoices();
      retries++;
    }

    // voices 상태 업데이트
    updateTtsStatus({
      voicesLoaded: voices.length > 0,
      voicesCount: voices.length,
    });

    if (voices.length === 0) {
      recordTtsError('no-voices', 'No voices available after retries');
      updateTtsStatus({ speaking: false });
      return false;
    }

    console.log(`[speakText] ✅ ${voices.length} voices available`);

    // 6. 언어에 맞는 음성 선택
    const langCode = lang === 'kr' ? 'ko' : 'en';
    let selectedVoice: SpeechSynthesisVoice | null = null;

    // 1순위: localService + 언어 매치
    selectedVoice = voices.find(
      voice => voice.lang.startsWith(langCode) && voice.localService
    ) || null;

    // 2순위: 언어 매치
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith(langCode)) || null;
    }

    // 3순위: 기본 음성
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }

    // 선택된 음성 정보 업데이트
    updateTtsStatus({
      selectedVoiceName: selectedVoice?.name || null,
      selectedVoiceLang: selectedVoice?.lang || null,
    });

    console.log(`[speakText] Selected voice: ${selectedVoice?.name} (${selectedVoice?.lang})`);

    // 7. SpeechSynthesisUtterance 생성 (감정 프로필 적용)
    const utterance = new SpeechSynthesisUtterance(breathedText);  // 호흡 적용된 텍스트 사용
    utterance.lang = lang === 'kr' ? 'ko-KR' : 'en-US';
    utterance.rate = profile.rate;      // 감정별 속도
    utterance.pitch = profile.pitch;    // 감정별 음높이
    utterance.volume = profile.volume;  // 감정별 음량

    console.log(`[speakText] Utterance settings:`, {
      rate: profile.rate,
      pitch: profile.pitch,
      volume: profile.volume,
      emotion: emotion,
    });

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // 8. 이벤트 핸들러 설정
    return new Promise<boolean>((resolve) => {
      utterance.onstart = () => {
        console.log('[speakText] ✅ Started playing');
        recordTtsAction('speak');
      };

      utterance.onend = () => {
        console.log('[speakText] ✅ Finished playing');
        updateTtsStatus({
          speaking: false,
          pending: false,
        });
        recordTtsAction('end');
        resolve(true);
      };

      utterance.onerror = (event: any) => {
        console.error('[speakText] ❌ Error:', event.error);
        updateTtsStatus({
          speaking: false,
          pending: false,
        });
        recordTtsError(event.error || 'unknown', event.message || 'Speech error');
        resolve(false);
      };

      // 9. speechSynthesis.speak() 실행
      try {
        synth.speak(utterance);
        console.log('[speakText] speak() called successfully');
      } catch (error) {
        console.error('[speakText] ❌ Failed to call speak():', error);
        updateTtsStatus({
          speaking: false,
          pending: false,
        });
        recordTtsError('speak-failed', error instanceof Error ? error.message : 'Unknown error');
        resolve(false);
      }
    });

  } catch (error) {
    console.error('[speakText] ❌ Exception:', error);
    updateTtsStatus({
      speaking: false,
      pending: false,
    });
    recordTtsError('exception', error instanceof Error ? error.message : 'Unknown exception');
    return false;
  }
}

/**
 * 현재 재생 중인 TTS 중지
 */
export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  const synth = window.speechSynthesis;
  
  if (synth.speaking || synth.pending) {
    console.log('[speakText] Stopping speech');
    synth.cancel();
    updateTtsStatus({
      speaking: false,
      pending: false,
    });
    recordTtsAction('cancel');
  }
}

