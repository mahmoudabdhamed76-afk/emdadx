/* ════════════════════════════════════════════════════════════════════
   حالات المرضى — صفحة المركز (من الكمبيوتر) /k/<code>
   4.90 · يرفع PDF الحالة ← بيتشفّر هنا في المتصفح ← الأصل يتحفظ على الجهاز ده
          (IndexedDB)، ونسخة مشفّرة مؤقتة على السيرفر 7 أيام، وبعدها لايف من هنا.
   4.91 · شكل جديد + اختيار تاني: باركود ثابت على كل الورق (هيدر سيرفر الطباعة)
          المريض يمسحه ← يكتب موبايله ← يوصل لحالته (4.99: الموبايل بس).
          + رفع كذا ملف مرة واحدة، قراءة الاسم والموبايل من الـ PDF، مراقبة فولدر
          سيرفر الطباعة، فلاتر، ونسخة احتياطية تتنقل لكمبيوتر تاني.
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var C = window.CD || {}, BASE = '/k/' + C.code, $ = function (id) { return document.getElementById(id); }, K = window.OZK;
  var ui = { logo: C.logo || '', logoImg: null, recent: [], vwOpen: '', asks: [], bookings: [], tickets: [], qr: null, page: 'dashboard', dicomMounted: false, layout: C.layout === 'violet' ? 'violet' : 'teal', wa: C.wa || '', prefill: null, list: [], local: {}, q: '', f: 'all', queue: [], live: false, es: null, fixed: !!C.fixedOn, dir: null, dirName: '', seen: {}, watchT: 0, pend: {}, auto: false, lastScan: 0, upl: {}, dirFiles: [] };
  var QID = 0;
  /* 5.13 · night mode for the center's QR page (remembered on this computer) */
  function qrdDarkGet() { try { var v = localStorage.getItem('qrd-dark'); if (v === '1') return true; if (v === '0') return false; } catch (e) {} return false; }
  function qrdDarkSet(on) { document.documentElement.classList.toggle('qrd-dark', on); var b = document.getElementById('dkT'); if (b) { b.innerHTML = ic(on ? 'sun' : 'moon') + '<span>' + (on ? 'نهاري' : 'ليلي') + '</span>'; b.setAttribute('aria-pressed', String(on)); } }
  document.documentElement.classList.toggle('qrd-dark', qrdDarkGet());
  function qrdDarkSwap(on, btn) {
    var H = document.documentElement, still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (btn) { btn.classList.remove('dk-spin'); void btn.offsetWidth; btn.classList.add('dk-spin'); }
    if (!document.startViewTransition || still || !btn) { H.classList.add('qrd-swap'); qrdDarkSet(on); setTimeout(function () { H.classList.remove('qrd-swap'); }, 450); return; }
    var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var t = document.startViewTransition(function () { qrdDarkSet(on); });
    t.ready.then(function () { H.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 620, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }); }).catch(function () {});
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(t) { var el = $('toast'); if (!el) return; el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('on'); }, 3000); }
  function mb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function n0(n) { return Math.round(Number(n) || 0).toLocaleString('en-US'); }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function when(ts) { var m = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(String(ts || '')); if (!m) return ''; var d = new Date(+m[1], m[2] - 1, +m[3]), t = new Date(); t.setHours(0, 0, 0, 0); var dd = Math.round((t - d) / 864e5), h = +m[4], hm = ((h % 12) || 12) + ':' + m[5] + (h < 12 ? ' ص' : ' م'); return dd === 0 ? 'النهارده ' + hm : dd === 1 ? 'إمبارح ' + hm : (+m[3]) + '/' + (+m[2]) + '/' + m[1]; }
  function api(method, sub, body) {
    return fetch(BASE + '/' + sub, { method: method, credentials: 'same-origin', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (r.status === 401 && j.login) { location.reload(); throw new Error(''); } if (!r.ok) throw new Error(j.message || 'محصلش — جرّب تاني'); return j; }); });
  }
  function linkOf(tok) { var L = ui.local[tok]; return L ? location.origin + '/v/' + tok + '#' + L.key : ''; }
  function fixedUrl() { return location.origin + '/h/' + C.pub; }
  function phoneWa(p) { var d = K.digits(p); if (!d) return ''; if (d.indexOf('00') === 0) d = d.slice(2); else if (d.indexOf('0') === 0) d = '2' + d; else if (d.length === 10 && d.charAt(0) === '1') d = '20' + d; return d; }
  function beep() { try { var Ac = window.AudioContext || window.webkitAudioContext; if (!Ac) return; var a = beep.a = beep.a || new Ac(), t = a.currentTime; [[880, 0], [1320, .12]].forEach(function (n) { var o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = n[0]; g.gain.setValueAtTime(.0001, t + n[1]); g.gain.exponentialRampToValueAtTime(.15, t + n[1] + .02); g.gain.exponentialRampToValueAtTime(.0001, t + n[1] + .25); o.start(t + n[1]); o.stop(t + n[1] + .26); }); } catch (e) {} }


  /* Unread patient activity: independent of the pending-request workload counts. */
  var NOTICE_LABELS = { ratings: ['⭐', 'التقييمات'], bookings: ['📅', 'الحجوزات'], results: ['📨', 'طلبات النتائج'], complaints: ['📝', 'الشكاوى'], reports: ['📤', 'طلبات التقارير'], activity: ['👁', 'فتح النتائج'], qr: ['▦', 'مسح الباركود'] };
  function noticeNumber(section) {
    if (!ui.notices) return 0;
    if (section !== 'more') return ui.notices.unread(section);
    return Object.keys(NOTICE_LABELS).reduce(function (n, key) { return n + (key === 'bookings' || key === 'complaints' ? 0 : ui.notices.unread(key)); }, 0);
  }
  function paintNotices() {
    if (!ui.notices) return;
    [].forEach.call(document.querySelectorAll('[data-unread]'), function (el) {
      var n = noticeNumber(el.dataset.unread); el.hidden = !n;
      el.textContent = n > 99 ? '99+' : n0(n);
      el.setAttribute('aria-label', 'إشعارات جديدة: ' + n0(n)); el.title = 'إشعارات جديدة: ' + n0(n);
    });
    [].forEach.call(document.querySelectorAll('[data-page], [data-sp], [data-page-nav], #qrdTab [data-dt]'), function (el) {
      var section = el.dataset.page || el.dataset.sp || el.dataset.pageNav || el.dataset.dt;
      el.classList.toggle('has-notice', noticeNumber(section) > 0);
      var pulse = section === 'more' ? Object.keys(NOTICE_LABELS).some(function (k) { return k !== 'bookings' && k !== 'complaints' && (ui.noticePulse[k] || 0) > Date.now(); }) : (ui.noticePulse[section] || 0) > Date.now();
      el.classList.toggle('qrd-notice-pop', pulse);
    });
    var status = $('qrdNoticeStatus'), total = Object.keys(NOTICE_LABELS).reduce(function (n, key) { return n + noticeNumber(key); }, 0);
    if (status) status.textContent = total ? 'إشعارات جديدة: ' + n0(total) : 'مفيش إشعارات جديدة';
  }
  function readNoticePage() {
    if (ui.notices && document.visibilityState === 'visible') ui.notices.markRead(ui.page);
    paintNotices();
  }
  function syncNotices(counts) {
    if (!ui.notices) return;
    ui.notices.update(counts); readNoticePage();
  }
  function noticeEvent(ev) {
    if (!ui.notices) return;
    var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
    var n = m && m.notice; if (!n || !NOTICE_LABELS[n.section]) return;
    var counts = {}; counts[n.section] = n.total;
    var changed = ui.notices.update(counts); if (!changed.length) return;
    ui.noticePulse[n.section] = Date.now() + 1200;
    /* Restart the brief animation for a second event in the same section. */
    [].forEach.call(document.querySelectorAll('.qrd-notice-pop'), function (el) { el.classList.remove('qrd-notice-pop'); });
    void document.body.offsetWidth;
    readNoticePage(); clearTimeout(ui.noticeT); ui.noticeT = setTimeout(paintNotices, 1250);
  }
  function setupNotices() {
    if (!window.OZNotices) return;
    ui.noticePulse = {};
    ui.notices = OZNotices.create({ code: C.code, storage: {
      getItem: function (key) { return localStorage.getItem(key); },
      setItem: function (key, value) { localStorage.setItem(key, value); }
    } });
    var home = $('qrd-body-dashboard');
    if (home) {
      var panel = document.createElement('section'); panel.className = 'qrd-notice-panel';
      panel.innerHTML = '<div class="qrd-notice-head"><b>🔔 تنبيهات الأقسام</b><small id="qrdNoticeStatus" role="status" aria-live="polite"></small></div><div class="qrd-notice-links">' + Object.keys(NOTICE_LABELS).map(function (section) {
        var label = NOTICE_LABELS[section];
        return '<button type="button" data-page-nav="' + section + '"><span aria-hidden="true">' + label[0] + '</span><b>' + label[1] + '</b><em class="qrd-unread" data-unread="' + section + '" hidden></em></button>';
      }).join('') + '</div>';
      home.insertBefore(panel, home.firstChild);
    }
    window.addEventListener('storage', function (ev) { if (ev.key && ev.key.indexOf(ui.notices.prefix) === 0) paintNotices(); });
    paintNotices();
  }

  /* 4.97 · line icons + a colour per exam type */
  var ICO = {
    today: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><circle cx="12" cy="15" r="1.6"/>',
    month: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    disk: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 14h18M7 17h.01M11 17h.01"/>',
    down: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>', up: '<path d="M12 20V9M7 14l5-5 5 5M4 4h16"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
    wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.5A8.4 8.4 0 1 1 21 11.5z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>', play: '<path d="M7 4l13 8-13 8z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    mega: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    au: '<path d="M12 19V5M6 11l6-6 6 6"/>', ad: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    img: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>', trendD: '<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>'
  };
  function ic(n, c) { return '<svg class="i' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24">' + (ICO[n] || '') + '</svg>'; }
  var EXC = [[/مقطع|ct/i, '#4F46E5'], [/رنين|mri/i, '#8B5CF6'], [/سونار|موجات|ultra/i, '#06B6D4'], [/ماموجرا|mammo/i, '#EC4899'], [/دوبلر|doppler/i, '#F43F5E'], [/بانوراما|panor/i, '#F59E0B'], [/كثافة|dexa/i, '#10B981'], [/عادية|x-?ray/i, '#64748B']];
  function exColor(e) { for (var i = 0; i < EXC.length; i++) if (EXC[i][0].test(String(e || ''))) return EXC[i][1]; return '#6366F1'; }
  function dayOf(ts) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(ts || '')); if (!m) return 'من غير تاريخ'; var d = new Date(+m[1], m[2] - 1, +m[3]), t = new Date(); t.setHours(0, 0, 0, 0); var dd = Math.round((t - d) / 864e5); if (dd === 0) return 'النهارده'; if (dd === 1) return 'إمبارح'; var W = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت']; return (dd < 7 ? W[d.getDay()] + ' · ' : '') + (+m[3]) + '/' + (+m[2]) + '/' + m[1]; }
  function hmOf(ts) { var m = / (\d{2}):(\d{2})/.exec(String(ts || '')); if (!m) return ''; var h = +m[1]; return ((h % 12) || 12) + ':' + m[2] + (h < 12 ? ' ص' : ' م'); }

  /* ── the files on THIS computer (IndexedDB): store f = cases, store h = settings (watched folder, seen files) ── */
  var IDB = null;
  function idb() {
    if (IDB) return IDB;
    IDB = new Promise(function (ok, no) { var r = indexedDB.open('ozx-cases', 2); r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains('f')) d.createObjectStore('f', { keyPath: 'token' }); if (!d.objectStoreNames.contains('h')) d.createObjectStore('h'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; });
    return IDB;
  }
  function put(rec) { return idb().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('f', 'readwrite'); t.objectStore('f').put(rec); t.oncomplete = ok; t.onerror = function () { no(t.error); }; t.onabort = function () { no(t.error || new Error('مساحة الجهاز مش كفاية')); }; }); }); }
  function del(tok) { return idb().then(function (d) { return new Promise(function (ok) { var t = d.transaction('f', 'readwrite'); t.objectStore('f').delete(tok); t.oncomplete = ok; t.onerror = ok; }); }); }
  function localAll() { return idb().then(function (d) { return new Promise(function (ok) { var out = {}, c = d.transaction('f').objectStore('f').openCursor(); c.onsuccess = function () { var x = c.result; if (!x) return ok(out); var v = x.value; if (v.code === C.code) out[v.token] = { key: v.key, size: v.size, thumb: v.thumb || '' }; x.continue(); }; c.onerror = function () { ok(out); }; }); }).catch(function () { return {}; }); }
  function localGet(tok) { return idb().then(function (d) { return new Promise(function (ok) { var r = d.transaction('f').objectStore('f').get(tok); r.onsuccess = function () { ok(r.result || null); }; r.onerror = function () { ok(null); }; }); }).catch(function () { return null; }); }
  function hGet(k) { return idb().then(function (d) { return new Promise(function (ok) { var r = d.transaction('h').objectStore('h').get(k); r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ok(undefined); }; }); }).catch(function () { return undefined; }); }
  function hSet(k, v) { return idb().then(function (d) { return new Promise(function (ok) { var t = d.transaction('h', 'readwrite'); if (v === undefined) t.objectStore('h').delete(k); else t.objectStore('h').put(v, k); t.oncomplete = ok; t.onerror = ok; }); }).catch(function () {}); }

  /* ── QR (vendor/qrcode.js) ── */
  /* 4.98 · the center's logo sits in the middle of every QR (level H keeps it readable) */
  function qrM(text) { var q = qrcode(0, ui.logo ? 'H' : 'M'); q.addData(text); q.make(); return q; }
  function hole(n) { if (!ui.logo) return null; var k = Math.max(5, Math.round(n * 0.24)); if (k % 2 !== n % 2) k++; var a = (n - k) / 2; return { a: a, b: a + k, k: k }; }
  function qrSvg(text) {
    var q = qrM(text), n = q.getModuleCount(), m = 2, sz = n + m * 2, d = '', h = hole(n);
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c) && !(h && r >= h.a && r < h.b && c >= h.a && c < h.b)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    var lg = h ? '<rect x="' + (h.a + m + 0.3) + '" y="' + (h.a + m + 0.3) + '" width="' + (h.k - 0.6) + '" height="' + (h.k - 0.6) + '" rx="' + (h.k * 0.22) + '" fill="#fff" stroke="#E4E7F2" stroke-width=".25"/><image href="' + ui.logo + '" x="' + (h.a + m + 0.9) + '" y="' + (h.a + m + 0.9) + '" width="' + (h.k - 1.8) + '" height="' + (h.k - 1.8) + '" preserveAspectRatio="xMidYMid meet"/>' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + sz + ' ' + sz + '" shape-rendering="crispEdges"><rect width="' + sz + '" height="' + sz + '" fill="#fff"/><path d="' + d + '" fill="#0F172A"/>' + lg + '</svg>';
  }
  function qrDraw(ctx, text, x, y, size) {
    var q = qrM(text), n = q.getModuleCount(), cell = size / (n + 4), h = hole(n); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size); ctx.fillStyle = '#0F172A';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c) && !(h && r >= h.a && r < h.b && c >= h.a && c < h.b)) ctx.fillRect(Math.floor(x + (c + 2) * cell), Math.floor(y + (r + 2) * cell), Math.ceil(cell), Math.ceil(cell));
    if (h && ui.logoImg && ui.logoImg.complete && ui.logoImg.naturalWidth) {
      var lx = x + (h.a + 2) * cell, w = h.k * cell, I = ui.logoImg, p = w * 0.08, k = Math.min((w - 2 * p) / I.naturalWidth, (w - 2 * p) / I.naturalHeight), iw = I.naturalWidth * k, ih = I.naturalHeight * k;
      ctx.fillStyle = '#fff'; ctx.fillRect(lx, y + (h.a + 2) * cell, w, w); ctx.drawImage(I, lx + (w - iw) / 2, y + (h.a + 2) * cell + (w - ih) / 2, iw, ih);
    }
  }
  function logoTag(cls) { return ui.logo ? '<img class="' + (cls || '') + '" src="' + ui.logo + '" alt="">' : esc(String(C.center || 'م').trim().charAt(0)); }
  function loadLogoImg() { ui.logoImg = null; if (!ui.logo) return; var I = new Image(); I.src = ui.logo; ui.logoImg = I; }
  loadLogoImg();
  function pickLogo() {
    modal('<h3>لوجو المركز</h3><p>بيظهر فوق في الصفحة، وفي نص كل باركود (باركود كل حالة والباركود الثابت والاستيكر)، وفي صفحة المريض.</p><div class="lgpv">' + (ui.logo ? '<img src="' + ui.logo + '" alt="">' : '<span>' + esc(String(C.center || 'م').trim().charAt(0)) + '</span>') + '</div>' +
      '<div class="bt"><button class="btn" data-x="pick">اختار صورة</button>' + (ui.logo ? '<button class="btn d" data-x="rm">شيل اللوجو</button>' : '<button class="btn g" data-x="cl">إلغاء</button>') + '</div><p style="font-size:11.5px;margin-top:10px">أحسن حاجة صورة مربعة بخلفية بيضا أو شفافة (PNG).</p>',
      function (k, close) {
        if (k === 'rm') { saveLogo('').then(close); }
        if (k === 'pick') { var f = document.createElement('input'); f.type = 'file'; f.accept = 'image/png,image/jpeg,image/webp'; f.onchange = function () { if (f.files[0]) shrink(f.files[0]).then(saveLogo).then(close).catch(function (e) { toast(e.message || 'مش قادر أقرا الصورة'); }); }; f.click(); }
      });
  }
  function shrink(file) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(file), I = new Image();
      I.onload = function () { var S = 256, k = Math.min(1, S / Math.max(I.width, I.height)), w = Math.round(I.width * k), h = Math.round(I.height * k), cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(I, 0, 0, w, h); URL.revokeObjectURL(u); var d = cv.toDataURL('image/png'); if (d.length > 280000) d = cv.toDataURL('image/webp', 0.9); ok(d); };
      I.onerror = function () { no(new Error('الملف ده مش صورة')); }; I.src = u;
    });
  }
  function saveLogo(d) {
    return api('POST', 'logo', { data: d }).then(function () {
      ui.logo = d; loadLogoImg();
      var paint = function () { brand(); fixedCard(); table(); toast(d ? 'اتحفظ اللوجو ✓ — هيظهر في نص كل باركود' : 'اتشال اللوجو'); };
      if (ui.logoImg) { ui.logoImg.onload = paint; ui.logoImg.onerror = paint; } else paint();
    }).catch(function (e) { toast(e.message); });
  }
  function brand() { [].forEach.call(document.querySelectorAll('[data-logo]'), function (el) { el.innerHTML = logoTag(); el.classList.toggle('img', !!ui.logo); }); }

  /* ════ login ════ */
  function login() {
    document.body.innerHTML = '<div class="gate"><div class="box"><i class="glg' + (ui.logo ? ' img' : '') + '">' + (ui.logo ? '<img src="' + ui.logo + '" alt="">' : '▦') + '</i><h1>QR Patient</h1><p>' + esc(C.center) + '</p><input class="fld" id="pw" type="password" autocomplete="current-password" placeholder="الباسوورد" autofocus><div class="err" id="er"></div><button class="btn w" id="go" style="margin-top:6px;padding:13px">دخول</button><p style="margin-top:14px;font-size:12px">الباسوورد من الشركة — مختلف عن لينك الحسابات.</p></div></div><div class="toast" id="toast"></div>';
    var go = function () {
      var p = $('pw').value; if (!p) return; $('go').disabled = true;
      fetch(BASE + '/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pass: p }) }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || 'محصلش'); location.reload(); }); })
        .catch(function (e) { $('go').disabled = false; $('er').textContent = e.message; $('pw').select(); });
    };
    $('go').onclick = go; $('pw').onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }


  /* Dashboard V3: the two user-approved mockup layouts, shared data and controls. */
  function dashboardNav() {
    var items = [
      ['dashboard', '⌂', 'لوحة التحكم'],
      ['bookings', '▣', 'طلبات حجز الأشعة'],
      ['results', '▤', 'طلبات النتائج'],
      ['complaints', '📝', 'الشكاوى'],
      ['reports', '📤', 'طلبات التقارير'],
      ['ratings', '⭐', 'تقييمات المرضى'],
      ['follow', '🔁', 'المتابعات'],
      ['doctors', '👨‍⚕️', 'الدكاترة المحوّلين'],
      ['upload', '⇧', 'رفع ملفات PDF / DICOM'],
      ['cases', '▥', 'الحالات'],
      ['activity', '◷', 'آخر مرات الفتح'],
      ['qr', '▦', 'باركود المركز'],
      ['design', '◉', 'شكل صفحة المريض'],
      ['ads', '📣', 'الإعلانات'],
      ['settings', '⚙', 'الإعدادات']
    ];
    return '<aside class="qrd-nav" id="dashSidebar" aria-label="قائمة QR Patient">' +
      '<div class="qrd-nav-brand"><span class="qrd-nav-logo">▦</span><div><b>QR Patient</b><small>إدارة صور وملفات المرضى</small></div></div>' +
      '<nav class="qrd-nav-list" aria-label="أقسام الصفحة">' +
      items.map(function (x) {
        var grp = { bookings: 'طلبات المرضى', upload: 'الحالات', qr: 'المركز' }[x[0]];
        return (grp ? '<p class="qrd-nav-grp">' + grp + '</p>' : '') + '<a href="' + (isIOSBrowser() ? pageUrl(x[0]) : '#page-' + x[0]) + '" data-page="' + x[0] + '"' +
          (x[0] === 'dashboard' ? ' class="on" aria-current="page"' : '') +
          '><span>' + x[1] + '</span><b>' + x[2] + '</b>' +
          (['bookings','results','complaints','reports'].indexOf(x[0]) >= 0 ? '<em class="qrd-nav-count" title="طلبات مستنية الرد" data-count="' + x[0] + '">0</em>' : '') +
          (NOTICE_LABELS[x[0]] ? '<em class="qrd-unread" data-unread="' + x[0] + '" hidden></em>' : '') + '</a>';
      }).join('') +
      '</nav><div class="qrd-nav-end"><span class="qrd-nav-online">● متصل ببيانات المركز</span>' +
      '<small>كل الملفات والطلبات في مكان واحد</small></div></aside>';
  }
  function updateNavCount(name, n) {
    dashSoon();
    var el = document.querySelector('[data-count="' + name + '"]');
    if (el) { el.textContent = n0(n); el.hidden = !n; }
  }
  /* iOS Safari sometimes leaves hidden/composited panels blank after hash-only SPA navigation.
     On Apple mobile devices open each section as an actual document navigation instead. */
  var QRD_PAGES = /^(dashboard|bookings|results|complaints|reports|upload|cases|qr|design|ads|ratings|follow|doctors|activity|settings)$/;
  function isIOSBrowser() {
    var ua = String(navigator.userAgent || '');
    return /iP(?:hone|ad|od)/i.test(ua) ||
      (navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints) > 1);
  }
  function pageFromHash() {
    var hash = /^#page-([a-z]+)$/.exec(location.hash || '');
    if (hash && QRD_PAGES.test(hash[1])) return hash[1];
    /* Search fallback makes direct bookmarks work even if Safari drops # on reload. */
    var q = /(?:^|[?&])section=([a-z]+)(?:&|$)/.exec(location.search || '');
    return q && QRD_PAGES.test(q[1]) ? q[1] : 'dashboard';
  }
  function pageUrl(section) {
    var url = new URL(location.href);
    url.searchParams.set('section', section);
    url.hash = 'page-' + section;
    return url.href;
  }
  function ensureDicom() {
    if (ui.dicomMounted || !window.OZDicom || !$('mwda')) return;
    ui.dicomMounted = true;
    try { window.OZDicom.mount($('mwda'), { center: C.center, toast: toast, onPdf: addConverted }); }
    catch (e) { ui.dicomMounted = false; toast('مش قادر أفتح أداة DICOM'); }
  }
  function navigatePage(page, push) {
    var selected = QRD_PAGES.test(page) ? page : 'dashboard';
    if (push && selected === ui.page) return;
    if (push && isIOSBrowser()) {
      /* Real page transition avoids repeated blank white views on iPhone Safari/WebKit.
         Don't interrupt an in-progress file upload or an unsaved queue item. */
      if (ui.queue.some(function (item) { return item.st === 'ready' || item.st === 'saving' || item.st === 'reading'; })) {
        toast('خلص حفظ أو رفع الملفات الأول قبل ما تفتح قسم تاني'); return;
      }
      try { history.scrollRestoration = 'manual'; window.scrollTo(0, 0); } catch (e) {}
      ui.safeSectionNavigation = true;
      window.location.assign(pageUrl(selected));
      return;
    }
    ui.page = selected; if (selected === 'ratings') { ratingsUI(); ratingsLoad(); } if (selected === 'follow') followLoad(); if (selected === 'doctors') docsLoad(); if (selected === 'settings') digestUI();
    /* Explicit show/hide to prevent blank mobile Safari panels after tapping a section. */
    var panes = document.querySelectorAll('section.qrd-page[data-qrd-page]'), visible = null;
    [].forEach.call(panes, function (node) {
      var active = node.dataset.qrdPage === selected;
      node.hidden = !active;
      node.setAttribute('aria-hidden', String(!active));
      node.style.setProperty('display', active ? 'block' : 'none', 'important');
      if (active) { visible = node; node.style.opacity = '1'; node.style.visibility = 'visible'; }
    });
    if (!visible) {
      selected='dashboard';var home=$('qrd-page-dashboard');
      if (home) { home.hidden=false;home.style.setProperty('display','block','important');visible=home; }
    }
    [].forEach.call(document.querySelectorAll('.qrd-nav-list a[data-page]'), function (a) {
      var active = a.dataset.page === selected;
      a.classList.toggle('on', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.body.setAttribute('data-qrd-page', selected); readNoticePage(); if (typeof markTab === 'function') markTab();
    if (push && location.hash !== '#page-' + selected) {
      try { history.pushState({ qrdPage: selected }, '', '#page-' + selected); } catch (e) {}
    }
    if (selected === 'upload') setTimeout(ensureDicom, 90);
    try { if (typeof window.scrollTo === 'function') window.scrollTo(0,0); }catch(e){}
    /* 5.29 · GX Motion (GSAP): the section's cards come in one after another */
    try { document.dispatchEvent(new CustomEvent('qrd:page', { detail: { page: selected, node: visible.querySelector('.qrd-page-body') || visible } })); } catch (e) {}
    if (visible && window.innerWidth <= 900) {
      visible.style.animation='none';
      if (window.requestAnimationFrame) window.requestAnimationFrame(function(){
        if(!visible.hidden){visible.style.opacity='1';visible.style.visibility='visible';}
      });
    }
  }
  function buildDashboardPages() {
    var wrap = document.querySelector('.wrap'), oldGrid = document.querySelector('.kgrid');
    if (!wrap || !oldGrid) return;
    var host = document.createElement('main'); host.id = 'qrdPages'; host.className = 'qrd-pages';
    var initialPage = pageFromHash();
    var meta = [
      ['dashboard', 'لوحة التحكم', 'ملخص زيارات الباركود وآخر فتح للنتائج'],
      ['bookings', 'طلبات حجز الأشعة', 'طلبات الحجز الواردة فقط، مع إجراء الاتصال والتأكيد'],
      ['results', 'طلبات نتائج الأشعة', 'المرضى اللي طلبوا المساعدة في العثور على نتائجهم'],
      ['complaints', 'شكاوى المرضى', 'الشكاوى الجديدة وبيانات التواصل مع المرضى'],
      ['reports', 'طلبات تقارير الأشعة', 'طلبات التقارير والصور المرفوعة من المرضى'],
      ['upload', 'رفع ملفات الأشعة', 'رفع PDF وDICOM وإدارة الملفات قبل حفظها'],
      ['cases', 'الحالات والنتائج', 'البحث عن الحالات المرفوعة وإدارتها'],
      ['qr', 'باركود المركز', 'رابط الباركود الثابت وطرق طباعته ومشاركته'],
      ['design', 'شكل صفحة المريض', 'اختيار التصميم اللي يظهر للمرضى على موبايلهم'],
      ['ads', 'الإعلانات', 'اكتب إعلان أو عرض يظهر للمرضى في السلايدر اللي فوق صفحتهم'],
      ['ratings', 'تقييمات المرضى', 'رأي المرضى بعد ما بيفتحوا نتيجتهم — النجوم والأسباب والملاحظات ونسبة الرضا كل شهر'],
      ['follow', 'مواعيد المتابعة', 'حدّد بعد قد إيه كل فحص محتاج متابعة، وكلّم المرضى اللي ميعادهم قرّب'],
      ['doctors', 'الدكاترة المحوّلين', 'لينك خاص لكل دكتور يشوف منه نتايج مرضاه، وعدد الحالات اللي جاتلك من كل واحد'],
      ['activity', 'آخر مرات الفتح', 'سجل فتح نتائج الأشعة وروابط الحالات'],
      ['settings', 'إعدادات وتخزين الجهاز', 'حالة مساحة التخزين ونسخة الملفات المحلية']
    ];
    var bodies = {};
    meta.forEach(function (m) {
      var page = document.createElement('section');
      page.className = 'qrd-page'; page.id = 'qrd-page-' + m[0]; page.dataset.qrdPage = m[0];
      /* Build the requested section visible from the start — never reveal a previously
         hidden ancestor immediately after the initial iOS Safari paint. */
      page.hidden = m[0] !== initialPage;
      page.style.display = page.hidden ? 'none' : 'block';
      page.innerHTML = '<div class="qrd-page-title"><div><small>QR Patient / ' + m[1] + '</small><h1>' + m[1] +
        '</h1><p>' + m[2] + '</p></div></div><div class="qrd-page-body" id="qrd-body-' + m[0] + '"></div>';
      host.appendChild(page); bodies[m[0]] = page.querySelector('.qrd-page-body');
    });
    wrap.appendChild(host);
    var move = function (name, selector, parent) {
      var node = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (node) (parent || bodies[name]).appendChild(node);
      return node;
    };
    var homeGrid = document.createElement('div'); homeGrid.className = 'qrd-home-grid'; bodies.dashboard.appendChild(homeGrid);
    move('dashboard', '#qrStats', homeGrid);
    var homeRecent = document.createElement('section'); homeRecent.className = 'qrd-home-recent';
    homeRecent.innerHTML = '<div class="qrd-home-recent-head"><div><small>نشاط المرضى</small><h2>👁 آخر مرات الفتح</h2></div>' +
      '<button type="button" data-page-nav="activity" class="btn g sm">عرض السجل كله ←</button></div>' +
      '<div id="qrdHomeRecent" class="qrd-recent-rows"></div>';
    homeGrid.insertBefore(homeRecent, homeGrid.firstChild);
    move('bookings', '#bookings'); move('results', '#asks');
    move('complaints', '#complaints'); move('reports', '#reportRequests');
    move('upload', '.kmain .upz'); move('upload', '#mwda'); move('upload', '#qu');
    move('cases', '.kmain .card.list');
    move('qr', '#fx');
    var how = document.querySelector('.kside .how'); if (how) move('qr', how.closest('.opt'));
    move('design', '.hero2'); move('design', '#thm');
    move('qr', '#qrStats');
    var adsBox = document.createElement('div'); adsBox.id = 'adsBox'; bodies.ads.appendChild(adsBox);
    var rtBox = document.createElement('div'); rtBox.id = 'ratingsBox'; bodies.ratings.appendChild(rtBox);
    var fBox = document.createElement('div'); fBox.id = 'folBox'; bodies.follow.appendChild(fBox);
    var dBox = document.createElement('div'); dBox.id = 'docsBox'; bodies.doctors.appendChild(dBox);
    var gBox = document.createElement('div'); gBox.id = 'dgBox'; bodies.settings.appendChild(gBox);
    var lx = document.createElement('div'); lx.id = 'qrdX'; lx.className = 'lx'; bodies.dashboard.insertBefore(lx, bodies.dashboard.firstChild);
    move('activity', '#recentViews');
    move('settings', '#disk'); setTimeout(chartSettings, 0);
    if (oldGrid.parentNode) oldGrid.parentNode.removeChild(oldGrid);
    host.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-page-nav]');
      if (b) { e.preventDefault(); navigatePage(b.dataset.pageNav, true); }
    });
    window.addEventListener('hashchange', function () { navigatePage(pageFromHash(), false); });
    window.addEventListener('popstate', function () { navigatePage(pageFromHash(), false); });
    /* Restore the correct section when Safari returns from Back/Forward Cache. */
    if (isIOSBrowser()) window.addEventListener('pageshow', function (event) {
      /* Only BFCache restores need to reconcile state; initial paint was already built correctly. */
      if (!event.persisted) return;
      navigatePage(pageFromHash(), false);
      try { window.scrollTo(0, 0); } catch (e) {}
    });
    navigatePage(pageFromHash(), false);
  }
  function setDashboardLayout(mode) {
    ui.layout = mode === 'violet' ? 'violet' : 'teal';
    document.body.classList.toggle('qrd-teal', ui.layout === 'teal');
    document.body.classList.toggle('qrd-violet', ui.layout === 'violet');
    [['dashTeal','teal'],['dashViolet','violet']].forEach(function (x) {
      var b = $(x[0]); if (!b) return;
      b.classList.toggle('on', ui.layout === x[1]);
      b.setAttribute('aria-pressed', String(ui.layout === x[1]));
    });
  }
  /* ════ 5.03 · design D «تطبيق» on phones: KPI cards, today's scans by hour, quick actions, bottom tab bar ════ */
  var DSV={"home": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/></svg>", "list": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01\"/></svg>", "cal": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"3\"/><path d=\"M3 10h18M8 3v4M16 3v4\"/></svg>", "up": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 19V7M6 12l6-6 6 6\"/><path d=\"M4 21h16\"/></svg>", "more": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"5\" cy=\"12\" r=\"1.6\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\"/><circle cx=\"19\" cy=\"12\" r=\"1.6\"/></svg>", "eye": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>", "file": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h4\"/></svg>", "lung": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4v8M12 12c-2 0-3 1-3 3v3c0 1.7-1.3 3-3 3s-3-1.3-3-3v-4c0-4 3-8 6-8M12 12c2 0 3 1 3 3v3c0 1.7 1.3 3 3 3s3-1.3 3-3v-4c0-4-3-8-6-8\"/></svg>", "qr": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/><path d=\"M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3\"/></svg>"};
  DSV.msg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>';
  function dSvg(n) { return DSV[n] || ''; }
  function setupMobileD() {
    document.body.classList.add('qrd-d');
    var dash = $('qrd-body-dashboard');
    if (dash && !$('qrdD')) {
      var d = document.createElement('section'); d.id = 'qrdD'; d.className = 'qrdd';
      d.innerHTML = '<div class="qrdd-kp"><div class="qrdd-k1"><small>مسح باركود المركز النهارده</small><b id="dK1">0</b><em id="dK1t">—</em><svg class="qrdd-sp" viewBox="0 0 200 44" preserveAspectRatio="none"><path id="dSpA" fill="rgba(255,255,255,.22)"/><path id="dSpL" fill="none" stroke="#fff" stroke-width="2.4"/></svg></div>' +
        '<div class="qrdd-k2" style="--b:#ECFDF5;--c:#059669">' + dSvg('eye') + '<b id="dK2">0</b><small>مرة اتفتحت نتيجة</small></div>' +
        '<div class="qrdd-k2" style="--b:#FFF7ED;--c:#EA580C">' + dSvg('cal') + '<b id="dK3">0</b><small>طلبات جديدة</small></div></div>' +
        '<div class="qrdd-ch"><div class="qrdd-t"><b>مسح الباركود على مدار اليوم</b><small id="dChT">النهارده</small></div><div class="qrdd-bars" id="dBars"></div><div class="qrdd-bx"><span>12ص</span><span>6ص</span><span>12م</span><span>6م</span><span>11م</span></div></div>' +
        '<div class="qrdd-qa"><button type="button" data-dq="pdf" style="--c:#E11D48">' + dSvg('file') + 'ارفع PDF</button><button type="button" data-dq="dicom" style="--c:#4F46E5">' + dSvg('lung') + 'DICOM</button><button type="button" data-dq="qr" style="--c:var(--qrd-a,#0F766E)">' + dSvg('qr') + 'الباركود الثابت</button></div>';
      var h2 = dash.querySelector('.hero2'); if (h2 && h2.nextSibling) dash.insertBefore(d, h2.nextSibling); else dash.insertBefore(d, dash.firstChild);
      d.addEventListener('click', function (e) {
        var b = e.target.closest('[data-dq]'); if (!b) return; var k = b.dataset.dq;
        if (k === 'qr') return navigatePage('qr', true);
        navigatePage('upload', true); setTimeout(function () { if (k === 'pdf') { var f = $('fi'); if (f) f.click(); } else dicomPick(); }, 200);
      });
    }
    if (!$('qrdTab')) {
      var tabs = [['dashboard', 'home', 'الرئيسية'], ['cases', 'list', 'الحالات'], ['bookings', 'cal', 'الطلبات'], ['complaints', 'msg', 'الشكاوى'], ['more', 'more', 'المزيد']];
      document.body.insertAdjacentHTML('beforeend', '<nav class="qrdd-tab" id="qrdTab" aria-label="التنقل">' + tabs.map(function (t) {
        return '<button type="button" data-dt="' + t[0] + '">' + dSvg(t[1]) + '<span>' + t[2] + '</span>' + (['bookings','complaints','more'].indexOf(t[0]) >= 0 ? '<em class="qrd-unread" data-unread="' + t[0] + '" hidden></em>' : '') + '</button>'; }).join('') + '</nav>' +
        '<div class="qrdd-sheet" id="qrdSheet" hidden><div class="qrdd-sh"><i></i><b>كل الأقسام</b><div class="qrdd-sl" id="qrdSheetL"></div></div></div>');
      var nav = document.querySelectorAll('.qrd-nav-list a[data-page]'), L = $('qrdSheetL');
      [].forEach.call(nav, function (a) { L.insertAdjacentHTML('beforeend', '<button type="button" data-sp="' + a.dataset.page + '">' + a.innerHTML + '</button>'); });
      var sheet = $('qrdSheet');
      sheet.onclick = function (e) { var b = e.target.closest('[data-sp]'); if (b) { sheet.hidden = true; navigatePage(b.dataset.sp, true); } else if (e.target === sheet) sheet.hidden = true; };
      $('qrdTab').onclick = function (e) { var b = e.target.closest('[data-dt]'); if (!b) return; if (b.dataset.dt === 'more') { sheet.hidden = false; return; } navigatePage(b.dataset.dt, true); };
    }
    markTab();
  }
  function markTab() {
    var p = document.body.getAttribute('data-qrd-page') || ui.page || 'dashboard', main = ['dashboard', 'cases', 'bookings', 'complaints'];
    [].forEach.call(document.querySelectorAll('#qrdTab [data-dt]'), function (b) { b.classList.toggle('on', b.dataset.dt === p || (b.dataset.dt === 'more' && main.indexOf(p) < 0)); });
  }
  function dHome() {
    if (!$('qrdD')) return; wSetup(); wPaint();
    var q = ui.qr || {}, rec = q.recent || [], td = ymd(), y = ymd(new Date(Date.now() - 864e5)), hrs = new Array(24).fill(0), yc = 0;
    rec.forEach(function (r) { var at = String(r.at || ''); if (r.kind !== 'fixed') return; if (at.slice(0, 10) === td) hrs[+at.slice(11, 13) || 0]++; else if (at.slice(0, 10) === y) yc++; });
    var today = q.today || 0, views = 0; ui.list.forEach(function (r) { views += r.views || 0; });
    var reqs = (ui.bookings || []).length + (ui.tickets || []).length + (ui.asks || []).length;
    var D = ui.dash; if (D) { today = D.qr.today; yc = D.qr.yday; hrs = D.hours.slice(); views = D.views.total; reqs = D.req.total; }
    var set = function (id, v) { var e = $(id); if (e && e.dataset.v !== String(v)) { e.dataset.v = v; count(e, v); } };
    set('dK1', today); set('dK2', views); set('dK3', reqs);
    var t = $('dK1t'); if (t) t.textContent = yc ? (today >= yc ? '▲ ' : '▼ ') + Math.abs(Math.round((today - yc) / yc * 100)) + '% عن امبارح' : (q.total ? 'الإجمالي ' + n0(q.total) + ' مرة' : 'لسه مفيش مسح');
    var mx = Math.max.apply(null, hrs.concat([1])), now = new Date().getHours();
    var chb = $('qrdD') && $('qrdD').querySelector('.qrdd-ch');
    var mm = ui.mMode || 'today', sig = chb && D ? chartStyle() + mm + D.hours.join(',') + '|' + D.days.map(function (d) { return d.qr; }).join(',') + '|' + D.qr.today + '|' + D.qr.yday : '';
    if (chb && D && chb.dataset.sig !== sig) {
      chb.dataset.sig = sig;
      chb.classList.toggle('is-line', chartStyle() === 'line');
      if (chartStyle() === 'line') { chb.innerHTML = '<div class="qrdd-t"><b>مسح الباركود</b>' + modeSeg(mm, 'data-mm') + '</div>' + trendChart(D, mm, true); }
      else { chb.innerHTML = '<div class="qrdd-t"><b>مسح الباركود</b>' + modeSeg(mm, 'data-mm') + '</div>' + lxChart(mm === 'today' ? D : D, mm); }
      [].forEach.call(chb.querySelectorAll('[data-mm]'), function (b) { b.onclick = function () { ui.mMode = b.dataset.mm; dHome(); }; });
    }
    if ($('dBars')) $('dBars').innerHTML = hrs.map(function (n, h) { return '<i class="' + (h === now ? 'h' : '') + (n ? ' v' : '') + '" style="height:' + Math.max(6, Math.round(n / mx * 100)) + '%" title="' + h + ':00 — ' + n + '"></i>'; }).join('');
    var pts = [], acc = 0; hrs.forEach(function (n, h) { acc += n; pts.push([h / 23 * 200, 40 - (acc / Math.max(1, today || acc)) * 34]); });
    var dL = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    if ($('dSpL')) $('dSpL').setAttribute('d', dL); if ($('dSpA')) $('dSpA').setAttribute('d', dL + ' L200 44 L0 44Z');
    [].forEach.call(document.querySelectorAll('#qrdSheetL [data-count]'), function (em) { var src = document.querySelector('.qrd-nav-list [data-count="' + em.dataset.count + '"]'); if (src) { em.textContent = src.textContent; em.hidden = src.hidden || src.textContent === '0'; } });
    paintNotices();
  }
  function setupDashboardDecor() {
    document.body.classList.add('qrd-center');
    if (isIOSBrowser()) {
      document.documentElement.classList.add('qrd-ios-browser');
      try { history.scrollRestoration = 'manual'; } catch (e) {}
    }
    document.body.insertAdjacentHTML('afterbegin', dashboardNav());
    var header = document.querySelector('.tbar .sp');
    if (header && !$('dkT')) {
      header.insertAdjacentHTML('afterbegin', '<button type="button" class="ib dkt" id="dkT" title="وضع ليلي / نهاري"></button>');
      $('dkT').onclick = function () { var on = !document.documentElement.classList.contains('qrd-dark'); qrdDarkSwap(on, this); try { localStorage.setItem('qrd-dark', on ? '1' : '0'); } catch (e) {} };
      qrdDarkSet(qrdDarkGet());
    }
    ui.layout = 'teal'; setDashboardLayout('teal');
    [['dashTeal','teal'],['dashViolet','violet']].forEach(function (x) {
      var b = $(x[0]); if (!b) return;
      b.onclick = function () {
        if (ui.layout === x[1]) return;
        var prev = ui.layout;
        setDashboardLayout(x[1]);
        api('POST', 'layout', { layout: x[1] }).then(function () {
          toast('🎨 اتحفظ تصميم لوحة التحكم للمركز');
        }).catch(function (e) { setDashboardLayout(prev); toast(e.message || 'محصلش حفظ'); });
      };
    });
    [].forEach.call(document.querySelectorAll('.qrd-nav-list a[data-page]'), function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        navigatePage(a.dataset.page, true);
      });
    });
    var upz = document.querySelector('.kmain .upz'), mwda = $('mwda');
    if (upz) {
      upz.insertAdjacentHTML('afterbegin',
        '<div class="qrd-upload-head"><span class="qrd-upload-badge">⇧</span><div><h2>رفع ملفات الأشعة — PDF أو DICOM</h2>' +
        '<p>حمّل التقرير أو صور الأشعة هنا، واحتفظ بنفس طريقة رفع الملفات والتشفير.</p></div></div>');
      upz.insertAdjacentHTML('beforeend',
        '<div class="qrd-upload-actions"><button type="button" id="uploadQuick" class="btn">⇧ اختيار ملفات PDF</button>' +
        '<button type="button" id="uploadDicomQuick" class="btn g">🩻 اختيار DICOM</button></div>');
      $('uploadQuick').onclick = function () { $('fi').click(); };
      $('uploadDicomQuick').onclick = function () { dicomPick(); };
    }
    if (upz && mwda && mwda.parentNode) mwda.parentNode.insertBefore(upz, mwda);
    var rail = document.querySelector('.kside'), theme = $('thm'), rec = $('rec') && $('rec').closest('.opt.rec'), fixed = $('fx');
    if (rail && fixed) {
      if (theme) rail.insertBefore(theme, fixed);
      if (rec) rail.insertBefore(rec, fixed);
    }
    buildDashboardPages();
    setupMobileD();
  }

  /* ════ the page ════ */
  function shell() {
    var dirOk = 'showDirectoryPicker' in window;
    document.body.innerHTML =
      '<header class="tbar"><div class="tb-in"><span class="lg' + (ui.logo ? ' img' : '') + '" data-logo>' + logoTag() + '</span><div class="tt"><b>QR Patient</b><small>' + esc(C.center) + '</small></div>' +
        '<div class="sp"><span class="pill" id="st"><i></i><span>بيتصل…</span></span><button class="ib qrd-push-button" type="button" id="centerPushToggle" aria-pressed="false" title="تفعيل إشعارات الطلبات الجديدة على الجهاز">🔔 <span>الإشعارات</span></button><button class="ib" id="bk" title="نسخة احتياطية من حالات الجهاز ده — تنقلها لكمبيوتر تاني">' + ic('down') + '<span>نسخة احتياطية</span></button><button class="ib" id="rs" title="رجّع نسخة احتياطية">' + ic('up') + '<span>استرجاع</span></button><input type="file" id="rsf" accept=".ozxcases" hidden><button class="ib x" id="out" title="خروج">' + ic('out') + '<span>خروج</span></button></div></div></header>' +
      '<div class="wrap">' +
      '<section class="hero2"><div class="hl"><button class="clogo' + (ui.logo ? ' img' : '') + '" id="lgo" type="button" title="لوجو المركز"><span data-logo>' + logoTag() + '</span><em>' + (ui.logo ? 'غيّر' : '+ لوجو') + '</em></button>' +
          '<div><small>QR Patient</small><h1>' + esc(C.center) + '</h1><p>ارفع PDF الحالة واطبع الباركود — والمريض يفتح نتيجته من موبايله.</p></div></div>' +
        '<div class="hs"><div><b id="s1">0</b><span>النهارده</span></div><div><b id="s2">0</b><span>الشهر ده</span></div><div><b id="s3">0</b><span>مرة اتفتحت</span></div><div><b id="s4">0</b><span>على الجهاز ده</span></div></div></section>' +
      '<section class="qrc" id="qrStats" aria-label="إحصائيات مسح الباركود"><div class="qrc-loading">📊 جاري تحميل إحصائيات مسح الباركود…</div></section>' +
      '<div class="kgrid"><div class="kmain">' +
        '<div id="mwda"></div><div class="upz"><div class="drop" id="drop"><span class="beam"></span>' +
          '<div class="pis"><button class="pi pdf" id="pkP" type="button" title="ارفع PDF"><span class="pg"><svg viewBox="0 0 48 56"><path d="M8 2h22l12 12v36a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" fill="#fff"/><path d="M30 2v12h12" fill="#FECACA"/><rect x="0" y="28" width="34" height="16" rx="4" fill="#E11D48"/><text x="17" y="40" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Arial,sans-serif">PDF</text></svg></span><b>PDF</b><small>تقرير / نتيجة</small></button>' +
          '<button class="pi dcm" id="pkD" type="button" title="ارفع DICOM"><span class="pg"><svg viewBox="0 0 56 56"><rect x="4" y="4" width="48" height="48" rx="12" fill="#0B1024"/><circle cx="28" cy="27" r="14" fill="none" stroke="#67E8F9" stroke-width="2.4" stroke-dasharray="5 4"/><path d="M28 16v22M22 21c4 2 8 2 12 0M21 28c5 2 9 2 14 0M22 35c4 2 8 2 12 0" stroke="#E0E7FF" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="12" y="44" width="32" height="6" rx="3" fill="#4F46E5"/></svg></span><b>DICOM</b><small>صور الجهاز نفسها</small></button></div>' +
          '<div class="dt"><b>اسحب PDF أو ملفات / فولدر DICOM هنا</b><small>PDF: لحد ' + C.maxMb + ' ميجا · DICOM: بيتضغط هنا لحجم صغير، والمريض يفتحه على موبايله ويتحكم فيه كأنه باكس</small></div>' +
          '<input type="file" id="fi" accept="application/pdf,.pdf" multiple hidden><input type="file" id="fiD" multiple hidden><input type="file" id="fiDD" webkitdirectory multiple hidden></div>' +
          (dirOk ? '<div class="watch" id="wt"></div>' : '') + '</div>' +
        '<div class="queue" id="qu"></div>' +
        '<section class="card list"><div class="ch"><div class="h"><h2>الحالات</h2><small id="lc"></small></div><div class="srch">' + ic('search') + '<input class="fld q" id="q" placeholder="اسم المريض أو الموبايل أو الفحص"></div></div><div class="seg" id="fl"></div><div id="tbl"><div class="sk"></div><div class="sk" style="opacity:.7"></div><div class="sk" style="opacity:.45"></div></div></section>' +
      '</div><aside class="kside"><div id="bookings" class="qrd-data-pending">جار تحميل حجوزات الأشعة…</div><div id="asks" class="qrd-data-pending">جار تحميل طلبات النتائج…</div><div id="complaints" class="qrd-data-pending">جار تحميل شكاوى المرضى…</div><div id="reportRequests" class="qrd-data-pending">جار تحميل طلبات التقارير…</div><div class="opt fxc" id="fx"></div>' +
        '<div class="opt"><h3>' + ic('qr') + ' باركود لكل حالة <span class="tg ok">شغال دايماً</span></h3><div class="how"><div><span>1</span>اسحب PDF الحالة واكتب اسم المريض</div><div><span>2</span>اطبع الاستيكر أو ابعته واتساب</div><div><span>3</span>المريض يمسحه ويشوف أشعته على طول</div></div></div>' +
        '<div class="opt thm" id="thm"></div>' +
        '<div class="opt rec" id="recentViews"><h3>' + ic('eye') + ' آخر مرات الفتح</h3><div id="rec"></div></div>' +
        '<div class="disk" id="disk"><div class="sk" style="height:40px;margin:0"></div></div></aside></div></div><div class="toast" id="toast"></div>';
    setupDashboardDecor();
    $('lgo').onclick = pickLogo;
    $('out').onclick = function () { api('POST', 'logout').then(function () { location.reload(); }).catch(function () { location.reload(); }); };
    $('bk').onclick = backup; $('rs').onclick = function () { $('rsf').click(); }; $('rsf').onchange = function () { if (this.files[0]) restore(this.files[0]); this.value = ''; };
    var dr = $('drop'), fi = $('fi');
    $('pkP').onclick = function (e) { e.stopPropagation(); fi.click(); };
    $('pkD').onclick = function (e) { e.stopPropagation(); dicomPick(); };
    $('fiD').onchange = function () { addDicom([].slice.call(this.files || [])); this.value = ''; };
    $('fiDD').onchange = function () { addDicom([].slice.call(this.files || [])); this.value = ''; };
    dr.onclick = function (e) { if (e.target === dr || e.target.closest('.dt')) fi.click(); };
    fi.onchange = function () { add([].slice.call(fi.files || [])); fi.value = ''; };
    ['dragenter', 'dragover'].forEach(function (k) { dr.addEventListener(k, function (e) { e.preventDefault(); dr.classList.add('ov'); }); });
    ['dragleave', 'drop'].forEach(function (k) { dr.addEventListener(k, function (e) { e.preventDefault(); dr.classList.remove('ov'); }); });
    dr.addEventListener('drop', function (e) { dropped(e.dataTransfer); });
    document.addEventListener('dragover', function (e) { e.preventDefault(); }); document.addEventListener('drop', function (e) { e.preventDefault(); });
    $('q').oninput = function () { ui.q = this.value.trim(); table(); };
    fixedCard(); watchBar(); themeCard();
    /* DICOM preview is mounted when the Upload section opens, so its measurements are correct. */
  }
  function addConverted(L) {
    if (!L.length) return;
    L.forEach(function (x) {
      var q = { id: ++QID, file: x.file, name: x.file.name, size: x.file.size, pages: x.pages || 0, thumb: '', patient: x.patient || '', phone: '', exam: x.exam || '', st: 'ready', af: '🩻 اتعمل من DICOM — ' + 'راجع الاسم واكتب موبايل المريض', dir: false };
      ui.queue.push(q); readPdf(q);
    });
    queue(); beep();
    toast('🩻 اتعمل ' + L.length + (L.length === 1 ? ' PDF' : ' ملفات PDF') + ' — اكتب موبايل المريض واحفظ');
    var qu = $('qu'); if (qu) setTimeout(function () { qu.scrollIntoView({ behavior: 'smooth', block: 'start' }); var i = qu.querySelector('[data-k=phone]'); if (i) i.focus(); }, 300);
  }
  function count(el, to) { var t0 = performance.now(); (function f(t) { var k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = n0(to * e); if (k < 1) requestAnimationFrame(f); })(t0); }
  function stats() {
    setTimeout(function () { try { dHome(); } catch (e) {} }, 0); dashSoon();
    var td = ymd(), mo = td.slice(0, 7), a = 0, b = 0, v = 0;
    ui.list.forEach(function (r) { var d = String(r.at || '').slice(0, 10); if (d === td) a++; if (d.slice(0, 7) === mo) b++; v += r.views || 0; });
    [[$('s1'), a], [$('s2'), b], [$('s3'), v], [$('s4'), Object.keys(ui.local).length]].forEach(function (x) { if (x[0] && x[0].dataset.v !== String(x[1])) { x[0].dataset.v = x[1]; count(x[0], x[1]); } });
  }

  /* Compact QR open summary with native, keyboard-accessible expandable visit lists. */
  function qrPanel() {
    var root = $('qrStats'), q = ui.qr;
    if (!root || !q) return;
    var previouslyOpen = {};
    [].forEach.call(root.querySelectorAll('details[data-qr-kind]'), function (d) {
      previouslyOpen[d.dataset.qrKind] = d.open;
    });
    var rows = q.recent || [];
    function visitTime(ts) {
      var m = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(String(ts || ''));
      if (!m) return String(ts || '—');
      var h = Number(m[4]);
      return (+m[3]) + '/' + (+m[2]) + '/' + m[1] + ' · ' +
        ((h % 12) || 12) + ':' + m[5] + (h < 12 ? ' ص' : ' م');
    }
    function group(kind, label, number, symbol) {
      var log = rows.filter(function (r) { return r.kind === kind; });
      var times = log.length ? log.map(function (r) {
        return '<li><span>◷ مسح الباركود</span><time datetime="' + esc(String(r.at || '').replace(' ', 'T')) +
          '">' + esc(visitTime(r.at)) + '</time></li>';
      }).join('') : '<li class="qrd-qr-empty">مفيش مواعيد مسح مسجلة حديثًا للقسم ده.</li>';
      var tail = number > log.length ? '<p class="qrd-qr-history-note">بنحتفظ بآخر ' + log.length +
        ' زيارة تفصيليًا هنا، والعدد الإجمالي محفوظ كامل.</p>' : '';
      return '<details class="qrd-qr-accordion" data-qr-kind="' + kind + '"' + (previouslyOpen[kind] ? ' open' : '') + '>' +
        '<summary><span class="qrd-qr-symbol">' + symbol + '</span><span class="qrd-qr-label"><b>' + label +
        '</b><small>اضغط لعرض أوقات المسح</small></span><strong>' + n0(number) +
        ' <small>مرة</small></strong><span class="qrd-qr-chevron" aria-hidden="true">⌄</span></summary>' +
        '<div class="qrd-qr-opened"><ol class="qrd-qr-times">' + times + '</ol>' + tail + '</div></details>';
    }
    root.innerHTML =
      '<div class="qrc-head"><div class="qrc-head-icon">▦</div><div class="qrc-head-copy"><small>QR ANALYTICS</small><h2>مسح الباركود</h2>' +
        '<p>عداد مرات المسح والمواعيد، من غير موقع أو بيانات زائر.</p></div><span class="qrc-tag"><i></i> مباشر</span></div>' +
      '<div class="qrd-qr-totals"><div><span>إجمالي مرات المسح</span><strong>' + n0(q.total) + '</strong></div>' +
        '<div><span>مرات المسح اليوم</span><strong>' + n0(q.today) + '</strong></div></div>' +
      '<div class="qrd-qr-groups">' +
        group('fixed', 'باركود المركز الثابت', q.fixed, '▦') +
        group('report', 'روابط نتائج الأشعة', q.report, '🩻') +
      '</div>' +
      '<p class="qrd-qr-note">العداد بيحسب مسح الباركود من الكاميرا أو مباشرة؛ افتح أي قائمة لعرض المواعيد المسجلة.</p>';
  }
  /* ── option 2: the fixed barcode on every report ── */
  /* 5.01 · the look of the patient's pages (A «نَفَس» / C «دفا») — the patient can switch to night mode himself */
  function themeCard() {
    var el = $('thm'); if (!el) return; var t = ui.theme || C.theme || 'a';
    el.innerHTML = '<h3>🎨 شكل صفحة المريض</h3><p>٦ تصميمات نهارية — كل تصميم فيه شاشة ترحيب متحركة وكارت لحجز الأشعة وكارت لعرض النتائج.</p>' +
      '<div class="thg"><button data-th="a" class="' + (t === 'a' ? 'on' : '') + '"><span class="sw2 a"><i></i><i></i><i></i></span><b>«نَفَس»</b><small>أبيض وتركواز</small></button>' +
      '<button data-th="c" class="' + (t === 'c' ? 'on' : '') + '"><span class="sw2 c"><i></i><i></i><i></i></span><b>«دفا»</b><small>كريمي وبرتقالي</small></button>' +
      '<button data-th="b" class="' + (t === 'b' ? 'on' : '') + '"><span class="sw2 b"><i></i><i></i><i></i></span><b>«نبض»</b><small>أزرق طبي</small></button>' +
      '<button data-th="d" class="' + (t === 'd' ? 'on' : '') + '"><span class="sw2 d"><i></i><i></i><i></i></span><b>«هدوء»</b><small>لافندر نهاري</small></button>' +
      '<button data-th="e" class="' + (t === 'e' ? 'on' : '') + '"><span class="sw2 e"><i></i><i></i><i></i></span><b>«صفا»</b><small>أزرق ثلجي</small></button>' +
      '<button data-th="f" class="' + (t === 'f' ? 'on' : '') + '"><span class="sw2 f"><i></i><i></i><i></i></span><b>«رؤية»</b><small>أخضر طبي</small></button>' +
      '<button data-th="g" class="' + (t === 'g' ? 'on' : '') + '"><span class="sw2 g"><i></i><i></i><i></i></span><b>«فخامة»</b><small>كحلي ودهبي</small><em class="th-new">جديد</em></button>' +
      '<button data-th="h" class="' + (t === 'h' ? 'on' : '') + '"><span class="sw2 h"><i></i><i></i><i></i></span><b>«ورد»</b><small>وردي هادي</small><em class="th-new">جديد</em></button>' +
      '<button data-th="i" class="' + (t === 'i' ? 'on' : '') + '"><span class="sw2 i"><i></i><i></i><i></i></span><b>«ليل»</b><small>غامق عصري</small><em class="th-new">جديد</em></button></div>' +
      '<a class="btn g sm w" href="' + fixedUrl() + '" target="_blank" rel="noopener" style="margin-top:10px">👁 شوف صفحة المريض</a>';
    [].forEach.call(el.querySelectorAll('[data-th]'), function (b) { b.onclick = function () { var v = b.dataset.th; api('POST', 'theme', { theme: v }).then(function () { ui.theme = v; themeCard(); toast('🎨 اتغير شكل صفحة المريض ✓'); }).catch(function (e) { toast(e.message); }); }; });
  }
  function fixedCard() {
    var el = $('fx'); if (!el) return;
    el.innerHTML = '<h3>📌 باركود ثابت على كل الورق <button class="sw' + (ui.fixed ? ' on' : '') + '" id="fsw" type="button" aria-label="تشغيل/إيقاف"></button></h3>' +
      '<p>باركود واحد للمركز في هيدر سيرفر الطباعة — المريض يمسحه ويكتب <b>رقم موبايله</b> بس ويوصل لحالته.</p>' +
      '<div class="fq' + (ui.fixed ? '' : ' off') + '" id="fqm" title="كبّر"><span class="corner a"></span><span class="corner b"></span>' + qrSvg(fixedUrl()) + '</div>' +
      '<div class="ob"><button class="btn sm" id="fh">' + ic('down') + ' صورة الهيدر</button><button class="btn g sm" id="fq">' + ic('qr') + ' الباركود لوحده</button><button class="btn g sm" id="fp">' + ic('print') + ' اطبع</button><button class="btn g sm" id="fc">نسخ اللينك</button></div>' +
      '<div class="st2 ' + (ui.fixed ? 'on' : 'of') + '"><i></i>' + (ui.fixed ? 'شغال — اكتب موبايل المريض مع كل حالة عشان يلاقيها' : 'موقوف — المرضى مش هيقدروا يدوّروا') + '</div>' +
      '<p style="font-size:11.5px;margin-top:8px">📨 اللي مايلاقيش نتيجته يبعت طلب، ويظهرلك هنا لايف بصوت.</p>';
    $('fsw').onclick = function () { var on = !ui.fixed; api('POST', 'fixed', { on: on }).then(function () { ui.fixed = on; fixedCard(); toast(on ? '📌 الباركود الثابت اشتغل' : '⏸ الباركود الثابت اتوقف'); }).catch(function (e) { toast(e.message); }); };
    $('fh').onclick = function () { headerPng(function (u) { dl(u, 'هيدر-باركود-' + C.center + '.png'); }); };
    $('fq').onclick = function () { qrPng(function (u) { dl(u, 'باركود-' + C.center + '.png'); }); };
    $('fp').onclick = printFixed;
    $('fc').onclick = function () { try { navigator.clipboard.writeText(fixedUrl()).then(function () { toast('اتنسخ ✓'); }); } catch (e) {} };
    $('fqm').onclick = function () { headerPng(function (u) { modal('<h3>📌 الباركود الثابت</h3><p>حط الصورة دي في هيدر التقارير على سيرفر الطباعة</p><div class="qbig">' + qrSvg(fixedUrl()) + '</div><img class="hdr" src="' + u + '" alt=""><div class="lk"><input readonly value="' + esc(fixedUrl()) + '"></div><div class="bt"><button class="btn" data-x="h">⬇ صورة الهيدر</button><button class="btn g" data-x="p">🖨 اطبع</button></div><button class="btn g w" data-x="cl" style="margin-top:8px">تمام</button>', function (k) { if (k === 'h') dl(u, 'هيدر-باركود-' + C.center + '.png'); if (k === 'p') printFixed(); }); }); };
  }
  function dl(u, name) { var a = document.createElement('a'); a.href = u; a.download = name.replace(/[\\/:*?"<>|]+/g, ' '); document.body.appendChild(a); a.click(); a.remove(); }
  function fontsReady(cb) { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(cb, cb); }
  function headerPng(cb) {   /* a wide strip for the report's header: name + how-to on one side, the barcode on the other */
    fontsReady(function () {
      var W = 2400, H = 460, cv = document.createElement('canvas'), x = cv.getContext('2d'); cv.width = W; cv.height = H;
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      var g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#0E9F9A'); g.addColorStop(1, '#0B1F33'); x.fillStyle = g; x.fillRect(0, H - 14, W, 14);
      qrDraw(x, fixedUrl(), 60, 22, 360);
      x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = '#0F172A';
      var F = "'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif";
      x.font = '800 92px ' + F; x.fillText(C.center || '', W - 70, 150);
      x.fillStyle = '#0B7F7B'; x.font = '700 62px ' + F; x.fillText('نتيجة الأشعة على موبايلك 📱', W - 70, 255);
      x.fillStyle = '#475569'; x.font = '500 46px ' + F; x.fillText('امسح الباركود ← اكتب رقم موبايلك ← افتح نتيجتك', W - 70, 345);
      x.textAlign = 'center'; x.fillStyle = '#64748B'; x.font = '600 30px ' + F; x.fillText('امسح هنا', 240, 412);
      cb(cv.toDataURL('image/png'));
    });
  }
  function qrPng(cb) {
    fontsReady(function () {
      var W = 1200, H = 1380, cv = document.createElement('canvas'), x = cv.getContext('2d'); cv.width = W; cv.height = H;
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); qrDraw(x, fixedUrl(), 100, 80, 1000);
      var F = "'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif"; x.direction = 'rtl'; x.textAlign = 'center';
      x.fillStyle = '#0F172A'; x.font = '800 62px ' + F; x.fillText(C.center || '', W / 2, 1180);
      x.fillStyle = '#0B7F7B'; x.font = '700 46px ' + F; x.fillText('امسح الباركود وشوف نتيجتك', W / 2, 1270);
      cb(cv.toDataURL('image/png'));
    });
  }
  function printFixed() {
    headerPng(function (u) {
      var w = window.open('', '_blank', 'width=900,height=700'); if (!w) return toast('اسمح بالنوافذ المنبثقة');
      w.document.write('<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><title>الباركود الثابت</title><style>@page{size:A4;margin:12mm}body{margin:0;font-family:Tahoma,Arial,sans-serif;text-align:center;color:#0F172A}img{width:100%}.q{width:120mm;margin:14mm auto 4mm}.q svg{width:100%}p{font-size:15px;color:#334155}</style><img src="' + u + '"><div class="q">' + qrSvg(fixedUrl()) + '</div><p><b>' + esc(C.center) + '</b> — امسح الباركود، اكتب رقم موبايلك، وشوف نتيجتك.</p><script>setTimeout(function(){print()},400)<\/script></html>');
      w.document.close();
    });
  }

  /* ── the upload queue ── */
  function pdfjs(cb) {
    if (window.pdfjsLib) return cb(window.pdfjsLib);
    if (pdfjs.q) return pdfjs.q.push(cb); pdfjs.q = [cb];
    var s = document.createElement('script'); s.src = '/vendor/pdfjs/pdf.min.js';
    var fin = function (lib) { var q = pdfjs.q; pdfjs.q = null; q.forEach(function (f) { f(lib); }); };
    s.onload = function () { try { pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js'; } catch (e) {} fin(window.pdfjsLib); }; s.onerror = function () { fin(null); };
    document.head.appendChild(s);
  }
  var EXAMS = [[/مقطعي|ct\b|c\.t|computed/i, 'أشعة مقطعية'], [/رنين|mri|m\.r\.i|magnetic/i, 'رنين مغناطيسي'], [/ماموجرا|mammo/i, 'ماموجرام'], [/دوبلر|doppler/i, 'دوبلر'], [/سونار|موجات صوتية|ultra ?sound|sonar|\bus\b/i, 'سونار'], [/بانوراما|panoram|opg/i, 'أشعة بانوراما'], [/كثافة|dexa|dxa|densit/i, 'قياس كثافة العظام'], [/x-?ray|أشعة عادية|radiograph/i, 'أشعة عادية'], [/pet/i, 'PET']];
  /* best effort: the patient's name, mobile and the exam from the report's first page */
  function sniff(text) {
    var t = String(text || '').replace(/[ \t\u00A0]+/g, ' '), o = {};
    var d = K.digits(t.replace(/[\s\-]/g, '')), pm = /(?:0020|\+?20)?(01[0125]\d{8})/.exec(d); if (pm) o.phone = pm[1];
    var nm = /(?:اسم المريض|اسم المريضة|المريض|المريضة|الاسم|patient'?s? name|patient|name)[ \t]*[:：\-][ \t]*([؀-ۿa-zA-Z][؀-ۿa-zA-Z .]{2,50})/i.exec(t);
    if (nm) { var n = (' ' + nm[1] + ' ').replace(/\s(age|sex|date|id|ref|dr|السن|النوع|التاريخ|العمر|رقم|كود|الكود|الجنس|الانطباع|التقرير|الفحص|النتيجه|النتيجة|الطبيب|دكتور|المحول|الرأي|التشخيص|الرئتين|القلب)(\s.*|$)/i, ' ').trim().split(/\s+/).slice(0, 4).join(' '); if (n.length >= 3) o.patient = n; }
    for (var i = 0; i < EXAMS.length; i++) if (EXAMS[i][0].test(t)) { o.exam = EXAMS[i][1]; break; }
    return o;
  }
  /* 5.00 · DICOM: files or a whole folder → one compressed bundle per study */
  function dicomPick() {
    modal('<h3>ارفع DICOM</h3><p>اختار ملفات الصور من الجهاز، أو الفولدر كله (CD المريض مثلاً). بنقراها ونضغطها هنا على الكمبيوتر ده، وبتترفع متشفّرة زي الـ PDF.</p><div class="bt"><button class="btn" data-x="dir">📂 فولدر</button><button class="btn g" data-x="files">ملفات</button></div><button class="btn g w" data-x="cl" style="margin-top:8px">إلغاء</button>',
      function (k, close) { close(); if (k === 'dir') $('fiDD').click(); if (k === 'files') $('fiD').click(); });
  }
  function isPdf(f) { return /\.pdf$/i.test(f.name) || f.type === 'application/pdf'; }
  function maybeDicom(f) { return !/^\./.test(f.name) && !/\.(txt|xml|html?|exe|ini|inf|jpg|jpeg|png|gif|bmp|pdf|dll|js|css|json|zip|rar|db|lnk|url|bat|mp4|avi|doc|docx|xls|xlsx)$/i.test(f.name) && f.size > 200; }
  function dropped(dt) {
    var items = dt && dt.items ? [].slice.call(dt.items) : [], ents = items.map(function (it) { return it.webkitGetAsEntry ? it.webkitGetAsEntry() : null; }).filter(Boolean);
    if (!ents.some(function (en) { return en.isDirectory; })) return add([].slice.call((dt && dt.files) || []));
    var out = [], pend = 0, fin = function () { if (!pend) add(out); };
    var walk = function (en) { pend++; if (en.isFile) en.file(function (f) { out.push(f); pend--; fin(); }, function () { pend--; fin(); }); else if (en.isDirectory) { var rd = en.createReader(), all = []; (function more() { rd.readEntries(function (L) { if (L.length) { all = all.concat(L); more(); } else { all.forEach(walk); pend--; fin(); } }, function () { pend--; fin(); }); })(); } else { pend--; fin(); } };
    ents.forEach(walk);
  }
  function addDicom(files, dkeys) {
    files = files.filter(maybeDicom); if (!files.length) return toast('مفيش ملفات DICOM');
    if (!window.OZPacs || !window.CompressionStream) return toast('المتصفح ده قديم — افتح الصفحة من Chrome أو Edge');
    var ph = { id: ++QID, kind: 'dicom', st: 'pack', name: files.length + ' ملف DICOM', msg2: 'بنقرا الملفات…', pct: 2, dkeys: dkeys || null };
    ui.queue.push(ph); queue();
    OZPacs.pack(files, { maxMb: C.maxMb, step: function (k, a, b) { ph.pct = Math.round(a / b * (k === 'read' ? 40 : 60) + (k === 'read' ? 0 : 40)); ph.msg2 = (k === 'read' ? 'بنقرا ' : 'بنضغط الصور ') + a + ' / ' + b; var e = $('pk' + ph.id), t = $('pt' + ph.id); if (e) e.style.width = ph.pct + '%'; if (t) t.textContent = ph.msg2; } })
      .then(function (L) {
        ph.st = 'gone';
        L.forEach(function (r) {
          var nm = String(r.patient || '').trim(), q = { id: ++QID, kind: 'dicom', file: new File([r.blob], 'DICOM - ' + (nm || 'case') + '.ozxd', { type: 'application/octet-stream' }), name: '🩻 DICOM · ' + r.count + ' صورة' + (r.series > 1 ? ' · ' + r.series + ' سيريز' : ''), size: r.blob.size, pages: r.count, thumb: r.thumb, patient: nm, phone: '', exam: r.exam || '', st: 'ready', af: '🩻 اتضغطت لـ ' + mb(r.blob.size) + (r.date ? ' · ' + r.date : '') + ' — راجع الاسم واكتب موبايل المريض', dir: false, dkeys: dkeys || null };
          ui.queue.push(q);
        });
        queue(); beep(); toast('🩻 جاهز — اكتب موبايل المريض واحفظ');
        var qu = $('qu'); if (qu) setTimeout(function () { qu.scrollIntoView({ behavior: 'smooth', block: 'start' }); var i = qu.querySelector('[data-k=phone]'); if (i) i.focus(); }, 300);
      })
      .catch(function (e) { ph.st = 'gone'; queue(); toast(e.message || 'مش قادر أقرا ملفات DICOM'); });
  }
  function add(files, fromDir) {
    var other = files.filter(function (f) { return !isPdf(f) && maybeDicom(f); });
    files = files.filter(isPdf);
    if (other.length && !fromDir) addDicom(other);
    if (!files.length) { if (!other.length) toast('اختار ملفات PDF أو DICOM'); return; }
    files.forEach(function (f) {
      if (f.size > C.maxMb * 1048576) return toast(f.name + ' أكبر من ' + C.maxMb + ' ميجا');
      var q = { id: ++QID, file: f, name: f.name, size: f.size, pages: 0, thumb: '', patient: '', phone: '', exam: '', st: 'ready', af: '', dir: !!fromDir, dkey: fromDir ? f.name + '|' + f.size + '|' + f.lastModified : '' };
      if (ui.prefill && files.length === 1) { q.patient = ui.prefill.patient || ''; q.phone = ui.prefill.phone || ''; }
      var g = f.name.replace(/\.pdf$/i, '').replace(/[_\-.]+/g, ' ').replace(/\d{5,}/g, ' ').replace(/\s+/g, ' ').trim(); 
      if (!q.patient && /[؀-ۿ]/.test(g)) q.patient = g.slice(0, 80);
      ui.queue.push(q); readPdf(q);
    });
    ui.prefill = null;
    queue();
    if (fromDir) { beep(); toast('📄 ' + (files.length > 1 ? files.length + ' ملفات جديدة' : 'ملف جديد') + ' من فولدر سيرفر الطباعة'); }
  }
  function readPdf(q) {
    pdfjs(function (lib) {
      if (!lib) return;
      q.file.arrayBuffer().then(function (buf) { return lib.getDocument({ data: new Uint8Array(buf) }).promise; }).then(function (doc) {
        q.pages = doc.numPages;
        return doc.getPage(1).then(function (pg) {
          var vp = pg.getViewport({ scale: 1 }), k = 220 / vp.width, v2 = pg.getViewport({ scale: k }), cv = document.createElement('canvas'); cv.dir = 'ltr'; cv.width = v2.width; cv.height = v2.height;
          return Promise.all([pg.render({ canvasContext: cv.getContext('2d'), viewport: v2 }).promise.then(function () { q.thumb = cv.toDataURL('image/jpeg', 0.6); }), pg.getTextContent().then(function (tc) {
            /* Arabic often comes out glyph by glyph, in presentation forms and in visual (reversed) order → try it as is and reversed */
            var raw = tc.items.map(function (i) { return i.str + (i.hasEOL ? '\n' : ''); }).join(''), nf = raw.normalize ? raw.normalize('NFKC') : raw;
            var rev = nf.split('\n').map(function (l) { return /[\u0600-\u06FF]/.test(l) ? Array.from(l).reverse().join('') : l; }).join('\n');
            var a1 = sniff(rev), a2 = sniff(nf), s = { patient: a1.patient || a2.patient, phone: a2.phone || a1.phone, exam: a1.exam || a2.exam }, got = [];
            if (s.patient && (!q.patient || q.patient === q.name)) { q.patient = s.patient; got.push('الاسم'); }
            if (s.phone && !q.phone) { q.phone = s.phone; got.push('الموبايل'); }
            if (s.exam && !q.exam) { q.exam = s.exam; got.push('الفحص'); }
            if (got.length) q.af = '✨ قريت ' + got.join(' و') + ' من الملف — راجعه';
          }).catch(function () {})]);
        });
      }).catch(function () { q.af = '⚠ مش قادر أقرا الملف — اتأكد إنه PDF سليم'; }).then(function () {
        paintQ(q);
        if (ui.auto && q.dir && q.patient && K.last10(q.phone) && q.st === 'ready') saveOne(q, true).catch(function () {});
      });
    });
  }
  function queue() {
    setTimeout(dirList, 0);
    var el = $('qu'), L = ui.queue.filter(function (q) { return q.st !== 'gone'; });
    if (!L.length) { el.innerHTML = ''; return; }
    var ready = L.filter(function (q) { return q.st === 'ready' || q.st === 'err'; }).length;
    el.innerHTML = (L.length > 1 ? '<div class="qbar"><span>📥 ' + L.length + ' ملف مستني' + (ready ? ' — ' + ready + ' جاهز للحفظ' : '') + '</span><span style="display:flex;gap:6px"><button class="btn sm" id="qall"' + (ready ? '' : ' disabled') + '>▦ احفظ الكل</button><button class="btn g sm" id="qclr">شيل المحفوظ</button></span></div>' : '') +
      L.map(function (q) { return '<div class="qi" id="qi' + q.id + '"></div>'; }).join('');
    L.forEach(paintQ);
    var a = $('qall'); if (a) a.onclick = function () { saveMany(ui.queue.filter(function (q) { return q.st === 'ready' || q.st === 'err'; })); };
    var c = $('qclr'); if (c) c.onclick = function () { ui.queue = ui.queue.filter(function (q) { return q.st !== 'done'; }); queue(); };
  }
  function paintQ(q) {
    var el = $('qi' + q.id); if (!el) return;
    el.className = 'qi' + (q.st === 'done' ? ' done' : q.st === 'err' ? ' err' : '') + (q.kind === 'dicom' ? ' dcm' : '');
    if (q.st === 'pack') { el.innerHTML = '<span class="th dz"><i></i>🩻</span><div class="nm" style="grid-column:2/-1"><b>' + esc(q.name) + '</b><small id="pt' + q.id + '">' + esc(q.msg2 || '') + '</small><div class="pb"><i id="pk' + q.id + '" style="width:' + (q.pct || 2) + '%"></i></div></div>'; return; }
    if (q.st === 'done') {
      el.innerHTML = (q.thumb ? '<img class="th" src="' + q.thumb + '" alt="">' : '<span class="th">✅</span>') + '<div class="nm"><b>✅ ' + esc(q.patient) + '</b><small>' + esc(q.exam || '') + ' · اتحفظت</small></div><div class="qf" style="display:block;color:#15803D;font-weight:700;font-size:13px">' + (q.wrapped ? '📌 تتلاقى بالباركود الثابت · ' : '') + '▦ الباركود جاهز</div><div class="qa"><button class="btn sm" data-x="qr">▦ باركود</button><button class="btn g sm" data-x="pr">🖨</button><button class="btn g sm" data-x="rm">×</button></div>';
    } else {
      var busy = q.st === 'saving';
      el.innerHTML = (q.thumb ? '<img class="th" src="' + q.thumb + '" alt="">' : '<span class="th">📄</span>') +
        '<div class="nm"><b>' + esc(q.name) + '</b><small>' + mb(q.size) + (q.pages ? ' · ' + q.pages + (q.kind === 'dicom' ? ' صورة' : ' صفحة') : '') + '</small>' + (q.af ? '<small class="af">' + esc(q.af) + '</small>' : '') + (q.msg ? '<small style="color:#DC2626;font-weight:700">' + esc(q.msg) + '</small>' : '') + (busy ? '<div class="pb"><i id="pb' + q.id + '"></i></div>' : '') + '</div>' +
        '<div class="qf"><input class="fld" data-k="patient" maxlength="80" placeholder="اسم المريض *" value="' + esc(q.patient) + '"' + (busy ? ' disabled' : '') + '><input class="fld n" data-k="phone" maxlength="20" inputmode="tel" placeholder="موبايل المريض' + (ui.fixed ? ' *' : '') + '" style="text-align:right" value="' + esc(q.phone) + '"' + (busy ? ' disabled' : '') + '><input class="fld" data-k="exam" maxlength="80" list="exl" placeholder="نوع الفحص" value="' + esc(q.exam) + '"' + (busy ? ' disabled' : '') + '></div>' +
        '<div class="qf qf2"><select class="fld" data-k="doctor"' + (busy ? ' disabled' : '') + '>' + docOpts(q.doctor) + '</select><select class="fld" data-k="follow"' + (busy ? ' disabled' : '') + '>' + [['', 'المتابعة: حسب نوع الفحص'], ['0', 'من غير متابعة'], ['30', 'متابعة بعد شهر'], ['90', 'بعد 3 شهور'], ['180', 'بعد 6 شهور'], ['365', 'بعد سنة']].map(function (o) { return '<option value="' + o[0] + '"' + (String(q.follow == null ? '' : q.follow) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="qa"><button class="btn sm" data-x="sv"' + (busy ? ' disabled' : '') + '>' + (busy ? '⏳' : '▦ احفظ') + '</button><button class="btn g sm" data-x="rm"' + (busy ? ' disabled' : '') + ' title="شيل">×</button></div>';
      [].forEach.call(el.querySelectorAll('[data-k]'), function (i) { i.oninput = function () { q[i.dataset.k] = i.value; }; i.onkeydown = function (e) { if (e.key === 'Enter') saveOne(q).catch(function () {}); }; });
    }
    [].forEach.call(el.querySelectorAll('[data-x]'), function (b) { b.onclick = function () { var x = b.dataset.x; if (x === 'sv') saveOne(q).catch(function () {}); if (x === 'rm') { q.st = 'gone'; queue(); } if (x === 'qr') showQr(q.token, true); if (x === 'pr') printSticker(q.token); }; });
    if (!$('exl')) { var dl2 = document.createElement('datalist'); dl2.id = 'exl'; dl2.innerHTML = ['أشعة مقطعية', 'رنين مغناطيسي', 'سونار', 'أشعة عادية', 'ماموجرام', 'دوبلر', 'أشعة بانوراما', 'قياس كثافة العظام'].map(function (x) { return '<option>' + x + '</option>'; }).join(''); document.body.appendChild(dl2); }
  }
  function saveMany(L) { var i = 0; (function nx() { if (i >= L.length) return; saveOne(L[i++], true).then(nx, nx); })(); }
  function saveOne(q, quiet) {
    if (q.st === 'saving' || q.st === 'done') return Promise.resolve();
    q.patient = String(q.patient || '').trim(); q.phone = String(q.phone || '').trim();
    if (q.patient.length < 2) { q.msg = 'اكتب اسم المريض'; paintQ(q); return Promise.reject(); }
    if (ui.fixed && !K.last10(q.phone) && !q.noPhoneOk) { q.msg = 'اكتب موبايل المريض عشان يلاقي حالته بالباركود الثابت (أو دوس احفظ تاني لو مش موجود)'; q.noPhoneOk = true; paintQ(q); return Promise.reject(); }
    if (!(window.crypto && crypto.subtle)) { toast('المتصفح ده مش بيدعم التشفير — استخدم Chrome أو Edge'); return Promise.reject(); }
    q.st = 'saving'; q.msg = ''; paintQ(q);
    var iv = crypto.getRandomValues(new Uint8Array(12)), key, rawKey, wrapped = null, wrapped2 = null;
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    return crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt'])   /* 128-bit: a shorter link → a lighter barcode */
      .then(function (k) { key = k; return crypto.subtle.exportKey('raw', k); }).then(function (r) { rawKey = K.b64u(r); return K.wrap(rawKey, q.patient, q.phone); })
      .then(function (w) { wrapped = w; return K.wrap2(rawKey, q.phone); })
      .then(function (w2) { wrapped2 = w2; var dk = q.doctor ? dkAll()[q.doctor] : null; return dk ? K.wrapRaw(rawKey, dk) : null; })
      .then(function (dw) { q.dwrap = dw; return q.file.arrayBuffer(); })
      .then(function (buf) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, buf); })
      .then(function (ct) {
        var blob = new Blob([iv, ct], { type: 'application/octet-stream' }), meta = { patient: q.patient, phone: q.phone, exam: String(q.exam || '').trim(), name: q.name, pages: q.pages, kind: q.kind === 'dicom' ? 'dicom' : 'pdf', wrap: wrapped, wrap2: wrapped2, doctor: +q.doctor || 0, dwrap: q.dwrap || null, follow: q.follow === '' || q.follow == null ? undefined : +q.follow };
        /* 5.20 · DICOM (PACS) cases never go to the server: only their details do; the images stay on this computer and reach the patient live */
        var local = meta.kind === 'dicom'; if (local) { meta.local = true; meta.size = blob.size; }
        return new Promise(function (ok, no) {
          var x = new XMLHttpRequest(); x.open('POST', BASE + '/case'); x.withCredentials = true;
          x.setRequestHeader('Content-Type', 'application/octet-stream');
          x.setRequestHeader('X-Meta', K.b64u(new TextEncoder().encode(JSON.stringify(meta))));
          x.upload.onprogress = function (e) { var b = $('pb' + q.id); if (b && e.lengthComputable) b.style.width = Math.max(4, Math.round(e.loaded / e.total * 100)) + '%'; };
          x.onload = function () { var j = {}; try { j = JSON.parse(x.responseText); } catch (e) {} if (x.status === 200 && j.item) ok({ item: j.item, blob: blob }); else no(new Error(j.message || 'محصلش — جرّب تاني')); };
          x.onerror = function () { no(new Error('النت فصل — جرّب تاني')); };
          x.send(local ? null : blob);
        });
      })
      .then(function (r) { return put({ token: r.item.token, code: C.code, key: rawKey, blob: r.blob, size: r.blob.size, thumb: q.thumb, name: q.name, at: Date.now() }).then(function () { return r; }); })
      .then(function (r) {
        ui.local[r.item.token] = { key: rawKey, size: r.blob.size, thumb: q.thumb };
        ui.list.unshift(r.item); q.st = 'done'; q.token = r.item.token; q.wrapped = !!(wrapped || wrapped2); q.file = null;
        if (q.dkey) { ui.upl[q.dkey] = r.item.token; hSet('upl:' + C.code, ui.upl); dirList(); }
        if (q.dkeys) { q.dkeys.forEach(function (k) { ui.upl[k] = r.item.token; }); hSet('upl:' + C.code, ui.upl); dirList(); }
        if (K.last10(q.phone) && ui.asks.some(function (a) { return K.last10(a.phone) === K.last10(q.phone); })) api('POST', 'ask', { phone: q.phone }).then(function (x) { ui.asks = x.asks || []; asks(); toast('✅ ' + q.patient + ' اتحفظت — وطلبه اتقفل'); }).catch(function () {});
        queue(); table(); stats(); disk();
        var open = ui.queue.filter(function (x) { return x.st !== 'gone' && x.st !== 'done'; }).length;
        if (!quiet && !open && ui.queue.filter(function (x) { return x.st === 'done'; }).length === 1) { showQr(r.item.token, true); setTimeout(function () { q.st = 'gone'; queue(); }, 400); }
        else toast('✅ ' + q.patient + ' اتحفظت' + (q.kind === 'dicom' ? ' — صور الـ DICOM على الكمبيوتر ده بس 🔒' : ''));
      })
      .catch(function (e) { q.st = 'err'; q.msg = e && e.message || 'محصلش'; paintQ(q); throw e; });
  }

  /* ── watching the print server's folder (Chrome / Edge) ── */
  function watchBar() {
    var el = $('wt'); if (!el) return;
    if (!ui.dir) { el.className = 'watch'; el.innerHTML = '<span class="wi">📂</span><div style="flex:1"><b>اربط فولدر سيرفر الطباعة أو الـ PACS</b><small>أي PDF أو ملفات DICOM جديدة تتحفظ في الفولدر ده (أو في فولدرات جواه) بتظهر هنا لوحدها — مش محتاج تسحبها.</small></div><button class="btn sm" id="wpk">📂 اختار الفولدر</button>'; $('wpk').onclick = pickDir; return; }
    if (ui.dirNeed) { el.className = 'watch'; el.innerHTML = '<span class="wi">⏸</span><div style="flex:1"><b>فولدر «' + esc(ui.dirName) + '»</b><small>المتصفح محتاج إذنك تاني عشان يكمّل يراقب الفولدر.</small></div><button class="btn sm" id="wgo">▶ كمّل المراقبة</button><button class="btn g sm" id="wx">فك الربط</button>'; $('wgo').onclick = function () { ui.dir.requestPermission({ mode: 'read' }).then(function (p) { if (p === 'granted') { ui.dirNeed = false; startWatch(); } }); }; $('wx').onclick = unlink; return; }
    el.className = 'watch on'; el.innerHTML = '<span class="wi">👀</span><div style="flex:1"><b>بيراقب فولدر «' + esc(ui.dirName) + '»</b><small id="wls">' + (ui.lastScan ? 'آخر فحص ' + new Date(ui.lastScan).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'بيبدأ…') + '</small></div><label><input type="checkbox" id="wau"' + (ui.auto ? ' checked' : '') + '> احفظ لوحده لو لقيت الاسم والموبايل في الملف</label><button class="btn g sm" id="wsc">↻ افحص دلوقتي</button><button class="btn g sm" id="wx">فك الربط</button>';
    el.insertAdjacentHTML('beforeend', '<div class="wf" id="wfl"></div>'); dirList();
    $('wau').onchange = function () { ui.auto = this.checked; hSet('auto:' + C.code, ui.auto); };
    $('wsc').onclick = function () { scan(); }; $('wx').onclick = unlink;
  }
  /* 5.17 · everything in the watched folder, newest first, with what happened to each file */
  function dirList() {
    var el = $('wfl'); if (!el) return; var all = (ui.dirFiles || []).slice().sort(function (a, b) { return b.f.lastModified - a.f.lastModified; });
    var inQ = {}; ui.queue.forEach(function (q) { if (q.dkey && q.st !== 'gone') inQ[q.dkey] = q.st; if (q.dkeys && (q.st !== 'gone' || q.kind === 'dicom' && q.st === 'pack')) q.dkeys.forEach(function (k) { if (q.st !== 'gone') inQ[k] = q.st; }); });
    /* DICOM: one row per folder (a study / CD export), not one per image */
    var G = {}, raw = all; all = [];
    raw.forEach(function (x) {
      if (x.kind !== 'dicom') { all.push(x); return; }
      var g = G[x.path]; if (!g) { g = G[x.path] = { kind: 'dicom', path: x.path, files: [], size: 0, lm: 0, key: 'dg:' + x.path }; all.push(g); }
      g.files.push(x); g.size += x.f.size; g.lm = Math.max(g.lm, x.f.lastModified);
    });
    all.forEach(function (x) { if (x.kind === 'dicom') { x.f = { name: (x.path || 'الفولدر الرئيسي'), size: x.size, lastModified: x.lm }; } });
    all.sort(function (a, b) { return b.f.lastModified - a.f.lastModified; });
    var td = ymd(), f = ui.dirF || 'today', qv = (ui.dirQ || '').toLowerCase();
    var isToday = function (x) { return ymd(new Date(x.f.lastModified)) === td; };
    var nT = all.filter(isToday).length, L = all.filter(function (x) { return (f === 'all' || isToday(x)) && (!qv || x.f.name.toLowerCase().indexOf(qv) > -1); });
    var nNew = all.filter(function (x) { if (x.kind === 'dicom') return x.files.some(function (y) { return !ui.upl[y.key] && !inQ[y.key]; }); return !ui.upl[x.key] && !inQ[x.key] && !ui.list.some(function (r) { return r.name === x.f.name; }); }).length, show = L.slice(0, ui.dirMore ? 400 : 30);
    var names = {}; ui.list.forEach(function (r) { if (r.name) names[r.name] = 1; });
    var stOf = function (x) {
      if (x.kind === 'dicom') { var up = x.files.filter(function (y) { return ui.upl[y.key]; }).length, iq = (x.files.filter(function (y) { return inQ[y.key]; })[0] || {}).key;
        if (up === x.files.length) return '<span class="lx-st2 on">✓ اترفعت</span>'; if (iq) return '<span class="lx-st2 nw">' + (inQ[iq] === 'pack' ? '⏳ بنضغطها…' : '⏳ في الطابور') + '</span>';
        return '<button type="button" class="btn sm" data-wd="' + esc(x.key) + '">🩻 ارفع' + (up ? ' الباقي (' + (x.files.length - up) + ')' : '') + '</button>'; }
      if (ui.upl[x.key] || names[x.f.name]) return '<span class="lx-st2 on">✓ اترفعت</span>'; var q = inQ[x.key]; if (q === 'done') return '<span class="lx-st2 on">✓ اترفعت</span>'; if (q) return '<span class="lx-st2 nw">⏳ في الطابور</span>'; return '<button type="button" class="btn sm" data-wf="' + esc(x.key) + '">⇧ ارفع</button>'; };
    el.innerHTML = '<div class="wf-h"><b>📁 ملفات الفولدر <small>PDF و DICOM</small></b><span class="wf-n">' + all.length + ' ملف · ' + nT + ' النهارده' + (nNew ? ' · <em>' + nNew + ' لسه مترفعتش</em>' : '') + '</span>' +
      '<div class="lx-seg"><button type="button" data-wff="today" class="' + (f === 'today' ? 'on' : '') + '">النهارده</button><button type="button" data-wff="all" class="' + (f === 'all' ? 'on' : '') + '">الكل</button></div>' +
      '<label class="qx-s wf-s">' + ic('search') + '<input type="search" id="wfq" placeholder="اسم الملف" value="' + esc(ui.dirQ || '') + '"></label></div>' +
      (show.length ? '<div class="lx-tw"><table class="lx-t wf-t"><thead><tr><th>الملف</th><th>الحجم</th><th>اتحفظ في الفولدر</th><th></th></tr></thead><tbody>' + show.map(function (x) {
        return '<tr><td><div class="lx-pt">' + (x.kind === 'dicom' ? '<span class="wf-ic dc">DICOM</span><b title="' + esc(x.f.name) + '">' + esc(x.f.name) + '</b><span class="wf-c">' + x.files.length + ' صورة</span>' : '<span class="wf-ic">PDF</span><b title="' + esc(x.f.name) + '">' + esc(x.f.name) + '</b>') + '</div></td><td class="mut">' + mb(x.f.size) + '</td><td class="mut">' + when(ymd(new Date(x.f.lastModified)) + ' ' + ('0' + new Date(x.f.lastModified).getHours()).slice(-2) + ':' + ('0' + new Date(x.f.lastModified).getMinutes()).slice(-2)) + '</td><td class="lx-acts">' + stOf(x) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (L.length > show.length ? '<button type="button" class="btn g sm wf-more" id="wfm">اعرض كله (' + L.length + ')</button>' : '')
        : '<p class="lx-emp">' + (all.length ? 'مفيش ملفات ' + (f === 'today' ? 'النهارده — دوس «الكل»' : 'بالاسم ده') : 'الفولدر فاضي — أول ما سيرفر الطباعة يحفظ PDF هيظهر هنا') + '</p>');
    [].forEach.call(el.querySelectorAll('[data-wff]'), function (b) { b.onclick = function () { ui.dirF = b.dataset.wff; dirList(); }; });
    var qi = $('wfq'); if (qi) qi.oninput = function () { ui.dirQ = qi.value; var pos = qi.selectionStart; dirList(); var n = $('wfq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } };
    var mo = $('wfm'); if (mo) mo.onclick = function () { ui.dirMore = true; dirList(); };
    [].forEach.call(el.querySelectorAll('[data-wd]'), function (b) { b.onclick = function () { var g = all.filter(function (y) { return y.key === b.dataset.wd; })[0]; if (!g) return;
      var L = g.files.filter(function (y) { return !ui.upl[y.key]; }); L.forEach(function (y) { ui.seen[y.key] = 1; });
      addDicom(L.map(function (y) { return y.f; }), L.map(function (y) { return y.key; })); dirList(); var qu = $('qu'); if (qu) qu.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
    [].forEach.call(el.querySelectorAll('[data-wf]'), function (b) { b.onclick = function () { var x = all.filter(function (y) { return y.key === b.dataset.wf; })[0]; if (!x) return; add([x.f], true); dirList(); var qu = $('qu'); if (qu) qu.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
  }
  function unlink() { clearInterval(ui.watchT); ui.dir = null; ui.dirFiles = []; ui.dirNeed = false; hSet('dir:' + C.code, undefined); watchBar(); toast('اتفك ربط الفولدر'); }
  function pickDir() {
    window.showDirectoryPicker({ mode: 'read', id: 'ozx-print' }).then(function (h) {
      ui.dir = h; ui.dirName = h.name; ui.dirNeed = false; hSet('dir:' + C.code, h);
      return listDir(h).then(function (all) { all.forEach(function (x) { ui.seen[x.key] = 1; }); hSet('seen:' + C.code, Object.keys(ui.seen).slice(-3000)); ui.dirFiles = all; var nd = all.filter(function (x) { return x.kind === 'dicom'; }).length; toast('👀 بيراقب «' + h.name + '» — فيه ' + (all.length - nd) + ' PDF' + (nd ? ' و ' + nd + ' صورة DICOM' : '') + ' ظاهرين تحت، وأي ملف جديد هيدخل لوحده'); startWatch(); });
    }).catch(function (e) { if (e && e.name !== 'AbortError') toast('مش قادر أفتح الفولدر'); });
  }
  /* 5.19 · PDFs and DICOM (also inside sub-folders, like a PACS / CD export) */
  function isDcmName(n) { return /\.(dcm|dicom|dic|ima|dc3)$/i.test(n); }
  async function dcmMagic(f) { try { var b = new Uint8Array(await f.slice(128, 132).arrayBuffer()); return b[0] === 68 && b[1] === 73 && b[2] === 67 && b[3] === 77; } catch (e) { return false; } }
  function listDir(h) {
    var out = [], chk = ui.dcmChk = ui.dcmChk || {};
    async function walk(d, path, depth) {
      for await (var ent of d.values()) {
        if (out.length >= 4000) return;
        if (ent.kind === 'directory') { if (depth < 4 && !/^\./.test(ent.name)) await walk(ent, path ? path + '/' + ent.name : ent.name, depth + 1); continue; }
        if (ent.kind !== 'file' || /^\./.test(ent.name) || /^DICOMDIR$/i.test(ent.name)) continue;
        var pdf = /\.pdf$/i.test(ent.name), dcm = !pdf && isDcmName(ent.name), maybe = !pdf && !dcm && maybeDicom({ name: ent.name, size: 1000 });
        if (!pdf && !dcm && !maybe) continue;
        try {
          var f = await ent.getFile(), key = (path ? path + '/' : '') + f.name + '|' + f.size + '|' + f.lastModified;
          if (maybe) { if (chk[key] == null) chk[key] = f.size > 200 && await dcmMagic(f); if (!chk[key]) continue; }
          out.push({ f: f, key: key, kind: pdf ? 'pdf' : 'dicom', path: path || '' });
        } catch (e) {}
      }
    }
    return walk(h, '', 0).then(function () { return out; });
  }
  document.addEventListener('visibilitychange', function qrdScanVis() { if (!document.hidden && ui.watchT) scan(); });
  function startWatch() { clearInterval(ui.watchT); watchBar(); scan(); ui.watchT = setInterval(scan, 5000); }
  function scan() {
    /* 5.27 · the folder is only walked while this tab is on screen (a hidden tab catches up the moment it's back) */
    if (!ui.dir || ui.dirNeed || scan.busy || document.hidden) return; scan.busy = true;
    listDir(ui.dir).then(function (all) {
      var fresh = [], dnew = [];
      all.forEach(function (x) {
        if (ui.seen[x.key]) return;
        if (x.kind === 'dicom') { dnew.push(x); return; }
        var p = ui.pend[x.f.name], age = Date.now() - x.f.lastModified;   /* wait until the print server finished writing it (same size twice, or untouched for 5 s) */
        if (age < 5000 && (!p || p !== x.f.size)) { ui.pend[x.f.name] = x.f.size; return; }
        delete ui.pend[x.f.name]; ui.seen[x.key] = 1; fresh.push(x.f);
      });
      if (fresh.length) { hSet('seen:' + C.code, Object.keys(ui.seen).slice(-3000)); add(fresh, true); }
      if (dnew.length) {
        var sig = dnew.map(function (x) { return x.key; }).join(';');
        if (ui.dPend !== sig) { ui.dPend = sig; ui.dPendT = Date.now(); }
        else if (Date.now() - ui.dPendT > 8000 && dnew.every(function (x) { return Date.now() - x.f.lastModified > 5000; })) {
          dnew.forEach(function (x) { ui.seen[x.key] = 1; }); hSet('seen:' + C.code, Object.keys(ui.seen).slice(-6000)); ui.dPend = '';
          addDicom(dnew.map(function (x) { return x.f; }), dnew.map(function (x) { return x.key; })); beep(); toast('🩻 ' + dnew.length + ' ملف DICOM جديد من الفولدر — بنضغطهم');
        }
      }
      ui.dirFiles = all; dirList();
      ui.lastScan = Date.now(); var w = $('wls'); if (w) w.textContent = 'آخر فحص ' + new Date(ui.lastScan).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    }).catch(function (e) { if (e && e.name === 'NotAllowedError') { ui.dirNeed = true; clearInterval(ui.watchT); watchBar(); } }).then(function () { scan.busy = false; });
  }
  function bootWatch() {
    if (!('showDirectoryPicker' in window)) return;
    Promise.all([hGet('dir:' + C.code), hGet('seen:' + C.code), hGet('auto:' + C.code), hGet('upl:' + C.code)]).then(function (a) {
      (a[1] || []).forEach(function (k) { ui.seen[k] = 1; }); ui.auto = !!a[2]; ui.upl = a[3] || {};
      var h = a[0]; if (!h) return watchBar();
      ui.dir = h; ui.dirName = h.name;
      h.queryPermission({ mode: 'read' }).then(function (p) { if (p === 'granted') startWatch(); else { ui.dirNeed = true; watchBar(); } }).catch(function () { ui.dirNeed = true; watchBar(); });
    });
  }

  /* Complaint and report inboxes; uploaded photos are only served to an authenticated center. */
  /* ════ 5.13 · one compact, searchable list style for every request section ════ */
  function qxHue(t) { var h = 0; String(t || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; }
  function qxAv(name) { return '<span class="qx-av" style="--h:' + qxHue(name) + '">' + esc(String(name || '؟').trim().charAt(0)) + '</span>'; }
  function qxShell(key, cols, rows, empty, countLabel) {
    return '<section class="qx" data-qx="' + key + '"><div class="qx-bar"><label class="qx-s">' + ic('search') + '<input type="search" placeholder="ابحث بالاسم أو الموبايل أو التفاصيل" data-qx-q></label>' +
      '<span class="qx-n" data-qx-n>' + rows.length + ' ' + countLabel + '</span></div>' +
      (rows.length ? '<div class="qx-h">' + cols.map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div><div class="qx-list">' + rows.join('') + '</div><p class="qx-none" hidden>مفيش نتايج للبحث ده</p>' +
        '<div class="lx-pg qx-pg" hidden><span data-qx-r></span><div><button type="button" class="btn g sm" data-qx-p="-1">→ السابق</button><b data-qx-pn></b><button type="button" class="btn g sm" data-qx-p="1">التالي ←</button></div></div>'
        : '<div class="qx-empty"><span>✅</span><b>' + empty + '</b><small>أول ما يوصل طلب جديد هيظهر هنا لحظيًا</small></div>') + '</section>';
  }
  /* 5.15 · search + 12 rows per page; a row's details open on click */
  function qxWire(el, countLabel) {
    el.classList.remove('qrd-data-pending');
    var q = el.querySelector('[data-qx-q]'); if (!q) return;
    var PER = 12, pg = 0, R = [].slice.call(el.querySelectorAll('.qx-r'));
    function apply() {
      var v = q.value.trim().toLowerCase(), M = R.filter(function (r) { return !v || r.textContent.toLowerCase().indexOf(v) > -1; }), pages = Math.max(1, Math.ceil(M.length / PER));
      pg = Math.max(0, Math.min(pg, pages - 1));
      R.forEach(function (r) { r.hidden = true; }); M.slice(pg * PER, pg * PER + PER).forEach(function (r) { r.hidden = false; });
      var c = el.querySelector('[data-qx-n]'); if (c) c.textContent = M.length + ' ' + countLabel; var none = el.querySelector('.qx-none'); if (none) none.hidden = !!M.length;
      var bar = el.querySelector('.qx-pg'); if (!bar) return; bar.hidden = M.length <= PER;
      bar.querySelector('[data-qx-r]').textContent = 'عرض ' + (M.length ? pg * PER + 1 : 0) + '–' + Math.min(M.length, pg * PER + PER) + ' من ' + M.length;
      bar.querySelector('[data-qx-pn]').textContent = (pg + 1) + ' / ' + pages;
      bar.querySelector('[data-qx-p="-1"]').disabled = !pg; bar.querySelector('[data-qx-p="1"]').disabled = pg >= pages - 1;
    }
    q.oninput = function () { pg = 0; apply(); };
    [].forEach.call(el.querySelectorAll('[data-qx-p]'), function (b) { b.onclick = function () { pg += +b.dataset.qxP; apply(); }; });
    [].forEach.call(el.querySelectorAll('.qx-note'), function (x) { x.onclick = function () { x.classList.toggle('open'); }; });
    apply();
  }
  function serviceTickets() {
    var rows = ui.tickets || [];
    function paint(kind, target, emptyText) {
      var el = $(target); if (!el) return;
      var L = rows.filter(function (x) { return x.kind === kind; });
      updateNavCount(kind === 'complaint' ? 'complaints' : 'reports', L.length);
      var R = L.map(function (t, i) {
        var imgs = (t.files || []).map(function (file) {
          var u = BASE + '/ticket-image/' + Number(t.id) + '?i=' + Number(file.index);
          return '<a class="qx-ph" target="_blank" rel="noopener noreferrer" href="' + u + '" title="' + esc(file.name || 'صورة') + '"><img loading="lazy" src="' + u + '" alt="" referrerpolicy="no-referrer"></a>';
        }).join('');
        return '<article class="qx-r" data-ticket="' + Number(t.id) + '" style="--i:' + Math.min(i, 12) + '">' + qxAv(t.name) +
          '<div class="qx-who"><b>' + esc(t.name) + '</b><a class="n" href="tel:' + esc(t.phone) + '">' + esc(t.phone) + '</a></div>' +
          '<div class="qx-what"><span class="qx-tag ' + (kind === 'complaint' ? 'r' : 'a') + '">' + esc(t.subject || (kind === 'complaint' ? 'شكوى' : 'طلب تقرير')) + '</span></div>' +
          '<div class="qx-note" title="اضغط لعرض الكلام كله"><p>' + esc(t.message) + '</p>' + (imgs ? '<div class="qx-phs">' + imgs + '</div>' : '') + '</div>' +
          '<time class="qx-t">' + esc(when(t.at)) + '</time>' +
          '<div class="qx-act"><a class="ic2" href="tel:' + esc(t.phone) + '" data-tip="اتصال">' + ic('phone') + '</a><button type="button" class="btn sm g" data-ticket-done="' + Number(t.id) + '">✓ تم التواصل</button>' +
          (kind === 'complaint' ? '<button type="button" class="ic2 dl" data-ticket-del="' + Number(t.id) + '" data-n="' + esc(t.name) + '" data-tip="امسح (بكلمة سر)">' + ic('trash') + '</button>' : '') + '</div></article>';
      });
      el.innerHTML = qxShell(kind, ['المريض', kind === 'complaint' ? 'عنوان الشكوى' : 'الطلب', 'التفاصيل', 'وصلت', ''], R, emptyText, kind === 'complaint' ? 'شكوى' : 'طلب');
      qxWire(el, kind === 'complaint' ? 'شكوى' : 'طلب');
      if (kind === 'complaint') {
        el.insertAdjacentHTML('afterbegin', '<div class="cx-tools"><div><b>📊 تحليل الشكاوى</b><small>تقرير PDF لكل الشكاوى اللي حصلت — الجديدة واللي اتحلّت: الأسباب، الأيام والأوقات، وقت الرد، والمرضى اللي اشتكوا أكتر من مرة</small></div>' +
          '<button type="button" class="btn" data-cx="pdf">' + ic('down') + ' نزّل التحليل PDF</button><button type="button" class="btn g red-t" data-cx="reset">' + ic('trash') + ' مسح كل الشكاوى</button></div>');
        el.querySelector('[data-cx="pdf"]').onclick = function () { complaintsReport(this); };
        el.querySelector('[data-cx="reset"]').onclick = ticketReset;
        [].forEach.call(el.querySelectorAll('[data-ticket-del]'), function (b) { b.onclick = function () { ticketDelete(+b.dataset.ticketDel, b.dataset.n); }; });
      }
      [].forEach.call(el.querySelectorAll('[data-ticket-done]'), function (btn) {
        btn.onclick = function () {
          var id = Number(btn.dataset.ticketDone); btn.disabled = true;
          api('POST', 'tickets/' + id + '/done').then(function (j) { ui.tickets = j.tickets || []; serviceTickets(); toast('✅ تم تسجيل التواصل مع المريض'); })
            .catch(function (err) { btn.disabled = false; toast(err.message || 'حصلت مشكلة'); });
        };
      });
    }
    paint('complaint', 'complaints', 'مفيش شكاوى جديدة');
    paint('report', 'reportRequests', 'مفيش طلبات تقرير جديدة');
  }

  /* Radiology appointment requests: received instantly and confirmed offline by reception. */
  function bookings() {
    var el = $('bookings'); if (!el) return;
    var L = ui.bookings || [];
    updateNavCount('bookings', L.length);
    var R = L.map(function (r, i) {
      return '<div class="qx-r" data-book="' + r.id + '" style="--i:' + Math.min(i, 12) + '">' + qxAv(r.name) +
        '<div class="qx-who"><b>' + esc(r.name) + '</b><a class="n" href="tel:' + esc(r.phone) + '">' + esc(r.phone) + '</a></div>' +
        '<div class="qx-what"><span class="qx-tag">' + esc(r.exam) + '</span><small>📅 ' + esc(r.day) + ' · ' + esc(r.slot) + '</small></div>' +
        '<div class="qx-note">' + (r.note ? '<p>' + esc(r.note) + '</p>' : '<p class="mut">—</p>') + '</div>' +
        '<time class="qx-t">' + esc(when(r.at)) + '</time>' +
        '<div class="qx-act"><a class="ic2" href="tel:' + esc(r.phone) + '" data-tip="اتصال">' + ic('phone') + '</a><button class="btn sm g" data-b="done">✓ تم التواصل</button></div></div>';
    });
    el.innerHTML = qxShell('book', ['المريض', 'الفحص والموعد', 'ملاحظات', 'وصل', ''], R, 'مفيش طلبات حجز جديدة', 'طلب حجز');
    qxWire(el, 'طلب حجز');
    [].forEach.call(el.querySelectorAll('[data-b="done"]'), function (b) {
      b.onclick = function () {
        var id = +b.closest('[data-book]').dataset.book; b.disabled = true;
        api('POST', 'bookings/' + id + '/done').then(function (x) { ui.bookings = x.bookings || []; bookings(); toast('✅ اتسجل إن المركز تواصل مع المريض'); })
          .catch(function (e) { b.disabled = false; toast(e.message); });
      };
    });
  }
  /* ── 4.92 · patients who didn't find their result and asked on WhatsApp ── */
  function asks() {
    var el = $('asks'); if (!el) return; var L = ui.asks || [];
    updateNavCount('results', L.length);
    var R = L.map(function (a, i) {
      return '<div class="qx-r ar' + (ui.newAsk && K.last10(a.phone) === ui.newAsk ? ' new' : '') + '" data-id="' + a.id + '" style="--i:' + Math.min(i, 12) + '">' + qxAv(a.name) +
        '<div class="qx-who"><b>' + esc(a.name) + '</b><a class="n" href="tel:' + esc(a.phone) + '">' + esc(a.phone) + '</a></div>' +
        '<div class="qx-what"><span class="qx-tag a">طلب نتيجة</span></div>' +
        '<div class="qx-note">' + (a.note ? '<p>' + esc(a.note) + '</p>' : '<p class="mut">—</p>') + '</div>' +
        '<time class="qx-t">' + when(a.at) + '</time>' +
        '<div class="qx-act"><button class="btn sm" data-k="up">📂 ارفع حالته</button><button class="ic2 wa" data-k="wa" data-tip="واتساب">' + ic('wa') + '</button><button class="ic2" data-k="ok" data-tip="خلصت">' + ic('check') + '</button></div></div>';
    });
    el.innerHTML = qxShell('ask', ['المريض', 'النوع', 'تفاصيل الطلب', 'وصل', ''], R, 'مفيش طلبات نتيجة معلّقة', 'طلب');
    qxWire(el, 'طلب');
    if (!L.length) return;
    ui.newAsk = null;
    [].forEach.call(el.querySelectorAll('[data-k]'), function (b) {
      b.onclick = function () {
        var id = +b.closest('.ar').dataset.id, a = L.filter(function (x) { return x.id === id; })[0]; if (!a) return; var k = b.dataset.k;
        if (k === 'up') {
          ui.prefill = { patient: a.name === 'مريض' ? '' : a.name, phone: a.phone };
          clearTimeout(ui.pfT);
          ui.pfT = setTimeout(function () { ui.prefill = null; }, 120000);
          if (isIOSBrowser()) {
            try { sessionStorage.setItem('qrd-upload-prefill', JSON.stringify(ui.prefill)); } catch (e) {}
            navigatePage('upload', true);
          } else {
            navigatePage('upload', true); $('fi').click();
          }
        }
        if (k === 'wa') { var ph = phoneWa(a.phone); if (ph) window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent('أهلاً ' + a.name + ' 🌿\nطلبك وصل ' + C.center + '، وبنجهّز نتيجتك وهنبعتهالك حالاً 🙏'), '_blank'); }
        if (k === 'ok') api('POST', 'ask/' + id + '/done').then(function (x) { ui.asks = x.asks || []; asks(); }).catch(function (e) { toast(e.message); });
      };
    });
  }

  /* ════════ 5.15 · admin look (Laravel/Filament style): honest numbers, stat widgets, data tables, ads ════════ */
  /* 5.20 · the center reads its own PACS cases from this computer — nothing is downloaded */
  function pacsBuf(tok) {
    return localGet(tok).then(function (rec) {
      if (!rec || !rec.blob) throw new Error('الحالة مش موجودة على الكمبيوتر ده');
      return Promise.all([rec.blob.arrayBuffer(), crypto.subtle.importKey('raw', K.unb64u(rec.key), { name: 'AES-GCM' }, false, ['decrypt'])]);
    }).then(function (x) { var all = new Uint8Array(x[0]); return crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, x[1], all.slice(12)); });
  }
  /* 5.21 · the center's PACS: one study, or two side by side (same patient first) with linked slices and window */
  function openPacs(tok) {
    var r = itemOf(tok); if (!r || !window.OZPacs) return;
    var host = document.createElement('div'); host.className = 'pz-modal'; host.innerHTML = '<div class="pz-split" id="pzSplit"><div class="pz-pane" id="pzP1"><div class="pz-load"><span></span><b>بنفتح الصور من الكمبيوتر…</b></div></div></div>';
    document.body.appendChild(host); document.body.style.overflow = 'hidden';
    var v1 = null, v2 = null, link = { on: true }, nm = function (x) { return String(x.patient || 'صورة').replace(/[\\/:*?"<>|]+/g, ' '); };
    var close = function () { [v1, v2].forEach(function (v) { if (v && v.destroy) v.destroy(); }); host.remove(); document.body.style.overflow = ''; if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); };
    var closeSecond = function () { if (v2 && v2.destroy) v2.destroy(); v2 = null; var p2 = $('pzP2'), lb = host.querySelector('.pz-link'); if (p2) p2.remove(); if (lb) lb.remove(); host.classList.remove('two'); if (v1) setTimeout(v1.resize, 30); };
    var pick = function () {
      var me = K.last10(r.phone), L = ui.list.filter(function (x) { return x.kind === 'dicom' && x.token !== tok && ui.local[x.token]; });
      L.sort(function (a, b) { var sa = (me && K.last10(a.phone) === me) || a.patient === r.patient ? 0 : 1, sb = (me && K.last10(b.phone) === me) || b.patient === r.patient ? 0 : 1; return sa - sb || String(b.at).localeCompare(String(a.at)); });
      if (!L.length) return toast('مفيش حالة DICOM تانية على الكمبيوتر ده للمقارنة');
      var o = modal('<h3>⇆ قارن بدراسة تانية</h3><p>الحالات بتاعة نفس المريض فوق</p><div class="pz-pick">' + L.slice(0, 40).map(function (x) {
        var same = (me && K.last10(x.phone) === me) || x.patient === r.patient;
        return '<button type="button" data-x="pk" data-tok="' + x.token + '"><b>' + esc(x.patient) + (same ? ' <span class="lx-st2 on">نفس المريض</span>' : '') + '</b><small>' + esc(x.exam || 'DICOM') + ' · ' + dmyOf(x.at) + ' · ' + (x.pages || 0) + ' صورة</small></button>';
      }).join('') + '</div><button class="btn g w" data-x="cl" style="margin-top:10px">إلغاء</button>', function (k, cl, btn) {
        if (k !== 'pk') return; cl(); var t2 = btn.dataset.tok, r2 = itemOf(t2); closeSecond();
        host.classList.add('two'); $('pzSplit').insertAdjacentHTML('beforeend', '<div class="pz-pane" id="pzP2"><div class="pz-load"><span></span><b>بنفتح الدراسة التانية…</b></div></div>');
        host.insertAdjacentHTML('beforeend', '<button type="button" class="pz-link on" aria-pressed="true" title="مزامنة الشرايح والتباين بين الدراستين" aria-label="مزامنة الشرايح والتباين">🔗</button>');
        var lb = host.querySelector('.pz-link'); lb.onclick = function () { link.on = !link.on; lb.classList.toggle('on', link.on); lb.setAttribute('aria-pressed', String(link.on)); };
        if (v1) setTimeout(v1.resize, 30);
        pacsBuf(t2).then(function (buf) { var p2 = $('pzP2'); if (!p2) return; p2.innerHTML = ''; v2 = OZPacs.viewer(p2, buf, { name: nm(r2), onClose: closeSecond, noFocus: true, onChange: function (st) { if (link.on && v1) v1.set(st); } }); })
          .catch(function (e) { closeSecond(); toast(e.message || 'مش قادر أفتح الدراسة التانية'); });
      });
    };
    pacsBuf(tok).then(function (plain) { var p1 = $('pzP1'); p1.innerHTML = ''; v1 = OZPacs.viewer(p1, plain, { name: nm(r), onClose: close, onCompare: pick, onChange: function (st) { if (link.on && v2) v2.set(st); } }); })
      .catch(function (e) { close(); toast(e.message || 'مش قادر أفتح الحالة'); });
  }
  function dicomOffServer() {
    var L = ui.list.filter(function (r) { return r.kind === 'dicom' && r.cached && ui.local[r.token]; }), n = 0; if (!L.length) return;
    (function nx(i) {
      if (i >= L.length) { if (n) { toast('🔒 ' + n + ' حالة DICOM اتشالت من السيرفر — صورها على الكمبيوتر ده بس'); table(); } return; }
      api('POST', 'item/' + L[i].token + '/uncache').then(function () { L[i].cached = false; L[i].local = true; n++; }).catch(function () {}).then(function () { nx(i + 1); });
    })(0);
  }
  function dashSoon() { clearTimeout(ui.dashT); ui.dashT = setTimeout(function () { api('GET', 'dash').then(function (x) { ui.dash = x.dash || ui.dash; dashX(); dHome(); }).catch(function () {}); }, 700); }
  function pct(a, b) { return b ? Math.round((a - b) / b * 100) : 0; }
  function lxSpark(arr, c) {
    if (!arr || arr.filter(function (v) { return v; }).length < 2) return '';
    var mx = Math.max.apply(null, arr.concat([1])), n = arr.length, P = arr.map(function (v, i) { return [(i / (n - 1 || 1) * 120).toFixed(1), (34 - v / mx * 28).toFixed(1)]; });
    var d = 'M' + P.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
    return '<svg class="lx-sp" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + ' L120 36 L0 36Z" fill="' + c + '" opacity=".12"/><path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
  }
  function lxStat(o) {
    return '<div class="lx-st" style="--c:' + o.c + '"><div class="lx-st-h"><span class="lx-st-l">' + o.l + '</span><span class="lx-st-i">' + ic(o.i) + '</span></div>' +
      '<b class="lx-st-v">' + n0(o.v) + '</b><p class="lx-st-d ' + (o.tone || '') + '">' + (o.ti ? ic(o.ti) : '') + '<span>' + o.d + '</span></p>' + (o.sp ? lxSpark(o.sp, o.c) : '') + '</div>';
  }
  function casesPerDay() {
    var out = [], i, m = {}; ui.list.forEach(function (r) { var d = String(r.at || '').slice(0, 10); m[d] = (m[d] || 0) + 1; });
    for (i = 13; i >= 0; i--) out.push(m[ymd(new Date(Date.now() - i * 864e5))] || 0); return out;
  }
  var DAYW = ['أحد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة', 'سبت'];
  function lxChart(D, forced) {
    var mode = forced || ui.lxMode || 'today'; if (mode === 'days') mode = '30'; var cols = [], xl = [], mx = 1, i;
    if (mode === 'today') {
      for (i = 0; i < 24; i++) { cols.push([D.hours[i] || 0]); mx = Math.max(mx, D.hours[i] || 0); }
      xl = ['12ص', '3ص', '6ص', '9ص', '12م', '3م', '6م', '9م'];
    } else {
      var DD = D.days.slice(mode === '7' ? -7 : -30);
      DD.forEach(function (d) { cols.push([d.qr, d.views]); mx = Math.max(mx, d.qr, d.views); });
      D = { days: DD, hours: D.hours };
    }
    var step = Math.max(1, Math.ceil(mx / 4)), top = step * 4, now = new Date().getHours();
    var grid = [4, 3, 2, 1, 0].map(function (k) { return '<div class="lx-gl" style="bottom:' + (k * 25) + '%"><span>' + n0(step * k) + '</span></div>'; }).join('');
    var bars = cols.map(function (c, j) {
      var tip = mode === 'today' ? (((j % 12) || 12) + (j < 12 ? ' ص' : ' م') + ' — ' + c[0] + ' مسح') : (function () { var d = D.days[j], dt = new Date(d.day + 'T12:00:00'); return DAYW[dt.getDay()] + ' ' + (+d.day.slice(8)) + '/' + (+d.day.slice(5, 7)) + ' — باركود ' + d.qr + ' · نتائج ' + d.views; })();
      return '<div class="lx-col' + (mode === 'today' && j === now ? ' now' : '') + '" data-tip="' + esc(tip) + '">' + c.map(function (v, k) { return '<i class="s' + k + '" style="height:' + (v ? Math.max(3, v / top * 100) : 0) + '%"></i>'; }).join('') + '</div>';
    }).join('');
    if (mode !== 'today') xl = D.days.map(function (d, j) { return (D.days.length > 10 ? j % 3 : 0) ? '' : (+d.day.slice(8)) + '/' + (+d.day.slice(5, 7)); });
    return '<div class="lx-ch-plot"><div class="lx-grid">' + grid + '</div><div class="lx-bars m-' + mode + '">' + bars + '</div></div>' +
      '<div class="lx-xl m-' + mode + '">' + xl.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>';
  }
  /* 5.18 · chart style chosen in Settings: «خط» (stock-style trend) or «أعمدة» */
  function chartStyle() { try { return localStorage.getItem('qrd-chart') === 'bars' ? 'bars' : 'line'; } catch (e) { return 'line'; } }
  function modeSeg(mode, attr) { return '<div class="lx-seg" role="group">' + [['today', 'النهارده'], ['7', '7 أيام'], ['30', '30 يوم']].map(function (m) { return '<button type="button" ' + attr + '="' + m[0] + '" class="' + (mode === m[0] ? 'on' : '') + '">' + m[1] + '</button>'; }).join('') + '</div>'; }
  function smooth(P) {
    if (P.length < 2) return P.length ? 'M' + P[0][0] + ' ' + P[0][1] : '';
    var d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2, t = 0.18;
      d += ' C' + (p1[0] + (p2[0] - p0[0]) * t).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) * t).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) * t).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) * t).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function trendChart(D, mode, small) {
    var vals, labs, tips, now = new Date().getHours(), i;
    if (mode === 'today') { vals = D.hours.slice(0, now + 1); labs = ['12ص', '', 'دلوقتي']; tips = vals.map(function (v, h) { return ((h % 12) || 12) + (h < 12 ? ' ص' : ' م') + ' — ' + v + ' مسح'; }); }
    else { var DD = D.days.slice(mode === '7' ? -7 : -30); vals = DD.map(function (d) { return d.qr; }); var f = function (d) { return (+d.day.slice(8)) + '/' + (+d.day.slice(5, 7)); };
      labs = [f(DD[0]), f(DD[Math.floor(DD.length / 2)]), 'النهارده']; tips = DD.map(function (d) { var dt = new Date(d.day + 'T12:00:00'); return DAYW[dt.getDay()] + ' ' + f(d) + ' — ' + d.qr + ' مسح'; }); }
    var total = vals.reduce(function (a, b) { return a + b; }, 0), n = vals.length;
    var half = Math.floor(n / 2), a = vals.slice(0, half).reduce(function (x, y) { return x + y; }, 0), b = vals.slice(n - half).reduce(function (x, y) { return x + y; }, 0);
    var ch = mode === 'today' ? pct(D.qr.today, D.qr.yday) : pct(b, a), show = mode === 'today' ? !!D.qr.yday : !!a;
    var W = 600, H = 170, top = 14, bot = 18, mx = Math.max.apply(null, vals.concat([1])) * 1.15;
    var P = vals.map(function (v, k) { return [n > 1 ? k / (n - 1) * W : W / 2, top + (1 - v / mx) * (H - top - bot)]; });
    var solidEnd = mode === 'today' ? P.length : Math.max(1, P.length - 1), S = P.slice(0, solidEnd), last = P[P.length - 1];
    var lineD = smooth(S), area = lineD ? lineD + ' L' + S[S.length - 1][0].toFixed(1) + ' ' + H + ' L' + S[0][0].toFixed(1) + ' ' + H + 'Z' : '';
    var dash = mode !== 'today' && P.length > 1 ? 'M' + S[S.length - 1][0].toFixed(1) + ' ' + S[S.length - 1][1].toFixed(1) + ' L' + last[0].toFixed(1) + ' ' + last[1].toFixed(1) : '';
    var gid = 'tg' + (++trendChart.n || (trendChart.n = 1));
    var hov = '<div class="tc-hov">' + vals.map(function (v, k) { return '<i data-tip="' + esc(tips[k]) + '"></i>'; }).join('') + '</div>';
    return '<div class="tc' + (small ? ' sm' : '') + '"><div class="tc-hd"><b>' + n0(total) + '</b><p><span>' + (mode === 'today' ? 'مسح النهارده' : n0(D.qr.today) + ' النهارده') + '</span>' +
        (show ? '<em class="' + (ch >= 0 ? 'up' : 'dn') + '">' + (ch >= 0 ? '↗ ' : '↘ ') + Math.abs(ch) + '%</em>' : '') + '</p></div>' +
      '<div class="tc-plot"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tc)" stop-opacity=".42"/><stop offset="1" stop-color="var(--tc)" stop-opacity="0"/></linearGradient></defs>' +
        (area ? '<path class="tc-a" d="' + area + '" fill="url(#' + gid + ')"/>' : '') + (lineD ? '<path class="tc-l" d="' + lineD + '" fill="none" stroke="var(--tc)" stroke-width="2.6" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>' : '') +
        (dash ? '<path d="' + dash + '" fill="none" stroke="var(--tc2)" stroke-width="2" stroke-dasharray="3 5" vector-effect="non-scaling-stroke" stroke-linecap="round"/>' : '') + '</svg>' +
        (last ? '<span class="tc-dot" style="left:' + (last[0] / W * 100) + '%;top:' + (last[1] / H * 100) + '%"></span>' : '') + hov + '</div>' +
      '<div class="tc-x"><span>' + labs[0] + '</span><span>' + labs[1] + '</span><span>' + labs[2] + '</span></div></div>';
  }
  function chartSettings() {
    var host = $('qrd-body-settings'); if (!host) return; var el = $('chSet');
    if (!el) { el = document.createElement('section'); el.id = 'chSet'; el.className = 'lx-card ch-set'; host.insertBefore(el, host.firstChild); }
    var st = chartStyle();
    el.innerHTML = '<div class="lx-ch"><div><h3>📈 شكل رسم مسح الباركود</h3><small>بيتطبّق على لوحة التحكم في الكمبيوتر والموبايل (على الجهاز ده)</small></div></div><div class="ch-opts">' +
      '<button type="button" data-chs="line" class="' + (st === 'line' ? 'on' : '') + '"><svg viewBox="0 0 120 50"><defs><linearGradient id="chp1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FB923C" stop-opacity=".5"/><stop offset="1" stop-color="#FB923C" stop-opacity="0"/></linearGradient></defs><path d="M0 34 C12 30 16 38 26 28 S44 22 54 30 S74 16 84 22 S100 10 110 12 L110 50 L0 50Z" fill="url(#chp1)"/><path d="M0 34 C12 30 16 38 26 28 S44 22 54 30 S74 16 84 22 S100 10 110 12" fill="none" stroke="#FB923C" stroke-width="2.4"/><path d="M110 12 L118 30" stroke="#FDBA74" stroke-width="2" stroke-dasharray="2 3"/><circle cx="118" cy="30" r="2.6" fill="#fff"/></svg><b>خط — زي البورصة</b><small>اتجاه المسح والنسبة</small></button>' +
      '<button type="button" data-chs="bars" class="' + (st === 'bars' ? 'on' : '') + '"><svg viewBox="0 0 120 50">' + [10, 18, 14, 26, 22, 34, 30, 40].map(function (h, k) { return '<rect x="' + (4 + k * 14.5) + '" y="' + (48 - h) + '" width="9" height="' + h + '" rx="2" fill="' + (k === 7 ? '#F59E0B' : '#14B8A6') + '"/>'; }).join('') + '</svg><b>أعمدة</b><small>العدد في كل ساعة أو يوم</small></button></div>';
    [].forEach.call(el.querySelectorAll('[data-chs]'), function (b) { b.onclick = function () { try { localStorage.setItem('qrd-chart', b.dataset.chs); } catch (e) {} chartSettings(); dashX(); dHome(); toast(b.dataset.chs === 'line' ? '📈 الرسم بقى خط زي البورصة' : '📊 الرسم بقى أعمدة'); }; });
  }
  function dashX() {
    var el = $('qrdX'), D = ui.dash; if (!el) return;
    if (!D) { el.innerHTML = '<div class="lx-stats">' + [1, 2, 3, 4].map(function () { return '<div class="lx-st sk"></div>'; }).join('') + '</div>'; return; }
    var qd = pct(D.qr.today, D.qr.yday), R = D.req;
    var reqLine = [['حجز', R.bookings], ['نتائج', R.results], ['شكاوى', R.complaints], ['تقارير', R.reports]].filter(function (x) { return x[1]; }).map(function (x) { return x[0] + ' ' + x[1]; }).join(' · ') || 'مفيش طلبات مستنية';
    var stats = lxStat({ l: 'مسح الباركود الثابت النهارده', v: D.qr.today, i: 'qr', c: '#0D9488', sp: D.days.map(function (d) { return d.qr; }),
        d: D.qr.yday ? (Math.abs(qd) + '% ' + (qd >= 0 ? 'زيادة' : 'أقل') + ' عن امبارح (' + n0(D.qr.yday) + ')') : 'الإجمالي ' + n0(D.qr.total) + ' مرة', tone: D.qr.yday ? (qd >= 0 ? 'up' : 'dn') : '', ti: D.qr.yday ? (qd >= 0 ? 'trend' : 'trendD') : '' }) +
      lxStat({ l: 'مرات فتح النتائج النهارده', v: D.views.today, i: 'eye', c: '#6366F1', sp: D.days.map(function (d) { return d.views; }), d: 'الإجمالي ' + n0(D.views.total) + ' مرة · امبارح ' + n0(D.views.yday) }) +
      lxStat({ l: 'الحالات المرفوعة', v: D.cases.total, i: 'file', c: '#D97706', sp: casesPerDay(), d: 'النهارده ' + n0(D.cases.today) + ' · الشهر ده ' + n0(D.cases.month) + (D.cases.unseen ? ' · ' + n0(D.cases.unseen) + ' لسه متفتحتش' : '') }) +
      lxStat({ l: 'طلبات مستنية رد', v: R.total, i: 'inbox', c: '#E11D48', d: reqLine, tone: R.total ? 'warn' : 'up' });
    var mode = ui.lxMode || 'today'; if (mode === 'days') mode = ui.lxMode = '30';
    var follow = [['bookings', 'today', 'طلبات حجز الأشعة', R.bookings, '#4F46E5'], ['results', 'eye', 'طلبات النتائج', R.results, '#0D9488'], ['complaints', 'wa', 'الشكاوى', R.complaints, '#E11D48'], ['reports', 'file', 'طلبات التقارير', R.reports, '#D97706']];
    var recentRows = (ui.recent || []).slice(0, 8).map(function (e) {
      var v = VIA[e.via] || VIA.qr;
      return '<tr data-vt="' + esc(e.token) + '"><td><div class="lx-pt">' + qxAv(e.patient) + '<b>' + esc(e.patient || '—') + '</b></div></td><td>' + (e.exam ? '<span class="lx-b" style="--x:' + exColor(e.exam) + '">' + esc(e.exam) + '</span>' : '—') + '</td>' +
        '<td><span class="lx-via ' + (e.via === 'fixed' ? 'f' : 'q') + '">' + v[0] + ' ' + v[1] + '</span></td><td class="mut">' + esc(e.dev || '—') + '</td><td class="mut">' + when(e.at) + '</td></tr>';
    }).join('');
    el.innerHTML = '<div class="lx-stats">' + stats + '</div>' +
      '<div class="lx-row"><section class="lx-card lx-chart' + (chartStyle() === 'line' ? ' is-line' : '') + '"><div class="lx-ch"><div><h3>مسح الباركود الثابت</h3><small>' + (mode === 'today' ? 'النهارده بالساعة' : 'آخر ' + mode + ' يوم') + '</small></div>' + modeSeg(mode, 'data-lxm') + '</div>' +
        (chartStyle() === 'line' ? trendChart(D, mode) : (mode !== 'today' ? '<div class="lx-lg"><span><i class="s0"></i>الباركود الثابت</span><span><i class="s1"></i>فتح النتائج</span></div>' : '') + lxChart(D)) + '</section>' +
      '<section class="lx-card lx-follow"><div class="lx-ch"><div><h3>محتاج متابعة</h3><small>الطلبات اللي لسه مارديتش عليها</small></div></div><div class="lx-fl">' +
        follow.map(function (f) { return '<button type="button" data-page-nav="' + f[0] + '" style="--c:' + f[4] + '"><span class="lx-fi">' + ic(f[1]) + '</span><b>' + f[2] + '</b><em class="' + (f[3] ? 'on' : '') + '">' + n0(f[3]) + '</em></button>'; }).join('') +
        '</div><button type="button" class="lx-sat" data-page-nav="ratings"><span class="lx-fi" style="--c:#F59E0B">★</span><b>رضا المرضى <small>آخر 30 يوم</small></b>' + (D.rate && D.rate.n ? '<em class="on" style="--c:#F59E0B">' + D.rate.avg.toFixed(1) + ' ★ · ' + Math.round(D.rate.happy / D.rate.n * 100) + '%</em>' : '<em>لسه</em>') + '</button>' +
        '<button type="button" class="lx-sat" data-page-nav="follow"><span class="lx-fi" style="--c:#F59E0B">🔁</span><b>متابعات مستحقة <small>المرضى اللي ميعاد متابعتهم جه</small></b><em' + (D.follow ? ' class="on" style="--c:#F59E0B"' : '') + '>' + n0(D.follow || 0) + '</em></button>' + waitBox(D.wait) +
        '<div class="lx-qa"><button type="button" class="btn" data-lxq="pdf">' + ic('file') + ' ارفع PDF</button><button type="button" class="btn g" data-lxq="dicom">🩻 DICOM</button><button type="button" class="btn g" data-lxq="month">' + ic('down') + ' التقرير الشهري</button></div></section></div>' +
      '<section class="lx-card lx-recent"><div class="lx-ch"><div><h3>آخر مرات فتح النتائج</h3><small>مين فتح نتيجته وإمتى ومن أنهي باركود</small></div><button type="button" class="btn g sm" data-page-nav="activity">السجل كله ←</button></div>' +
        (recentRows ? '<div class="lx-tw"><table class="lx-t"><thead><tr><th>المريض</th><th>الفحص</th><th>فتحها من</th><th>الجهاز</th><th>الوقت</th></tr></thead><tbody>' + recentRows + '</tbody></table></div>' : '<p class="lx-emp">لسه مفيش فتح لنتائج الأشعة — هتظهر هنا لحظيًا.</p>') + '</section>';
    [].forEach.call(el.querySelectorAll('[data-page-nav]'), function (b) { if (NOTICE_LABELS[b.dataset.pageNav]) b.insertAdjacentHTML('beforeend', '<em class="qrd-unread" data-unread="' + b.dataset.pageNav + '" hidden></em>'); });
    paintNotices();
    [].forEach.call(el.querySelectorAll('[data-lxm]'), function (b) { b.onclick = function () { ui.lxMode = b.dataset.lxm; dashX(); }; });
    [].forEach.call(el.querySelectorAll('[data-vt]'), function (r) { r.onclick = function () { viewsModal(r.dataset.vt); }; });
    [].forEach.call(el.querySelectorAll('[data-lxq]'), function (b) { b.onclick = function () { var k = b.dataset.lxq; if (k === 'month') return monthReportAsk(); navigatePage('upload', true); setTimeout(function () { if (k === 'pdf') { var f = $('fi'); if (f) f.click(); } else dicomPick(); }, 200); }; });
  }

  /* ── ads: written here, shown to patients in their page's slider ── */
  var PAL = { a: ['#0F766E', '#14B8A6'], b: ['#145FB4', '#2CA7EC'], c: ['#EA580C', '#F97316'], d: ['#7357C5', '#A78BFA'], e: ['#267CB4', '#6CC4E8'], f: ['#247D5B', '#55B68C'] };
  function adImg(file) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(file), I = new Image();
      I.onload = function () { var k = Math.min(1, 1000 / I.width, 600 / I.height), w = Math.round(I.width * k), h = Math.round(I.height * k), cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(I, 0, 0, w, h); URL.revokeObjectURL(u);
        var q = 0.84, d = cv.toDataURL('image/jpeg', q); while (d.length > 520000 && q > 0.4) { q -= 0.12; d = cv.toDataURL('image/jpeg', q); } ok(d); };
      I.onerror = function () { no(new Error('الملف ده مش صورة')); }; I.src = u;
    });
  }
  /* ════════ 5.20 · slider studio — every slide (welcome, drawn, ads, photos) in one ordered list the center fully controls ════════ */
  var KIND = { base: ['جاهزة', 'kb'], ad: ['إعلان', 'ka'], slide: ['صورة', 'ks'] };
  function adsLoad() { api('GET', 'ads').then(function (x) { ui.ads = x.ads || []; ui.slMs = x.ms || 5200; if (x.pop) ui.pop = x.pop; adsUI(); }).catch(function () { ui.ads = ui.ads || []; adsUI(); }); }
  function adState(a) { var td = ymd(); if (!a.active) return ['of', 'موقوف']; if (a.ends && a.ends < td) return ['ex', 'خلص']; return ['on', 'شغال']; }
  function liveSlides() { var td = ymd(); return (ui.ads || []).filter(function (a) { return a.active && (!a.ends || a.ends >= td) && (a.kind !== 'slide' || a.image); }); }
  function slideObj(a, extra) { var o = { title: a.title, body: a.body, tag: a.kind === 'slide' ? '' : a.tag, art: a.art, image: a.image, cta: a.kind === 'slide' ? '' : a.cta, ad: a.kind === 'ad', pic: a.kind === 'slide' }; if (a.kind === 'slide') o.pic = true; return Object.assign(o, extra || {}); }
  function palette(w) { var p = PAL[ui.theme || C.theme] || PAL.a; w.style.setProperty('--pp', p[0]); w.style.setProperty('--pp2', p[1]); }
  /* the editor's single-slide preview */
  function adPrev() {
    var w = $('adPv'); if (!w || !window.OZAds) return; var f = ui.adEdit; palette(w);
    w.innerHTML = '<div class="pvs"><div class="pvs-tr">' + OZAds.slide(slideObj({ title: f.title || (f.kind === 'slide' ? '' : 'عنوان الشريحة'), body: f.body, tag: f.tag, art: f.art, image: f.image, cta: f.cta, kind: f.kind || 'ad' }), true) + '</div></div>';
  }
  /* the whole slider, autoplaying, exactly as the patient sees it */
  function studioPreview() {
    var w = $('stPv'); if (!w || !window.OZAds) return; palette(w); clearInterval(ui.stT);
    var L = liveSlides(); if (!L.length) { w.innerHTML = '<div class="st-empty">كل الشرائح موقوفة — المريض هيشوف شريحة الترحيب الافتراضية</div>'; return; }
    w.innerHTML = '<div class="pvs"><div class="pvs-tr" id="stTr">' + L.map(function (a, i) { return OZAds.slide(slideObj(a), !i); }).join('') + '</div><div class="pvs-dots">' + L.map(function (a, i) { return '<button type="button" data-sd="' + i + '" class="' + (i ? '' : 'on') + '"><i style="animation-duration:' + (ui.slMs || 5200) + 'ms"></i></button>'; }).join('') + '</div></div>';
    var cur = 0, tr = $('stTr'), go = function (i) { cur = (i + L.length) % L.length; tr.style.transform = 'translateX(' + cur * 100 + '%)'; [].forEach.call(tr.children, function (s, k) { s.classList.toggle('on', k === cur); }); [].forEach.call(w.querySelectorAll('[data-sd]'), function (d, k) { d.classList.toggle('on', k === cur); }); };
    [].forEach.call(w.querySelectorAll('[data-sd]'), function (d) { d.onclick = function () { go(+d.dataset.sd); clearInterval(ui.stT); ui.stT = setInterval(function () { go(cur + 1); }, ui.slMs || 5200); }; });
    ui.stGo = go; if (L.length > 1) ui.stT = setInterval(function () { if (!document.body.contains(tr)) return clearInterval(ui.stT); go(cur + 1); }, ui.slMs || 5200);
  }
  function editSlide(a) {
    ui.adEdit = a ? { id: a.id, kind: a.kind, title: a.title, body: a.body, tag: a.tag, art: a.art, image: a.image, cta: a.cta, ends: a.ends, active: a.active } : { kind: 'ad', art: 'offer', cta: 'book', active: true, title: '', body: '', tag: 'عرض خاص', image: '', ends: '' };
    adsUI(); var f = $('adForm'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(function () { var t = $('adT'); if (t) t.focus({ preventScroll: true }); }, 350); }
  }
  function adsUI() {
    var el = $('adsBox'); if (!el || !window.OZAds) return;
    var f = ui.adEdit = ui.adEdit || { kind: 'ad', art: 'offer', cta: 'book', active: true, title: '', body: '', tag: 'عرض خاص', image: '', ends: '' }, L = ui.ads || [];
    var isPic = f.kind === 'slide', live = liveSlides().length;
    var rows = L.map(function (a, i) {
      var s = adState(a), K = KIND[a.kind] || KIND.ad, first = !i && a.kind === 'base';
      return '<li class="st-it' + (a.active ? '' : ' off') + (f.id === a.id ? ' ed' : '') + '" draggable="true" data-ad="' + a.id + '">' +
        '<span class="st-h" aria-hidden="true">⋮⋮</span><span class="st-n">' + (i + 1) + '</span>' +
        '<span class="ad-th">' + (a.image ? '<img src="' + a.image + '" alt="">' : OZAds.art(a.art)) + '</span>' +
        '<div class="st-tx"><b>' + esc(a.title || (a.kind === 'slide' ? 'صورة من غير عنوان' : '—')) + '</b><small>' + esc(a.body || (a.cta ? 'زرار: ' + OZAds.CTA[a.cta] : '')) + '</small></div>' +
        '<span class="st-k ' + K[1] + '">' + (first ? 'ترحيب' : K[0]) + '</span><span class="lx-st2 ' + s[0] + '">' + s[1] + '</span>' +
        '<label class="ad-sw st-sw" title="' + (a.active ? 'وقّفها' : 'شغّلها') + '"><input type="checkbox" data-ada="toggle"' + (a.active ? ' checked' : '') + ' aria-label="تظهر للمرضى"><i></i></label>' +
        '<div class="st-acts"><button class="lx-ib" data-ada="up" data-tip="لفوق"' + (i ? '' : ' disabled') + ' aria-label="لفوق">' + ic('au') + '</button><button class="lx-ib" data-ada="down" data-tip="لتحت"' + (i < L.length - 1 ? '' : ' disabled') + ' aria-label="لتحت">' + ic('ad') + '</button>' +
        '<button class="lx-ib" data-ada="edit" data-tip="تعديل" aria-label="تعديل">' + ic('edit') + '</button><button class="lx-ib dl" data-ada="delete" data-tip="امسح" aria-label="امسح">' + ic('trash') + '</button></div></li>';
    }).join('');
    var arts = OZAds.ARTS.map(function (a) { return '<button type="button" data-art="' + a[0] + '" class="' + (!f.image && f.art === a[0] ? 'on' : '') + '"><span class="ad-mini">' + OZAds.art(a[0]) + '</span><small>' + a[1] + '</small></button>'; }).join('') +
      '<button type="button" data-art="img" class="' + (f.image ? 'on' : '') + '"><span class="ad-mini im">' + (f.image ? '<img src="' + f.image + '" alt="">' : ic('img')) + '</span><small>' + (f.image ? 'غيّر الصورة' : 'صورة من عندك') + '</small></button>';
    el.innerHTML = '<div class="lx-ads">' +
      '<section class="lx-card st-card"><div class="lx-ch"><div><h3>🎞 السلايدر اللي فوق صفحة المريض</h3><small>' + L.length + ' شريحة · ' + live + ' ظاهرة للمرضى — اسحب الشريحة لفوق أو لتحت عشان ترتّبها</small></div>' +
        '<div class="st-top"><label class="st-ms">⏱ <select id="stMs" aria-label="مدة كل شريحة">' + [3000, 4000, 5200, 7000, 10000].map(function (v) { return '<option value="' + v + '"' + (Math.abs((ui.slMs || 5200) - v) < 300 ? ' selected' : '') + '>' + Math.round(v / 1000) + ' ث لكل شريحة</option>'; }).join('') + '</select></label>' +
          '<button type="button" class="btn" id="stAd">' + ic('mega') + ' إعلان</button><button type="button" class="btn g" id="slAdd">' + ic('img') + ' صور</button><input type="file" id="slF" accept="image/png,image/jpeg,image/webp" multiple hidden>' +
          '<button type="button" class="btn g" id="stRs" title="يرجّع الشرائح الجاهزة الأربعة زي الأول">↺ الجاهزة</button></div></div>' +
        '<div class="st-grid"><div class="st-pw"><small>كده بيشوفه المريض دلوقتي</small><div class="pvd ad-prev st-prev" id="stPv"></div></div>' +
          '<ol class="st-list" id="stL">' + (rows || '<li class="lx-emp">مفيش شرايح — ضيف إعلان أو صور، أو رجّع الشرائح الجاهزة</li>') + '</ol></div></section>' +
      '<section class="lx-card ad-form" id="adForm"><div class="lx-ch"><div><h3>' + (f.id ? '✎ تعديل الشريحة' : '📣 إعلان جديد') + '</h3><small>' + (f.id ? (KIND[f.kind] || KIND.ad)[0] + ' · التعديل بيظهر للمرضى أول ما تحفظ' : 'بيتضاف بعد شريحة الترحيب، وتقدر ترتّبه من القايمة') + '</small></div></div>' +
      '<div class="ad-grid"><div class="ad-fields">' +
        '<label class="l" for="adT">العنوان' + (isPic ? ' (اختياري)' : ' *') + '</label><input class="fld" id="adT" maxlength="70" placeholder="مثلاً: خصم 20% على السونار" value="' + esc(f.title) + '">' +
        '<label class="l" for="adB">سطر توضيحي</label><input class="fld" id="adB" maxlength="120" placeholder="مثلاً: العرض لحد آخر الشهر — احجز من موبايلك" value="' + esc(f.body) + '">' +
        (isPic ? '' : '<div class="ad-2"><div><label class="l" for="adG">الشارة الصغيرة</label><input class="fld" id="adG" maxlength="24" placeholder="عرض خاص" value="' + esc(f.tag) + '"></div>' +
        '<div><label class="l" for="adC">الزرار اللي في الشريحة</label><select class="fld" id="adC"><option value="">بدون زرار</option>' + Object.keys(OZAds.CTA).map(function (k) { return '<option value="' + k + '"' + (f.cta === k ? ' selected' : '') + '>' + OZAds.CTA[k] + '</option>'; }).join('') + '</select></div></div>') +
        '<label class="l">' + (isPic ? 'الصورة' : 'الرسمة أو الصورة') + '</label><div class="ad-arts">' + (isPic ? '<button type="button" data-art="img" class="on"><span class="ad-mini im">' + (f.image ? '<img src="' + f.image + '" alt="">' : ic('img')) + '</span><small>غيّر الصورة</small></button>' : arts) + '</div><input type="file" id="adF" accept="image/png,image/jpeg,image/webp" hidden>' +
        '<div class="ad-2"><div><label class="l" for="adE">آخر يوم (اختياري)</label><input class="fld" id="adE" type="date" value="' + esc(f.ends || '') + '"></div>' +
        '<div><label class="l">الظهور</label><label class="ad-sw"><input type="checkbox" id="adA"' + (f.active !== false ? ' checked' : '') + '><i></i><span>تظهر للمرضى</span></label></div></div>' +
      '</div><div class="ad-pw"><small>الشريحة دي لوحدها</small><div class="pvd ad-prev" id="adPv"></div>' +
        '<div class="ad-btns"><button type="button" class="btn" id="adS">💾 ' + (f.id ? 'احفظ التعديل' : 'انشر الإعلان') + '</button>' + (f.id ? '<button type="button" class="btn g" id="adX">إلغاء</button>' : '') + '</div></div></div></section><div id="popBox"></div></div>';
    adPrev(); studioPreview(); studioWire(el); popUI();
    var bind = function (id, k) { var i = $(id); if (i) i.oninput = i.onchange = function () { f[k] = i.type === 'checkbox' ? i.checked : i.value; if (k !== 'active' && k !== 'ends') adPrev(); }; };
    bind('adT', 'title'); bind('adB', 'body'); bind('adG', 'tag'); bind('adC', 'cta'); bind('adE', 'ends'); bind('adA', 'active');
    [].forEach.call(el.querySelectorAll('[data-art]'), function (b) { b.onclick = function () {
      if (b.dataset.art === 'img') return $('adF').click();
      f.art = b.dataset.art; f.image = ''; [].forEach.call(el.querySelectorAll('[data-art]'), function (x) { x.classList.toggle('on', x === b); }); adPrev();
    }; });
    $('adF').onchange = function () { var file = this.files[0]; this.value = ''; if (!file) return; adImg(file).then(function (d) { f.image = d; adsUI(); }).catch(function (e) { toast(e.message); }); };
    $('adS').onclick = function () {
      if (f.kind !== 'slide' && !String(f.title || '').trim()) { $('adT').focus(); toast('اكتب العنوان'); return; }
      if (f.kind === 'slide' && !f.image) { toast('اختار صورة'); return; }
      var b = this; b.disabled = true;
      api('POST', 'ads', { id: f.id, kind: f.kind, title: f.title, body: f.body, tag: f.tag, art: f.art, image: f.image, cta: f.cta, ends: f.ends, active: f.active !== false })
        .then(function (x) { ui.ads = x.ads || []; toast(f.id ? '✅ اتحفظ التعديل' : '📣 الإعلان اتنشر — المرضى هيشوفوه في صفحتهم'); ui.adEdit = null; adsUI(); dashSoon(); })
        .catch(function (e) { b.disabled = false; toast(e.message); });
    };
    if ($('adX')) $('adX').onclick = function () { ui.adEdit = null; adsUI(); };
  }
  /* 5.25 · «نافذة التقييم» — the center words the stars pop-up, adds promo lines, picks the icon and its size */
  var POP_IC = [['logo', 'لوجو المركز'], ['star', '⭐'], ['heart', '💚'], ['smile', '😊'], ['gift', '🎁'], ['none', 'بدون']], POP_SZ = [['s', 'صغير'], ['m', 'متوسط'], ['l', 'كبير'], ['xl', 'كبير جدًا']];
  function popUI() {
    var el = $('popBox'); if (!el) return;
    var p = ui.popEd = ui.popEd || JSON.parse(JSON.stringify(ui.pop || { onH: true, onV: true, delay: 2, title: '', sub: '', promos: [], thanks: '', icon: 'logo', size: 'm' }));
    var nm = String(C.center || '').trim(), dT = 'إيه رأيك في ' + (/^مركز/.test(nm) ? nm : 'مركز ' + nm) + '؟';
    var chips = function (L, k, cls) { return '<div class="pp-ch ' + cls + '" role="radiogroup">' + L.map(function (x) { return '<button type="button" role="radio" aria-checked="' + (p[k] === x[0]) + '" data-pp' + k + '="' + x[0] + '" class="' + (p[k] === x[0] ? 'on' : '') + '">' + (k === 'icon' && x[0] === 'logo' ? '<span class="pp-lg">' + logoTag() + '</span>' : '') + '<span>' + x[1] + '</span></button>'; }).join('') + '</div>'; };
    el.innerHTML = '<section class="lx-card pp-card"><div class="lx-ch"><div><h3>⭐ نافذة التقييم</h3><small>البوب اللي بيطلع للمريض بعد ما يفتح الصفحة — غيّر كلامه وضيف جمل دعائية واختار الأيقونة وحجمها</small></div>' +
      '<div class="st-top"><button type="button" class="btn g" id="ppT">▶ جرّبها</button><button type="button" class="btn" id="ppS">💾 احفظ</button></div></div>' +
      '<div class="ad-grid"><div class="ad-fields">' +
        '<div class="ad-2"><div><label class="l">تظهر في</label><label class="ad-sw"><input type="checkbox" id="ppH"' + (p.onH ? ' checked' : '') + '><i></i><span>صفحة المركز (الباركود الثابت)</span></label><label class="ad-sw"><input type="checkbox" id="ppV"' + (p.onV ? ' checked' : '') + '><i></i><span>صفحة النتيجة</span></label></div>' +
        '<div><label class="l" for="ppD">تظهر بعد</label><select class="fld" id="ppD">' + [1, 2, 3, 5, 8].map(function (v) { return '<option value="' + v + '"' + (+p.delay === v ? ' selected' : '') + '>' + (v === 1 ? 'ثانية واحدة' : v === 2 ? 'ثانيتين' : v + ' ثواني') + '</option>'; }).join('') + '</select></div></div>' +
        '<label class="l" for="ppTi">العنوان</label><input class="fld" id="ppTi" maxlength="80" placeholder="' + esc(dT) + '" value="' + esc(p.title) + '">' +
        '<label class="l" for="ppSu">السطر اللي تحته</label><input class="fld" id="ppSu" maxlength="100" placeholder="قيّمنا بالنجوم — بتاخد ثانية" value="' + esc(p.sub) + '">' +
        '<label class="l">جمل دعائية <small>(بتظهر واحدة منهم كل مرة تحت النجوم — لحد 6)</small></label><ul class="pp-pr" id="ppPr">' + p.promos.map(function (t, i) { return '<li><input class="fld" maxlength="90" data-ppp="' + i + '" value="' + esc(t) + '" aria-label="جملة ' + (i + 1) + '"><button type="button" class="lx-ib dl" data-ppx="' + i + '" aria-label="امسح">' + ic('trash') + '</button></li>'; }).join('') + '</ul>' +
        (p.promos.length < 6 ? '<button type="button" class="btn g pp-add" id="ppA">+ جملة</button>' : '') +
        (p.promos.length ? '' : '<div class="pp-ex">' + ['🎁 خصم 10% على زيارتك الجاية', '🕘 مفتوحين كل يوم من 9 الصبح لـ 11 بالليل', '🏠 سحب عينات من البيت'].map(function (t) { return '<button type="button" data-ppe="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>') +
        '<label class="l" for="ppK">رسالة الشكر</label><input class="fld" id="ppK" maxlength="90" placeholder="فرّحتنا — ألف سلامة عليك" value="' + esc(p.thanks) + '">' +
        '<label class="l">الأيقونة</label>' + chips(POP_IC, 'icon', 'ic') +
        '<label class="l">حجم الأيقونة</label>' + chips(POP_SZ, 'size', 'sz') +
      '</div><div class="ad-pw"><small>كده هتظهر للمريض</small><div class="pp-stage" id="ppPv"></div></div></div></section>';
    var prev = function () {
      var h = $('ppPv'); if (!h || !window.OZK || !OZK.ratePop) return; h.innerHTML = '';
      OZK.ratePop(Object.assign(OZK.popOpts(p, { center: C.center, logo: ui.logo }, 'h'), { host: h, dry: true, onGone: function () { setTimeout(function () { if (document.body.contains(h) && !h.firstChild) prev(); }, 900); } }));
    };
    ui.ppPrev = prev; prev();
    var t; var soft = function () { clearTimeout(t); t = setTimeout(prev, 350); };
    var bind = function (id, k) { var i = $(id); i.oninput = i.onchange = function () { p[k] = i.type === 'checkbox' ? i.checked : i.type === 'select-one' ? +i.value : i.value; soft(); }; };
    bind('ppH', 'onH'); bind('ppV', 'onV'); bind('ppD', 'delay'); bind('ppTi', 'title'); bind('ppSu', 'sub'); bind('ppK', 'thanks');
    [].forEach.call(el.querySelectorAll('[data-ppp]'), function (i) { i.oninput = function () { p.promos[+i.dataset.ppp] = i.value; soft(); }; });
    [].forEach.call(el.querySelectorAll('[data-ppx]'), function (b) { b.onclick = function () { p.promos.splice(+b.dataset.ppx, 1); popUI(); }; });
    [].forEach.call(el.querySelectorAll('[data-ppe]'), function (b) { b.onclick = function () { p.promos.push(b.dataset.ppe); popUI(); }; });
    if ($('ppA')) $('ppA').onclick = function () { p.promos.push(''); popUI(); var L = el.querySelectorAll('[data-ppp]'); if (L.length) L[L.length - 1].focus(); };
    [].forEach.call(el.querySelectorAll('[data-ppicon],[data-ppsize]'), function (b) { b.onclick = function () { if (b.dataset.ppicon) p.icon = b.dataset.ppicon; else p.size = b.dataset.ppsize; popUI(); }; });
    $('ppT').onclick = function () { var c = document.querySelector('body > .rp-pop'); if (c) c.remove(); OZK.ratePop(Object.assign(OZK.popOpts(p, { center: C.center, logo: ui.logo }, 'h'), { dry: true })); };
    $('ppS').onclick = function () {
      var b = this; b.disabled = true; p.promos = p.promos.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
      api('POST', 'pop-cfg', p).then(function (x) { ui.pop = x.pop; ui.popEd = null; popUI(); toast('⭐ نافذة التقييم اتحفظت — هتظهر كده للمرضى'); }).catch(function (e) { b.disabled = false; toast(e.message); });
    };
  }
  /* ═══════════ 5.28 · follow-ups · referring doctors · live wait · daily summary · phone widgets ═══════════ */
  function dkAll() { try { return JSON.parse(localStorage.getItem('qrd-dk:' + C.code) || '{}') || {}; } catch (e) { return {}; } }
  function dkSet(id, k) { var m = dkAll(); m[id] = k; try { localStorage.setItem('qrd-dk:' + C.code, JSON.stringify(m)); } catch (e) {} hSet('dk:' + C.code, m); }
  hGet('dk:' + C.code).then(function (m) { if (!m) return; var a = dkAll(), ch = false; Object.keys(m).forEach(function (k) { if (!a[k]) { a[k] = m[k]; ch = true; } }); if (ch) try { localStorage.setItem('qrd-dk:' + C.code, JSON.stringify(a)); } catch (e) {} }).catch(function () {});
  function docLink(d) { var k = dkAll()[d.id]; return k ? location.origin + '/r/' + d.slug + '#' + k : ''; }
  function docsLoad(paint) { return api('GET', 'doctors').then(function (x) { ui.docs = x.doctors || []; if (paint !== false) doctorsUI(); return ui.docs; }).catch(function (e) { toast(e.message); }); }
  function docOpts(sel) { return '<option value="">بدون دكتور محوّل</option>' + (ui.docs || []).filter(function (d) { return d.active; }).map(function (d) { return '<option value="' + d.id + '"' + (String(sel) === String(d.id) ? ' selected' : '') + '>د. ' + esc(d.name) + (d.spec ? ' · ' + esc(d.spec) : '') + '</option>'; }).join(''); }
  /* attach a case to a doctor: its key goes wrapped by that doctor's key (only this computer has both) */
  function setCaseDoctor(tok, did) {
    var loc = ui.local[tok], k = did ? dkAll()[did] : null;
    var go = function (w) { return api('POST', 'item/' + tok + '/doctor', { doctor_id: did || null, w: w || null }).then(function () { var r = itemOf(tok); if (r) r.doctor_id = did || null; }); };
    if (did && loc && k) return K.wrapRaw(loc.key, k).then(go);
    return go(null);
  }
  function doctorsUI() {
    var el = $('docsBox'); if (!el) return;
    var L = ui.docs || [], max = Math.max(1, Math.max.apply(null, L.map(function (d) { return d.cases; }).concat([0])));
    var top = L.filter(function (d) { return d.cases; }).slice(0, 8);
    el.innerHTML = '<div class="lx-ads">' +
      '<section class="lx-card"><div class="lx-ch"><div><h3>👨‍⚕️ ضيف دكتور بيحوّل مرضى</h3><small>كل دكتور بياخد لينك خاص يشوف منه نتايج مرضاه اللي حوّلهم، وإنت تعرف كام حالة جاتلك منه</small></div></div>' +
        '<div class="dc-f"><input class="fld" id="dcN" maxlength="80" placeholder="اسم الدكتور *"><input class="fld" id="dcS" maxlength="60" placeholder="التخصص (اختياري)"><input class="fld" id="dcP" maxlength="20" inputmode="tel" placeholder="موبايله (لإرسال اللينك)"><button type="button" class="btn" id="dcA">+ ضيف</button></div></section>' +
      (top.length ? '<section class="lx-card"><div class="lx-ch"><div><h3>📊 الحالات من كل دكتور</h3><small>إجمالي الحالات المرتبطة بكل دكتور</small></div></div><div class="dc-bars">' + top.map(function (d, i) { return '<div class="dc-b" style="--w:' + Math.round(d.cases / max * 100) + '%;--i:' + i + '"><span>د. ' + esc(d.name) + '</span><i></i><b>' + n0(d.cases) + '</b></div>'; }).join('') + '</div></section>' : '') +
      '<section class="lx-card"><div class="lx-ch"><div><h3>الدكاترة (' + L.length + ')</h3><small>اختار الدكتور من فورم رفع الحالة، أو من قايمة «المزيد» جنب أي حالة</small></div></div>' +
      (L.length ? '<div class="dc-l">' + L.map(function (d, i) {
        var link = docLink(d);
        return '<div class="dc-c' + (d.active ? '' : ' off') + '" style="--i:' + i + '"><span class="dc-av">' + esc(String(d.name).trim().charAt(0)) + '</span><div class="dc-tx"><b>د. ' + esc(d.name) + '</b><small>' + esc(d.spec || 'دكتور محوّل') + (d.phone ? ' · ' + esc(d.phone) : '') + '</small>' +
          '<div class="dc-k"><span><b>' + n0(d.cases) + '</b> حالة</span><span><b>' + n0(d.month) + '</b> الشهر ده</span><span><b>' + n0(d.opened) + '</b> اتفتحت</span></div>' +
          (link ? '' : '<small class="dc-w">🔑 لينك الدكتور ده اتعمل من جهاز تاني — اعمل لينك جديد من هنا عشان الحالات اللي هترفعها من الجهاز ده توصله</small>') + '</div>' +
          '<div class="dc-a">' + (link ? '<button type="button" class="btn sm" data-dc="cp" data-id="' + d.id + '">نسخ اللينك</button>' + (d.phone ? '<button type="button" class="btn sm wa" data-dc="wa" data-id="' + d.id + '">واتساب</button>' : '') : '<button type="button" class="btn sm" data-dc="new" data-id="' + d.id + '">🔑 لينك جديد</button>') +
          '<button type="button" class="lx-ib" data-dc="tg" data-id="' + d.id + '" data-tip="' + (d.active ? 'وقّف' : 'شغّل') + '">' + ic(d.active ? 'pause' : 'play') + '</button><button type="button" class="lx-ib dl" data-dc="del" data-id="' + d.id + '" data-tip="امسح">' + ic('trash') + '</button></div></div>';
      }).join('') + '</div>' : '<div class="lx-emp">لسه مفيش دكاترة — ضيف أول دكتور من فوق</div>') + '</section></div>';
    $('dcA').onclick = function () {
      var b = this, name = $('dcN').value.trim(); if (!name) { $('dcN').focus(); return toast('اكتب اسم الدكتور'); }
      b.disabled = true; var before = (ui.docs || []).map(function (d) { return d.id; });
      api('POST', 'doctors', { name: name, spec: $('dcS').value, phone: $('dcP').value }).then(function (x) {
        ui.docs = x.doctors || []; var nw = ui.docs.filter(function (d) { return before.indexOf(d.id) < 0; })[0]; if (nw) dkSet(nw.id, K.newKey());
        doctorsUI(); toast('👨‍⚕️ الدكتور اتضاف — ابعتله اللينك بتاعه');
      }).catch(function (e) { b.disabled = false; toast(e.message); });
    };
    [].forEach.call(el.querySelectorAll('[data-dc]'), function (b) { b.onclick = function () {
      var id = +b.dataset.id, d = L.filter(function (x) { return x.id === id; })[0], k = b.dataset.dc; if (!d) return;
      if (k === 'cp') { var u = docLink(d); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast('اتنسخ ✓'); }).catch(function () { prompt('انسخ اللينك', u); }); return; }
      if (k === 'wa') { var msg = 'أهلاً د. ' + d.name + '، ده لينك نتايج مرضاك المحوّلين لـ ' + (C.center || 'المركز') + ' — كل نتيجة بتتضاف هنا أول ما تجهز:\n' + docLink(d); window.open('https://wa.me/' + waNum(d.phone) + '?text=' + encodeURIComponent(msg), '_blank', 'noopener'); return; }
      if (k === 'new') {
        if (!confirm('هنعمل لينك جديد للدكتور ده. اللينك القديم مش هيفتح الحالات اللي هتترفع بعد كده. نكمّل؟')) return;
        var nk = K.newKey(); dkSet(id, nk); var mine = (ui.list || []).filter(function (r) { return r.doctor_id === id && ui.local[r.token]; }), i = 0;
        (function nx() { if (i >= mine.length) { toast('🔑 اللينك الجديد جاهز' + (mine.length ? ' · ' + mine.length + ' حالة اتربطت' : '')); return doctorsUI(); } setCaseDoctor(mine[i++].token, id).then(nx, nx); })();
        return;
      }
      if (k === 'del' && !confirm('تمسح د. ' + d.name + '؟ الحالات هتفضل، بس هتتفصل عنه ولينكه هيقف.')) return;
      api('POST', 'doctors/' + id + '/' + (k === 'tg' ? 'toggle' : 'delete')).then(function (x) { ui.docs = x.doctors || []; doctorsUI(); }).catch(function (e) { toast(e.message); });
    }; });
  }
  function waNum(p) { var d = K.digits(p || '').replace(/^0/, ''); return d ? (d.length <= 10 ? '20' + d : d) : ''; }
  function caseDoctorAsk(tok) {
    var r = itemOf(tok); if (!r) return;
    var go = function () {
      var o = modal('<h3>👨‍⚕️ الدكتور المحوّل</h3><p>' + esc(r.patient) + (r.exam ? ' · ' + esc(r.exam) : '') + '</p><select class="fld" id="cdS">' + docOpts(r.doctor_id) + '</select>' + (ui.local[tok] ? '' : '<p style="font-size:12.5px;color:#B45309">الحالة دي اترفعت من جهاز تاني — هتتسجّل باسم الدكتور، بس عشان تفتح عنده اربطها من الجهاز اللي عليه الحالة.</p>') + '<div class="bt"><button class="btn" data-x="ok">احفظ</button><button class="btn g" data-x="cl">إلغاء</button></div>',
        function (k, close) { if (k !== 'ok') return; var v = +o.querySelector('#cdS').value || 0; setCaseDoctor(tok, v).then(function () { close(); toast(v ? '👨‍⚕️ الحالة اتربطت بالدكتور' : 'الحالة اتفصلت عن الدكتور'); }).catch(function (e) { toast(e.message); }); });
    };
    if (ui.docs) go(); else docsLoad(false).then(go);
  }
  /* ── follow-ups ── */
  function followLoad() { api('GET', 'follow').then(function (x) { ui.fol = x; followUI(); }).catch(function (e) { toast(e.message); }); }
  function followUI() {
    var el = $('folBox'); if (!el) return; var F = ui.fol || { rules: {}, list: [] }, R = ui.folEd || (ui.folEd = Object.keys(F.rules).map(function (k) { return [k, F.rules[k]]; }));
    var DD = [[14, 'أسبوعين'], [30, 'شهر'], [60, 'شهرين'], [90, '3 شهور'], [180, '6 شهور'], [365, 'سنة']];
    var late = F.list.filter(function (x) { return x.late; }).length, today = F.list.filter(function (x) { return x.today; }).length;
    el.innerHTML = '<div class="lx-ads">' +
      '<section class="lx-card"><div class="lx-ch"><div><h3>🔁 مواعيد المتابعة حسب نوع الفحص</h3><small>أي حالة بالنوع ده هياخد معاد متابعة لوحده، والمريض هيشوفه في صفحة نتيجته ويقدر يضيفه للتقويم أو يحجز</small></div><div class="st-top"><button type="button" class="btn" id="frS">💾 احفظ</button></div></div>' +
        '<div class="fr-l">' + R.map(function (r, i) { return '<div class="fr-r"><input class="fld" data-fe="' + i + '" list="exl" maxlength="60" placeholder="نوع الفحص — مثلاً: سونار حمل" value="' + esc(r[0]) + '"><select class="fld" data-fd="' + i + '">' + DD.map(function (d) { return '<option value="' + d[0] + '"' + (+r[1] === d[0] ? ' selected' : '') + '>بعد ' + d[1] + '</option>'; }).join('') + '</select><button type="button" class="lx-ib dl" data-fx="' + i + '" aria-label="امسح">' + ic('trash') + '</button></div>'; }).join('') + '</div>' +
        '<button type="button" class="btn g" id="frA">+ نوع فحص</button>' + (R.length ? '' : '<div class="pp-ex">' + [['ماموجرام', 365], ['قياس كثافة العظام', 365], ['سونار حمل', 30], ['دوبلر', 180]].map(function (x) { return '<button type="button" data-fp="' + esc(x[0]) + '|' + x[1] + '">' + esc(x[0]) + ' · ' + (DD.filter(function (d) { return d[0] === x[1]; })[0] || [0, ''])[1] + '</button>'; }).join('') + '</div>') + '</section>' +
      '<section class="lx-card"><div class="lx-ch"><div><h3>📋 متابعات جاية ومستحقة</h3><small>' + (F.list.length ? (late ? late + ' متأخرة · ' : '') + (today ? today + ' النهارده · ' : '') + F.list.length + ' خلال أسبوعين' : 'مفيش متابعات خلال الأسبوعين الجايين') + '</small></div></div>' +
        (F.list.length ? '<div class="lx-tw"><table class="lx-t"><thead><tr><th>المريض</th><th>الفحص</th><th>الميعاد</th><th></th></tr></thead><tbody>' + F.list.map(function (x) {
          return '<tr data-ft="' + x.token + '"><td><div class="lx-pt">' + qxAv(x.patient) + '<div><b>' + esc(x.patient) + '</b><span class="n">' + esc(x.phone || '—') + '</span></div></div></td><td><span class="lx-b" style="--x:' + exColor(x.exam) + '">' + esc(x.exam || 'فحص') + '</span></td>' +
            '<td><span class="fr-due ' + (x.late ? 'l' : x.today ? 't' : '') + '">' + (x.late ? 'متأخرة · ' : x.today ? 'النهارده · ' : '') + esc(dmyOf(x.due)) + '</span></td><td class="lx-acts">' +
            (x.phone ? '<button class="lx-ib wa" data-fa="wa" data-tip="فكّره على واتساب">' + ic('wa') + '</button>' : '') + '<button class="lx-ib" data-fa="pp" data-tip="أجّل شهر">⏭</button><button class="lx-ib" data-fa="ok" data-tip="خلصت">' + ic('check') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="lx-emp">✨ مفيش حد عليه متابعة دلوقتي</div>') + '</section></div>';
    var sync = function () { [].forEach.call(el.querySelectorAll('[data-fe]'), function (i) { R[+i.dataset.fe][0] = i.value; }); [].forEach.call(el.querySelectorAll('[data-fd]'), function (i) { R[+i.dataset.fd][1] = +i.value; }); };
    $('frA').onclick = function () { sync(); R.push(['', 90]); followUI(); var L = el.querySelectorAll('[data-fe]'); if (L.length) L[L.length - 1].focus(); };
    [].forEach.call(el.querySelectorAll('[data-fx]'), function (b) { b.onclick = function () { sync(); R.splice(+b.dataset.fx, 1); followUI(); }; });
    [].forEach.call(el.querySelectorAll('[data-fp]'), function (b) { b.onclick = function () { var p = b.dataset.fp.split('|'); R.push([p[0], +p[1]]); followUI(); }; });
    $('frS').onclick = function () { sync(); var o = {}; R.forEach(function (r) { if (String(r[0]).trim()) o[String(r[0]).trim()] = +r[1]; }); api('POST', 'follow', { rules: o }).then(function (x) { ui.fol = x; ui.folEd = null; followUI(); toast('🔁 مواعيد المتابعة اتحفظت — هتتطبق على الحالات الجاية'); }).catch(function (e) { toast(e.message); }); };
    [].forEach.call(el.querySelectorAll('[data-fa]'), function (b) { b.onclick = function () {
      var tok = b.closest('[data-ft]').dataset.ft, x = F.list.filter(function (y) { return y.token === tok; })[0], k = b.dataset.fa; if (!x) return;
      if (k === 'wa') { var msg = 'أهلاً يا ' + String(x.patient).split(' ')[0] + ' 👋\nميعاد متابعة ' + (x.exam || 'الفحص') + ' في ' + (C.center || 'المركز') + ' يوم ' + dmyOf(x.due) + '.\nاحجز ميعادك من هنا: ' + fixedUrl() + '#book'; window.open('https://wa.me/' + waNum(x.phone) + '?text=' + encodeURIComponent(msg), '_blank', 'noopener'); return; }
      var d = new Date(x.due + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 30);
      api('POST', 'follow/' + tok + (k === 'ok' ? '/done' : ''), k === 'pp' ? { date: d.toISOString().slice(0, 10) } : {}).then(function (y) { F.list = y.list || []; followUI(); dashSoon(); }).catch(function (e) { toast(e.message); });
    }; });
  }
  function caseFollowAsk(tok) {
    var r = itemOf(tok); if (!r) return;
    var o = modal('<h3>🔁 ميعاد المتابعة</h3><p>' + esc(r.patient) + (r.exam ? ' · ' + esc(r.exam) : '') + '</p><div class="sh2-ch">' + [[30, 'شهر'], [90, '3 شهور'], [180, '6 شهور'], [365, 'سنة']].map(function (x) { return '<button type="button" data-x="d' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><label class="l" style="margin-top:10px">أو اختار يوم</label><input class="fld" type="date" id="cfD" value="' + esc(r.follow_at || '') + '">' +
      '<div class="bt"><button class="btn" data-x="ok">احفظ</button>' + (r.follow_at ? '<button class="btn g" data-x="no">شيل المتابعة</button>' : '') + '<button class="btn g" data-x="cl">إلغاء</button></div>',
      function (k, close) {
        var body = k === 'ok' ? { date: o.querySelector('#cfD').value } : k === 'no' ? {} : /^d\d+$/.test(k) ? { days: +k.slice(1) } : null; if (!body) return;
        api('POST', 'follow/' + tok, body).then(function () { return api('GET', 'list'); }).then(function (x) { if (x && x.list) { ui.list = x.list; table(); } close(); toast('🔁 ميعاد المتابعة اتحفظ'); }).catch(function (e) { toast(e.message); });
      });
  }
  function dmyOf(s) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? (+m[3]) + '/' + (+m[2]) + '/' + m[1] : ''; }
  /* ── live wait time (reception taps one button) ── */
  function waitBox(W) {
    var on = W && W.min != null, ago = on ? Math.round((Date.now() - W.at) / 60000) : 0;
    return '<div class="wt"><div class="wt-h"><span class="lx-fi" style="--c:#0EA5E9">⏱</span><b>الانتظار دلوقتي <small>' + (on ? 'بيظهر للمرضى · اتحدّث من ' + (ago < 1 ? 'لحظة' : ago + ' دقيقة') : 'مش ظاهر للمرضى') + '</small></b>' + (on ? '<em class="on" style="--c:#0EA5E9">' + (W.min ? '~' + W.min + ' دقيقة' : 'مفيش انتظار') + '</em>' : '') + '</div>' +
      '<div class="wt-b">' + [0, 10, 20, 30, 45, 60].map(function (m) { return '<button type="button" data-wt="' + m + '" class="' + (on && W.min === m ? 'on' : '') + '">' + (m ? m + 'د' : 'مفيش') + '</button>'; }).join('') + '<button type="button" data-wt="off" class="x">إخفاء</button></div></div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-wt]'); if (!b) return;
    var v = b.dataset.wt === 'off' ? null : +b.dataset.wt;
    api('POST', 'wait', { min: v }).then(function (x) { if (ui.dash) ui.dash.wait = x.wait; [].forEach.call(document.querySelectorAll('.wt'), function (w) { w.outerHTML = waitBox(x.wait); }); toast(v == null ? 'وقت الانتظار اتخفى من صفحة المرضى' : '⏱ المرضى شايفين: ' + (v ? '~' + v + ' دقيقة انتظار' : 'مفيش انتظار')); }).catch(function (er) { toast(er.message); });
  });
  /* ── daily summary ── */
  function digestUI() {
    var el = $('dgBox'); if (!el) return;
    api('GET', 'digest').then(function (g) {
      el.innerHTML = '<section class="lx-card"><div class="lx-ch"><div><h3>📊 ملخص يومي لصاحب المركز</h3><small>كل يوم في الساعة اللي تختارها بيوصل إشعار على الأجهزة اللي شغّلت الإشعارات (' + g.devices + ' جهاز) — والملخص جاهز تبعته واتساب</small></div></div>' +
        '<div class="dg-r"><label class="ad-sw"><input type="checkbox" id="dgOn"' + (g.on ? ' checked' : '') + '><i></i><span>ابعت الملخص كل يوم</span></label><select class="fld" id="dgH">' + [18, 19, 20, 21, 22, 23].map(function (h) { return '<option value="' + h + '"' + (g.hour === h ? ' selected' : '') + '>الساعة ' + (h - 12) + ' بالليل</option>'; }).join('') + '</select></div>' +
        '<pre class="dg-p">' + esc(g.text) + '</pre><div class="bt" style="justify-content:flex-start"><button type="button" class="btn" id="dgW" style="background:#16A34A">ابعته على واتساب</button><button type="button" class="btn g" id="dgC">انسخ</button></div>' +
        (g.devices ? '' : '<p style="font-size:12.5px;color:#B45309;margin-top:8px">🔔 شغّل الإشعارات من الجرس اللي فوق عشان الملخص يوصلك لوحده.</p>') + '</section>';
      var save = function () { api('POST', 'digest', { on: $('dgOn').checked, hour: +$('dgH').value }).then(function () { toast('📊 الملخص اليومي اتظبط'); }).catch(function (e) { toast(e.message); }); };
      $('dgOn').onchange = save; $('dgH').onchange = save;
      $('dgW').onclick = function () { window.open('https://wa.me/?text=' + encodeURIComponent(g.text), '_blank', 'noopener'); };
      $('dgC').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(g.text) : Promise.reject()).then(function () { toast('اتنسخ ✓'); }).catch(function () {}); };
    }).catch(function () {});
  }
  /* ── phone dashboard as widgets: reorder / hide, remembered on this phone ── */
  var WKEY = 'qrd-w:' + C.code, WNAMES = { kp: 'الأرقام', wt: 'وقت الانتظار', fo: 'المتابعات', ch: 'مسح اليوم', qa: 'اختصارات' };
  function wPrefs() { try { return JSON.parse(localStorage.getItem(WKEY) || 'null') || { order: ['kp', 'wt', 'fo', 'ch', 'qa'], hide: [] }; } catch (e) { return { order: ['kp', 'wt', 'fo', 'ch', 'qa'], hide: [] }; } }
  function wApply() {
    var d = $('qrdD'); if (!d) return; var P = wPrefs(), ed = d.classList.contains('wed');
    Object.keys(WNAMES).forEach(function (k) { if (P.order.indexOf(k) < 0) P.order.push(k); });
    P.order.forEach(function (k, i) { var w = d.querySelector('[data-w="' + k + '"]'); if (!w) return; w.style.order = i + 1; w.classList.toggle('w-off', P.hide.indexOf(k) > -1); w.hidden = !ed && P.hide.indexOf(k) > -1; });
  }
  function wSetup() {
    var d = $('qrdD'); if (!d || d.dataset.w) return; d.dataset.w = '1';
    var map = { kp: '.qrdd-kp', ch: '.qrdd-ch', qa: '.qrdd-qa' };
    Object.keys(map).forEach(function (k) { var n = d.querySelector(map[k]); if (n) n.dataset.w = k; });
    d.insertAdjacentHTML('afterbegin', '<div class="w-top"><b>النهارده</b><button type="button" class="w-ed" id="wEd">✎ رتّب</button></div>');
    var wt = document.createElement('div'); wt.dataset.w = 'wt'; wt.className = 'qrdd-w'; d.appendChild(wt);
    var fo = document.createElement('button'); fo.type = 'button'; fo.dataset.w = 'fo'; fo.className = 'qrdd-w qrdd-fo'; fo.setAttribute('data-page-nav', 'follow'); d.appendChild(fo);
    [].forEach.call(d.querySelectorAll('[data-w]'), function (w) { w.insertAdjacentHTML('afterbegin', '<div class="w-ctl"><span>' + WNAMES[w.dataset.w] + '</span><button type="button" data-wm="-1">▲</button><button type="button" data-wm="1">▼</button><button type="button" data-wm="h">👁</button></div>'); });
    d.addEventListener('click', function (e) {
      var m = e.target.closest('[data-wm]'); if (m) { e.preventDefault(); e.stopPropagation(); var k = m.closest('[data-w]').dataset.w, P = wPrefs(), i = P.order.indexOf(k);
        if (m.dataset.wm === 'h') { var j = P.hide.indexOf(k); if (j > -1) P.hide.splice(j, 1); else P.hide.push(k); }
        else { var to = i + (+m.dataset.wm); if (to >= 0 && to < P.order.length) P.order.splice(to, 0, P.order.splice(i, 1)[0]); }
        try { localStorage.setItem(WKEY, JSON.stringify(P)); } catch (er) {} wApply(); return; }
      if (e.target.closest('#wEd')) { d.classList.toggle('wed'); $('wEd').textContent = d.classList.contains('wed') ? '✓ تمام' : '✎ رتّب'; wApply(); }
    }, true);
    wApply(); wPaint();
  }
  function wPaint() {
    var d = $('qrdD'), D = ui.dash; if (!d || !D) return;
    var wt = d.querySelector('[data-w="wt"]'); if (wt) { var c = wt.querySelector('.w-ctl'); wt.innerHTML = waitBox(D.wait); if (c) wt.insertBefore(c, wt.firstChild); }
    var fo = d.querySelector('[data-w="fo"]'); if (fo) { var c2 = fo.querySelector('.w-ctl'); fo.innerHTML = '<span class="lx-fi" style="--c:#F59E0B">🔁</span><b>متابعات مستحقة<small>' + (D.follow ? 'كلّمهم يحجزوا' : 'مفيش حد النهارده') + '</small></b><em>' + n0(D.follow || 0) + '</em>'; if (c2) fo.insertBefore(c2, fo.firstChild); }
    wApply();
  }
  function adsSave(x) { ui.ads = x.ads || ui.ads; adsUI(); dashSoon(); }
  function studioWire(el) {
    $('stAd').onclick = function () { editSlide(null); };
    $('slAdd').onclick = function () { $('slF').click(); };
    $('slF').onchange = function () {
      var files = [].slice.call(this.files || []); this.value = ''; if (!files.length) return;
      toast('⏳ بنجهّز ' + files.length + (files.length > 1 ? ' صور…' : ' صورة…'));
      var i = 0; (function nx() {
        if (i >= files.length) { toast('🖼 الصور اتضافت للسلايدر'); return; }
        adImg(files[i++]).then(function (d) { return api('POST', 'ads', { kind: 'slide', image: d, title: '', active: true }); }).then(function (x) { adsSave(x); nx(); }).catch(function (e) { toast(e.message); nx(); });
      })();
    };
    $('stRs').onclick = function () { if (!confirm('ترجّع الشرائح الجاهزة الأربعة زي الأول؟ (الإعلانات والصور بتاعتك مش هتتمسح)')) return; api('POST', 'slides-reset').then(function (x) { adsSave(x); toast('↺ الشرائح الجاهزة رجعت'); }).catch(function (e) { toast(e.message); }); };
    $('stMs').onchange = function () { var v = +this.value; api('POST', 'slide-ms', { ms: v }).then(function (x) { ui.slMs = x.ms; studioPreview(); toast('⏱ كل شريحة ' + Math.round(x.ms / 1000) + ' ثواني'); }).catch(function (e) { toast(e.message); }); };
    var list = $('stL'), order = function () { return [].map.call(list.querySelectorAll('[data-ad]'), function (li) { return +li.dataset.ad; }); };
    var saveOrder = function () { api('POST', 'ads-order', { ids: order() }).then(function (x) { adsSave(x); toast('↕ الترتيب اتحفظ'); }).catch(function (e) { toast(e.message); }); };
    [].forEach.call(list.querySelectorAll('[data-ad]'), function (li) {
      var id = +li.dataset.ad, a = (ui.ads || []).filter(function (x) { return x.id === id; })[0]; if (!a) return;
      li.addEventListener('dragstart', function (e) { li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(id)); } catch (er) {} });
      li.addEventListener('dragend', function () { li.classList.remove('dragging'); var now = order().join(','); if (now !== li.dataset.o) saveOrder(); });
      li.addEventListener('dragover', function (e) { e.preventDefault(); var d = list.querySelector('.dragging'); if (!d || d === li) return; var r = li.getBoundingClientRect(); list.insertBefore(d, e.clientY < r.top + r.height / 2 ? li : li.nextSibling); });
      li.dataset.o = order().join(',');
      li.addEventListener('click', function (e) { if (e.target.closest('button,label,input')) return; var L = liveSlides(), k = L.indexOf(a); if (k > -1 && ui.stGo) ui.stGo(k); });
      [].forEach.call(li.querySelectorAll('[data-ada]'), function (b) {
        var run = function () {
          var k = b.dataset.ada;
          if (k === 'edit') return editSlide(a);
          if (k === 'up' || k === 'down') { var ids = order(), i = ids.indexOf(id), j = k === 'up' ? i - 1 : i + 1; if (j < 0 || j >= ids.length) return; ids.splice(j, 0, ids.splice(i, 1)[0]); return api('POST', 'ads-order', { ids: ids }).then(adsSave).catch(function (e) { toast(e.message); }); }
          if (k === 'delete' && !confirm(a.kind === 'slide' ? 'تمسح الصورة دي من السلايدر؟' : 'تمسح شريحة «' + (a.title || '') + '»؟' + (a.kind === 'base' ? '\nتقدر ترجّعها بزرار «↺ الجاهزة».' : ''))) { if (b.type === 'checkbox') b.checked = !b.checked; return; }
          api('POST', 'ads/' + id + '/' + k).then(function (x) { if (ui.adEdit && ui.adEdit.id === id && k === 'delete') ui.adEdit = null; adsSave(x); }).catch(function (e) { toast(e.message); });
        };
        if (b.type === 'checkbox') b.onchange = run; else b.onclick = run;
      });
    });
  }
  document.addEventListener('click', function (e) {
    var m = e.target.closest && e.target.closest('[data-menu]');
    [].forEach.call(document.querySelectorAll('.lx-dd'), function (d) { if (!m || d !== m.nextElementSibling) d.hidden = true; });
    if (m) { var dd = m.nextElementSibling; dd.hidden = !dd.hidden; }
  });

  /* ════════ 5.16 · complaints: password-protected delete / reset + a PDF analysis of every complaint ════════ */
  function askPass(title, note, danger, run) {
    var o = modal('<h3>' + title + '</h3><p>' + note + '</p><label class="l" for="pwI" style="text-align:right;display:block;margin-top:10px">كلمة سر المدير</label>' +
      '<input class="fld" id="pwI" type="password" autocomplete="off" dir="ltr" style="width:100%;text-align:center;letter-spacing:2px"><p class="pw-er" id="pwE"></p>' +
      '<div class="bt"><button class="btn' + (danger ? ' red' : '') + '" data-x="go">' + (danger ? '🗑 تأكيد المسح' : 'تأكيد') + '</button><button class="btn g" data-x="cl">إلغاء</button></div>',
      function (k, close, x) {
        if (k !== 'go') return; var i = $('pwI'), v = i.value; if (!v) { i.focus(); return; }
        x.disabled = true; $('pwE').textContent = '';
        run(v).then(function () { close(); }).catch(function (e) { x.disabled = false; $('pwE').textContent = e.message || 'حصلت مشكلة'; i.value = ''; i.focus(); });
      });
    setTimeout(function () { var i = $('pwI'); if (i) { i.focus(); i.onkeydown = function (e) { if (e.key === 'Enter') o.querySelector('[data-x="go"]').click(); }; } }, 60);
  }
  function ticketDelete(id, name) {
    askPass('🗑 مسح الشكوى', 'هتتمسح شكوى «' + esc(name || 'مريض') + '» نهائي ومعاها الصور. اكتب كلمة سر المدير للتأكيد.', true, function (pw) {
      return api('POST', 'tickets/' + id + '/delete', { password: pw }).then(function (x) { ui.tickets = x.tickets || []; serviceTickets(); toast('🗑 الشكوى اتمسحت'); });
    });
  }
  function ticketReset() {
    askPass('⚠️ مسح كل الشكاوى (ريست)', 'هتتمسح <b>كل</b> الشكاوى — الجديدة واللي اتحلّت — ومش هتظهر في التحليل تاني. ننصحك تنزّل «تحليل الشكاوى PDF» الأول. اكتب كلمة سر المدير للتأكيد.', true, function (pw) {
      return api('POST', 'tickets-reset', { password: pw, kind: 'complaint' }).then(function (x) { ui.tickets = x.tickets || []; serviceTickets(); toast('✅ اتعمل ريست — اتمسحت ' + (x.removed || 0) + ' شكوى'); });
    });
  }
  function loadJs(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('مش قادر أحمّل أداة الـ PDF')); }; document.head.appendChild(s); }); }
  function tsOf(t) { var m = /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(t || '')); return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]).getTime() : 0; }
  function dmyOf(t) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(t || '')); return m ? (+m[3]) + '/' + (+m[2]) + '/' + m[1] : '—'; }
  function hrsTxt(h) { if (h < 1) return Math.max(1, Math.round(h * 60)) + ' دقيقة'; if (h < 48) return (Math.round(h * 10) / 10) + ' ساعة'; return Math.round(h / 24) + ' يوم'; }
  function complaintsReport(btn) {
    api('GET', 'tickets-all').then(function (x) {
      var L = (x.list || []).slice().sort(function (p, q) { return tsOf(p.at) - tsOf(q.at); });
      if (!L.length) { toast('مفيش شكاوى لسه علشان نحللها'); return; }
      return renderPdf(reportPages(L, analyse(L)), 'تحليل الشكاوى — ' + String(C.center || '').trim() + ' — ' + ymd() + '.pdf', btn, '⏳ بنجهّز التحليل…').then(function (n) { toast('📊 التحليل نزل PDF (' + n + ' صفحة)'); });
    }).catch(function (e) { toast(e.message || 'محصلش — جرّب تاني'); });
  }
  function analyse(L) {
    var A = { total: L.length, done: 0, open: 0, resp: [], subj: {}, wd: [0, 0, 0, 0, 0, 0, 0], slot: [0, 0, 0, 0, 0, 0, 0, 0], ph: {}, first: L[0].at, last: L[L.length - 1].at, series: [] };
    L.forEach(function (t) {
      if (t.status === 'done') { A.done++; if (t.updated_at) { var h = (tsOf(t.updated_at) - tsOf(t.at)) / 36e5; if (h >= 0) A.resp.push(h); } } else A.open++;
      var s = String(t.subject || 'من غير عنوان').trim() || 'من غير عنوان'; A.subj[s] = (A.subj[s] || 0) + 1;
      var d = new Date(tsOf(t.at)); A.wd[d.getDay()]++; A.slot[Math.floor(d.getHours() / 3)]++;
      var p = K.last10(t.phone) || t.phone; if (p) { A.ph[p] = A.ph[p] || { n: 0, name: t.name }; A.ph[p].n++; }
    });
    A.subjL = Object.keys(A.subj).map(function (k) { return [k, A.subj[k]]; }).sort(function (x, y) { return y[1] - x[1]; });
    A.rep = Object.keys(A.ph).filter(function (k) { return A.ph[k].n > 1; }).map(function (k) { return [A.ph[k].name, k, A.ph[k].n]; }).sort(function (x, y) { return y[2] - x[2]; });
    A.resp.sort(function (x, y) { return x - y; });
    A.avg = A.resp.length ? A.resp.reduce(function (s, v) { return s + v; }, 0) / A.resp.length : 0;
    A.med = A.resp.length ? A.resp[Math.floor(A.resp.length / 2)] : 0;
    /* time series: by day (≤ 31 days), week (≤ 120) or month */
    var t0 = tsOf(A.first), t1 = tsOf(A.last), span = (t1 - t0) / 864e5, unit = span <= 31 ? 'd' : span <= 120 ? 'w' : 'm', B = {}, keys = [];
    var keyOf = function (ts) { var d = new Date(ts); if (unit === 'm') return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); if (unit === 'w') { d.setDate(d.getDate() - d.getDay()); } return ymd(d); };
    for (var ts = t0, c = 0; ts <= t1 && c < 400; c++) { var k = keyOf(ts); if (keys.indexOf(k) < 0) keys.push(k); ts += unit === 'm' ? 27 * 864e5 : unit === 'w' ? 7 * 864e5 : 864e5; }
    L.forEach(function (t) { var k = keyOf(tsOf(t.at)); B[k] = (B[k] || 0) + 1; if (keys.indexOf(k) < 0) keys.push(k); });
    keys.sort(); A.unit = unit; A.series = keys.slice(-24).map(function (k) { return [k, B[k] || 0]; });
    return A;
  }
  var WDN = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'], SLN = ['12–3 ص', '3–6 ص', '6–9 ص', '9–12 ص', '12–3 م', '3–6 م', '6–9 م', '9–12 م'];
  function rpBars(rows, color, total) {
    var mx = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    return '<div class="rp-hb">' + rows.map(function (r) { return '<div class="rp-hr"><span class="rp-hl">' + esc(r[0]) + '</span><span class="rp-ht"><i style="width:' + Math.max(2, r[1] / mx * 100) + '%;background:' + color + '"></i></span><b>' + r[1] + '<small>' + (total ? Math.round(r[1] / total * 100) + '%' : '') + '</small></b></div>'; }).join('') + '</div>';
  }
  function rpCols(rows, color, lbl) {
    var mx = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    return '<div class="rp-cols">' + rows.map(function (r) { return '<div class="rp-c"><em>' + (r[1] || '') + '</em><i style="height:' + (r[1] ? Math.max(3, r[1] / mx * 100) : 0) + '%;background:' + color + '"></i><span>' + esc(lbl(r[0])) + '</span></div>'; }).join('') + '</div>';
  }
  function reportPages(L, A) {
    var head = function (sub) { return '<div class="rp-hd"><div class="rp-lg">' + (ui.logo ? '<img src="' + ui.logo + '" alt="">' : '<b>' + esc(String(C.center || 'م').trim().charAt(0)) + '</b>') + '</div><div><small>QR Patient · تقرير</small><h1>تحليل شكاوى المرضى</h1><p>' + esc(C.center || '') + ' · ' + sub + '</p></div></div>'; };
    var foot = function (n, N) { return '<div class="rp-ft"><span>' + esc(C.center || '') + ' · اتعمل ' + dmyOf(ymd()) + ' ' + hmOf(ymd() + ' ' + ('0' + new Date().getHours()).slice(-2) + ':' + ('0' + new Date().getMinutes()).slice(-2)) + '</span><span>صفحة ' + n + ' من ' + N + '</span></div>'; };
    var period = 'من ' + dmyOf(A.first) + ' لحد ' + dmyOf(A.last);
    var top = A.subjL[0], wdMax = A.wd.indexOf(Math.max.apply(null, A.wd)), slMax = A.slot.indexOf(Math.max.apply(null, A.slot));
    var ins = [
      'أكتر سبب للشكاوى هو «' + esc(top[0]) + '» — ' + top[1] + ' شكوى (' + Math.round(top[1] / A.total * 100) + '% من الكل).',
      'أكتر يوم بتيجي فيه شكاوى: <b>' + WDN[wdMax] + '</b>، وأكتر وقت: <b>' + SLN[slMax] + '</b>.',
      A.done ? 'المركز رد على ' + A.done + ' شكوى من ' + A.total + ' (' + Math.round(A.done / A.total * 100) + '%)' + (A.resp.length ? '، ومتوسط وقت الرد ' + hrsTxt(A.avg) + ' (النص: ' + hrsTxt(A.med) + ').' : '.') : 'لسه مفيش شكوى اتسجل إن المركز تواصل فيها.',
      A.open ? '<b>' + A.open + '</b> شكوى لسه مستنية تواصل.' : 'كل الشكاوى اتعمل فيها تواصل ✓',
      A.rep.length ? A.rep.length + ' مريض اشتكوا أكتر من مرة — محتاجين متابعة خاصة.' : 'مفيش مريض اشتكى أكتر من مرة.'
    ];
    var kp = [['إجمالي الشكاوى', A.total, '#E11D48'], ['اتعمل فيها تواصل', A.done, '#059669'], ['لسه مستنية', A.open, '#D97706'], ['متوسط وقت الرد', A.resp.length ? hrsTxt(A.avg) : '—', '#4F46E5']];
    var lbl = function (k) { if (A.unit === 'm') { var p = k.split('-'); return (+p[1]) + '/' + p[0].slice(2); } var q = k.split('-'); return (+q[2]) + '/' + (+q[1]); };
    var p1 = head(period) +
      '<div class="rp-kp">' + kp.map(function (k) { return '<div style="--c:' + k[2] + '"><small>' + k[0] + '</small><b>' + k[1] + '</b></div>'; }).join('') + '</div>' +
      '<div class="rp-box"><h2>💡 أهم الملاحظات</h2><ul>' + ins.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>' +
      '<div class="rp-box"><h2>أسباب الشكاوى</h2>' + rpBars(A.subjL.slice(0, 9), '#E11D48', A.total) + '</div>' +
      '<div class="rp-box"><h2>عدد الشكاوى ' + (A.unit === 'd' ? 'كل يوم' : A.unit === 'w' ? 'كل أسبوع' : 'كل شهر') + '</h2>' + rpCols(A.series, '#4F46E5', lbl) + '</div>';
    var p2 = head(period) +
      '<div class="rp-two"><div class="rp-box"><h2>حسب يوم الأسبوع</h2>' + rpBars(WDN.map(function (n, i) { return [n, A.wd[i]]; }), '#0D9488', A.total) + '</div>' +
      '<div class="rp-box"><h2>حسب وقت اليوم</h2>' + rpBars(SLN.map(function (n, i) { return [n, A.slot[i]]; }), '#D97706', A.total) + '</div></div>' +
      '<div class="rp-box"><h2>حالة الشكاوى</h2><div class="rp-st"><div class="rp-sb"><i style="width:' + (A.done / A.total * 100) + '%"></i></div><p><span class="ok">● اتعمل تواصل ' + A.done + '</span><span class="wa">● مستنية ' + A.open + '</span></p></div></div>' +
      '<div class="rp-box"><h2>مرضى اشتكوا أكتر من مرة</h2>' + (A.rep.length ? '<table class="rp-t"><thead><tr><th>المريض</th><th>الموبايل</th><th>عدد الشكاوى</th></tr></thead><tbody>' + A.rep.slice(0, 12).map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td dir="ltr">' + esc(r[1]) + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="rp-mut">مفيش ✓</p>') + '</div>';
    var rows = L.slice().reverse(), PER = 17, chunks = [];
    for (var i = 0; i < rows.length; i += PER) chunks.push(rows.slice(i, i + PER));
    var N = 2 + chunks.length, out = ['<div class="rp-pg">' + p1 + foot(1, N) + '</div>', '<div class="rp-pg">' + p2 + foot(2, N) + '</div>'];
    chunks.forEach(function (ch, j) {
      out.push('<div class="rp-pg">' + head('كل الشكاوى · ' + period) + '<table class="rp-t rp-all"><thead><tr><th>التاريخ</th><th>المريض</th><th>العنوان</th><th>الشكوى</th><th>الحالة</th></tr></thead><tbody>' +
        ch.map(function (t) { var m = String(t.message || ''); return '<tr><td>' + dmyOf(t.at) + '<small>' + hmOf(t.at) + '</small></td><td><b>' + esc(t.name) + '</b><small dir="ltr">' + esc(t.phone) + '</small></td><td>' + esc(t.subject || '—') + '</td><td class="m">' + esc(m.length > 150 ? m.slice(0, 150) + '…' : m) + '</td><td>' + (t.status === 'done' ? '<span class="ok">اتعمل تواصل</span>' : '<span class="wa">مستنية</span>') + '</td></tr>'; }).join('') +
        '</tbody></table>' + foot(3 + j, N) + '</div>');
    });
    return out;
  }

  /* ════════ 5.21 · patients' ratings + the monthly center report ════════ */
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function monthName(m) { var p = String(m || '').split('-'); return MONTHS[(+p[1] || 1) - 1] + ' ' + p[0]; }
  function starsTxt(n) { var s = ''; for (var i = 1; i <= 5; i++) s += i <= Math.round(n) ? '★' : '☆'; return s; }
  /* one renderer for every PDF we make: HTML pages → images → A4 PDF */
  function renderPdf(pages, fname, btn, busyTxt) {
    if (btn) { btn.disabled = true; btn.dataset.t = btn.innerHTML; btn.innerHTML = busyTxt || '⏳ بنجهّز…'; }
    var reset = function () { if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.t; } };
    return Promise.all([window.jspdf ? 0 : loadJs('/vendor/jspdf/jspdf.umd.min.js'), window.modernScreenshot ? 0 : loadJs('/vendor/modern-screenshot.js')]).then(function () {
      var host = document.createElement('div'); host.className = 'rp-host'; host.innerHTML = pages.join(''); document.body.appendChild(host);
      var P = [].slice.call(host.querySelectorAll('.rp-pg')), doc = new jspdf.jsPDF({ unit: 'pt', format: 'a4', compress: true }), i = 0;
      return (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function nx() {
        if (i >= P.length) { host.remove(); doc.save(fname); reset(); return P.length; }
        return modernScreenshot.domToJpeg(P[i], { scale: 2, quality: 0.9, backgroundColor: '#ffffff', width: 794, height: 1123 }).then(function (d) { if (i) doc.addPage(); doc.addImage(d, 'JPEG', 0, 0, 595.28, 841.89); i++; return nx(); });
      }).catch(function (e) { host.remove(); throw e; });
    }).catch(function (e) { reset(); throw e; });
  }
  function rpHead(title, sub) { return '<div class="rp-hd"><div class="rp-lg">' + (ui.logo ? '<img src="' + ui.logo + '" alt="">' : '<b>' + esc(String(C.center || 'م').trim().charAt(0)) + '</b>') + '</div><div><small>QR Patient · تقرير</small><h1>' + title + '</h1><p>' + esc(C.center || '') + ' · ' + sub + '</p></div></div>'; }
  function rpFoot(n, N) { var d = new Date(); return '<div class="rp-ft"><span>' + esc(C.center || '') + ' · اتعمل ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + '</span><span>صفحة ' + n + ' من ' + N + '</span></div>'; }

  /* ── ratings page ── */
  function ratingsLoad() { api('GET', 'ratings?days=365').then(function (x) { ui.rates = x; ratingsUI(); }).catch(function (e) { var el = $('ratingsBox'); if (el) el.innerHTML = '<p class="lx-emp">' + esc(e.message) + '</p>'; }); }
  function ratingsUI() {
    var el = $('ratingsBox'), X = ui.rates; if (!el) return; if (!X) { el.innerHTML = '<div class="lx-stats">' + [1, 2, 3].map(function () { return '<div class="lx-st sk"></div>'; }).join('') + '</div>'; return; }
    var L = X.list || [], f = ui.rtF || 'all', q = (ui.rtQ || '').toLowerCase(), d30 = ymd(new Date(Date.now() - 29 * 864e5));
    var M = L.filter(function (r) { return String(r.at).slice(0, 10) >= d30; }), n = M.length, avg = n ? M.reduce(function (a, r) { return a + r.stars; }, 0) / n : 0, happy = M.filter(function (r) { return r.stars >= 4; }).length;
    var dist = [5, 4, 3, 2, 1].map(function (k) { return [k, M.filter(function (r) { return r.stars === k; }).length]; }), mx = Math.max.apply(null, dist.map(function (d) { return d[1]; }).concat([1]));
    var tg = {}; M.forEach(function (r) { (r.tags || []).forEach(function (t) { tg[t] = (tg[t] || 0) + 1; }); });
    var good = (X.tags || []).slice(0, 4), tagRows = Object.keys(tg).sort(function (a, b) { return tg[b] - tg[a]; });
    var months = (X.months || []).slice(0, 6).reverse();
    var V = L.filter(function (r) { return (f === 'all' || (f === 'low' ? r.stars <= 2 : f === 'mid' ? r.stars === 3 : r.stars >= 4)) && (!q || (r.patient + ' ' + r.exam + ' ' + r.note + ' ' + (r.tags || []).join(' ')).toLowerCase().indexOf(q) > -1); });
    el.innerHTML = '<div class="lx-stats rt-stats">' +
        lxStat({ l: 'متوسط التقييم — آخر 30 يوم', v: 0, i: 'eye', c: '#F59E0B', d: n ? starsTxt(avg) + ' من ' + n + ' تقييم' : 'لسه مفيش تقييمات' }).replace('<b class="lx-st-v">0</b>', '<b class="lx-st-v">' + (n ? avg.toFixed(1) : '—') + '<small> / 5</small></b>') +
        lxStat({ l: 'نسبة الرضا (4 و 5 نجوم)', v: 0, i: 'check', c: '#059669', d: n ? happy + ' راضيين من ' + n : '—', tone: n && happy / n >= 0.8 ? 'up' : n ? 'warn' : '' }).replace('<b class="lx-st-v">0</b>', '<b class="lx-st-v">' + (n ? Math.round(happy / n * 100) + '%' : '—') + '</b>') +
        lxStat({ l: 'كل التقييمات', v: L.length, i: 'inbox', c: '#6366F1', d: (L.filter(function (r) { return r.stars <= 2; }).length) + ' تقييم ضعيف محتاج متابعة', tone: L.some(function (r) { return r.stars <= 2; }) ? 'warn' : '' }) + '</div>' +
      '<div class="lx-row rt-row"><section class="lx-card"><div class="lx-ch"><div><h3>توزيع النجوم</h3><small>آخر 30 يوم</small></div></div><div class="rt-dist">' +
        dist.map(function (d) { return '<div><span>' + d[0] + ' ★</span><i><b style="width:' + (d[1] / mx * 100) + '%;background:' + (d[0] >= 4 ? '#10B981' : d[0] === 3 ? '#F59E0B' : '#EF4444') + '"></b></i><em>' + d[1] + '</em></div>'; }).join('') + '</div>' +
        '<div class="rt-mo">' + (months.length ? months.map(function (m) { var p = m.n ? Math.round(m.happy / m.n * 100) : 0; return '<div><b style="height:' + Math.max(4, p) + '%"></b><span>' + MONTHS[+m.m.slice(5) - 1].slice(0, 3) + '</span><em>' + p + '%</em></div>'; }).join('') : '<p class="lx-emp">نسبة الرضا كل شهر هتظهر هنا</p>') + '</div></section>' +
      '<section class="lx-card"><div class="lx-ch"><div><h3>المرضى قالوا إيه</h3><small>أكتر الأسباب اللي اختاروها</small></div></div><div class="rt-tags">' +
        (tagRows.length ? tagRows.map(function (t) { return '<span class="' + (good.indexOf(t) > -1 ? 'g' : 'b') + '">' + esc(t) + '<em>' + tg[t] + '</em></span>'; }).join('') : '<p class="lx-emp">لسه مفيش أسباب</p>') + '</div>' +
        '<div class="lx-qa"><button type="button" class="btn" id="rtRep">' + ic('down') + ' التقرير الشهري PDF</button></div></section></div>' +
      '<section class="lx-card"><div class="lx-ch"><div><h3>كل التقييمات</h3><small>' + V.length + ' تقييم</small></div>' +
        '<div class="st-top"><div class="lx-seg">' + [['all', 'الكل'], ['low', '1–2 ★'], ['mid', '3 ★'], ['high', '4–5 ★']].map(function (x) { return '<button type="button" data-rtf="' + x[0] + '" class="' + (f === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<label class="qx-s wf-s">' + ic('search') + '<input type="search" id="rtQ" placeholder="ابحث" value="' + esc(ui.rtQ || '') + '"></label></div></div>' +
        (V.length ? '<div class="lx-tw"><table class="lx-t"><thead><tr><th>المريض</th><th>التقييم</th><th>الأسباب</th><th>ملاحظة</th><th>إمتى</th></tr></thead><tbody>' + V.slice(0, 200).map(function (r) {
          return '<tr><td><div class="lx-pt">' + qxAv(r.patient || '★') + '<div><b>' + esc(r.patient || (/^h:/.test(r.token || '') ? 'زائر صفحة المركز' : '—')) + '</b><span class="n">' + esc(r.exam || (/^h:/.test(r.token || '') ? 'قيّم قبل ما يفتح نتيجته' : '')) + '</span></div></div></td><td><span class="rt-s s' + r.stars + '">' + starsTxt(r.stars) + '</span></td>' +
            '<td>' + ((r.tags || []).map(function (t) { return '<span class="rt-chip' + (good.indexOf(t) > -1 ? ' g' : '') + '">' + esc(t) + '</span>'; }).join('') || '<span class="mut">—</span>') + '</td><td class="rt-note">' + (r.note ? esc(r.note) : '<span class="mut">—</span>') + '</td><td class="mut">' + when(r.at) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="lx-emp">⭐ أول ما المرضى يقيّموا بعد فتح نتيجتهم، التقييمات هتظهر هنا لحظيًا.</p>') + '</section>';
    [].forEach.call(el.querySelectorAll('[data-rtf]'), function (b) { b.onclick = function () { ui.rtF = b.dataset.rtf; ratingsUI(); }; });
    var qi = $('rtQ'); if (qi) qi.oninput = function () { ui.rtQ = qi.value; clearTimeout(ui.rtQT); ui.rtQT = setTimeout(function () { ratingsUI(); var n2 = $('rtQ'); if (n2) { n2.focus(); n2.setSelectionRange(n2.value.length, n2.value.length); } }, 250); };
    $('rtRep').onclick = function () { monthReportAsk(); };
  }

  /* ── monthly report ── */
  function monthReportAsk() {
    var opts = [], d = new Date(); for (var i = 0; i < 12; i++) { var m = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); opts.push(m); d.setDate(1); d.setMonth(d.getMonth() - 1); }
    modal('<h3>📄 التقرير الشهري</h3><p>كل أرقام الشهر في PDF: الحالات، فتح النتائج والباركود، الحجوزات، الشكاوى، ورضا المرضى — ومقارنة بالشهر اللي قبله.</p>' +
      '<label class="l" for="rmM" style="display:block;text-align:right;margin-top:10px">الشهر</label><select class="fld" id="rmM" style="width:100%">' + opts.map(function (m, i) { return '<option value="' + m + '">' + monthName(m) + (i ? '' : ' (الشهر الحالي)') + '</option>'; }).join('') + '</select>' +
      '<div class="bt"><button class="btn" data-x="go">' + ic('down') + ' نزّل PDF</button><button class="btn g" data-x="cl">إلغاء</button></div>',
      function (k, close, x) { if (k !== 'go') return; var m = $('rmM').value; monthReport(m, x).then(function () { close(); }).catch(function () {}); });
  }
  function delta(a, b, inv) { if (!b && !a) return '<em class="z">—</em>'; if (!b) return '<em class="up">جديد</em>'; var p = Math.round((a - b) / b * 100), good = inv ? p <= 0 : p >= 0; return '<em class="' + (p === 0 ? 'z' : good ? 'up' : 'dn') + '">' + (p > 0 ? '▲ ' : p < 0 ? '▼ ' : '') + Math.abs(p) + '%</em>'; }
  function monthReport(m, btn) {
    return api('GET', 'report?month=' + m).then(function (x) {
      var R = x.report, c = R.cur, p = R.prev, pages = reportMonthPages(R, m);
      return renderPdf(pages, 'التقرير الشهري — ' + String(C.center || '').trim() + ' — ' + monthName(m) + '.pdf', btn, '⏳ بنجهّز التقرير…').then(function (n) { toast('📄 التقرير الشهري نزل (' + n + ' صفحات)'); });
    }).catch(function (e) { toast(e.message || 'محصلش — جرّب تاني'); throw e; });
  }
  function reportMonthPages(R, m) {
    var c = R.cur, p = R.prev, pm = monthName(p.month);
    var kp = [['الحالات المرفوعة', c.cases, p.cases, '#4F46E5'], ['مرات فتح النتائج', c.views, p.views, '#0D9488'], ['مسح الباركود الثابت', c.qr, p.qr, '#0891B2'], ['طلبات الحجز', c.bookings, p.bookings, '#7C3AED'],
      ['طلبات النتائج', c.asks, p.asks, '#D97706'], ['الشكاوى', c.complaints, p.complaints, '#E11D48', true], ['طلبات التقارير', c.reports, p.reports, '#B45309'], ['رضا المرضى', c.rated ? c.stars.toFixed(1) + ' ★' : '—', 0, '#F59E0B']];
    var openRate = c.cases ? Math.round(c.opened / c.cases * 100) : 0, top = R.exams[0], hoursSl = [0, 0, 0, 0, 0, 0, 0, 0]; R.hours.forEach(function (v, h) { hoursSl[Math.floor(h / 3)] += v; });
    var peak = hoursSl.indexOf(Math.max.apply(null, hoursSl));
    var ins = [
      'اترفع ' + c.cases + ' حالة' + (c.dicom ? ' (منها ' + c.dicom + ' DICOM)' : '') + ' — ' + (p.cases ? (c.cases >= p.cases ? 'زيادة' : 'أقل') + ' عن ' + pm + ' بـ ' + Math.abs(c.cases - p.cases) + '.' : 'أول شهر فيه أرقام للمقارنة.'),
      c.cases ? openRate + '% من مرضى الشهر فتحوا نتيجتهم (' + c.opened + ' من ' + c.cases + ').' : 'مفيش حالات اترفعت الشهر ده.',
      top ? 'أكتر فحص: «' + esc(top.e) + '» — ' + top.n + ' حالة.' : '',
      c.qr ? 'الباركود الثابت اتفتح ' + c.qr + ' مرة، وأكتر وقت: ' + SLN[peak] + '.' : 'الباركود الثابت ما اتفتحش الشهر ده.',
      c.bookings ? 'وصل ' + c.bookings + ' طلب حجز، اتعمل تواصل في ' + c.bookDone + ' منهم (' + Math.round(c.bookDone / c.bookings * 100) + '%).' : 'مفيش طلبات حجز.',
      c.complaints ? c.complaints + ' شكوى، واتحلّ ' + c.compDone + ' (' + Math.round(c.compDone / c.complaints * 100) + '%)' + (p.complaints ? ' — ' + (c.complaints <= p.complaints ? 'أقل' : 'أكتر') + ' من ' + pm + '.' : '.') : 'مفيش شكاوى الشهر ده 👏',
      c.rated ? 'متوسط تقييم المرضى ' + c.stars.toFixed(1) + ' من 5 من ' + c.rated + ' تقييم، و' + Math.round(c.happy / c.rated * 100) + '% راضيين (4–5 نجوم).' : 'لسه مفيش تقييمات من المرضى.'
    ].filter(Boolean);
    var dayKeys = [], first = new Date(m + '-01T12:00:00'), dd = new Date(first); while (dd.getMonth() === first.getMonth()) { dayKeys.push(ymd(dd)); dd.setDate(dd.getDate() + 1); }
    var ser = function (k) { return dayKeys.map(function (d) { return [d, (R.days[d] || {})[k] || 0]; }); }, lbl = function (d) { var n = +d.slice(8); return n === 1 || n % 5 === 0 ? String(n) : ''; };
    var p1 = rpHead('التقرير الشهري — ' + monthName(m), 'مقارنة بـ ' + pm) +
      '<div class="rp-kp rp-kp8">' + kp.map(function (k) { return '<div style="--c:' + k[3] + '"><small>' + k[0] + '</small><b>' + k[1] + '</b>' + (k[0] === 'رضا المرضى' ? '<em class="z">' + (c.rated ? c.rated + ' تقييم' : '') + '</em>' : delta(+k[1], k[2], k[4])) + '</div>'; }).join('') + '</div>' +
      '<div class="rp-box"><h2>💡 ملخص الشهر</h2><ul>' + ins.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>' +
      '<div class="rp-box"><h2>الحالات المرفوعة كل يوم</h2>' + rpCols(ser('cases'), '#4F46E5', lbl) + '</div>' +
      '<div class="rp-box"><h2>مسح الباركود الثابت كل يوم</h2>' + rpCols(ser('qr'), '#0891B2', lbl) + '</div>';
    var p2 = rpHead('التقرير الشهري — ' + monthName(m), 'التفاصيل') +
      '<div class="rp-two"><div class="rp-box"><h2>أكتر الفحوصات</h2>' + (R.exams.length ? rpBars(R.exams.map(function (e) { return [e.e, e.n]; }), '#4F46E5', c.cases) : '<p class="rp-mut">—</p>') + '</div>' +
      '<div class="rp-box"><h2>الحجوزات حسب الفحص</h2>' + (R.bookExams.length ? rpBars(R.bookExams.map(function (e) { return [e.e, e.n]; }), '#7C3AED', c.bookings) : '<p class="rp-mut">مفيش حجوزات</p>') + '</div></div>' +
      '<div class="rp-two"><div class="rp-box"><h2>أوقات مسح الباركود</h2>' + rpBars(SLN.map(function (n, i) { return [n, hoursSl[i]]; }), '#0891B2', c.qr) + '</div>' +
      '<div class="rp-box"><h2>أسباب الشكاوى</h2>' + (R.subj.length ? rpBars(R.subj.map(function (e) { return [e.e, e.n]; }), '#E11D48', c.complaints) : '<p class="rp-mut">مفيش شكاوى 👏</p>') +
        '<div class="rp-st" style="margin-top:12px"><div class="rp-sb"><i style="width:' + (c.complaints ? c.compDone / c.complaints * 100 : 100) + '%"></i></div><p><span class="ok">● اتحلّت ' + c.compDone + '</span><span class="wa">● مستنية ' + (c.complaints - c.compDone) + '</span></p></div></div></div>' +
      '<div class="rp-box"><h2>⭐ رضا المرضى</h2>' + (c.rated ? '<div class="rp-two rp-rate"><div>' + rpBars([5, 4, 3, 2, 1].map(function (k) { return [k + ' نجوم', c.dist[k - 1]]; }), '#F59E0B', c.rated) + '</div><div>' +
          (R.tags.length ? rpBars(R.tags.slice(0, 6).map(function (t) { return [t[0], t[1]]; }), '#10B981', c.rated) : '<p class="rp-mut">مفيش أسباب</p>') + '</div></div>' +
          (R.notes.length ? '<table class="rp-t" style="margin-top:12px"><thead><tr><th>التقييم</th><th>الملاحظة</th><th>المريض</th></tr></thead><tbody>' + R.notes.slice(0, 6).map(function (n) { return '<tr><td style="color:#F59E0B;white-space:nowrap">' + starsTxt(n.stars) + '</td><td>' + esc(n.note) + '</td><td>' + esc(n.patient || '') + '</td></tr>'; }).join('') + '</tbody></table>' : '')
        : '<p class="rp-mut">لسه مفيش تقييمات الشهر ده — التقييم بيظهر للمريض بعد ما يفتح نتيجته.</p>') + '</div>';
    return ['<div class="rp-pg">' + p1 + rpFoot(1, 2) + '</div>', '<div class="rp-pg">' + p2 + rpFoot(2, 2) + '</div>'];
  }

  /* ── the list ── */
  function inF(r) {
    var d = String(r.at || '').slice(0, 10);
    if (ui.f === 'today') return d === ymd();
    if (ui.f === 'week') return d >= ymd(new Date(Date.now() - 6 * 864e5));
    if (ui.f === 'off') return !r.active;
    if (ui.f === 'new') return !r.views && r.active;
    return true;
  }
  function chips() {
    var F = [['all', 'الكل'], ['today', 'النهارده'], ['week', 'الأسبوع'], ['new', 'لسه متفتحتش'], ['off', 'موقوفة']], save = ui.f, fl = $('fl');
    fl.innerHTML = '<i class="ind"></i>' + F.map(function (x) { ui.f = x[0]; var n = ui.list.filter(inF).length; return '<button data-f="' + x[0] + '" class="' + (save === x[0] ? 'on' : '') + '">' + x[1] + '<em>' + n + '</em></button>'; }).join('');
    ui.f = save;
    var ind = fl.querySelector('.ind'), on = fl.querySelector('button.on');
    if (ui.ind) { ind.style.transition = 'none'; ind.style.left = ui.ind[0] + 'px'; ind.style.width = ui.ind[1] + 'px'; }
    if (on) requestAnimationFrame(function () { ind.style.transition = ''; ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; ui.ind = [on.offsetLeft, on.offsetWidth]; });
    [].forEach.call(fl.querySelectorAll('button'), function (b) { b.onclick = function () { ui.f = b.dataset.f; table(); }; });
  }
  function table() {
    chips();
    var q = ui.q.toLowerCase(), L = ui.list.filter(inF).filter(function (r) { return !q || String(r.patient).toLowerCase().indexOf(q) > -1 || String(r.phone || '').indexOf(q) > -1 || String(r.exam || '').toLowerCase().indexOf(q) > -1; });
    var lc = $('lc'); if (lc) lc.textContent = L.length ? L.length + ' حالة' : '';
    if (!L.length) { var srch = q || ui.f !== 'all'; $('tbl').innerHTML = '<div class="emp"><svg class="ill" viewBox="0 0 120 96" fill="none"><rect x="26" y="14" width="56" height="70" rx="10" fill="#EEF2FF" stroke="#C7CAF7" stroke-width="2"/><path d="M38 34h32M38 46h24M38 58h28" stroke="#A5B4FC" stroke-width="4" stroke-linecap="round"/>' + (srch ? '<circle cx="84" cy="62" r="16" fill="#fff" stroke="#6366F1" stroke-width="4"/><path d="M96 74l10 10" stroke="#6366F1" stroke-width="5" stroke-linecap="round"/>' : '<circle cx="88" cy="66" r="16" fill="url(#eg)"/><path d="M88 58v16M80 66h16" stroke="#fff" stroke-width="4" stroke-linecap="round"/><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4F46E5"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs>') + '</svg><b>' + (srch ? 'مفيش حالات هنا' : 'لسه مفيش حالات') + '</b>' + (srch ? 'غيّر البحث أو الفلتر' : 'اسحب أول PDF فوق وهيطلعله باركود على طول') + '</div>'; return; }
    /* 5.15 · one data table, paged (20 per page), day groups as thin separators, extra actions in a menu */
    var PER = 20, key = ui.f + '|' + q; if (ui.cpKey !== key) { ui.cpKey = key; ui.cp = 0; }
    var pages = Math.ceil(L.length / PER); ui.cp = Math.max(0, Math.min(ui.cp || 0, pages - 1));
    var P = L.slice(ui.cp * PER, ui.cp * PER + PER), last = '', body = '';
    P.forEach(function (r) {
      var d = dayOf(r.at); if (d !== last) { last = d; var n = L.filter(function (x) { return dayOf(x.at) === d; }).length; body += '<tr class="lx-g"><td colspan="7"><span>' + esc(d) + '</span><em>' + n + ' حالة</em></td></tr>'; }
      var loc = ui.local[r.token], days = r.cached ? Math.max(1, Math.ceil((r.cache_until - Date.now()) / 864e5)) : 0;
      var st = !r.active ? '<span class="lx-st2 of">⏸ موقوفة</span>' : (r.kind === 'dicom' && !r.cached ? '<span class="lx-st2 pc" title="صور الـ DICOM مش مترفوعة على السيرفر — بتوصل للمريض من الكمبيوتر اللي عليه الحالة وهو شغال">🔒 PACS على الكمبيوتر</span>' : '') + (loc ? '<span class="lx-st2 on" title="الملف الأصلي على الكمبيوتر ده">💾 الجهاز ده</span>' : '') + (r.cached ? '<span class="lx-st2 nw" title="نسخة مشفّرة مؤقتة على السيرفر">☁ ' + days + ' يوم</span>' : '') + (!loc && !r.cached ? '<span class="lx-st2 ex">⚠ جهاز تاني</span>' : '') + (r.wrapped ? '<span class="lx-st2 pn" title="المريض يلاقيها بالباركود الثابت">📌 ثابت</span>' : (r.phone ? '' : '<span class="lx-st2 of" title="من غير موبايل — مش هتتلاقى بالباركود الثابت">📵</span>'));
      var qr = loc ? '<button type="button" class="lx-q" data-qr="' + r.token + '" title="كبّر الباركود">' + qrSvg(linkOf(r.token)) + '</button>' : '<span class="lx-q na" title="الباركود متاح على الجهاز اللي اترفعت منه">▦</span>';
      var acts = (loc && r.active ? '<button class="lx-ib" data-a="qr" data-tip="الباركود">' + ic('qr') + '</button><button class="lx-ib" data-a="print" data-tip="اطبع استيكر">' + ic('print') + '</button>' + (r.phone ? '<button class="lx-ib wa" data-a="wa" data-tip="واتساب للمريض">' + ic('wa') + '</button>' : '') : '') +
        '<div class="lx-mn"><button type="button" class="lx-ib" data-menu data-tip="المزيد">' + ic('dots') + '</button><div class="lx-dd" hidden>' +
        (r.active ? '<button data-a="stop">' + ic('pause') + ' وقّف الحالة</button>' : '<button data-a="start">' + ic('play') + ' شغّل الحالة</button>') +
        (r.kind === 'dicom' && loc ? '<button data-a="pacs">🩻 افتح في الـ PACS</button>' : '') + '<button data-a="views">' + ic('eye') + ' مين فتحها</button><button data-a="doc">👨‍⚕️ الدكتور المحوّل</button><button data-a="fol">🔁 ميعاد المتابعة' + (r.follow_at && !r.follow_done ? ' · ' + dmyOf(r.follow_at) : '') + '</button><button data-a="del" class="dl">' + ic('trash') + ' امسح الحالة</button></div></div>';
      body += '<tr class="lx-cr' + (r.active ? '' : ' off') + '" data-t="' + r.token + '" style="--x:' + exColor(r.exam) + '">' +
        '<td><div class="lx-pt">' + qr + '<div><b title="' + esc(r.patient) + '">' + esc(r.patient) + '</b><span class="n">' + esc(r.phone || '—') + '</span></div></div></td>' +
        '<td><span class="lx-b" style="--x:' + exColor(r.exam) + '">' + esc(r.exam || 'فحص') + '</span></td>' +
        '<td class="mut">' + (r.kind === 'dicom' ? '🩻 DICOM · ' + (r.pages || 0) + ' صورة' : 'PDF · ' + (r.pages || 1) + ' صفحة') + '<small>' + mb(r.size || 0) + '</small></td>' +
        '<td class="mut">' + hmOf(r.at) + '</td>' +
        '<td><button type="button" class="vw' + (r.views ? ' on' : '') + '" data-vw="' + r.token + '" title="مين فتح الحالة وإمتى" id="vw-' + r.token + '">' + ic('eye') + (r.views ? r.views : 'لسه') + '</button><small class="lv" id="lv-' + r.token + '">' + (r.last_view ? when(r.last_view) : '') + '</small></td>' +
        '<td><div class="lx-sts">' + st + '</div></td><td class="lx-acts">' + acts + '</td></tr>';
    });
    $('tbl').innerHTML = '<div class="lx-tw"><table class="lx-t lx-ct"><thead><tr><th>المريض</th><th>الفحص</th><th>الملف</th><th>اترفعت</th><th>الفتح</th><th>الحالة</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      (pages > 1 ? '<div class="lx-pg"><span>عرض ' + (ui.cp * PER + 1) + '–' + Math.min(L.length, ui.cp * PER + PER) + ' من ' + L.length + '</span><div><button type="button" class="btn g sm" data-pg="-1"' + (ui.cp ? '' : ' disabled') + '>→ السابق</button><b>' + (ui.cp + 1) + ' / ' + pages + '</b><button type="button" class="btn g sm" data-pg="1"' + (ui.cp < pages - 1 ? '' : ' disabled') + '>التالي ←</button></div></div>' : '');
    [].forEach.call($('tbl').querySelectorAll('[data-qr]'), function (x) { x.onclick = function () { showQr(x.dataset.qr); }; });
    [].forEach.call($('tbl').querySelectorAll('[data-vw]'), function (x) { x.onclick = function () { viewsModal(x.dataset.vw); }; });
    [].forEach.call($('tbl').querySelectorAll('[data-pg]'), function (x) { x.onclick = function () { ui.cp += +x.dataset.pg; table(); var t = $('tbl'); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); }; });
    [].forEach.call($('tbl').querySelectorAll('[data-a]'), function (b) { b.onclick = function () { var dd = b.closest('.lx-dd'); if (dd) dd.hidden = true; if (b.dataset.a === 'views') return viewsModal(b.closest('[data-t]').dataset.t); if (b.dataset.a === 'pacs') return openPacs(b.closest('[data-t]').dataset.t); if (b.dataset.a === 'doc') return caseDoctorAsk(b.closest('[data-t]').dataset.t); if (b.dataset.a === 'fol') return caseFollowAsk(b.closest('[data-t]').dataset.t); act(b.closest('[data-t]').dataset.t, b.dataset.a, b); }; });
  }
  /* ── 4.98 · access log: every time a patient opens his case ── */
  var VIA = { qr: ['▦', 'باركود الحالة'], fixed: ['📌', 'الباركود الثابت'], doctor: ['👨‍⚕️', 'لينك الدكتور'] }, SRC = { cache: '☁ من السيرفر', center: '💻 من جهاز المركز' };
  function entryRow(e, withName) {
    var v = VIA[e.via] || VIA.qr;
    return '<div class="ve"><span class="vi">' + v[0] + '</span><div><b>' + (withName ? esc(e.patient || '') + (e.exam ? ' <small>· ' + esc(e.exam) + '</small>' : '') : esc(e.dev || 'جهاز')) + '</b><small>' + when(e.at) + ' · ' + v[1] + (withName ? (e.dev ? ' · ' + esc(e.dev) : '') : (SRC[e.src] ? ' · ' + SRC[e.src] : '')) + '</small></div></div>';
  }
  function recent() {
    function paint(el, L) {
      if (!el) return;
      el.innerHTML = L.length ? L.map(function (e, i) {
        return '<button type="button" class="rx qrd-activity-button" data-vt="' + esc(e.token) +
          '" style="animation-delay:' + i * 35 + 'ms">' + entryRow(e, true) + '</button>';
      }).join('') : '<p class="rmt">لسه مفيش فتح لنتائج الأشعة — هتظهر هنا لحظيًا لما أي مريض يفتح نتيجته.</p>';
      [].forEach.call(el.querySelectorAll('[data-vt]'), function (x) {
        x.onclick = function () { viewsModal(x.dataset.vt); };
      });
    }
    paint($('qrdHomeRecent'), ui.recent.slice(0, 7));
    paint($('rec'), ui.recent.slice(0, 30));
  }
  function viewsModal(tok) {
    var r = itemOf(tok); if (!r) return;
    ui.vwOpen = tok;
    var o = modal('<h3>مرات فتح الحالة</h3><p>' + esc(r.patient) + (r.exam ? ' · ' + esc(r.exam) : '') + '</p><div class="vsum"><div><b id="vmn">' + (r.views || 0) + '</b><span>مرة اتفتحت</span></div><div><b>' + (r.last_view ? when(r.last_view) : '—') + '</b><span>آخر مرة</span></div></div><div class="vlist" id="vml"><div class="sk"></div><div class="sk" style="opacity:.6"></div></div><button class="btn g w" data-x="cl" style="margin-top:12px">تمام</button>');
    var obs = new MutationObserver(function () { if (!document.body.contains(o)) { ui.vwOpen = ''; obs.disconnect(); } }); obs.observe(document.body, { childList: true });
    api('GET', 'views/' + tok).then(function (x) {
      var el = $('vml'); if (!el) return; var L = x.list || [];
      el.innerHTML = L.length ? L.map(function (e) { return entryRow(e, false); }).join('') : '<p class="rmt">لسه المريض مافتحهاش.</p>' + (r.views ? '<p class="rmt">(المرات القديمة قبل التحديث ده اتعدّت من غير تفاصيل)</p>' : '');
    }).catch(function (e) { var el = $('vml'); if (el) el.innerHTML = '<p class="rmt">' + esc(e.message) + '</p>'; });
  }
  function itemOf(tok) { return ui.list.filter(function (r) { return r.token === tok; })[0]; }
  function act(tok, a, b) {
    var r = itemOf(tok); if (!r) return;
    if (a === 'qr') return showQr(tok);
    if (a === 'print') return printSticker(tok);
    if (a === 'wa') return wa(tok);
    if (a === 'del' && !confirm('تمسح حالة «' + r.patient + '» نهائي؟\nالباركود هيقف، والملف هيتمسح من الجهاز ده ومن السيرفر.')) return;
    b.disabled = true;
    api('POST', 'item/' + tok + '/' + (a === 'del' ? 'delete' : a)).then(function () {
      if (a === 'del') { ui.list = ui.list.filter(function (x) { return x.token !== tok; }); delete ui.local[tok]; del(tok).catch(function () {}); toast('اتمسحت'); disk(); stats(); }
      else { r.active = a === 'start'; toast(a === 'start' ? '▶ الحالة اشتغلت تاني' : '⏸ الحالة اتوقفت — الباركود مش هيفتح'); }
      table();
    }).catch(function (e) { b.disabled = false; toast(e.message); });
  }
  function modal(html, on) {
    var o = document.createElement('div'); o.className = 'mdl'; o.innerHTML = '<div class="pn">' + html + '</div>'; document.body.appendChild(o);
    var close = function () { o.remove(); document.removeEventListener('keydown', kd); }, kd = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', kd);
    o.onclick = function (e) { var x = e.target.closest('[data-x]'); if (e.target === o) return close(); if (!x) return; if (x.dataset.x === 'cl') return close(); if (on) on(x.dataset.x, close, x); };
    return o;
  }
  function showQr(tok, fresh) {
    var r = itemOf(tok), u = linkOf(tok); if (!r || !u) return;
    modal((fresh ? '<div class="okb">' + ic('check') + '</div><h3>اتحفظت — ده الباركود</h3>' : '<h3>▦ باركود الحالة</h3>') + '<p>' + esc(r.patient) + (r.exam ? ' · ' + esc(r.exam) : '') + '</p><div class="qbig">' + qrSvg(u) + '</div><p>المريض يمسحه بكاميرا الموبايل ويشوف حالته على طول' + (r.wrapped ? ' — أو يلاقيها بالباركود الثابت برقم موبايله' : '') + '</p>' +
      '<div class="lk"><input readonly value="' + esc(u) + '"><button class="btn g sm" data-x="cp">نسخ</button></div><div class="bt"><button class="btn" data-x="pr">🖨 اطبع استيكر</button>' + (r.phone ? '<button class="btn" data-x="wa" style="background:#16A34A">واتساب للمريض</button>' : '<button class="btn g" data-x="op">👁 افتح</button>') + '</div><button class="btn g w" data-x="cl" style="margin-top:8px">تمام</button>',
      function (k, close, x) { if (k === 'pr') printSticker(tok); if (k === 'wa') wa(tok); if (k === 'op') window.open(u, '_blank', 'noopener'); if (k === 'cp') { try { navigator.clipboard.writeText(u).then(function () { toast('اتنسخ ✓'); }); } catch (er) { x.previousElementSibling.select(); } } });
  }
  function wa(tok) {
    var r = itemOf(tok), u = linkOf(tok), ph = phoneWa(r && r.phone); if (!r || !u || !ph) return;
    var t = 'أهلاً ' + r.patient + ' 🌿\nنتيجة ' + (r.exam || 'الفحص') + ' من *' + C.center + '* جاهزة.\nتقدر تشوفها وتنزّلها من هنا:\n' + u + '\n\nسلامتك 🙏';
    window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(t), '_blank');
  }
  function printSticker(tok) {
    var r = itemOf(tok), u = linkOf(tok); if (!r || !u) return;
    var w = window.open('', '_blank', 'width=420,height=620'); if (!w) return toast('اسمح بالنوافذ المنبثقة');
    w.document.write('<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><title>استيكر ' + esc(r.patient) + '</title><style>@page{size:70mm 95mm;margin:0}body{margin:0;font-family:Tahoma,Arial,sans-serif;color:#0F172A}.s{width:70mm;height:95mm;padding:5mm;box-sizing:border-box;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}h1{font-size:15px;margin:0}p{margin:3px 0;font-size:12px;color:#334155}.q{width:48mm;height:48mm;margin:3mm 0}.q svg{width:100%;height:100%}small{font-size:10px;color:#64748B}</style>' +
      '<div class="s"><h1>' + esc(C.center) + '</h1><p><b>' + esc(r.patient) + '</b>' + (r.exam ? ' · ' + esc(r.exam) : '') + '</p><div class="q">' + qrSvg(u) + '</div><p>📱 امسح الباركود بكاميرا الموبايل</p><small>وشوف نتيجة الفحص وانزّلها PDF</small></div><script>setTimeout(function(){print()},300)<\/script></html>');
    w.document.close();
  }

  /* ── backup / restore of THIS computer's cases (move them to another PC) ── */
  function backup() {
    var toks = Object.keys(ui.local); if (!toks.length) return toast('مفيش حالات على الجهاز ده');
    toast('بنجهّز النسخة…');
    Promise.all(toks.map(localGet)).then(function (recs) {
      recs = recs.filter(function (x) { return x && x.blob; });
      var head = JSON.stringify({ v: 1, code: C.code, center: C.center, at: Date.now(), items: recs.map(function (x) { return { token: x.token, key: x.key, size: x.blob.size, thumb: x.thumb || '', name: x.name || '', at: x.at || 0 }; }) }), hb = new TextEncoder().encode(head);
      var blob = new Blob(['OZXC1\n', String(hb.length).padStart(10, '0') + '\n', hb].concat(recs.map(function (x) { return x.blob; })), { type: 'application/octet-stream' });
      dl(URL.createObjectURL(blob), 'حالات-' + C.center + '-' + ymd() + '.ozxcases');
      toast('⬇ اتنزّلت نسخة فيها ' + recs.length + ' حالة (' + mb(blob.size) + ') — احفظها في مكان آمن');
    });
  }
  function restore(file) {
    file.slice(0, 17).text().then(function (t) {
      if (t.slice(0, 6) !== 'OZXC1\n') throw new Error('الملف ده مش نسخة حالات');
      var n = Number(t.slice(6, 16)), off = 17;
      return file.slice(off, off + n).text().then(function (h) {
        var H = JSON.parse(h); if (H.code !== C.code && !confirm('النسخة دي من لينك تاني (' + (H.center || '') + '). ترجّعها هنا برضه؟')) return 0;
        var p = off + n, jobs = H.items.map(function (it) { var b = file.slice(p, p + it.size); p += it.size; return put({ token: it.token, code: C.code, key: it.key, blob: b, size: it.size, thumb: it.thumb, name: it.name, at: it.at }); });
        return Promise.all(jobs).then(function () { return H.items.length; });
      });
    }).then(function (n) { if (!n) return; return localAll().then(function (L) { ui.local = L; table(); stats(); disk(); toast('⬆ اترجّع ' + n + ' حالة على الجهاز ده'); backfill(); }); })
      .catch(function (e) { toast(e.message || 'مش قادر أقرا النسخة'); });
  }

  /* ── cases saved before 4.91 → wrap their key so the fixed barcode finds them ── */
  function backfill() {
    /* 4.99 · and every case with a mobile gets the mobile-only key, so the patient finds it by his mobile alone */
    var L = ui.list.filter(function (r) { return !r.wrapped2 && r.phone && K.last10(r.phone) && ui.local[r.token]; }), i = 0;
    (function nx() {
      if (i >= L.length) { if (L.length) table(); return; } var r = L[i++];
      K.wrap2(ui.local[r.token].key, r.phone).then(function (w) { return w ? api('POST', 'item/' + r.token + '/wrap', { p: w }).then(function () { r.wrapped = r.wrapped2 = true; }) : null; }).catch(function () {}).then(nx);
    })();
  }

  /* ── live: the server asks this page for a file when a patient opens it ── */
  function setLive(on) { ui.live = on; var s = $('st'); if (!s) return; s.className = 'pill' + (on ? ' on' : ''); s.lastChild.textContent = on ? 'متصل — المرضى يقدروا يفتحوا' : 'مش متصل — بنحاول تاني…'; }
  function connect() {
    try { if (ui.es) ui.es.close(); } catch (e) {}
    var es = new EventSource(BASE + '/live'); ui.es = es;
    es.addEventListener('hello', function (ev) {
      setLive(true);
      try { syncNotices(JSON.parse(ev.data).notices); } catch (e) {}
      api('GET', 'qr').then(function (x) { ui.qr = x.qr || ui.qr; qrPanel(); dHome(); }).catch(function () {});
    });
    es.onerror = function () { setLive(false); };
    es.addEventListener('need', function (ev) {
      var m = {}; try { m = JSON.parse(ev.data); } catch (e) { return; }
      localGet(m.token).then(function (rec) {
        if (!rec || !rec.blob) return fetch(BASE + '/relay/' + m.ticket + '?miss=1', { method: 'POST', credentials: 'same-origin' });
        return fetch(BASE + '/relay/' + m.ticket, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/octet-stream' }, body: rec.blob });
      }).catch(function () {});
    });
    ['qr-open', 'view', 'ticket', 'booking', 'ask', 'rating'].forEach(function (k) { es.addEventListener(k, dashSoon); es.addEventListener(k, noticeEvent); });
    es.addEventListener('rating', function (ev) { var m = {}; try { m = JSON.parse(ev.data); } catch (e) {} toast('⭐ مريض قيّم زيارته: ' + starsTxt(m.stars || 0)); if (ui.page === 'ratings') ratingsLoad(); });
    es.addEventListener('qr-open', function (ev) {
      var m = {}; try { m = JSON.parse(ev.data); } catch (e) { return; }
      ui.qr = m.qr || ui.qr; qrPanel(); dHome();
    });
    es.addEventListener('ticket', function (ev) {
      var m={};try{m=JSON.parse(ev.data);}catch(e){return;}
      ui.tickets=m.tickets||ui.tickets;serviceTickets();
      beep();toast(m.kind==='complaint'?'📝 شكوى جديدة من مريض':'📤 طلب تقرير جديد');
    });
    es.addEventListener('booking', function (ev) {
      var m = {}; try { m = JSON.parse(ev.data); } catch (e) { return; }
      ui.bookings = m.bookings || ui.bookings; bookings(); beep(); toast('📅 طلب حجز جديد: ' + (m.name || 'مريض'));
    });
    es.addEventListener('ask', function (ev) {
      var m = {}; try { m = JSON.parse(ev.data); } catch (e) { return; }
      ui.asks = m.asks || ui.asks; ui.newAsk = K.last10(m.phone); asks(); beep(); toast('📨 ' + (m.name || 'مريض') + ' بيطلب نتيجته');
    });
    es.addEventListener('view', function (ev) {
      var m = {}; try { m = JSON.parse(ev.data); } catch (e) { return; }
      var r = itemOf(m.token); if (r) { r.views = m.views; r.last_view = m.last_view; }
      var t = $('vw-' + m.token); if (t) { t.className = 'vw on'; void t.offsetWidth; t.className = 'vw on pop'; t.innerHTML = ic('eye') + m.views; }
      var lv = $('lv-' + m.token); if (lv) lv.textContent = when(m.last_view);
      if (m.entry) { ui.recent.unshift(m.entry); ui.recent = ui.recent.slice(0, 30); recent(); var f = $('rec') && $('rec').firstChild; if (f && f.classList) f.classList.add('new'); }
      if (m.entry && ui.vwOpen === m.token) { var vl = $('vml'), vn = $('vmn'); if (vn) vn.textContent = m.views; if (vl) { if (!vl.querySelector('.ve')) vl.innerHTML = ''; vl.insertAdjacentHTML('afterbegin', entryRow(m.entry, false)); vl.firstChild.classList.add('new'); } }
      if (r) { toast('👁 ' + r.patient + ' فتح حالته دلوقتي' + (m.entry && m.entry.dev ? ' (' + m.entry.dev + ')' : '')); stats(); }
    });
  }
  function disk() {
    var n = 0, sz = 0; Object.keys(ui.local).forEach(function (k) { n++; sz += ui.local[k].size || 0; });
    var est = navigator.storage && navigator.storage.estimate ? navigator.storage.estimate() : Promise.resolve(null);
    est.then(function (e) {
      var pct = e && e.quota ? Math.max(2, Math.min(100, Math.round(e.usage / e.quota * 100))) : 0;
      $('disk').innerHTML = '<div class="dt"><span>💾</span><div><b>' + n + ' حالة · ' + mb(sz) + '</b><small>محفوظة على الكمبيوتر ده' + (e && e.quota ? ' · متاح حوالي ' + mb(Math.max(0, e.quota - e.usage)) : '') + '</small></div></div>' +
        (e && e.quota ? '<div class="du"><i style="width:0" data-w="' + pct + '%"></i></div>' : '<div style="height:10px"></div>') +
        '<p>كل حالة ليها نسخة مشفّرة على السيرفر أول ' + C.cacheDays + ' أيام، وبعدها بتفتح للمريض من الجهاز ده — <b>سيب الصفحة مفتوحة والكمبيوتر شغال</b>. متمسحش بيانات المتصفح، واعمل «نسخة احتياطية» كل أسبوع.</p>';
      var du = $('disk').querySelector('.du i'); if (du) requestAnimationFrame(function () { requestAnimationFrame(function () { du.style.width = du.dataset.w; }); });
    });
  }
  function boot() {
    if (isIOSBrowser()) try {
      var savedPrefill = sessionStorage.getItem('qrd-upload-prefill');
      if (savedPrefill) { ui.prefill = JSON.parse(savedPrefill); sessionStorage.removeItem('qrd-upload-prefill'); }
    } catch (e) {}
    shell(); setupNotices();
    if (ui.prefill && ui.page === 'upload') {
      toast('📂 جهزنا بيانات المريض — اختار ملف PDF من زر رفع الملفات');
    }
    docsLoad(false); Promise.all([api('GET', 'list'), localAll()]).then(function (a) { ui.list = a[0].list || []; ui.local = a[1] || {}; ui.asks = a[0].asks || []; ui.bookings = a[0].bookings || []; ui.tickets = a[0].tickets || []; ui.qr = a[0].qr || ui.qr; ui.recent = a[0].recent || []; ui.dash = a[0].dash || null; dashX(); adsLoad(); setTimeout(dicomOffServer, 1500); qrPanel(); bookings(); asks(); serviceTickets(); recent(); table(); stats(); disk(); backfill(); dHome(); }).catch(function (e) {
      var message='تعذّر تحميل بيانات القسم. جرّب تحديث الصفحة أو اتأكد من اتصال الإنترنت.';
      ['bookings','asks','complaints','reportRequests'].forEach(function (id) {
        var box=$(id); if (box) box.innerHTML='<div class="qrd-data-error" role="alert">⚠️ '+message+'</div>';
      });
      var tbl=$('tbl'); if (tbl) tbl.innerHTML='<div class="emp"><i>⚠️</i>'+esc(e.message)+'</div>';
      var qr=$('qrStats'); if (qr) qr.innerHTML='<div class="qrd-data-error" role="alert">⚠️ '+message+'</div>';
    });
    connect(); bootWatch();
    document.addEventListener('visibilitychange', function () { if (document.visibilityState !== 'visible') return; readNoticePage(); if (!ui.es || ui.es.readyState === 2) connect(); else api('GET', 'notifications').then(function (x) { syncNotices(x.notices); }).catch(function () {}); });
    window.addEventListener('beforeunload', function (e) {
      var workInProgress = ui.queue.some(function (q) { return q.st === 'ready' || q.st === 'saving' || q.st === 'reading'; });
      /* IndexedDB persists across a normal section reload; don't show a needless warning. */
      if (ui.safeSectionNavigation && !workInProgress) return;
      if (Object.keys(ui.local).length || workInProgress) { e.preventDefault(); e.returnValue = ''; }
    });
  }
  if (C.auth) boot(); else login();
})();
