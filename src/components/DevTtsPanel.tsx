'use client';

/**
 * 개발자 전용 TTS 진단 패널
 * 프로덕션에서는 렌더링되지 않음
 */

import { useState, useEffect } from 'react';
import { getTtsStatus, addTtsStatusListener, type TtsStatus, logTtsDiagnostics } from '@/src/lib/tts/ttsDiagnostics';
import { runTtsSelfTest, runQuickTest, type SelfTestResult } from '@/src/lib/tts/selfTestTts';
import { stopSpeaking } from '@/src/lib/tts/speakText';
import { initBasicTts } from '@/src/lib/tts/basicTts';
import { useLanguage } from '@/src/contexts/LanguageContext';

// 개발 모드 체크
const IS_DEV = process.env.NODE_ENV !== 'production';

// 감정 설명 헬퍼
function getEmotionDescription(emotion: string): string {
  const descriptions: Record<string, string> = {
    CALM: '차분하고 담담한 톤',
    COMFORT: '따뜻하고 위로하는 톤',
    ENCOURAGE: '활기차고 격려하는 톤',
    HOPE: '밝고 희망적인 톤',
    JOY: '기쁘고 즐거운 톤',
    FIRM: '단호하고 확고한 톤',
  };
  return descriptions[emotion] || 'Unknown';
}

export default function DevTtsPanel() {
  const { language } = useLanguage();
  const [status, setStatus] = useState<TtsStatus>(getTtsStatus());
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState<{ current: number; total: number } | null>(null);
  const [testResult, setTestResult] = useState<SelfTestResult | null>(null);

  // 상태 업데이트 리스너
  useEffect(() => {
    const unsubscribe = addTtsStatusListener((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  // 프로덕션에서는 렌더링하지 않음
  if (!IS_DEV) {
    return null;
  }

  // Voices 리로드
  const handleReloadVoices = () => {
    console.log('[Dev Panel] Reloading voices...');
    initBasicTts();
  };

  // Cancel 실행
  const handleCancel = () => {
    console.log('[Dev Panel] Canceling speech...');
    stopSpeaking();
  };

  // 셀프테스트 실행
  const handleSelfTest = async () => {
    if (isTestRunning) return;

    console.log('[Dev Panel] Starting self test...');
    setIsTestRunning(true);
    setTestProgress(null);
    setTestResult(null);

    try {
      const result = await runTtsSelfTest(language, (current, total) => {
        setTestProgress({ current, total });
      });

      setTestResult(result);
      console.log('[Dev Panel] Self test completed:', result);
    } catch (error) {
      console.error('[Dev Panel] Self test error:', error);
    } finally {
      setIsTestRunning(false);
      setTestProgress(null);
    }
  };

  // 빠른 테스트
  const handleQuickTest = async () => {
    console.log('[Dev Panel] Running quick test...');
    const success = await runQuickTest(language);
    console.log(`[Dev Panel] Quick test ${success ? '✅ PASS' : '❌ FAIL'}`);
  };

  // 진단 로그 출력
  const handleLogDiagnostics = () => {
    logTtsDiagnostics();
  };

  // 최소화 상태
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors text-sm font-mono"
        >
          📊 TTS Dev Panel
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-900 font-mono text-xs">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="font-bold">TTS Dev Panel</span>
          <span className="text-gray-400 text-[10px]">DEV ONLY</span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ━
        </button>
      </div>

      {/* 상태 정보 */}
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <span className="text-gray-600">Supported:</span>
            <span>{status.supported ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <span className="text-gray-600">Voices:</span>
            <span className={status.voicesLoaded ? 'text-green-600' : 'text-red-600'}>
              {status.voicesCount} {status.voicesLoaded ? '✅' : '❌'}
            </span>
          </div>
        </div>

        {/* 현재 상태 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <span className="text-gray-600">Speaking:</span>
            <span className={status.speaking ? 'text-green-600 animate-pulse' : 'text-gray-400'}>
              {status.speaking ? '🔊 YES' : 'NO'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <span className="text-gray-600">Pending:</span>
            <span className={status.pending ? 'text-yellow-600' : 'text-gray-400'}>
              {status.pending ? 'YES' : 'NO'}
            </span>
          </div>
        </div>

        {/* 선택된 음성 */}
        <div className="bg-blue-50 p-2 rounded">
          <div className="text-gray-600 mb-1">Selected Voice:</div>
          <div className="text-gray-900 truncate">
            {status.selectedVoiceName || 'None'}
          </div>
          <div className="text-gray-500 text-[10px]">
            {status.selectedVoiceLang || 'N/A'}
          </div>
        </div>

        {/* 마지막 액션 */}
        <div className="bg-purple-50 p-2 rounded">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Last Action:</span>
            <span className="font-bold text-purple-600">{status.lastAction.toUpperCase()}</span>
          </div>
          {status.lastSpokenLang && (
            <div className="text-gray-500 text-[10px] mt-1">
              Lang: {status.lastSpokenLang.toUpperCase()} | Text: {status.lastSpokenTextLen} chars
            </div>
          )}
        </div>

        {/* 감정 정보 */}
        {status.currentEmotion && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-2 rounded border border-pink-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">😊 Emotion:</span>
              <span className="font-bold text-pink-600">{status.currentEmotion}</span>
            </div>
            <div className="text-gray-500 text-[10px] mt-1">
              {getEmotionDescription(status.currentEmotion)}
            </div>
          </div>
        )}

        {/* 마지막 에러 */}
        {status.lastError && (
          <div className="bg-red-50 p-2 rounded border border-red-200">
            <div className="text-red-600 font-bold mb-1">❌ Last Error:</div>
            <div className="text-red-700 text-[10px] break-words">
              <div><strong>Code:</strong> {status.lastError.code || 'unknown'}</div>
              <div><strong>Message:</strong> {status.lastError.message || 'N/A'}</div>
              <div className="text-gray-500">
                {new Date(status.lastError.time).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* 테스트 결과 */}
        {testResult && (
          <div className={`p-2 rounded border ${
            testResult.fail === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="font-bold mb-1">
              🧪 Test Result: {testResult.pass}/{testResult.pass + testResult.fail}
            </div>
            <div className="text-[10px]">
              <div className="text-green-600">✅ Pass: {testResult.pass}</div>
              <div className="text-red-600">❌ Fail: {testResult.fail}</div>
              <div className="text-gray-500">Time: {testResult.totalTime}ms</div>
              <div className="text-gray-500">
                Success Rate: {((testResult.pass / (testResult.pass + testResult.fail)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* 테스트 진행 중 */}
        {testProgress && (
          <div className="bg-blue-50 p-2 rounded animate-pulse">
            <div className="font-bold text-blue-600">
              🧪 Testing... {testProgress.current}/{testProgress.total}
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(testProgress.current / testProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 버튼 그룹 */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <button
            onClick={handleReloadVoices}
            className="py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔄 Reload Voices
          </button>
          <button
            onClick={handleCancel}
            className="py-2 px-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            ⛔ Cancel
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleQuickTest}
            disabled={isTestRunning}
            className="py-2 px-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⚡ Quick Test
          </button>
          <button
            onClick={handleSelfTest}
            disabled={isTestRunning}
            className="py-2 px-3 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🧪 Self Test x10
          </button>
        </div>

        <button
          onClick={handleLogDiagnostics}
          className="w-full py-2 px-3 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
        >
          📋 Log to Console
        </button>

        {/* 마지막 업데이트 시간 */}
        <div className="text-[10px] text-gray-400 text-center">
          Updated: {new Date(status.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

