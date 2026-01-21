/**
 * 통합 TTS 실행 함수 (강화된 에러 처리)
 * 개발자 진단과 안정성을 위한 단일 진입점
 * 감정 표현 기능 포함
 */

import { updateTtsStatus, recordTtsError, recordTtsAction, getTtsStatus } from './ttsDiagnostics';
import { classifyEmotion, type CardType, type Emotion } from './emotionClassifier';
import { getEmotionProfile, logEmotionProfile } from './emotionProfiles';
import { applyBreathing } from './applyBreathing';

// 개발 모드 체크
const IS_DEV = process.env.NODE_ENV !== 'production';

// Android WebView 감지
function isAndroidWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('android') && (ua.includes('wv') || ua.includes('webview'));
}

// TTS 에러 타입 (사용자 안내용)
export type TtsErrorType = 
  | 'not-supported'     // speechSynthesis 미지원
  | 'no-voices'         // 음성 목록 없음
  | 'webview-limit'     // WebView 제한
  | 'generic'           // 일반 에러
  | null;               // 성공

export interface TtsResult {
  success: boolean;
  errorType: TtsErrorType;
  errorMessage?: string;
}

/**
 * 텍스트를 음성으로 읽기 (감정 표현 포함)
 * @param text 읽을 텍스트
 * @param lang 언어 ('kr' 또는 'en')
 * @param cardType 카드 타입 (선택, 감정 분류에 사용)
 * @returns TTS 실행 결과 (success, errorType, errorMessage)
 */
