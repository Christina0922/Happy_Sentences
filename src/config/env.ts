/**
 * 환경 설정
 * 프로덕션 vs 개발 환경을 구분하고 DEV_BYPASS 활성화 여부를 결정
 */

export const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * DEV_BYPASS: 개발자가 개발 중에 Premium TTS를 무료로 테스트할 수 있는 우회 스위치
 * 
 * 활성화 조건:
 * 1. 개발 환경(NODE_ENV !== "production")
 * 2. NEXT_PUBLIC_DEV_BYPASS=true
 * 
 * 프로덕션에서는 절대 활성화되지 않음
 */
export const DEV_BYPASS = 
  IS_DEV && 
  process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

/**
 * 서버 측 DEV_BYPASS 검증
 * 프로덕션 환경에서는 무조건 false 반환
 */
export function isDevBypassAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
}

/**
 * API 요청에 DEV_BYPASS 헤더 추가 (클라이언트)
 */
export function getDevBypassHeaders(): Record<string, string> {
  if (!DEV_BYPASS) return {};
  return {
    'X-Dev-Bypass': 'true',
  };
}

