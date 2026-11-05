'use strict';
/* ════════════════════════════════════════════════════════════════════
   EMDADX · «صفحة الدعاية» (4.77) — the company's own public promo page
   ------------------------------------------------------------------
   · /promo            the page (mobile first, 4 designs, same motion as
                       the QR-Patient pages)
   · /promo/img/<id>   an image the admin uploaded for a slide
   · POST /promo/lead  a center asks for the printing service → a short
                       code it can follow at POST /promo/track
   · /api/promo/…      admin only: settings, images, the requests list
   Everything is stored as plain data; the page renders it with
   textContent, so nothing typed here can inject HTML.
════════════════════════════════════════════════════════════════════ */
const crypto = require('node:crypto');

const THEMES = ['1', '2', '3', '4'];
const ICONS = ['printer', 'film', 'paper', 'tools', 'support', 'bolt', 'shield', 'clock', 'layers', 'hand', 'image', 'hospital', 'scan', 'clinic', 'tag', 'doc', 'wa', 'star', 'truck', 'check'];
const ARTS = ['monitor', 'film', 'ring', 'clinic'];
const ACTS = ['order', 'quote', 'wa', 'call', 'url', 'track', 'none'];

const DEF = {
  on: true, theme: '1',
  brand: 'Emdadx', tagline: 'للتوريدات و حلول طباعة الأشعة',
  wa: '', phone: '',
  cta: 'اطلب خدمة الطباعة الآن', offer: 'احصل على عرض مخصص لمركزك',
  slides: [
    { title: 'خدمة طباعة الأشعة', hi: '', sub: 'حل متكامل لمراكز الأشعة', art: 'monitor', img: '', btn: 'اطلب الخدمة' },
    { title: 'خدمة طباعة', hi: 'أفلام الأشعة', sub: 'جودة عرض عالية ودقة تفاصيل لكل الأنواع', art: 'film', img: '', btn: 'تعرف على الخدمة' },
    { title: 'شريكك الموثوق', hi: 'في طباعة الأشعة', sub: 'طابعات احترافية · خامات أصلية · صيانة ودعم دائم', art: 'ring', img: '', btn: 'اطلب عرض سعر' },
    { title: 'حلول متكاملة', hi: 'لطباعة وعرض الأشعة', sub: 'من الخامات إلى الطباعة والصيانة والدعم الفني', art: 'clinic', img: '', btn: 'احصل على عرض' }
  ],
  chips: [
    { t: 'جودة عالية', ic: 'shield' }, { t: 'سرعة في التنفيذ', ic: 'clock' }, { t: 'مقاسات متعددة', ic: 'layers' }, { t: 'صيانة ودعم مستمر', ic: 'hand' }
  ],
  services: [
    { t: 'طباعة أفلام الأشعة', s: 'A3 - A4 - B4', ic: 'printer' },
    { t: 'توفير خامات الطباعة', s: 'ورق و أفلام أصلية', ic: 'paper' },
    { t: 'صيانة وقطع غيار', s: 'دعم فني معتمد', ic: 'tools' },
    { t: 'دعم فني سريع', s: 'متابعة و حلول فورية', ic: 'support' }
  ],
  stats: [ { n: '100%', l: 'خدمة معتمدة' }, { n: '+10', l: 'سنوات خبرة' }, { n: '+150', l: 'مركز أشعة تثق بنا' } ],
  targets: [ { t: 'مستشفيات', ic: 'hospital' }, { t: 'مراكز أشعة', ic: 'scan' }, { t: 'عيادات متخصصة', ic: 'clinic' } ],
  about: 'بنوفّر لمراكز الأشعة طابعات أفلام احترافية وخامات أصلية، مع تركيب وصيانة ودعم فني سريع — عشان نتيجة المريض تطلع بأعلى جودة وفي أسرع وقت.'
};

function clean(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g, '').trim().slice(0, n || 200); }
function digits(s) { return String(s || '').replace(/[^\d+]/g, '').slice(0, 16); }
function pick(v, list, d) { return list.includes(String(v)) ? String(v) : d; }

