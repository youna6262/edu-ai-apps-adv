const test = require('node:test');
const assert = require('node:assert/strict');
const { checkField, checkForm } = require('../public/js/form-check.js');

const minutes = { min: 1, unit: '분' };
const count = { min: 1, max: 10, unit: '개', integer: true };

test('필수 항목이 비어 있으면 항목 이름이 들어간 안내 문구를 돌려준다', () => {
  assert.equal(checkField({ label: '과목', value: '', required: true }), '과목을 입력하세요');
  assert.equal(checkField({ label: '학습 목표', value: '   ', required: true }), '학습 목표를 입력하세요');
});

test('값이 있는 필수 항목과 비어 있는 선택 항목은 통과한다', () => {
  assert.equal(checkField({ label: '과목', value: '과학', required: true }), '');
  assert.equal(checkField({ label: '메모', value: '', required: false }), '');
});

test('활동 시간은 1분 이상의 숫자만 받는다', () => {
  const message = '활동 시간은 1분 이상의 숫자로 입력하세요';
  for (const value of ['0', '-5', '0.5', 'abc']) {
    assert.equal(checkField({ label: '활동 시간', value, required: true, number: minutes }), message);
  }
  for (const value of ['1', '40', '7.5']) {
    assert.equal(checkField({ label: '활동 시간', value, required: true, number: minutes }), '');
  }
});

test('문항 수는 1~10 사이의 정수만 받는다', () => {
  const field = (value) => ({ label: '문항 수', value, required: true, number: count });
  assert.equal(checkField(field('0')), '문항 수는 1~10개 사이의 숫자로 입력하세요');
  assert.equal(checkField(field('11')), '문항 수는 1~10개 사이의 숫자로 입력하세요');
  assert.equal(checkField(field('2.5')), '문항 수는 소수점 없는 숫자로 입력하세요');
  assert.equal(checkField(field('10')), '');
});

test('checkForm은 문제가 된 항목만 이름별로 모은다', () => {
  const fields = [
    { name: 'subject', label: '과목', value: '과학', required: true },
    { name: 'goal', label: '학습 목표', value: '', required: true },
    { name: 'minutes', label: '활동 시간', value: '0', required: true, number: minutes },
  ];
  assert.deepEqual(checkForm(fields), {
    ok: false,
    errors: {
      goal: '학습 목표를 입력하세요',
      minutes: '활동 시간은 1분 이상의 숫자로 입력하세요',
    },
  });
  fields[1].value = '물의 상태 변화를 설명한다';
  fields[2].value = '40';
  assert.deepEqual(checkForm(fields), { ok: true, errors: {} });
});
