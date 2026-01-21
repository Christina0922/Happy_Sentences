/**
 * Premium TTS (고급)
 * 서버에서 생성된 고품질 음성(mp3) 재생
 * 권한 필요: 구독/크레딧/광고/DEV_BYPASS
 */

import { Language } from '@/src/i18n/translations';
import { getDevBypassHeaders } from '@/src/config/env';

export interface PremiumTtsOptions {
  voice?: string;        // 음성 선택 (추후 확장)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface PremiumTtsResponse {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
  requiresAction?: 'subscribe' | 'watch_ad' | 'buy_credits';
}

class PremiumTtsPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;

  /**
   * 서버에서 Premium TTS 생성 요청
   */
  private async generateAudio(
    text: string,
    lang: Language,
    voice?: string
  ): Promise<PremiumTtsResponse> {
    try {
      const response = await fetch('/api/tts/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getDevBypassHeaders(),
        },
        body: JSON.stringify({
          text,
          lang,
          voice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to generate audio',
          requiresAction: data.requiresAction,
        };
      }

      return {
        success: true,
        ...data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Premium TTS 재생
   */
  async play(
    text: string,
    lang: Language,
    options: PremiumTtsOptions = {}
  ): Promise<PremiumTtsResponse> {
    if (!text || text.trim().length === 0) {
      const error = new Error('Text is empty');
      console.error('[Premium TTS]', error);
      options.onError?.(error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[Premium TTS] Playing: "${text.substring(0, 50)}..." (${lang})`);

    // 기존 재생 중지
    this.stop();

    // 서버에서 음성 생성
    const result = await this.generateAudio(text, lang, options.voice);

    if (!result.success) {
      console.error('[Premium TTS] Generation failed:', result.error);
      options.onError?.(new Error(result.error || 'Failed to generate audio'));
      return result;
    }

    console.log('[Premium TTS] Audio generated successfully');

    // 오디오 URL 생성
    let audioUrl: string;
    if (result.audioUrl) {
      audioUrl = result.audioUrl;
    } else if (result.audioBase64) {
      audioUrl = `data:audio/mp3;base64,${result.audioBase64}`;
    } else {
      const error = new Error('No audio data received');
      options.onError?.(error);
      return {
        success: false,
        error: error.message,
      };
    }

    // 오디오 재생
    try {
      this.audio = new Audio(audioUrl);
      this.currentUrl = audioUrl;

      this.audio.onloadedmetadata = () => {
        console.log('[Premium TTS] Audio loaded, starting playback');
        options.onStart?.();
      };

      this.audio.ontimeupdate = () => {
        if (this.audio) {
          const progress = (this.audio.currentTime / this.audio.duration) * 100;
          options.onProgress?.(progress);
        }
      };

      this.audio.onended = () => {
        console.log('[Premium TTS] Playback completed');
        this.cleanup();
        options.onEnd?.();
      };

      this.audio.onerror = (error) => {
        console.error('[Premium TTS] Playback error:', error);
        this.cleanup();
        options.onError?.(new Error('Audio playback failed'));
      };

      await this.audio.play();
      console.log('[Premium TTS] Playback started');

      return result;
    } catch (error) {
      console.error('[Premium TTS] Failed to play audio:', error);
      this.cleanup();
      options.onError?.(error instanceof Error ? error : new Error('Playback failed'));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Playback failed',
      };
    }
  }

  /**
   * 재생 중지
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.cleanup();
    }
  }

  /**
   * 일시정지
   */
  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  /**
   * 재생 재개
   */
  resume(): void {
    if (this.audio && this.audio.paused) {
      this.audio.play();
    }
  }

  /**
   * 재생 중인지 확인
   */
  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }

  /**
   * 리소스 정리
   */
  private cleanup(): void {
    if (this.audio) {
      this.audio.onloadedmetadata = null;
      this.audio.ontimeupdate = null;
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio = null;
    }

    if (this.currentUrl && this.currentUrl.startsWith('data:')) {
      // Base64 URL은 메모리에서 해제
      this.currentUrl = null;
    }
  }
}

// 싱글톤 인스턴스
let premiumTtsInstance: PremiumTtsPlayer | null = null;

export function getPremiumTtsPlayer(): PremiumTtsPlayer {
  if (!premiumTtsInstance) {
    premiumTtsInstance = new PremiumTtsPlayer();
  }
  return premiumTtsInstance;
}

