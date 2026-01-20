'use client';

import { useState, useEffect } from 'react';
import Composer from '@/components/Composer';
import ResultCards from '@/components/ResultCards';
import NarrationBar from '@/components/NarrationBar';
import { GenerateResponse } from '@/lib/schema';
import { generateSentences } from '@/lib/generate';
import { getTodaySentence } from '@/lib/storage';
import { getTTSPlayer } from '@/lib/tts';
import Link from 'next/link';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState('');
  const [latestSentence, setLatestSentence] = useState<string>('');

  const tts = getTTSPlayer();

  // 최근 저장 문장 불러오기
  useEffect(() => {
    const todaySentence = getTodaySentence();
    if (todaySentence) {
      setLatestSentence(todaySentence.text);
    }
  }, []);

  const handleGenerate = async (input: string) => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await generateSentences(input);
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '문장 생성에 실패했어요.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadLatest = () => {
    if (!result) return;

    // 3개 문장 + 낭독용 문장을 순서대로 읽기
    const texts = [
      result.lines.gentle,
      result.lines.clear,
      result.lines.brave,
      result.narration,
    ];

    tts.speakMultiple(texts, {
      rate: 0.95,
      pauseBetween: 800,
      onError: (error) => {
        console.error('연속 재생 실패:', error);
        alert('읽기에 실패했어요.');
      },
    });
  };

  const handleSaveSuccess = () => {
    // 저장 성공 시 최근 저장 문장 업데이트
    const todaySentence = getTodaySentence();
    if (todaySentence) {
      setLatestSentence(todaySentence.text);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <header className="py-8 px-4 border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Happy Sentences</h1>
            <p className="text-sm text-gray-500 mt-1">행복을 주는 문장</p>
          </div>
          <Link
            href="/library"
            className="py-2 px-4 text-sm font-medium text-gray-700 bg-white 
                     border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            보관함
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="py-12">
        {/* 입력 영역 */}
        <section className="mb-12">
          <Composer
            onGenerate={handleGenerate}
            onReadLatest={handleReadLatest}
            isLoading={isLoading}
            hasResult={result !== null}
            latestSentence={latestSentence}
          />
        </section>

        {/* 에러 메시지 */}
        {error && (
          <section className="mb-8">
            <div className="max-w-2xl mx-auto px-4">
              <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-center">{error}</p>
              </div>
            </div>
          </section>
        )}

        {/* 결과 영역 */}
        {result && (
          <>
            <section className="mb-8">
              <ResultCards result={result} onSaveSuccess={handleSaveSuccess} />
            </section>

            <section>
              <NarrationBar narration={result.narration} />
            </section>
          </>
        )}

        {/* 안내 문구 (결과 없을 때만) */}
        {!result && !isLoading && (
          <section className="mt-16">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <p className="text-gray-400 text-sm">
                단어 하나만 적어도 됩니다. 오늘의 마음을 그대로 적어보세요.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* 푸터 */}
      <footer className="py-8 mt-16 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            행복을 주는 문장을 만들어드립니다. 하루에 하나씩 저장해보세요.
          </p>
        </div>
      </footer>
    </div>
  );
}
