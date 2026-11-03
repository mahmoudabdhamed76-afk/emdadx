'use strict';
/* ════════════════════════════════════════════════════════════════════
   4.90 · حالات المرضى — لينك منفصل لكل مركز بباسوورد: /k/<code>
   المركز يفتحه من الكمبيوتر بتاعه، يرفع PDF الحالة، ويطلعله باركود.
   المريض يمسح الباركود ← /v/<token>#<key> ويشوف الحالة على موبايله.

   · الملف بيتشفّر في متصفح المركز (AES-GCM) قبل ما يطلع من الجهاز،
     والمفتاح جوّه الباركود بس (بعد #) — السيرفر عمره ما بيشوف المفتاح.
   · الأصل محفوظ على جهاز المركز (IndexedDB). السيرفر بيحتفظ بنسخة
     مشفّرة مؤقتة 7 أيام بس؛ بعدها لو المريض فتح، السيرفر بيطلب الملف
     من جهاز المركز لايف (لو الصفحة مفتوحة) ويوصّله للمريض.
════════════════════════════════════════════════════════════════════ */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { db, DATA_DIR } = require('../db');
const webpush = require('./webpush');

db.exec(`CREATE TABLE IF NOT EXISTS case_site (
  customer_id TEXT PRIMARY KEY, center_name TEXT, code TEXT UNIQUE NOT NULL, pass TEXT NOT NULL, ver INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT, created_by TEXT, last_seen TEXT
);
CREATE TABLE IF NOT EXISTS case_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, token TEXT UNIQUE NOT NULL, patient TEXT, phone TEXT, exam TEXT,
  file_name TEXT, size INTEGER, pages INTEGER, created_at TEXT, views INTEGER NOT NULL DEFAULT 0, last_view TEXT,
  active INTEGER NOT NULL DEFAULT 1, cache_until INTEGER, cached INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_case_item ON case_item (customer_id, id);
CREATE TABLE IF NOT EXISTS case_kv (k TEXT PRIMARY KEY, v TEXT)`);
/* 4.91 · الباركود الثابت للورق: كود عام للمركز (/h/<pub>) + مفتاح كل حالة متغلّف بموبايل المريض وأول اسمه */
try {
  const sc = db.prepare('PRAGMA table_info(case_site)').all().map(c => c.name);
  if (!sc.includes('pub')) db.exec('ALTER TABLE case_site ADD COLUMN pub TEXT');
  if (!sc.includes('fixed_on')) db.exec('ALTER TABLE case_site ADD COLUMN fixed_on INTEGER NOT NULL DEFAULT 1');
  const ic = db.prepare('PRAGMA table_info(case_item)').all().map(c => c.name);
  if (!ic.includes('phash')) db.exec('ALTER TABLE case_item ADD COLUMN phash TEXT');
  if (!ic.includes('wrap')) db.exec('ALTER TABLE case_item ADD COLUMN wrap TEXT');
  if (!ic.includes('kind')) db.exec("ALTER TABLE case_item ADD COLUMN kind TEXT NOT NULL DEFAULT 'pdf'");   /* 5.00 · pdf | dicom */
  if (!ic.includes('wrap2')) db.exec('ALTER TABLE case_item ADD COLUMN wrap2 TEXT');   /* 4.99 · the key wrapped by the mobile alone (the fixed barcode asks for the mobile only) */
  if (!sc.includes('wa')) db.exec('ALTER TABLE case_site ADD COLUMN wa TEXT');
  if (!sc.includes('dashboard_layout')) db.exec("ALTER TABLE case_site ADD COLUMN dashboard_layout TEXT NOT NULL DEFAULT 'teal'");
  if (!sc.includes('theme')) db.exec("ALTER TABLE case_site ADD COLUMN theme TEXT NOT NULL DEFAULT 'a'");   /* 5.01 · the patient pages' look: a «نَفَس» | c «دفا» */
  if (!sc.includes('logo')) db.exec('ALTER TABLE case_site ADD COLUMN logo TEXT');   /* 4.98 · the center's own logo (also in the middle of every QR) */
  db.exec('CREATE TABLE IF NOT EXISTS case_view (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL, customer_id TEXT, at TEXT, dev TEXT, via TEXT, src TEXT); CREATE INDEX IF NOT EXISTS ix_case_view ON case_view (token, id)');
  db.exec('CREATE TABLE IF NOT EXISTS case_ask (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, name TEXT, phone TEXT, phash TEXT, note TEXT, at TEXT, done INTEGER NOT NULL DEFAULT 0); CREATE INDEX IF NOT EXISTS ix_case_ask ON case_ask (customer_id, done, id)');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ux_case_pub ON case_site (pub); CREATE INDEX IF NOT EXISTS ix_case_phash ON case_item (customer_id, phash)');
} catch (e) { console.error('[cases] migrate', e.message); }
/* Appointment requests are kept separately from medical studies. A request is NOT a confirmed slot. */
db.exec(`CREATE TABLE IF NOT EXISTS case_booking (
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, name TEXT NOT NULL,
  phone TEXT NOT NULL, exam TEXT NOT NULL, day TEXT NOT NULL, slot TEXT NOT NULL,
  note TEXT, at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', updated_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_case_booking ON case_booking (customer_id, status, id);`);
/* Patient feedback and report requests, separate from medical studies and bookings. */
db.exec(`CREATE TABLE IF NOT EXISTS case_service_request (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 customer_id TEXT NOT NULL, kind TEXT NOT NULL,
 name TEXT NOT NULL, phone TEXT NOT NULL,
 subject TEXT, message TEXT NOT NULL,
 files_json TEXT NOT NULL DEFAULT '[]',
 at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', updated_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_case_service_requests ON case_service_request(customer_id, kind, status, id);`);
/* Separate opt-in subscriptions, linked to the patient's random device token,
   never to a phone number or to a different patient's request. */
db.exec(`CREATE TABLE IF NOT EXISTS case_push_device (
  token TEXT PRIMARY KEY, customer_id TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_case_push_device_center ON case_push_device(customer_id);`);
for (const [table, column] of [['case_booking','notify_device'],['case_service_request','notify_device'],['case_ask','notify_device']]) {
  const existing = db.prepare('PRAGMA table_info('+table+')').all().map(c => c.name);
  if (!existing.includes(column)) db.exec('ALTER TABLE '+table+' ADD COLUMN '+column+' TEXT');
}
/* Anonymous QR landing analytics. No geolocation or IP is saved. */
db.exec(`CREATE TABLE IF NOT EXISTS case_qr_stat (
 customer_id TEXT PRIMARY KEY, total INTEGER NOT NULL DEFAULT 0,
 count_fixed INTEGER NOT NULL DEFAULT 0, count_report INTEGER NOT NULL DEFAULT 0,
 day TEXT, today INTEGER NOT NULL DEFAULT 0, last_at TEXT
);
CREATE TABLE IF NOT EXISTS case_qr_visit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL,
 at TEXT NOT NULL, kind TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_case_qr_visit ON case_qr_visit (customer_id, id);`);
