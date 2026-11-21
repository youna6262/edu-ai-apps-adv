// public/quiz.html과 public/activity.html, public/app.js를 파일로 읽어 spec.md의 입력 표와 폼·카드 구조를 비교한다.
// 브라우저를 띄우지 않고 정규식과 문자열 비교만 쓴다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', 'public', file), 'utf8');

// spec.md 기능 1 입력 표: [name, 이름표]
const QUIZ_INPUTS = [
  ['subject', '과목'],
  ['level', '학년 또는 학습자 수준'],
  ['topic', '주제 또는 자료'],
  ['count', '문항 수'],
  ['kind', '문항 유형'],
  ['difficulty', '난이도'],
];

// spec.md 기능 2 입력 표: [name, 이름표]
const ACTIVITY_INPUTS = [
  ['subject', '과목'],
  ['level', '학년 또는 학습자 수준'],
  ['goal', '학습 목표'],
  ['minutes', '활동 시간'],
  ['classSize', '학급 규모'],
  ['groupSize', '모둠 인원'],
];

function formOf(html) {
  const match = html.match(/<form\b[^>]*\bid="feature-form"[^>]*>([\s\S]*?)<\/form>/);
  assert.ok(match, '입력 폼(form#feature-form)이 있어야 합니다');
  return match[1];
}

function attr(tag, name) {
  const match = tag.match(new RegExp('\\s' + name + '="([^"]*)"'));
  return match ? match[1] : null;
}

function labelOf(form, id) {
  const match = form.match(new RegExp('<label\\b[^>]*\\bfor="' + id + '"[^>]*>([\\s\\S]*?)<\\/label>'));
  return match ? match[1].trim() : null;
}

// 폼 안의 입력란(input, select, textarea)을 화면 순서대로 [name, 이름표] 목록으로 만든다.
function nameAndLabels(page) {
  const form = formOf(read(page));
  const tags = form.match(/<(input|select|textarea)\b[^>]*>/g) || [];
  return tags.map((tag) => [attr(tag, 'name'), labelOf(form, attr(tag, 'id'))]);
}

// 폼의 구조를 순서대로 적는다: 입력 칸(field), 이름표(label), 입력란(input), 안내 문구 자리(hint), 제출 버튼(submit)
function tokenOf(text) {
  if (text.startsWith('<div class="field')) return 'field';
  if (text.startsWith('<div class="form-actions"')) return 'actions';
  if (text.startsWith('<label')) return 'label';
  if (/^<(input|select|textarea)\b/.test(text)) return 'input';
  if (text.startsWith('<p class="field__hint"')) return 'hint';
  if (text.startsWith('<button') && text.includes('type="submit"')) return 'submit';
  return 'other';
}

function shapeOf(page) {
  const form = formOf(read(page));
  const pattern = /<div class="field[^"]*"|<div class="form-actions"|<label\b[^>]*>|<(?:input|select|textarea)\b[^>]*>|<button\b[^>]*>|<p class="field__hint"/g;
  return (form.match(pattern) || []).map(tokenOf);
}

// 입력 칸 여섯 개는 이름표, 입력란, 안내 문구 순서이고, 마지막에 제출 버튼이 있다
const EXPECTED_SHAPE = [
  ...Array(6).fill(['field', 'label', 'input', 'hint']).flat(),
  'actions',
  'submit',
];

// app.js의 카드 함수 본문을 잘라 낸다
function cardSource(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + ' 함수가 app.js에 있어야 합니다');
  const end = source.indexOf('\n  }\n', start);
  return source.slice(start, end);
}

test('기능 1 입력 항목: quiz.html 입력란의 name 순서와 이름표가 spec.md 입력 표와 같다', () => {
  assert.deepEqual(nameAndLabels('quiz.html'), QUIZ_INPUTS);
});

test('기능 2 입력 항목: activity.html 입력란의 name 순서와 이름표가 spec.md 입력 표와 같다', () => {
  assert.deepEqual(nameAndLabels('activity.html'), ACTIVITY_INPUTS);
});

test('기능 2 수용 기준 6: 입력 폼의 구조(이름표, 입력란, 안내 문구, 제출 버튼 순서)가 퀴즈 생성기와 같다', () => {
  assert.deepEqual(shapeOf('quiz.html'), EXPECTED_SHAPE);
  assert.deepEqual(shapeOf('activity.html'), shapeOf('quiz.html'));
});

test('기능 2 수용 기준 6: 안내 문구는 입력 칸 안, 입력란 뒤에 붙는다', () => {
  const app = read('app.js');
  assert.match(app, /className = 'field__error'/, '안내 문구 요소(field__error)를 만들어야 합니다');
  assert.match(app, /closest\('\.field'\)\.appendChild\(error\)/, '안내 문구는 입력 칸(.field) 안에 붙어야 합니다');
});

test('기능 2 수용 기준 6: 결과 카드의 칸(제목, 내용, 덧붙임)이 퀴즈 생성기와 같다', () => {
  const app = read('app.js');
  for (const name of ['quizCard', 'activityCard']) {
    const body = cardSource(app, name);
    const title = body.indexOf('result-card__title');
    const content = body.indexOf('itemList(');
    const note = body.indexOf('result-card__note');
    assert.ok(title >= 0 && content >= 0 && note >= 0, `${name}에 제목, 내용, 덧붙임이 모두 있어야 합니다`);
    assert.ok(title < content && content < note, `${name}의 칸은 제목, 내용, 덧붙임 순서여야 합니다`);
  }
});
