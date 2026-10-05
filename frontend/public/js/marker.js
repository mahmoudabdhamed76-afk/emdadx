/* ════════════════════════════════════════════════════════════════════
   EmdadX · قلم الهايلايتر الأخضر (4.14)
   أي رقم البرنامج بيكتبه باللون الأخضر (تحصيل، مدفوع، إجمالي، ربح، ▲ …)
   بياخد شكل خط قلم هايلايتر أخضر حقيقي — حواف غير منتظمة، لون أقوى في
   أول الضربة وبيخف في آخرها، وبيترسم من اليمين للشمال أول ما يظهر.
   بيشتغل لوحده على كل الصفحات والنوافذ والإشعارات، ومن غير ما نلمس أي
   صفحة: بيدوّر على النصوص اللي هي رقم بس ولونها المحسوب أخضر.
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var ROOTS = '#page-content, .modal-overlay, #axn, .mh-sheet, #pm-pop, .topbar';
  var SKIP = 'input, textarea, select, option, svg, canvas, script, style, #bottom-nav, .sidebar, .nav-item, .badge, .notif-dot, .mh-dot, .fc-day';
  var DIGIT = /[0-9٠-٩]/, LETTERS = /[A-Za-zء-ي]/g;
  var timer = 0, obs = null;

  function isNumberText(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length > 26 || !DIGIT.test(t)) return false;
    if ((t.match(LETTERS) || []).length > 6) return false;          // «16,500 ج» · «+12%» · «3,665 ورقة» yes — sentences no
    return /^[+\-−▲▼≈~(#]?\s*[0-9٠-٩]/.test(t);
  }
  function isGreen(el) {
    var c = getComputedStyle(el).color, m = c && c.match(/\d+(\.\d+)?/g); if (!m || m.length < 3) return false;
    var r = +m[0], g = +m[1], b = +m[2], a = m.length > 3 ? +m[3] : 1;
    return a > 0.5 && g >= 110 && g - r >= 45 && g - b >= 15;
  }
  function scanRoot(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { return DIGIT.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
    });
    var seen = [], n;
    while ((n = w.nextNode())) {
      var el = n.parentElement; if (!el || seen.indexOf(el) >= 0) continue;
      seen.push(el);
      if (el.closest(SKIP)) continue;
      if (el.classList.contains('ax-hl-in')) continue;
      // only an element that holds the number alone (no other elements with text inside)
      var only = Array.prototype.every.call(el.childNodes, function (c) { return c.nodeType === 3 || (c.nodeType === 1 && !c.textContent.trim()); });
      var txt = el.textContent;
      if (el.getAttribute('data-hlt') === txt) continue;              // already decided for this text
      el.setAttribute('data-hlt', txt);
      var had = el.classList.contains('ax-hl');
      if (had) el.classList.remove('ax-hl');                           // judge the page's own colour, not ours
      var on = only && isNumberText(txt) && isGreen(el);
      if (had && on) { el.classList.add('ax-hl'); continue; }
      if (on && !el.classList.contains('ax-hl')) {
        var tgt = el;
        if (getComputedStyle(el).display !== 'inline') {             // a cell / block: wrap the number so the stroke hugs the text
          tgt = document.createElement('span'); tgt.className = 'ax-hl-in';
          while (el.firstChild) tgt.appendChild(el.firstChild);
          el.appendChild(tgt); el.setAttribute('data-hlt', el.textContent);
          if (!isGreen(tgt)) continue;
        }
        tgt.classList.add('ax-hl'); tgt.classList.add('ax-hl-draw');
        setTimeout(function (e) { return function () { e.classList.remove('ax-hl-draw'); }; }(tgt), 900);
      }
      else if (!on && el.classList.contains('ax-hl')) el.classList.remove('ax-hl');
    }
  }
  function scan() {
    timer = 0;
    try { Array.prototype.forEach.call(document.querySelectorAll(ROOTS), scanRoot); } catch (e) { console.warn('[marker]', e); }
  }
  function later() { if (!timer) timer = setTimeout(scan, 140); }
  function boot() {
    if (obs) return;
    obs = new MutationObserver(later);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    later();
    // theme switch changes the computed colours → decide again
    new MutationObserver(function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-hlt]'), function (e) { e.removeAttribute('data-hlt'); e.classList.remove('ax-hl'); });
      later();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.AXMarker = { scan: scan, isGreen: isGreen, isNumberText: isNumberText };
})();
