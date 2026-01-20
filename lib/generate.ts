import { GenerateResponse } from './schema';

/**
 * 문장 생성 API 호출
 * @param input 사용자 입력 텍스트
 * @returns 생성된 문장 데이터
 * @throws Error API 호출 실패 시
 */
export async function generateSentences(input: string): Promise<GenerateResponse> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
    throw new Error(errorData.error || '문장 생성에 실패했어요.');
  }

  return response.json();
}

