/**
 * 문장 호흡 가공
 * 감정에 맞는 멈춤과 호흡을 추가하여 자연스러운 읽기 구현
 */

import { PauseStyle } from './emotionProfiles';

// 의미 단위 연결어 (앞뒤로 쉼표 삽입 후보)
const CONNECTORS = [
  '하지만', '그래도', '그래서', '그리고', '그러니', '즉',
  '또한', '그런데', '그러나', '따라서', '그러므로',
  '그렇지만', '그럼에도', '그래야', '그랬다면',
];

/**
 * 문장 호흡 적용
 * @param text 원본 텍스트
 * @param pauseStyle 멈춤 스타일
 * @returns 호흡이 적용된 텍스트
 */
export function applyBreathing(text: string, pauseStyle: PauseStyle): string {
  console.log(`[Breathing] Applying ${pauseStyle} style to text (len: ${text.length})`);
  
  let result = text;

  // 1. 문장 끝에 짧은 멈춤 유도 (공백 추가)
  result = result.replace(/([.!?])\s*/g, '$1 ');

  // 2. pauseStyle에 따른 처리
  switch (pauseStyle) {
    case 'SOFT':
      // 부드러운 멈춤: 최소한의 쉼표만 유지
      result = applySoftBreathing(result);
      break;

    case 'NORMAL':
      // 자연스러운 멈춤: 적절한 쉼표 추가
      result = applyNormalBreathing(result);
      break;

    case 'STRONG':
      // 강한 멈춤: 의미 단위마다 쉼표 추가
      result = applyStrongBreathing(result);
      break;
  }

  // 3. 연속 공백 정리
  result = result.replace(/\s{2,}/g, ' ').trim();

  console.log(`[Breathing] Result (len: ${result.length}):`, result.substring(0, 50) + '...');
  return result;
}

/**
 * SOFT 스타일: 부드러운 멈춤
 * - 기존 쉼표 유지
 * - 연결어 앞에만 쉼표 추가 (선택적)
 */
function applySoftBreathing(text: string): string {
  let result = text;

  // 연결어 앞에 쉼표가 없으면 추가 (단, 이미 쉼표가 있으면 생략)
  for (const connector of CONNECTORS) {
    const regex = new RegExp(`([^,\\s])\\s+(${connector})`, 'g');
    result = result.replace(regex, '$1, $2');
  }

  return result;
}

/**
 * NORMAL 스타일: 자연스러운 멈춤
 * - 연결어 앞뒤로 쉼표 추가
 * - 긴 문장(40자 이상)은 중간에 쉼표 추가
 */
function applyNormalBreathing(text: string): string {
  let result = text;

  // 연결어 앞뒤로 쉼표 추가
  for (const connector of CONNECTORS) {
    // 앞에 쉼표
    const regexBefore = new RegExp(`([^,\\s])\\s+(${connector})`, 'g');
    result = result.replace(regexBefore, '$1, $2');

    // 뒤에 쉼표 (이미 있으면 생략)
    const regexAfter = new RegExp(`(${connector})\\s+([^,\\s])`, 'g');
    result = result.replace(regexAfter, '$1, $2');
  }

  // 긴 문장 분할 (40자 이상)
  if (result.length > 40 && !result.includes(',')) {
    // 중간 지점 찾기 (공백 기준)
    const midPoint = Math.floor(result.length / 2);
    const spaceIndex = result.indexOf(' ', midPoint);
    
    if (spaceIndex > 0 && spaceIndex < result.length - 10) {
      result = result.substring(0, spaceIndex) + ',' + result.substring(spaceIndex);
    }
  }

  return result;
}

/**
 * STRONG 스타일: 강한 멈춤
 * - 모든 연결어에 쉼표
 * - 긴 구절(20자 이상)마다 쉼표 추가
 */
function applyStrongBreathing(text: string): string {
  let result = text;

  // 연결어 앞뒤로 쉼표 추가
  for (const connector of CONNECTORS) {
    const regexBefore = new RegExp(`([^,\\s])\\s+(${connector})`, 'g');
    result = result.replace(regexBefore, '$1, $2');

    const regexAfter = new RegExp(`(${connector})\\s+([^,\\s])`, 'g');
    result = result.replace(regexAfter, '$1, $2');
  }

  // 긴 구절 분할 (20자마다)
  if (result.length > 20) {
    const parts = result.split(/[,.!?]/);
    const processedParts = parts.map(part => {
      if (part.trim().length > 20) {
        // 중간에 쉼표 추가
        const midPoint = Math.floor(part.length / 2);
        const spaceIndex = part.indexOf(' ', midPoint);
        
        if (spaceIndex > 0) {
          return part.substring(0, spaceIndex) + ',' + part.substring(spaceIndex);
        }
      }
      return part;
    });
    
    result = processedParts.join('. ').replace(/\.\./g, '.');
  }

  return result;
}

/**
 * 호흡 제거 (원본 복원)
 */
export function removeBreathing(text: string): string {
  return text
    .replace(/,\s*/g, ' ')  // 쉼표 제거
    .replace(/\s{2,}/g, ' ')  // 연속 공백 정리
    .trim();
}

