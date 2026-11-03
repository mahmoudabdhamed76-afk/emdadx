/* 4.91 · حالات المرضى — أدوات مشتركة بين صفحة المركز وصفحة «دوّر على نتيجتك»
   مفتاح كل حالة بيتغلّف بمفتاح طالع من (أول اسم المريض + آخر 10 أرقام من موبايله)،
   فالمريض اللي عارف الاتنين بس هو اللي يفتح حالته من الباركود الثابت. */
(function () {
  'use strict';
  function b64u(buf) { var s = '', b = new Uint8Array(buf); for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }
  function digits(s) { return String(s || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x660); }).replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 0x6F0); }).replace(/\D/g, ''); }
  function last10(p) { var d = digits(p); return d.length >= 8 ? d.slice(-10) : ''; }
  /* «أول اسم» normalized: no tashkeel, one shape of alef/yaa/taa marbuta; «عبد الله» = «عبدالله», «أبو بكر» = «ابوبكر» */
  function normName(n) {
    var s = String(n || '').toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^؀-ۿa-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    var w = s.split(' ');
    if (!w[0]) return '';
    if (/^(عبد|ابو|ام|abd|abu)$/.test(w[0]) && w[1]) return w[0] + w[1];
    return w[0];
  }
  function kek(name, phone, salt) {
    var pw = new TextEncoder().encode('ozx|' + normName(name) + '|' + last10(phone));
    return crypto.subtle.importKey('raw', pw, 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 120000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']);
    });
  }
  /* rawKey (base64url of the case's AES key) → { s, i, k } that only (name, phone) opens */
  function wrap(rawKey, name, phone) {
    if (!normName(name) || !last10(phone)) return Promise.resolve(null);
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return kek(name, phone, salt).then(function (k) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, unb64u(rawKey)); })
      .then(function (ct) { return { s: b64u(salt), i: b64u(iv), k: b64u(ct) }; });
  }
  function unwrap(w, name, phone) {
    return kek(name, phone, unb64u(w.s)).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(w.i) }, k, unb64u(w.k)); })
      .then(function (raw) { return b64u(raw); }, function () { return null; });
  }
  /* 4.99 · the same, by the mobile alone — the fixed barcode asks for the mobile only */
  function kek2(phone, salt) {
    var pw = new TextEncoder().encode('ozx2|' + last10(phone));
    return crypto.subtle.importKey('raw', pw, 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 120000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']);
    });
  }
  function wrap2(rawKey, phone) {
    if (!last10(phone)) return Promise.resolve(null);
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return kek2(phone, salt).then(function (k) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, unb64u(rawKey)); })
      .then(function (ct) { return { s: b64u(salt), i: b64u(iv), k: b64u(ct) }; });
  }
  function unwrap2(w, phone) {
    return kek2(phone, unb64u(w.s)).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(w.i) }, k, unb64u(w.k)); })
      .then(function (raw) { return b64u(raw); }, function () { return null; });
  }
  window.OZK = { b64u: b64u, unb64u: unb64u, last10: last10, digits: digits, normName: normName, wrap: wrap, unwrap: unwrap, wrap2: wrap2, unwrap2: unwrap2 };
})();
/* 5.17 · honest barcode counts: a page open counts only when a real person sees it —
   the page has to run in a visible tab for 1.5 s (link previews, bots and prefetch never do),
   once per visitor every 30 minutes, and never on the center's own devices. */
