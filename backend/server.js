'use strict';

process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name === 'ExperimentalWarning' && /SQLite/i.test(w.message)) return;
  console.warn(w);
});

const http = require('node:http');
const fs   = require('node:fs');
const path = require('node:path');
const url  = require('node:url');

const { db, DB_FILE } = require('./db');
const { exportBlob, defaultBlob } = require('./src/bridge');
const auth  = require('./src/auth');
const store = require('./src/store');
const portal = require('./src/portal');
const market = require('./src/market');
try { market.init(require('./db').DATA_DIR); } catch (e) { console.warn('[market] init', e.message); }

const PORT     = Number(process.env.PORT) || 8787;
const HOST     = process.env.HOST || '0.0.0.0';
const APP_PATH = process.env.APP_PATH !== undefined ? process.env.APP_PATH : '/Ozarex';
const PUBLIC   = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'frontend', 'public');
const MAX_BACKUPS = 20;

/* ═══ start-up: hash old passwords, load sessions + data ═══ */
auth.migratePasswords();
auth.loadSessions();
store.load();

/* ═══════════════════════════════════════════════════════
   REAL-TIME SYNC — SSE broadcast hub
   push a version token to every logged-in device; each device
   then pulls the fresh data itself.
═══════════════════════════════════════════════════════ */
let _dataVersion = Date.now();
const _clients   = new Map();           // clientId → { res, userId }
let   _clientSeq = 0;

function broadcast(eventName, payload) {
  const data = JSON.stringify({ event: eventName, version: _dataVersion, ...payload });
  const dead = [];
  for (const [id, client] of _clients) {
    try { client.res.write(`data: ${data}\n\n`); } catch (_) { dead.push(id); }
  }
  dead.forEach(id => _clients.delete(id));
}
function notifyDataChanged(meta = {}) {
  _dataVersion = Date.now();
  store.markDirty();
  broadcast('data_changed', { changedAt: new Date().toISOString(), ...meta });
}
setInterval(() => {
  const now = Date.now(), dead = [];
  for (const [id, client] of _clients) { try { client.res.write(`: ping ${now}\n\n`); } catch (_) { dead.push(id); } }
  dead.forEach(id => _clients.delete(id));
}, 20000);

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function sendJSON(res, status, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({
    'Content-Type':   'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control':  'no-store'
  }, extraHeaders || {}));
  res.end(body);
}
function readBody(req, limitMb) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    const LIMIT = (limitMb || 100) * 1024 * 1024;
    req.on('data', (c) => {
      size += c.length;
      if (size > LIMIT) { req.destroy(); reject(new Error('Payload too large')); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { const raw = Buffer.concat(chunks).toString('utf8'); resolve(raw ? JSON.parse(raw) : null); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp',
  '.map': 'application/json; charset=utf-8'
};
function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const isHtml = ext === '.html';
    res.writeHead(200, {
      'Content-Type':   MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control':  isHtml ? 'no-cache, no-store, must-revalidate'
                      : (ext === '.woff2' || ext === '.woff') ? 'public, max-age=31536000, immutable'
                      : 'no-cache',
      'Pragma': 'no-cache', 'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin'
    });
    res.end(data);
  });
}
/* an internal snapshot in the database (kept 20) — taken at most every 10 minutes */
let _lastDbBackup = 0, _lastDbBackupVer = 0;
function takeBackup(force) {
  if (!force && (Date.now() - _lastDbBackup < 600e3 || _lastDbBackupVer === _dataVersion)) return null;
  const json = JSON.stringify(exportBlob());
  const now  = new Date().toISOString();
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO backups (created_at, payload) VALUES (?, ?)').run(now, json);
    const ids = db.prepare('SELECT id FROM backups ORDER BY id DESC').all().map(r => r.id);
    if (ids.length > MAX_BACKUPS) { const del = db.prepare('DELETE FROM backups WHERE id = ?'); for (const id of ids.slice(MAX_BACKUPS)) del.run(id); }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  _lastDbBackup = Date.now(); _lastDbBackupVer = _dataVersion;
  return now;
}
setInterval(() => { try { takeBackup(false); } catch (e) { console.error('[db-backup]', e.message); } }, 600e3);
/* daily file backup (+ Telegram when configured): on start and every hour */
setTimeout(() => store.daily(), 5000);
setInterval(() => store.daily(), 3600e3);

