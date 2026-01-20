# 빠른 시작 가이드

## 1. OpenAI API Key 발급받기

1. [OpenAI 웹사이트](https://platform.openai.com/)에 접속
2. 계정 생성 및 로그인
3. API Keys 페이지로 이동
4. "Create new secret key" 클릭하여 API Key 발급

## 2. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 아래 내용을 추가하세요:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

> ⚠️ `sk-`로 시작하는 실제 API Key를 입력하세요!

## 3. 개발 서버 실행

터미널에서 다음 명령어를 실행:

```bash
npm run dev
```

## 4. 브라우저에서 확인

[http://localhost:3000](http://localhost:3000) 접속

## 자주 묻는 질문

### Q: API Key가 없어도 테스트할 수 있나요?
A: 아니요. 문장 생성 기능을 사용하려면 OpenAI API Key가 필수입니다.

### Q: API 비용이 얼마나 드나요?
A: GPT-4o-mini 모델을 사용하며, 문장 1회 생성 시 약 $0.001-0.002 정도의 비용이 발생합니다.

### Q: 낭독 기능이 작동하지 않아요
A: Web Speech API는 브라우저에 따라 지원 여부가 다릅니다. Chrome, Edge, Safari에서 정상 작동합니다.

### Q: 저장한 문장이 사라졌어요
A: localStorage를 사용하므로 브라우저 데이터를 삭제하면 문장도 함께 삭제됩니다. 중요한 문장은 별도로 백업하세요.

## 문제 해결

### 빌드 에러
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### TypeScript 에러
```bash
# TypeScript 캐시 삭제
rm -rf .next
npm run dev
```

### API 호출 실패
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. API Key가 올바른지 확인 (`sk-`로 시작)
3. 개발 서버를 재시작

## 다음 단계

프로젝트가 정상 작동하면:

1. 홈 화면에서 단어나 문장 입력
2. "행복문장 만들기" 클릭
3. 생성된 문장 확인
4. 원하는 문장 저장
5. 보관함에서 저장된 문장 관리

즐거운 사용 되세요! ✨

