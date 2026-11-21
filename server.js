const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { handler } = require('./api/generate.js');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ENV_PATH = path.join(__dirname, '.env.local');
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

// 이미 설정된 환경변수는 덮어쓰지 않는다.
if (fs.existsSync(ENV_PATH)) process.loadEnvFile(ENV_PATH);

function sendNotFound(res) {
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: '찾을 수 없습니다' }));
}

// / 는 index.html, /quiz 처럼 확장자가 없는 주소는 .html 파일로 본다.
function publicFileFor(urlPath) {
  let name;
  try {
    name = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (name === '/') name = '/index.html';
  if (!path.extname(name)) name += '.html';
  const file = path.join(PUBLIC_DIR, name);
  return file.startsWith(PUBLIC_DIR + path.sep) ? file : null;
}

function serveStatic(req, res) {
  const file = publicFileFor(new URL(req.url, 'http://localhost').pathname);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return sendNotFound(res);
  }
  res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/generate') {
    return handler(req, res);
  }
  if (req.url === '/api/generate') {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' });
    return res.end(JSON.stringify({ error: '허용되지 않는 요청 방식입니다' }));
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res);
  }
  sendNotFound(res);
});

server.listen(PORT, () => {
  console.log('http://127.0.0.1:' + PORT + ' 에서 화면과 POST /api/generate를 제공합니다');
});
