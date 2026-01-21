/**
 * TTS 진단 상태 저장소
 * 개발 환경에서 TTS 동작 상태를 추적하고 디버깅을 지원
 */

export type TtsAction = 'idle' | 'preload' | 'speak' | 'cancel' | 'end' | 'error';
export type TtsLanguage = 'kr' | 'en' | null;
export type TtsEmotion = 'CALM' | 'COMFORT' | 'ENCOURAGE' | 'HOPE' | 'JOY' | 'FIRM' | null;

export interface TtsError {
  code?: string;
  message?: string;
  time: number;
}

export interface TtsStatus {
  // 지원 여부
  supported: boolean;
  
  // 음성 목록
  voicesLoaded: boolean;
  voicesCount: number;
  
  // 선택된 음성
  selectedVoiceName: string | null;
  selectedVoiceLang: string | null;
  
  // 현재 상태
  speaking: boolean;
  pending: boolean;
  
  // 마지막 액션
  lastAction: TtsAction;
  lastError: TtsError | null;
  
  // 마지막 재생 정보
  lastSpokenTextLen: number;
  lastSpokenLang: TtsLanguage;
  
  // 감정 정보
  currentEmotion: TtsEmotion;
  
  // 업데이트 시간
  lastUpdated: number;
}

// 초기 상태
const initialStatus: TtsStatus = {
  supported: false,
  voicesLoaded: false,
  voicesCount: 0,
  selectedVoiceName: null,
  selectedVoiceLang: null,
  speaking: false,
  pending: false,
  lastAction: 'idle',
  lastError: null,
  lastSpokenTextLen: 0,
  lastSpokenLang: null,
  currentEmotion: null,
  lastUpdated: Date.now(),
};

// 전역 상태 (싱글톤)
let ttsStatus: TtsStatus = { ...initialStatus };

// 상태 변경 리스너들
type StatusListener = (status: TtsStatus) => void;
const listeners: Set<StatusListener> = new Set();

/**
 * 현재 TTS 상태 반환
 */
export function getTtsStatus(): TtsStatus {
  return { ...ttsStatus };
}

/**
 * TTS 상태 업데이트
 */
export function updateTtsStatus(partial: Partial<TtsStatus>): void {
  ttsStatus = {
    ...ttsStatus,
    ...partial,
    lastUpdated: Date.now(),
  };
  
  // 모든 리스너에게 알림
  notifyListeners();
}

/**
 * TTS 상태 리셋
 */
export function resetTtsStatus(): void {
  ttsStatus = { ...initialStatus, lastUpdated: Date.now() };
  notifyListeners();
}

/**
 * 상태 변경 리스너 등록
 */
export function addTtsStatusListener(listener: StatusListener): () => void {
  listeners.add(listener);
  
  // 제거 함수 반환
  return () => {
    listeners.delete(listener);
  };
}

/**
 * 모든 리스너에게 알림
 */
function notifyListeners(): void {
  const currentStatus = getTtsStatus();
  listeners.forEach(listener => {
    try {
      listener(currentStatus);
    } catch (error) {
      console.error('[TTS Diagnostics] Listener error:', error);
    }
  });
}

/**
 * 에러 기록
 */
export function recordTtsError(code: string, message: string): void {
  updateTtsStatus({
    lastAction: 'error',
    lastError: {
      code,
      message,
      time: Date.now(),
    },
  });
  
  console.error(`[TTS Diagnostics] Error: ${code} - ${message}`);
}

/**
 * 액션 기록
 */
export function recordTtsAction(action: TtsAction, details?: Partial<TtsStatus>): void {
  updateTtsStatus({
    lastAction: action,
    ...details,
  });
  
  console.log(`[TTS Diagnostics] Action: ${action}`, details || '');
}

/**
 * 진단 정보 출력 (콘솔)
 */
export function logTtsDiagnostics(): void {
  console.group('[TTS Diagnostics] Current Status');
  console.table(ttsStatus);
  console.groupEnd();
}

