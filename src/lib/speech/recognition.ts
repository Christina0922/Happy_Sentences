/**
 * 음성 인식 (Speech Recognition)
 * Web Speech API 기반 음성 → 텍스트 변환
 * 무료/로컬 기능 (브라우저 내장)
 */

import { Language } from '@/src/i18n/translations';

export type RecognitionState = 'idle' | 'listening' | 'processing' | 'error';

export interface RecognitionOptions {
  continuous?: boolean;       // 연속 인식 여부 (기본: false)
  interimResults?: boolean;   // 중간 결과 표시 여부 (기본: true)
  maxAlternatives?: number;   // 대안 개수 (기본: 1)
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: RecognitionError) => void;
}

export interface RecognitionError {
  code: string;
  message: string;
  userMessage: string;
}

// Web Speech API 타입 확장
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

class SpeechRecognitionPlayer {
  private recognition: any = null;
  private isAvailableFlag: boolean = false;
  private currentState: RecognitionState = 'idle';
  private currentOptions: RecognitionOptions | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.isAvailableFlag = true;
        console.log('[Speech Recognition] ✅ Available');
      } else {
        console.warn('[Speech Recognition] ❌ Not supported in this browser');
      }
    }
  }

  /**
   * 브라우저 지원 여부 확인
   */
  isAvailable(): boolean {
    return this.isAvailableFlag;
  }

  /**
   * 현재 상태 반환
   */
  getState(): RecognitionState {
    return this.currentState;
  }

  /**
   * 음성 인식 시작
   */
  start(lang: Language, options: RecognitionOptions = {}): void {
    if (!this.isAvailable()) {
      const error: RecognitionError = {
        code: 'not-supported',
        message: 'Speech recognition not supported',
        userMessage: '이 브라우저는 음성 인식을 지원하지 않습니다.',
      };
      console.error('[Speech Recognition] ❌', error.message);
      options.onError?.(error);
      return;
    }

    // 이미 듣는 중이면 중지
    if (this.currentState === 'listening' || this.currentState === 'processing') {
      console.log('[Speech Recognition] Already listening, stopping first');
      this.stop();
      return;
    }

    this.currentOptions = options;

    // 언어 설정
    const langCode = lang === 'kr' ? 'ko-KR' : 'en-US';
    this.recognition.lang = langCode;
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;

    console.log(`[Speech Recognition] Starting recognition (lang: ${langCode})`);

    // 이벤트 핸들러 설정
    this.recognition.onstart = () => {
      this.currentState = 'listening';
      console.log('[Speech Recognition] ✅ Started listening');
      options.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('[Speech Recognition] Result received');
      
      let interimTranscript = '';
      let finalTranscript = '';

      // 모든 결과 처리
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          console.log(`[Speech Recognition] Final: "${transcript}" (confidence: ${result[0].confidence})`);
        } else {
          interimTranscript += transcript;
          console.log(`[Speech Recognition] Interim: "${transcript}"`);
        }
      }

      // 콜백 호출
      if (finalTranscript) {
        this.currentState = 'processing';
        options.onResult?.(finalTranscript, true);
      } else if (interimTranscript) {
        options.onResult?.(interimTranscript, false);
      }
    };

    this.recognition.onend = () => {
      console.log('[Speech Recognition] ✅ Ended');
      this.currentState = 'idle';
      options.onEnd?.();
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Speech Recognition] ❌ Error:', event.error);
      this.currentState = 'error';

      const error = this.parseError(event.error, event.message);
      options.onError?.(error);

      // 에러 후 자동으로 idle 상태로 복귀
      setTimeout(() => {
        if (this.currentState === 'error') {
          this.currentState = 'idle';
        }
      }, 1000);
    };

    // 음성 인식 시작
    try {
      this.currentState = 'listening';
      this.recognition.start();
    } catch (error) {
      console.error('[Speech Recognition] ❌ Failed to start:', error);
      this.currentState = 'error';
      
      const recognitionError: RecognitionError = {
        code: 'start-failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        userMessage: '음성 인식을 시작할 수 없습니다. 다시 시도해주세요.',
      };
      
      options.onError?.(recognitionError);
      
      setTimeout(() => {
        this.currentState = 'idle';
      }, 1000);
    }
  }

  /**
   * 음성 인식 중지
   */
  stop(): void {
    if (!this.recognition) return;

    if (this.currentState === 'listening' || this.currentState === 'processing') {
      console.log('[Speech Recognition] Stopping...');
      this.recognition.stop();
      this.currentState = 'idle';
    }
  }

  /**
   * 음성 인식 강제 중단
   */
  abort(): void {
    if (!this.recognition) return;

    if (this.currentState === 'listening' || this.currentState === 'processing') {
      console.log('[Speech Recognition] Aborting...');
      this.recognition.abort();
      this.currentState = 'idle';
    }
  }

  /**
   * 에러 코드 파싱
   */
  private parseError(errorCode: string, errorMessage?: string): RecognitionError {
    const errorMap: Record<string, { message: string; userMessage: string }> = {
      'no-speech': {
        message: 'No speech detected',
        userMessage: '음성이 감지되지 않았습니다. 다시 시도해주세요.',
      },
      'aborted': {
        message: 'Recognition aborted',
        userMessage: '음성 인식이 취소되었습니다.',
      },
      'audio-capture': {
        message: 'Audio capture failed',
        userMessage: '마이크를 사용할 수 없습니다. 마이크 연결을 확인해주세요.',
      },
      'network': {
        message: 'Network error',
        userMessage: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
      },
      'not-allowed': {
        message: 'Permission denied',
        userMessage: '마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.',
      },
      'service-not-allowed': {
        message: 'Service not allowed',
        userMessage: '음성 인식 서비스를 사용할 수 없습니다.',
      },
      'bad-grammar': {
        message: 'Grammar error',
        userMessage: '음성 인식 설정에 오류가 있습니다.',
      },
      'language-not-supported': {
        message: 'Language not supported',
        userMessage: '선택한 언어는 지원되지 않습니다.',
      },
    };

    const errorInfo = errorMap[errorCode] || {
      message: errorMessage || 'Unknown error',
      userMessage: '음성 인식 중 오류가 발생했습니다. 다시 시도해주세요.',
    };

    return {
      code: errorCode,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
    };
  }

  /**
   * 진단 정보 수집
   */
  getDiagnostics(): {
    isAvailable: boolean;
    currentState: RecognitionState;
    lang: string | null;
    userAgent: string;
  } {
    return {
      isAvailable: this.isAvailableFlag,
      currentState: this.currentState,
      lang: this.recognition?.lang || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
  }
}

// 싱글톤 인스턴스
let recognitionInstance: SpeechRecognitionPlayer | null = null;

export function getSpeechRecognition(): SpeechRecognitionPlayer {
  if (!recognitionInstance) {
    recognitionInstance = new SpeechRecognitionPlayer();
  }
  return recognitionInstance;
}

/**
 * 앱 시작 시 음성 인식 초기화 (선택적)
 */
export function initSpeechRecognition(): void {
  getSpeechRecognition();
  console.log('[Speech Recognition] Initialized');
}

