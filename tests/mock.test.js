// 화면이 카드로 보여 주는 예시 자료(public/mock)가 검증을 통과하는지 확인한다.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, validateActivities } = require('../api/validate.js');

test('예시 문항 5개는 4지선다 검증을 통과한다', () => {
  const questions = require('../public/mock/quiz.json');
  assert.deepEqual(validate(questions, { count: 5, kind: '4지선다' }), { ok: true, errors: [] });
});

test('예시 활동 3개는 검증을 통과한다', () => {
  const activities = require('../public/mock/activities.json');
  assert.deepEqual(validateActivities(activities, { count: 3 }), { ok: true, errors: [] });
});
