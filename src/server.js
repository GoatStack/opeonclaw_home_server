const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3020;
const ROOT = path.resolve(__dirname, '..');
const TASKS_FILE = path.join(ROOT, 'tasks', 'inbox.md');
const LOGS_DIR = path.join(ROOT, 'logs');
const PUBLIC_DIR = path.join(ROOT, 'public');

function readTasks() {
  try {
    return fs.readFileSync(TASKS_FILE, 'utf8');
  } catch {
    return '# Inbox\n\n아직 작업이 없습니다.';
  }
}

function listLogs() {
  try {
    return fs.readdirSync(LOGS_DIR).sort();
  } catch {
    return [];
  }
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function serveIndex(res) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

const server = http.createServer((req, res) => {
  if (req.url === '/') return serveIndex(res);
  if (req.url === '/api/tasks') return sendJson(res, 200, { content: readTasks() });
  if (req.url === '/api/logs') return sendJson(res, 200, { files: listLogs() });
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`MVP service running on http://localhost:${PORT}`);
});
