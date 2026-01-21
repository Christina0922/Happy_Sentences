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
        const hasKorean = /[가-힣]/.test(data.lines.gentle + data.lines.clear + data.lines.brave);
        if (hasKorean) {
          console.warn('[Home] ⚠️ Korean characters detected in EN mode result');
          setError('Generated sentences contain Korean characters. Please try again.');
          setResult(null);
        }
      }
    } catch (err) {
      console.error('[Home] ❌ Generation failed:', err);
      
      // 네트워크 에러 체크
      const isNetworkError = err instanceof Error && 
        (err.message.includes('fetch') || err.message.includes('network'));
      
      const errorMessage = isNetworkError 
        ? `${t.generateNetworkError}\n${t.generateError}`
        : err instanceof Error 
          ? `${t.generateError}\n${err.message}`
          : t.generateError;
      
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
    <div className="min-h-screen relative">
      {/* 상단 배경 빛 번짐 (따뜻한 분위기) */}
      <div className="fixed top-0 left-0 right-0 h-96 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-rose-50/40 via-orange-50/20 to-transparent"></div>
      </div>
      
      {/* 헤더 */}
      <header className="py-6 px-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
              😊 {t.appTitle}
            </h1>
            <p className="text-[13px] font-medium text-gray-600 mt-1">{t.appSubtitle}</p>
          </div>
          
          {/* 모바일: 2줄 레이아웃, 데스크톱: 1줄 레이아웃 */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageToggle />
          <Link
            href="/library"
              className="py-2 px-4 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                       rounded-2xl border border-gray-300 transition-colors duration-200
                       whitespace-nowrap flex-shrink-0"
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
                <p className="text-red-800 text-center mb-3">{error}</p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setError('')}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-white hover:bg-red-100
                             rounded-lg border border-red-300 transition-colors duration-200"
                  >
                    {t.generateRetry}
                  </button>
                </div>
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

      </main>

      {/* 푸터 - iOS safe-area 대응 */}
      <footer className="py-8 mt-16 border-t border-gray-100" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            {t.footerText}
          </p>
        </div>
      </footer>
    </div>
  );
}
