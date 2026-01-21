/**
 * TTS 자동 셀프테스트
 * 연속 10회 테스트를 실행하여 안정성 확인
 */

import { speakText } from './speakText';
import { getTtsStatus } from './ttsDiagnostics';

export interface SelfTestResult {
  pass: number;
  fail: number;
  errors: Array<{
    round: number;
    error: {
      code?: string;
      message?: string;
      time: number;
    } | null;
  }>;
  totalTime: number;
}

// 테스트 문구
const TEST_SENTENCES = {
  kr: '테스트 문장입니다.',
  en: 'This is a test sentence.',
};

/**
 * TTS 셀프테스트 실행 (연속 10회)
 * @param lang 테스트 언어
 * @param onProgress 진행률 콜백 (현재/전체)
 * @returns 테스트 결과
 */
export async function runTtsSelfTest(
  lang: 'kr' | 'en',
  onProgress?: (current: number, total: number) => void
): Promise<SelfTestResult> {
  console.log(`[Self Test] Starting 10-round test (lang: ${lang})`);
  
  const startTime = Date.now();
  const result: SelfTestResult = {
    pass: 0,
    fail: 0,
    errors: [],
    totalTime: 0,
  };

  const testText = TEST_SENTENCES[lang];
  const totalRounds = 10;

  for (let round = 1; round <= totalRounds; round++) {
    console.log(`[Self Test] Round ${round}/${totalRounds}`);
    
    // 진행률 알림
    onProgress?.(round, totalRounds);

    try {
      // TTS 실행
      const success = await speakText(testText, lang);

      if (success) {
        result.pass++;
        console.log(`[Self Test] Round ${round}: ✅ PASS`);
      } else {
        result.fail++;
        const status = getTtsStatus();
        result.errors.push({
          round,
          error: status.lastError,
        });
        console.error(`[Self Test] Round ${round}: ❌ FAIL`, status.lastError);
      }

      // 다음 회차 전 짧은 대기 (500ms)
      if (round < totalRounds) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      result.fail++;
      result.errors.push({
        round,
        error: {
          code: 'exception',
          message: error instanceof Error ? error.message : 'Unknown exception',
          time: Date.now(),
        },
      });
      console.error(`[Self Test] Round ${round}: ❌ EXCEPTION`, error);
    }
  }

  result.totalTime = Date.now() - startTime;

  console.log(`[Self Test] Completed:`, {
    pass: result.pass,
    fail: result.fail,
    totalTime: `${result.totalTime}ms`,
    successRate: `${((result.pass / totalRounds) * 100).toFixed(1)}%`,
  });

  return result;
}

/**
 * 빠른 테스트 (1회만)
 */
export async function runQuickTest(lang: 'kr' | 'en'): Promise<boolean> {
  console.log(`[Quick Test] Running single test (lang: ${lang})`);
  const testText = TEST_SENTENCES[lang];
  return await speakText(testText, lang);
}

