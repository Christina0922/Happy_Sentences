import { z } from 'zod';

/**
 * 문장 생성 API 응답 스키마
 * OpenAI 응답을 검증하고 타입 안전성을 보장합니다
 */
export const GenerateResponseSchema = z.object({
  summary: z.string().optional(),
  lines: z.object({
    gentle: z.string().min(10).max(120), // 다정한 한 줄 (20~60자 목표)
    clear: z.string().min(10).max(120),  // 현실 정리 한 줄
    brave: z.string().min(10).max(120),  // 용기 한 줄
  }),
  narration: z.string().min(20).max(200), // 낭독용 문장 (40~120자 목표)
  keywords: z.array(z.string()).min(3).max(10),
  safety: z.object({
    noReligion: z.boolean(),
    noMedical: z.boolean(),
  }),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

/**
 * 저장된 문장 타입
 */
export interface SavedSentence {
  id: string;
  date: string; // YYYY-MM-DD
  text: string; // 저장된 문장
  variant: 'gentle' | 'clear' | 'brave'; // A/B/C 중 어느 것을 저장했는지
  favorite: boolean;
  createdAt: string; // ISO 8601
}

/**
 * localStorage 키
 */
export const STORAGE_KEY = 'happy_sentences_saved';

