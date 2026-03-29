const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3020;
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const REMOTE_HOST = process.env.REMOTE_HOST || 'yeongseo.kr';
const REMOTE_PORT = Number(process.env.REMOTE_PORT || 8006);
const REMOTE_PATH = process.env.REMOTE_PATH || '/api2/json/version';
/** 자체서명/체인 불완전 시 0으로 엄격 검증. 기본은 연결 우선(비권장·홈서버용). */
const REMOTE_TLS_INSECURE = process.env.REMOTE_TLS_INSECURE !== '0';

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveIndex(res) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function fetchRemotePve() {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: REMOTE_HOST,
      port: REMOTE_PORT,
      path: REMOTE_PATH,
      method: 'GET',
      headers: {},
      rejectUnauthorized: REMOTE_TLS_INSECURE ? false : true,
    };
    if (process.env.PVE_API_TOKEN) {
      opts.headers.Authorization = `PVEAPIToken ${process.env.PVE_API_TOKEN}`;
    }
    const req = https.request(opts, (incoming) => {
      let buf = '';
      incoming.on('data', (c) => {
        buf += c;
      });
      incoming.on('end', () => {
        resolve({
          statusCode: incoming.statusCode,
          headers: incoming.headers,
          body: buf,
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('요청 시간 초과'));
    });
    req.end();
  });
}

function handleServerInfo(res) {
  fetchRemotePve()
    .then((r) => {
      let parsed = null;
      try {
        parsed = JSON.parse(r.body);
      } catch (_) {
        /* not JSON */
      }
      const base = {
        ok: true,
        reachable: true,
        remote: `https://${REMOTE_HOST}:${REMOTE_PORT}`,
        path: REMOTE_PATH,
        httpStatus: r.statusCode,
        local: {
          uptime: process.uptime(),
          time: new Date().toISOString(),
        },
      };
      if (r.statusCode === 200 && parsed && parsed.data) {
        base.pve = parsed.data;
        return sendJson(res, 200, base);
      }
      if (r.statusCode === 401) {
        base.authRequired = true;
        base.hint =
          'Proxmox API 토큰이 필요합니다. 서버 실행 시 PVE_API_TOKEN=user@realm!id=secret 형식으로 설정하세요.';
        return sendJson(res, 200, base);
      }
      base.bodyPreview = (r.body || '').slice(0, 300);
      return sendJson(res, 200, base);
    })
    .catch((e) => {
      sendJson(res, 200, {
        ok: false,
        reachable: false,
        remote: `https://${REMOTE_HOST}:${REMOTE_PORT}`,
        error: e.message,
        local: {
          uptime: process.uptime(),
          time: new Date().toISOString(),
        },
      });
    });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'GET' && url === '/') return serveIndex(res);
  if (req.method === 'GET' && url === '/api/server-info') return handleServerInfo(res);
  if (req.method === 'GET' && url === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'simple-status',
      uptime: process.uptime(),
      time: new Date().toISOString(),
    });
  }
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