export async function speakText(
  text: string,
  lang: 'kr' | 'en',
  cardType?: CardType
): Promise<TtsResult> {
  console.log(`[speakText] 🎯 Starting TTS (lang: ${lang}, textLen: ${text.length}, cardType: ${cardType || 'none'})`);
  
  // === 1. 진단: 브라우저 지원 체크 ===
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error('[speakText] ❌ speechSynthesis NOT supported');
    recordTtsError('not-supported', 'Speech synthesis not supported in this browser');
    updateTtsStatus({ supported: false });
    return {
      success: false,
      errorType: 'not-supported',
      errorMessage: 'Speech synthesis API not available',
    };
  }

  const synth = window.speechSynthesis;
  updateTtsStatus({ supported: true });

  // === 2. 진단: Android WebView 감지 ===
  const isWebView = isAndroidWebView();
  if (isWebView) {
    console.warn('[speakText] ⚠️ Android WebView detected - TTS may be limited');
  }

  // === 3. 감정 분류 ===
  const emotion: Emotion = classifyEmotion(text, cardType);
  console.log(`[speakText] 💭 Detected emotion: ${emotion}`);

  // === 4. 감정 프로필 가져오기 ===
  const profile = getEmotionProfile(emotion);
  logEmotionProfile(emotion);

  // === 5. 문장 호흡 적용 ===
  const breathedText = applyBreathing(text, profile.pauseStyle);
  console.log(`[speakText] 🫁 Applied breathing (${profile.pauseStyle})`);

  try {
    // === 6. 상태 업데이트 (시작) ===
    updateTtsStatus({
      speaking: true,
      pending: false,
      lastSpokenTextLen: text.length,
      lastSpokenLang: lang,
      currentEmotion: emotion,
    });
    recordTtsAction('speak', {
      lastSpokenTextLen: text.length,
      lastSpokenLang: lang,
      currentEmotion: emotion,
    });

    // === 7. 기존 재생 취소 ===
    if (synth.speaking || synth.pending) {
      console.log('[speakText] 🛑 Canceling previous speech');
      synth.cancel();
      recordTtsAction('cancel');
    }

    // === 8. 안정화 지연 (개발: 100ms, 프로덕션: 50ms) ===
    const delayMs = IS_DEV ? 100 : 50;
    console.log(`[speakText] ⏱️ Waiting ${delayMs}ms for stabilization...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // === 9. 진단: voices 준비 확인 (최대 5회 재시도) ===
    let voices = synth.getVoices();
    let retries = 0;
    const maxRetries = 5;

    console.log(`[speakText] 🔍 Initial voices: ${voices.length}`);

    while (voices.length === 0 && retries < maxRetries) {
      console.log(`[speakText] ⏳ Voices not loaded, retrying... (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 100));
      voices = synth.getVoices();
      retries++;
    }

    // voices 상태 업데이트
    updateTtsStatus({
      voicesLoaded: voices.length > 0,
      voicesCount: voices.length,
    });

    // === 10. 진단: voices 없음 에러 ===
    if (voices.length === 0) {
      console.error(`[speakText] ❌ No voices available after ${maxRetries} retries`);
      console.error('[speakText] 📊 Diagnostics:', {
        userAgent: navigator.userAgent,
        isWebView,
        voicesCount: voices.length,
        speaking: synth.speaking,
        pending: synth.pending,
      });
      
      recordTtsError('no-voices', 'No voices available after retries');
      updateTtsStatus({ speaking: false });
      
      return {
        success: false,
        errorType: isWebView ? 'webview-limit' : 'no-voices',
        errorMessage: `No voices available (WebView: ${isWebView})`,
      };
    }

    console.log(`[speakText] ✅ ${voices.length} voices available`);

    // === 11. 언어에 맞는 음성 선택 ===
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

    console.log(`[speakText] 🔊 Selected voice: ${selectedVoice?.name} (${selectedVoice?.lang})`);

    // === 12. SpeechSynthesisUtterance 생성 (감정 프로필 적용) ===
    const utterance = new SpeechSynthesisUtterance(breathedText);
    utterance.lang = lang === 'kr' ? 'ko-KR' : 'en-US';
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = profile.volume;

    console.log(`[speakText] ⚙️ Utterance settings:`, {
      rate: profile.rate,
      pitch: profile.pitch,
      volume: profile.volume,
      emotion: emotion,
      textLength: breathedText.length,
    });

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // === 13. 이벤트 핸들러 설정 ===
    return new Promise<TtsResult>((resolve) => {
      let resolved = false; // 중복 resolve 방지

      utterance.onstart = () => {
        console.log('[speakText] ▶️ Started playing');
        recordTtsAction('speak');
      };

      utterance.onend = () => {
        console.log('[speakText] ✅ Finished playing');
        updateTtsStatus({
          speaking: false,
          pending: false,
        });
        recordTtsAction('end');
        
        if (!resolved) {
          resolved = true;
          resolve({ success: true, errorType: null });
        }
      };

      utterance.onerror = (event: any) => {
        console.error('[speakText] ❌ Error event:', event.error);
        console.error('[speakText] 📊 Error diagnostics:', {
          error: event.error,
          message: event.message,
          userAgent: navigator.userAgent,
          voicesCount: voices.length,
          selectedVoice: selectedVoice?.name,
          isWebView,
        });
        
        updateTtsStatus({
          speaking: false,
          pending: false,
        });
        recordTtsError(event.error || 'unknown', event.message || 'Speech error');
        
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            errorType: 'generic',
            errorMessage: `Speech error: ${event.error}`,
          });
        }
      };

      // === 14. speechSynthesis.speak() 실행 ===
      try {
        synth.speak(utterance);
        console.log('[speakText] 🚀 speak() called successfully');
      } catch (error) {
        console.error('[speakText] ❌ Failed to call speak():', error);
        console.error('[speakText] 📊 Exception diagnostics:', {
          error,
          userAgent: navigator.userAgent,
          voicesCount: voices.length,
          isWebView,
        });
        
        updateTtsStatus({
          speaking: false,
          pending: false,
        });
        recordTtsError('speak-failed', error instanceof Error ? error.message : 'Unknown error');
        
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            errorType: 'generic',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 타임아웃 (30초 후 자동 실패 처리)
      setTimeout(() => {
        if (!resolved) {
          console.error('[speakText] ⏱️ Timeout: No onstart/onend/onerror fired');
          resolved = true;
          updateTtsStatus({ speaking: false, pending: false });
          recordTtsError('timeout', 'TTS did not respond within 30s');
          resolve({
            success: false,
            errorType: 'generic',
            errorMessage: 'TTS timeout',
          });
        }
      }, 30000);
    });

  } catch (error) {
    console.error('[speakText] ❌ Exception in outer try:', error);
    console.error('[speakText] 📊 Exception diagnostics:', {
      error,
      userAgent: navigator.userAgent,
      isWebView,
    });
    
    updateTtsStatus({
      speaking: false,
      pending: false,
    });
    recordTtsError('exception', error instanceof Error ? error.message : 'Unknown exception');
    
    return {
      success: false,
      errorType: 'generic',
      errorMessage: error instanceof Error ? error.message : 'Unknown exception',
    };
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
    console.log('[speakText] 🛑 Stopping speech');
    synth.cancel();
    updateTtsStatus({
      speaking: false,
      pending: false,
    });
    recordTtsAction('cancel');
  }
}