(function () {
  'use strict';
  var C = window.CD || {}, p = location.pathname;
  if (/^\/k\//.test(p)) { if (C.auth) try { localStorage.setItem('qrd-staff', '1'); } catch (e) {} return; }
  var m = /^\/(h\/[A-Za-z0-9]{8}|v\/[A-Za-z0-9]{12})\/?$/.exec(p); if (!m || C.missing) return;
  try { if (localStorage.getItem('qrd-staff')) return; } catch (e) {}
  var key = 'ozx_seen:' + m[1], vid = '';
  try { if (Date.now() - (+sessionStorage.getItem(key) || 0) < 30 * 60e3) return; } catch (e) {}
  try { vid = localStorage.getItem('ozx_vid') || ''; if (!vid) { vid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('ozx_vid', vid); } } catch (e) {}
  var sent = false, t = 0;
  function go() {
    if (sent || document.visibilityState !== 'visible') return; sent = true;
    try { sessionStorage.setItem(key, String(Date.now())); } catch (e) {}
    try { fetch('/' + m[1] + '/seen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vid: vid, h: /[?&]h=1\b/.test(location.search) }), keepalive: true, credentials: 'omit' }).catch(function () {}); } catch (e) {}
  }
  function arm() { clearTimeout(t); if (document.visibilityState === 'visible') t = setTimeout(go, 1500); }
  document.addEventListener('visibilitychange', arm); arm();
})();
/* 5.25 · the stars-only rating pop-up (center page, result page, and the center's live preview) */
(function () {
  'use strict';
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var EMO = { star: '⭐', heart: '💚', smile: '😊', gift: '🎁' };
  /* the center's settings + page data → pop-up options */
  function popOpts(cfg, C, where) {
    cfg = cfg || {}; var name = String(C.center || '').trim(), nm = /^مركز/.test(name) ? name : 'مركز ' + name;
    var icon = cfg.icon || 'logo', logo = icon === 'none' ? '' : icon === 'logo' ? (C.logo ? '<img src="' + C.logo + '" alt="">' : '<b class="ini">' + esc(name.charAt(0) || '★') + '</b>') : '<i class="emo">' + EMO[icon] + '</i>';
    var P = cfg.promos || [];
    return { title: esc(cfg.title || (where === 'v' ? 'إيه رأيك في خدمتنا؟' : 'إيه رأيك في ' + nm + '؟')), sub: esc(cfg.sub || (where === 'v' ? 'دوس على النجوم' : 'قيّمنا بالنجوم — بتاخد ثانية')),
      promo: P.length ? esc(P[Math.floor(Math.random() * P.length)]) : '', thanks: esc(cfg.thanks || ''), logo: logo, size: cfg.size || 'm', emo: icon !== 'logo' && icon !== 'none' };
  }
  function ratePop(o) {
    var vid = ''; try { vid = localStorage.getItem('ozx_vid') || ''; } catch (e) {}
    var el = document.createElement('div'); el.className = 'rp-pop sz-' + (o.size || 'm') + (o.host ? ' inl' : ''); el.setAttribute('role', 'dialog'); if (!o.host) el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'قيّم خدمتنا');
    el.innerHTML = '<div class="rp-pop-c' + (o.logo ? ' has-lg' : '') + '"><button type="button" class="rp-pop-x" aria-label="قفل">✕</button>' + (o.logo ? '<span class="rp-pop-lg' + (o.emo ? ' emo' : '') + '">' + o.logo + '</span>' : '') +
      '<b>' + (o.title || 'إيه رأيك في خدمتنا؟') + '</b><small>' + (o.sub || 'دوس على النجوم') + '</small>' +
      '<div class="rp-pop-s" role="radiogroup">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" role="radio" aria-label="' + k + ' من 5" data-ps="' + k + '" style="--d:' + (k * 70) + 'ms">★</button>'; }).join('') + '</div>' +
      (o.promo ? '<p class="rp-pop-pr">' + o.promo + '</p>' : '') + '</div>';
    (o.host || document.body).appendChild(el); requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
    var gone = false, close = function (ms) { if (gone) return; gone = true; document.removeEventListener('keydown', kd); setTimeout(function () { el.classList.remove('in'); el.classList.add('out'); setTimeout(function () { el.remove(); if (o.onGone) o.onGone(); }, 340); }, ms || 0); };
    var kd = function (e) { if (e.key === 'Escape' && !o.host) close(); }; document.addEventListener('keydown', kd);
    el.addEventListener('click', function (e) { if ((e.target === el && !o.host) || e.target.closest('.rp-pop-x')) close(); });
    var btns = [].slice.call(el.querySelectorAll('[data-ps]'));
    btns.forEach(function (b) {
      b.onmouseenter = function () { btns.forEach(function (x) { x.classList.toggle('hv', +x.dataset.ps <= +b.dataset.ps); }); };
      b.onclick = function () {
        var n = +b.dataset.ps; btns.forEach(function (x) { x.disabled = true; x.classList.toggle('on', +x.dataset.ps <= n); });
        /* the center's own devices (and the preview) see it working but never add a rating */
        (o.dry ? Promise.resolve({ ok: true }) : fetch(o.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stars: n, tags: [], note: '', vid: vid }) }))
          .then(function (r) { if (!r.ok) throw new Error(); if (!o.dry) try { sessionStorage.setItem('ozx_rated_s', '1'); } catch (e) {} if (o.onDone) o.onDone(n);
            el.querySelector('.rp-pop-c').innerHTML = '<span class="rp-pop-ok">💚</span><b>شكرًا!</b><small>' + (o.thanks || (n >= 4 ? 'فرّحتنا — ألف سلامة عليك' : 'هنهتم بملاحظتك ونتحسّن')) + '</small>'; close(1400); })
          .catch(function () { close(); });
      };
    });
    return { close: close };
  }
  var Z = window.OZK || (window.OZK = {}); Z.ratePop = ratePop; Z.popOpts = popOpts;
})();
