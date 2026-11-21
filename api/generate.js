const fs = require('node:fs');
const path = require('node:path');
const { OpenAI } = require('openai');
const FormCheck = require('../public/js/form-check.js');
const Validate = require('./validate.js');

const TYPES = ['quiz', 'activity'];
const KINDS = ['4지선다', 'OX', '단답형'];
const DIFFICULTIES = ['쉬움', '보통', '어려움'];
const ACTIVITY_COUNT = 3;
const PROMPT_PATH = path.join(__dirname, '시스템 프롬프트.txt');

class ConfigError extends Error {}

function buildMessages(type, input) {
  return [
    { role: 'system', content: fs.readFileSync(PROMPT_PATH, 'utf8') },
    { role: 'user', content: 'type: ' + type + '\n' + JSON.stringify(input) },
  ];
}

async function callAi(type, input) {
  const endpoint = process.env.AI_ENDPOINT;
  const apiKey = process.env.AI_API_KEY;
  const deployment = process.env.AI_DEPLOYMENT;
  if (!endpoint || !apiKey || !deployment) {
    throw new ConfigError('AI 연결 설정(AI_ENDPOINT, AI_API_KEY, AI_DEPLOYMENT)이 없습니다');
  }
  // AI_ENDPOINT는 /openai/v1/ 형식이라 AzureOpenAI 대신 OpenAI 클라이언트에 baseURL로 넘긴다.
  const client = new OpenAI({ baseURL: endpoint, apiKey });
  // JSON 모드는 최상위가 객체여야 해서, 결과 배열은 items 키 안에 담는다.
  const completion = await client.chat.completions.create({
    model: deployment,
    messages: buildMessages(type, input),
    response_format: { type: 'json_object' },
  });
  return completion.choices[0].message.content;
}

function fieldsFor(type, input) {
  if (type === 'quiz') {
    return [
      { name: 'subject', label: '과목', value: input.subject, required: true },
      { name: 'level', label: '학년 또는 학습자 수준', value: input.level, required: true },
      { name: 'topic', label: '주제 또는 자료', value: input.topic, required: true },
      { name: 'count', label: '문항 수', value: input.count, required: true, number: { min: 1, max: 10, unit: '개', integer: true } },
    ];
  }
  return [
    { name: 'subject', label: '과목', value: input.subject, required: true },
    { name: 'level', label: '학년 또는 학습자 수준', value: input.level, required: true },
    { name: 'goal', label: '학습 목표', value: input.goal, required: true },
    { name: 'minutes', label: '활동 시간', value: input.minutes, required: true, number: { min: 1, unit: '분' } },
    { name: 'classSize', label: '학급 규모', value: input.classSize, required: true, number: { min: 1, unit: '명', integer: true } },
    { name: 'groupSize', label: '모둠 인원', value: input.groupSize, required: true, number: { min: 2, max: 6, unit: '명', integer: true } },
  ];
}

function inputErrors(type, input) {
  const messages = fieldsFor(type, input).map((field) => FormCheck.checkField(field)).filter(Boolean);
  if (type === 'quiz') {
    if (!KINDS.includes(input.kind)) messages.push('문항 유형은 4지선다, OX, 단답형 중 하나여야 합니다');
    if (!DIFFICULTIES.includes(input.difficulty)) messages.push('난이도는 쉬움, 보통, 어려움 중 하나여야 합니다');
  }
  return messages;
}

function resultCheck(type, items, input) {
  if (type === 'quiz') {
    return Validate.validate(items, { count: Number(input.count), kind: input.kind });
  }
  return Validate.validateActivities(items, { count: ACTIVITY_COUNT, maxMinutes: Number(input.minutes) });
}

// 요청을 검사하고 AI를 불러, 결과를 검사한 뒤 { status, body }를 돌려준다.
async function generate(body, requestAi = callAi) {
  const type = body ? body.type : undefined;
  if (!TYPES.includes(type)) {
    return { status: 400, body: { error: 'type은 quiz 또는 activity여야 합니다' } };
  }
  const input = body.input;
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { status: 400, body: { error: 'input은 객체여야 합니다' } };
  }
  const errors = inputErrors(type, input);
  if (errors.length > 0) {
    return { status: 400, body: { error: '입력을 확인하세요', errors } };
  }

  let content;
  try {
    content = await requestAi(type, input);
  } catch (error) {
    if (error instanceof ConfigError) return { status: 500, body: { error: error.message } };
    return { status: 502, body: { error: 'AI 호출에 실패했습니다' } };
  }

  let items;
  try {
    items = JSON.parse(content).items;
  } catch {
    return { status: 502, body: { error: 'AI 응답을 JSON으로 읽지 못했습니다' } };
  }
  const check = resultCheck(type, items, input);
  if (!check.ok) {
    return { status: 502, body: { error: 'AI 결과가 검증을 통과하지 못했습니다', errors: check.errors } };
  }
  return { status: 200, body: { items } };
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handler(req, res) {
  let body = req.body;
  if (body === undefined) {
    try {
      body = await readBody(req);
    } catch {
      return send(res, 400, { error: '요청 본문이 JSON이 아닙니다' });
    }
  }
  try {
    const result = await generate(body);
    return send(res, result.status, result.body);
  } catch {
    return send(res, 500, { error: '서버에서 오류가 났습니다' });
  }
}

module.exports = { generate, handler, buildMessages };
