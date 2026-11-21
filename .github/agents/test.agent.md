---
name: test
description: spec.md의 수용 기준을 tests/의 테스트로 옮긴다 (tests/만 수정)
---
## 하는 일

- `spec.md`의 수용 기준을 `tests/`의 테스트로 옮긴다.

## 수정할 수 있는 파일

- `tests/` 폴더의 파일

## 하지 않을 일

- 구현 코드와 `public/`, `api/`는 수정하지 않는다.
- 테스트가 실패해도 구현을 고치지 않고, 실패한 테스트 이름과 맡을 에이전트(ui 또는 logic)를 보고한다.
