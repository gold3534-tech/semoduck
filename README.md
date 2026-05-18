# 세모덕 Semoduck

세모덕은 "세상의 모든 덕질"을 모으는 팬덤 커뮤니티 플랫폼입니다. 사용자는 관심사별 갤러리에서 게시글, 후기, 교환/양도 정보를 공유하고 관련 굿즈와 외부 구매 링크를 탐색할 수 있습니다.

GitHub description:
A fandom community platform that connects fan discussions, goods reviews, marketplace posts, and external merchandise links.

## 주요 기능
- Google OAuth 기반 Supabase 로그인
- 관심사 온보딩
- 팬덤/취미별 갤러리와 게시글 상세
- 글쓰기 화면의 AI 태그 추천, 굿즈 키워드 추출 mock
- 굿즈 목록/상세와 판매처별 가격 비교
- 공식샵, 네이버 쇼핑, 쿠팡, 유저 제보, 자체 마켓 offer 구조
- 교환/양도/중고 자체 게시판
- 마이페이지와 관리자 mock 화면

## 기술 스택
- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth, Supabase Postgres
- Next.js Route Handlers
- Ollama compatible AI service with mock fallback

## 실행 방법
```bash
npm.cmd install
npm.cmd run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경변수
`.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
COUPANG_ACCESS_KEY=
COUPANG_SECRET_KEY=
COUPANG_PARTNER_ID=
```

## Supabase 설정
1. Supabase 프로젝트를 생성합니다.
2. Authentication > Providers에서 Google provider를 켭니다.
3. Redirect URL에 `http://localhost:3000/auth/callback`을 추가합니다.
4. SQL Editor에서 `supabase/schema.sql`, `supabase/seed.sql` 순서로 실행합니다.
5. Supabase URL과 anon key를 `.env.local`에 입력합니다.

## 테스트 계정
Supabase Google 로그인을 사용하므로 실제 Google 계정으로 로그인합니다. seed용 관리자 권한은 `profiles.role`을 `admin`으로 변경해 테스트할 수 있습니다.

## AI 기능
`/api/ai/extract-tags`, `/api/ai/extract-product-keywords`, `/api/ai/summarize-gallery`는 Ollama가 있으면 JSON 응답을 시도하고, 없거나 실패하면 안전한 mock JSON을 반환합니다.

## 외부 상품 API/mock 처리
`/api/products/external-search`는 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`이 있으면 네이버 쇼핑 검색 API를 호출하고 내부 offer 형태로 정규화합니다. 키가 없거나 호출에 실패하면 mock offer를 반환합니다. 쿠팡은 직접 결제 없이 외부 링크를 새 탭으로 여는 구조로 남겨두었고, 공식샵 링크는 관리자 수동 등록 구조로 확장합니다.

## 중고거래 플랫폼 크롤링 제외
당근마켓, 번개장터, 중고나라 같은 중고거래 플랫폼은 크롤링하지 않습니다. 세모덕은 외부 검색 링크, 유저 제보 링크, 자체 교환/양도/중고 게시판만 제공합니다.

## 주요 화면
- `/`: 홈, 인기글, 추천 굿즈, 급상승 키워드, AI 요약
- `/onboarding`: 관심사 선택
- `/galleries`: 갤러리 목록
- `/galleries/sanrio`: 갤러리 상세
- `/posts/p1`: 게시글 상세
- `/posts/new`: 글쓰기와 AI 보조
- `/goods`: 굿즈 목록
- `/goods/prod1`: 굿즈 상세
- `/market`: 자체 마켓 게시판
- `/mypage`: 사용자 활동
- `/admin`: 관리자 mock 화면

## 향후 개선
- Supabase CRUD를 mock 데이터 대신 실제 테이블에 연결
- 관리자 role guard 강화
- React Query/Zustand 도입
- 실제 네이버 쇼핑 API와 쿠팡 파트너스 API 연동
- 이미지 업로드 스토리지 연결
- 테스트 자동화
