'use strict';

process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name === 'ExperimentalWarning' && /SQLite/i.test(w.message)) return;
  console.warn(w);
});

/* 4.20 · one bad request must never take the whole app down */
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e && e.stack || e));
process.on('uncaughtException', (e) => { console.error('[uncaughtException]', e && e.stack || e); setTimeout(() => process.exit(1), 200); });   // Railway restarts it clean

const http = require('node:http');
const fs   = require('node:fs');
const path = require('node:path');
const url  = require('node:url');

const { db, DB_FILE } = require('./db');
const { exportBlob, defaultBlob } = require('./src/bridge');
const auth  = require('./src/auth');
const store = require('./src/store');
const portal = require('./src/portal');
/* 4.36 · الموظفين + متابعة العملاء + حالات المرضى (ported from Ozarex 4.60 → 4.95) */
const cases = require('./src/cases');     // حالات المرضى (/k/ للمركز، /v/ للمريض، /h/ الباركود الثابت)
const tiles = require('./src/tiles');     // the map's tiles through our server
const webpush = require('./src/webpush'); // push notifications (no outside service)
const staff = require('./src/staff');     // the employees' own app (/staff) + the manager's side
const adminIds = () => ((store.data() || {}).users || []).filter(u => u && u.role === 'admin' && !u.disabled).map(u => u.id);
/* the employees pick the center they're working at from the ERP's own customers */
staff.setSource({
  centers: () => ((store.data() || {}).customers || []).filter(c => c && c.id && c.name && !c.archived && !c.disabled)
    .map(c => ({ key: 'main:' + c.id, id: c.id, branch: 'main', name: String(c.name).slice(0, 120), address: String(c.address || '').slice(0, 160) })),
  branches: () => []
});
staff.setNotify({
  center: (cid, msg) => portal.notifyCenter(cid, msg),
  admins: adminIds,
  event: (name, payload) => { try { broadcast(name, payload); } catch (e) {} }
});
portal.setNotify({
  admins: adminIds,
  event: (name, payload) => { try { broadcast(name, payload); } catch (e) {} },
  push: webpush,
  staff: { createTask: (b, who) => staff.createTask(b, who), activeEmps: () => staff.activeEmps(), techs: () => staff.techs(), taskByReq: id => staff.taskByReq(id), staffPhoto: id => staff.staffPhoto(id), toEmps: (ids, msg) => staff.toEmps(ids, msg) }
});
/* a center with no WhatsApp number set → its phone from the ERP, else the company's */
cases.setLookup(cid => {
  const d = store.data() || {}, c = (d.customers || []).find(x => x && x.id === cid);
  if (c && c.phone) return c.phone;
  const st = d.settings || {}; return st.companyPhone || st.companyWhatsapp || '';
});
const market = require('./src/market');
const adsMod = require('./src/ads');
try { market.init(require('./db').DATA_DIR); } catch (e) { console.warn('[market] init', e.message); }

const PORT     = Number(process.env.PORT) || 8787;
const HOST     = process.env.HOST || '0.0.0.0';
const APP_PATH = process.env.APP_PATH !== undefined ? process.env.APP_PATH : '/Ozarex';
const PUBLIC   = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'frontend', 'public');
const MAX_BACKUPS = 20;

/* ═══ start-up: hash old passwords, load sessions + data ═══ */
auth.migratePasswords();
auth.loadSessions();
/* 4.20 · anyone still on an easy password (from before this version) gets the change screen too */
setTimeout(async () => {          // in the background, so a big users list never slows the start
  try {
    for (const u of db.prepare('SELECT id, username, password FROM users').all()) {
      const tries = ['admin', '123456', '12345', '1234', '0000', '000000', '111111', 'password', '12345678', 'qwerty', String(u.username || '')].filter(Boolean);
      for (const p of tries) {
        if (await auth.verifyPasswordAsync(p, u.password)) { db.prepare('INSERT INTO user_flags (user_id, must_change) VALUES (?, 1) ON CONFLICT(user_id) DO UPDATE SET must_change = 1').run(u.id); break; }
      }
    }
  } catch (e) { console.error('[weak-check]', e.message); }
}, 3000);
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
/* 4.29 · Smart Ads Manager (its own tables + /api/ads routes) */
const ads = adsMod.create({ db, readBody: (...a) => readBody(...a), sendJSON: (...a) => sendJSON(...a), broadcast });
setInterval(() => {
  const now = Date.now(), dead = [];
  for (const [id, client] of _clients) { try { client.res.write(`: ping ${now}\n\n`); } catch (_) { dead.push(id); } }
  dead.forEach(id => _clients.delete(id));
}, 20000);

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
/* 4.20 · security headers on every response: no framing (click-jacking), no MIME sniffing,
   HTTPS-only once the app has been opened over HTTPS, no plugins / foreign <base> */
