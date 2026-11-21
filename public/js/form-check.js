const FormCheck = (function () {
  // 마지막 글자에 받침이 있는지 본다. 한글이 아니면 null.
  function hasFinalConsonant(word) {
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xAC00 || code > 0xD7A3) return null;
    return (code - 0xAC00) % 28 !== 0;
  }

  function withParticle(word, afterConsonant, afterVowel) {
    const final = hasFinalConsonant(word);
    if (final === null) return word + afterConsonant + '(' + afterVowel + ')';
    return word + (final ? afterConsonant : afterVowel);
  }

  // field: { name, label, value, required, number: { min, max, unit, integer } }
  // 문제가 없으면 빈 글자를, 있으면 안내 문구를 돌려준다.
  function checkField(field) {
    const value = String(field.value == null ? '' : field.value).trim();
    if (value === '') {
      return field.required ? withParticle(field.label, '을', '를') + ' 입력하세요' : '';
    }
    if (!field.number) return '';

    const rule = field.number;
    const unit = rule.unit || '';
    // Number()는 '0x5', '1e1', 'Infinity'도 받으므로 10진수 형식만 숫자로 본다.
    const number = /^\d+(\.\d+)?$/.test(value) ? Number(value) : NaN;
    const topic = withParticle(field.label, '은', '는');
    const hasMin = typeof rule.min === 'number';
    const hasMax = typeof rule.max === 'number';

    if (!Number.isFinite(number) || (hasMin && number < rule.min) || (hasMax && number > rule.max)) {
      if (hasMin && hasMax) return topic + ' ' + rule.min + '~' + rule.max + unit + ' 사이의 숫자로 입력하세요';
      if (hasMin) return topic + ' ' + rule.min + unit + ' 이상의 숫자로 입력하세요';
      if (hasMax) return topic + ' ' + rule.max + unit + ' 이하의 숫자로 입력하세요';
      return topic + ' 숫자로 입력하세요';
    }
    if (rule.integer && !Number.isInteger(number)) return topic + ' 소수점 없는 숫자로 입력하세요';
    return '';
  }

  function checkForm(fields) {
    const errors = {};
    fields.forEach(function (field) {
      const message = checkField(field);
      if (message) errors[field.name] = message;
    });
    return { ok: Object.keys(errors).length === 0, errors: errors };
  }

  return { checkField: checkField, checkForm: checkForm };
})();

if (typeof module === 'object' && module.exports) {
  module.exports = FormCheck;
}
