// 퀴즈 정답과 보기는 앞뒤 공백만 다르면 같은 것으로 보고, 안쪽 글자가 다르면 다른 것으로 본다.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('../api/validate.js');

const question = (changes) => ({
  question: '물이 수증기로 변하는 현상은?',
  options: ['기화', '액화', '응고', '융해'],
  answer: '기화',
  explanation: '액체가 기체로 변하는 현상을 기화라고 한다.',
  ...changes,
});

test('퀴즈 수용 기준 2: 정답이 보기와 앞뒤 공백만 다르면 통과한다', () => {
  assert.deepEqual(validate([question({ answer: ' 기화 ' })], { kind: '4지선다' }), { ok: true, errors: [] });
  assert.deepEqual(validate([question({ answer: '기화\n' })], { kind: '4지선다' }), { ok: true, errors: [] });
});

test('퀴즈 수용 기준 2: 보기 쪽에 앞뒤 공백이 있어도 정답과 맞으면 통과한다', () => {
  const options = [' 기화', '액화 ', '  응고  ', '융해\t'];
  assert.deepEqual(validate([question({ options, answer: '기화' })], { kind: '4지선다' }), { ok: true, errors: [] });
});

test('퀴즈 수용 기준 2: OX 정답도 앞뒤 공백만 다르면 통과한다', () => {
  const ox = { options: ['O', 'X'], answer: ' O ' };
  assert.deepEqual(validate([question(ox)], { kind: 'OX' }), { ok: true, errors: [] });
});

test('퀴즈 수용 기준 2: 정답과 보기가 안쪽 글자까지 다르면 정답이 보기에 없다고 거부한다', () => {
  assert.deepEqual(validate([question({ answer: '기 화' })], { kind: '4지선다' }).errors, [
    { number: 1, reason: '정답이 보기에 없습니다' },
  ]);
});
