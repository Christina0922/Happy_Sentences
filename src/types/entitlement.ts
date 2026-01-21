/**
 * 사용자 권한 타입 정의
 */

export type EntitlementType = 
  | 'FREE'        // 무료 사용자
  | 'SUBSCRIBED'  // 구독자
  | 'CREDIT'      // 크레딧 보유
  | 'AD_PASS'     // 광고 시청으로 1회권
  | 'DEV_BYPASS'; // 개발자 우회 (개발 환경에서만)

/**
 * 사용자 권한 상태
 */
export interface UserEntitlement {
  type: EntitlementType;
  credits?: number;        // 남은 크레딧
  adPassExpiry?: number;   // 광고 1회권 만료 시간(timestamp)
  subscriptionExpiry?: number; // 구독 만료 시간
}

/**
 * TTS 타입
 */
export type TtsType = 'basic' | 'premium';

/**
 * TTS 권한 체크 결과
 */
export interface TtsPermission {
  allowed: boolean;
  reason?: 'no_permission' | 'no_credits' | 'expired' | 'dev_bypass';
  requiresAction?: 'subscribe' | 'watch_ad' | 'buy_credits';
}

