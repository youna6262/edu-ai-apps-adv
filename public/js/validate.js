// AI가 돌려준 문항과 활동 목록이 spec.md의 수용 기준에 맞는지 검사한다. 화면과 서버 함수가 함께 쓴다.
// 결과: { ok, errors: [{ number, reason }] }. number는 1부터 세고, 0은 목록 전체의 문제다.
const Validate = (function () {
  function isText(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function isTextList(value) {
    return Array.isArray(value) && value.every(isText);
  }

  function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function listErrors(items, count) {
    if (!Array.isArray(items)) return [{ number: 0, reason: '목록이 배열이 아닙니다' }];
    if (typeof count === 'number' && items.length !== count) {
      return [{ number: 0, reason: '개수가 ' + count + '개여야 하는데 ' + items.length + '개입니다' }];
    }
    return [];
  }

  function optionsProblem(options, kind) {
    const isOX = options.length === 2 && options[0] === 'O' && options[1] === 'X';
    if (kind === '4지선다') return options.length === 4 ? '' : '4지선다는 보기가 4개여야 합니다';
    if (kind === 'OX') return isOX ? '' : 'OX는 보기가 O와 X여야 합니다';
    if (kind === '단답형') return options.length === 0 ? '' : '단답형은 보기가 없어야 합니다';
    return options.length === 0 || options.length === 4 || isOX ? '' : '보기는 4개이거나, O와 X이거나, 없어야 합니다';
  }

  // 문항: { question, options, answer, explanation }
  // expected: { count, kind } (없으면 개수와 문항 유형은 정해 두지 않고 검사한다)
  function validate(questions, expected = {}) {
    const errors = listErrors(questions, expected.count);
    if (!Array.isArray(questions)) return { ok: false, errors };

    questions.forEach((item, index) => {
      const add = (reason) => errors.push({ number: index + 1, reason });
      if (!isObject(item)) return add('문항이 객체가 아닙니다');
      if (!isText(item.question)) add('문제가 비어 있습니다');
      if (!isText(item.answer)) add('정답이 비어 있습니다');
      if (!isText(item.explanation)) add('해설이 비어 있습니다');

      const options = item.options === undefined ? [] : item.options;
      if (!isTextList(options)) return add('보기는 빈칸 없는 글자 목록이어야 합니다');
      const problem = optionsProblem(options, expected.kind);
      if (problem) add(problem);
      if (options.length > 0 && isText(item.answer) && !options.map((option) => option.trim()).includes(item.answer.trim())) {
        add('정답이 보기에 없습니다');
      }
    });
    return { ok: errors.length === 0, errors };
  }

  // 활동: { name, steps, minutes, materials }
  // expected: { count, maxMinutes } (maxMinutes는 교사가 입력한 활동 시간)
  function validateActivities(activities, expected = {}) {
    const errors = listErrors(activities, expected.count);
    if (!Array.isArray(activities)) return { ok: false, errors };

    activities.forEach((item, index) => {
      const add = (reason) => errors.push({ number: index + 1, reason });
      if (!isObject(item)) return add('활동이 객체가 아닙니다');
      if (!isText(item.name)) add('활동 이름이 비어 있습니다');
      if (!isTextList(item.steps) || item.steps.length === 0) add('진행 순서가 비어 있습니다');
      if (!isTextList(item.materials) || item.materials.length === 0) add('준비물이 비어 있습니다');

      if (typeof item.minutes !== 'number' || !Number.isFinite(item.minutes) || item.minutes < 1) {
        add('소요 시간은 1 이상의 숫자여야 합니다');
      } else if (typeof expected.maxMinutes === 'number' && item.minutes > expected.maxMinutes) {
        add('소요 시간이 활동 시간 ' + expected.maxMinutes + '분을 넘습니다');
      }
    });
    return { ok: errors.length === 0, errors };
  }

  return { validate: validate, validateActivities: validateActivities };
})();

if (typeof module === 'object' && module.exports) {
  module.exports = Validate;
}
