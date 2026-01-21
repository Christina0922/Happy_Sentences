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

  // Messages
  saveTodayExists: string;
  saveCancelled: string;
  readFailed: string;
  narrationFailed: string;
  playComplete: string;
  playFailed: string;
  noSentencesToPlay: string;

  // Footer
  footerText: string;

  // Guide text
  guideText: string;

  // Days of week
  weekdays: string[];
  dateFormat: (year: number, month: number, day: number, weekday: string) => string;

  // TTS Modal
  ttsModalTitle: string;
  ttsModalSubtitle: string;
  ttsBasicTitle: string;
  ttsBasicDescription: string;
  ttsPremiumTitle: string;
  ttsPremiumDescription: string;
  ttsFree: string;
  ttsAvailable: string;
  ttsDevMode: string;
  ttsCreditsRemaining: string;
  
  // TTS Paywall
  ttsPaywallTitle: string;
  ttsPaywallDescription: string;
  ttsWatchAd: string;
  ttsSubscribe: string;
  ttsBuyCredits: string;
  ttsBack: string;
  ttsAdCompleted: string;
  ttsSubscribeComingSoon: string;
  ttsBuyCreditsComingSoon: string;

  // Speech Recognition (Voice Input)
  voiceInputButton: string;
  voiceInputListening: string;
  voiceInputProcessing: string;
  voiceInputStop: string;
  voiceInputNotSupported: string;
  voiceInputPermissionDenied: string;
  voiceInputNoSpeech: string;
  voiceInputError: string;
  voiceInputSuccess: string;
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
    stopButton: '정지',

    // Narration Bar
    narrationLabel: '낭독용 문장',
    narrationStart: '낭독 시작',
    narrationStop: '낭독 정지',
    speedLabel: '속도',

    // Library
    libraryTitle: '보관함',
    savedCount: '저장한 문장',
    allFilter: '전체',
    favoritesFilter: '⭐ 즐겨찾기',
    continuousPlay: '연속 재생',
    noSentencesAll: '저장한 문장이 없어요. 홈에서 문장을 만들어보세요.',
    noSentencesFavorites: '즐겨찾기한 문장이 없어요.',
    deleteConfirm: '이 문장을 삭제할까요?',
    deleteSuccess: '문장을 삭제했어요.',
    deleteButton: '삭제',
    shareButtonLib: '공유',

    // Messages
    saveTodayExists: '오늘은 이미 저장했어요. 기존 문장을 이 문장으로 교체할까요?',
    saveCancelled: '저장을 취소했어요.',
    readFailed: '읽기에 실패했어요.',
    narrationFailed: '낭독에 실패했어요.',
    playComplete: '재생이 완료되었어요.',
    playFailed: '재생에 실패했어요.',
    noSentencesToPlay: '재생할 문장이 없어요.',

    // Footer
    footerText: '행복을 주는 문장을 만들어드립니다. 하루에 하나씩 저장해보세요.',

    // Guide text
    guideText: '단어 하나만 적어도 됩니다. 오늘의 마음을 그대로 적어보세요.',

    // Days of week
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    dateFormat: (year, month, day, weekday) => `${year}년 ${month}월 ${day}일 (${weekday})`,

    // TTS Modal
    ttsModalTitle: '읽어주기',
    ttsModalSubtitle: '읽기 방식을 선택해주세요',
    ttsBasicTitle: '기본 음성',
    ttsBasicDescription: '기기 내장 음성으로 읽어드려요',
    ttsPremiumTitle: '사람 목소리',
    ttsPremiumDescription: '더 자연스럽고 감정이 담긴 음성으로 읽어드려요',
    ttsFree: '무료',
    ttsAvailable: '사용 가능',
    ttsDevMode: '개발 모드',
    ttsCreditsRemaining: '남은 크레딧',
    
    // TTS Paywall
    ttsPaywallTitle: '고급 음성 사용하기',
    ttsPaywallDescription: '사람 목소리로 읽으려면 아래 방법 중 하나를 선택해주세요',
    ttsWatchAd: '광고 보고 30분 무료 사용',
    ttsSubscribe: '구독하고 무제한 사용',
    ttsBuyCredits: '크레딧 구매하기',
    ttsBack: '← 돌아가기',
    ttsAdCompleted: '광고 시청 완료! 30분간 고급 음성을 사용할 수 있습니다.',
    ttsSubscribeComingSoon: '구독 기능은 곧 출시됩니다!',
    ttsBuyCreditsComingSoon: '크레딧 구매 기능은 곧 출시됩니다!',

    // Speech Recognition (Voice Input)
    voiceInputButton: '말로 입력',
    voiceInputListening: '듣는 중…',
    voiceInputProcessing: '인식 중…',
    voiceInputStop: '중지',
    voiceInputNotSupported: '이 브라우저는 음성 인식을 지원하지 않습니다.',
    voiceInputPermissionDenied: '마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.',
    voiceInputNoSpeech: '음성이 감지되지 않았습니다. 다시 시도해주세요.',
    voiceInputError: '음성 인식 중 오류가 발생했습니다.',
    voiceInputSuccess: '음성 인식 완료!',
  },
  en: {
    // Header
    appTitle: 'Happy Sentences',
    appSubtitle: 'Write a sentence that makes you feel better',
    libraryButton: 'Library',
    homeButton: 'Home',

    // Composer
    inputPlaceholder: 'Even one word is enough. Write how you feel today.',
    createButton: 'Create Happy Sentences',
    creatingButton: 'Creating...',
    readButton: 'Read aloud',
    resetButton: 'Reset',
    recentSaved: 'Recently saved',
    inputAlert: 'Please enter at least one word.',

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
    narrationStart: 'Start Reading',
    narrationStop: 'Stop Reading',
    speedLabel: 'Speed',

    // Library
    libraryTitle: 'Library',
    savedCount: 'Saved sentences',
    allFilter: 'All',
    favoritesFilter: '⭐ Favorites',
    continuousPlay: 'Play All',
    noSentencesAll: 'No saved sentences yet. Create one from the home page.',
    noSentencesFavorites: 'No favorite sentences yet.',
    deleteConfirm: 'Are you sure you want to delete this sentence?',
    deleteSuccess: 'Sentence deleted.',
    deleteButton: 'Delete',
    shareButtonLib: 'Share',

    // Messages
    saveTodayExists: 'You already saved a sentence today. Replace it with this one?',
    saveCancelled: 'Save cancelled.',
    readFailed: 'Failed to read.',
    narrationFailed: 'Failed to narrate.',
    playComplete: 'Playback completed.',
    playFailed: 'Playback failed.',
    noSentencesToPlay: 'No sentences to play.',

    // Footer
    footerText: 'Create sentences that bring you happiness. Save one each day.',

    // Guide text
    guideText: 'Even one word is enough. Write how you feel today.',

    // Days of week
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dateFormat: (year, month, day, weekday) => `${weekday}, ${month}/${day}/${year}`,

    // TTS Modal
    ttsModalTitle: 'Read Aloud',
    ttsModalSubtitle: 'Choose reading mode',
    ttsBasicTitle: 'Basic Voice',
    ttsBasicDescription: 'Device built-in voice',
    ttsPremiumTitle: 'Human Voice',
    ttsPremiumDescription: 'Natural and expressive voice',
    ttsFree: 'Free',
    ttsAvailable: 'Available',
    ttsDevMode: 'Dev Mode',
    ttsCreditsRemaining: 'Credits remaining',
    
    // TTS Paywall
    ttsPaywallTitle: 'Premium Voice',
    ttsPaywallDescription: 'Choose one of the following to use premium voice',
    ttsWatchAd: 'Watch ad for 30 min free access',
    ttsSubscribe: 'Subscribe for unlimited access',
    ttsBuyCredits: 'Buy credits',
    ttsBack: '← Back',
    ttsAdCompleted: 'Ad completed! You can use premium voice for 30 minutes.',
    ttsSubscribeComingSoon: 'Subscription coming soon!',
    ttsBuyCreditsComingSoon: 'Credit purchase coming soon!',

    // Speech Recognition (Voice Input)
    voiceInputButton: 'Speak',
    voiceInputListening: 'Listening…',
    voiceInputProcessing: 'Processing…',
    voiceInputStop: 'Stop',
    voiceInputNotSupported: 'Speech recognition is not supported in this browser.',
    voiceInputPermissionDenied: 'Microphone permission is required. Please allow microphone access in browser settings.',
    voiceInputNoSpeech: 'No speech detected. Please try again.',
    voiceInputError: 'An error occurred during speech recognition.',
    voiceInputSuccess: 'Speech recognized!',
  },
};

