'use client';

import { GenerateResponse } from '@/lib/schema';
import { getTTSPlayer } from '@/lib/tts';
import { shareSentence } from '@/lib/share';
import { saveSentence, getTodaySentence, replaceTodaySentence } from '@/lib/storage';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { getBasicTtsPlayer } from '@/src/lib/tts/basicTts';
import { getPremiumTtsPlayer } from '@/src/lib/tts/premiumTts';
import TtsModal from '@/components/TtsModal';
import { useState } from 'react';
import type { CardType } from '@/src/lib/tts/emotionClassifier';

interface ResultCardsProps {
  result: GenerateResponse;
  onSaveSuccess?: () => void;
}

type Variant = 'gentle' | 'clear' | 'brave';

// Variant를 CardType으로 매핑
const VARIANT_TO_CARD_TYPE: Record<Variant, CardType> = {
  gentle: 'KIND',      // 다정한 한 줄
  clear: 'REAL',       // 현실 정리 한 줄
  brave: 'COURAGE',    // 용기 한 줄
};

const VARIANT_COLORS: Record<
  Variant,
  { bgColor: string; borderColor: string; textColor: string; emoji: string }
> = {
  gentle: {
    bgColor: 'bg-rose-50/50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    emoji: '💕',
  },
  clear: {
    bgColor: 'bg-blue-50/50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    emoji: '✨',
  },
  brave: {
    bgColor: 'bg-green-50/50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    emoji: '🌟',
  },
};

