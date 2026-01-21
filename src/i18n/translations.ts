export type Language = 'kr' | 'en';

export interface Translations {
  // Header
  appTitle: string;
  appSubtitle: string;
  libraryButton: string;
  homeButton: string;

  // Composer
  inputPlaceholder: string;
  createButton: string;
  creatingButton: string;
  readButton: string;
  resetButton: string;
  recentSaved: string;
  inputAlert: string;

  // Result Cards
  variantGentle: string;
  variantClear: string;
  variantBrave: string;
  saveButton: string;
  shareButton: string;
  readButtonShort: string;
  stopButton: string;

  // Narration Bar
  narrationLabel: string;
  narrationStart: string;
  narrationStop: string;
  speedLabel: string;

  // Library
  libraryTitle: string;
  savedCount: string;
  allFilter: string;
  favoritesFilter: string;
  continuousPlay: string;
  noSentencesAll: string;
  noSentencesFavorites: string;
  deleteConfirm: string;
  deleteSuccess: string;
  deleteButton: string;
  shareButtonLib: string;

  // ✅ Library Date UI (이번 에러 해결 핵심)
  weekdays: string[];
  dateFormat: (year: number, month: number, day: number, weekday: string) => string;

  // Messages
  saveTodayExists: string;
  saveCancelled: string;
  saveSuccess: string;
  saveSuccessGoToLibrary: string;
  readFailed: string;
  narrationFailed: string;
  playComplete: string;
  playFailed: string;
  noSentencesToPlay: string;

  // Footer
  footerText: string;

  // Language
  langKr: string;
  langEn: string;

  // TTS (Premium)
  ttsModalTitle: string;
  ttsBasicTitle: string;
  ttsBasicDesc: string;
  ttsPremiumTitle: string;
  ttsPremiumDesc: string;
  ttsPremiumLockedDesc: string;
  ttsWatchAd: string;
  ttsSubscribe: string;
  ttsClose: string;

  // Voice Input
  voiceInputButton: string;
  voiceInputListening: string;
  voiceInputStop: string;
  voiceInputNotSupported: string;
  voiceInputPermissionDenied: string;
  voiceInputNoSpeech: string;
  voiceInputError: string;
  voiceInputSuccess: string;

  // Ad Pass
  adWatchFailed: string;
  adPassGranted: string;
  adPassExpired: string;
  adPassRemaining: string;

  // TTS Error Messages (강화된 에러 안내)
  ttsNotSupported: string;
  ttsNoVoices: string;
  ttsNoVoicesRetry: string;
  ttsWebViewLimit: string;
  ttsGenericError: string;
  ttsCheckingVoices: string;
  ttsRetry: string;

  // Generate Error Messages (생성 에러 안내)
  generateError: string;
  generateNetworkError: string;
  generateRetry: string;
}

