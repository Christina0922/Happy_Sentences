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
 * 한국어 문장 생성 시스템 프롬프트
 * 종교/치료/뻔한 위로를 철저히 배제하고, 담백하고 따뜻한 톤을 유지
 */
const SYSTEM_PROMPT_KR = `당신은 사용자의 감정과 상황을 다정하게 이해하고, 행복과 안정을 주는 짧은 문장을 만드는 전문가입니다.

핵심 규칙:
1. 사용자 입력의 단어를 1~2개는 반드시 포함하여 개인화
2. 세 가지 결을 만들어야 합니다:
   - gentle: 다정하고 공감하는 한 줄 (20~60자)
   - clear: 현실을 담백하게 정리하는 한 줄 (20~60자)
   - brave: 작은 용기를 주는 한 줄, 아주 작은 행동 제안 가능 (20~60자)
3. narration: 낭독용 문장으로 쉼표와 호흡을 고려한 1~2문장 (40~120자)
4. keywords: 사용자 입력에서 추출한 핵심 키워드 3~10개
5. safety: 종교/의료 표현 사용 여부 체크 (false여야 함)

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

반드시 아래 JSON 형식으로만 응답하세요:
{
  "lines": {
    "gentle": "다정한 문장",
    "clear": "현실 정리 문장",
    "brave": "용기를 주는 문장"
  },
  "narration": "낭독용 문장",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "safety": {
    "noReligion": true,
    "noMedical": true
  },
  "summary": "선택적 요약"
}`;

/**
 * 영어 문장 생성 시스템 프롬프트
 * 영어로만 출력, 짧고 명료한 문장
 */
const SYSTEM_PROMPT_EN = `You are an expert at creating short, comforting sentences that bring happiness and peace to users.

Core Rules:
1. Include 1-2 words from user input for personalization
2. Create three types of sentences:
   - gentle: Warm and empathetic sentence (14~22 words)
   - clear: Reality-oriented, calm sentence (14~22 words)
   - brave: Encouraging sentence with small action suggestion (14~22 words)
3. narration: 1-2 sentences for reading aloud, considering pauses (20~40 words)
4. keywords: 3~10 key words extracted from user input
5. safety: Check if religious/medical expressions are used (must be false)

Absolutely Forbidden:
- Religious/spiritual expressions (pray, blessing, god, fate, universe, etc.)
- Medical/diagnosis/treatment/drug advice
- Overly definitive statements ("You must...", "Definitely..." etc.)
- Cliche consolations alone ("Cheer up", "Don't worry", "It'll be fine")
- Exaggerated expressions

Recommended Tone:
- Warm but simple
- Short and clear
- Genuine without exaggeration
- Specific and practical

Output Language:
- ALL sentences MUST be in English
- NO Korean characters allowed
- Use simple, everyday English words

You MUST respond in this exact JSON format:
{
  "lines": {
    "gentle": "gentle sentence in English",
    "clear": "clear sentence in English",
    "brave": "brave sentence in English"
  },
  "narration": "narration sentence in English",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "safety": {
    "noReligion": true,
    "noMedical": true
  },
  "summary": "optional summary"
}`;

/**
 * POST /api/generate
 * 사용자 입력을 받아 3개의 문장 + 낭독용 1개를 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, lang } = body;

    // lang 파라미터 검증 및 기본값 설정
    const language: 'kr' | 'en' = lang === 'en' ? 'en' : 'kr';
    
    if (!lang) {
      console.warn('[Generate API] ⚠️ lang parameter missing, defaulting to "kr"');
    }
    
    console.log(`[Generate API] Language: ${language}, Input: ${input?.substring(0, 20)}...`);

    // 입력 검증
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json(
        { error: language === 'en' ? 'Please enter at least one word.' : '단어 하나만 적어도 됩니다.' },
        { status: 400 }
      );
    }

    if (input.length > 1000) {
      return NextResponse.json(
        { error: language === 'en' ? 'Please keep it a bit shorter.' : '내용을 조금만 짧게 적어주세요.' },
        { status: 400 }
      );
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY가 설정되지 않았습니다.');
      console.error('환경 변수:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다. .env.local 파일에 OPENAI_API_KEY를 설정해주세요.' },
        { status: 500 }
      );
    }
    
    console.log(`[Generate API] API 키 확인됨, 문장 생성 시작 (lang: ${language}):`, input);

    // 언어별 프롬프트 선택
    const systemPrompt = language === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_KR;
    const userPromptTemplate = language === 'en'
      ? `User input: "${input}"\n\nBased on the input above, respond in the exact JSON format below:\n{\n  "lines": { "gentle": "sentence", "clear": "sentence", "brave": "sentence" },\n  "narration": "narration sentence",\n  "keywords": ["keywords"],\n  "safety": { "noReligion": true, "noMedical": true }\n}\n\nIMPORTANT: All sentences MUST be in English. NO Korean characters.`
      : `사용자 입력: "${input}"\n\n위 입력을 바탕으로 정확히 아래 JSON 형식으로 응답해주세요:\n{\n  "lines": { "gentle": "문장", "clear": "문장", "brave": "문장" },\n  "narration": "낭독용 문장",\n  "keywords": ["키워드들"],\n  "safety": { "noReligion": true, "noMedical": true }\n}`;

    // OpenAI API 호출 (JSON 모드 강제)
    const openai = getOpenAIClient();
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: userPromptTemplate,
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
      console.log('OpenAI 원본 응답:', responseText);
      parsedResponse = JSON.parse(responseText);
      console.log('파싱된 응답:', JSON.stringify(parsedResponse, null, 2));
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      
      // 재시도 1회
      try {
        const retrySystemPrompt = systemPrompt + (language === 'en'
          ? '\n\nCRITICAL: Output ONLY valid JSON. No comments or extra explanations. Pure JSON only.'
          : '\n\n중요: 반드시 유효한 JSON만 출력하세요. 주석이나 추가 설명 없이 순수 JSON만 반환하세요.');
        
        const retryCompletion = await getOpenAIClient().chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: retrySystemPrompt },
            {
              role: 'user',
              content: userPromptTemplate,
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