export default function ResultCards({ result, onSaveSuccess }: ResultCardsProps) {
  const { t, language } = useLanguage();
  const [playingVariant, setPlayingVariant] = useState<Variant | null>(null);
  const [savingVariant, setSavingVariant] = useState<Variant | null>(null); // 🆕 저장 중 상태
  const [message, setMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false); // 🆕 저장 성공 상태
  const [showTtsModal, setShowTtsModal] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const tts = getTTSPlayer();
  const basicTts = getBasicTtsPlayer();
  const premiumTts = getPremiumTtsPlayer();

  const getVariantLabel = (variant: Variant) => {
    switch (variant) {
      case 'gentle':
        return t.variantGentle;
      case 'clear':
        return t.variantClear;
      case 'brave':
        return t.variantBrave;
    }
  };

  const handleRead = (variant: Variant, text: string) => {
    if (playingVariant === variant) {
      // 같은 카드를 누르면 정지
      console.log('[ResultCards] Stopping TTS');
      tts.stop();
      basicTts.stop();
      premiumTts.stop();
      setPlayingVariant(null);
    } else {
      // 기존 재생 중지
      if (playingVariant) {
        console.log('[ResultCards] Stopping previous TTS');
        tts.stop();
        basicTts.stop();
        premiumTts.stop();
      }
      
      // TTS 모달 열기
      setSelectedText(text);
      setSelectedVariant(variant);
      setShowTtsModal(true);
    }
  };

  const handleBasicTts = async () => {
    // 로컬 변수에 저장 (모달 닫힐 때 상태 변경 방지)
    const textToSpeak = selectedText;
    const variantToPlay = selectedVariant;
    
    console.log('[ResultCards] handleBasicTts called', { textToSpeak, variantToPlay, language });
    
    if (!textToSpeak || !variantToPlay) {
      console.error('[ResultCards] ❌ No text or variant selected');
      showMessage(t.readFailed);
      return;
    }
    
    // Variant를 CardType으로 변환
    const cardType = VARIANT_TO_CARD_TYPE[variantToPlay];
    console.log('[ResultCards] Card type for TTS:', cardType);
    
    // iOS Safari: 클릭 이벤트 동기 흐름에서 즉시 실행
    setPlayingVariant(variantToPlay);
    console.log('[ResultCards] Playing variant set:', variantToPlay);
    
    try {
      // 강화된 진단 기능이 있는 speakText 사용 (개발/프로덕션 모두)
      const { speakText } = await import('@/src/lib/tts/speakText');
      const result = await speakText(textToSpeak, language, cardType);
      
      if (!result.success) {
        // 에러 타입에 따라 적절한 메시지 표시
        let errorMessage = t.ttsGenericError;
        
        switch (result.errorType) {
          case 'not-supported':
            errorMessage = t.ttsNotSupported;
            break;
          case 'no-voices':
            errorMessage = t.ttsNoVoices;
            break;
          case 'webview-limit':
            errorMessage = t.ttsWebViewLimit;
            break;
          case 'generic':
          default:
            errorMessage = t.ttsGenericError;
            break;
        }
        
        showMessage(errorMessage);
        console.error('[ResultCards] ❌ TTS failed:', {
          errorType: result.errorType,
          errorMessage: result.errorMessage,
        });
      }
      
      setPlayingVariant(null);
    } catch (error) {
      console.error('[ResultCards] ❌ speakText exception:', error);
      setPlayingVariant(null);
      showMessage(t.ttsGenericError);
    }
  };

  const handlePremiumTts = async () => {
    // 로컬 변수에 저장 (모달 닫힐 때 상태 변경 방지)
    const textToSpeak = selectedText;
    const variantToPlay = selectedVariant;
    
    console.log('[ResultCards] handlePremiumTts called', { textToSpeak, variantToPlay, language });
    
    if (!textToSpeak || !variantToPlay) {
      console.error('[ResultCards] ❌ No text or variant selected');
      showMessage(t.readFailed);
      return;
    }
    
    // iOS Safari: 클릭 이벤트 동기 흐름에서 즉시 실행
    setPlayingVariant(variantToPlay);
    console.log('[ResultCards] Playing variant set:', variantToPlay);
    
    try {
      await premiumTts.play(textToSpeak, language, {
        onStart: () => {
          console.log('[ResultCards] ✅ Premium TTS started successfully');
        },
        onEnd: () => {
          console.log('[ResultCards] ✅ Premium TTS ended successfully');
          setPlayingVariant(null);
        },
        onError: (error) => {
          console.error('[ResultCards] ❌ Premium TTS onError:', error);
          setPlayingVariant(null);
          showMessage(t.readFailed);
        },
      });
    } catch (error) {
      console.error('[ResultCards] ❌ Premium TTS exception:', error);
      setPlayingVariant(null);
      showMessage(t.readFailed);
    }
  };

  const handleSave = async (variant: Variant, text: string) => {
    // 🆕 저장 중 표시 시작
    setSavingVariant(variant);
    
    try {
      // 🆕 짧은 지연으로 로딩 표시가 보이도록
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const todaySentence = getTodaySentence();

      if (todaySentence) {
        // 이미 오늘 저장한 문장이 있으면 교체 확인
        const confirmed = confirm(t.saveTodayExists);

        if (!confirmed) {
          showMessage(t.saveCancelled);
          return;
        }

        const result = replaceTodaySentence(text, variant);
        showMessage(result.message);
        
        if (result.success) {
          onSaveSuccess?.();
        }
      } else {
        // 새로 저장
        const result = saveSentence(text, variant);
        
        if (result.success) {
          // 🆕 저장 성공 시 특별한 메시지 표시
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 5000); // 5초 후 자동 숨김
          onSaveSuccess?.();
        } else {
          showMessage(result.message);
        }
      }
    } finally {
      // 🆕 저장 완료 후 로딩 상태 해제
      setSavingVariant(null);
    }
  };

  const handleShare = async (text: string) => {
    const result = await shareSentence({ text });
    if (result.success) {
      showMessage(result.message);
    } else {
      showMessage(result.message);
    }
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const renderCard = (variant: Variant, text: string) => {
    const colors = VARIANT_COLORS[variant];
    const label = getVariantLabel(variant);
    const isPlaying = playingVariant === variant;

    return (
      <div
        key={variant}
        className={`p-7 rounded-[18px] border ${colors.bgColor} ${colors.borderColor} 
                   shadow-sm hover:shadow-md transition-all duration-200 animate-slide-up`}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">{colors.emoji}</span>
          <span className={`text-[13px] font-bold ${colors.textColor}`}>
            {label}
          </span>
        </div>

        <p
          className="text-[16px] text-gray-900 mb-5 font-normal"
          style={{
            lineHeight: '1.65',
            letterSpacing: '-0.01em',
          }}
        >
          {text}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => handleSave(variant, text)}
            disabled={savingVariant === variant}
            className={`flex-1 h-10 px-4 text-[14px] font-bold text-white 
                     rounded-[16px] shadow-sm hover:shadow-md
                     transition-all duration-200
                     ${savingVariant === variant
                       ? 'bg-gray-400 cursor-not-allowed'
                       : 'bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600'
                     }`}
          >
            {savingVariant === variant ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    fill="currentColor"
                  />
                </svg>
                저장 중...
              </span>
            ) : (
              t.saveButton
            )}
          </button>

          <button
            onClick={() => handleShare(text)}
            className="flex-1 h-10 px-4 text-[14px] font-semibold text-gray-800 
                     bg-white hover:bg-rose-50 hover:border-rose-200 rounded-[16px] border border-gray-300 shadow-sm
                     transition-all duration-200"
          >
            {t.shareButton}
          </button>

          <button
            onClick={() => handleRead(variant, text)}
            className={`flex-1 h-10 px-4 text-[14px] font-semibold rounded-[16px] shadow-sm transition-all duration-200
                     ${
                       isPlaying
                         ? 'bg-rose-500 text-white shadow-md border-2 border-rose-400'
                         : 'bg-white text-gray-800 hover:bg-rose-50 hover:border-rose-200 border border-gray-300'
                     }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  {t.stopButton}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                  </svg>
                  {t.readButtonShort}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* 저장 성공 메시지 - 보관함 링크 포함 */}
      {saveSuccess && (
        <div className="mb-4 p-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl animate-fade-in shadow-md">
          <p className="text-sm font-medium text-center mb-3">
            ✓ {t.saveSuccess}
          </p>
          <div className="flex justify-center">
            <a
              href="/library"
              className="px-4 py-2 text-sm font-medium text-rose-600 bg-white hover:bg-rose-50
                       rounded-lg transition-colors duration-200"
              onClick={() => setSaveSuccess(false)}
            >
              {t.saveSuccessGoToLibrary}
            </a>
          </div>
        </div>
      )}
      
      {/* 일반 메시지 알림 */}
      {message && (
        <div className="mb-4 p-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-center rounded-2xl animate-fade-in shadow-md">
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* 요약 (선택) - 포근한 느낌 */}
      {result.summary && (
        <div className="mb-6 p-6 bg-rose-50/30 rounded-[18px] border border-rose-100/50 shadow-sm">
          <p
            className="text-[15px] text-gray-900 font-normal"
            style={{
              lineHeight: '1.65',
              letterSpacing: '-0.01em',
            }}
          >
            {result.summary}
          </p>
        </div>
      )}

      {/* 3개 카드 */}
      <div className="space-y-4">
        {renderCard('gentle', result.lines.gentle)}
        {renderCard('clear', result.lines.clear)}
        {renderCard('brave', result.lines.brave)}
      </div>

      {/* TTS 선택 모달 */}
      <TtsModal
        isOpen={showTtsModal}
        onClose={() => setShowTtsModal(false)}
        onSelectBasic={handleBasicTts}
        onSelectPremium={handlePremiumTts}
      />
    </div>
  );
}

