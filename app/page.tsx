'use client';

import { useState, useEffect } from 'react';
import Composer from '@/components/Composer';
import ResultCards from '@/components/ResultCards';
import LanguageToggle from '@/components/LanguageToggle';
import { GenerateResponse } from '@/lib/schema';
import { generateSentences } from '@/lib/generate';
import { getTodaySentence } from '@/lib/storage';
import { useLanguage } from '@/src/contexts/LanguageContext';
import Link from 'next/link';

export default function Home() {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState('');
  const [latestSentence, setLatestSentence] = useState<string>('');

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

    console.log(`[Home] Generating sentences (lang: ${language})`);

    try {
      const data = await generateSentences(input, language);
      setResult(data);
      
      // EN 모드에서 한글 검증
      if (language === 'en') {
        const hasKorean = /[가-힣]/.test(data.gentle + data.clear + data.brave);
        if (hasKorean) {
          console.warn('[Home] ⚠️ Korean characters detected in EN mode result');
          setError('Generated sentences contain Korean characters. Please try again.');
          setResult(null);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.playFailed;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">{t.appTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">{t.appSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
          <Link
            href="/library"
            className="py-2 px-4 text-sm font-medium text-gray-700 bg-white 
                     border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
              {t.libraryButton}
          </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="py-12">
        {/* 입력 영역 */}
        <section className="mb-12">
          <Composer
            onGenerate={handleGenerate}
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
            <section className="mb-8">
              <ResultCards result={result} onSaveSuccess={handleSaveSuccess} />
            </section>
        )}

        {/* 안내 문구 (결과 없을 때만) */}
        {!result && !isLoading && (
          <section className="mt-16">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <p className="text-gray-400 text-sm">
                {t.guideText}
              </p>
            </div>
          </section>
        )}
      </main>

      {/* 푸터 */}
      <footer className="py-8 mt-16 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            {t.footerText}
          </p>
        </div>
      </footer>
    </div>
  );
}
