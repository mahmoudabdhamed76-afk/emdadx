/* ════════════════════════════════════════════════════════════
   4.31 · رسومات الأقسام المتحركة (Hairline)
   كل قسم ليه رسمة خطوط متحركة بتلعب لوحدها وبترد على الماوس / اللمس،
   بتتحط في رأس الصفحة بلون القسم. المكتبة: vendor/hairline.js (MIT).
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  /* القسم → الرسمة + سطر قصير بيوصفها */
  var MAP = {
    issuances:   ['slow',      'الورق ماشي على السير للمراكز'],
    forecast:    ['phosphor',  'مين هيسحب امتى'],
    customers:   ['hub',       'كل المراكز متوصلة بيك'],
    invoices:    ['riffle',    'كل فاتورة في مكانها'],
    payments:    ['vault',     'الفلوس في الخزنة'],
    aging:       ['sieve',     'الديون متقسمة حسب عمرها'],
    transfers:   ['relay',     'الفلوس بتتنقل خطوة بخطوة'],
    cheques:     ['ax:cheques',   'الشيك بيتمضي ويتصرف'],
    debts:       ['settle',    'المديونية بتترتب وتتقفل'],
    suppliers:   ['ax:suppliers', 'البضاعة جاية من المورد'],
    purchases:   ['basket',    'اللي اشتريته داخل السلة'],
    inventory:   ['cabinet',   'المخازن ورفوفها'],
    stock:       ['drawer',    'جرد درج درج'],
    expenses:    ['loupe',     'كل مصروف تحت العدسة'],
    reports:     ['plot',      'الأرقام بتتكلم'],
    monthly:     ['stack',     'الشهر طبقة فوق طبقة'],
    profit:      ['ax:profit',    'المكسب بيعلى عمود ورا عمود'],
    aiassistant: ['query',     'اسأل وهو يرد'],
    approvals:   ['lockers',   'كل طلب مستني مفتاحه'],
    requests:    ['branches',  'الأفكار والطلبات بتتفرع'],
    users:       ['keyboard',  'فريق الشغل وصلاحياته'],
    audit:       ['terminal',  'كل تعديل متسجل'],
    security:    ['padlock',   'بياناتك مقفول عليها'],
    settings:    ['exploded',  'البرنامج طبقة طبقة']
  };
  var KEY = 'axhl';                    // '0' = الرسمة مطوية
  var cur = null;                      // { fig, box, page }
  var lib = null;

  function on() { return true; }                 // 4.32 · always on, no close button
  function page() { try { return typeof currentPage !== 'undefined' ? currentPage : ''; } catch (e) { return ''; } }
  function color(p) {
    try { var it = (typeof NAV_ITEMS !== 'undefined' ? NAV_ITEMS : []).filter(function (n) { return n.key === p; })[0]; return (it && it.color) || '#10b981'; } catch (e) { return '#10b981'; }
  }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  function drop() {
    if (!cur) return;
    try { cur.fig && cur.fig.destroy(); } catch (e) {}
    cur = null;
  }

  function mount() {
    var pc = document.getElementById('page-content'); if (!pc) return;
    var p = page(), m = MAP[p];
    if (cur && cur.page === p && cur.box.isConnected) return;     // already there
    drop();
    var make = m && (m[0].indexOf('ax:') === 0 ? (window.AXFigs || {})[m[0].slice(3)] : lib && lib[m[0]]);
    if (typeof make !== 'function') return;
    /* the first header of the page — the figure sits beside its title */
    var head = pc.querySelector('.page-header');
    if (head && head.closest('.modal, .sad')) head = null;
    var made = false;
    if (!head) {
      head = document.createElement('div');
      head.className = 'page-header hlx-own';
      var t = document.createElement('div'), tt = document.createElement('div');
      tt.className = 'page-title'; tt.textContent = (document.getElementById('topbar-title') || {}).textContent || '';
      t.appendChild(tt); head.appendChild(t);
      pc.insertBefore(head, pc.firstChild); made = true;
    }
    head.classList.add('hlx-head');
    head.style.setProperty('--hlx-c', color(p));
    var old = head.querySelector(':scope > .hlx'); if (old) old.remove();

    var wrap = document.createElement('div');
    wrap.className = 'hlx ax-hl-off' + (on() ? '' : ' off');
    var cap = document.createElement('small'); cap.className = 'hlx-cap'; cap.textContent = m[1];
    var box = document.createElement('div'); box.className = 'hlx-fig';
    wrap.appendChild(box); wrap.appendChild(cap);
    /* right beside the section's name, not pushed to the far side */
    var first = head.firstElementChild;
    if (first && first !== wrap) head.insertBefore(wrap, first.nextSibling); else head.appendChild(wrap);
    cur = { fig: null, box: wrap, page: p, made: made };
    if (!on()) return;
    try {
      cur.fig = make(box, { play: !reduced(), intensity: 0.65, label: m[1] });
    } catch (e) { wrap.remove(); cur = null; }
  }

  /* re-renders replace the page's html — put the figure back when that happens */
  var pend = 0;
  function soon() { if (pend) return; pend = requestAnimationFrame(function () { pend = 0; mount(); }); }
  function watch() {
    var pc = document.getElementById('page-content');
    if (!pc) { setTimeout(watch, 500); return; }
    new MutationObserver(function () {
      if (cur && !cur.box.isConnected) drop();
      if (!cur || cur.page !== page()) soon();
    }).observe(pc, { childList: true });
    soon();
  }

  /* start right away (our own figures need nothing); the library joins when it lands */
  if (window.Hairline) lib = window.Hairline;
  window.addEventListener('hairline:ready', function () { lib = window.Hairline; soon(); }, { once: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();

  window.AXHair = { mount: mount, map: MAP };
})();
