const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3020;
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DOWNLOADS_DIR = path.join(ROOT, 'downloads');

const REMOTE_HOST = process.env.REMOTE_HOST || 'yeongseo.kr';
const REMOTE_PORT = Number(process.env.REMOTE_PORT || 8006);
const REMOTE_PATH = process.env.REMOTE_PATH || '/api2/json/version';
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

function safeJoin(base, target) {
  const resolved = path.resolve(base, target);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

function serveDownload(res, pathname) {
  const rel = pathname.replace(/^\/downloads\//, '');
  const filePath = safeJoin(DOWNLOADS_DIR, rel);
  if (!filePath) return sendJson(res, 400, { error: 'invalid path' });
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return sendJson(res, 404, { error: 'file not found' });
  }
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
  });
  fs.createReadStream(filePath).pipe(res);
}

function listDownloads() {
  try {
    return fs.readdirSync(DOWNLOADS_DIR).sort();
  } catch {
    return [];
  }
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
      } catch (_) {}
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
        base.hint = 'Proxmox API 토큰이 필요합니다.';
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
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsed.pathname;

  if (req.method === 'GET' && pathname === '/') return serveIndex(res);
  if (req.method === 'GET' && pathname === '/api/server-info') return handleServerInfo(res);
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'simple-status',
      uptime: process.uptime(),
      time: new Date().toISOString(),
    });
  }
  if (req.method === 'GET' && pathname === '/api/downloads') {
    return sendJson(res, 200, { files: listDownloads() });
  }
  if (req.method === 'GET' && pathname.startsWith('/downloads/')) {
    return serveDownload(res, pathname);
  }
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`http://0.0.0.0:${PORT}`);
});