function secHeaders(req) {
  const h = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self), payment=()'
  };
  if (req && auth.isHttps && auth.isHttps(req)) h['Strict-Transport-Security'] = 'max-age=31536000';
  return h;
}
function sendJSON(res, status, obj, extraHeaders) {
  if (res.headersSent || res.writableEnded) return;
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign(secHeaders(res.req), {
    'Content-Type':   'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control':  'no-store'
  }, extraHeaders || {}));
  res.end(body);
}
function readBody(req, limitMb) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    const LIMIT = (limitMb || 1) * 1024 * 1024;
    req.on('data', (c) => {
      size += c.length;
      if (size > LIMIT) { const err = new Error('too_large'); err.status = 413; reject(err); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { const raw = Buffer.concat(chunks).toString('utf8'); resolve(raw ? JSON.parse(raw) : null); }
      catch (e) { const err = new Error('bad_json'); err.status = 400; reject(err); }
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
    res.writeHead(200, Object.assign(secHeaders(res.req), {
      'Content-Type':   MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control':  isHtml ? 'no-cache, no-store, must-revalidate'
                      : (ext === '.woff2' || ext === '.woff') ? 'public, max-age=31536000, immutable'
                      : 'no-cache',
      'Pragma': 'no-cache', 'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin'
    }));
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
/* weak password → must change it first */
function mustChange(id) { if (process.env.EMX_DEV_WEAK_OK === '1') return false; try { const r = db.prepare('SELECT must_change FROM user_flags WHERE user_id = ?').get(id); return !!(r && r.must_change); } catch (e) { return false; } }
function setMustChange(id, on) { try { db.prepare('INSERT INTO user_flags (user_id, must_change) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET must_change = excluded.must_change').run(id, on ? 1 : 0); } catch (e) { console.error('[user_flags]', e.message); } }
function weakPw(pw, username) { pw = String(pw || ''); return pw.length < 6 || pw.toLowerCase() === String(username || '').toLowerCase() || /^(admin|123456?|1234|0000|000000|111111|password|12345678|qwerty)$/i.test(pw); }

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
      return sendJSON(res, 200, { ok: true, time: new Date().toISOString() });
    }
    if (pathname === '/sw.js') {
      const swPath = path.join(PUBLIC, 'sw.js');
      if (fs.existsSync(swPath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Service-Worker-Allowed': '/' });
        return res.end(fs.readFileSync(swPath));
      }
    }
    if (pathname === '/api/version' && req.method === 'GET') return sendJSON(res, 200, { version: _dataVersion });
    if (pathname.startsWith('/tiles/') && tiles.handle(req, res, pathname)) return;   // the map's tiles through our server
    if ((pathname.startsWith('/k/') || pathname.startsWith('/v/') || pathname.startsWith('/h/')) && await cases.handle(req, res, pathname)) return;   // حالات المرضى
    /* a center's own page (token link: /p/<long>, /c/<8>, or the shortest /<6 letters with a digit>) */
    if ((pathname.startsWith('/p/') || pathname.startsWith('/c/') || /^\/[A-Za-z0-9]{6}(\/[a-z.]+(\/[A-Za-z0-9_-]+)?)?\/?$/.test(pathname)) && portal.handle(req, res, pathname, () => store.data())) return;

    /* الموظفين: the employee's own page (/staff) and its API — his own login, never the ERP's */
    if (pathname === '/staff/') { res.writeHead(302, { Location: APP_PATH + '/staff' }); return res.end(); }
    if (pathname === '/staff') return serveStatic(res, path.join(PUBLIC, 'staff.html'));
    if (pathname === '/staff-sw.js') {
      try { const data = await fs.promises.readFile(path.join(PUBLIC, 'staff-sw.js')); res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Service-Worker-Allowed': '/staff' }); return res.end(data); } catch (_) {}
    }
    if (pathname === '/staff/manifest.json') return sendJSON(res, 200, { name: 'حضور وانصراف', short_name: 'حضوري', start_url: '../staff', scope: '../', display: 'standalone', background_color: '#0c0809', theme_color: '#0c0809', lang: 'ar', dir: 'rtl', icons: [{ src: '../icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '../icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }, { 'Cache-Control': 'public, max-age=3600' });
    if (pathname.startsWith('/staff/api/')) return await staff.handlePublic(req, res, pathname, { sendJSON, readBody, settings: () => (store.data() || {}).settings || {} });

    /* ── login / logout / who am I ── */
    if (pathname === '/api/login' && req.method === 'POST') {
      const b = (await readBody(req, 0.02)) || {};
      const name = String(b.username || '').slice(0, 64), pw = String(b.password || '').slice(0, 256);
      const wait = auth.throttled(req, name);
      if (wait) return sendJSON(res, 429, { error: 'too_many', message: 'محاولات كتير غلط — استنى ' + wait + ' دقيقة وجرّب تاني' });
      const u = store.userByName(name);
      let ok = false;
      try { ok = !!u && u.disabled !== true && await auth.verifyPasswordAsync(pw, auth.storedHash(u.id)); }
      catch (e) { return sendJSON(res, 503, { error: 'busy', message: 'السيرفر مشغول — جرّب كمان ثانية' }); }
      if (!ok) { auth.failed(req, name); return sendJSON(res, 401, { error: 'bad_login', message: 'اسم المستخدم أو كلمة السر غلط' }); }
      auth.succeeded(req, name);
      if (!auth.isHash(auth.storedHash(u.id))) auth.migratePasswords();
      const token = auth.createSession(u.id, req);
      const weak = weakPw(pw, u.username);
      setMustChange(u.id, weak);
      return sendJSON(res, 200, { ok: true, user: publicUser(u), weak, mustChange: mustChange(u.id), token }, { 'Set-Cookie': auth.cookieHeader(req, token) });
    }
    if (pathname === '/api/logout' && req.method === 'POST') {
      const t = auth.tokenOf(req); if (t) auth.dropSession(t);
      return sendJSON(res, 200, { ok: true }, { 'Set-Cookie': auth.cookieHeader(req, null) });
    }
    if (pathname === '/api/me' && req.method === 'GET') {
      const u = currentUser(req);
      /* 4.13 · renew the cookie on every visit, so an active device never gets signed out */
      return u ? sendJSON(res, 200, { user: publicUser(u), token: auth.tokenOf(req), mustChange: mustChange(u.id) }, { 'Set-Cookie': auth.cookieHeader(req, auth.tokenOf(req)) }) : sendJSON(res, 401, { error: 'login' });
    }

    /* ── everything below needs a logged-in user ── */
    if (pathname.startsWith('/api/')) {
      const me = currentUser(req);
      if (!me) return sendJSON(res, 401, { error: 'login', message: 'سجّل دخول الأول' });
      const admin = me.role === 'admin';
      const adminOnly = () => sendJSON(res, 403, { error: 'forbidden', message: 'للمدير بس' });
      /* a weak password (e.g. the first admin/admin): reading is fine, nothing gets written until it's changed */
      if (req.method !== 'GET' && pathname !== '/api/password' && mustChange(me.id))
        return sendJSON(res, 403, { error: 'must_change', message: 'غيّر كلمة السر الأول — دي سهلة التخمين' });

      /* الموظفين / متابعة العملاء / حالات المرضى — the manager's side (admin only) */
      if (pathname === '/api/portal/cases' || pathname.startsWith('/api/portal/cases/')) { if (!admin) return adminOnly(); return await cases.adminApi(req, res, pathname, me); }
      if (pathname.startsWith('/api/portal/')) { if (!admin) return adminOnly(); return await portal.adminApi(req, res, pathname, me, { sendJSON, readBody }); }
      if (pathname === '/api/staff' || pathname.startsWith('/api/staff/')) { if (!admin) return adminOnly(); return await staff.handleAdmin(req, res, pathname, me, { sendJSON, readBody }); }
      /* push notifications on this device (any signed-in user) */
      if (pathname === '/api/push/key' && req.method === 'GET') return sendJSON(res, 200, { key: webpush.publicKey(), devices: webpush.countFor(me.id) });
      if (pathname === '/api/push/subscribe' && req.method === 'POST') {
        const b = (await readBody(req, 0.02)) || {};
        try { webpush.subscribe(me, b.subscription, req.headers['user-agent']); } catch (e) { return sendJSON(res, 400, { error: 'bad_request', message: 'الاشتراك ده مش صالح' }); }
        return sendJSON(res, 200, { ok: true, devices: webpush.countFor(me.id) });
      }
      if (pathname === '/api/push/unsubscribe' && req.method === 'POST') {
        const b = (await readBody(req, 0.02)) || {};
        webpush.unsubscribe(b.endpoint);
        return sendJSON(res, 200, { ok: true, devices: webpush.countFor(me.id) });
      }
      if (pathname === '/api/push/test' && req.method === 'POST') {
        const r = await webpush.send([me.id], { title: '🔔 الإشعارات شغّالة', body: 'هيوصلك هنا طلبات المراكز وحضور الموظفين وطلبات الصيانة', url: './?go=clients', tag: 'test' });
        return sendJSON(res, 200, { ok: r.ok > 0, devices: r.devices, sent: r.ok });
      }

      /* ads: everyone reads their feed + records views/clicks; only admins manage */
      if (pathname === '/api/ads' || pathname.startsWith('/api/ads/')) return await ads.handle(req, res, pathname, me);

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
        const b = await readBody(req, 15);
        if (!b || typeof b !== 'object' || !b.ops || typeof b.ops !== 'object') return sendJSON(res, 400, { error: 'bad_request' });
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
        const body = await readBody(req, 60);
        if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJSON(res, 400, { error: 'Invalid body' });
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
        /* at most 6 live streams per user — the oldest one is closed */
        const mine = [..._clients].filter(([, c]) => c.userId === me.id);
        if (mine.length >= 6) mine.slice(0, mine.length - 5).forEach(([id, c]) => { _clients.delete(id); try { c.res.end(); } catch (_) {} });
        _clients.set(clientId, { res, userId: me.id });
        const keepalive = setInterval(() => { if (res.writableEnded || res.destroyed) return done(); try { res.write(`: heartbeat\n\n`); } catch { done(); } }, 15000);
        function done() { clearInterval(keepalive); _clients.delete(clientId); }
        req.on('close', done); req.on('error', done); res.on('close', done);
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
        const b = (await readBody(req, 0.02)) || {};
        const wait = auth.throttled(req, 'pw:' + me.id);
        if (wait) return sendJSON(res, 429, { error: 'too_many', message: 'محاولات كتير غلط — استنى ' + wait + ' دقيقة' });
        let okCur = false;
        try { okCur = await auth.verifyPasswordAsync(String(b.current || '').slice(0, 256), auth.storedHash(me.id)); }
        catch (e) { return sendJSON(res, 503, { error: 'busy', message: 'السيرفر مشغول — جرّب كمان ثانية' }); }
        if (!okCur) { auth.failed(req, 'pw:' + me.id); return sendJSON(res, 400, { error: 'bad_current', message: 'كلمة السر الحالية غلط' }); }
        const next = String(b.next || '');
        if (next.length < 6 || next.length > 128) return sendJSON(res, 400, { error: 'weak', message: 'كلمة السر الجديدة من 6 حروف لـ 128' });
        if (weakPw(next, me.username)) return sendJSON(res, 400, { error: 'weak', message: 'كلمة السر دي سهلة التخمين — اختار حاجة أصعب' });
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(auth.hashPassword(next), me.id);
        setMustChange(me.id, false);
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
    if (e && e.status) { if (!res.headersSent) sendJSON(res, e.status, { error: e.message }); else res.destroy(); return; }
    console.error(`[${req.method} ${pathname}]`, e);
    if (!res.headersSent) sendJSON(res, 500, { error: 'server', message: 'حصلت مشكلة في السيرفر' }); else res.destroy();
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
server.maxConnections = 3000;
/* 4.20 · slow / half-open requests get dropped instead of piling up */
server.headersTimeout = 15000;      // the request line + headers must arrive within 15 s
server.requestTimeout = 900000;     // a whole request within 15 min (a big case PDF from a center on a slow upload line)
server.keepAliveTimeout = 10000;
server.timeout = 0;                 // live streams (SSE) stay open; they have their own heartbeat
