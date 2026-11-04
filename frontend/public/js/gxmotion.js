/* ════════════════════════════════════════════════════════════════════
   4.68 · GX Motion — one premium entrance for every dashboard (GSAP 3)
   • cards/widgets fade in, rise 26px and settle from 98.5% → 100% scale (0.8 s expo.out, 0.06 s apart),
   • the section title writes itself in, progress bars fill after their card,
     the active menu pill slides (stretch → settle) from the old item to the new,
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
  /* the reference «landCards»: y 26 · stagger 0.06 · scale 0.985 → 1 · 0.8 s · expo.out · clearProps transform,opacity */
  var CFG = { y: 26, scale: 0.985, duration: 0.8, each: 0.06, maxStagger: 0.75, ease: 'expo.out', limit: 28 };
  var live = new Map(), seen = new WeakSet();
  /* «handover»: where the incoming cards start their opacity (the outgoing page has just faded to this) */
  var HANDOVER = { v: 0.35 };

  document.documentElement.classList.add('gx-on');
  var css = document.createElement('style');
  /* the ERP's old CSS page fade is off — GSAP does the entrance (and a section's own fade can't restart when .page-enter is removed) */
  css.textContent = '.gx-on #page-content.page-enter,.gx-on #page-content>*{animation:none!important}' +
    /* the page you leave dims to the handover opacity and softens, instead of going black while the next one renders */
    '@media (prefers-reduced-motion:no-preference){.gx-on #page-content.page-exit{opacity:.35!important;filter:blur(4px);transform:none!important;transition:opacity .14s ease,filter .14s ease!important}}' +
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
      tl.fromTo(els, { autoAlpha: HANDOVER.v, y: CFG.y, scale: CFG.scale, force3D: true }, { autoAlpha: 1, y: 0, scale: 1, stagger: each, clearProps: 'opacity,visibility,transform' }, 0);
      /* progress bars inside the cards fill up after their card lands (scaleX, so widths never change) */
      var bars = [], rtl = document.documentElement.dir === 'rtl' || getComputedStyle(document.body).direction === 'rtl';
      els.forEach(function (el, i) { [].forEach.call(el.querySelectorAll('[style*="width"]'), function (b) {
        if (bars.length >= 40 || !/%/.test(b.style.width)) return; var r = b.getBoundingClientRect(), cs = getComputedStyle(b);
        if (r.height < 2 || r.height > 18 || r.width < 6 || (cs.backgroundColor === 'rgba(0, 0, 0, 0)' && cs.backgroundImage === 'none')) return;
        b._gxAt = i * each; bars.push(b);
      }); });
      bars.forEach(function (b) { b.setAttribute('data-gx', ''); all.push(b); });
      bars.forEach(function (b) { tl.fromTo(b, { scaleX: 0, transformOrigin: rtl ? '100% 50%' : '0% 50%' }, { scaleX: 1, duration: 0.9, ease: 'expo.out', clearProps: 'transform,transformOrigin' }, 0.28 + b._gxAt); });
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
  /* the section title writes itself in (clip from the reading start), like the reference */
  function title(el) {
    if (!el || RM.matches || !visible(el)) return;
    var rtl = getComputedStyle(el).direction === 'rtl';
    G.fromTo(el, { clipPath: rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', autoAlpha: 0.2 }, { clipPath: 'inset(0 0% 0 0%)', autoAlpha: 1, duration: 0.55, ease: 'power2.out', clearProps: 'clipPath,opacity,visibility' });
  }
  /* the active menu item's pill slides from the old item to the new one: it stretches over both, then settles (expo.out) */
  function morph(nav, fromRect, toEl) {
    if (!nav || !fromRect || !toEl || RM.matches) return;
    var to = toEl.getBoundingClientRect(), base = nav.getBoundingClientRect(), cs = getComputedStyle(toEl);
    if (!to.height || Math.abs(to.top - fromRect.top) < 2) return;
    if (getComputedStyle(nav).position === 'static') nav.style.position = 'relative';
    nav.style.isolation = 'isolate';
    var g = document.createElement('i'), off = function (r) { return { top: r.top - base.top + nav.scrollTop, left: r.left - base.left + nav.scrollLeft, width: r.width, height: r.height }; };
    g.setAttribute('aria-hidden', 'true');
    g.style.cssText = 'position:absolute;z-index:-1;pointer-events:none;display:block;border-radius:' + cs.borderRadius + ';background:' + (cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor) + ';box-shadow:' + cs.boxShadow;
    nav.appendChild(g);
    var a = off(fromRect), b = off(to), top = Math.min(a.top, b.top), bot = Math.max(a.top + a.height, b.top + b.height);
    toEl.style.setProperty('background', 'transparent', 'important'); toEl.style.setProperty('box-shadow', 'none', 'important');
    G.set(g, a);
    G.timeline({ onComplete: function () { g.remove(); toEl.style.removeProperty('background'); toEl.style.removeProperty('box-shadow'); } })
      .to(g, { top: top, height: bot - top, duration: 0.16, ease: 'power2.in' })
      .to(g, { top: b.top, height: b.height, left: b.left, width: b.width, duration: 0.42, ease: 'expo.out' });
  }
  window.GXMotion = { enter: enter, reveal: reveal, stop: stop, title: title, morph: morph, config: CFG, handover: HANDOVER };

  /* ── ERP: #page-content gets .page-enter on every navigate() → that's our cue ── */
  function hookErp() {
    var pc = document.getElementById('page-content'); if (!pc || pc._gxHook) return !!pc; pc._gxHook = true;
    /* navigate() to a new page adds .page-exit then .page-enter; a same-page refresh (live sync) only adds .page-enter — that one never replays */
    new MutationObserver(function () {
      if (pc.classList.contains('page-exit')) { pc._gxNav = true; return; }
      if (pc.classList.contains('page-enter') && pc._gxNav) { pc._gxNav = false; enter(pc, { key: 'erp' }); title(pc.querySelector('.page-header h1, .page-header h2, .page-title, h1')); }
    })
      .observe(pc, { attributes: true, attributeFilter: ['class'] });
    if (pc.children.length) enter(pc, { key: 'erp' });
    /* navigate() rebuilds the sidebar: remember where the active item was, then slide its pill to the new one */
    if (typeof window.navigate === 'function' && !window.navigate._gx) {
      var nav0 = window.navigate, w = function (page) {
        var nv = document.getElementById('sidebar-nav'), old = nv && nv.querySelector('.nav-item.active'), r = old && old.getBoundingClientRect();
        var tt = document.getElementById('topbar-title'), out = nav0.apply(this, arguments);
        try { var now = nv && nv.querySelector('.nav-item.active'); if (r && now && r.height) morph(nv, r, now); if (tt && page) title(tt); } catch (e) {}
        return out;
      };
      w._gx = true; window.navigate = w;
    }
    return true;
  }
  /* ── QR Patient center: the center page fires «qrd:page» with the section shown ── */
  var qrdLast = null;
  document.addEventListener('qrd:page', function (e) {
    var node = e.detail && e.detail.node; if (!node) return;
    enter(node, { key: 'qrd' });
    var pg = node.closest('.qrd-page'); title(pg && pg.querySelector('.qrd-page-title h1'));
    var nv = document.querySelector('.qrd-nav-list'), on = nv && nv.querySelector('a.on');
    if (on && qrdLast && qrdLast.el !== on && nv.offsetParent) morph(nv, qrdLast.r, on);
    if (on) qrdLast = { el: on, r: on.getBoundingClientRect() };
  });
  /* the pill must start from where the old item is on screen right now (the menu may have scrolled) */
  document.addEventListener('pointerdown', function (e) { var a = e.target.closest && e.target.closest('.qrd-nav-list a'); if (!a) return; var on = document.querySelector('.qrd-nav-list a.on'); if (on) qrdLast = { el: on, r: on.getBoundingClientRect() }; }, true);
  if (!hookErp()) { var tries = 0; (function wait() { if (hookErp() || ++tries > 80) return; setTimeout(wait, 100); })(); }
})();
