(function () {
  const form = document.getElementById('feature-form');
  const results = document.getElementById('results');
  if (!form || !results) return;

  // 제출하면 /api/generate에 입력을 보내고, 서버가 검증을 통과시킨 항목을 카드(card)로 보여 준다.
  const FEATURES = {
    quiz: { type: 'quiz', card: quizCard },
    activity: { type: 'activity', card: activityCard },
  };
  const feature = FEATURES[form.dataset.feature];
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.textContent;

  function getControls() {
    return Array.from(form.querySelectorAll('.field__input'));
  }

  // 입력란의 속성(required, min, max, data-*)을 검사 함수가 받는 형태로 바꾼다.
  function toField(control) {
    const label = control.dataset.label
      || form.querySelector('label[for="' + control.id + '"]').textContent.trim();
    const field = { name: control.name, label: label, value: control.value, required: control.required };
    if (control.type === 'number') {
      field.number = { unit: control.dataset.unit || '', integer: control.dataset.integer === 'true' };
      if (control.min !== '') field.number.min = Number(control.min);
      if (control.max !== '') field.number.max = Number(control.max);
    }
    return field;
  }

  function showError(control, message) {
    const errorId = control.id + '-error';
    let error = document.getElementById(errorId);
    if (!message) {
      if (error) error.remove();
      control.removeAttribute('aria-invalid');
      control.removeAttribute('aria-describedby');
      return;
    }
    if (!error) {
      error = document.createElement('p');
      error.className = 'field__error';
      error.id = errorId;
      control.closest('.field').appendChild(error);
    }
    error.textContent = message;
    control.setAttribute('aria-invalid', 'true');
    control.setAttribute('aria-describedby', errorId);
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function inputCard(fields) {
    const card = element('article', 'card result-card');
    const list = element('dl', 'result-card__body value-list');
    fields.forEach(function (field) {
      const row = element('div', 'value-list__row');
      const unit = field.number ? field.number.unit : '';
      row.appendChild(element('dt', 'value-list__name', field.label));
      row.appendChild(element('dd', 'value-list__value', field.value.trim() + unit));
      list.appendChild(row);
    });
    card.appendChild(element('h3', 'result-card__title', form.dataset.resultTitle));
    card.appendChild(list);
    card.appendChild(element('p', 'result-card__note', '아래 결과는 이 입력으로 AI가 만들고, 검증을 통과한 것입니다.'));
    return card;
  }

  function itemList(values) {
    const list = element('ol', 'result-card__body item-list');
    values.forEach(function (value) {
      list.appendChild(element('li', '', value));
    });
    return list;
  }

  function labeledLine(label, value) {
    const line = element('p', 'result-card__line');
    line.appendChild(element('strong', '', label + ': '));
    line.append(value);
    return line;
  }

  // 문항 카드: 제목(문제), 내용(보기), 덧붙임(정답과 해설). 덧붙임은 접어 두고 누르면 펼친다.
  function quizCard(item, number) {
    const card = element('article', 'card result-card');
    card.appendChild(element('h3', 'result-card__title', number + '. ' + item.question));
    const options = item.options || [];
    if (options.length > 0) card.appendChild(itemList(options));

    const note = element('details', 'result-card__note reveal');
    const summary = element('summary', 'reveal__summary');
    summary.appendChild(element('span', 'reveal__closed', '정답 보기'));
    summary.appendChild(element('span', 'reveal__open', '정답 숨기기'));
    const content = element('div', 'reveal__content');
    content.appendChild(labeledLine('정답', item.answer));
    content.appendChild(labeledLine('해설', item.explanation));
    note.appendChild(summary);
    note.appendChild(content);
    card.appendChild(note);
    return card;
  }

  // 활동 카드: 제목(활동 이름), 내용(진행 순서), 덧붙임(소요 시간과 준비물).
  function activityCard(item, number) {
    const card = element('article', 'card result-card');
    card.appendChild(element('h3', 'result-card__title', number + '. ' + item.name));
    card.appendChild(itemList(item.steps));

    const note = element('div', 'result-card__note');
    note.appendChild(labeledLine('소요 시간', item.minutes + '분'));
    note.appendChild(labeledLine('준비물', item.materials.join(', ')));
    card.appendChild(note);
    return card;
  }

  function statusCard() {
    const card = element('div', 'card card--status');
    card.setAttribute('role', 'status');
    card.appendChild(element('p', '', '만들고 있습니다'));
    return card;
  }

  // reasons: 서버가 돌려준 검사 이유. 문자열이면 그대로, { number, reason }이면 항목 번호와 함께 보여 준다.
  function errorCard(message, reasons, retry) {
    const card = element('div', 'card card--error');
    card.setAttribute('role', 'alert');
    card.appendChild(element('p', 'card__message', '오류: ' + message));
    if (reasons.length > 0) {
      const list = element('ul', 'error-list');
      reasons.forEach(function (error) {
        if (typeof error === 'string') {
          list.appendChild(element('li', '', error));
          return;
        }
        const where = error.number === 0 ? '전체' : error.number + '번';
        list.appendChild(element('li', '', where + ': ' + error.reason));
      });
      card.appendChild(list);
    }
    const button = element('button', 'button', '다시 시도');
    button.type = 'button';
    button.addEventListener('click', retry);
    card.appendChild(button);
    return card;
  }

  // 서버가 오류를 돌려주면 안내 문구(message)와 검사 이유(reasons)를 담은 Error를 던진다.
  async function requestItems(fields) {
    const failMessage = '결과를 불러오지 못했습니다. 다시 시도해 주세요.';
    let response;
    try {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feature.type, input: inputValues(fields) }),
      });
    } catch (error) {
      throw new Error(failMessage);
    }
    const body = await response.json().catch(function () {
      return {};
    });
    if (!response.ok) {
      const failure = new Error(body.error || failMessage);
      failure.reasons = body.errors || [];
      throw failure;
    }
    return body.items;
  }

  function inputValues(fields) {
    const input = {};
    fields.forEach(function (field) {
      input[field.name] = field.value.trim();
    });
    return input;
  }

  // 제출 버튼 → /api/generate → 카드 표시. 서버가 오류를 돌려주면 카드 대신 오류를 보여 준다.
  async function run(fields) {
    const retry = function () {
      run(fields);
    };
    submitButton.disabled = true;
    submitButton.textContent = '만드는 중';
    results.replaceChildren(statusCard());
    try {
      const items = await requestItems(fields);
      const cards = items.map(function (item, index) {
        return feature.card(item, index + 1);
      });
      results.replaceChildren(inputCard(fields), ...cards);
    } catch (error) {
      results.replaceChildren(errorCard(error.message, error.reasons || [], retry));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const controls = getControls();
    const fields = controls.map(toField);
    const check = FormCheck.checkForm(fields);
    controls.forEach(function (control) {
      showError(control, check.errors[control.name]);
    });
    if (!check.ok) {
      controls.find(function (control) {
        return check.errors[control.name];
      }).focus();
      return;
    }
    run(fields);
  });

  form.addEventListener('input', function (event) {
    const control = event.target;
    if (control.getAttribute('aria-invalid') === 'true') {
      showError(control, FormCheck.checkField(toField(control)));
    }
  });
})();
