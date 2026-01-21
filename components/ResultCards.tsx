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
  { bgColor: string; borderColor: string; gradientFrom: string; gradientTo: string; emoji: string }
> = {
  gentle: {
    bgColor: 'bg-gradient-to-br from-pink-100/80 to-rose-100/80',
    borderColor: 'border-pink-200',
    gradientFrom: 'from-pink-400',
    gradientTo: 'to-rose-400',
    emoji: '💕',
  },
  clear: {
    bgColor: 'bg-gradient-to-br from-blue-100/80 to-sky-100/80',
    borderColor: 'border-blue-200',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-sky-400',
    emoji: '✨',
  },
  brave: {
    bgColor: 'bg-gradient-to-br from-green-100/80 to-emerald-100/80',
    borderColor: 'border-green-200',
    gradientFrom: 'from-green-400',
    gradientTo: 'to-emerald-400',
    emoji: '🌟',
  },
};

export default function ResultCards({ result, onSaveSuccess }: ResultCardsProps) {
  const { t, language } = useLanguage();
  const [playingVariant, setPlayingVariant] = useState<Variant | null>(null);
  const [message, setMessage] = useState('');
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
    
    // 개발 모드에서는 speakText 사용 (진단 기능 + 감정 표현)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { speakText } = await import('@/src/lib/tts/speakText');
        const success = await speakText(textToSpeak, language, cardType);
        
        if (!success) {
          showMessage(t.readFailed);
        }
        setPlayingVariant(null);
      } catch (error) {
        console.error('[ResultCards] ❌ speakText exception:', error);
        setPlayingVariant(null);
        showMessage(t.readFailed);
      }
    } else {
      // 프로덕션에서는 기존 basicTts 사용
      try {
        await basicTts.speak(textToSpeak, language, {
          onStart: () => {
            console.log('[ResultCards] ✅ TTS started successfully');
          },
          onEnd: () => {
            console.log('[ResultCards] ✅ TTS ended successfully');
            setPlayingVariant(null);
          },
          onError: (error) => {
            console.error('[ResultCards] ❌ Basic TTS onError:', error);
            setPlayingVariant(null);
            showMessage(t.readFailed);
          },
        });
      } catch (error) {
        console.error('[ResultCards] ❌ Basic TTS exception:', error);
        setPlayingVariant(null);
        showMessage(t.readFailed);
      }
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
      showMessage(result.message);
      
      if (result.success) {
        onSaveSuccess?.();
      }
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
        className={`p-8 rounded-3xl border-2 ${colors.bgColor} ${colors.borderColor} 
                   backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 
                   animate-slide-up transform hover:scale-105`}
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">{colors.emoji}</span>
          <span className={`text-sm font-semibold bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} bg-clip-text text-transparent`}>
            {label}
          </span>
        </div>

        <p
          className="text-xl text-gray-800 mb-6 font-medium"
          style={{
            lineHeight: '1.8',
            letterSpacing: '-0.01em',
          }}
        >
          {text}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => handleSave(variant, text)}
            className="flex-1 py-3 px-4 text-sm font-medium text-white 
                     bg-gradient-to-r from-purple-400 to-pink-400 rounded-full 
                     hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {t.saveButton}
          </button>

          <button
            onClick={() => handleShare(text)}
            className="flex-1 py-3 px-4 text-sm font-medium text-white 
                     bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full 
                     hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {t.shareButton}
          </button>

          <button
            onClick={() => handleRead(variant, text)}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg
                     ${
                       isPlaying
                         ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse'
                         : 'bg-white/90 text-gray-700 hover:bg-white border-2 border-gray-200'
                     }`}
          >
            {isPlaying ? t.stopButton : t.readButtonShort}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* 메시지 알림 */}
      {message && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center rounded-2xl animate-fade-in shadow-lg">
          <span className="text-lg">✨ {message}</span>
        </div>
      )}

      {/* 요약 (선택) */}
      {result.summary && (
        <div className="mb-6 p-6 bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-pink-200 shadow-lg">
          <p
            className="text-base text-gray-700"
            style={{
              lineHeight: '1.8',
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