/* changes already applied — a retry (lost response, offline queue, the
   service worker) must never apply the same difference twice */
const _seenOps = new Set();
try {
  db.prepare('DELETE FROM applied_ops WHERE at < ?').run(Date.now() - 30 * 864e5);
  for (const r of db.prepare('SELECT id FROM applied_ops').all()) _seenOps.add(r.id);
} catch (_) {}
function opSeen(id) { return !!id && _seenOps.has(String(id)); }
function opDone(id) {
  if (!id) return;
  _seenOps.add(String(id));
  try { db.prepare('INSERT OR IGNORE INTO applied_ops (id, at) VALUES (?, ?)').run(String(id), Date.now()); } catch (_) {}
}

/* who is calling */
function currentUser(req) {
  const id = auth.sessionUserId(req);
  if (!id) return null;
  const u = store.user(id);
  return u && u.disabled !== true ? u : null;
}
const publicUser = u => ({ id: u.id, username: u.username, name: u.name, role: u.role });

/* ═══════════════════════════════════════════════════════
   REQUEST ROUTER
═══════════════════════════════════════════════════════ */
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  let pathname = parsed.pathname || '/';

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // Strip APP_PATH prefix
  if (APP_PATH) {
    if (pathname === '/' || pathname === APP_PATH) { res.writeHead(302, { Location: APP_PATH + '/' }); return res.end(); }
    if (pathname.startsWith(APP_PATH + '/')) pathname = pathname.slice(APP_PATH.length);
  }

  try {
    /* ── public ── */
    if (pathname === '/api/health') {
      return sendJSON(res, 200, { ok: true, time: new Date().toISOString(), version: _dataVersion, connectedClients: _clients.size });
    }
    if (pathname === '/sw.js') {
      const swPath = path.join(PUBLIC, 'sw.js');
      if (fs.existsSync(swPath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Service-Worker-Allowed': '/' });
        return res.end(fs.readFileSync(swPath));
      }
    }
    if (pathname === '/api/version' && req.method === 'GET') return sendJSON(res, 200, { version: _dataVersion });
    /* a center's own read-only page (token link) */
    if (pathname.startsWith('/p/') && portal.handle(req, res, pathname, store.data)) return;

    /* ── login / logout / who am I ── */
    if (pathname === '/api/login' && req.method === 'POST') {
      const b = (await readBody(req, 1)) || {};
      const wait = auth.throttled(req, b.username);
      if (wait) return sendJSON(res, 429, { error: 'too_many', message: 'محاولات كتير غلط — استنى ' + wait + ' دقيقة وجرّب تاني' });
      const u = store.userByName(b.username);
      const ok = !!u && u.disabled !== true && auth.verifyPassword(String(b.password || ''), auth.storedHash(u.id));
      if (!ok) { auth.failed(req, b.username); return sendJSON(res, 401, { error: 'bad_login', message: 'اسم المستخدم أو كلمة السر غلط' }); }
      auth.succeeded(req, b.username);
      if (!auth.isHash(auth.storedHash(u.id))) auth.migratePasswords();
      const token = auth.createSession(u.id, req);
      const pw = String(b.password || '');
      const weak = pw.length < 6 || pw.toLowerCase() === String(u.username || '').toLowerCase() || /^(admin|123456?|1234|0000|password)$/i.test(pw);
      return sendJSON(res, 200, { ok: true, user: publicUser(u), weak, token }, { 'Set-Cookie': auth.cookieHeader(req, token) });
    }
    if (pathname === '/api/logout' && req.method === 'POST') {
      const t = auth.tokenOf(req); if (t) auth.dropSession(t);
      return sendJSON(res, 200, { ok: true }, { 'Set-Cookie': auth.cookieHeader(req, null) });
    }
    if (pathname === '/api/me' && req.method === 'GET') {
      const u = currentUser(req);
      /* 4.13 · renew the cookie on every visit, so an active device never gets signed out */
      return u ? sendJSON(res, 200, { user: publicUser(u), token: auth.tokenOf(req) }, { 'Set-Cookie': auth.cookieHeader(req, auth.tokenOf(req)) }) : sendJSON(res, 401, { error: 'login' });
    }

    /* ── everything below needs a logged-in user ── */
    if (pathname.startsWith('/api/')) {
      const me = currentUser(req);
      if (!me) return sendJSON(res, 401, { error: 'login', message: 'سجّل دخول الأول' });
      const admin = me.role === 'admin';
      const adminOnly = () => sendJSON(res, 403, { error: 'forbidden', message: 'للمدير بس' });

      /* live dollar / gold prices for the header tape */
      if (pathname === '/api/market' && req.method === 'GET') {
        try { return sendJSON(res, 200, await market.get()); }
        catch (e) { return sendJSON(res, 503, { error: 'market', message: 'أسعار السوق مش متاحة دلوقتي' }); }
      }

      /* data */
      if (pathname === '/api/data' && req.method === 'GET') {
        const blob = store.publicData();
        return sendJSON(res, 200, Object.assign({}, blob, { __version: _dataVersion }));
      }
      if (pathname === '/api/ops' && req.method === 'POST') {
        const b = await readBody(req, 60);
        if (!b || typeof b !== 'object' || !b.ops) return sendJSON(res, 400, { error: 'bad_request' });
        if (opSeen(b.opId)) return sendJSON(res, 200, { ok: true, dup: true, version: _dataVersion });
        const prev = _dataVersion;
        try {
          store.apply(me, b.ops);
          opDone(b.opId);
        } catch (e) {
          if (e instanceof store.Refused) return sendJSON(res, 403, Object.assign({ error: e.code, message: e.message }, e.extra));
          throw e;
        }
        notifyDataChanged({ source: req.headers['x-client-id'] || b.cid || 'unknown', by: me.id });
        return sendJSON(res, 200, { ok: true, version: _dataVersion, prev });
      }
      /* full replace — restore / import (admin only) */
      if (pathname === '/api/data' && req.method === 'POST') {
        if (!admin) return adminOnly();
        const body = await readBody(req);
        if (!body || typeof body !== 'object') return sendJSON(res, 400, { error: 'Invalid body' });
        takeBackup(true);
        store.full(body);
        notifyDataChanged({ source: req.headers['x-client-id'] || 'unknown', type: 'replace' });
        return sendJSON(res, 200, { ok: true, version: _dataVersion });
      }

      /* live updates */
      if (pathname === '/api/events' && req.method === 'GET') {
        const clientId = (++_clientSeq).toString();
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-store', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write(`data: ${JSON.stringify({ event: 'connected', clientId, version: _dataVersion })}\n\n`);
        _clients.set(clientId, { res, userId: me.id });
        req.on('close', () => _clients.delete(clientId));
        req.on('error', () => _clients.delete(clientId));
        req.socket.on('close', () => _clients.delete(clientId));
        const keepalive = setInterval(() => { try { res.write(`: heartbeat\n\n`); } catch { clearInterval(keepalive); _clients.delete(clientId); } }, 15000);
        return;
      }

      /* backups (admin) */
      if (pathname === '/api/backups' && req.method === 'GET') {
        if (!admin) return adminOnly();
        return sendJSON(res, 200, { files: store.listBackups(), telegram: store.telegramStatus(), db: db.prepare('SELECT id, created_at FROM backups ORDER BY id DESC').all() });
      }
      if (pathname === '/api/backup/download' && req.method === 'GET') {
        if (!admin) return adminOnly();
        let buf, name;
        if (parsed.query.file) {
          const p = store.backupPath(parsed.query.file);
          if (!p) return sendJSON(res, 404, { error: 'not_found' });
          buf = fs.readFileSync(p); name = parsed.query.file;
        } else { buf = store.gzBlob(); name = 'emdadx-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json.gz'; }
        res.writeHead(200, { 'Content-Type': 'application/gzip', 'Content-Length': buf.length, 'Content-Disposition': 'attachment; filename="' + name + '"', 'Cache-Control': 'no-store' });
        return res.end(buf);
      }
      if (pathname === '/api/backup/now' && req.method === 'POST') {
        if (!admin) return adminOnly();
        const r = store.writeDaily(true);
        return sendJSON(res, 200, { ok: true, file: r.file, files: store.listBackups() });
      }
      if (pathname === '/api/backup/telegram' && req.method === 'POST') {
        if (!admin) return adminOnly();
        const r = await store.sendTelegram('(إرسال يدوي)');
        return sendJSON(res, r.ok ? 200 : 400, r);
      }

      /* devices that are logged in (admin) */
      if (pathname === '/api/sessions' && req.method === 'GET') {
        if (!admin) return adminOnly();
        const mine = auth.sha(auth.tokenOf(req) || '');
        const rows = auth.listSessions().map(s => {
          const u = store.user(s.user_id) || {};
          return { id: s.id.slice(0, 16), user: u.name || '—', role: u.role || '', created: s.created_at, lastSeen: s.last_seen, ua: s.ua, ip: s.ip, me: s.id === mine };
        });
        return sendJSON(res, 200, { sessions: rows });
      }
      if (pathname === '/api/sessions/revoke' && req.method === 'POST') {
        if (!admin) return adminOnly();
        const b = (await readBody(req, 1)) || {};
        const full = auth.listSessions().find(s => s.id.slice(0, 16) === String(b.id || ''));
        if (full) auth.dropSessionById(full.id);
        return sendJSON(res, 200, { ok: !!full });
      }
      /* change my own password */
      if (pathname === '/api/password' && req.method === 'POST') {
        const b = (await readBody(req, 1)) || {};
        if (!auth.verifyPassword(String(b.current || ''), auth.storedHash(me.id))) return sendJSON(res, 400, { error: 'bad_current', message: 'كلمة السر الحالية غلط' });
        if (String(b.next || '').length < 4) return sendJSON(res, 400, { error: 'weak', message: 'كلمة السر الجديدة 4 حروف على الأقل' });
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(auth.hashPassword(b.next), me.id);
        auth.dropUserSessions(me.id, auth.tokenOf(req));
        return sendJSON(res, 200, { ok: true });
      }

      /* reset (admin) */
      if (pathname === '/api/reset' && req.method === 'POST') {
        if (!admin) return adminOnly();
        takeBackup(true);
        const keepUsers = store.data().users;
        const blob = defaultBlob(); blob.users = keepUsers;     // never lock everyone out
        store.full(blob);
        notifyDataChanged({ type: 'reset' });
        return sendJSON(res, 200, { ok: true });
      }

      return sendJSON(res, 404, { error: 'not_found' });
    }

    /* ── static files ── */
    let rel = pathname === '/' ? '/index.html' : pathname;
    rel = rel.replace(/\.\./g, '');
    const filePath = path.join(PUBLIC, rel);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return serveStatic(res, filePath);
    return serveStatic(res, path.join(PUBLIC, 'index.html'));

  } catch (e) {
    console.error(`[${req.method} ${pathname}]`, e);
    sendJSON(res, 500, { error: e.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log('====================================');
  console.log('  EmdadX ERP — secure real-time sync');
  console.log('====================================');
  console.log('  Listening : ' + HOST + ':' + PORT);
  console.log('  Database  : ' + DB_FILE);
  console.log('  App path  : ' + (APP_PATH || '(root)'));
  console.log('  Telegram  : ' + (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? 'on' : 'off'));
  console.log('====================================');
});
server.on('error', (e) => { console.error('Server error:', e); process.exit(1); });
server.maxConnections = 1000;
