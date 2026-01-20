import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GenerateResponseSchema } from '@/lib/schema';

/**
 * OpenAI 클라이언트를 런타임에 생성
 * 빌드 타임에 환경변수가 없어도 에러가 나지 않도록 함
 */
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * 문장 생성 시스템 프롬프트
 * 종교/치료/뻔한 위로를 철저히 배제하고, 담백하고 따뜻한 톤을 유지
 */
const SYSTEM_PROMPT = `당신은 사용자의 감정과 상황을 다정하게 이해하고, 행복과 안정을 주는 짧은 문장을 만드는 전문가입니다.

핵심 규칙:
1. 사용자 입력의 단어를 1~2개는 반드시 포함하여 개인화
2. 세 가지 결을 만들어야 합니다:
   - gentle: 다정하고 공감하는 한 줄 (20~60자)
   - clear: 현실을 담백하게 정리하는 한 줄 (20~60자)
   - brave: 작은 용기를 주는 한 줄, 아주 작은 행동 제안 가능 (20~60자)
3. narration: 낭독용 문장으로 쉼표와 호흡을 고려한 1~2문장 (40~120자)

절대 금지:
- 종교/영성 표현 (기도, 축복, 신, 운명, 우주 등)
- 의료/진단/치료/약물 조언
- 과한 단정 ("당신은 반드시...", "틀림없이..." 등)
- 뻔한 위로 ("힘내세요", "괜찮아요", "잘될 거예요" 단독 사용)
- 과장된 표현

권장 톤:
- 담백하고 따뜻함
- 짧고 또렷함
- 과장 없이 진솔함
- 구체적이고 실용적

반드시 JSON만 응답하세요. 다른 설명 없이 오직 JSON만 출력하세요.`;

/**
 * POST /api/generate
 * 사용자 입력을 받아 3개의 문장 + 낭독용 1개를 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    // 입력 검증
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json(
        { error: '단어 하나만 적어도 됩니다.' },
        { status: 400 }
      );
    }

    if (input.length > 1000) {
      return NextResponse.json(
        { error: '내용을 조금만 짧게 적어주세요.' },
        { status: 400 }
      );
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서비스 설정에 문제가 있습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // OpenAI API 호출 (JSON 모드 강제)
    const openai = getOpenAIClient();
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `사용자 입력: "${input}"\n\n위 입력을 바탕으로 행복 문장 3개(gentle, clear, brave)와 낭독용 문장 1개를 만들어주세요. 반드시 JSON 형식으로만 응답하세요.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 800,
      });
    } catch (apiError: unknown) {
      console.error('OpenAI API 호출 실패:', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      return NextResponse.json(
        { 
          error: '문장 생성에 실패했어요. 잠시 후 다시 시도해주세요.',
          details: errorMessage 
        },
        { status: 500 }
      );
    }

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: '문장 생성에 실패했어요. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // JSON 파싱 시도
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      
      // 재시도 1회
      try {
        const retryCompletion = await getOpenAIClient().chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + '\n\n중요: 반드시 유효한 JSON만 출력하세요. 주석이나 추가 설명 없이 순수 JSON만 반환하세요.' },
            {
              role: 'user',
              content: `사용자 입력: "${input}"\n\n위 입력을 바탕으로 행복 문장 3개(gentle, clear, brave)와 낭독용 문장 1개를 만들어주세요.`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 800,
        });

        const retryText = retryCompletion.choices[0]?.message?.content;
        if (retryText) {
          parsedResponse = JSON.parse(retryText);
        } else {
          throw new Error('재시도 응답이 비어있습니다');
        }
      } catch (retryError) {
        console.error('재시도 실패:', retryError);
        return NextResponse.json(
          { error: '문장 생성에 실패했어요. 내용을 조금만 짧게 적어주세요.' },
          { status: 500 }
        );
      }
    }

    // Zod 스키마로 검증
    const validationResult = GenerateResponseSchema.safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error('스키마 검증 실패:', validationResult.error);
      return NextResponse.json(
        { error: '문장 생성에 실패했어요. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json(validationResult.data);

  } catch (error) {
    console.error('예상치 못한 오류:', error);
    return NextResponse.json(
      { error: '문장 생성에 실패했어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

