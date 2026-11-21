// spec.md 기능 1·2의 입력 검사 가운데 기존 테스트에 없던 기준과, 숫자 입력을 10진수 정수나 소수로만 받는 규칙을 검사한다.
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkField, checkForm } = require('../public/js/form-check.js');

const classSize = (value) => ({
  name: 'classSize',
  label: '학급 규모',
  value,
  required: true,
  number: { min: 1, unit: '명', integer: true },
});

const groupSize = (value) => ({
  name: 'groupSize',
  label: '모둠 인원',
  value,
  required: true,
  number: { min: 2, max: 6, unit: '명', integer: true },
});

const minutes = (value) => ({
  name: 'minutes',
  label: '활동 시간',
  value,
  required: true,
  number: { min: 1, unit: '분' },
});

const count = (value) => ({
  name: 'count',
  label: '문항 수',
  value,
  required: true,
  number: { min: 1, max: 10, unit: '개', integer: true },
});

// spec.md 기능 2 입력 표의 항목과 규칙을 그대로 옮긴 활동 입력 폼
const activityForm = (changes = {}) => [
  { name: 'subject', label: '과목', value: '과학', required: true },
  { name: 'level', label: '학년 또는 학습자 수준', value: '중학교 2학년', required: true },
  { name: 'goal', label: '학습 목표', value: '물의 상태 변화를 예를 들어 설명할 수 있다', required: true },
  minutes('40'),
  classSize('25'),
  groupSize('4'),
].map((field) => (changes[field.name] === undefined ? field : { ...field, value: changes[field.name] }));

test('기능 2 수용 기준 3: 학급 규모는 1 이상의 정수만 받는다', () => {
  for (const value of ['0', '2.5', '-3', 'abc']) {
    const message = checkField(classSize(value));
    assert.notEqual(message, '', `학급 규모 ${value} 는 거부해야 합니다`);
    assert.ok(message.includes('학급 규모'), `안내 문구에 항목 이름이 있어야 합니다: ${message}`);
  }
  for (const value of ['1', '25']) {
    assert.equal(checkField(classSize(value)), '', `학급 규모 ${value} 는 통과해야 합니다`);
  }
});

test('기능 2 수용 기준 3: 모둠 인원은 2~6 사이의 정수만 받는다', () => {
  for (const value of ['1', '7', '3.5']) {
    const message = checkField(groupSize(value));
    assert.notEqual(message, '', `모둠 인원 ${value} 는 거부해야 합니다`);
    assert.ok(message.includes('모둠 인원'), `안내 문구에 항목 이름이 있어야 합니다: ${message}`);
  }
  for (const value of ['2', '3', '6']) {
    assert.equal(checkField(groupSize(value)), '', `모둠 인원 ${value} 는 통과해야 합니다`);
  }
});

test('기능 2 수용 기준 3: 학습 목표가 비어 있으면 "학습 목표를 입력하세요"를 보여 준다', () => {
  const goal = { name: 'goal', label: '학습 목표', value: '', required: true };
  assert.equal(checkField(goal), '학습 목표를 입력하세요');
  assert.equal(checkField({ ...goal, value: '물의 상태 변화를 설명한다' }), '');
});

test('기능 2 수용 기준 3: 활동 입력 폼에서 빈 학습 목표만 안내하고 나머지는 통과한다', () => {
  assert.deepEqual(checkForm(activityForm({ goal: '' })), {
    ok: false,
    errors: { goal: '학습 목표를 입력하세요' },
  });
});

test('기능 2 수용 기준 3: 활동 입력 폼에서 잘못된 학급 규모와 모둠 인원은 항목별로 안내한다', () => {
  const result = checkForm(activityForm({ classSize: '0', groupSize: '7' }));
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['classSize', 'groupSize']);
  assert.ok(result.errors.classSize.includes('학급 규모'));
  assert.ok(result.errors.groupSize.includes('모둠 인원'));
});

test('기능 2 수용 기준 3: 모든 입력이 맞으면 활동 입력 폼은 통과한다', () => {
  assert.deepEqual(checkForm(activityForm()), { ok: true, errors: {} });
});

test('기능 2 수용 기준 3: 숫자 입력은 10진수 정수나 소수만 받는다 (0x5, 1e1 거부)', () => {
  // 활동 시간: 1 이상의 숫자
  for (const value of ['0x5', '1e1', 'Infinity']) {
    assert.notEqual(checkField(minutes(value)), '', `활동 시간 ${value} 는 거부해야 합니다`);
  }
  assert.equal(checkField(minutes('2.5')), '', '활동 시간 2.5 는 통과해야 합니다');

  // 학급 규모와 모둠 인원: 10진수 정수
  assert.notEqual(checkField(classSize('1e1')), '', '학급 규모 1e1 은 거부해야 합니다');
  assert.notEqual(checkField(groupSize('0x4')), '', '모둠 인원 0x4 는 거부해야 합니다');
});

test('기능 1 수용 기준 3: 문항 수에 0x5, 1e1을 넣으면 거부한다', () => {
  // 0x5 는 5, 1e1 은 10으로 범위 안에 들지만 10진수 형식이 아니므로 거부해야 한다
  assert.equal(checkField(count('0x5')), '문항 수는 1~10개 사이의 숫자로 입력하세요');
  assert.equal(checkField(count('1e1')), '문항 수는 1~10개 사이의 숫자로 입력하세요');
  assert.equal(checkField(count('10')), '');
});
