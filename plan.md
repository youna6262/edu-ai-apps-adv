# 구현 계획

[spec.md](./spec.md)의 퀴즈 생성기와 학습활동 추천을 작업 5개로 나누어 만든다.
코드는 작업 1부터 순서대로 쓰고, 각 작업은 완료 조건을 모두 확인한 뒤 다음으로 넘어간다.

## 두 기능이 함께 쓰는 것

| 대상 | 함께 쓰는가 | 파일 | 기능마다 다른 점 |
| --- | --- | --- | --- |
| 입력 폼 구조 | 예 | `public/quiz.html`, `public/activity.html`, `public/app.js` | 입력 항목, 버튼 이름 (퀴즈 만들기 / 활동 추천) |
| 결과 카드 | 예 | `public/app.js`, `public/styles.css` | 세 칸(제목·내용·덧붙임)에 들어가는 값 |
| 입력 검사 | 예 | `public/js/form-check.js` | 없음 (규칙은 입력란의 속성으로 정한다) |
| CSV 변환 | 예 | `public/js/csv.js` | 열 이름 |
| 결과 검증 | 예 | `public/js/validate.js` (`api/validate.js`가 그대로 내보낸다) | 함수 (`validate` / `validateActivities`) |
| 서버 함수 | 예 | `api/generate.js` | AI에 보내는 지시문, 응답 검사 항목 |

## 작업 목록

### 작업 1. 입력 검사와 CSV 변환

- 진행 상태: 입력 검사(`package.json`, `public/js/form-check.js`, `tests/form-check.test.js`)는 끝났다. 나머지가 남았다.
- 파일: `package.json`, `.gitignore`, `.env.example`, `public/js/form-check.js`, `public/js/csv.js`, `tests/form-check.test.js`, `tests/csv.test.js`
- 할 일
  - `npm test`가 `node:test`로 `tests/` 폴더를 실행하게 한다.
  - `.env`를 `.gitignore`에 넣고, `.env.example`에는 환경변수 이름 3개만 적는다.
  - 입력 검사: 필수 항목이 비었는지, 숫자 항목이 범위 안인지 확인하고 항목 이름이 들어간 안내 문구를 돌려준다.
  - CSV 변환: 결과 목록을 UTF-8 BOM으로 시작하는 CSV 글자로 바꾼다. 열 이름은 기능에 따라 고른다.
- 완료 조건
  1. `npm test`가 실패 0개로 끝난다.
  2. 과목을 비우면 "과목을 입력하세요"가 나오고, 문항 수 0, 11, 2.5와 활동 시간 0은 모두 거부된다.
  3. CSV 결과의 첫 3바이트가 EF BB BF이고, 첫 줄이 spec.md의 열 이름과 같다.
  4. 결과 3개를 넣으면 CSV의 둘째 줄부터 3줄이 나오고 순서와 각 칸의 값이 입력과 같다.
- 확인하는 수용 기준: 퀴즈 3·4, 학습활동 3·4

### 작업 2. 서버 함수

- 진행 상태: AI 응답 검사(`public/js/validate.js`, `api/validate.js`, `tests/validate.test.js`)는 끝났다. `api/generate.js`가 남았다.
- 파일: `api/generate.js`, `api/validate.js`, `public/js/validate.js`, `tests/generate.test.js`, `tests/validate.test.js`
- 할 일
  - 요청에 담긴 기능 이름(퀴즈 / 학습활동)에 따라 AI에 보낼 지시문을 고른다.
  - `AI_ENDPOINT`, `AI_API_KEY`, `AI_DEPLOYMENT`를 `process.env`로만 읽는다.
  - 입력을 작업 1과 같은 규칙으로 다시 검사한다.
  - AI 응답을 검사한다. 퀴즈는 문항 수가 요청과 같은지, 보기가 문항 유형에 맞는지, 정답이 보기 중 하나인지 본다. 학습활동은 활동이 3개인지, 소요 시간이 1 이상이고 입력한 활동 시간을 넘지 않는지 본다.
  - 검사를 통과하지 못하거나 AI 호출이 실패하면 오류 응답을 돌려준다.
