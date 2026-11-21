---
name: activity-validator
description: 학습활동 추천 JSON의 형식과 시간 조건을 검사한다
---
1. 활동 JSON 배열을 읽는다.
2. api/validate.js의 validateActivities()를 실행한다.
   - 시간 조건을 검사하도록 둘째 인자로 `{ maxMinutes: 교사가 입력한 활동 시간(분) }`을 함께 넘긴다.
3. 실패한 항목 번호와 이유를 표로 보고한다.
