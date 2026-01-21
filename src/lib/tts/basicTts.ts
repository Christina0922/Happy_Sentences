/**
 * Basic TTS (무료)
 * 브라우저 내장 speechSynthesis API 사용
 * 비용 0원, 즉시 재생
 * 
 * iOS Safari 대응:
 * - 사용자 제스처 동기 흐름에서 speak 호출 필수
 * - voices 로딩 재시도 로직 포함
 */

import { Language } from '@/src/i18n/translations';

export interface BasicTtsOptions {
  rate?: number;    // 속도 (0.1 ~ 10, 기본: 0.95)
  pitch?: number;   // 음높이 (0 ~ 2, 기본: 1.0)
  volume?: number;  // 음량 (0 ~ 1, 기본: 1.0)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface DiagnosticInfo {
  userAgent: string;
  voicesCount: number;
  isSpeaking: boolean;
  isPending: boolean;
  selectedVoice: string | null;
  textLength: number;
  timestamp: string;
}

class BasicTtsPlayer {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoadPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      
      // 음성 목록 프리로드
      this.preloadVoices();
      
      // 음성 목록 변경 이벤트 리스닝
      if (this.synth) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  /**
   * 음성 목록 프리로드 (앱 시작 시)
   */
  private preloadVoices(): void {
    if (!this.voicesLoadPromise) {
      this.voicesLoadPromise = this.waitForVoices();
    }
  }

