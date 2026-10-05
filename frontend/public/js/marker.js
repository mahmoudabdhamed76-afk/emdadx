/* ════════════════════════════════════════════════════════════════════
   EmdadX · قلم الهايلايتر (4.14 أخضر · 4.14.1 أحمر)
   • أي رقم البرنامج بيكتبه باللون الأخضر (تحصيل، مدفوع، إجمالي، ربح، ▲ …)
     بياخد ضربة قلم هايلايتر أخضر حقيقي.
   • أي كلام أو رقم بيكتبه باللون الأحمر (متبقي، متأخر، غير مدفوع، ▼ …)
     بياخد ضربة قلم هايلايتر أحمر/بمبي.
   حواف غير منتظمة، لون أقوى في أول الضربة وبيخف في آخرها، وبيترسم من
   اليمين للشمال أول ما يظهر. بيشتغل لوحده على كل الصفحات والنوافذ
   والإشعارات من غير ما نلمس أي صفحة: بيقيس اللون المحسوب لكل نص قصير.
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var ROOTS = '#page-content, .modal-overlay, #axn, .mh-sheet, #pm-pop, .topbar';
  var SKIP = 'input, textarea, select, option, button, svg, canvas, script, style, #bottom-nav, .sidebar, .nav-item, .badge, .notif-dot, .mh-dot, .fc-day, .ax-hl-off';
  var DIGIT = /[0-9٠-٩]/, LETTERS = /[A-Za-zء-ي]/g, WORDISH = /[0-9٠-٩A-Za-zء-ي]/;
  var timer = 0, obs = null;

  function clean(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function isNumberText(t) {
    t = clean(t);
    if (!t || t.length > 26 || !DIGIT.test(t)) return false;
    if ((t.match(LETTERS) || []).length > 6) return false;          // «16,500 ج.م» · «+12%» · «3,665 ورقة» yes — sentences no
    return /^[+\-−▲▼≈~(#]?\s*[0-9٠-٩]/.test(t);
  }
  function isShortText(t) {                                          // red: a word, a label or a number — not a paragraph
    t = clean(t);
    return !!t && t.length <= 40 && WORDISH.test(t) && t.split(' ').length <= 6;
  }
  function rgba(c) {
    var m = c && c.match(/\d+(\.\d+)?/g); if (!m || m.length < 3) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 };
  }
  function kindOf(el) {
    var c = rgba(getComputedStyle(el).color); if (!c || c.a <= 0.5) return null;
    if (c.g >= 110 && c.g - c.r >= 45 && c.g - c.b >= 15) return 'g';
    // red / rose — not orange or amber (g stays low against r), not pink-purple (b close to g)
    if (c.r >= 140 && c.r - c.g >= 70 && c.r - c.b >= 50 && c.g / c.r < 0.55 && Math.abs(c.g - c.b) <= 60) return 'r';
    return null;
  }
  function isGreen(el) { return kindOf(el) === 'g'; }
  function isPill(el) {                                              // a status pill with its own tint → the marker replaces the tint
    var cs = getComputedStyle(el), bg = rgba(cs.backgroundColor);
    return !!bg && bg.a > 0.03 && /^inline/.test(cs.display);
  }

  function judge(el) {
    var txt = el.textContent;
    if (el.getAttribute('data-hlt') === txt) return;                 // already decided for this text
    el.setAttribute('data-hlt', txt);
    var inner = null;
    for (var i = 0; i < el.children.length; i++) if (el.children[i].classList.contains('ax-hl-in')) inner = el.children[i];
    var tgtOld = inner || el, was = tgtOld.classList.contains('ax-hl');
    // clear our marks first so we measure the page's own colour, not ours
    tgtOld.classList.remove('ax-hl', 'ax-hl-r', 'ax-hl-draw'); el.classList.remove('ax-hl-host');
    var only = Array.prototype.every.call(el.childNodes, function (c) {
      return c.nodeType === 3 || c === inner || (c.nodeType === 1 && !c.textContent.trim());
    });
    if (!only) return;
    var k = kindOf(el);
    var ok = k === 'g' ? isNumberText(txt) : k === 'r' ? isShortText(txt) : false;
    if (!ok) return;
    var tgt = inner;
    if (!tgt) {
      if (getComputedStyle(el).display === 'inline') tgt = el;
      else {                                                         // a cell / pill / block: wrap the text so the stroke hugs it
        tgt = document.createElement('span'); tgt.className = 'ax-hl-in';
        while (el.firstChild) tgt.appendChild(el.firstChild);
        el.appendChild(tgt); el.setAttribute('data-hlt', el.textContent);
      }
    }
    if (tgt !== el && isPill(el)) el.classList.add('ax-hl-host');
    tgt.classList.add('ax-hl'); if (k === 'r') tgt.classList.add('ax-hl-r');
    if (!was) {
      tgt.classList.add('ax-hl-draw');
      setTimeout(function () { tgt.classList.remove('ax-hl-draw'); }, 900);
    }
  }
  function scanRoot(root, list) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { return WORDISH.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
    });
    var n;
    while ((n = w.nextNode())) {
      var el = n.parentElement; if (!el) continue;
      if (el.classList.contains('ax-hl-in')) el = el.parentElement;  // judge the host, not our wrapper
      if (!el || list.indexOf(el) >= 0 || el.closest(SKIP)) continue;
      list.push(el);
    }
  }
  function scan() {
    timer = 0;
    try {
      var list = [];                                                 // collect first, change the DOM after the walk
      Array.prototype.forEach.call(document.querySelectorAll(ROOTS), function (r) { scanRoot(r, list); });
      list.forEach(judge);
    } catch (e) { console.warn('[marker]', e); }
  }
  function later() { if (!timer) timer = setTimeout(scan, 140); }
  function boot() {
    if (obs) return;
    obs = new MutationObserver(later);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    later();
    // theme switch changes the computed colours → decide again
    new MutationObserver(function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-hlt]'), function (e) { e.removeAttribute('data-hlt'); });
      later();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.AXMarker = { scan: scan, kindOf: kindOf, isGreen: isGreen, isNumberText: isNumberText, isShortText: isShortText };
})();
