'use client';

import { useState } from 'react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useEntitlement } from '@/src/contexts/EntitlementContext';
import { DEV_BYPASS } from '@/src/config/env';

interface TtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBasic: () => void;
  onSelectPremium: () => void;
}

export default function TtsModal({
  isOpen,
  onClose,
  onSelectBasic,
  onSelectPremium,
}: TtsModalProps) {
  const { t } = useLanguage();
  const { entitlement, checkPremiumTtsPermission, grantAdPass } = useEntitlement();
  const [showPaywall, setShowPaywall] = useState(false);

  if (!isOpen) return null;

  const permission = checkPremiumTtsPermission();
  const isPremiumAllowed = permission.allowed;

  const handlePremiumClick = async () => {
    if (isPremiumAllowed) {
      // iOS Safari: 모달을 닫기 전에 콜백 실행 (동기 흐름 유지)
      console.log('[TTS Modal] Premium selected');
      onClose(); // 모달을 먼저 닫음
      onSelectPremium(); // 그 다음 TTS 시작
    } else {
      setShowPaywall(true);
    }
  };

  const handleBasicClick = () => {
    // iOS Safari: 모달을 닫기 전에 콜백 실행 (동기 흐름 유지)
    console.log('[TTS Modal] Basic selected');
    onClose(); // 모달을 먼저 닫음
    onSelectBasic(); // 그 다음 TTS 시작 (동기 흐름 유지)
  };

  const handleWatchAd = () => {
    // 실제로는 광고 SDK 호출
    // 광고 시청 완료 후 콜백으로 권한 부여
    console.log('[TTS Modal] Simulating ad watch...');
    
    // 시뮬레이션: 2초 후 광고 시청 완료
    setTimeout(() => {
      grantAdPass(30 * 60 * 1000); // 30분 1회권 부여
      alert(t.adPassGranted || '광고 시청 완료! 30분간 고급 음성을 사용할 수 있습니다.');
      setShowPaywall(false);
      // iOS Safari: 광고 시청 후에도 동기 흐름 유지
      onSelectPremium();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {!showPaywall ? (
          <>
            {/* 헤더 */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t.ttsModalTitle}
              </h2>
            </div>

            {/* 옵션 */}
            <div className="space-y-3">
              {/* Basic TTS (무료) */}
              <button
                onClick={handleBasicClick}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-900">
                        {t.ttsBasicTitle}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t.ttsBasicDesc}
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Premium TTS (고급) */}
              <button
                onClick={handlePremiumClick}
                className={`w-full p-4 text-left border-2 rounded-xl transition-all relative
                           ${isPremiumAllowed 
                             ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-300' 
                             : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                           }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-900">
                        {t.ttsPremiumTitle}
                      </span>
                      {!isPremiumAllowed && (
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {isPremiumAllowed ? t.ttsPremiumDesc : t.ttsPremiumLockedDesc}
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

          </>
        ) : (
          <>
            {/* Paywall */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t.ttsPremiumTitle}
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                {t.ttsPremiumLockedDesc}
              </p>
            </div>

            <div className="space-y-3">
              {/* 광고 시청 (1회권) */}
              <button
                onClick={handleWatchAd}
                className="w-full p-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all"
              >
                📺 {t.ttsWatchAd}
              </button>

              {/* 구독/결제 */}
              <button
                onClick={() => alert('Coming soon!')}
                className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                ⭐ {t.ttsSubscribe}
              </button>

              {/* 닫기 */}
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t.ttsClose}
              </button>
            </div>
          </>
        )}

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

