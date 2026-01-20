/**
 * 공유 기능 유틸리티
 * Web Share API 우선, 지원하지 않으면 클립보드 복사
 */

export interface ShareOptions {
  text: string;
  title?: string;
}

/**
 * Web Share API 지원 여부 확인
 */
export function isShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * 클립보드 복사 지원 여부 확인
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'clipboard' in navigator &&
    'writeText' in navigator.clipboard
  );
}

/**
 * 문장 공유하기
 * Web Share API를 우선 사용하고, 지원하지 않으면 클립보드 복사
 */
export async function shareSentence(
  options: ShareOptions
): Promise<{ success: boolean; message: string; method: 'share' | 'clipboard' | 'none' }> {
  const { text, title = 'Happy Sentences' } = options;

  // Web Share API 시도
  if (isShareSupported()) {
    try {
      await navigator.share({
        title,
        text,
      });
      return {
        success: true,
        message: '공유했어요.',
        method: 'share',
      };
    } catch (error) {
      // 사용자가 취소한 경우는 에러로 처리하지 않음
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: '공유를 취소했어요.',
          method: 'share',
        };
      }
      // Web Share API 실패 시 클립보드로 fallback
      console.warn('Web Share API 실패, 클립보드로 시도:', error);
    }
  }

  // 클립보드 복사 시도
  if (isClipboardSupported()) {
    try {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        message: '클립보드에 복사했어요.',
        method: 'clipboard',
      };
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      return {
        success: false,
        message: '복사에 실패했어요.',
        method: 'clipboard',
      };
    }
  }

  // 둘 다 지원하지 않는 경우
  return {
    success: false,
    message: '공유 기능을 지원하지 않는 브라우저입니다.',
    method: 'none',
  };
}

/**
 * 클립보드에 텍스트 복사 (강제)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isClipboardSupported()) {
    // Fallback: 임시 textarea 생성
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (error) {
      console.error('Fallback 복사 실패:', error);
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    return false;
  }
}

