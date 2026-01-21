'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { getBasicTtsPlayer } from '@/src/lib/tts/basicTts';
import { getPremiumTtsPlayer } from '@/src/lib/tts/premiumTts';
import { getSpeechRecognition, RecognitionState } from '@/src/lib/speech/recognition';
import TtsModal from '@/components/TtsModal';

interface ComposerProps {
  onGenerate: (input: string) => void;
  isLoading: boolean;
  hasResult: boolean;
  latestSentence?: string;
}

export default function Composer({
  onGenerate,
  isLoading,
  hasResult,
  latestSentence,
}: ComposerProps) {
  const { t, language } = useLanguage();
  const [input, setInput] = useState('');
  const [showTtsModal, setShowTtsModal] = useState(false);
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [shouldHighlightCreate, setShouldHighlightCreate] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const basicTts = getBasicTtsPlayer();
  const premiumTts = getPremiumTtsPlayer();
  const recognition = getSpeechRecognition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = input.trim();
    if (!trimmed) {
      alert(t.inputAlert);
      return;
    }

    onGenerate(trimmed);
  };

  const handleReset = () => {
    setInput('');
  };

  const handleReadClick = () => {
    setShowTtsModal(true);
  };

  const handleBasicTts = async () => {
    if (!latestSentence) return;
    
    // 개발 모드에서는 speakText 사용 (진단 기능)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { speakText } = await import('@/src/lib/tts/speakText');
        const success = await speakText(latestSentence, language);
        
        if (!success) {
          alert(t.readFailed);
        }
      } catch (error) {
        console.error('[Composer] ❌ speakText exception:', error);
        alert(t.readFailed);
      }
    } else {
      // 프로덕션에서는 기존 basicTts 사용
      try {
        await basicTts.speak(latestSentence, language, {
          onStart: () => {
            console.log('[Composer] TTS started');
          },
          onEnd: () => {
            console.log('[Composer] TTS ended');
          },
          onError: (error) => {
            console.error('[Composer] ❌ Basic TTS failed:', error);
            alert(t.readFailed);
          },
        });
      } catch (error) {
        console.error('[Composer] ❌ Basic TTS exception:', error);
        alert(t.readFailed);
      }
    }
  };

  const handlePremiumTts = async () => {
    if (!latestSentence) return;
    
    // iOS Safari: 클릭 이벤트 동기 흐름에서 즉시 실행
    try {
      await premiumTts.play(latestSentence, language, {
        onStart: () => {
          console.log('[Composer] Premium TTS started');
        },
        onEnd: () => {
          console.log('[Composer] Premium TTS ended');
        },
        onError: (error) => {
          console.error('[Composer] ❌ Premium TTS failed:', error);
          alert(t.readFailed);
        },
      });
    } catch (error) {
      console.error('[Composer] ❌ Premium TTS exception:', error);
      alert(t.readFailed);
    }
  };

  // 음성 인식 토글
  const handleVoiceInput = () => {
    if (!recognition.isAvailable()) {
      alert(t.voiceInputNotSupported);
      return;
    }

    // 듣는 중이면 중지
    if (recognitionState === 'listening' || recognitionState === 'processing') {
      console.log('[Composer] Stopping voice recognition');
      recognition.stop();
      setRecognitionState('idle');
      setInterimTranscript('');
      return;
    }

    // 음성 인식 시작
    console.log('[Composer] Starting voice recognition');
    setInterimTranscript('');
    
    recognition.start(language, {
      continuous: false,
      interimResults: true,
      onStart: () => {
        console.log('[Composer] ✅ Voice recognition started');
        setRecognitionState('listening');
      },
      onResult: (transcript, isFinal) => {
        console.log(`[Composer] Transcript: "${transcript}" (final: ${isFinal})`);
        
        if (isFinal) {
          // 최종 결과를 입력창에 반영
          setInput(prev => {
            const newText = prev ? `${prev} ${transcript}` : transcript;
            return newText;
          });
          setInterimTranscript('');
          setRecognitionState('processing');
          
          // 커서를 끝으로 이동
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
              );
            }
          }, 100);
        } else {
          // 중간 결과 표시
          setInterimTranscript(transcript);
        }
      },
      onEnd: () => {
        console.log('[Composer] ✅ Voice recognition ended');
        setRecognitionState('idle');
        setInterimTranscript('');
        
        // "행복문장 만들기" 버튼 강조 (1.5초)
        setShouldHighlightCreate(true);
        setTimeout(() => setShouldHighlightCreate(false), 1500);
      },
      onError: (error) => {
        console.error('[Composer] ❌ Voice recognition error:', error);
        setRecognitionState('error');
        setInterimTranscript('');
        
        // 사용자에게 에러 메시지 표시
        if (error.code === 'not-allowed') {
          alert(t.voiceInputPermissionDenied);
        } else if (error.code === 'no-speech') {
          alert(t.voiceInputNoSpeech);
        } else {
          alert(error.userMessage || t.voiceInputError);
        }
        
        // 1초 후 idle 상태로 복귀
        setTimeout(() => {
          if (recognitionState === 'error') {
            setRecognitionState('idle');
          }
        }, 1000);
      },
    });
  };

  // 음성 인식 버튼 텍스트
  const getVoiceButtonText = () => {
    switch (recognitionState) {
      case 'listening':
        return `${t.voiceInputListening} (${t.voiceInputStop})`;
      case 'processing':
        return t.voiceInputListening; // processing 상태에도 "듣는 중..." 표시
      case 'error':
        return t.voiceInputError;
      default:
        return t.voiceInputButton;
    }
  };

  // 음성 인식 지원 여부 확인
  useEffect(() => {
    if (!recognition.isAvailable()) {
      console.warn('[Composer] Speech recognition not available');
    }
  }, [recognition]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 입력 박스 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
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
          
          {/* 중간 결과 표시 (인식 중) */}
          {interimTranscript && (
            <div className="absolute bottom-3 left-6 right-6 text-sm text-gray-400 italic pointer-events-none">
              {interimTranscript}
            </div>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`flex-1 py-4 px-6 text-base font-medium text-white bg-gray-900 
                     rounded-xl hover:bg-gray-800 disabled:bg-gray-300 
                     disabled:cursor-not-allowed transition-all
                     ${shouldHighlightCreate ? 'animate-pulse ring-4 ring-gray-400' : ''}`}
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
                {t.creatingButton}
              </span>
            ) : (
              t.createButton
            )}
          </button>

          {/* 음성 입력 버튼 */}
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={isLoading || !recognition.isAvailable()}
            className={`py-4 px-6 text-base font-medium rounded-xl transition-all
                     ${recognitionState === 'listening' 
                       ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                       : recognitionState === 'processing'
                       ? 'bg-blue-500 text-white'
                       : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                     }
                     disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
            title={!recognition.isAvailable() ? t.voiceInputNotSupported : ''}
          >
            {recognitionState === 'listening' ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                {getVoiceButtonText()}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                {getVoiceButtonText()}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleReadClick}
            disabled={!hasResult || isLoading}
            className="py-4 px-6 text-base font-medium text-gray-700 bg-gray-100 
                     rounded-xl hover:bg-gray-200 disabled:bg-gray-100 
                     disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {t.readButton}
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
              {t.resetButton}
            </button>
          )}
        </div>
      </form>

      {/* 최근 저장 문장 미리보기 */}
      {latestSentence && !hasResult && (
        <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">{t.recentSaved}</p>
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

