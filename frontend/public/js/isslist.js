/* ════════════════════════════════════════════════════════════════════
   EmdadX · صرف الورق — القايمة المنظمة (4.9)
   ------------------------------------------------------------------
   · كل عملية صرف كارت واحد، حتى لو فيها كذا صنف (نفس الرقم والمركز
     والتاريخ)، بدل صف لكل صنف
   · متقسمة بالأيام (النهارده / امبارح / …) أو بالمراكز، ولكل مجموعة
     إجمالي الفلوس واللي باقي
   · فلتر سريع بالحالة: غير مدفوع · جزئي · مدفوع · متأخر
   · على الموبايل: الكارت بيتلم في سطرين، والأزرار تحت بأسامي واضحة،
     والفلاتر بتتقفل في زرار «فلترة»
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PAGE = 40;
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var DAYS = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];

  function D() { return (typeof DB !== 'undefined' && DB && DB.data) || {}; }
  function A(k) { return Array.isArray(D()[k]) ? D()[k] : []; }
  function esc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s); }
  function cur() { return ((D().settings || {}).currency) || 'ج'; }
  function num(n) {
    n = Number(n) || 0;
    var whole = Math.abs(n - Math.round(n)) < 0.005;
    return n.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
  }
  function money(n) { return '‎' + num(n) + ' ' + cur(); }
  function today() { return (typeof todayStr === 'function') ? todayStr() : new Date().toISOString().slice(0, 10); }
  function addDays(ds, k) { var d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() + k); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 864e5); }
  function F() {
    if (typeof issuanceFilters === 'undefined') window.issuanceFilters = {};
    var f = issuanceFilters;
    if (f.search == null) f.search = '';
    ['from', 'to', 'customerId', 'productId', 'status'].forEach(function (k) { if (f[k] == null) f[k] = ''; });
    if (!f.group) f.group = 'day';
    if (!f.limit) f.limit = PAGE;
    return f;
  }
  function role() { return (typeof currentUser !== 'undefined' && currentUser && currentUser.role) || ''; }
  function canEdit() { return role() === 'admin' || role() === 'accountant'; }
  function canDelete() { return role() === 'admin'; }

  function dayLabel(ds) {
    var t = today();
    if (ds === t) return 'النهارده';
    if (ds === addDays(t, -1)) return 'امبارح';
    var d = new Date(ds + 'T00:00:00');
    if (isNaN(d)) return ds || '—';
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + (String(d.getFullYear()) !== t.slice(0, 4) ? ' ' + d.getFullYear() : '');
  }
  function shortDate(ds) { var d = new Date(ds + 'T00:00:00'); return isNaN(d) ? (ds || '') : d.getDate() + ' ' + MONTHS[d.getMonth()]; }

  /* ── one card per صرف: same number + center + date ── */
  function batches() {
    var m = {}, out = [];
    A('issuances').forEach(function (i) {
      var k = (i.number || i.id) + '|' + (i.customerId || '') + '|' + (i.date || '');
      var b = m[k];
      if (!b) {
        b = m[k] = { key: k, number: i.number, date: i.date || '', customerId: i.customerId, customerName: i.customerName || '—', items: [], total: 0, paid: 0, due: null, notes: '', createdAt: 0 };
        out.push(b);
      }
      b.items.push(i);
      b.total += Number(i.total) || 0;
      b.paid += Number(i.paid) || 0;
      b.createdAt = Math.max(b.createdAt, Number(i.createdAt) || 0);
      if (i.notes && !b.notes) b.notes = i.notes;
      var rem = (Number(i.total) || 0) - (Number(i.paid) || 0);
      if (i.dueDate && rem > 0.005 && (!b.due || i.dueDate < b.due)) b.due = i.dueDate;
    });
    var t = today();
    out.forEach(function (b) {
      b.items.sort(function (x, y) { return (x.batchIndex || 0) - (y.batchIndex || 0); });
      b.rem = Math.max(0, b.total - b.paid);
      b.status = b.rem <= 0.005 ? 'paid' : b.paid > 0.005 ? 'partial' : 'unpaid';
      b.late = b.due && b.due < t && b.rem > 0.005 ? daysBetween(b.due, t) : 0;
      b.qty = b.items.reduce(function (s, i) { return s + (Number(i.quantity) || 0); }, 0);
    });
    out.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || (Number(b.number) || 0) - (Number(a.number) || 0) || b.createdAt - a.createdAt; });
    return out;
  }

  function norm(s) { return (typeof normalizeArabic === 'function') ? normalizeArabic(s) : String(s || '').toLowerCase(); }
  function baseFilter(all) {
    var f = F(), q = norm(f.search.trim());
    return all.filter(function (b) {
      if (f.from && b.date < f.from) return false;
      if (f.to && b.date > f.to) return false;
      if (f.customerId && b.customerId !== f.customerId) return false;
      if (f.productId && !b.items.some(function (i) { return i.productId === f.productId; })) return false;
      if (q) {
        var hay = norm(b.customerName + ' ' + b.items.map(function (i) { return i.productName; }).join(' ') + ' ' + b.number + ' ' + (b.notes || ''));
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function byStatus(list, s) {
    if (!s) return list;
    if (s === 'late') return list.filter(function (b) { return b.late > 0; });
    if (s === 'open') return list.filter(function (b) { return b.rem > 0.005; });
    return list.filter(function (b) { return b.status === s; });
  }

  /* ── icons ── */
  var IC = {
    view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    pay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
  };
  var ST = { paid: 'مدفوع', partial: 'مدفوع جزئي', unpaid: 'غير مدفوع' };

  function dueChip(b) {
    if (b.rem <= 0.005 || !b.due) return '';
    if (b.late) return '<em class="isx-due late">متأخر ' + b.late + ' يوم</em>';
    var d = daysBetween(today(), b.due);
    if (d === 0) return '<em class="isx-due soon">ميعاده النهارده</em>';
    if (d === 1) return '<em class="isx-due soon">ميعاده بكرة</em>';
    if (d <= 7) return '<em class="isx-due soon">ميعاده خلال ' + d + ' أيام</em>';
    return '<em class="isx-due">ميعاده ' + shortDate(b.due) + '</em>';
  }

  function itemLine(i) {
    var unit = i.productUnit || i.unit || '';
    return '<li><b>' + esc(i.productName || 'صنف') + '</b><span>' + num(i.quantity) + (unit ? ' ' + esc(unit) : '') + ' × ' + num(i.unitPrice) + '</span>' +
      '<i>' + money(i.total) + '</i></li>';
  }

  function row(b, mode) {
    var multi = b.items.length > 1, first = b.items[0];
    var pct = b.total > 0 ? Math.min(100, Math.round(b.paid / b.total * 100)) : 100;
    var title = mode === 'center' ? dayLabel(b.date) : b.customerName;
    var items = multi
      ? '<ul class="isx-items">' + b.items.slice(0, 4).map(itemLine).join('') + (b.items.length > 4 ? '<li class="more">و ' + (b.items.length - 4) + ' أصناف كمان</li>' : '') + '</ul>'
      : '<div class="isx-one"><b>' + esc(first.productName || 'صنف') + '</b><span>' + num(first.quantity) + ((first.productUnit || first.unit) ? ' ' + esc(first.productUnit || first.unit) : '') + ' × ' + money(first.unitPrice) + '</span></div>';
    var k = esc(b.key).replace(/'/g, '&#39;');
    var acts = [];
    if (multi) acts.push(btn('isx-b', 'AXIss.batch(\'' + k + '\')', IC.list, 'الأصناف'));
    else acts.push(btn('', 'viewIssuance(\'' + first.id + '\')', IC.view, 'عرض'));
    if (!multi && canEdit()) acts.push(btn('', 'editIssuance(\'' + first.id + '\')', IC.edit, 'تعديل'));
    acts.push(btn('', 'printIssuance(\'' + first.id + '\')', IC.print, 'طباعة'));
    if (b.rem > 0.005) acts.push(btn('pay', 'openPaymentForm(\'' + b.customerId + '\')', IC.pay, 'تحصيل'));
    if (!multi && canDelete()) acts.push(btn('del', 'deleteIssuance(\'' + first.id + '\')', IC.del, 'حذف'));
    return '<article class="isx-row s-' + b.status + (b.late ? ' is-late' : '') + (multi ? ' multi' : ' one') + '">' +
      '<i class="isx-st" aria-hidden="true"></i>' +
      '<div class="isx-t"><b>' + esc(title) + '</b></div>' +
      '<div class="isx-what">' + items + '</div>' +
      '<div class="isx-meta"><span class="isx-no">#' + esc(b.number) + '</span>' + dueChip(b) +
        (b.notes ? '<span class="isx-note" title="' + esc(b.notes) + '">📝 ' + esc(b.notes.length > 34 ? b.notes.slice(0, 34) + '…' : b.notes) + '</span>' : '') + '</div>' +
      '<div class="isx-money">' +
        '<b class="isx-total">' + money(b.total) + '</b>' +
        '<span class="isx-bar" title="اتدفع ' + pct + '%"><i style="width:' + pct + '%"></i></span>' +
        '<span class="isx-rem">' + (b.rem > 0.005 ? 'باقي <b>' + money(b.rem) + '</b>' : 'اتدفع كله') + '</span>' +
      '</div>' +
      '<em class="isx-pill">' + ST[b.status] + '</em>' +
      '<div class="isx-acts">' + acts.join('') + '</div>' +
    '</article>';
  }
  function btn(cls, onclick, icon, label) {
    return '<button type="button" class="' + cls + '" onclick="' + onclick + '" title="' + label + '" aria-label="' + label + '">' + icon + '<span>' + label + '</span></button>';
  }

  function groups(list, mode) {
    var m = {}, out = [];
    list.forEach(function (b) {
      var k = mode === 'center' ? b.customerId : b.date;
      var g = m[k];
      if (!g) { g = m[k] = { key: k, label: mode === 'center' ? b.customerName : dayLabel(b.date), list: [], total: 0, rem: 0, last: b.date }; out.push(g); }
      g.list.push(b); g.total += b.total; g.rem += b.rem;
      if (b.date > g.last) g.last = b.date;
    });
    if (mode === 'center') out.sort(function (a, b) { return b.rem - a.rem || String(b.last).localeCompare(String(a.last)); });
    return out;
  }

  function drawList() {
    var host = document.getElementById('isx-list'); if (!host) return;
    var f = F(), all = batches(), base = baseFilter(all), list = byStatus(base, f.status);
    /* status chips (counts follow the other filters) */
    var cnt = function (s) { return byStatus(base, s).length; };
    var chips = [['', 'الكل'], ['open', 'عليها فلوس'], ['late', 'متأخر'], ['partial', 'جزئي'], ['paid', 'مدفوع']];
    var ch = document.getElementById('isx-chips');
    if (ch) ch.innerHTML = chips.map(function (c) {
      var n = cnt(c[0]);
      return '<button type="button" class="' + (f.status === c[0] ? 'on' : '') + (c[0] === 'late' && n ? ' warn' : '') + '" onclick="AXIss.status(\'' + c[0] + '\')" aria-pressed="' + (f.status === c[0]) + '">' + c[1] + ' <em>' + n + '</em></button>';
    }).join('');
    /* the "shown" stat follows every filter */
    var sh = document.getElementById('isx-shown');
    if (sh) {
      var tot = list.reduce(function (s, b) { return s + b.total; }, 0), paid = list.reduce(function (s, b) { return s + b.paid; }, 0);
      sh.innerHTML = '<div class="stat-label">المعروض دلوقتي</div><div class="stat-value">' + list.length + ' <small>عملية</small></div><div class="stat-sub">' + money(tot) + ' · اتحصّل ' + money(paid) + '</div>';
    }
    var fb = document.getElementById('isx-fcount');
    if (fb) { var n = ['customerId', 'productId', 'from', 'to'].filter(function (k) { return f[k]; }).length; fb.textContent = n ? n : ''; fb.style.display = n ? '' : 'none'; }

    if (!list.length) {
      var any = all.length > 0;
      host.innerHTML = '<div class="isx-empty"><div>📄</div><b>' + (any ? 'مفيش عمليات بالفلتر ده' : 'لسه مفيش عمليات صرف') + '</b>' +
        (any ? '<button type="button" onclick="AXIss.reset()">امسح الفلاتر</button>' : '<button type="button" class="pri" onclick="openIssuanceForm()">صرف ورق جديد</button>') + '</div>';
      return;
    }
    var shown = list.slice(0, f.limit), mode = f.group;
    host.innerHTML = groups(shown, mode).map(function (g) {
      return '<section class="isx-group">' +
        '<header class="isx-gh"><b>' + esc(g.label) + '</b><span>' + g.list.length + ' ' + (g.list.length === 1 ? 'عملية' : g.list.length <= 10 ? 'عمليات' : 'عملية') +
          ' · ' + money(g.total) + (g.rem > 0.005 ? ' · <em>باقي ' + money(g.rem) + '</em>' : '') + '</span></header>' +
        g.list.map(function (b) { return row(b, mode); }).join('') +
      '</section>';
    }).join('') +
    (list.length > shown.length ? '<button type="button" class="isx-more" onclick="AXIss.more()">اعرض ' + Math.min(PAGE, list.length - shown.length) + ' كمان <span>(فاضل ' + (list.length - shown.length) + ')</span></button>' : '');
  }

  function renderIssuances() {
    var root = document.getElementById('page-content'); if (!root) return;
    var f = F(), all = batches(), t = today(), ms = t.slice(0, 8) + '01';
    var todayB = all.filter(function (b) { return b.date === t; });
    var monthB = all.filter(function (b) { return b.date >= ms; });
    var monthQty = monthB.reduce(function (s, b) { return s + b.qty; }, 0), monthTot = monthB.reduce(function (s, b) { return s + b.total; }, 0);
    var open = all.filter(function (b) { return b.rem > 0.005; }), openTot = open.reduce(function (s, b) { return s + b.rem; }, 0);
    var late = all.filter(function (b) { return b.late > 0; }).length;
    var uninv = (typeof issUninvoicedCount === 'function') ? issUninvoicedCount() : 0;
    var C = A('customers').slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ar'); });
    var P = A('products');
    var fOpen = !!f._open || !!(f.customerId || f.productId || f.from || f.to);

    root.innerHTML =
      '<div class="page-header"><div><h2 class="page-title">📄 صرف الورق للمراكز</h2>' +
      '<p class="page-subtitle">كل عملية صرف بتتخصم من المخزن لوحدها وبتتضاف على حساب المركز</p></div></div>' +

      '<div class="section-action-bar">' +
        '<button class="btn btn-primary" onclick="openIssuanceForm()">' + IC.plus + ' صرف ورق جديد</button>' +
        '<button class="btn btn-secondary iss-toinv-btn" onclick="openInvoiceFromIssuances()">🧾 فاتورة من الصرف' + (uninv ? ' <span class="iss-uninv-badge">' + uninv + '</span>' : '') + '</button>' +
        '<button class="btn btn-secondary" onclick="exportCSV(\'issuances\')">📥 تصدير Excel</button>' +
      '</div>' +

      '<div class="stats-grid isx-stats">' +
        '<div class="stat-card info"><div class="stat-label">النهارده</div><div class="stat-value">' + todayB.length + ' <small>عملية</small></div><div class="stat-sub">' + money(todayB.reduce(function (s, b) { return s + b.total; }, 0)) + '</div></div>' +
        '<div class="stat-card success"><div class="stat-label">مصروف الشهر ده</div><div class="stat-value">' + num(monthQty) + '</div><div class="stat-sub">' + monthB.length + ' عملية · ' + money(monthTot) + '</div></div>' +
        '<div class="stat-card ' + (late ? 'danger' : 'warning') + '"><div class="stat-label">باقي على المراكز من الصرف</div><div class="stat-value">' + num(openTot) + ' <small>' + esc(cur()) + '</small></div><div class="stat-sub">' + open.length + ' عملية' + (late ? ' · <b>' + late + ' متأخرة</b>' : '') + '</div></div>' +
        '<div class="stat-card" id="isx-shown"></div>' +
      '</div>' +

      '<div class="isx-tools">' +
        '<div class="isx-top">' +
          '<label class="isx-search">' + IC.search + '<input type="search" id="iss-search" placeholder="دوّر باسم المركز أو الصنف أو الرقم" value="' + esc(f.search) + '" autocomplete="off"></label>' +
          '<button type="button" class="isx-ftoggle' + (fOpen ? ' on' : '') + '" onclick="AXIss.toggleF()" aria-expanded="' + fOpen + '">' + IC.filter + '<span>فلترة</span><em id="isx-fcount"></em></button>' +
          '<div class="isx-seg" role="group" aria-label="التقسيم">' +
            '<button type="button" class="' + (f.group === 'day' ? 'on' : '') + '" onclick="AXIss.group(\'day\')">بالأيام</button>' +
            '<button type="button" class="' + (f.group === 'center' ? 'on' : '') + '" onclick="AXIss.group(\'center\')">بالمراكز</button>' +
          '</div>' +
        '</div>' +
        '<div class="isx-filters" id="isx-filters"' + (fOpen ? '' : ' hidden') + '>' +
          '<select class="form-control" id="iss-customer"><option value="">كل المراكز</option>' + C.map(function (c) { return '<option value="' + c.id + '"' + (f.customerId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' +
          '<select class="form-control" id="iss-product"><option value="">كل الأصناف</option>' + P.map(function (p) { return '<option value="' + p.id + '"' + (f.productId === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select>' +
          '<label class="isx-date"><span>من</span><input class="form-control" type="date" id="iss-from" value="' + esc(f.from) + '"></label>' +
          '<label class="isx-date"><span>لحد</span><input class="form-control" type="date" id="iss-to" value="' + esc(f.to) + '"></label>' +
          '<button type="button" class="isx-reset" onclick="AXIss.reset()">امسح الفلاتر</button>' +
        '</div>' +
        '<div class="isx-chips" id="isx-chips" role="group" aria-label="الحالة"></div>' +
      '</div>' +

      '<div id="isx-list" class="isx-list"></div>';

    var to;
    var s = document.getElementById('iss-search');
    s.addEventListener('input', function (e) { F().search = e.target.value; F().limit = PAGE; clearTimeout(to); to = setTimeout(drawList, 180); });
    [['iss-customer', 'customerId'], ['iss-product', 'productId'], ['iss-from', 'from'], ['iss-to', 'to']].forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (el) el.addEventListener('change', function (e) { F()[p[1]] = e.target.value; F().limit = PAGE; drawList(); });
    });
    drawList();
  }

  /* a صرف with several items: list them with each item's own actions */
  function batch(key) {
    var b = batches().find(function (x) { return x.key === key; }); if (!b) return;
    var html = '<div class="isx-sheet">' +
      '<div class="isx-sheet-h"><div><b>' + esc(b.customerName) + '</b><span>' + dayLabel(b.date) + ' · ' + b.items.length + ' أصناف</span></div>' +
        '<div class="isx-sheet-m"><b>' + money(b.total) + '</b><span>' + (b.rem > 0.005 ? 'باقي ' + money(b.rem) : 'اتدفع كله') + '</span></div></div>' +
      '<ul class="isx-sheet-l">' + b.items.map(function (i) {
        var unit = i.productUnit || i.unit || '';
        return '<li><div><b>' + esc(i.productName || 'صنف') + '</b><span>' + num(i.quantity) + (unit ? ' ' + esc(unit) : '') + ' × ' + money(i.unitPrice) + ' = ' + money(i.total) + '</span></div>' +
          '<div class="isx-sheet-a">' +
            '<button type="button" onclick="closeModal();viewIssuance(\'' + i.id + '\')" title="عرض">' + IC.view + '</button>' +
            (canEdit() ? '<button type="button" onclick="closeModal();editIssuance(\'' + i.id + '\')" title="تعديل">' + IC.edit + '</button>' : '') +
            (canDelete() ? '<button type="button" class="del" onclick="closeModal();deleteIssuance(\'' + i.id + '\')" title="حذف">' + IC.del + '</button>' : '') +
          '</div></li>';
      }).join('') + '</ul></div>';
    openModal('عملية صرف #' + esc(b.number), html,
      '<button class="btn btn-secondary" onclick="closeModal();printIssuance(\'' + b.items[0].id + '\')">🖨 طباعة الإيصال</button>' +
      (b.rem > 0.005 ? '<button class="btn btn-primary" onclick="closeModal();openPaymentForm(\'' + b.customerId + '\')">💵 تحصيل</button>' : ''));
  }

  window.renderIssuances = renderIssuances;
  window.AXIss = {
    batches: batches, draw: drawList, batch: batch,
    status: function (s) { F().status = s; F().limit = PAGE; drawList(); },
    group: function (g) { F().group = g; renderIssuances(); },
    more: function () { F().limit += PAGE; drawList(); },
    toggleF: function () {
      var f = F(); f._open = !f._open;
      var p = document.getElementById('isx-filters'), b = document.querySelector('.isx-ftoggle');
      if (p) p.hidden = !f._open;
      if (b) { b.classList.toggle('on', f._open); b.setAttribute('aria-expanded', f._open); }
    },
    reset: function () {
      var g = F().group;
      window.issuanceFilters = { search: '', from: '', to: '', customerId: '', productId: '', status: '', group: g, limit: PAGE };
      try { issuanceFilters = window.issuanceFilters; } catch (e) {}
      renderIssuances();
    }
  };
})();
