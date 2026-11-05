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
    slides: arr(c.slides, DEF.slides, 6, x => x && (x.title || x.img) ? { title: clean(x.title, 60), hi: clean(x.hi, 60), sub: clean(x.sub, 140), art: pick(x.art, ARTS, 'monitor'), img: /^[a-f0-9]{24}$/.test(String(x.img || '')) ? String(x.img) : '', btn: clean(x.btn, 30) } : null),
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
    CREATE TABLE IF NOT EXISTS promo_view (day TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);`);

  const cfg = () => { const r = db.prepare("SELECT v FROM promo_kv WHERE k = 'cfg'").get(); let j = null; try { j = r ? JSON.parse(r.v) : null; } catch (e) {} return norm(j || DEF); };
  const save = c => db.prepare("INSERT INTO promo_kv (k, v) VALUES ('cfg', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").run(JSON.stringify(c));
  const json = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, ch => '\\u' + ch.charCodeAt(0).toString(16));
  const ver = () => { try { return String(require(path.join(__dirname, '..', '..', 'package.json')).version || '1'); } catch (e) { return '1'; } };
  const leadOut = x => ({ id: x.id, code: x.code, name: x.name, center: x.center, phone: x.phone, service: x.service, note: x.note, status: x.status, reply: x.reply || '', at: x.at, updated_at: x.updated_at || 0 });

  /* a light per-IP limit on new requests */
  const hits = new Map();
  function limited(ip) { const now = Date.now(), L = (hits.get(ip) || []).filter(t => now - t < 3600e3); if (L.length >= 8) return true; L.push(now); hits.set(ip, L); if (hits.size > 5000) hits.clear(); return false; }
  const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

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
    if (sub === '' && req.method === 'GET') {
      const since = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
      const views = db.prepare('SELECT COALESCE(SUM(n),0) n FROM promo_view WHERE day >= ?').get(since).n;
      const today = (db.prepare('SELECT n FROM promo_view WHERE day = ?').get(new Date().toISOString().slice(0, 10)) || { n: 0 }).n;
      const leads = db.prepare('SELECT * FROM promo_lead ORDER BY at DESC LIMIT 500').all().map(leadOut);
      sendJSON(res, 200, { cfg: cfg(), views, today, leads, icons: ICONS, arts: ARTS }); return true;
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
