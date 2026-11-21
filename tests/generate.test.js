const test = require('node:test');
const assert = require('node:assert/strict');
const { generate, buildMessages } = require('../api/generate.js');

const ENV_KEYS = ['AI_ENDPOINT', 'AI_API_KEY', 'AI_DEPLOYMENT'];

const quizInput = {
  subject: '과학',
  level: '중학교 2학년',
  topic: '물의 상태 변화',
  count: 2,
  kind: '4지선다',
  difficulty: '보통',
};

const activityInput = {
  subject: '과학',
  level: '중학교 2학년',
  goal: '물의 상태 변화를 설명한다',
  minutes: 40,
  classSize: 25,
  groupSize: 4,
};

const quizItem = {
  question: '물이 수증기로 변하는 현상은?',
  options: ['기화', '액화', '응고', '융해'],
  answer: '기화',
  explanation: '액체가 기체로 변하는 현상이다.',
};

const activityItem = {
  name: '얼음이 녹는 과정 관찰하기',
  steps: ['얼음을 비커에 넣는다', '변화를 기록한다'],
  minutes: 15,
  materials: ['얼음', '비커'],
};

// 호출 횟수를 세고, 주어진 결과를 돌려주는 가짜 AI 호출.
function fakeAi(items) {
  const fake = async () => {
    fake.calls += 1;
    return JSON.stringify({ items });
  };
  fake.calls = 0;
  return fake;
}

test('type이 quiz나 activity가 아니면 AI를 부르지 않고 400을 돌려준다', async () => {
  const ai = fakeAi([quizItem]);
  const result = await generate({ type: 'essay', input: quizInput }, ai);
  assert.equal(result.status, 400);
  assert.equal(ai.calls, 0);
});

test('필수 항목이 비면 AI를 부르지 않고 항목 이름이 든 안내를 돌려준다', async () => {
  const ai = fakeAi([quizItem]);
  const result = await generate({ type: 'quiz', input: { ...quizInput, subject: '' } }, ai);
  assert.equal(result.status, 400);
  assert.deepEqual(result.body.errors, ['과목을 입력하세요']);
  assert.equal(ai.calls, 0);
});

test('활동 시간과 모둠 인원이 범위를 벗어나면 400을 돌려준다', async () => {
  const minutes = await generate({ type: 'activity', input: { ...activityInput, minutes: 0 } }, fakeAi([]));
  assert.deepEqual(minutes.body.errors, ['활동 시간은 1분 이상의 숫자로 입력하세요']);

  const group = await generate({ type: 'activity', input: { ...activityInput, groupSize: 7 } }, fakeAi([]));
  assert.deepEqual(group.body.errors, ['모둠 인원은 2~6명 사이의 숫자로 입력하세요']);
});

test('퀴즈 결과 개수가 입력한 문항 수와 다르면 502와 검사 이유를 돌려준다', async () => {
  const result = await generate({ type: 'quiz', input: quizInput }, fakeAi([quizItem]));
  assert.equal(result.status, 502);
  assert.deepEqual(result.body.errors, [{ number: 0, reason: '개수가 2개여야 하는데 1개입니다' }]);
});

test('활동 결과의 소요 시간이 입력한 활동 시간을 넘으면 502를 돌려준다', async () => {
  const over = { ...activityItem, minutes: 50 };
  const result = await generate({ type: 'activity', input: activityInput }, fakeAi([activityItem, activityItem, over]));
  assert.equal(result.status, 502);
  assert.deepEqual(result.body.errors, [{ number: 3, reason: '소요 시간이 활동 시간 40분을 넘습니다' }]);
});

test('검사를 통과한 퀴즈 결과는 200과 items를 돌려준다', async () => {
  const result = await generate({ type: 'quiz', input: quizInput }, fakeAi([quizItem, quizItem]));
  assert.equal(result.status, 200);
  assert.equal(result.body.items.length, 2);
});

test('AI 응답이 JSON이 아니면 502를 돌려준다', async () => {
  const result = await generate({ type: 'quiz', input: quizInput }, async () => '문항을 만들었습니다');
  assert.equal(result.status, 502);
});

test('AI 설정 환경변수가 없으면 AI를 부르지 않고 500을 돌려준다', async () => {
  const saved = ENV_KEYS.map((key) => [key, process.env[key]]);
  ENV_KEYS.forEach((key) => delete process.env[key]);
  try {
    const result = await generate({ type: 'quiz', input: quizInput });
    assert.equal(result.status, 500);
  } finally {
    saved.forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});

test('AI에 보내는 사용자 메시지의 첫 줄은 type 값이다', () => {
  assert.equal(buildMessages('quiz', quizInput)[1].content.split('\n')[0], 'type: quiz');
  assert.equal(buildMessages('activity', activityInput)[1].content.split('\n')[0], 'type: activity');
});
