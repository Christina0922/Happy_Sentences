/**
 * TTS 자동 셀프테스트
 * 연속 10회 테스트를 실행하여 안정성 확인
 */

import { speakText } from './speakText';
import { getTtsStatus } from './ttsDiagnostics';

/**
 * speakText가 boolean을 반환할 수도 있고,
 * TtsResult 같은 객체를 반환할 수도 있어서,
 * 여기서 "성공 여부"를 boolean으로 표준화합니다.
 */
function toBooleanSuccess(result: unknown): boolean {
  // 1) 이미 boolean이면 그대로 사용
  if (typeof result === 'boolean') return result;

  // 2) 객체 형태면 흔히 쓰는 키들을 우선 체크
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;

    // 많이 쓰는 성공 플래그 후보들
    if (typeof r.ok === 'boolean') return r.ok;
    if (typeof r.success === 'boolean') return r.success;
    if (typeof r.isSuccess === 'boolean') return r.isSuccess;
    if (typeof r.passed === 'boolean') return r.passed;

    // 문자열 상태값 후보들
    if (typeof r.status === 'string') {
      const s = r.status.toLowerCase();
      if (s === 'ok' || s === 'success' || s === 'passed') return true;
      if (s === 'fail' || s === 'failed' || s === 'error') return false;
    }

    // 에러 유무 후보들
    if ('error' in r) return !r.error; // error가 null/undefined면 성공으로 간주
  }

  // 3) 그 외에는 실패로 처리(빌드 안정 목적)
  return false;
}

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
} as const;

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
      // TTS 실행 (반환 타입이 무엇이든 boolean으로 표준화)
      const raw = await speakText(testText, lang);
      const success = toBooleanSuccess(raw);

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
        await new Promise((resolve) => setTimeout(resolve, 500));
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

  const raw = await speakText(testText, lang);
  return toBooleanSuccess(raw);
}
