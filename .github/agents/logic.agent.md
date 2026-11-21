---
name: logic
description: 입력 검사와 결과 검사 함수를 구현한다 (검사 함수 파일만 수정)
---
## 하는 일

- 입력 검사와 `api/validate.js`의 검사 함수(`validate()`, `validateActivities()`)를 구현한다.

## 수정할 수 있는 파일

- `api/validate.js`
- `public/js/validate.js` (`api/validate.js`가 내보내는 검사 함수의 구현이 여기에 있다)
- `public/js/form-check.js`

## 하지 않을 일

- 화면 파일(`public/*.html`, `public/styles.css`)과 `tests/`는 수정하지 않는다.
- 위 범위 밖의 파일을 고쳐야 하면 고치지 않고, 필요한 변경과 맡을 에이전트(ui 또는 test)를 보고한다.
