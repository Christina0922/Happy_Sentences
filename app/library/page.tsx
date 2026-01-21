'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getAllSentences,
  getFavoriteSentences,
  getRecentSentences,
  toggleFavorite,
  deleteSentence,
} from '@/lib/storage';
import { SavedSentence } from '@/lib/schema';
import { getTTSPlayer } from '@/lib/tts';
import { shareSentence } from '@/lib/share';
import { useLanguage } from '@/src/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function LibraryPage() {
  const { t, language } = useLanguage();
  const [sentences, setSentences] = useState<SavedSentence[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');

  const tts = getTTSPlayer();

  // 문장 불러오기
  const loadSentences = () => {
    if (filter === 'favorites') {
      setSentences(getFavoriteSentences());
    } else {
      setSentences(getAllSentences());
    }
  };

  useEffect(() => {
    loadSentences();
  }, [filter]);

  const handleToggleFavorite = (id: string) => {
    const success = toggleFavorite(id);
    if (success) {
      loadSentences();
    }
  };

  const handleDelete = (id: string) => {
    const confirmed = confirm(t.deleteConfirm);
    if (confirmed) {
      const success = deleteSentence(id);
      if (success) {
        showMessage(t.deleteSuccess);
        loadSentences();
      }
    }
  };

  const handleShare = async (text: string) => {
    const result = await shareSentence({ text });
    showMessage(result.message);
  };

  const handlePlayMultiple = async () => {
    if (isPlaying) {
      tts.stop();
      setIsPlaying(false);
      return;
    }

    const textsToPlay = filter === 'favorites'
      ? getFavoriteSentences().slice(0, 7).map(s => s.text)
      : getRecentSentences(7).map(s => s.text);

    if (textsToPlay.length === 0) {
      showMessage(t.noSentencesToPlay);
      return;
    }

    setIsPlaying(true);
    await tts.speakMultiple(textsToPlay, {
      rate: 0.95,
      pauseBetween: 800,
      onProgress: (current, total) => {
        console.log(`재생 중: ${current}/${total}`);
      },
      onComplete: () => {
        setIsPlaying(false);
        showMessage(t.playComplete);
      },
      onError: (error) => {
        console.error('연속 재생 실패:', error);
        setIsPlaying(false);
        showMessage(t.playFailed);
      },
    });
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const weekday = t.weekdays[date.getDay()];

    return t.dateFormat(year, month, day, weekday);
  };

  const getVariantLabel = (variant: string) => {
    switch (variant) {
      case 'gentle':
        return t.variantGentle;
      case 'clear':
        return t.variantClear;
      case 'brave':
        return t.variantBrave;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <header className="py-8 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.libraryTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t.savedCount} {sentences.length}{language === 'kr' ? '개' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/"
              className="py-2 px-4 text-sm font-medium text-gray-700 bg-white 
                       border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.homeButton}
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* 메시지 알림 */}
          {message && (
            <div className="mb-4 p-4 bg-gray-900 text-white text-center rounded-xl animate-fade-in">
              {message}
            </div>
          )}

          {/* 필터 & 연속 재생 */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`py-2 px-4 text-sm font-medium rounded-lg transition-colors
                         ${
                           filter === 'all'
                             ? 'bg-gray-900 text-white'
                             : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                         }`}
              >
                {t.allFilter}
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`py-2 px-4 text-sm font-medium rounded-lg transition-colors
                         ${
                           filter === 'favorites'
                             ? 'bg-gray-900 text-white'
                             : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                         }`}
              >
                {t.favoritesFilter}
              </button>
            </div>

            <button
              onClick={handlePlayMultiple}
              disabled={sentences.length === 0}
              className={`py-2 px-4 text-sm font-medium rounded-lg transition-colors
                       ${
                         isPlaying
                           ? 'bg-purple-900 text-white hover:bg-purple-800'
                           : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                       }
                       disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPlaying ? t.stopButton : t.continuousPlay}
            </button>
          </div>

          {/* 문장 리스트 */}
          {sentences.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400">
                {filter === 'favorites'
                  ? t.noSentencesFavorites
                  : t.noSentencesAll}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentences.map((sentence) => (
                <div
                  key={sentence.id}
                  className="p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 transition-all"
                >
                  {/* 날짜 & 즐겨찾기 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDisplayDate(sentence.date)}
                      </span>
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                        {getVariantLabel(sentence.variant)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(sentence.id)}
                      className="text-2xl transition-transform hover:scale-110"
                    >
                      {sentence.favorite ? '⭐' : '☆'}
                    </button>
                  </div>

                  {/* 문장 */}
                  <p
                    className="text-lg text-gray-900 mb-4"
                    style={{
                      lineHeight: '1.7',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {sentence.text}
                  </p>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShare(sentence.text)}
                      className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 
                               bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 
                               transition-colors"
                    >
                      {t.shareButtonLib}
                    </button>
                    <button
                      onClick={() => handleDelete(sentence.id)}
                      className="py-2 px-4 text-sm font-medium text-red-700 
                               bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 
                               transition-colors"
                    >
                      {t.deleteButton}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