function norm(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const arr = (a, d, max, f) => (Array.isArray(a) ? a : d).slice(0, max).map(f).filter(Boolean);
  return {
    on: c.on !== false, theme: pick(c.theme, THEMES, DEF.theme),
    brand: clean(c.brand != null ? c.brand : DEF.brand, 40), tagline: clean(c.tagline != null ? c.tagline : DEF.tagline, 80),
    wa: digits(c.wa), phone: digits(c.phone),
    cta: clean(c.cta || DEF.cta, 60), offer: clean(c.offer || DEF.offer, 60),
    about: clean(c.about != null ? c.about : DEF.about, 500),
    slides: arr(c.slides, DEF.slides, 10, x => x && (x.title || x.img || x.sub) ? { on: x.on !== false, title: clean(x.title, 60), hi: clean(x.hi, 60), sub: clean(x.sub, 160), art: pick(x.art, ARTS, 'monitor'), img: /^[a-f0-9]{24}$/.test(String(x.img || '')) ? String(x.img) : '', btn: clean(x.btn, 30),
      act: pick(x.act, ACTS, 'order'), url: /^https:\/\/[^\s<>"']{3,300}$/.test(String(x.url || '').trim()) ? String(x.url).trim() : '', shade: x.shade !== false, fit: x.fit === 'contain' ? 'contain' : 'cover' } : null),
    slider: { sec: Math.min(12, Math.max(3, Number((c.slider || {}).sec) || 4.5)), fx: pick((c.slider || {}).fx, ['fade', 'slide', 'zoom'], 'fade'), auto: (c.slider || {}).auto !== false, dots: (c.slider || {}).dots !== false },
    chips: arr(c.chips, DEF.chips, 4, x => x && x.t ? { t: clean(x.t, 30), ic: pick(x.ic, ICONS, 'star') } : null),
    services: arr(c.services, DEF.services, 8, x => x && x.t ? { t: clean(x.t, 40), s: clean(x.s, 60), ic: pick(x.ic, ICONS, 'printer') } : null),
    stats: arr(c.stats, DEF.stats, 3, x => x && (x.n || x.l) ? { n: clean(x.n, 10), l: clean(x.l, 30) } : null),
    targets: arr(c.targets, DEF.targets, 3, x => x && x.t ? { t: clean(x.t, 30), ic: pick(x.ic, ICONS, 'hospital') } : null)
  };
}

const TK = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code() { let s = ''; const b = crypto.randomBytes(6); for (let i = 0; i < 6; i++) s += TK[b[i] % TK.length]; return s; }

function create({ db, readBody, sendJSON, broadcast, push, admins, publicDir, fs, path }) {
  db.exec(`CREATE TABLE IF NOT EXISTS promo_kv (k TEXT PRIMARY KEY, v TEXT);
    CREATE TABLE IF NOT EXISTS promo_img (id TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL, at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS promo_lead (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, name TEXT, center TEXT, phone TEXT, service TEXT, note TEXT,
      status TEXT NOT NULL DEFAULT 'new', reply TEXT, at INTEGER NOT NULL, updated_at INTEGER, ip TEXT);
    CREATE INDEX IF NOT EXISTS ix_promo_lead_at ON promo_lead(at DESC);
    CREATE INDEX IF NOT EXISTS ix_promo_lead_code ON promo_lead(code);
    CREATE TABLE IF NOT EXISTS promo_view (day TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS promo_hit (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, day TEXT NOT NULL, hr INTEGER, vid TEXT, src TEXT, dev TEXT, os TEXT, city TEXT, region TEXT, country TEXT, cc TEXT, tz TEXT, lang TEXT, iph TEXT);
    CREATE INDEX IF NOT EXISTS ix_promo_hit_at ON promo_hit(at);
    CREATE INDEX IF NOT EXISTS ix_promo_hit_day ON promo_hit(day);`);

  const cfg = () => { const r = db.prepare("SELECT v FROM promo_kv WHERE k = 'cfg'").get(); let j = null; try { j = r ? JSON.parse(r.v) : null; } catch (e) {} return norm(j || DEF); };
  const save = c => db.prepare("INSERT INTO promo_kv (k, v) VALUES ('cfg', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").run(JSON.stringify(c));
  const json = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, ch => '\\u' + ch.charCodeAt(0).toString(16));
  const ver = () => { try { return String(require(path.join(__dirname, '..', '..', 'package.json')).version || '1'); } catch (e) { return '1'; } };
  const leadOut = x => ({ id: x.id, code: x.code, name: x.name, center: x.center, phone: x.phone, service: x.service, note: x.note, status: x.status, reply: x.reply || '', at: x.at, updated_at: x.updated_at || 0 });

  /* a light per-IP limit on new requests */
  const hits = new Map();
  function limited(ip) { const now = Date.now(), L = (hits.get(ip) || []).filter(t => now - t < 3600e3); if (L.length >= 8) return true; L.push(now); hits.set(ip, L); if (hits.size > 5000) hits.clear(); return false; }
  const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  /* ── the control page: its own link + password (like a QR-Patient center page) ── */
  const kv = (k, v) => { if (v === undefined) { const r = db.prepare('SELECT v FROM promo_kv WHERE k = ?').get(k); try { return r ? JSON.parse(r.v) : null; } catch (e) { return null; } } db.prepare('INSERT INTO promo_kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(k, JSON.stringify(v)); };
  const KEY = (() => { let k = kv('key'); if (!k) { k = crypto.randomBytes(32).toString('base64'); kv('key', k); } return Buffer.from(k, 'base64'); })();
  const hashPass = p => { const salt = crypto.randomBytes(16); return 'scrypt$' + salt.toString('base64') + '$' + crypto.scryptSync(String(p), salt, 32).toString('base64'); };
  const passOk = (p, h) => { try { const [, s1, d] = String(h).split('$'); const a = crypto.scryptSync(String(p), Buffer.from(s1, 'base64'), 32), b = Buffer.from(d, 'base64'); return a.length === b.length && crypto.timingSafeEqual(a, b); } catch (e) { return false; } };
  const enc = p => { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', KEY, iv), d = Buffer.concat([c.update(String(p), 'utf8'), c.final()]); return [iv, c.getAuthTag(), d].map(x => x.toString('base64url')).join('.'); };
  const dec = e => { try { const [iv, t, d] = String(e).split('.').map(x => Buffer.from(x, 'base64url')), c = crypto.createDecipheriv('aes-256-gcm', KEY, iv); c.setAuthTag(t); return Buffer.concat([c.update(d), c.final()]).toString('utf8'); } catch (er) { return null; } };
  const newPass = () => { const A = '23456789abcdefghjkmnpqrstuvwxyz'; let s = ''; const b = crypto.randomBytes(8); for (let i = 0; i < 8; i++) s += A[b[i] % A.length]; return s; };
  const ctl = () => kv('ctl') || null;
  function ctlSet(pass, rotate) {
    const cur = ctl() || {};
    const token = (!cur.token || rotate) ? crypto.randomBytes(9).toString('base64url') : cur.token;
    const p = pass || (rotate && cur.enc ? dec(cur.enc) : null) || newPass();
    kv('ctl', { token, hash: hashPass(p), enc: enc(p), at: Date.now() });
    return { token, pass: p };
  }
  const sig = (token, h, exp) => crypto.createHmac('sha256', KEY).update(token + ':' + String(h).slice(-24) + ':' + exp).digest('base64url');
  function sessionOk(req, c) {
    const m = String(req.headers.cookie || '').match(/(?:^|;\s*)pmx=([^;]+)/); if (!m || !c) return false;
    const [exp, s1] = decodeURIComponent(m[1]).split('.'); if (!exp || !s1 || Number(exp) < Date.now()) return false;
    const want = sig(c.token, c.hash, exp); return want.length === s1.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(s1));
  }
  function cookie(req, c, on) {
    const secure = /https/i.test(String(req.headers['x-forwarded-proto'] || '')) ? '; Secure' : '';
    if (!on) return 'pmx=; Path=/promo/c/; Max-Age=0; HttpOnly; SameSite=Lax' + secure;
    const exp = Date.now() + 30 * 864e5; return 'pmx=' + encodeURIComponent(exp + '.' + sig(c.token, c.hash, exp)) + '; Path=/promo/c/' + c.token + '; Max-Age=' + 30 * 86400 + '; HttpOnly; SameSite=Lax' + secure;
  }
  const tries = new Map();
  function tooMany(ip) { const now = Date.now(), L = (tries.get(ip) || []).filter(t => now - t < 15 * 60e3); tries.set(ip, L); return L.length >= 10; }
  const sameOrigin = req => { const o = req.headers.origin; if (!o) return true; try { return new URL(o).host === req.headers.host; } catch (e) { return false; } };
  function ctlPage(c, logged) {
    const v = ver();
    return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no">' +
      '<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0B1530"><title>لوحة التحكم — صفحة الدعاية</title><link rel="icon" href="/icons/favicon-32.png">' +
      '<link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/promo-ctl.css?v=' + v + '"></head><body class="pmc">' +
      (logged ? '<div id="page-content"></div><script>window.PMX_BASE="/promo/c/' + c.token + '/api";window.PMX_STANDALONE=1;</script><script src="/promo-ctl.js?v=' + v + '"></script><script src="/js/promoadmin.js?v=' + v + '"></script><script>renderPromo()</script>'
        : '<main class="pmc-login"><form id="f" autocomplete="on"><img src="/icons/logo-square.png" alt=""><h1>لوحة تحكم صفحة الدعاية</h1><p>اكتب الباسوورد عشان تدخل</p><input type="password" name="pass" id="p" autocomplete="current-password" placeholder="الباسوورد" required><p class="er" id="e"></p><button>دخول</button></form></main>' +
          '<script>document.getElementById("f").onsubmit=function(e){e.preventDefault();var b=this.querySelector("button");b.disabled=true;fetch(location.pathname.replace(/\\/$/,"")+"/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pass:document.getElementById("p").value})}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.message||"غلط");location.reload();});}).catch(function(x){b.disabled=false;document.getElementById("e").textContent=x.message;});};</script>') +
      '</body></html>';
  }

  /* ── visits: where people came from, on what, from which city ── */
  const geoCache = new Map();
  const privateIp = ip => !ip || /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd|fe80|::ffff:(10\.|127\.|192\.168\.))/i.test(ip);
  async function geo(ip) {
    if (privateIp(ip)) return null;
    const c = geoCache.get(ip); if (c && Date.now() - c.at < 864e5) return c.g;
    try {
      const r = await fetch('https://ipwho.is/' + encodeURIComponent(ip) + '?lang=ar&fields=success,city,region,country,country_code', { signal: AbortSignal.timeout(3000) });
      const j = await r.json(); const g = j && j.success ? { city: clean(j.city, 60), region: clean(j.region, 60), country: clean(j.country, 60), cc: clean(j.country_code, 4) } : null;
      geoCache.set(ip, { g, at: Date.now() }); if (geoCache.size > 20000) geoCache.clear(); return g;
    } catch (e) { return null; }
  }
  function srcOf(ref, tag) {
    const t = String(tag || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20); if (t) return t;
    let h = ''; try { h = new URL(String(ref || '')).hostname.toLowerCase(); } catch (e) {}
    if (!h) return 'direct';
    if (/whatsapp|wa\.me/.test(h)) return 'whatsapp'; if (/facebook|fb\.|messenger/.test(h)) return 'facebook'; if (/instagram/.test(h)) return 'instagram';
    if (/google\./.test(h)) return 'google'; if (/t\.me|telegram/.test(h)) return 'telegram'; if (/tiktok/.test(h)) return 'tiktok'; if (/twitter|x\.com|t\.co$/.test(h)) return 'x';
    return h.replace(/^www\./, '').slice(0, 40);
  }
  function devOf(ua, w) { const u = String(ua || ''); const os = /android/i.test(u) ? 'Android' : /iphone|ipad|ipod/i.test(u) ? 'iOS' : /windows/i.test(u) ? 'Windows' : /mac os/i.test(u) ? 'Mac' : /linux/i.test(u) ? 'Linux' : 'أخرى';
    const n = Number(w) || 0; const dev = /ipad|tablet/i.test(u) || (n >= 700 && n < 1100 && /android|ios/i.test(os)) ? 'tablet' : (/mobi|iphone|android/i.test(u) || (n && n < 700)) ? 'mobile' : 'desktop'; return { os, dev }; }
  const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp\/|slurp|curl|wget|python|headless/i;
  async function hit(req, b) {
    const ua = String(req.headers['user-agent'] || ''); if (BOT.test(ua)) return;
    const now = Date.now(), d = new Date(now + 2 * 3600e3), ip = ipOf(req);
    const vid = String(b.vid || '').replace(/[^a-z0-9]/gi, '').slice(0, 24) || crypto.createHash('sha256').update(ip + ua).digest('hex').slice(0, 16);
    const { os, dev } = devOf(ua, b.w);
    const iph = crypto.createHmac('sha256', KEY).update(ip).digest('hex').slice(0, 16);
    const r = db.prepare('INSERT INTO promo_hit (at, day, hr, vid, src, dev, os, tz, lang, iph) VALUES (?,?,?,?,?,?,?,?,?,?)').run(now, d.toISOString().slice(0, 10), d.getUTCHours(), vid, srcOf(b.ref, b.src), dev, os, clean(b.tz, 40), clean(b.lang, 12), iph);
    const g = await geo(ip);
    if (g) db.prepare('UPDATE promo_hit SET city = ?, region = ?, country = ?, cc = ? WHERE id = ?').run(g.city, g.region, g.country, g.cc, r.lastInsertRowid);
  }
  function stats(days) {
    days = Math.min(365, Math.max(1, Number(days) || 30));
    const since = Date.now() - days * 864e5, prevSince = since - days * 864e5;
    const one = (q, ...a) => db.prepare(q).get(...a);
    const views = one('SELECT COUNT(*) n FROM promo_hit WHERE at >= ?', since).n, uniq = one('SELECT COUNT(DISTINCT vid) n FROM promo_hit WHERE at >= ?', since).n;
    const pviews = one('SELECT COUNT(*) n FROM promo_hit WHERE at >= ? AND at < ?', prevSince, since).n;
    const today = new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);
    const tv = one('SELECT COUNT(*) n FROM promo_hit WHERE day = ?', today).n, tu = one('SELECT COUNT(DISTINCT vid) n FROM promo_hit WHERE day = ?', today).n;
    const leads = one('SELECT COUNT(*) n FROM promo_lead WHERE at >= ?', since).n, pleads = one('SELECT COUNT(*) n FROM promo_lead WHERE at >= ? AND at < ?', prevSince, since).n;
    const live = one('SELECT COUNT(DISTINCT vid) n FROM promo_hit WHERE at >= ?', Date.now() - 5 * 60e3).n;
    const byDay = {}; db.prepare('SELECT day, COUNT(*) v, COUNT(DISTINCT vid) u FROM promo_hit WHERE at >= ? GROUP BY day').all(since).forEach(r => { byDay[r.day] = r; });
    const ld = {}; db.prepare("SELECT strftime('%Y-%m-%d', (at/1000) + 7200, 'unixepoch') day, COUNT(*) n FROM promo_lead WHERE at >= ? GROUP BY day").all(since).forEach(r => { ld[r.day] = r.n; });
    const series = []; for (let i = days - 1; i >= 0; i--) { const k = new Date(Date.now() + 2 * 3600e3 - i * 864e5).toISOString().slice(0, 10); series.push({ day: k, v: (byDay[k] || {}).v || 0, u: (byDay[k] || {}).u || 0, l: ld[k] || 0 }); }
    const top = (col, n) => db.prepare('SELECT ' + col + ' k, COUNT(*) n, COUNT(DISTINCT vid) u FROM promo_hit WHERE at >= ? GROUP BY ' + col + ' ORDER BY n DESC LIMIT ' + (n || 10)).all(since);
    const cities = db.prepare("SELECT COALESCE(NULLIF(city,''),'غير معروف') city, region, country, cc, COUNT(*) n, COUNT(DISTINCT vid) u FROM promo_hit WHERE at >= ? GROUP BY city, country ORDER BY n DESC LIMIT 15").all(since);
    const hours = new Array(24).fill(0); db.prepare('SELECT hr, COUNT(*) n FROM promo_hit WHERE at >= ? GROUP BY hr').all(since).forEach(r => { if (r.hr >= 0 && r.hr < 24) hours[r.hr] = r.n; });
    const recent = db.prepare('SELECT at, src, dev, os, city, region, country FROM promo_hit ORDER BY id DESC LIMIT 25').all();
    return { days, views, uniq, pviews, today: tv, todayU: tu, leads, pleads, live, conv: uniq ? Math.round(leads / uniq * 1000) / 10 : 0, series, sources: top('src'), devices: top('dev', 5), os: top('os', 6), countries: top('country', 8), cities, hours, recent };
  }

  function page(c) {
    const v = ver();
    const CD = { c, v };
    return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no">' +
      '<meta name="theme-color" content="' + ({ '1': '#0B3D91', '2': '#5B1240', '3': '#0A2A5E', '4': '#1E5BB8' }[c.theme]) + '">' +
      '<title>' + (c.brand || 'Emdadx').replace(/[<>&"]/g, '') + ' — ' + (c.tagline || '').replace(/[<>&"]/g, '') + '</title>' +
      '<meta name="description" content="' + (c.about || '').replace(/[<>&"]/g, '').slice(0, 160) + '">' +
      '<link rel="icon" href="/icons/favicon-32.png"><link rel="apple-touch-icon" href="/icons/icon-180.png">' +
      '<link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/promo.css?v=' + v + '">' +
      '<script>document.addEventListener("gesturestart",function(e){e.preventDefault();},{passive:false});</script>' +
      '</head><body class="pm t' + c.theme + '"><div id="app"></div><script>window.PM=' + json(CD) + '</script><script src="/promo.js?v=' + v + '"></script></body></html>';
  }

  async function handlePublic(req, res, pathname) {
    if (pathname === '/promo' || pathname === '/promo/') {
      const c = cfg();
      if (!c.on) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;text-align:center;padding:60px 20px;color:#334">الصفحة دي مش متاحة دلوقتي'); return true; }
      try { const d = new Date().toISOString().slice(0, 10); db.prepare('INSERT INTO promo_view (day, n) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET n = n + 1').run(d); } catch (e) {}
      const body = Buffer.from(page(c), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' });
      res.end(body); return true;
    }
    let m = pathname.match(/^\/promo\/img\/([a-f0-9]{24})$/);
    if (m && req.method === 'GET') {
      const r = db.prepare('SELECT mime, data FROM promo_img WHERE id = ?').get(m[1]);
      if (!r) { res.writeHead(404); res.end(); return true; }
      res.writeHead(200, { 'Content-Type': r.mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
      res.end(Buffer.from(r.data)); return true;
    }
    if (pathname === '/promo/lead' && req.method === 'POST') {
      const c = cfg(); if (!c.on) { sendJSON(res, 404, { message: 'الصفحة مقفولة' }); return true; }
      let b = {}; try { b = (await readBody(req, 0.02)) || {}; } catch (e) {}
      if (b.hp) { sendJSON(res, 200, { ok: true, code: code() }); return true; }   // honeypot
      const name = clean(b.name, 80), center = clean(b.center, 120), phone = digits(b.phone), service = clean(b.service, 60), note = clean(b.note, 600);
      if (name.length < 2 || phone.replace(/\D/g, '').length < 8) { sendJSON(res, 400, { message: 'اكتب الاسم ورقم موبايل صحيح' }); return true; }
      if (limited(ipOf(req))) { sendJSON(res, 429, { message: 'طلبات كتير — جرّب كمان شوية أو كلّمنا واتساب' }); return true; }
      let k; do { k = code(); } while (db.prepare('SELECT 1 FROM promo_lead WHERE code = ?').get(k));
      db.prepare('INSERT INTO promo_lead (code, name, center, phone, service, note, at, ip) VALUES (?,?,?,?,?,?,?,?)').run(k, name, center, phone, service, note, Date.now(), ipOf(req));
      try { broadcast('promo_lead', { at: Date.now() }); } catch (e) {}
      try { if (push && admins) push(admins(), { title: '🖨️ طلب جديد من صفحة الدعاية', body: name + (center ? ' — ' + center : '') + (service ? ' · ' + service : ''), url: './?go=promo', tag: 'promo-lead' }); } catch (e) {}
      sendJSON(res, 200, { ok: true, code: k }); return true;
    }
    if (pathname === '/promo/hit' && req.method === 'POST') {
      let b = {}; try { b = (await readBody(req, 0.01)) || {}; } catch (e) {}
      res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end();
      hit(req, b).catch(() => {}); return true;
    }
    m = pathname.match(/^\/promo\/c\/([A-Za-z0-9_-]{8,20})(\/.*)?$/);
    if (m) {
      const c = ctl(), rest = m[2] || '';
      if (!c || c.token !== m[1]) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;text-align:center;padding:60px 20px;color:#334">اللينك ده مش شغال — اطلب اللينك الجديد من البرنامج'); return true; }
      if (rest === '' || rest === '/') {
        const body = ctlPage(c, sessionOk(req, c));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }); res.end(body); return true;
      }
      if (rest === '/login' && req.method === 'POST') {
        const ip = ipOf(req); if (tooMany(ip)) { sendJSON(res, 429, { message: 'محاولات كتير — استنى ربع ساعة' }); return true; }
        let b = {}; try { b = (await readBody(req, 0.01)) || {}; } catch (e) {}
        if (!passOk(String(b.pass || ''), c.hash)) { tries.get(ip).push(Date.now()); sendJSON(res, 401, { message: 'الباسوورد غلط' }); return true; }
        sendJSON(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, c, true) }); return true;
      }
      if (rest === '/logout' && req.method === 'POST') { sendJSON(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, c, false) }); return true; }
      if (rest.startsWith('/api')) {
        if (!sessionOk(req, c)) { sendJSON(res, 401, { message: 'سجّل دخول تاني' }); return true; }
        if (req.method !== 'GET' && !sameOrigin(req)) { sendJSON(res, 403, { message: 'طلب مش موثوق' }); return true; }
        return core(req, res, rest.replace(/^\/api\/?/, ''), false);
      }
      res.writeHead(404); res.end(); return true;
    }
    if (pathname === '/promo/track' && req.method === 'POST') {
      let b = {}; try { b = (await readBody(req, 0.01)) || {}; } catch (e) {}
      const k = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      const r = k ? db.prepare('SELECT code, service, status, reply, at, updated_at FROM promo_lead WHERE code = ?').get(k) : null;
      if (!r) { sendJSON(res, 404, { message: 'الكود ده مش موجود — اتأكد منه' }); return true; }
      sendJSON(res, 200, { code: r.code, service: r.service, status: r.status, reply: r.reply || '', at: r.at, updated_at: r.updated_at || 0 }); return true;
    }
    return false;
  }

  async function handleAdmin(req, res, pathname) {
    const sub = pathname.replace(/^\/api\/promo\/?/, '');
    if (sub === 'ctl' && req.method === 'POST') {
      let b = {}; try { b = (await readBody(req, 0.01)) || {}; } catch (e) {}
      const p = b.pass != null ? String(b.pass).trim() : '';
      if (p && (p.length < 4 || p.length > 40)) { sendJSON(res, 400, { message: 'الباسوورد من 4 لـ 40 حرف' }); return true; }
      const r = ctlSet(p || null, !!b.rotate); sendJSON(res, 200, { ok: true, token: r.token, pass: r.pass }); return true;
    }
    if (sub === 'ctl/show' && req.method === 'POST') { const c = ctl(); sendJSON(res, 200, { ok: true, pass: c && c.enc ? dec(c.enc) : null }); return true; }
    return core(req, res, sub, true);
  }
  async function core(req, res, sub, erp) {
    if (sub === '' && req.method === 'GET') {
      const since = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
      const views = db.prepare('SELECT COALESCE(SUM(n),0) n FROM promo_view WHERE day >= ?').get(since).n;
      const today = (db.prepare('SELECT n FROM promo_view WHERE day = ?').get(new Date().toISOString().slice(0, 10)) || { n: 0 }).n;
      const leads = db.prepare('SELECT * FROM promo_lead ORDER BY at DESC LIMIT 500').all().map(leadOut);
      const c = ctl(); sendJSON(res, 200, { cfg: cfg(), views, today, leads, icons: ICONS, arts: ARTS, erp: !!erp, ctl: erp && c ? { token: c.token } : null }); return true;
    }
    if (sub === 'cfg' && req.method === 'POST') {
      let b = {}; try { b = (await readBody(req, 0.2)) || {}; } catch (e) {}
      const c = norm(b.cfg || {}); save(c); sendJSON(res, 200, { ok: true, cfg: c }); return true;
    }
    if (sub === 'img' && req.method === 'POST') {
      let b = {}; try { b = (await readBody(req, 4)) || {}; } catch (e) { sendJSON(res, 413, { message: 'الصورة كبيرة — أقصى حاجة 3 ميجا' }); return true; }
      const mm = String(b.data || '').match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!mm) { sendJSON(res, 400, { message: 'ارفع صورة PNG أو JPG أو WEBP' }); return true; }
      const buf = Buffer.from(mm[2], 'base64'); if (buf.length > 3 * 1024 * 1024) { sendJSON(res, 413, { message: 'الصورة كبيرة — أقصى حاجة 3 ميجا' }); return true; }
      const id = crypto.randomBytes(12).toString('hex');
      db.prepare('INSERT INTO promo_img (id, mime, data, at) VALUES (?,?,?,?)').run(id, mm[1], buf, Date.now());
      sendJSON(res, 200, { ok: true, id }); return true;
    }
    if (sub === 'stats' && req.method === 'GET') { sendJSON(res, 200, stats(new URL(req.url, 'http://x').searchParams.get('days'))); return true; }
    let m = sub.match(/^leads\/(\d+)\/(status|delete)$/);
    if (m && req.method === 'POST') {
      const id = Number(m[1]);
      if (m[2] === 'delete') db.prepare('DELETE FROM promo_lead WHERE id = ?').run(id);
      else {
        let b = {}; try { b = (await readBody(req, 0.02)) || {}; } catch (e) {}
        const st = pick(b.status, ['new', 'contacted', 'done'], 'contacted');
        db.prepare('UPDATE promo_lead SET status = ?, reply = COALESCE(?, reply), updated_at = ? WHERE id = ?').run(st, b.reply != null ? clean(b.reply, 400) : null, Date.now(), id);
      }
      sendJSON(res, 200, { ok: true, leads: db.prepare('SELECT * FROM promo_lead ORDER BY at DESC LIMIT 500').all().map(leadOut) }); return true;
    }
    sendJSON(res, 404, { message: 'مش موجود' }); return true;
  }

  /* images nobody uses any more are cleaned once a day */
  setInterval(() => { try { const used = new Set(cfg().slides.map(s => s.img).filter(Boolean)); db.prepare('SELECT id, at FROM promo_img').all().forEach(r => { if (!used.has(r.id) && Date.now() - r.at > 864e5) db.prepare('DELETE FROM promo_img WHERE id = ?').run(r.id); }); } catch (e) {} }, 6 * 3600e3).unref();

  return { handlePublic, handleAdmin };
}

module.exports = { create };