  /**
   * 음성 목록이 준비될 때까지 대기
   */
  private async waitForVoices(maxRetries: number = 5): Promise<void> {
    if (!this.synth) return;

    for (let i = 0; i < maxRetries; i++) {
      this.voices = this.synth.getVoices();
      
      if (this.voices.length > 0) {
        this.voicesLoaded = true;
        console.log(`[Basic TTS] Loaded ${this.voices.length} voices (attempt ${i + 1})`);
        return;
      }

      // 100ms 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.warn(`[Basic TTS] No voices loaded after ${maxRetries} attempts`);
  }

  /**
   * 음성 목록 로드
   */
  private loadVoices(): void {
    if (!this.synth) return;
    
    this.voices = this.synth.getVoices();
    this.voicesLoaded = this.voices.length > 0;
    
    if (this.voicesLoaded) {
      console.log(`[Basic TTS] Loaded ${this.voices.length} voices`);
    }
  }

  /**
   * 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return this.synth !== null && 'speechSynthesis' in window;
  }

  /**
   * 텍스트 정리 (공백, 줄바꿈 정규화)
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // 연속 공백 축소
      .replace(/\n+/g, '. ') // 줄바꿈을 마침표로
      .trim();
  }

  /**
   * 진단 정보 수집
   */
  private collectDiagnostics(
    text: string,
    voice: SpeechSynthesisVoice | null
  ): DiagnosticInfo {
    return {
      userAgent: navigator.userAgent,
      voicesCount: this.voices.length,
      isSpeaking: this.synth?.speaking ?? false,
      isPending: this.synth?.pending ?? false,
      selectedVoice: voice ? `${voice.name} (${voice.lang})` : null,
      textLength: text.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 언어에 맞는 음성 선택
   */
  private async selectVoice(lang: Language): Promise<SpeechSynthesisVoice | null> {
    if (!this.synth) return null;

    // 음성 목록이 비어있으면 대기
    if (this.voices.length === 0) {
      console.log('[Basic TTS] Waiting for voices to load...');
      await this.waitForVoices(3); // 최대 3회 재시도
    }

    if (this.voices.length === 0) {
      console.error('[Basic TTS] No voices available after retries');
      return null;
    }

    // 언어 코드 매핑
    const langCode = lang === 'kr' ? 'ko' : 'en';

    // 1순위: 정확한 언어 매치 + localService (기기 내장)
    const localMatch = this.voices.find(voice => 
      voice.lang.startsWith(langCode) && voice.localService
    );
    if (localMatch) {
      console.log(`[Basic TTS] Selected local voice: ${localMatch.name} (${localMatch.lang})`);
      return localMatch;
    }

    // 2순위: 정확한 언어 매치
    const exactMatch = this.voices.find(voice => 
      voice.lang.startsWith(langCode)
    );
    if (exactMatch) {
      console.log(`[Basic TTS] Selected voice: ${exactMatch.name} (${exactMatch.lang})`);
      return exactMatch;
    }

    // 3순위: 기본 음성
    console.log(`[Basic TTS] Using default voice: ${this.voices[0].name}`);
    return this.voices[0];
  }

  /**
   * 텍스트 읽기 (동기 실행 - iOS Safari 대응)
   */
  async speak(
    text: string,
    lang: Language,
    options: BasicTtsOptions = {}
  ): Promise<void> {
    if (!this.isAvailable()) {
      const error = new Error('Speech synthesis not available');
      console.error('[Basic TTS]', error);
      options.onError?.(error);
      return;
    }

    if (!text || text.trim().length === 0) {
      const error = new Error('Text is empty');
      console.error('[Basic TTS]', error);
      options.onError?.(error);
      return;
    }

    // 텍스트 정리
    const cleanedText = this.cleanText(text);
    console.log(`[Basic TTS] Speaking: "${cleanedText.substring(0, 50)}..." (${lang})`);

    // 기존 재생 강제 중지 (iOS Safari 안정성)
    if (this.synth!.speaking || this.synth!.pending) {
      console.log('[Basic TTS] Canceling previous speech');
      this.synth!.cancel();
      // 짧은 대기로 cancel이 완료되도록
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    try {
      // 음성 선택 (비동기로 voices 대기)
      const voice = await this.selectVoice(lang);
      
      // 진단 정보 수집
      const diagnostics = this.collectDiagnostics(cleanedText, voice);
      console.log('[Basic TTS] Diagnostics:', diagnostics);

      // 음성이 없으면 에러
      if (this.voices.length === 0) {
        throw new Error('No voices available. Please check browser TTS support.');
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      // 음성 설정
      if (voice) {
        utterance.voice = voice;
      }

      // 옵션 설정
      utterance.rate = options.rate ?? 0.95;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;
      utterance.lang = lang === 'kr' ? 'ko-KR' : 'en-US';

      // 이벤트 핸들러
      utterance.onstart = () => {
        console.log('[Basic TTS] ✅ Started playing');
        options.onStart?.();
      };

      utterance.onend = () => {
        console.log('[Basic TTS] ✅ Finished playing');
        this.currentUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (event) => {
        console.error('[Basic TTS] ❌ Error:', event.error);
        console.error('[Basic TTS] Error diagnostics:', diagnostics);
        this.currentUtterance = null;
        options.onError?.(new Error(`Speech error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      
      // iOS Safari: 동기 흐름에서 speak 호출 (필수!)
      this.synth!.speak(utterance);
      
    } catch (error) {
      console.error('[Basic TTS] ❌ Failed to speak:', error);
      this.currentUtterance = null;
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * 재생 중지
   */
  stop(): void {
    if (this.synth) {
      console.log('[Basic TTS] Stopping speech');
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * 재생 일시정지
   */
  pause(): void {
    if (this.synth && this.synth.speaking) {
      console.log('[Basic TTS] Pausing speech');
      this.synth.pause();
    }
  }

  /**
   * 재생 재개
   */
  resume(): void {
    if (this.synth && this.synth.paused) {
      console.log('[Basic TTS] Resuming speech');
      this.synth.resume();
    }
  }

  /**
   * 재생 중인지 확인
   */
  isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }

  /**
   * 대기 중인지 확인
   */
  isPending(): boolean {
    return this.synth?.pending ?? false;
  }

  /**
   * 음성 목록 가져오기
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
}

// 싱글톤 인스턴스
let basicTtsInstance: BasicTtsPlayer | null = null;

export function getBasicTtsPlayer(): BasicTtsPlayer {
  if (!basicTtsInstance) {
    basicTtsInstance = new BasicTtsPlayer();
  }
  return basicTtsInstance;
}

/**
 * 앱 시작 시 TTS 초기화 (선택적)
 */
export function initBasicTts(): void {
  const player = getBasicTtsPlayer();
  console.log('[Basic TTS] Initialized');
  
  // 진단 상태 업데이트 (개발 모드)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    import('./ttsDiagnostics').then(({ updateTtsStatus, recordTtsAction }) => {
      const voices = player.getVoices();
      updateTtsStatus({
        supported: player.isAvailable(),
        voicesLoaded: voices.length > 0,
        voicesCount: voices.length,
        speaking: false,
        pending: false,
      });
      recordTtsAction('preload', {
        voicesLoaded: voices.length > 0,
        voicesCount: voices.length,
      });
      
      console.log(`[Basic TTS] Diagnostic status updated: ${voices.length} voices`);
    }).catch(err => {
      console.warn('[Basic TTS] Failed to update diagnostics:', err);
    });
  }
}