- 완료 조건
  1. `npm test`가 실패 0개로 끝난다. 테스트는 가짜 AI 응답을 쓰고 실제 AI를 호출하지 않는다.
  2. 4지선다 퀴즈 3개를 요청하면 문제·보기 4개·정답·해설이 모두 있는 문항 3개가 온다.
  3. 학습활동을 요청하면 활동 이름·진행 순서·소요 시간·준비물이 모두 있는 활동 3개가 온다.
  4. AI 응답의 개수가 모자라거나 정답이 보기에 없으면 오류 응답이 온다.
  5. 환경변수가 하나라도 없으면 오류 응답이 온다.
  6. `api/` 폴더에서 API 키 값을 검색하면 0건이다.
- 확인하는 수용 기준: 퀴즈 1·2, 학습활동 1·2

### 작업 3. 화면

- 진행 상태: 화면 뼈대, 입력 검사 표시, 768px 이하 배치, 문항·활동 카드, 생성 중·실패 상태는 끝났다. 지금은 AI를 부르지 않고 `public/mock/`의 예시 자료를 검증한 뒤 카드로 보여 준다. `api/generate.js` 연결과 CSV 내려받기가 남았다.
- 파일: `public/index.html`, `public/quiz.html`, `public/activity.html`, `public/styles.css`, `public/app.js`
- 할 일
  - `index.html`에 사이드바 메뉴와 기능 안내를 두고, 기능마다 페이지 하나(`quiz.html`, `activity.html`)를 둔다.
  - 두 페이지는 같은 입력 폼 구조와 같은 결과 카드 틀(제목·내용·덧붙임)을 쓴다.
  - 입력 검사에 걸리면 요청을 보내지 않고 입력란 아래에 안내 문구를 보여 준다.
  - 오류 응답이 오면 오류 안내 문구를 보여 주고 입력값은 그대로 둔다.
  - CSV 내려받기 버튼을 둔다.
- 완료 조건 (`npx vercel dev`로 띄운 화면을 브라우저에서 확인)
  1. 퀴즈는 문항 수에 3을 넣고 버튼을 누르면 카드가 3장 나오고, 학습활동은 버튼을 누르면 카드가 3장 나온다.
  2. 두 페이지의 입력 항목이 spec.md의 입력 목록과 이름·순서가 같다.
  3. 두 기능의 카드 모두 제목·내용·덧붙임 세 칸이 같은 순서로 나온다.
  4. 과목을 비우고 버튼을 누르면 과목 입력란 아래에 "과목을 입력하세요"가 나오고, 브라우저 네트워크 기록에 요청이 없다.
  5. 서버 함수가 오류를 돌려주면 오류 안내 문구가 나오고, 입력값이 모두 남아 있으며, 버튼을 다시 누를 수 있다.
  6. CSV 내려받기를 누르면 파일이 저장되고, 줄 수와 순서가 화면의 카드와 같다.
  7. 화면 너비 768px, 375px, 320px에서 가로 스크롤이 생기지 않는다.
- 확인하는 수용 기준: 퀴즈 1~5, 학습활동 1~6

### 작업 4. 저장소와 자동 테스트

- 파일: `.github/workflows/test.yml`
- 할 일
  - `git init` 뒤 첫 커밋을 만든다.
  - `gh repo create`로 GitHub 저장소를 만들고 올린다.
  - GitHub Actions가 push와 pull request마다 `npm test`를 실행하게 한다.
- 완료 조건
  1. `gh repo view`가 저장소 정보를 보여 준다.
  2. `gh run list`의 가장 최근 실행이 success다.
  3. `git ls-files .env`의 결과가 비어 있다.

### 작업 5. Vercel 배포

- 파일: 없음 (Vercel 설정만 한다)
- 할 일
  - Vercel에 GitHub 저장소를 연결한다.
  - Vercel에 환경변수 `AI_ENDPOINT`, `AI_API_KEY`, `AI_DEPLOYMENT`를 등록한다.
  - 배포한다.
- 완료 조건
  1. 배포 주소를 브라우저에서 열면 입력 폼이 나온다.
  2. 배포 주소에서 퀴즈는 문항 수 3을 넣으면 카드가 3장 나오고, 학습활동도 카드가 3장 나온다.
  3. 배포 주소에서 CSV 내려받기가 된다.
  4. main 브랜치에 push하면 Vercel에 새 배포가 생긴다.

## 계획에 넣지 않은 것

- 로그인 (spec.md의 제외 기능)
- 결과 저장, 이전 결과 목록 (DB가 기술 스택에 없다)
- `vercel.json` (`public/`과 `api/` 폴더는 Vercel 기본 설정으로 인식된다)
- GitHub Actions에서 Vercel 배포 실행 (Vercel의 GitHub 연결이 push마다 배포한다)
