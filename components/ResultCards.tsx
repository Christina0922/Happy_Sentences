'use client';

import { GenerateResponse } from '@/lib/schema';
import { getTTSPlayer } from '@/lib/tts';
import { shareSentence } from '@/lib/share';
import { saveSentence, getTodaySentence, replaceTodaySentence } from '@/lib/storage';
import { useState } from 'react';

interface ResultCardsProps {
  result: GenerateResponse;
  onSaveSuccess?: () => void;
}

type Variant = 'gentle' | 'clear' | 'brave';

const VARIANT_INFO: Record<
  Variant,
  { label: string; bgColor: string; borderColor: string }
> = {
  gentle: {
    label: '다정한 한 줄',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-100',
  },
  clear: {
    label: '현실 정리 한 줄',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
  },
  brave: {
    label: '용기 한 줄',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-100',
  },
};

export default function ResultCards({ result, onSaveSuccess }: ResultCardsProps) {
  const [playingVariant, setPlayingVariant] = useState<Variant | null>(null);
  const [message, setMessage] = useState('');

  const tts = getTTSPlayer();

  const handleRead = (variant: Variant, text: string) => {
    if (playingVariant === variant) {
      // 같은 카드를 누르면 정지
      tts.stop();
      setPlayingVariant(null);
    } else {
      // 새로운 카드 읽기
      tts.speak(text, {
        rate: 0.95,
        onEnd: () => setPlayingVariant(null),
        onError: (error) => {
          console.error('읽기 실패:', error);
          setPlayingVariant(null);
          showMessage('읽기에 실패했어요.');
        },
      });
      setPlayingVariant(variant);
    }
  };

  const handleSave = async (variant: Variant, text: string) => {
    const todaySentence = getTodaySentence();

    if (todaySentence) {
      // 이미 오늘 저장한 문장이 있으면 교체 확인
      const confirmed = confirm(
        '오늘은 이미 저장했어요. 기존 문장을 이 문장으로 교체할까요?'
      );

      if (!confirmed) {
        showMessage('저장을 취소했어요.');
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
    const info = VARIANT_INFO[variant];
    const isPlaying = playingVariant === variant;

    return (
      <div
        key={variant}
        className={`p-6 rounded-2xl border-2 ${info.bgColor} ${info.borderColor} transition-all`}
      >
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-600">{info.label}</span>
        </div>

        <p
          className="text-xl text-gray-900 mb-6"
          style={{
            lineHeight: '1.7',
            letterSpacing: '-0.02em',
          }}
        >
          {text}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => handleSave(variant, text)}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 
                     bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                     transition-colors"
          >
            저장
          </button>

          <button
            onClick={() => handleShare(text)}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 
                     bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                     transition-colors"
          >
            공유
          </button>

          <button
            onClick={() => handleRead(variant, text)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors
                     ${
                       isPlaying
                         ? 'bg-gray-900 text-white'
                         : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                     }`}
          >
            {isPlaying ? '정지' : '읽기'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* 메시지 알림 */}
      {message && (
        <div className="mb-4 p-4 bg-gray-900 text-white text-center rounded-xl animate-fade-in">
          {message}
        </div>
      )}

      {/* 요약 (선택) */}
      {result.summary && (
        <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
          <p
            className="text-base text-gray-700"
            style={{
              lineHeight: '1.7',
              letterSpacing: '-0.02em',
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
    </div>
  );
}

