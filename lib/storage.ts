import { SavedSentence, STORAGE_KEY } from './schema';

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 저장된 모든 문장 가져오기
 */
export function getAllSentences(): SavedSentence[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedSentence[];
  } catch (error) {
    console.error('저장된 문장 불러오기 실패:', error);
    return [];
  }
}

/**
 * 오늘 저장된 문장이 있는지 확인
 */
export function getTodaySentence(): SavedSentence | null {
  const today = formatDate();
  const sentences = getAllSentences();
  return sentences.find(s => s.date === today) || null;
}

/**
 * 특정 날짜의 문장 가져오기
 */
export function getSentenceByDate(date: string): SavedSentence | null {
  const sentences = getAllSentences();
  return sentences.find(s => s.date === date) || null;
}

/**
 * 문장 저장하기 (하루 1개 제한)
 * @returns { success: boolean, message: string, sentence?: SavedSentence }
 */
export function saveSentence(
  text: string,
  variant: 'gentle' | 'clear' | 'brave'
): { success: boolean; message: string; sentence?: SavedSentence } {
  if (typeof window === 'undefined') {
    return { success: false, message: '저장할 수 없습니다.' };
  }

  try {
    const today = formatDate();
    const sentences = getAllSentences();
    
    // 오늘 이미 저장된 문장이 있는지 확인
    const existingToday = sentences.find(s => s.date === today);
    if (existingToday) {
      return {
        success: false,
        message: '오늘은 이미 저장했어요. 보관함에서 확인해 주세요.',
      };
    }

    // 새 문장 생성
    const newSentence: SavedSentence = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: today,
      text,
      variant,
      favorite: false,
      createdAt: new Date().toISOString(),
    };

    // 저장 (최신순 정렬)
    sentences.unshift(newSentence);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences));

    return {
      success: true,
      message: '보관함에 저장했어요!',
      sentence: newSentence,
    };
  } catch (error) {
    console.error('문장 저장 실패:', error);
    return {
      success: false,
      message: '저장에 실패했어요. 다시 시도해주세요.',
    };
  }
}

/**
 * 문장 교체 저장하기 (같은 날짜의 문장을 교체)
 */
export function replaceTodaySentence(
  text: string,
  variant: 'gentle' | 'clear' | 'brave'
): { success: boolean; message: string; sentence?: SavedSentence } {
  if (typeof window === 'undefined') {
    return { success: false, message: '저장할 수 없습니다.' };
  }

  try {
    const today = formatDate();
    let sentences = getAllSentences();
    
    // 오늘 저장된 문장 찾기
    const existingIndex = sentences.findIndex(s => s.date === today);
    
    if (existingIndex === -1) {
      // 없으면 새로 저장
      return saveSentence(text, variant);
    }

    // 기존 문장 교체
    const existing = sentences[existingIndex];
    const updated: SavedSentence = {
      ...existing,
      text,
      variant,
      createdAt: new Date().toISOString(),
    };

    sentences[existingIndex] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences));

    return {
      success: true,
      message: '보관함에 저장했어요! (교체됨)',
      sentence: updated,
    };
  } catch (error) {
    console.error('문장 교체 실패:', error);
    return {
      success: false,
      message: '교체에 실패했어요. 다시 시도해주세요.',
    };
  }
}

/**
 * 즐겨찾기 토글
 */
export function toggleFavorite(id: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const sentences = getAllSentences();
    const index = sentences.findIndex(s => s.id === id);
    
    if (index === -1) return false;

    sentences[index].favorite = !sentences[index].favorite;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences));
    
    return true;
  } catch (error) {
    console.error('즐겨찾기 토글 실패:', error);
    return false;
  }
}

/**
 * 문장 삭제
 */
export function deleteSentence(id: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    let sentences = getAllSentences();
    sentences = sentences.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences));
    return true;
  } catch (error) {
    console.error('문장 삭제 실패:', error);
    return false;
  }
}

/**
 * 즐겨찾기만 가져오기
 */
export function getFavoriteSentences(): SavedSentence[] {
  return getAllSentences().filter(s => s.favorite);
}

/**
 * 최근 N개 문장 가져오기
 */
export function getRecentSentences(count: number = 7): SavedSentence[] {
  return getAllSentences().slice(0, count);
}

