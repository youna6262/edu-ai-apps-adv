// spec.md의 수용 기준 가운데 AI가 돌려준 문항과 활동의 형식에 관한 기준(퀴즈 1·2, 학습활동 1·2)을 검사한다.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, validateActivities } = require('../api/validate.js');

const question = (changes) => ({
  question: '물이 수증기로 변하는 현상은?',
  options: ['기화', '액화', '응고', '융해'],
  answer: '기화',
  explanation: '액체가 기체로 변하는 현상을 기화라고 한다.',
  ...changes,
});

const oxQuestion = (changes) => question({ options: ['O', 'X'], answer: 'O', ...changes });

const activity = (changes) => ({
  name: '상태 변화 관찰하기',
  steps: ['얼음을 비커에 넣는다', '변화를 기록한다'],
  minutes: 20,
  materials: ['얼음', '비커'],
  ...changes,
});

test('퀴즈 수용 기준 1: 문항이 문항 수만큼 있다', () => {
  const expected = { count: 3, kind: '4지선다' };
  assert.deepEqual(validate([question(), question(), question()], expected), { ok: true, errors: [] });
  assert.deepEqual(validate([question(), question()], expected), {
    ok: false,
    errors: [{ number: 0, reason: '개수가 3개여야 하는데 2개입니다' }],
  });
  assert.deepEqual(validate([question(), question(), question(), question()], expected), {
    ok: false,
    errors: [{ number: 0, reason: '개수가 3개여야 하는데 4개입니다' }],
  });
});

test('퀴즈 수용 기준 2: 모든 문항에 문제, 정답, 해설이 빠짐없이 있다', () => {
  const questions = [
    question(),
    question({ question: '' }),
    question({ answer: undefined }),
    question({ explanation: ' ' }),
  ];
  assert.deepEqual(validate(questions, { kind: '4지선다' }), {
    ok: false,
    errors: [
      { number: 2, reason: '문제가 비어 있습니다' },
      { number: 3, reason: '정답이 비어 있습니다' },
      { number: 4, reason: '해설이 비어 있습니다' },
    ],
  });
});

test('퀴즈 수용 기준 2: 4지선다는 보기가 4개이고 정답은 보기 중 하나다', () => {
  const expected = { kind: '4지선다' };
  assert.deepEqual(validate([question()], expected), { ok: true, errors: [] });
  assert.deepEqual(validate([question({ options: ['기화', '액화', '응고'] })], expected).errors, [
    { number: 1, reason: '4지선다는 보기가 4개여야 합니다' },
  ]);
  assert.deepEqual(validate([question(), question({ answer: '승화' })], expected).errors, [
    { number: 2, reason: '정답이 보기에 없습니다' },
  ]);
});

test('퀴즈 수용 기준 2: OX는 보기가 O와 X 2개이고 정답은 보기 중 하나다', () => {
  const expected = { kind: 'OX' };
  assert.deepEqual(validate([oxQuestion(), oxQuestion({ answer: 'X' })], expected), { ok: true, errors: [] });
  assert.deepEqual(validate([question()], expected).errors, [
    { number: 1, reason: 'OX는 보기가 O와 X여야 합니다' },
  ]);
  assert.deepEqual(validate([oxQuestion({ answer: '맞다' })], expected).errors, [
    { number: 1, reason: '정답이 보기에 없습니다' },
  ]);
});

test('퀴즈 수용 기준 2: 단답형은 보기가 없다', () => {
  const expected = { kind: '단답형' };
  const questions = [question({ options: [] }), question({ options: undefined })];
  assert.deepEqual(validate(questions, expected), { ok: true, errors: [] });
  assert.deepEqual(validate([question()], expected).errors, [
    { number: 1, reason: '단답형은 보기가 없어야 합니다' },
  ]);
});

test('학습활동 수용 기준 1: 활동이 3개 있다', () => {
  const expected = { count: 3, maxMinutes: 40 };
  assert.deepEqual(validateActivities([activity(), activity(), activity()], expected), { ok: true, errors: [] });
  assert.deepEqual(validateActivities([activity(), activity()], expected), {
    ok: false,
    errors: [{ number: 0, reason: '개수가 3개여야 하는데 2개입니다' }],
  });
});

test('학습활동 수용 기준 2: 모든 활동에 활동 이름, 진행 순서, 소요 시간, 준비물이 빠짐없이 있다', () => {
  const activities = [
    activity(),
    activity({ name: '' }),
    activity({ steps: [] }),
    activity({ minutes: undefined }),
    activity({ materials: undefined }),
  ];
  assert.deepEqual(validateActivities(activities), {
    ok: false,
    errors: [
      { number: 2, reason: '활동 이름이 비어 있습니다' },
      { number: 3, reason: '진행 순서가 비어 있습니다' },
      { number: 4, reason: '소요 시간은 1 이상의 숫자여야 합니다' },
      { number: 5, reason: '준비물이 비어 있습니다' },
    ],
  });
});

test('학습활동 수용 기준 2: 소요 시간은 1 이상이며 입력한 활동 시간을 넘지 않는다', () => {
  const expected = { maxMinutes: 40 };
  const onTime = [activity({ minutes: 1 }), activity({ minutes: 40 })];
  assert.deepEqual(validateActivities(onTime, expected), { ok: true, errors: [] });

  const offTime = [activity({ minutes: 0 }), activity({ minutes: 41 }), activity({ minutes: '20' })];
  assert.deepEqual(validateActivities(offTime, expected).errors, [
    { number: 1, reason: '소요 시간은 1 이상의 숫자여야 합니다' },
    { number: 2, reason: '소요 시간이 활동 시간 40분을 넘습니다' },
    { number: 3, reason: '소요 시간은 1 이상의 숫자여야 합니다' },
  ]);
});
