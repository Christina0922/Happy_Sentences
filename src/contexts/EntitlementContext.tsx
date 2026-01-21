'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EntitlementType, UserEntitlement, TtsPermission } from '@/src/types/entitlement';
import { DEV_BYPASS } from '@/src/config/env';

interface EntitlementContextType {
  entitlement: UserEntitlement;
  checkPremiumTtsPermission: () => TtsPermission;
  consumeCredit: () => boolean;
  consumeAdPass: () => boolean;
  addCredits: (amount: number) => void;
  grantAdPass: (durationMs: number) => void;
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(undefined);

const STORAGE_KEY = 'user_entitlement';

/**
 * 권한 관리 Provider
 * localStorage에 권한 상태를 저장하고 관리
 */
export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [entitlement, setEntitlement] = useState<UserEntitlement>({
    type: 'FREE',
    credits: 0,
  });

  // 초기 권한 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEntitlement(parsed);
      } catch (error) {
        console.error('Failed to parse entitlement:', error);
      }
    }
  }, []);

  // 권한 변경 시 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entitlement));
  }, [entitlement]);

  /**
   * Premium TTS 사용 권한 체크
   */
  const checkPremiumTtsPermission = (): TtsPermission => {
    // 개발자 우회 (최우선)
    if (DEV_BYPASS) {
      return {
        allowed: true,
        reason: 'dev_bypass',
      };
    }

    // 구독자
    if (entitlement.type === 'SUBSCRIBED') {
      // 구독 만료 체크
      if (entitlement.subscriptionExpiry && entitlement.subscriptionExpiry < Date.now()) {
        return {
          allowed: false,
          reason: 'expired',
          requiresAction: 'subscribe',
        };
      }
      return { allowed: true };
    }

    // 크레딧 보유
    if (entitlement.credits && entitlement.credits > 0) {
      return { allowed: true };
    }

    // 광고 1회권
    if (entitlement.adPassExpiry && entitlement.adPassExpiry > Date.now()) {
      return { allowed: true };
    }

    // 권한 없음
    return {
      allowed: false,
      reason: 'no_permission',
      requiresAction: 'watch_ad', // 기본적으로 광고 시청 유도
    };
  };

  /**
   * 크레딧 1개 소비
   */
  const consumeCredit = (): boolean => {
    if (!entitlement.credits || entitlement.credits <= 0) {
      return false;
    }

    setEntitlement(prev => ({
      ...prev,
      credits: (prev.credits || 0) - 1,
    }));

    return true;
  };

  /**
   * 광고 1회권 소비
   */
  const consumeAdPass = (): boolean => {
    if (!entitlement.adPassExpiry || entitlement.adPassExpiry < Date.now()) {
      return false;
    }

    setEntitlement(prev => ({
      ...prev,
      adPassExpiry: undefined,
    }));

    return true;
  };

  /**
   * 크레딧 추가 (구매/보상)
   */
  const addCredits = (amount: number) => {
    setEntitlement(prev => ({
      ...prev,
      credits: (prev.credits || 0) + amount,
    }));
  };

  /**
   * 광고 시청 후 1회권 부여
   */
  const grantAdPass = (durationMs: number = 30 * 60 * 1000) => {
    setEntitlement(prev => ({
      ...prev,
      adPassExpiry: Date.now() + durationMs,
    }));
  };

  return (
    <EntitlementContext.Provider
      value={{
        entitlement,
        checkPremiumTtsPermission,
        consumeCredit,
        consumeAdPass,
        addCredits,
        grantAdPass,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

/**
 * 권한 관리 Hook
 */
export function useEntitlement() {
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    throw new Error('useEntitlement must be used within EntitlementProvider');
  }
  return context;
}

