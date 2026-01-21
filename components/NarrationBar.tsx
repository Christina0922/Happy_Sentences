'use client';

import { useState, useEffect } from 'react';
import { getTTSPlayer } from '@/lib/tts';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { getBasicTtsPlayer } from '@/src/lib/tts/basicTts';
import { getPremiumTtsPlayer } from '@/src/lib/tts/premiumTts';
import TtsModal from '@/components/TtsModal';

interface NarrationBarProps {
  narration: string;
}

export default function NarrationBar({ narration }: NarrationBarProps) {
  const { t, language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [showTtsModal, setShowTtsModal] = useState(false);

  const tts = getTTSPlayer();
  const basicTts = getBasicTtsPlayer();
  const premiumTts = getPremiumTtsPlayer();

  useEffect(() => {
    // 컴포넌트 언마운트 시 정지
    return () => {
      tts.stop();
    };
  }, []);

  const handlePlay = () => {
    if (isPlaying) {
      tts.stop();
      basicTts.stop();
      premiumTts.stop();
      setIsPlaying(false);
    } else {
      setShowTtsModal(true);
    }
  };

  const handleBasicTts = () => {
    basicTts.speak(narration, language, {
      rate,
      onEnd: () => setIsPlaying(false),
      onError: (error) => {
        console.error('Basic TTS 실패:', error);
        setIsPlaying(false);
        alert(t.narrationFailed);
      },
    });
    setIsPlaying(true);
  };

  const handlePremiumTts = async () => {
    await premiumTts.play(narration, language, {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: (error) => {
        console.error('Premium TTS 실패:', error);
        setIsPlaying(false);
        alert(t.narrationFailed);
      },
    });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(e.target.value);
    setRate(newRate);
    
    // 재생 중이면 재시작
    if (isPlaying) {
      tts.stop();
      tts.speak(narration, {
        rate: newRate,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-8">
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100">
        <div className="mb-3">
          <span className="text-sm font-medium text-purple-900">{t.narrationLabel}</span>
        </div>

        <p
          className="text-lg text-gray-900 mb-5"
          style={{
            lineHeight: '1.7',
            letterSpacing: '-0.02em',
          }}
        >
          {narration}
        </p>

        <div className="space-y-4">
          {/* 재생/정지 버튼 */}
          <button
            onClick={handlePlay}
            className={`w-full py-3 px-6 text-base font-medium rounded-xl transition-colors
                     ${
                       isPlaying
                         ? 'bg-purple-900 text-white hover:bg-purple-800'
                         : 'bg-white text-purple-900 border-2 border-purple-200 hover:bg-purple-50'
                     }`}
          >
            {isPlaying ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {t.narrationStop}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                {t.narrationStart}
              </span>
            )}
          </button>

          {/* 속도 조절 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 min-w-[60px]">{t.speedLabel}</span>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={rate}
              onChange={handleRateChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-sm text-gray-700 font-medium min-w-[40px] text-right">
              {rate.toFixed(2)}×
            </span>
          </div>
        </div>
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