/* Erase previously stored location columns without losing aggregate counts or timestamps. */
if (db.prepare('PRAGMA table_info(case_qr_visit)').all().some(c => c.name === 'city' || c.name === 'country')) {
  try {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE case_qr_visit_clean (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, at TEXT NOT NULL, kind TEXT NOT NULL);
      INSERT INTO case_qr_visit_clean (id, customer_id, at, kind) SELECT id, customer_id, at, kind FROM case_qr_visit;
      DROP TABLE case_qr_visit;
      ALTER TABLE case_qr_visit_clean RENAME TO case_qr_visit;
      CREATE INDEX IF NOT EXISTS ix_case_qr_visit ON case_qr_visit (customer_id, id);
      COMMIT;`);
  } catch (e) { try { db.exec('ROLLBACK'); } catch (_) {} throw e; }
}


const DIR = path.join(DATA_DIR, 'cases');
try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) {}
const CACHE_DAYS = 7, MAX_MB = 80, CACHE_CAP = Number(process.env.CASES_CACHE_GB || 4) * 1024 * 1024 * 1024;
const SECRET = (() => {
  let r = db.prepare("SELECT v FROM case_kv WHERE k = 'secret'").get();
  if (!r) { const v = crypto.randomBytes(32).toString('hex'); db.prepare("INSERT INTO case_kv (k, v) VALUES ('secret', ?)").run(v); r = { v }; }
  return r.v;
})();
const TZ = process.env.TZ_APP || 'Africa/Cairo';
function nowTs() { try { return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()).replace('T', ' '); } catch (e) { return new Date().toISOString().slice(0, 19).replace('T', ' '); } }
const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
function rnd(n, digit) { let t; do { const b = crypto.randomBytes(n); t = Array.from(b, x => AB[x % AB.length]).join(''); } while (digit && !/\d/.test(t)); return t; }
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
function hashPass(p) { const salt = crypto.randomBytes(16); return salt.toString('hex') + ':' + crypto.scryptSync(String(p), salt, 32).toString('hex'); }
function passOk(p, h) { try { const [s, k] = String(h).split(':'); const a = crypto.scryptSync(String(p), Buffer.from(s, 'hex'), 32), b = Buffer.from(k, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); } catch (e) { return false; } }
const isHttps = req => String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' || !!(req.socket && req.socket.encrypted);
const ipOf = req => { const xf = req.headers['x-forwarded-for']; return (xf ? String(xf).split(',').pop().trim() : (req.socket && req.socket.remoteAddress) || ''); };
const fileOf = tok => path.join(DIR, tok + '.bin');
/* the patient's mobile → its last 10 digits (01xxxxxxxxx / +201xxxxxxxxx / 1xxxxxxxxx all match) → keyed hash */
function last10(p) { const d = String(p || '').replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/\D/g, ''); return d.length >= 8 ? d.slice(-10) : ''; }
function phashOf(p) { const d = last10(p); return d ? crypto.createHmac('sha256', SECRET).update('ph:' + d).digest('base64url').slice(0, 32) : null; }
function pubOf(site) { if (site.pub) return site.pub; let p; do { p = rnd(8, true); } while (db.prepare('SELECT 1 FROM case_site WHERE pub = ?').get(p)); db.prepare('UPDATE case_site SET pub = ? WHERE customer_id = ?').run(p, site.customer_id); site.pub = p; return p; }
/* 4.92 · the center's WhatsApp for patients who didn't find their result → wa.me format (Egypt: 01x… → 201x…) */
function waOf(p) { let d = String(p || '').replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/\D/g, ''); if (!d) return ''; if (d.startsWith('00')) d = d.slice(2); else if (d.startsWith('0')) d = '2' + d; else if (d.length === 10 && d[0] === '1') d = '20' + d; return d.length >= 10 && d.length <= 15 ? d : ''; }
let LOOKUP = null;   /* server.js: customer id → the center's phone in the ERP (fallback when the center didn't set a WhatsApp number) */
function setLookup(f) { LOOKUP = typeof f === 'function' ? f : null; }
function waFor(cid, wa) { const w = waOf(wa); if (w) return w; try { return LOOKUP ? waOf(LOOKUP(cid)) : ''; } catch (e) { return ''; } }
function asksOf(cid) { return db.prepare('SELECT id, name, phone, note, at FROM case_ask WHERE customer_id = ? AND done = 0 ORDER BY id DESC LIMIT 60').all(cid); }
function bookingsOf(cid) { return db.prepare("SELECT id, name, phone, exam, day, slot, note, at FROM case_booking WHERE customer_id = ? AND status = 'new' ORDER BY id DESC LIMIT 100").all(cid); }
function serviceRequestsOf(cid) {
  return db.prepare("SELECT id,kind,name,phone,subject,message,at,files_json FROM case_service_request WHERE customer_id = ? AND status = 'new' ORDER BY id DESC LIMIT 100").all(cid)
    .map(x => ({ id:x.id, kind:x.kind, name:x.name, phone:x.phone, subject:x.subject, message:x.message, at:x.at,
      files: (() => { try { return JSON.parse(x.files_json || '[]').map((f,i) => ({ index:i, name:f.name, mime:f.mime })); } catch (_) { return []; } })() }));
}
/* Store private patient-uploaded photos encrypted at rest; access requires the center login. */
const REQ_FILE_DIR = path.join(DATA_DIR, 'cases', 'request-photos');
try { fs.mkdirSync(REQ_FILE_DIR, {recursive:true,mode:0o700}); } catch (e) { console.error('[cases request store]',e.message); }
const REQUEST_FILE_KEY = crypto.createHash('sha256').update('case-request-photo:' + SECRET).digest();
function requestPhotoPath(id) { return path.join(REQ_FILE_DIR, id + '.bin'); }
function requestPhotoMime(buf) {
  if (buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0,8).equals(Buffer.from('89504E470D0A1A0A','hex'))) return 'image/png';
  if (buf.length >= 12 && buf.toString('ascii',0,4) === 'RIFF' && buf.toString('ascii',8,12) === 'WEBP') return 'image/webp';
  return '';
}
function storeRequestPhoto(buf) {
  const id = rnd(16), iv = crypto.randomBytes(12), aes = crypto.createCipheriv('aes-256-gcm',REQUEST_FILE_KEY,iv);
  const ciphertext = Buffer.concat([aes.update(buf),aes.final()]);
  const blob = Buffer.concat([iv,aes.getAuthTag(),ciphertext]);
  fs.writeFileSync(requestPhotoPath(id),blob,{flag:'wx',mode:0o600});
  return id;
}
function getRequestPhoto(id) {
  const blob = fs.readFileSync(requestPhotoPath(id));
  if (blob.length < 29) throw Error('Invalid image');
  const aes = crypto.createDecipheriv('aes-256-gcm',REQUEST_FILE_KEY,blob.subarray(0,12));
  aes.setAuthTag(blob.subarray(12,28));
  return Buffer.concat([aes.update(blob.subarray(28)),aes.final()]);
}
function sweepRequestPhotos() {
  try {
    const cutoff = new Date(Date.now()-30*864e5).toISOString().slice(0,10);
    const rows = db.prepare("SELECT id, files_json FROM case_service_request WHERE at < ? AND files_json != '[]'").all(cutoff);
    for (const row of rows) {
      let files=[];try { files=JSON.parse(row.files_json||'[]'); }catch (_) {}
      for (const f of files) if (/^[A-Za-z0-9]{16}$/.test(f.id||'')) try { fs.unlinkSync(requestPhotoPath(f.id)); } catch (_) {}
      db.prepare("UPDATE case_service_request SET files_json = '[]' WHERE id = ?").run(row.id);
    }
  } catch (e) { console.warn('[case-photo-retention]',e.message); }
}
setTimeout(sweepRequestPhotos,60000).unref();
setInterval(sweepRequestPhotos,864e5).unref();
/* 'QR opens' means a browser opened the QR destination, not a verified camera scan. */
function qrStatsOf(cid) {
  const row = db.prepare('SELECT total, count_fixed, count_report, day, today, last_at FROM case_qr_stat WHERE customer_id = ?').get(cid);
  const today = nowTs().slice(0, 10);
  const recent = db.prepare('SELECT at, kind FROM case_qr_visit WHERE customer_id = ? ORDER BY id DESC LIMIT 80').all(cid);
  return {
    total: row ? row.total : 0, fixed: row ? row.count_fixed : 0,
    report: row ? row.count_report : 0, today: row && row.day === today ? row.today : 0,
    last: row ? row.last_at : '', recent
  };
}
function qrOpen(req, cid, kind) {
  try {
    const ua = String(req.headers['user-agent'] || '');
    if (/(bot|crawl|spider|slurp|preview|facebookexternalhit|telegrambot|discordbot|headless|uptime|monitoring)/i.test(ua)) return;
    if (/prefetch/i.test(String(req.headers.purpose || '') + ' ' + String(req.headers['sec-purpose'] || ''))) return;
    if (limited('qr-open:' + cid + ':' + ipOf(req), 120, 600000)) return;
    const at = nowTs(), day = at.slice(0, 10);
    db.prepare(`INSERT INTO case_qr_stat (customer_id, total, count_fixed, count_report, day, today, last_at)
      VALUES (?, 1, ?, ?, ?, 1, ?)
      ON CONFLICT(customer_id) DO UPDATE SET total = total + 1,
      count_fixed = count_fixed + excluded.count_fixed,
      count_report = count_report + excluded.count_report,
      today = CASE WHEN case_qr_stat.day = excluded.day THEN case_qr_stat.today + 1 ELSE 1 END,
      day = excluded.day, last_at = excluded.last_at`).run(cid, kind === 'fixed' ? 1 : 0, kind === 'report' ? 1 : 0, day, at);
    db.prepare('INSERT INTO case_qr_visit (customer_id, at, kind) VALUES (?,?,?)').run(cid, at, kind);
    /* Keep only the most recent 80 anonymous visits per center; totals remain permanent. */
    db.prepare('DELETE FROM case_qr_visit WHERE customer_id = ? AND id NOT IN (SELECT id FROM case_qr_visit WHERE customer_id = ? ORDER BY id DESC LIMIT 80)').run(cid, cid);
    tell(cid, 'qr-open', { qr: qrStatsOf(cid) });
  } catch (e) { console.warn('[qr-analytics]', e.message); } /* no failure can block patient access */
}
/* QR-specific Web Push reuses the existing VAPID delivery engine and preserves
   per-center authorization; lock-screen bodies never include patient details. */
function pushCenterId(cid) {
  return 'qrc:' + crypto.createHmac('sha256',SECRET).update('center:'+cid).digest('hex').slice(0,40);
}
function pushPatientId(deviceToken) {
  return 'qrp:' + crypto.createHmac('sha256',SECRET).update('patient:'+deviceToken).digest('hex').slice(0,40);
}
function optInDevice(cid, token) {
  return /^[a-f0-9]{32}$/.test(String(token||'')) &&
    !!db.prepare('SELECT 1 FROM case_push_device WHERE token = ? AND customer_id = ?').get(token,cid);
}
function pushCenterAlert(site,section,description,tag) {
  const url='/k/'+site.code+'?section='+section+'#page-'+section;
  webpush.send([pushCenterId(site.customer_id)],{
    title:'🔔 QR Patient · '+(site.center_name||'المركز'),
    body:description,url,tag:'qrc-'+tag
  }).catch(e => console.warn('[qrc-push]',e.message));
}
function pushPatientAlert(deviceToken,pub) {
  if (!deviceToken) return;
  webpush.send([pushPatientId(deviceToken)],{
    title:'🔔 تحديث طلبك من مركز الأشعة',
    body:'المركز حدّث حالة طلبك. افتح بوابة المركز للمتابعة.',
    url:'/h/'+pub,tag:'qrp-status'
  }).catch(e => console.warn('[qrp-push]',e.message));
}
function webAppManifest(site,kind) {
  const center=String(site.center_name||'مركز الأشعة').slice(0,90);
  const base='/'+kind+'/'+(kind==='h'?pubOf(site):site.code);
  return {
    id:base,name:kind==='k'?'QR Patient · '+center:center+' · بوابة المرضى',
    short_name:kind==='k'?'QR Patient':'بوابة الأشعة',
    start_url:base,scope:'/'+kind+'/',display:'standalone',
    background_color:'#F2FBF8',theme_color:'#087D70',lang:'ar',dir:'rtl',
    icons:[
      {src:'/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},
      {src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
    ]
  };
}
function respondManifest(res,site,kind) {
  res.writeHead(200,{'Content-Type':'application/manifest+json; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(webAppManifest(site,kind)));
}
function respondIcon(res,site) {
  const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(site.logo||'');
  if (!match) { res.writeHead(302,{Location:'/icons/icon-192.png','Cache-Control':'public, max-age=300'});res.end();return; }
  const buf=Buffer.from(match[2],'base64');
  if (buf.length>250000 || !requestPhotoMime(buf)) {
    res.writeHead(302,{Location:'/icons/icon-192.png'});res.end();return;
  }
  res.writeHead(200,{'Content-Type':match[1],'Content-Length':String(buf.length),'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});
  res.end(buf);
}
function validOrigin(req) {
  const source=req.headers.origin;
  if (!source) return req.headers['sec-fetch-site'] !== 'cross-site';
  try {return new URL(source).host===req.headers.host;}catch(_){return false;}
}
function bookingPhone(p) {
  let d = String(p || '').replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('20')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('1')) d = '0' + d;
  return /^01[0125]\d{8}$/.test(d) ? d : '';
}
function maskName(n) { return String(n || '').trim().split(/\s+/).slice(0, 3).map(w => w.charAt(0) + '•••').join(' '); }

/* ── center session cookie: code.exp.ver.sig (logs out everywhere when the password changes) ── */
const SESSION_DAYS = 30;
function sign(s) { return crypto.createHmac('sha256', SECRET).update(s).digest('base64url'); }
function cookieOf(req) { const m = /(?:^|;\s*)ozk=([^;]+)/.exec(req.headers.cookie || ''); return m ? decodeURIComponent(m[1]) : ''; }
function authed(req, site) {
  const p = cookieOf(req).split('.'); if (p.length !== 4) return false;
  if (p[0] !== site.code || Number(p[2]) !== site.ver || Number(p[1]) < Date.now()) return false;
  const want = sign(p.slice(0, 3).join('.')); return want.length === p[3].length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(p[3]));
}
function setCookie(req, site, on) {
  const exp = Date.now() + SESSION_DAYS * 864e5, v = site.code + '.' + exp + '.' + site.ver, val = v + '.' + sign(v);
  return 'ozk=' + (on ? encodeURIComponent(val) : '') + '; Path=/k/' + site.code + '; HttpOnly; SameSite=Lax' + (isHttps(req) ? '; Secure' : '') + '; Max-Age=' + (on ? SESSION_DAYS * 86400 : 0);
}

/* ── who is online: the center's open pages (SSE) ── */
const LIVE = new Map();      // customer_id → Set<res>
const TICKETS = new Map();   // ticket → { res, cid, token, left, timer }
function online(cid) { const s = LIVE.get(cid); return !!(s && s.size); }
function tell(cid, ev, o) { const s = LIVE.get(cid); if (!s) return 0; let n = 0; for (const r of s) { try { r.write('event: ' + ev + '\ndata: ' + JSON.stringify(o) + '\n\n'); n++; } catch (e) {} } return n; }
setInterval(() => { for (const [, s] of LIVE) for (const r of s) { try { r.write(': ping\n\n'); } catch (e) {} } }, 25000).unref();

/* ── temporary copies: cleanup + cap ── */
function cacheBytes() { try { return db.prepare('SELECT COALESCE(SUM(size),0) AS n FROM case_item WHERE cached = 1').get().n; } catch (e) { return 0; } }
function sweep() {
  const now = Date.now();
  for (const r of db.prepare('SELECT id, token FROM case_item WHERE cached = 1 AND cache_until < ?').all(now)) { try { fs.unlinkSync(fileOf(r.token)); } catch (e) {} db.prepare('UPDATE case_item SET cached = 0 WHERE id = ?').run(r.id); }
}
setInterval(sweep, 3600e3).unref(); setTimeout(sweep, 20e3).unref();

const MISS = new Map();
function limited(key, max, ms) { const now = Date.now(), x = MISS.get(key); if (x && now - x.t < ms) { x.n++; return x.n > max; } MISS.set(key, { n: 1, t: now }); return false; }
setInterval(() => { const now = Date.now(); for (const [k, x] of MISS) if (now - x.t > 3600e3) MISS.delete(k); }, 600e3).unref();

function send(res, code, o, h) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, h || {})); res.end(JSON.stringify(o)); }
function readJson(req, max) {
  return new Promise((ok, no) => { const ch = []; let n = 0; req.on('data', c => { n += c.length; if (n > max) { no(Object.assign(new Error('كبير'), { status: 413 })); req.destroy(); } else ch.push(c); }); req.on('end', () => { try { ok(JSON.parse(Buffer.concat(ch).toString('utf8') || '{}')); } catch (e) { no(Object.assign(new Error('bad'), { status: 400 })); } }); req.on('error', no); });
}
function itemOut(r) { return { id: r.id, token: r.token, patient: r.patient, phone: r.phone, exam: r.exam, name: r.file_name, size: r.size, pages: r.pages, at: r.created_at, views: r.views, last_view: r.last_view, active: !!r.active, cached: !!r.cached && r.cache_until > Date.now(), cache_until: r.cache_until, wrapped: !!(r.wrap || r.wrap2), wrapped2: !!r.wrap2, kind: r.kind || 'pdf' }; }

function page(title, body, css, js, manifestUrl) {
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover' + (css === 'v' ? ',maximum-scale=1,user-scalable=no' : '') + '"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#0E9F9A">' +
    '<title>' + esc(title) + '</title><link rel="icon" href="/icons/favicon-32.png">' +
    (manifestUrl ? '<link rel="manifest" href="'+esc(manifestUrl)+'"><link rel="apple-touch-icon" href="'+esc(manifestUrl.replace('/manifest','/icon'))+'"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default">' : '') +
    '<link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/cases.css?v=513"></head><body class="' + css + '">' + body + js + '</body></html>';
}
function html(res, code, s) { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' }); res.end(s); }

/* ════════ public routes ════════ */
async function handle(req, res, pathname) {
  let m = /^\/k\/([A-Za-z0-9]{8})(\/(login|logout|list|qr|layout|live|case|relay|item|fixed|wa|ask|bookings|tickets|ticket-image|logo|views|theme|manifest|icon|push-key|push-subscribe|push-disable|push-test)(\/[A-Za-z0-9]{1,20})?(\/(stop|start|delete|wrap|done))?)?\/?$/.exec(pathname);
  if (m) return centerRoute(req, res, m);
  m = /^\/h\/([A-Za-z0-9]{8})(\/(find|ask|book|complaint|report-request|manifest|icon|push-key|push-subscribe|push-disable|push-test))?\/?$/.exec(pathname);
  if (m) return findRoute(req, res, m[1], m[3] || '');
  m = /^\/v\/([A-Za-z0-9]{12})(\/(file|ask))?\/?$/.exec(pathname);
  if (m && m[3] === 'ask') return viewAsk(req, res, m[1]);
  if (m) return viewRoute(req, res, m[1], !!m[2]);
  return false;
}

async function centerRoute(req, res, m) {
  const code = m[1], sub = m[3] || '', arg = m[4] ? m[4].slice(1) : '', act = m[6] || '', ip = ipOf(req);
  if (limited('k:' + ip, 400, 60e3)) { send(res, 429, { message: 'طلبات كتير — استنى دقيقة' }); return true; }
  const site = db.prepare('SELECT * FROM case_site WHERE code = ? AND active = 1').get(code);
  if (!site) { if (limited('kx:' + ip, 30, 600e3)) { send(res, 429, { message: 'حاولت كتير' }); return true; } html(res, 404, page('اللينك مش شغال', '<div class="gate"><div class="box"><i>🔒</i><h1>اللينك ده مش شغال</h1><p>اتأكدوا من اللينك أو كلموا الشركة.</p></div></div>', 'k', '')); return true; }
  const me = authed(req, site);
  if (!sub) {
    if (req.method !== 'GET') return false;
    const CD = { code, center: site.center_name || '', logo: site.logo || '', theme: site.theme || 'a', layout: site.dashboard_layout === 'violet' ? 'violet' : 'teal', auth: me, cacheDays: CACHE_DAYS, maxMb: MAX_MB, pub: me ? pubOf(site) : '', fixedOn: !!site.fixed_on, wa: me ? (site.wa || '') : '', waDefault: me && !site.wa ? waFor(cid0(site), '') : '' };
    if (me) db.prepare('UPDATE case_site SET last_seen = ? WHERE customer_id = ?').run(nowTs(), site.customer_id);
    html(res, 200, page('QR Patient — ' + (site.center_name || ''), '<div id="app"></div>', 'k', '<script>window.CD=' + json(CD) + '</script><script src="/vendor/qrcode.js"></script><script src="/cases-kit.js?v=513"></script><script src="/cases-dicom.js?v=513"></script><script src="/cases-pacs.js?v=513"></script><script src="/cases-center.js?v=513"></script><script src="/cases-push.js?v=513"></script>', '/k/'+code+'/manifest'));
    return true;
  }
  if (sub === 'manifest' && req.method === 'GET') { respondManifest(res,site,'k');return true; }
  if (sub === 'icon' && req.method === 'GET') { respondIcon(res,site);return true; }
  if (sub === 'login' && req.method === 'POST') {
    if (limited('kl:' + code + ':' + ip, 10, 900e3)) { send(res, 429, { message: 'حاولت كتير — جرّب بعد ربع ساعة' }); return true; }
    let b = {}; try { b = await readJson(req, 2000); } catch (e) { send(res, 400, { message: 'محصلش' }); return true; }
    if (!passOk(String(b.pass || ''), site.pass)) { send(res, 401, { message: 'الباسوورد غلط' }); return true; }
    send(res, 200, { ok: true }, { 'Set-Cookie': setCookie(req, site, true) }); return true;
  }
  if (sub === 'logout' && req.method === 'POST') { send(res, 200, { ok: true }, { 'Set-Cookie': setCookie(req, site, false) }); return true; }
  if (!me) { send(res, 401, { message: 'سجّل دخول الأول', login: true }); return true; }
  const cid = site.customer_id;
  if (sub === 'push-key' && req.method === 'GET') {
    send(res,200,{key:webpush.publicKey(),devices:webpush.countFor(pushCenterId(cid))});return true;
  }
  if ((sub === 'push-subscribe' || sub === 'push-disable' || sub === 'push-test') && req.method === 'POST') {
    if (!validOrigin(req)) {send(res,403,{message:'مصدر الطلب غير مسموح'});return true;}
    if (limited('qrc-push:'+ip,20,3600e3)){send(res,429,{message:'طلبات كتير'});return true;}
    let b={};try{b=await readJson(req,6500);}catch(e){send(res,400,{message:'الاشتراك غير صالح'});return true;}
    const userId=pushCenterId(cid);
    if (sub==='push-subscribe'){
      try{webpush.subscribe({id:userId},b.subscription,req.headers['user-agent']);}
      catch(e){send(res,400,{message:'الاشتراك غير صالح'});return true;}
      send(res,200,{ok:true,devices:webpush.countFor(userId)});return true;
    }
    if (sub==='push-disable'){
      db.prepare('DELETE FROM push_subs WHERE user_id = ? AND endpoint = ?').run(userId,String(b.endpoint||''));
      send(res,200,{ok:true});return true;
    }
    const result=await webpush.send([userId],{title:'✅ إشعارات QR Patient شغّالة',body:'هتوصلك الطلبات الجديدة حتى لو لوحة المركز مقفولة.',url:'/k/'+code+'?section=dashboard',tag:'qrc-test'});
    send(res,200,{ok:result.ok>0,sent:result.ok,devices:result.devices});return true;
  }

  if (sub === 'qr' && req.method === 'GET') { send(res, 200, { qr: qrStatsOf(cid) }); return true; }
  if (sub === 'layout' && req.method === 'POST') {
    let b = {}; try { b = await readJson(req, 1000); } catch (e) { send(res, 400, { message: 'البيانات غير صحيحة' }); return true; }
    if (b.layout !== 'teal' && b.layout !== 'violet') { send(res, 400, { message: 'الشكل غير موجود' }); return true; }
    db.prepare('UPDATE case_site SET dashboard_layout = ? WHERE customer_id = ?').run(b.layout, cid);
    send(res, 200, { ok: true, layout: b.layout }); return true;
  }
  if (sub === 'list' && req.method === 'GET') {
    const rows = db.prepare('SELECT * FROM case_item WHERE customer_id = ? ORDER BY id DESC LIMIT 500').all(cid).map(itemOut);
    const recent = db.prepare('SELECT v.token, v.at, v.dev, v.via, v.src, i.patient, i.exam FROM case_view v JOIN case_item i ON i.token = v.token WHERE v.customer_id = ? ORDER BY v.id DESC LIMIT 30').all(cid);
    send(res, 200, { list: rows, online: (LIVE.get(cid) || new Set()).size, asks: asksOf(cid), bookings: bookingsOf(cid), tickets: serviceRequestsOf(cid), qr: qrStatsOf(cid), recent }); return true;
  }
  if (sub === 'live' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 4000\nevent: hello\ndata: {}\n\n');
    if (!LIVE.has(cid)) LIVE.set(cid, new Set()); LIVE.get(cid).add(res);
    db.prepare('UPDATE case_site SET last_seen = ? WHERE customer_id = ?').run(nowTs(), cid);
    req.on('close', () => { const s = LIVE.get(cid); if (s) { s.delete(res); if (!s.size) LIVE.delete(cid); } });
    return true;
  }
  if (sub === 'case' && req.method === 'POST' && !arg) {      /* upload: body = the encrypted file; meta in X-Meta (base64url JSON) */
    let meta = {}; try { meta = JSON.parse(Buffer.from(String(req.headers['x-meta'] || ''), 'base64url').toString('utf8')) || {}; } catch (e) {}
    const patient = clean(meta.patient, 80); if (!patient) { req.resume(); send(res, 400, { message: 'اكتب اسم المريض' }); return true; }
    const len = Number(req.headers['content-length'] || 0); if (!(len > 28) || len > MAX_MB * 1048576) { req.resume(); send(res, 413, { message: 'الملف لازم يكون أقل من ' + MAX_MB + ' ميجا' }); return true; }
    let token; do { token = rnd(12); } while (db.prepare('SELECT 1 FROM case_item WHERE token = ?').get(token));
    const keep = cacheBytes() + len < CACHE_CAP, tmp = fileOf(token) + '.part';
    const done = n => {
      const wj = w => w && typeof w === 'object' && w.s && w.i && w.k ? JSON.stringify({ s: clean(w.s, 40), i: clean(w.i, 40), k: clean(w.k, 120) }) : null;
      const wrap = wj(meta.wrap), wrap2 = wj(meta.wrap2);
      const r = db.prepare('INSERT INTO case_item (customer_id, token, patient, phone, exam, file_name, size, pages, created_at, cache_until, cached, phash, wrap, wrap2, kind) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(cid, token, patient, clean(meta.phone, 20), clean(meta.exam, 80), clean(meta.name, 120), n, Math.max(0, Math.min(5000, Number(meta.pages) || 0)) || null, nowTs(), Date.now() + CACHE_DAYS * 864e5, keep ? 1 : 0, phashOf(meta.phone), wrap, wrap2, meta.kind === 'dicom' ? 'dicom' : 'pdf');
      send(res, 200, { ok: true, item: itemOut(db.prepare('SELECT * FROM case_item WHERE id = ?').get(Number(r.lastInsertRowid))) });
    };
    if (!keep) { let n = 0; req.on('data', c => { n += c.length; }); req.on('end', () => done(n)); return true; }
    const out = fs.createWriteStream(tmp); let n = 0, bad = false;
    req.on('data', c => { n += c.length; if (n > MAX_MB * 1048576) { bad = true; req.destroy(); } });
    req.pipe(out);
    out.on('finish', () => { if (bad) { try { fs.unlinkSync(tmp); } catch (e) {} return send(res, 413, { message: 'الملف كبير' }); } fs.rename(tmp, fileOf(token), er => { if (er) return send(res, 500, { message: 'محصلش' }); done(n); }); });
    req.on('error', () => { try { fs.unlinkSync(tmp); } catch (e) {} });
    return true;
  }
  if (sub === 'item' && arg && act && req.method === 'POST') {
    const it = db.prepare('SELECT * FROM case_item WHERE token = ? AND customer_id = ?').get(arg, cid); if (!it) { send(res, 404, { message: 'مش موجودة' }); return true; }
    if (act === 'wrap') {   /* a case saved before 4.91 gets its wrapped key later, from the computer that holds it */
      let b = {}; try { b = await readJson(req, 2000); } catch (e) { send(res, 400, { message: 'محصلش' }); return true; }
      const two = b.p && typeof b.p === 'object', w = two ? b.p : b;
      if (!w.s || !w.i || !w.k) { send(res, 400, { message: 'ناقص' }); return true; }
      db.prepare('UPDATE case_item SET ' + (two ? 'wrap2' : 'wrap') + ' = ?, phash = COALESCE(phash, ?) WHERE id = ?').run(JSON.stringify({ s: clean(w.s, 40), i: clean(w.i, 40), k: clean(w.k, 120) }), phashOf(it.phone), it.id);
      send(res, 200, { ok: true }); return true;
    }
    if (act === 'delete') { try { fs.unlinkSync(fileOf(it.token)); } catch (e) {} db.prepare('DELETE FROM case_item WHERE id = ?').run(it.id); db.prepare('DELETE FROM case_view WHERE token = ?').run(it.token); }
    else db.prepare('UPDATE case_item SET active = ? WHERE id = ?').run(act === 'start' ? 1 : 0, it.id);
    send(res, 200, { ok: true }); return true;
  }
  if (sub === 'wa' && req.method === 'POST') {
    let b = {}; try { b = await readJson(req, 500); } catch (e) {}
    const w = waOf(b.wa); if (b.wa && !w) { send(res, 400, { message: 'رقم الواتساب مش مظبوط' }); return true; }
    db.prepare('UPDATE case_site SET wa = ? WHERE customer_id = ?').run(w ? clean(b.wa, 20) : null, cid);
    send(res, 200, { ok: true, wa: w ? clean(b.wa, 20) : '' }); return true;
  }
  if (sub === 'ask' && req.method === 'POST') {  /* Center fulfills a missing-result request */
    let open=[];
    if (arg && act === 'done') {
      open=db.prepare('SELECT DISTINCT notify_device FROM case_ask WHERE id = ? AND customer_id = ? AND done = 0 AND notify_device IS NOT NULL').all(Number(arg),cid);
      db.prepare('UPDATE case_ask SET done = 1 WHERE id = ? AND customer_id = ?').run(Number(arg), cid);
    } else {
      let b={};try{b=await readJson(req,500);}catch(e){}
      const ph=phashOf(b.phone);
      if(ph){
        open=db.prepare('SELECT DISTINCT notify_device FROM case_ask WHERE customer_id = ? AND phash = ? AND done = 0 AND notify_device IS NOT NULL').all(cid,ph);
        db.prepare('UPDATE case_ask SET done = 1 WHERE customer_id = ? AND phash = ? AND done = 0').run(cid,ph);
      }
    }
    for(const item of open) if(item.notify_device) pushPatientAlert(item.notify_device,pubOf(site));
    send(res,200,{ok:true,asks:asksOf(cid)});return true;
  }
  if (sub === 'ticket-image' && req.method === 'GET' && arg) {
    const id = Number(arg), index = Number(new URL(req.url,'http://x').searchParams.get('i') || '0');
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isInteger(index) || index < 0 || index > 2) { send(res,400,{message:'رابط الصورة غير صحيح'}); return true; }
    const row = db.prepare('SELECT files_json FROM case_service_request WHERE id = ? AND customer_id = ?').get(id,cid);
    if (!row) { send(res,404,{message:'الصورة غير موجودة'}); return true; }
    let files=[]; try { files=JSON.parse(row.files_json || '[]'); } catch (_) {}
    const file = files[index];
    if (!file || !/^[A-Za-z0-9]{16}$/.test(file.id || '') || !['image/jpeg','image/png','image/webp'].includes(file.mime)) {
      send(res,404,{message:'الصورة مش متاحة'}); return true;
    }
    try {
      const buf = getRequestPhoto(file.id);
      res.writeHead(200,{'Content-Type':file.mime,'Content-Length':String(buf.length),'Cache-Control':'no-store, private',
        'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"});
      res.end(buf);
    } catch (e) { send(res,404,{message:'الصورة مش متاحة'}); }
    return true;
  }
  if (sub === 'tickets' && req.method === 'POST' && arg && act === 'done') {
    const id = Number(arg);
    if (!Number.isSafeInteger(id) || id <= 0) { send(res,400,{message:'الطلب غير صحيح'}); return true; }
    const oldTicket=db.prepare('SELECT notify_device FROM case_service_request WHERE id = ? AND customer_id = ?').get(id,cid);
    const result = db.prepare("UPDATE case_service_request SET status = 'done', updated_at = ? WHERE id = ? AND customer_id = ? AND status = 'new'").run(nowTs(),id,cid);
    if (!result.changes) { send(res,404,{message:'الطلب اتقفل أو مش موجود'}); return true; }
    if (oldTicket && oldTicket.notify_device) pushPatientAlert(oldTicket.notify_device,pubOf(site));
    send(res,200,{ok:true,tickets:serviceRequestsOf(cid)}); return true;
  }
  if (sub === 'bookings' && req.method === 'POST' && arg && act === 'done') {
    const id = Number(arg);
    if (!Number.isSafeInteger(id) || id <= 0) { send(res, 400, { message: 'رقم الطلب غير صحيح' }); return true; }
    const oldBooking=db.prepare('SELECT notify_device FROM case_booking WHERE id = ? AND customer_id = ?').get(id,cid);
    const result = db.prepare("UPDATE case_booking SET status = 'contacted', updated_at = ? WHERE id = ? AND customer_id = ? AND status = 'new'").run(nowTs(), id, cid);
    if (!result.changes) { send(res, 404, { message: 'الطلب مش موجود أو اتقفل قبل كده' }); return true; }
    if (oldBooking && oldBooking.notify_device) pushPatientAlert(oldBooking.notify_device,pubOf(site));
    send(res, 200, { ok: true, bookings: bookingsOf(cid) }); return true;
  }
  /* 4.98 · the center's logo: shown on its pages and in the middle of every QR */
  if (sub === 'logo' && req.method === 'POST') {
    let b = {}; try { b = await readJson(req, 400000); } catch (e) { send(res, 413, { message: 'الصورة كبيرة — اختار صورة أصغر' }); return true; }
    const d = String(b.data || '');
    if (d && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d)) { send(res, 400, { message: 'الملف ده مش صورة' }); return true; }
    db.prepare('UPDATE case_site SET logo = ? WHERE customer_id = ?').run(d || null, cid);
    send(res, 200, { ok: true, logo: d }); return true;
  }
  if (sub === 'theme' && req.method === 'POST') {
    let b = {}; try { b = await readJson(req, 200); } catch (e) {}
    const t = ['a','b','c','d','e','f'].includes(b.theme) ? b.theme : 'a'; db.prepare('UPDATE case_site SET theme = ? WHERE customer_id = ?').run(t, cid);
    send(res, 200, { ok: true, theme: t }); return true;
  }
  /* 4.98 · who opened a case: when, which device, through which barcode */
  if (sub === 'views' && arg && req.method === 'GET') {
    const it = db.prepare('SELECT token FROM case_item WHERE token = ? AND customer_id = ?').get(arg, cid);
    if (!it) { send(res, 404, { message: 'مش موجودة' }); return true; }
    send(res, 200, { list: db.prepare('SELECT at, dev, via, src FROM case_view WHERE token = ? ORDER BY id DESC LIMIT 200').all(arg) }); return true;
  }
  if (sub === 'fixed' && req.method === 'POST') {
    let b = {}; try { b = await readJson(req, 500); } catch (e) {}
    db.prepare('UPDATE case_site SET fixed_on = ? WHERE customer_id = ?').run(b.on ? 1 : 0, cid);
    send(res, 200, { ok: true, on: !!b.on }); return true;
  }
  if (sub === 'relay' && arg && req.method === 'POST') {     /* the center's page answering a patient who is waiting right now */
    const t = TICKETS.get(arg);
    if (!t || t.cid !== cid) { req.resume(); send(res, 410, { message: 'خلاص' }); return true; }
    if (new URL(req.url, 'http://x').searchParams.get('miss')) {
      req.resume(); t.left--; if (t.left <= 0) { TICKETS.delete(arg); clearTimeout(t.timer); send(t.res, 404, { missing: true, message: 'الملف مش موجود على جهاز المركز' }); }
      send(res, 200, { ok: true }); return true;
    }
    TICKETS.delete(arg); clearTimeout(t.timer);
    const len = Number(req.headers['content-length'] || 0);
    t.res.writeHead(200, Object.assign({ 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Source': 'center' }, len ? { 'Content-Length': String(len) } : {}));
    req.pipe(t.res);
    req.on('end', () => { countView(t.token, cid, t.who, 'center'); send(res, 200, { ok: true }); });
    req.on('error', () => { try { t.res.destroy(); } catch (e) {} });
    t.res.on('close', () => { if (!req.complete) { try { req.destroy(); } catch (e) {} } });
    return true;
  }
  return false;
}

/* a short, readable name for the patient's device — no IP, nothing personal */
function devOf(ua) {
  ua = String(ua || '');
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? ((/;\s*([^;)]+?)\s+Build\//.exec(ua) || [])[1] || 'Android') : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'جهاز';
  const br = /SamsungBrowser/.test(ua) ? 'Samsung' : /EdgA?\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /FBAN|FBAV|FB_IAB/.test(ua) ? 'Facebook' : /Instagram/.test(ua) ? 'Instagram' : /WhatsApp/.test(ua) ? 'WhatsApp' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return String(os).slice(0, 40) + (br ? ' · ' + br : '');
}
function countView(token, cid, who, src) {
  try {
    const at = nowTs();
    db.prepare('UPDATE case_item SET views = views + 1, last_view = ? WHERE token = ?').run(at, token);
    const w = who || {}, row = { at, dev: w.dev || '', via: w.via || 'qr', src: src || '' };
    db.prepare('INSERT INTO case_view (token, customer_id, at, dev, via, src) VALUES (?,?,?,?,?,?)').run(token, cid, row.at, row.dev, row.via, row.src);
    const r = db.prepare('SELECT views, last_view FROM case_item WHERE token = ?').get(token);
    const pi = db.prepare('SELECT patient, exam FROM case_item WHERE token = ?').get(token) || {};
    if (r) tell(cid, 'view', { token, views: r.views, last_view: r.last_view, entry: Object.assign({ token, patient: pi.patient || '', exam: pi.exam || '' }, row) });
  } catch (e) {}
}

/* 4.95 · the patient's case didn't open (center offline / file gone / stopped) → a request to the center, from the case itself */
async function viewAsk(req, res, token) {
  if (req.method !== 'POST') return false;
  const ip = ipOf(req);
  if (limited('va:' + ip, 6, 3600e3)) { send(res, 429, { message: 'طلبك وصل — المركز هيرد عليك' }); return true; }
  const it = db.prepare('SELECT * FROM case_item WHERE token = ?').get(token); if (!it) { send(res, 404, { message: 'مش موجودة' }); return true; }
  let b = {}; try { b = await readJson(req, 800); } catch (e) {}
  const ph = phashOf(it.phone), note = clean(['مفتحتش', it.exam, String(it.created_at || '').slice(0, 10), b.note].filter(Boolean).join(' · '), 120);
  const dup = ph ? db.prepare('SELECT id FROM case_ask WHERE customer_id = ? AND phash = ? AND done = 0').get(it.customer_id, ph) : null;
  if (dup) db.prepare('UPDATE case_ask SET note = ?, at = ? WHERE id = ?').run(note, nowTs(), dup.id);
  else db.prepare('INSERT INTO case_ask (customer_id, name, phone, phash, note, at) VALUES (?,?,?,?,?,?)').run(it.customer_id, it.patient, it.phone || '', ph, note, nowTs());
  tell(it.customer_id, 'ask', { asks: asksOf(it.customer_id), name: it.patient, phone: it.phone || '' });
  send(res, 200, { ok: true }); return true;
}
async function viewRoute(req, res, token, file) {
  if (req.method !== 'GET') return false;
  const ip = ipOf(req);
  if (limited('v:' + ip, 60, 60e3)) { send(res, 429, { message: 'استنى دقيقة وجرّب تاني' }); return true; }
  const who = { dev: devOf(req.headers['user-agent']), via: /[?&]h=1\b/.test(req.url || '') ? 'fixed' : 'qr' };
  const it = db.prepare('SELECT i.*, s.center_name, s.logo AS site_logo, s.theme AS site_theme, s.active AS site_on, s.wa AS site_wa, s.pub AS site_pub FROM case_item i LEFT JOIN case_site s ON s.customer_id = i.customer_id WHERE i.token = ?').get(token);
  if (!file) {
    if (!it) { if (limited('vx:' + ip, 40, 600e3)) { send(res, 429, { message: 'حاولت كتير' }); return true; } }
    if (it && it.active && it.site_on && who.via === 'qr') qrOpen(req, it.customer_id, 'report');
    const CD = it ? { token, kind: it.kind || 'pdf', center: it.center_name || '', logo: it.site_logo || '', theme: it.site_theme || 'a', patient: it.patient, exam: it.exam || '', at: it.created_at, pages: it.pages || 0, size: it.size, name: it.file_name || '', active: !!(it.active && it.site_on), ready: !!(it.cached && it.cache_until > Date.now()) || online(it.customer_id), wa: waFor(it.customer_id, it.site_wa), pub: it.site_pub || '' } : { missing: true };
    html(res, it ? 200 : 404, page(it ? 'نتيجة الفحص — ' + (it.center_name || '') : 'الحالة مش موجودة', '<div id="app"></div>', 'v', '<script>window.CD=' + json(CD) + '</script>' + (it && it.kind === 'dicom' ? '<script src="/cases-pacs.js?v=513"></script>' : '<script src="/vendor/pdfjs/pdf.min.js"></script>') + '<script src="/cases-skin.js?v=513"></script><script src="/cases-view.js?v=513"></script>'));
    return true;
  }
  if (!it) { send(res, 404, { message: 'الحالة مش موجودة' }); return true; }
  if (!it.active || !it.site_on) { send(res, 410, { stopped: true, message: 'الحالة دي اتوقفت من المركز' }); return true; }
  /* 1) the temporary copy on the server (first 7 days) */
  if (it.cached && it.cache_until > Date.now()) {
    const f = fileOf(it.token);
    try {
      const st = fs.statSync(f);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': String(st.size), 'Cache-Control': 'no-store', 'X-Source': 'cache' });
      const rs = fs.createReadStream(f); rs.pipe(res); rs.on('end', () => countView(it.token, it.customer_id, who, 'cache')); rs.on('error', () => { try { res.destroy(); } catch (e) {} });
      return true;
    } catch (e) { db.prepare('UPDATE case_item SET cached = 0 WHERE id = ?').run(it.id); }
  }
  /* 2) live from the center's own computer */
  const n = (LIVE.get(it.customer_id) || new Set()).size;
  if (!n) { send(res, 503, { offline: true, message: 'جهاز المركز مقفول دلوقتي — جرّب تاني بعد شوية' }); return true; }
  const ticket = rnd(16);
  const t = { res, cid: it.customer_id, token: it.token, who, left: n, timer: setTimeout(() => { if (TICKETS.delete(ticket)) send(res, 504, { offline: true, message: 'جهاز المركز مردّش — جرّب تاني' }); }, 30000) };
  TICKETS.set(ticket, t);
  res.on('close', () => { if (TICKETS.get(ticket) === t) { TICKETS.delete(ticket); clearTimeout(t.timer); } });
  tell(it.customer_id, 'need', { token: it.token, ticket });
  return true;
}

/* ════════ 4.91 · the fixed barcode printed on every report: /h/<pub> → the patient types his mobile + first name ════════ */
async function findRoute(req, res, pub, sub) {
  const find = sub === 'find';
  const ip = ipOf(req);
  const site = db.prepare('SELECT * FROM case_site WHERE pub = ? AND active = 1').get(pub);
  if (sub === 'manifest' && req.method === 'GET') {
    if (!site) {send(res,404,{message:'المركز غير متاح'});return true;}respondManifest(res,site,'h');return true;
  }
  if (sub === 'icon' && req.method === 'GET') {
    if (!site) {send(res,404,{message:'المركز غير متاح'});return true;}respondIcon(res,site);return true;
  }
  if (sub === 'push-key' && req.method === 'GET') {
    if (!site) {send(res,404,{message:'المركز غير متاح'});return true;}send(res,200,{key:webpush.publicKey()});return true;
  }
  if (['push-subscribe','push-disable','push-test'].includes(sub) && req.method==='POST') {
    if(!site){send(res,404,{message:'المركز غير متاح'});return true;}
    if(!validOrigin(req)){send(res,403,{message:'مصدر الطلب غير مسموح'});return true;}
    if(limited('qrp-sub:'+ip,15,3600e3)){send(res,429,{message:'طلبات كتير'});return true;}
    let b={};try{b=await readJson(req,6500);}catch(e){send(res,400,{message:'البيانات غير صحيحة'});return true;}
    let token=String(b.deviceToken||'');
    if(sub==='push-subscribe') {
      if(!optInDevice(site.customer_id,token)){
        token=crypto.randomBytes(16).toString('hex');
        db.prepare('INSERT INTO case_push_device(token,customer_id,created_at) VALUES (?,?,?)').run(token,site.customer_id,nowTs());
      }
      try{webpush.subscribe({id:pushPatientId(token)},b.subscription,req.headers['user-agent']);}
      catch(e){send(res,400,{message:'الاشتراك غير صالح'});return true;}
      send(res,200,{ok:true,deviceToken:token});return true;
    }
    if(!optInDevice(site.customer_id,token)){send(res,403,{message:'التطبيق مش مسجّل على الجهاز'});return true;}
    if(sub==='push-disable'){
      db.prepare('DELETE FROM push_subs WHERE user_id = ? AND endpoint = ?').run(pushPatientId(token),String(b.endpoint||''));
      send(res,200,{ok:true});return true;
    }
    const result=await webpush.send([pushPatientId(token)],{title:'✅ إشعارات مركز الأشعة شغّالة',
      body:'هتوصلك تحديثات الطلبات الجديدة اللي تبعتها من التطبيق.',url:'/h/'+pub,tag:'qrp-test'});
    send(res,200,{ok:result.ok>0,sent:result.ok,devices:result.devices});return true;
  }
  if (sub === 'complaint' || sub === 'report-request') {
    if (req.method !== 'POST') return false;
    if (!site) { send(res,404,{message:'المركز غير متاح'}); return true; }
    if (limited('patient-service:'+pub+':'+ip,5,3600e3)) { send(res,429,{message:'في طلبات كتير، جرّب بعد شوية'}); return true; }
    const kind = sub === 'complaint' ? 'complaint' : 'report';
    let b={}; try { b=await readJson(req,kind==='report'?18000000:5000); } catch (e) {
      send(res,e.status===413?413:400,{message:kind==='report'?'الصورة كبيرة أو البيانات غير صحيحة':'راجع بيانات الشكوى'}); return true;
    }
    const name=clean(b.name,60), phone=bookingPhone(b.phone),
      subject=clean(b.subject,100), message=clean(b.message,1200);
    if (name.length<3 || !phone || message.length<8 || (kind==='complaint' && subject.length<3)) {
      send(res,400,{message:'اكمل الاسم ورقم الموبايل وعنوان الطلب والتفاصيل'}); return true;
    }
    if (limited('patient-service-phone:'+pub+':'+phashOf(phone),3,864e5)) {
      send(res,429,{message:'وصلنا طلبات كتير من الرقم ده النهارده؛ تواصل مع المركز'}); return true;
    }
    const received=[];
    if (kind==='report') {
      if (!Array.isArray(b.files) || b.files.length<1 || b.files.length>3) {
        send(res,400,{message:'ارفع من صورة إلى 3 صور للطلب'}); return true;
      }
      try {
        for(const file of b.files) {
          const raw=String((file && file.data)||''), match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(raw);
          if (!match || raw.length>5700000) throw Error('file');
          const buffer=Buffer.from(match[2],'base64');
          const detected=requestPhotoMime(buffer);
          if (!detected || detected!==match[1] || buffer.length===0 || buffer.length>4*1048576) throw Error('file');
          received.push({id:storeRequestPhoto(buffer),mime:detected,name:clean(file.name,90)||('صورة '+(received.length+1))});
        }
      } catch (e) {
        for(const file of received) try { fs.unlinkSync(requestPhotoPath(file.id)); } catch (_) {}
        send(res,413,{message:'اختار صور JPG أو PNG أو WebP، كل صورة أقل من 4 ميجا'}); return true;
      }
    }
    try {
      const notify=optInDevice(site.customer_id,b.notifyDevice)?b.notifyDevice:null;
      const rec=db.prepare('INSERT INTO case_service_request(customer_id,kind,name,phone,subject,message,files_json,at,notify_device) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(site.customer_id,kind,name,phone,subject,message,JSON.stringify(received),nowTs(),notify);
      const id=Number(rec.lastInsertRowid);
      tell(site.customer_id,'ticket',{tickets:serviceRequestsOf(site.customer_id),kind,name});
      pushCenterAlert(site,kind==='complaint'?'complaints':'reports',
        kind==='complaint'?'وصلت شكوى جديدة من بوابة المرضى':'وصل طلب تقرير أشعة جديد','ticket-'+id);
      send(res,201,{ok:true,id,status:'new'});
    } catch (e) {
      for(const file of received) try { fs.unlinkSync(requestPhotoPath(file.id)); } catch (_) {}
      send(res,500,{message:'تعذر حفظ الطلب، جرّب تاني'});
    }
    return true;
  }
  if (sub === 'book') {
    if (req.method !== 'POST') return false;
    if (!site) { send(res, 404, { message: 'المركز غير متاح' }); return true; }
    if (limited('hb:' + pub + ':' + ip, 8, 3600e3)) { send(res, 429, { message: 'طلبات كتير — حاول بعد شوية' }); return true; }
    let b = {}; try { b = await readJson(req, 2000); } catch (e) { send(res, 400, { message: 'الطلب غير صحيح' }); return true; }
    const name = clean(b.name, 60), phone = bookingPhone(b.phone), exam = clean(b.exam, 50),
      day = String(b.day || ''), slot = String(b.slot || ''), note = clean(b.note, 180);
    const exams = ['أشعة عادية', 'سونار', 'أشعة مقطعية', 'رنين مغناطيسي', 'دوبلر', 'ماموجرام', 'فحص آخر'];
    const slots = ['صباحًا', 'ظهرًا', 'مساءً', 'أي وقت'];
    if (name.length < 3 || !phone || !exams.includes(exam) || !slots.includes(slot)) {
      send(res, 400, { message: 'راجع الاسم والموبايل ونوع الفحص والوقت المفضل' }); return true;
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
    const stamp = match ? Date.UTC(+match[1], +match[2] - 1, +match[3]) : NaN;
    const start = Date.parse(nowTs().slice(0, 10) + 'T00:00:00Z');
    if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== day || stamp < start || stamp > start + 90 * 864e5) {
      send(res, 400, { message: 'اختار يوم من النهارده ولحد 90 يوم قدام' }); return true;
    }
    if (limited('hbp:' + pub + ':' + phashOf(phone), 3, 864e5)) {
      send(res, 429, { message: 'في طلبات كتير للرقم ده — تواصل مع المركز' }); return true;
    }
    const notify=optInDevice(site.customer_id,b.notifyDevice)?b.notifyDevice:null;
    const rec = db.prepare('INSERT INTO case_booking (customer_id, name, phone, exam, day, slot, note, at, notify_device) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(site.customer_id, name, phone, exam, day, slot, note, nowTs(),notify);
    const bookings = bookingsOf(site.customer_id);
    tell(site.customer_id, 'booking', { bookings, name, exam, day });
    pushCenterAlert(site,'bookings','وصل طلب حجز أشعة جديد','booking-'+Number(rec.lastInsertRowid));
    send(res, 201, { ok: true, id: Number(rec.lastInsertRowid), status: 'pending' });
    return true;
  }
  if (sub === 'ask') {   /* 4.92 · «ملقتش نتيجتي» → the center sees it live in its cases page (and the patient's WhatsApp opens) */
    if (req.method !== 'POST') return false;
    if (!site) { send(res, 404, { message: 'مش موجود' }); return true; }
    if (limited('ha:' + ip, 6, 3600e3)) { send(res, 429, { message: 'طلبك وصل — المركز هيرد عليك' }); return true; }
    let b = {}; try { b = await readJson(req, 1500); } catch (e) { send(res, 400, { message: 'محصلش' }); return true; }
    const name = clean(b.name, 60) || 'مريض', phone = clean(b.phone, 20), ph = phashOf(phone); if (!ph) { send(res, 400, { message: 'اكتب رقم موبايلك صح' }); return true; }
    const dup = db.prepare('SELECT id FROM case_ask WHERE customer_id = ? AND phash = ? AND done = 0').get(site.customer_id, ph);
    const notify=optInDevice(site.customer_id,b.notifyDevice)?b.notifyDevice:null;
    if (dup) db.prepare('UPDATE case_ask SET name = ?, note = ?, at = ?, notify_device = COALESCE(?,notify_device) WHERE id = ?').run(name, clean(b.note, 120), nowTs(),notify,dup.id);
    else db.prepare('INSERT INTO case_ask (customer_id, name, phone, phash, note, at, notify_device) VALUES (?,?,?,?,?,?,?)').run(site.customer_id, name, phone, ph, clean(b.note, 120), nowTs(),notify);
    tell(site.customer_id, 'ask', { asks: asksOf(site.customer_id), name, phone });
    pushCenterAlert(site,'results','مريض طلب المساعدة في الحصول على نتيجة أشعة','ask-'+ph.slice(0,10));
    send(res, 200, { ok: true }); return true;
  }
  if (!find) {
    if (req.method !== 'GET') return false;
    if (!site) { if (limited('hx:' + ip, 30, 600e3)) { send(res, 429, { message: 'حاولت كتير' }); return true; } }
    if (site) qrOpen(req, site.customer_id, 'fixed');
    const CD = site ? { pub, center: site.center_name || '', logo: site.logo || '', theme: site.theme || 'a', on: !!site.fixed_on, wa: waFor(site.customer_id, site.wa) } : { missing: true };
    html(res, site ? 200 : 404, page(site ? 'نتيجتك — ' + (site.center_name || '') : 'اللينك مش شغال', '<div id="app"></div>', 'v', '<script>window.CD=' + json(CD) + '</script><script src="/cases-kit.js?v=513"></script><script src="/cases-skin.js?v=513"></script><script src="/cases-find.js?v=513"></script><script src="/cases-push.js?v=513"></script>',site?'/h/'+pub+'/manifest':null));
    return true;
  }
  if (req.method !== 'POST') return false;
  if (!site || !site.fixed_on) { send(res, 404, { message: 'البحث مقفول في المركز ده' }); return true; }
  if (limited('hf:' + ip, 12, 600e3)) { send(res, 429, { message: 'حاولت كتير — جرّب بعد 10 دقايق' }); return true; }
  let b = {}; try { b = await readJson(req, 1000); } catch (e) { send(res, 400, { message: 'محصلش' }); return true; }
  const ph = phashOf(b.phone); if (!ph) { send(res, 400, { message: 'اكتب رقم الموبايل صح' }); return true; }
  if (limited('hp:' + pub + ':' + ph, 25, 864e5)) { send(res, 429, { message: 'الرقم ده اتدوّر عليه كتير النهارده — كلّم المركز' }); return true; }
  const rows = db.prepare('SELECT token, patient, exam, created_at, pages, kind, wrap, wrap2 FROM case_item WHERE customer_id = ? AND phash = ? AND active = 1 AND (wrap IS NOT NULL OR wrap2 IS NOT NULL) ORDER BY id DESC LIMIT 30').all(site.customer_id, ph);
  const pj = x => { try { return x ? JSON.parse(x) : null; } catch (e) { return null; } };
  send(res, 200, { list: rows.map(r => ({ token: r.token, hint: maskName(r.patient), exam: r.exam || '', at: r.created_at, pages: r.pages || 0, kind: r.kind || 'pdf', w: pj(r.wrap), w2: pj(r.wrap2) })).filter(x => x.w || x.w2) });
  return true;
}

/* ════════ the admin side: /api/portal/cases* (server.js checks admin) ════════ */
async function adminApi(req, res, pathname, me) {
  const q = new URL(req.url, 'http://x').searchParams;
  const siteOut = s => s ? { code: s.code, logo: s.logo || '', theme: s.theme || 'a', pub: pubOf(s), fixed: !!s.fixed_on, wa: s.wa || '', asks: db.prepare('SELECT COUNT(*) AS n FROM case_ask WHERE customer_id = ? AND done = 0').get(s.customer_id).n, active: !!s.active, created_at: s.created_at, last_seen: s.last_seen, online: online(s.customer_id), cases: db.prepare('SELECT COUNT(*) AS n FROM case_item WHERE customer_id = ?').get(s.customer_id).n, views: db.prepare('SELECT COALESCE(SUM(views),0) AS n FROM case_item WHERE customer_id = ?').get(s.customer_id).n } : null;
  if (req.method === 'GET' && pathname === '/api/portal/cases') {
    const cid = String(q.get('cid') || '');
    if (cid) return send(res, 200, { site: siteOut(db.prepare('SELECT * FROM case_site WHERE customer_id = ?').get(cid)) });
    const all = {}; db.prepare('SELECT * FROM case_site').all().forEach(s => { all[s.customer_id] = { code: s.code, active: !!s.active, online: online(s.customer_id) }; });
    return send(res, 200, { sites: all });
  }
  if (req.method !== 'POST') return send(res, 404, { error: 'not_found' });
  /* 4.99 · the company sets each center's logo from «متابعة العملاء» (it sits in the middle of that center's QRs) */
  if (pathname === '/api/portal/cases/logo') {
    let x = {}; try { x = await readJson(req, 400000); } catch (e) { return send(res, 413, { message: 'الصورة كبيرة — اختار صورة أصغر' }); }
    const c2 = String(x.cid || '').slice(0, 80), d = String(x.data || '');
    if (!db.prepare('SELECT 1 FROM case_site WHERE customer_id = ?').get(c2)) return send(res, 404, { message: 'اعمل لينك QR Patient للمركز الأول' });
    if (d && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d)) return send(res, 400, { message: 'الملف ده مش صورة' });
    db.prepare('UPDATE case_site SET logo = ? WHERE customer_id = ?').run(d || null, c2);
    return send(res, 200, { ok: true, logo: d });
  }
  let b = {}; try { b = await readJson(req, 4000); } catch (e) { return send(res, 400, { message: 'محصلش' }); }
  const cid = String(b.cid || '').slice(0, 80); if (!cid) return send(res, 400, { message: 'المركز مش محدد' });
  const who = (me && (me.name || me.username)) || 'admin', cur = db.prepare('SELECT * FROM case_site WHERE customer_id = ?').get(cid);
  const newPass = () => { const p = String(b.pass || '').trim(); if (p && p.length < 4) throw Object.assign(new Error('الباسوورد لازم 4 حروف/أرقام على الأقل'), { status: 400 }); return p || String(crypto.randomInt(100000, 1000000)); };
  try {
    if (pathname === '/api/portal/cases/make') {
      const pass = newPass();
      if (cur) db.prepare('UPDATE case_site SET pass = ?, ver = ver + 1, active = 1, center_name = ? WHERE customer_id = ?').run(hashPass(pass), clean(b.name, 120) || cur.center_name, cid);
      else { let code; do { code = rnd(8, true); } while (db.prepare('SELECT 1 FROM case_site WHERE code = ?').get(code)); db.prepare('INSERT INTO case_site (customer_id, center_name, code, pass, created_at, created_by, wa) VALUES (?,?,?,?,?,?,?)').run(cid, clean(b.name, 120), code, hashPass(pass), nowTs(), who, waOf(b.wa) ? clean(b.wa, 20) : null); }
      return send(res, 200, { ok: true, pass, site: siteOut(db.prepare('SELECT * FROM case_site WHERE customer_id = ?').get(cid)) });
    }
    if (!cur) return send(res, 404, { message: 'مفيش لينك حالات للمركز ده' });
    if (pathname === '/api/portal/cases/theme') { db.prepare('UPDATE case_site SET theme = ? WHERE customer_id = ?').run(['a','b','c','d','e','f'].includes(b.theme) ? b.theme : 'a', cid); return send(res, 200, { ok: true }); }
    if (pathname === '/api/portal/cases/wa') { const w = waOf(b.wa); if (b.wa && !w) return send(res, 400, { message: 'رقم الواتساب مش مظبوط' }); if (!b.ifEmpty || !cur.wa) db.prepare('UPDATE case_site SET wa = ? WHERE customer_id = ?').run(w ? clean(b.wa, 20) : null, cid); return send(res, 200, { ok: true, site: siteOut(db.prepare('SELECT * FROM case_site WHERE customer_id = ?').get(cid)) }); }
    if (pathname === '/api/portal/cases/pass') { const pass = newPass(); db.prepare('UPDATE case_site SET pass = ?, ver = ver + 1 WHERE customer_id = ?').run(hashPass(pass), cid); db.prepare('DELETE FROM push_subs WHERE user_id = ?').run(pushCenterId(cid)); for (const r of (LIVE.get(cid) || [])) { try { r.end(); } catch (e) {} } return send(res, 200, { ok: true, pass }); }
    if (pathname === '/api/portal/cases/stop') { db.prepare('UPDATE case_site SET active = ? WHERE customer_id = ?').run(b.on ? 1 : 0, cid); if (!b.on) db.prepare('DELETE FROM push_subs WHERE user_id = ?').run(pushCenterId(cid)); if (!b.on) for (const r of (LIVE.get(cid) || [])) { try { r.end(); } catch (e) {} } return send(res, 200, { ok: true, site: siteOut(db.prepare('SELECT * FROM case_site WHERE customer_id = ?').get(cid)) }); }
    if (pathname === '/api/portal/cases/rotate') { let code; do { code = rnd(8, true); } while (db.prepare('SELECT 1 FROM case_site WHERE code = ?').get(code)); db.prepare('UPDATE case_site SET code = ?, ver = ver + 1 WHERE customer_id = ?').run(code, cid); db.prepare('DELETE FROM push_subs WHERE user_id = ?').run(pushCenterId(cid)); for (const r of (LIVE.get(cid) || [])) { try { r.end(); } catch (e) {} } return send(res, 200, { ok: true, site: siteOut(db.prepare('SELECT * FROM case_site WHERE customer_id = ?').get(cid)) }); }
  } catch (er) { return send(res, er.status || 400, { message: er.message || 'محصلش' }); }
  return send(res, 404, { error: 'not_found' });
}

function cid0(site) { return site.customer_id; }
module.exports = { handle, adminApi, setLookup };
