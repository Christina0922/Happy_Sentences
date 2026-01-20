/**
 * TTS (Text-to-Speech) 래퍼
 * Web Speech API를 사용한 무료 기본 낭독 기능
 */

export class TTSPlayer {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPaused = false;
  private queue: string[] = [];
  private isPlaying = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * 브라우저가 TTS를 지원하는지 확인
   */
  isSupported(): boolean {
    return this.synthesis !== null;
  }

  /**
   * 한국어 음성 가져오기
   */
  getKoreanVoice(): SpeechSynthesisVoice | null {
    if (!this.synthesis) return null;

    const voices = this.synthesis.getVoices();
    
    // ko-KR 음성 우선 탐색
    const koreanVoice = voices.find(
      voice => voice.lang.startsWith('ko') || voice.lang === 'ko-KR'
    );

    return koreanVoice || null;
  }

  /**
   * 단일 텍스트 읽기
   */
  speak(
    text: string,
    options: {
      rate?: number; // 0.1 ~ 10, 기본 1.0
      pitch?: number; // 0 ~ 2, 기본 1.0
      volume?: number; // 0 ~ 1, 기본 1.0
      onEnd?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): void {
    if (!this.synthesis) {
      options.onError?.(new Error('TTS를 지원하지 않는 브라우저입니다.'));
      return;
    }

    // 이전 재생 정지
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 한국어 음성 설정
    const koreanVoice = this.getKoreanVoice();
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    // 옵션 설정
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    utterance.lang = 'ko-KR';

    // 이벤트 핸들러
    utterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      this.isPlaying = false;
      this.currentUtterance = null;
      options.onError?.(new Error(event.error));
    };

    this.currentUtterance = utterance;
    this.isPlaying = true;
    this.isPaused = false;
    this.synthesis.speak(utterance);
  }

  /**
   * 일시정지
   */
  pause(): void {
    if (this.synthesis && this.isPlaying && !this.isPaused) {
      this.synthesis.pause();
      this.isPaused = true;
    }
  }

  /**
   * 재개
   */
  resume(): void {
    if (this.synthesis && this.isPlaying && this.isPaused) {
      this.synthesis.resume();
      this.isPaused = false;
    }
  }

  /**
   * 정지
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.queue = [];
    }
  }

  /**
   * 현재 재생 중인지 확인
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 일시정지 상태인지 확인
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * 여러 문장 연속 재생
   * @param texts 텍스트 배열
   * @param pauseBetween 문장 사이 쉬는 시간 (밀리초)
   */
  async speakMultiple(
    texts: string[],
    options: {
      rate?: number;
      pauseBetween?: number; // 기본 800ms
      onProgress?: (index: number, total: number) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<void> {
    if (!this.synthesis) {
      options.onError?.(new Error('TTS를 지원하지 않는 브라우저입니다.'));
      return;
    }

    if (texts.length === 0) {
      options.onComplete?.();
      return;
    }

    this.stop();
    this.queue = [...texts];
    const pauseBetween = options.pauseBetween ?? 800;

    for (let i = 0; i < texts.length; i++) {
      // 중간에 정지되었는지 확인
      if (this.queue.length === 0) {
        break;
      }

      options.onProgress?.(i + 1, texts.length);

      // 문장 읽기
      await new Promise<void>((resolve, reject) => {
        this.speak(texts[i], {
          rate: options.rate,
          onEnd: () => resolve(),
          onError: (error) => {
            options.onError?.(error);
            reject(error);
          },
        });
      });

      // 마지막 문장이 아니면 쉬기
      if (i < texts.length - 1 && this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, pauseBetween));
      }
    }

    this.queue = [];
    options.onComplete?.();
  }
}

// 싱글톤 인스턴스
let ttsInstance: TTSPlayer | null = null;

/**
 * TTS 플레이어 인스턴스 가져오기 (싱글톤)
 */
export function getTTSPlayer(): TTSPlayer {
  if (!ttsInstance) {
    ttsInstance = new TTSPlayer();
  }
  return ttsInstance;
}

