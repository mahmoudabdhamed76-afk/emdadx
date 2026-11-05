/* ════════════════════════════════════════════════════════════════════
   EMDADX · «صفحة الدعاية» (4.77) — the public promo page (/promo)
   Four designs (t1 … t4) over one content model set in the ERP.
   Motion: one calm slide-up cascade on open (like the patient page),
   an auto hero slider with swipe, count-up numbers, bottom sheets.
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.PM || {}, C = D.c || {}, T = String(C.theme || '1');
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function waNum(n) { return String(n || '').replace(/[^\d]/g, '').replace(/^00/, '').replace(/^0(?=1\d{9}$)/, '20'); }
  function waHref(msg) { var n = waNum(C.wa || C.phone); return n ? 'https://wa.me/' + n + (msg ? '?text=' + encodeURIComponent(msg) : '') : ''; }

  /* ── icons (24px stroke) ── */
  var P = {
    printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/><path d="M17 12h.01"/>',
    film: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2.2"/><circle cx="15" cy="9" r="2.2"/><circle cx="9" cy="15" r="2.2"/><circle cx="15" cy="15" r="2.2"/>',
    paper: '<ellipse cx="12" cy="5" rx="7" ry="2.6"/><path d="M5 5v14c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V5"/><path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    support: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/><path d="M19.5 19c0 1.7-2 3-5 3h-2"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
    hand: '<path d="M11 13h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 15"/><path d="m7 19 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L14.4 12"/><path d="m2 14 6 6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5L5 20"/>',
    hospital: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M12 8v6M9 11h6"/><path d="M10 21v-3h4v3"/>',
    scan: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>',
    clinic: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 7v6M9 10h6"/><path d="M9 21v-4h6v4"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    wa: '<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8c-1-.4-1.8-1.2-2.2-2.2l.8-1-1-2z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    grid: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    arrow: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-6M22 20H2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>'
  };
  function ic(n, cls) { return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.star) + '</svg>'; }

  /* ── hero illustrations (drawn, no photos needed — the admin can upload his own) ── */
  function scanGrid(x, y, w, h, cols, rows, hue) {
    var s = '', cw = w / cols, ch = h / rows;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var cx = x + cw * c + cw / 2, cy = y + ch * r + ch / 2, rr = Math.min(cw, ch) * .36;
      s += '<g><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rr + '" ry="' + rr * 1.12 + '" fill="url(#scan' + hue + ')" stroke="rgba(190,235,255,.85)" stroke-width="1"/>' +
        '<path d="M' + (cx - rr * .55) + ' ' + cy + 'q' + rr * .3 + ' -' + rr * .5 + ' ' + rr * .55 + ' 0t' + rr * .55 + ' 0" stroke="rgba(10,40,90,.7)" stroke-width="1.3" fill="none"/>' +
        '<ellipse cx="' + cx + '" cy="' + (cy + rr * .35) + '" rx="' + rr * .32 + '" ry="' + rr * .2 + '" fill="rgba(10,40,90,.55)"/></g>';
    }
    return s;
  }
  var DEFS = '<defs>' +
    '<radialGradient id="scanA" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#E8F8FF"/><stop offset=".55" stop-color="#7FC8F0"/><stop offset="1" stop-color="#1F6FB5"/></radialGradient>' +
    '<radialGradient id="scanB" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#F0FAFF"/><stop offset=".6" stop-color="#8ED0F2"/><stop offset="1" stop-color="#2D5FA8"/></radialGradient>' +
    '<linearGradient id="pBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E4EAF2"/><stop offset="1" stop-color="#B9C5D4"/></linearGradient>' +
    '<linearGradient id="pSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9D3E0"/><stop offset="1" stop-color="#95A3B7"/></linearGradient>' +
    '<linearGradient id="filmG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16407E"/><stop offset="1" stop-color="#0A2552"/></linearGradient>' +
    '<linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D1B33"/><stop offset="1" stop-color="#050B17"/></linearGradient>' +
    '<radialGradient id="lung" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#C9E6FF" stop-opacity=".95"/><stop offset="1" stop-color="#5D8FC4" stop-opacity=".25"/></radialGradient>' +
    '<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5CC8FF" stop-opacity=".55"/><stop offset="1" stop-color="#5CC8FF" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="glowP" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF5FB0" stop-opacity=".55"/><stop offset="1" stop-color="#FF5FB0" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="ctG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C8D6E8"/></linearGradient>' +
    '<filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter><filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>' +
    '</defs>';
  function xray(x, y, w, h) {   // a chest X-ray on a dark screen
    var cx = x + w / 2, s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#scr)"/>';
    s += '<ellipse cx="' + (cx - w * .17) + '" cy="' + (y + h * .52) + '" rx="' + w * .15 + '" ry="' + h * .32 + '" fill="url(#lung)"/><ellipse cx="' + (cx + w * .17) + '" cy="' + (y + h * .52) + '" rx="' + w * .15 + '" ry="' + h * .32 + '" fill="url(#lung)"/>';
    for (var i = 0; i < 6; i++) { var yy = y + h * (.28 + i * .095); s += '<path d="M' + (cx - 2) + ' ' + yy + 'Q' + (cx - w * .2) + ' ' + (yy - h * .06) + ' ' + (cx - w * .32) + ' ' + (yy + h * .05) + 'M' + (cx + 2) + ' ' + yy + 'Q' + (cx + w * .2) + ' ' + (yy - h * .06) + ' ' + (cx + w * .32) + ' ' + (yy + h * .05) + '" stroke="rgba(225,240,255,.55)" stroke-width="1.6" fill="none"/>'; }
    s += '<rect x="' + (cx - 2.5) + '" y="' + (y + h * .14) + '" width="5" height="' + h * .78 + '" rx="2.5" fill="rgba(235,245,255,.8)"/>';
    s += '<ellipse cx="' + (cx + w * .06) + '" cy="' + (y + h * .74) + '" rx="' + w * .12 + '" ry="' + h * .1 + '" fill="rgba(235,245,255,.35)"/>';
    return s;
  }
  function printer(x, y, w, film) {   // a compact film printer, film coming out of the front
    var h = w * .55, s = '';
    s += '<ellipse cx="' + (x + w / 2) + '" cy="' + (y + h + 6) + '" rx="' + w * .62 + '" ry="' + h * .14 + '" fill="rgba(0,0,0,.35)" filter="url(#blur3)"/>';
    s += '<path d="M' + (x + w) + ' ' + (y + 8) + 'l' + w * .12 + ' -' + h * .12 + 'v' + h * .82 + 'l-' + w * .12 + ' ' + h * .3 + 'z" fill="url(#pSide)"/>';
    s += '<rect x="' + x + '" y="' + (y + 8) + '" width="' + w + '" height="' + (h - 8) + '" rx="' + w * .06 + '" fill="url(#pBody)"/>';
    s += '<path d="M' + (x + w * .04) + ' ' + (y + 8) + 'l' + w * .1 + ' -' + h * .12 + 'h' + w * .98 + 'l-' + w * .12 + ' ' + h * .12 + 'z" fill="#F7FAFD"/>';
    s += '<rect x="' + (x + w * .1) + '" y="' + (y + h * .42) + '" width="' + w * .8 + '" height="' + h * .07 + '" rx="3" fill="#273447"/>';
    s += '<rect x="' + (x + w * .78) + '" y="' + (y + h * .2) + '" width="' + w * .12 + '" height="' + h * .08 + '" rx="2" fill="#2E3A4D"/><circle cx="' + (x + w * .74) + '" cy="' + (y + h * .24) + '" r="2.4" fill="#36D399"/>';
    if (film) {
      var fx = x + w * .05, fy = y + h * .46, fw = w * .9, fh = h * .78;
      s += '<g transform="translate(' + fx + ' ' + fy + ') skewX(-12)"><rect width="' + fw + '" height="' + fh + '" rx="4" fill="url(#filmG)" stroke="rgba(150,210,255,.6)"/>' + scanGrid(6, 6, fw - 12, fh - 12, 4, 2, 'A') + '</g>';
    }
    return s;
  }
  var ART = {
    monitor: function () {
      return '<svg viewBox="0 0 360 240" class="pm-art" preserveAspectRatio="xMinYMid meet" aria-hidden="true">' + DEFS +
        '<ellipse cx="150" cy="200" rx="170" ry="40" fill="url(#glow)"/><circle cx="120" cy="110" r="120" fill="url(#glow)" opacity=".5"/>' +
        '<rect x="14" y="38" width="170" height="112" rx="8" fill="#0B1424" stroke="#3B5683" stroke-width="2"/>' + '<g>' + xray(20, 44, 79, 100) + xray(101, 44, 77, 100).replace(/url\(#lung\)/g, 'url(#lung)') + '</g>' +
        '<path d="M86 150h26l6 22H80z" fill="#1A2A44"/><rect x="62" y="170" width="74" height="6" rx="3" fill="#24395E"/>' +
        printer(150, 104, 150, true) +
        '<path d="M0 214h360" stroke="rgba(120,200,255,.35)" stroke-width="1"/></svg>';
    },
    film: function () {
      return '<svg viewBox="0 0 360 240" class="pm-art" preserveAspectRatio="xMinYMid meet" aria-hidden="true">' + DEFS +
        '<circle cx="130" cy="120" r="130" fill="url(#glowP)"/><circle cx="170" cy="90" r="80" fill="url(#glow)" opacity=".6"/>' +
        '<g transform="translate(40 26) rotate(-8 110 90)"><rect width="230" height="180" rx="10" fill="rgba(13,40,92,.92)" stroke="rgba(160,220,255,.85)" stroke-width="2"/>' + scanGrid(10, 10, 210, 160, 3, 3, 'B') +
        '<rect width="230" height="180" rx="10" fill="url(#glow)" opacity=".25"/></g>' +
        '<path d="M232 196c10-8 26-14 40-10l40 14c8 3 6 14-3 13l-30-5 26 12c8 4 3 14-5 11l-34-13 24 14c7 4 2 13-5 10l-30-14 18 12c6 4 1 12-5 9l-40-22c-14-8-12-20 4-31z" fill="#3F6FD8" stroke="#2A54B4" stroke-width="1.5"/>' +
        '</svg>';
    },
    ring: function () {
      return '<svg viewBox="0 0 360 240" class="pm-art" preserveAspectRatio="xMinYMid meet" aria-hidden="true">' + DEFS +
        '<circle cx="170" cy="112" r="96" fill="none" stroke="#3FD0FF" stroke-width="10" opacity=".55" filter="url(#blur8)"/><circle cx="170" cy="112" r="96" fill="none" stroke="#9BE7FF" stroke-width="2.5"/><circle cx="170" cy="112" r="96" fill="url(#glow)" opacity=".45"/>' +
        printer(86, 66, 168, true) + '</svg>';
    },
    clinic: function () {
      return '<svg viewBox="0 0 360 240" class="pm-art" preserveAspectRatio="xMinYMid meet" aria-hidden="true">' + DEFS +
        '<rect x="0" y="176" width="360" height="64" fill="rgba(255,255,255,.35)"/>' +
        '<g opacity=".95"><circle cx="250" cy="110" r="86" fill="url(#ctG)" stroke="#AFC3DD" stroke-width="2"/><circle cx="250" cy="110" r="44" fill="#6F8DB8"/><circle cx="250" cy="110" r="38" fill="#26446F"/>' +
        '<path d="M200 150h150v14H200z" fill="#E9F0F8" stroke="#B9CAE0"/><rect x="230" y="18" width="40" height="10" rx="5" fill="#9FD4FF" opacity=".8"/></g>' +
        '<rect x="20" y="58" width="150" height="104" rx="8" fill="#0B1424" stroke="#BFD0E6" stroke-width="3"/>' + xray(26, 64, 138, 92) +
        '<path d="M84 162h22l5 18H79z" fill="#B7C6DA"/><rect x="62" y="178" width="66" height="6" rx="3" fill="#A5B6CD"/>' + '</svg>';
    }
  };
  function artOf(s) { return s.img ? '<img class="pm-art pm-photo" src="/promo/img/' + esc(s.img) + '" alt="">' : (ART[s.art] || ART.monitor)(); }

  /* ── building blocks ── */
  var slides = (C.slides || []).length ? C.slides : [{ title: C.brand || 'Emdadx', sub: C.tagline || '', art: 'monitor' }];
  /* each design opens on its own picture (the order the admin set is kept, just rotated) */
  (function () { var want = { '1': 'monitor', '2': 'film', '3': 'ring', '4': 'clinic' }[T], k = -1;
    slides.forEach(function (x, i) { if (k < 0 && !x.img && x.art === want) k = i; });
    if (k > 0) slides = slides.slice(k).concat(slides.slice(0, k)); })();
  function header() {
    return '<header class="pm-hd m"><div class="pm-br"><img src="/icons/logo-square.png" alt=""><div><b>' + esc(C.brand || 'Emdadx') + '</b><small>' + esc(C.tagline || '') + '</small></div></div>' +
      '<button type="button" class="pm-bell" data-go="support" aria-label="تواصل معنا">' + ic('bell') + '</button></header>';
  }
  function slideHTML(s, i) {
    var t = '<h2>' + esc(s.title) + (s.hi ? '<em>' + esc(s.hi) + '</em>' : '') + '</h2>' + (s.sub ? '<p>' + esc(s.sub) + '</p>' : '');
    if (T === '3') {
      var parts = String(s.sub || '').split(/\s*[·•،,]\s*/).filter(Boolean);
      if (parts.length > 1) t = '<h2>' + esc(s.title) + (s.hi ? '<em>' + esc(s.hi) + '</em>' : '') + '</h2><ul>' + parts.map(function (p) { return '<li>' + ic('check') + esc(p) + '</li>'; }).join('') + '</ul>';
    }
    var btn = (T === '2' || T === '3') && s.btn ? '<button type="button" class="pm-hbtn" data-go="order">' + esc(s.btn) + ic('arrow') + '</button>' : '';
    return '<div class="pm-slide' + (i === 0 ? ' on' : '') + '" data-i="' + i + '"><div class="pm-artw">' + artOf(s) + '</div><div class="pm-htx">' + t + btn + '</div></div>';
  }
  function hero() {
    var dots = slides.length > 1 ? '<div class="pm-dots">' + slides.map(function (_, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' : '';
    var extra = '';
    if (T === '1') extra = '<div class="pm-hchips">' + (C.chips || []).slice(0, 3).map(function (c) { return '<span>' + ic(c.ic) + esc(c.t) + '</span>'; }).join('') + '</div>';
    if (T === '4') extra = '<div class="pm-tgt">' + (C.targets || []).map(function (c) { return '<span>' + ic(c.ic) + esc(c.t) + '</span>'; }).join('') + '</div>';
    return '<section class="pm-hero m" id="pmHero"><div class="pm-track">' + slides.map(slideHTML).join('') + '</div>' + extra + dots + '</section>';
  }
  function svcCards(list, cls) {
    return '<div class="' + cls + '">' + list.map(function (s, i) {
      return '<button type="button" class="pm-svc m" data-go="order" data-svc="' + esc(s.t) + '"><span class="pm-sic c' + (i % 6) + '">' + ic(s.ic) + '</span><b>' + esc(s.t) + '</b>' + (s.s ? '<small>' + esc(s.s) + '</small>' : '') + '<i class="pm-go">' + ic('arrow') + '</i></button>';
    }).join('') + '</div>';
  }
  function head(t, sub, link) { return '<div class="pm-sh m"><h3>' + esc(t) + '</h3>' + (link ? '<span>' + esc(link) + '</span>' : '') + '</div>' + (sub ? '<p class="pm-shs m">' + esc(sub) + '</p>' : ''); }
  function themeBody() {
    var S = C.services || [], o = '';
    if (T === '1') {
      o += '<button type="button" class="pm-ctabar m" data-go="order"><span>' + esc(C.cta) + '</span><i>' + ic('printer') + '</i></button>';
      o += head('خدماتنا', '', 'حلول متكاملة لمركزك') + svcCards(S, 'pm-g2');
    } else if (T === '2') {
      o += '<div class="pm-chipt">' + (C.chips || []).map(function (c) { return '<div class="m">' + ic(c.ic) + '<b>' + esc(c.t) + '</b></div>'; }).join('') + '</div>';
      o += head('ما نقدمه لمركزك', 'كل ما تحتاجه لطباعة وعرض صور الأشعة باحترافية') + svcCards(S.slice(0, 3), 'pm-g3') + (S.length > 3 ? svcCards(S.slice(3), 'pm-g3 pm-g3b') : '');
    } else if (T === '3') {
      o += '<div class="pm-stats m">' + (C.stats || []).map(function (s, i) { return '<div><span class="pm-sic c' + (i + 1) + '">' + ic(['shield', 'award', 'users'][i % 3]) + '</span><b data-n="' + esc(s.n) + '">' + esc(s.n) + '</b><small>' + esc(s.l) + '</small></div>'; }).join('') + '</div>';
      o += head('لماذا ' + (C.brand || 'Emdadx') + '؟') + '<div class="pm-why">' + (C.chips || []).map(function (c, i) { return '<div class="m"><span class="c' + i + '">' + ic(c.ic) + '</span><b>' + esc(c.t) + '</b></div>'; }).join('') + '</div>';
      o += head('خدماتنا') + svcCards(S, 'pm-g2');
    } else {
      o += '<button type="button" class="pm-offer m" data-go="order"><i>' + ic('tag') + '</i><span>' + esc(C.offer) + '</span>' + ic('arrow', 'ic pm-oa') + '</button>';
      o += '<div class="pm-quick">' + [['printer', 'طلب طباعة', 'order'], ['doc', 'متابعة الطلب', 'track'], ['tag', 'عرض الأسعار', 'quote'], ['wa', 'تواصل معنا', 'support']].map(function (q, i) { return '<button type="button" class="m" data-go="' + q[2] + '"><span class="c' + i + '">' + ic(q[0]) + '</span><b>' + q[1] + '</b></button>'; }).join('') + '</div>';
      o += head('خدماتنا') + svcCards(S, 'pm-g2');
    }
    return o;
  }
  function common() {
    var wa = waHref('السلام عليكم، عايز أعرف تفاصيل خدمة طباعة الأشعة');
    return (T === '2' ? '' : '') +
      (C.about ? '<section class="pm-about m"><h3>' + ic('star') + 'عن ' + esc(C.brand || 'Emdadx') + '</h3><p>' + esc(C.about) + '</p></section>' : '') +
      ((T === '1' || T === '2' || T === '4') && (C.stats || []).length ? '<div class="pm-stats m">' + C.stats.map(function (s, i) { return '<div><span class="pm-sic c' + (i + 1) + '">' + ic(['shield', 'award', 'users'][i % 3]) + '</span><b data-n="' + esc(s.n) + '">' + esc(s.n) + '</b><small>' + esc(s.l) + '</small></div>'; }).join('') + '</div>' : '') +
      '<section class="pm-contact m"><b>محتاج تتكلم معانا؟</b><div>' + (wa ? '<a class="pm-wa" href="' + esc(wa) + '" target="_blank" rel="noopener">' + ic('wa') + 'واتساب</a>' : '') + (C.phone ? '<a class="pm-call" href="tel:' + esc(C.phone) + '">' + ic('phone') + 'اتصل بنا</a>' : '') + '<button type="button" class="pm-req" data-go="order">' + ic('send') + 'اطلب الخدمة</button></div></section>' +
      '<footer class="pm-ft">© ' + new Date().getFullYear() + ' ' + esc(C.brand || 'Emdadx') + ' · ' + esc(C.tagline || '') + '</footer>';
  }
  function nav() {
    var L = [['home', 'الرئيسية', 'top'], ['grid', 'الخدمات', 'svc'], ['send', 'اطلب', 'order'], ['list', 'طلباتي', 'track'], ['support', 'الدعم', 'support']];
    return '<nav class="pm-nav">' + L.map(function (x, i) { return '<button type="button" data-go="' + x[2] + '"' + (i === 0 ? ' class="on"' : '') + '>' + ic(x[0]) + '<span>' + x[1] + '</span></button>'; }).join('') + '</nav>';
  }

  /* ── sheets ── */
  function sheet(title, html, onOpen) {
    var old = document.querySelector('.pm-sheet'); if (old) old.remove();
    var w = document.createElement('div'); w.className = 'pm-sheet';
    w.innerHTML = '<div class="pm-sb"></div><div class="pm-sc" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><i class="pm-grab"></i><div class="pm-st"><b>' + esc(title) + '</b><button type="button" class="pm-x" aria-label="إغلاق">' + ic('x') + '</button></div><div class="pm-sbody">' + html + '</div></div>';
    document.body.appendChild(w); document.documentElement.classList.add('pm-lock');
    var close = function () { w.classList.remove('in'); document.documentElement.classList.remove('pm-lock'); setTimeout(function () { w.remove(); }, 320); };
    w.querySelector('.pm-sb').onclick = close; w.querySelector('.pm-x').onclick = close;
    requestAnimationFrame(function () { w.classList.add('in'); });
    if (onOpen) onOpen(w, close);
    return close;
  }
  function orderSheet(svc, quote) {
    var opts = (C.services || []).map(function (s) { return '<option' + (s.t === svc ? ' selected' : '') + '>' + esc(s.t) + '</option>'; }).join('');
    sheet(quote ? 'اطلب عرض سعر' : 'اطلب خدمة الطباعة',
      '<form class="pm-form" id="pmF" novalidate><label>الاسم<input name="name" required maxlength="80" autocomplete="name" placeholder="اسمك"></label>' +
      '<label>اسم المركز / المستشفى<input name="center" maxlength="120" placeholder="مثال: مركز النور للأشعة"></label>' +
      '<label>رقم الموبايل<input name="phone" required inputmode="tel" dir="ltr" maxlength="16" autocomplete="tel" placeholder="01xxxxxxxxx"></label>' +
      '<label>الخدمة<select name="service">' + opts + '<option' + (quote ? ' selected' : '') + '>عرض سعر</option><option>حاجة تانية</option></select></label>' +
      '<label>تفاصيل (المقاسات، الكمية، نوع الطابعة…)<textarea name="note" rows="3" maxlength="600" placeholder="اكتب اللي محتاجه"></textarea></label>' +
      '<input name="hp" class="pm-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="pm-err" id="pmE" role="alert"></p><button type="submit" class="pm-sub">' + ic('send') + 'ابعت الطلب</button></form>',
      function (w) {
        var f = w.querySelector('#pmF');
        f.onsubmit = function (e) {
          e.preventDefault(); var b = {}; [].forEach.call(f.elements, function (x) { if (x.name) b[x.name] = x.value.trim(); });
          var er = w.querySelector('#pmE'); er.textContent = '';
          if (b.name.length < 2) { er.textContent = 'اكتب اسمك'; f.name.focus(); return; }
          if (b.phone.replace(/\D/g, '').length < 8) { er.textContent = 'اكتب رقم موبايل صحيح'; f.phone.focus(); return; }
          var bt = f.querySelector('.pm-sub'); bt.disabled = true; bt.lastChild.textContent = 'بيتبعت…';
          fetch('/promo/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || 'محصلش — جرّب تاني'); return j; }); })
            .then(function (j) {
              try { var L = JSON.parse(localStorage.getItem('pm-codes') || '[]'); L.unshift(j.code); localStorage.setItem('pm-codes', JSON.stringify(L.slice(0, 10))); } catch (x) {}
              var wa = waHref('السلام عليكم، بعت طلب من صفحة ' + (C.brand || 'Emdadx') + ' — رقم الطلب ' + j.code);
              w.querySelector('.pm-sbody').innerHTML = '<div class="pm-ok-w"><span class="pm-ok">' + ic('check') + '</span><b>طلبك وصل 🎉</b><p>هنكلمك في أقرب وقت. احتفظ برقم الطلب عشان تتابعه:</p><div class="pm-code" dir="ltr">' + esc(j.code) + '</div>' +
                (wa ? '<a class="pm-wa" href="' + esc(wa) + '" target="_blank" rel="noopener">' + ic('wa') + 'كمّل معانا على واتساب</a>' : '') + '</div>';
            }).catch(function (x) { er.textContent = x.message; bt.disabled = false; bt.lastChild.textContent = 'ابعت الطلب'; });
        };
      });
  }
  var ST = { new: ['⏳', 'وصلنا طلبك وهنكلمك قريب'], contacted: ['📞', 'تواصلنا معاك وشغالين على طلبك'], done: ['✅', 'طلبك اتنفّذ'] };
  function trackSheet() {
    var mine = []; try { mine = JSON.parse(localStorage.getItem('pm-codes') || '[]'); } catch (e) {}
    sheet('تابع طلبك', '<form class="pm-form" id="pmT"><label>رقم الطلب<input name="code" dir="ltr" maxlength="8" placeholder="مثال: K7Q2XM" style="text-transform:uppercase;letter-spacing:3px;text-align:center" value="' + esc(mine[0] || '') + '"></label><p class="pm-err" id="pmTE" role="alert"></p><button class="pm-sub" type="submit">' + ic('search') + 'اعرض حالة الطلب</button></form><div id="pmTR"></div>' +
      (mine.length > 1 ? '<div class="pm-mine">' + mine.map(function (c) { return '<button type="button" data-c="' + esc(c) + '" dir="ltr">' + esc(c) + '</button>'; }).join('') + '</div>' : ''), function (w) {
      var f = w.querySelector('#pmT');
      var go = function () {
        var k = f.code.value.trim(); if (!k) return; w.querySelector('#pmTE').textContent = '';
        fetch('/promo/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: k }) }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message); return j; }); })
          .then(function (j) { var s = ST[j.status] || ST.new; w.querySelector('#pmTR').innerHTML = '<div class="pm-trk"><span>' + s[0] + '</span><div><b>' + esc(s[1]) + '</b><small>' + esc(j.service || '') + ' · ' + new Date(j.at).toLocaleDateString('ar-EG') + '</small>' + (j.reply ? '<p>' + esc(j.reply) + '</p>' : '') + '</div></div>'; })
          .catch(function (x) { w.querySelector('#pmTE').textContent = x.message; w.querySelector('#pmTR').innerHTML = ''; });
      };
      f.onsubmit = function (e) { e.preventDefault(); go(); };
      [].forEach.call(w.querySelectorAll('[data-c]'), function (b) { b.onclick = function () { f.code.value = b.dataset.c; go(); }; });
      if (mine[0]) go();
    });
  }
  function supportSheet() {
    var wa = waHref('السلام عليكم، محتاج دعم فني');
    sheet('الدعم والتواصل', '<div class="pm-sup">' + (wa ? '<a class="pm-wa big" href="' + esc(wa) + '" target="_blank" rel="noopener">' + ic('wa') + '<span><b>واتساب</b><small>رد سريع من فريق الدعم</small></span></a>' : '') +
      (C.phone ? '<a class="pm-call big" href="tel:' + esc(C.phone) + '">' + ic('phone') + '<span><b>اتصل بنا</b><small dir="ltr">' + esc(C.phone) + '</small></span></a>' : '') +
      '<button type="button" class="pm-req big" data-go="order">' + ic('tools') + '<span><b>طلب صيانة أو دعم فني</b><small>ابعت تفاصيل المشكلة وهنكلمك</small></span></button></div>', function (w, close) {
      var b = w.querySelector('[data-go="order"]'); if (b) b.onclick = function () { close(); setTimeout(function () { orderSheet('دعم فني سريع'); }, 330); };
    });
  }

  /* ── render ── */
  var app = $('app');
  app.innerHTML = '<div class="pm-bgfx" aria-hidden="true"></div><main class="pm-w">' + header() + hero() + '<div id="pmSvc"></div>' + themeBody() + common() + '</main>' + nav();
  /* move the services anchor to the services heading */
  var firstSvc = app.querySelector('.pm-g2, .pm-g3'); if (firstSvc) { var a = $('pmSvc'); var h = firstSvc.previousElementSibling; (h && h.classList.contains('pm-shs') ? h.previousElementSibling : h || firstSvc).before(a); }

  /* one calm entrance: fade + slide up 30px, 500ms ease-out, staggered — plays once */
  [].forEach.call(app.querySelectorAll('.m'), function (el, i) { el.style.setProperty('--mi', Math.min(i, 14)); });
  document.body.classList.add('pm-in');
  setTimeout(function () { document.body.classList.add('pm-fin'); }, 150 + 15 * 60 + 700);

  /* hero slider: auto every 4.5s, swipe, dots */
  (function () {
    var hero = $('pmHero'); if (!hero) return;
    var S = hero.querySelectorAll('.pm-slide'), dots = hero.querySelectorAll('.pm-dots i'), i = 0, tm = 0, x0 = null;
    if (S.length < 2) return;
    function go(n) { S[i].classList.remove('on'); if (dots[i]) dots[i].classList.remove('on'); i = (n + S.length) % S.length; S[i].classList.add('on'); if (dots[i]) dots[i].classList.add('on'); }
    function auto() { clearInterval(tm); if (!RM) tm = setInterval(function () { go(i + 1); }, 4500); }
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) { go(i + (dx > 0 ? 1 : -1)); auto(); } }, { passive: true });
    [].forEach.call(dots, function (d, k) { d.onclick = function () { go(k); auto(); }; });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(tm); else auto(); });
    auto();
  })();

  /* count-up numbers when they come into view */
  (function () {
    var els = app.querySelectorAll('[data-n]'); if (!els.length || RM || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (E) { E.forEach(function (e) {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      var raw = e.target.dataset.n, m = raw.match(/^(\D*)(\d+)(\D*)$/); if (!m) return;
      var to = +m[2], t0 = performance.now();
      (function step(t) { var p = Math.min(1, (t - t0) / 900), v = Math.round(to * (1 - Math.pow(1 - p, 3))); e.target.textContent = m[1] + v + m[3]; if (p < 1) requestAnimationFrame(step); })(t0);
    }); }, { threshold: .5 });
    [].forEach.call(els, function (e) { io.observe(e); });
  })();

  /* every button that leads somewhere */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (!b || b.closest('.pm-sheet') && b.dataset.go === 'order' && b.closest('.pm-sup')) return;
    var g = b.dataset.go;
    if (b.closest('.pm-nav')) [].forEach.call(document.querySelectorAll('.pm-nav button'), function (x) { x.classList.toggle('on', x === b); });
    if (g === 'top') window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
    else if (g === 'svc') { var a = $('pmSvc'); if (a) window.scrollTo({ top: a.getBoundingClientRect().top + scrollY - 12, behavior: RM ? 'auto' : 'smooth' }); }
    else if (g === 'order') orderSheet(b.dataset.svc || '');
    else if (g === 'quote') orderSheet('', true);
    else if (g === 'track') trackSheet();
    else if (g === 'support') supportSheet();
  });
})();
