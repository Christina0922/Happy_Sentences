'use client';

import { useState } from 'react';

interface ComposerProps {
  onGenerate: (input: string) => void;
  onReadLatest: () => void;
  isLoading: boolean;
  hasResult: boolean;
  latestSentence?: string;
}

export default function Composer({
  onGenerate,
  onReadLatest,
  isLoading,
  hasResult,
  latestSentence,
}: ComposerProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = input.trim();
    if (!trimmed) {
      alert('단어 하나만 적어도 됩니다.');
      return;
    }

    onGenerate(trimmed);
  };

  const handleReset = () => {
    setInput('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 입력 박스 */}
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="단어만 적어도 됩니다. 오늘 마음을 그대로 적어보세요."
            disabled={isLoading}
            rows={6}
            className="w-full px-6 py-5 text-lg bg-white border-2 border-gray-200 rounded-2xl 
                     focus:border-gray-400 focus:outline-none resize-none
                     disabled:bg-gray-50 disabled:text-gray-400 transition-colors
                     placeholder:text-gray-400"
            style={{
              lineHeight: '1.7',
              letterSpacing: '-0.02em',
            }}
          />
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-1 py-4 px-6 text-base font-medium text-white bg-gray-900 
                     rounded-xl hover:bg-gray-800 disabled:bg-gray-300 
                     disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                생성 중...
              </span>
            ) : (
              '행복문장 만들기'
            )}
          </button>

          <button
            type="button"
            onClick={onReadLatest}
            disabled={!hasResult || isLoading}
            className="py-4 px-6 text-base font-medium text-gray-700 bg-gray-100 
                     rounded-xl hover:bg-gray-200 disabled:bg-gray-100 
                     disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            읽어주기
          </button>

          {input && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="py-4 px-6 text-base font-medium text-gray-500 bg-white 
                       border-2 border-gray-200 rounded-xl hover:bg-gray-50 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </form>

      {/* 최근 저장 문장 미리보기 */}
      {latestSentence && !hasResult && (
        <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">최근 저장한 문장</p>
          <p
            className="text-base text-gray-800"
            style={{
              lineHeight: '1.7',
              letterSpacing: '-0.02em',
            }}
          >
            {latestSentence}
          </p>
        </div>
      )}
    </div>
  );
}

