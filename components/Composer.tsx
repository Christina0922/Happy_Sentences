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
    
    try {
      // 강화된 진단 기능이 있는 speakText 사용 (개발/프로덕션 모두)
      const { speakText } = await import('@/src/lib/tts/speakText');
      const result = await speakText(latestSentence, language);
      
      if (!result.success) {
        // 에러 타입에 따라 적절한 메시지 표시
        let errorMessage = t.ttsGenericError;
        
        switch (result.errorType) {
          case 'not-supported':
            errorMessage = t.ttsNotSupported;
            break;
          case 'no-voices':
            errorMessage = t.ttsNoVoices;
            break;
          case 'webview-limit':
            errorMessage = t.ttsWebViewLimit;
            break;
          case 'generic':
          default:
            errorMessage = t.ttsGenericError;
            break;
        }
        
        alert(errorMessage);
        console.error('[Composer] ❌ TTS failed:', {
          errorType: result.errorType,
          errorMessage: result.errorMessage,
        });
      }
    } catch (error) {
      console.error('[Composer] ❌ speakText exception:', error);
      alert(t.ttsGenericError);
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
      // 🆕 더 친절한 안내 메시지
      alert(`${t.voiceInputNotSupported}\n\n💡 Chrome, Safari, Edge 브라우저를 사용해보세요.`);
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
        
        // 🆕 사용자에게 명확하고 친절한 에러 메시지 표시
        let userMessage = '';
        if (error.code === 'not-allowed') {
          userMessage = `${t.voiceInputPermissionDenied}\n\n📱 iOS: 설정 > Safari > 마이크\n🤖 Android: 설정 > 앱 > 브라우저 > 권한`;
        } else if (error.code === 'no-speech') {
          userMessage = `${t.voiceInputNoSpeech}\n\n💡 마이크를 입에 가까이 대고 또렷하게 말해주세요.`;
        } else if (error.code === 'aborted') {
          // 사용자가 취소한 경우, 조용히 처리
          userMessage = '';
        } else {
          userMessage = `${error.userMessage || t.voiceInputError}\n\n💡 다시 시도하거나 문자로 입력해주세요.`;
        }
        
        if (userMessage) {
          alert(userMessage);
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
        {/* 입력 박스 - 포근한 느낌 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            disabled={isLoading}
            rows={6}
            className="w-full px-7 py-5 text-[16px] text-gray-900 bg-white border border-gray-300 rounded-[18px]
                     focus:border-rose-400 focus:ring-3 focus:ring-rose-50 focus:outline-none resize-none
                     disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200
                     placeholder:text-gray-500 shadow-sm font-normal"
            style={{
              lineHeight: '1.65',
              letterSpacing: '-0.01em',
            }}
          />
          
          {/* 중간 결과 표시 (인식 중) */}
          {interimTranscript && (
            <div className="absolute bottom-3 left-6 right-6 text-sm text-gray-400 italic pointer-events-none">
              {interimTranscript}
            </div>
          )}
        </div>

        {/* 버튼 그룹: 2행 레이아웃 */}
        <div className="space-y-3">
          {/* Row 1: Primary 버튼 (행복문장 만들기) - 항상 매력적인 rose 컬러 */}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`w-full h-12 px-6 text-[15px] font-bold text-white
                     bg-gradient-to-r from-[#FB7185] to-[#F43F5E] 
                     hover:from-[#F43F5E] hover:to-[#E11D48]
                     rounded-[18px] shadow-sm hover:shadow-md
                     transition-all duration-200
                     ${isLoading || !input.trim()
                       ? 'opacity-60 cursor-not-allowed'
                       : 'opacity-100'
                     }
                     ${shouldHighlightCreate ? 'ring-2 ring-rose-300 ring-offset-2' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
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

          {/* Row 2: Secondary 버튼들 - iOS safe-area 대응 */}
          <div className="flex gap-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            {/* 음성 입력 버튼 - 상태 피드백 개선 */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading || !recognition.isAvailable()}
              className={`flex-1 h-12 px-4 text-[14px] font-semibold rounded-[18px] transition-all duration-200
                       ${recognitionState === 'listening' 
                         ? 'bg-rose-500 text-white shadow-md border-2 border-rose-400' 
                         : recognitionState === 'processing'
                         ? 'bg-orange-500 text-white shadow-md border-2 border-orange-400'
                         : 'text-gray-800 bg-white hover:bg-rose-50 hover:border-rose-200 border border-gray-300 shadow-sm'
                       }
                       disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-300 disabled:shadow-none`}
              title={!recognition.isAvailable() ? `${t.voiceInputNotSupported} (Chrome, Safari, Edge 사용 권장)` : ''}
              aria-label={!recognition.isAvailable() ? t.voiceInputNotSupported : getVoiceButtonText()}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className={`w-4 h-4 ${recognitionState === 'listening' ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">{getVoiceButtonText()}</span>
              </span>
            </button>

            {/* 읽어주기 버튼 - 스피커 아이콘 */}
            <button
              type="button"
              onClick={handleReadClick}
              disabled={!hasResult || isLoading}
              className="flex-1 h-12 px-4 text-[14px] font-semibold text-gray-800 bg-white hover:bg-rose-50 hover:border-rose-200
                       rounded-[18px] border border-gray-300 shadow-sm
                       disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none
                       transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                </svg>
                <span className="hidden sm:inline">{t.readButton}</span>
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* 최근 저장 문장 미리보기 - 포근한 느낌 */}
      {latestSentence && !hasResult && (
        <div className="mt-8 p-6 bg-rose-50/30 rounded-[18px] border border-rose-100/50 shadow-sm">
          <p className="text-[13px] text-rose-600 mb-2 font-semibold">{t.recentSaved}</p>
          <p
            className="text-[15px] text-gray-900 font-normal"
            style={{
              lineHeight: '1.65',
              letterSpacing: '-0.01em',
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