export const translations: Record<Language, Translations> = {
  kr: {
    // Header
    appTitle: 'Happy Sentences',
    appSubtitle: '행복을 주는 문장',
    libraryButton: '보관함',
    homeButton: '홈으로',

    // Composer
    inputPlaceholder: '단어만 적어도 됩니다. 오늘 마음을 그대로 적어보세요.',
    createButton: '행복문장 만들기',
    creatingButton: '생성 중...',
    readButton: '읽어주기',
    resetButton: '초기화',
    recentSaved: '최근 저장한 문장',
    inputAlert: '단어 하나만 적어도 됩니다.',

    // Result Cards
    variantGentle: '다정한 한 줄',
    variantClear: '현실 정리 한 줄',
    variantBrave: '용기 한 줄',
    saveButton: '저장',
    shareButton: '공유',
    readButtonShort: '읽기',
    stopButton: '중지',

    // Narration Bar
    narrationLabel: '읽기',
    narrationStart: '시작',
    narrationStop: '중지',
    speedLabel: '속도',

    // Library
    libraryTitle: '보관함',
    savedCount: '저장된 문장',
    allFilter: '전체',
    favoritesFilter: '즐겨찾기',
    continuousPlay: '연속 재생',
    noSentencesAll: '저장된 문장이 없습니다.',
    noSentencesFavorites: '즐겨찾기한 문장이 없습니다.',
    deleteConfirm: '정말 삭제할까요?',
    deleteSuccess: '삭제되었습니다.',
    deleteButton: '삭제',
    shareButtonLib: '공유',

    // ✅ Library Date UI
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    dateFormat: (year, month, day, weekday) => `${year}년 ${month}월 ${day}일(${weekday})`,

    // Messages
    saveTodayExists: '오늘 저장한 문장이 이미 있습니다.',
    saveCancelled: '저장이 취소되었습니다.',
    saveSuccess: '보관함에 저장했어요!',
    saveSuccessGoToLibrary: '보관함 보기',
    readFailed: '읽기에 실패했어요.',
    narrationFailed: '읽기 재생에 실패했어요.',
    playComplete: '연속 재생이 완료되었습니다.',
    playFailed: '연속 재생에 실패했어요.',
    noSentencesToPlay: '재생할 문장이 없습니다.',

    // Footer
    footerText: '행복을 주는 문장을 만들어드립니다. 하루에 하나씩 저장해보세요.',

    // Language
    langKr: 'KR',
    langEn: 'EN',

    // TTS (Premium)
    ttsModalTitle: '읽어주기',
    ttsBasicTitle: '기본 음성(무료)',
    ttsBasicDesc: '기기 내장 음성으로 읽어드려요.',
    ttsPremiumTitle: '사람 같은 음성(고급)',
    ttsPremiumDesc: '더 자연스럽게 읽어드려요.',
    ttsPremiumLockedDesc: '고급 음성은 광고 또는 결제 후 사용 가능합니다.',
    ttsWatchAd: '광고 보고 1회 사용',
    ttsSubscribe: '구독/결제',
    ttsClose: '닫기',

    // Voice Input
    voiceInputButton: '말로 입력',
    voiceInputListening: '듣는 중...',
    voiceInputStop: '중지',
    voiceInputNotSupported: '이 브라우저는 음성 인식을 지원하지 않습니다.',
    voiceInputPermissionDenied: '마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해 주세요.',
    voiceInputNoSpeech: '말이 감지되지 않았습니다. 다시 시도해 주세요.',
    voiceInputError: '음성 인식 중 오류가 발생했습니다.',
    voiceInputSuccess: '음성이 인식되었습니다!',

    // Ad Pass
    adWatchFailed: '광고 시청에 실패했습니다.',
    adPassGranted: '광고 시청 완료! 30분간 고급 음성을 사용할 수 있습니다.',
    adPassExpired: '광고 1회권이 만료되었습니다.',
    adPassRemaining: '남은 시간: ',

    // TTS Error Messages (강화된 에러 안내)
    ttsNotSupported: '이 환경에서는 읽어주기를 지원하지 않습니다.',
    ttsNoVoices: '사용 가능한 음성이 없습니다. 브라우저나 앱 설정을 확인해주세요.',
    ttsNoVoicesRetry: '음성 목록을 불러오는 중입니다. 잠시 후 다시 시도해주세요.',
    ttsWebViewLimit: '앱에서는 읽어주기가 제한될 수 있습니다. 웹 브라우저를 사용해보세요.',
    ttsGenericError: '읽어주기에 실패했습니다. 다시 시도해주세요.',
    ttsCheckingVoices: '음성 확인 중...',
    ttsRetry: '다시 시도',

    // Generate Error Messages (생성 에러 안내)
    generateError: '문장 생성에 실패했어요. 다시 시도해주세요.',
    generateNetworkError: '네트워크 연결을 확인해주세요.',
    generateRetry: '다시 만들기',
  },

  en: {
    // Header
    appTitle: 'Happy Sentences',
    appSubtitle: 'Create sentences that lift you up',
    libraryButton: 'Saved',
    homeButton: 'Home',

    // Composer
    inputPlaceholder: 'Even one word is enough. Write how you feel today.',
    createButton: 'Create Happy Sentences',
    creatingButton: 'Creating...',
    readButton: 'Read aloud',
    resetButton: 'Reset',
    recentSaved: 'Recent saved',
    inputAlert: 'Please enter at least one line.',

    // Result Cards
    variantGentle: 'Gentle',
    variantClear: 'Clear',
    variantBrave: 'Brave',
    saveButton: 'Save',
    shareButton: 'Share',
    readButtonShort: 'Read',
    stopButton: 'Stop',

    // Narration Bar
    narrationLabel: 'Narration',
    narrationStart: 'Start',
    narrationStop: 'Stop',
    speedLabel: 'Speed',

    // Library
    libraryTitle: 'Saved',
    savedCount: 'Saved sentences',
    allFilter: 'All',
    favoritesFilter: 'Favorites',
    continuousPlay: 'Continuous play',
    noSentencesAll: 'No saved sentences.',
    noSentencesFavorites: 'No favorite sentences.',
    deleteConfirm: 'Delete this sentence?',
    deleteSuccess: 'Deleted.',
    deleteButton: 'Delete',
    shareButtonLib: 'Share',

    // ✅ Library Date UI
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dateFormat: (year, month, day, weekday) => `${weekday}, ${month}/${day}/${year}`,

    // Messages
    saveTodayExists: 'You already saved a sentence today.',
    saveCancelled: 'Save cancelled.',
    saveSuccess: 'Saved to library!',
    saveSuccessGoToLibrary: 'Go to library',
    readFailed: 'Failed to read aloud.',
    narrationFailed: 'Failed to play narration.',
    playComplete: 'Continuous play completed.',
    playFailed: 'Continuous play failed.',
    noSentencesToPlay: 'There are no sentences to play.',

    // Footer
    footerText: 'We create sentences that lift you up. Save one each day.',

    // Language
    langKr: 'KR',
    langEn: 'EN',

    // TTS (Premium)
    ttsModalTitle: 'Read aloud',
    ttsBasicTitle: 'Basic voice (Free)',
    ttsBasicDesc: 'Reads using your device voice.',
    ttsPremiumTitle: 'Premium voice',
    ttsPremiumDesc: 'Sounds more natural.',
    ttsPremiumLockedDesc: 'Premium voice is available after watching an ad or purchasing.',
    ttsWatchAd: 'Watch an ad (1 use)',
    ttsSubscribe: 'Subscribe / Purchase',
    ttsClose: 'Close',

    // Voice Input
    voiceInputButton: 'Speak',
    voiceInputListening: 'Listening...',
    voiceInputStop: 'Stop',
    voiceInputNotSupported: 'Speech recognition is not supported in this browser.',
    voiceInputPermissionDenied: 'Microphone permission is required. Please allow microphone access in browser settings.',
    voiceInputNoSpeech: 'No speech detected. Please try again.',
    voiceInputError: 'An error occurred during speech recognition.',
    voiceInputSuccess: 'Speech recognized!',

    // Ad Pass
    adWatchFailed: 'Failed to watch ad.',
    adPassGranted: 'Ad complete! Premium voice is available for 30 minutes.',
    adPassExpired: 'Ad pass expired.',
    adPassRemaining: 'Time remaining: ',

    // TTS Error Messages (강화된 에러 안내)
    ttsNotSupported: 'Read aloud is not supported in this environment.',
    ttsNoVoices: 'No voices available. Please check your browser or app settings.',
    ttsNoVoicesRetry: 'Loading voices... Please try again in a moment.',
    ttsWebViewLimit: 'Read aloud may be limited in the app. Try using a web browser.',
    ttsGenericError: 'Failed to read aloud. Please try again.',
    ttsCheckingVoices: 'Checking voices...',
    ttsRetry: 'Retry',

    // Generate Error Messages (생성 에러 안내)
    generateError: 'Failed to generate sentences. Please try again.',
    generateNetworkError: 'Please check your network connection.',
    generateRetry: 'Try again',
  },
};
