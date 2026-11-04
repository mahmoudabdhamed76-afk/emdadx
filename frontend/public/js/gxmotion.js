/* ════════════════════════════════════════════════════════════════════
   4.67 · GX Motion — one premium entrance for every dashboard (GSAP 3)
   • cards/widgets fade in, rise 18px and settle from 98.5% → 100% scale,
     one after another in reading order (RTL: right → left, top → bottom)
   • one gsap.timeline per section; a new section kills the previous one
   • transforms + opacity only (GPU, no layout shift), inline styles are
     cleared at the end so the existing CSS (hover, sizes) is untouched
   • prefers-reduced-motion → nothing moves
   Used by the ERP (#page-content) and the QR Patient center (/k/…).
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var G = window.gsap; if (!G || window.GXMotion) return;
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var CARDS = [
    '.stat-card', '.dash-card', '.qa-card', '.kpi-card', '.card', '.panel', '.table-wrap', '.widget', '.tile',
    '.lx-stat', '.lx-card', '.lx-st', '.qrdd-kp > *', '.qrdd-ch', '.qrdd-qa', '.qrdd-w', '.dc-c', '.st-it', '.qrc', '.qx-card', '[data-gx-card]'
  ].join(',');
  var SKEL = '.sk, .skeleton, .skel, [aria-busy="true"]';
  var CFG = { y: 18, scale: 0.985, duration: 0.62, each: 0.055, maxStagger: 0.6, ease: 'power3.out', limit: 28 };
  var live = new Map(), seen = new WeakSet();

  document.documentElement.classList.add('gx-on');
  var css = document.createElement('style');
  /* the ERP's old CSS page fade is off — GSAP does the entrance (and a section's own fade can't restart when .page-enter is removed) */
  css.textContent = '.gx-on #page-content.page-enter,.gx-on #page-content>*{animation:none!important}' +
    '[data-gx]{transition:none!important;will-change:transform,opacity;backface-visibility:hidden}';
  document.head.appendChild(css);

  function visible(el) { if (!el.isConnected) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight * 1.35 && r.bottom > -40; }
  /* outermost matches only (a card inside a card moves with its parent), sorted the way the eye reads the page */
  function collect(root, only) {
    var all = [].slice.call(root.querySelectorAll(CARDS)), set = new Set(all);
    var out = all.filter(function (el) {
      if (only && !only(el)) return false;
      if (el.matches(SKEL)) return false;   /* loading placeholders: the real cards that replace them get the entrance */
      for (var p = el.parentElement; p && p !== root; p = p.parentElement) if (set.has(p)) return false;
      return visible(el);
    });
    /* the section's own headings / toolbars (direct children with no card inside) come in with the cards */
    if (!only) [].slice.call(root.children).forEach(function (ch) { if (!ch.matches(CARDS) && !ch.querySelector(CARDS) && visible(ch)) out.push(ch); });
    var rtl = (getComputedStyle(root).direction || document.dir) === 'rtl';
    out = out.map(function (el) { var r = el.getBoundingClientRect(); return { el: el, t: Math.round(r.top / 24), x: rtl ? -r.right : r.left }; })
      .sort(function (a, b) { return a.t - b.t || a.x - b.x; }).map(function (o) { return o.el; });
    return out.slice(0, CFG.limit);
  }
  function stop(key) { var c = live.get(key); if (c) { c.revert(); live.delete(key); } }
  /* the reusable piece: a timeline that brings a list of elements in */
  function reveal(els, key, delay) {
    if (!els.length) return null;
    var each = Math.min(CFG.each, CFG.maxStagger / els.length);
    var ctx = G.context(function () {
      els.forEach(function (el) {
        el.setAttribute('data-gx', ''); seen.add(el);
        /* a card's own CSS entrance (older pages) is jumped to its end, so it never plays twice or fights GSAP */
        if (el.getAnimations) el.getAnimations().forEach(function (a) { try { var t = a.effect && a.effect.getTiming(); if (t && t.iterations !== Infinity) a.finish(); } catch (er) {} });
      });
      /* cards inside a big card (a KPI row inside the hero) follow their parent with their own small cascade */
      var inner = [];
      els.forEach(function (el, i) { [].forEach.call(el.querySelectorAll(CARDS), function (c) { var p = c.parentElement; while (p && p !== el && !p.matches(CARDS)) p = p.parentElement; if (p === el && visible(c) && inner.length < 16) { c._gxAt = i * each; inner.push(c); } }); });
      inner.forEach(function (el) { el.setAttribute('data-gx', ''); });
      var all = els.concat(inner);
      var tl = G.timeline({ defaults: { ease: CFG.ease, duration: CFG.duration }, delay: delay || 0, onComplete: function () { all.forEach(function (el) { el.removeAttribute('data-gx'); }); if (live.get(key) === ctx) live.delete(key); } });
      tl.fromTo(els, { autoAlpha: 0, y: CFG.y, scale: CFG.scale, force3D: true }, { autoAlpha: 1, y: 0, scale: 1, stagger: each, clearProps: 'opacity,visibility,transform' }, 0);
      if (inner.length) tl.fromTo(inner, { autoAlpha: 0, y: CFG.y * 0.55, force3D: true }, { autoAlpha: 1, y: 0, duration: CFG.duration * 0.85, stagger: Math.min(0.045, 0.4 / inner.length), clearProps: 'opacity,visibility,transform' }, 0.16 + (inner[0]._gxAt || 0));
    });
    live.set(key, ctx);
    return ctx;
  }
  /* a section just appeared: animate what is on screen now, and for a short moment whatever it loads after (API data) */
  function enter(root, opt) {
    if (!root || RM.matches) return;
    opt = opt || {}; var key = opt.key || root;
    stop(key); if (root._gxObs) { root._gxObs.disconnect(); root._gxObs = null; }
    var first = collect(root); reveal(first, key, opt.delay);
    /* only a section that is still loading (no cards yet) is watched — a re-render of shown cards never replays */
    if (first.filter(function (el) { return el.matches(CARDS); }).length >= 2) return;
    var until = Date.now() + (opt.watch == null ? 1400 : opt.watch), pend = null;
    if (!('MutationObserver' in window) || opt.watch === 0) return;
    var mo = new MutationObserver(function () {
      if (Date.now() > until) { mo.disconnect(); root._gxObs = null; return; }
      if (pend) return;
      pend = requestAnimationFrame(function () { pend = null; var fresh = collect(root, function (el) { return !seen.has(el); }); if (fresh.length >= 1) { reveal(fresh, {}, 0); mo.disconnect(); root._gxObs = null; } });
    });
    mo.observe(root, { childList: true, subtree: true }); root._gxObs = mo;
    setTimeout(function () { if (root._gxObs === mo) { mo.disconnect(); root._gxObs = null; } }, (opt.watch == null ? 1400 : opt.watch) + 50);
  }
  window.GXMotion = { enter: enter, reveal: reveal, stop: stop, config: CFG };

  /* ── ERP: #page-content gets .page-enter on every navigate() → that's our cue ── */
  function hookErp() {
    var pc = document.getElementById('page-content'); if (!pc || pc._gxHook) return !!pc; pc._gxHook = true;
    /* navigate() to a new page adds .page-exit then .page-enter; a same-page refresh (live sync) only adds .page-enter — that one never replays */
    new MutationObserver(function () {
      if (pc.classList.contains('page-exit')) { pc._gxNav = true; return; }
      if (pc.classList.contains('page-enter') && pc._gxNav) { pc._gxNav = false; enter(pc, { key: 'erp' }); }
    })
      .observe(pc, { attributes: true, attributeFilter: ['class'] });
    if (pc.children.length) enter(pc, { key: 'erp' });
    return true;
  }
  /* ── QR Patient center: the center page fires «qrd:page» with the section shown ── */
  document.addEventListener('qrd:page', function (e) { var node = e.detail && e.detail.node; if (node) enter(node, { key: 'qrd' }); });
  if (!hookErp()) { var tries = 0; (function wait() { if (hookErp() || ++tries > 80) return; setTimeout(wait, 100); })(); }
})();
