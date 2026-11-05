/* ════════════════════════════════════════════════════════════════════
   EMDADX · «صفحة الدعاية» (4.77) — the admin side of /promo
   · الطلبات: who asked for the printing service from the page, call /
     WhatsApp, mark contacted / done (+ a note the center sees when it
     follows its code), delete
   · التصميم والمحتوى: the 4 designs, texts, slides (drawn picture or an
     uploaded photo), features, services, numbers, with a live phone preview
   All data goes through /api/promo (admin only on the server too).
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var API = (typeof API_BASE !== 'undefined' ? API_BASE : '');
  var S = { tab: 'leads', d: null, c: null, f: 'all', dirty: false };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function T(m, t) { if (typeof toast === 'function') toast(m, t || 'success'); }
  function g(id) { return document.getElementById(id); }
  function api(method, path, body) {
    return fetch(API + '/api/promo' + (path || ''), { method: method, credentials: 'same-origin', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error((j && j.message) || 'محصلش — جرّب تاني'); return j; }); });
  }
  function link() { return location.origin + (typeof APP_PATH !== 'undefined' && APP_PATH ? APP_PATH : '') + '/promo'; }
  function waNum(n) { return String(n || '').replace(/[^\d]/g, '').replace(/^00/, '').replace(/^0(?=1\d{9}$)/, '20'); }
  function when(t) { if (!t) return ''; var d = new Date(t), s = (Date.now() - t) / 1000; if (s < 3600) return 'من ' + Math.max(1, Math.round(s / 60)) + ' دقيقة'; if (s < 86400) return 'من ' + Math.round(s / 3600) + ' ساعة'; return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }); }

  var THEMES = [['1', 'الأزرق الكلاسيك', '#0B3D91', '#1D5FD6'], ['2', 'الوردي الفاخر', '#5B1240', '#C42F72'], ['3', 'الكحلي بالأرقام', '#061A3F', '#1E63D6'], ['4', 'الفاتح الطبي', '#A9C6EA', '#1E5BB8']];
  var ARTN = { monitor: 'شاشة + طابعة', film: 'فيلم في الإيد', ring: 'طابعة بحلقة نور', clinic: 'غرفة أشعة' };
  var ICN = { printer: 'طابعة', film: 'فيلم', paper: 'ورق/خامات', tools: 'صيانة', support: 'دعم فني', bolt: 'سرعة', shield: 'جودة', clock: 'وقت', layers: 'مقاسات', hand: 'شراكة', image: 'صورة', hospital: 'مستشفى', scan: 'مركز أشعة', clinic: 'عيادة', tag: 'سعر', doc: 'ملف', wa: 'واتساب', star: 'نجمة', truck: 'توصيل', check: 'صح' };
  var STN = { new: ['جديد', '#F59E0B'], contacted: ['اتواصلنا', '#2563EB'], done: ['اتنفّذ', '#16A34A'] };

  function css() {
    if (g('pmx-css')) return;
    var st = document.createElement('style'); st.id = 'pmx-css';
    st.textContent = '.pmx{display:grid;gap:16px}.pmx-top{display:flex;flex-wrap:wrap;align-items:center;gap:14px;justify-content:space-between}' +
      '.pmx-top h2{margin:0;font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px}.pmx-top small{display:block;color:var(--text-muted,#64748b);font-size:12.5px;margin-top:2px}' +
      '.pmx-link{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.pmx-url{direction:ltr;font-weight:700;padding:8px 12px;border-radius:10px;background:var(--tint-sky,#e7f1fd);color:#1d4ed8;font-size:13px}' +
      '.pmx-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pmx-kpi div{padding:12px 14px;border-radius:14px;background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb)}.pmx-kpi b{display:block;font-size:22px;font-weight:900}.pmx-kpi span{font-size:12px;color:var(--text-muted,#64748b)}' +
      '.pmx-tabs{display:flex;gap:6px;flex-wrap:wrap}.pmx-tabs button{border:1px solid var(--border,#e5e7eb);background:var(--surface,#fff);border-radius:12px;padding:9px 16px;font:inherit;font-weight:700;cursor:pointer;color:inherit}.pmx-tabs button.on{background:#1D5FD6;border-color:#1D5FD6;color:#fff}' +
      '.pmx-f{display:flex;gap:6px;flex-wrap:wrap}.pmx-f button{border:0;background:var(--tint-sky,#eef2ff);border-radius:999px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;color:inherit}.pmx-f button.on{background:#0F172A;color:#fff}' +
      '.pmx-l{display:grid;gap:10px}.pmx-ld{padding:14px 16px;border-radius:16px;background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);display:grid;gap:8px}' +
      '.pmx-ld header{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.pmx-ld header b{font-size:15px}.pmx-ld header time{margin-inline-start:auto;font-size:12px;color:var(--text-muted,#64748b)}' +
      '.pmx-st{font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:999px;color:#fff}.pmx-cd{direction:ltr;font-weight:800;letter-spacing:2px;font-size:12px;padding:2px 8px;border-radius:8px;background:var(--tint-amber,#fef6e7)}' +
      '.pmx-ld p{margin:0;font-size:13.5px;line-height:1.8;white-space:pre-wrap}.pmx-ld .mt{font-size:12.5px;color:var(--text-muted,#64748b)}.pmx-ld .rp{font-size:12.5px;padding:8px 10px;border-radius:10px;background:var(--tint-emerald,#e6f7f0)}' +
      '.pmx-ld footer{display:flex;flex-wrap:wrap;gap:6px}.pmx-e{padding:30px;text-align:center;color:var(--text-muted,#64748b)}' +
      '.pmx-ed{display:grid;grid-template-columns:minmax(0,1fr) 414px;gap:18px;align-items:start}@media(max-width:1100px){.pmx-ed{grid-template-columns:1fr}.pmx-pv{display:none}}' +
      '.pmx-sec{padding:16px;border-radius:16px;background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);display:grid;gap:12px}.pmx-sec h3{margin:0;font-size:15.5px;font-weight:800}.pmx-sec h3 small{font-weight:500;color:var(--text-muted,#64748b);font-size:12px;margin-inline-start:6px}' +
      '.pmx-th{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pmx-th button{border:2px solid var(--border,#e5e7eb);background:var(--surface,#fff);border-radius:14px;padding:8px;cursor:pointer;font:inherit;font-size:12.5px;font-weight:700;color:inherit;display:grid;gap:6px}.pmx-th button.on{border-color:#1D5FD6;box-shadow:0 0 0 3px rgba(29,95,214,.18)}' +
      '.pmx-th i{display:block;height:54px;border-radius:10px}.pmx-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pmx-g .full{grid-column:1/-1}.pmx-g label{display:grid;gap:4px;font-size:12.5px;font-weight:700}' +
      '.pmx-row{display:grid;gap:8px;padding:12px;border-radius:12px;background:var(--tint-sky,#f4f7fd);border:1px solid var(--border,#e5e7eb)}.pmx-row .hd{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px}.pmx-row .hd .sp{margin-inline-start:auto;display:flex;gap:4px}' +
      '.pmx-row .hd button{border:0;background:var(--surface,#fff);border-radius:8px;width:28px;height:28px;cursor:pointer;color:inherit}.pmx-mini{display:grid;grid-template-columns:1fr 1fr 130px;gap:8px}.pmx-mini3{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '.pmx-img{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.pmx-img img{width:96px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--border,#e5e7eb)}' +
      '.pmx-pv{position:sticky;top:76px}.pmx-ph{width:414px;height:800px;border-radius:44px;padding:12px;background:#0F172A;box-shadow:0 30px 60px -30px rgba(2,6,23,.6)}.pmx-ph iframe{width:100%;height:100%;border:0;border-radius:34px;background:#fff}' +
      '.pmx-save{position:sticky;bottom:12px;z-index:5;display:flex;gap:8px;justify-content:flex-start;padding:10px;border-radius:14px;background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);box-shadow:0 12px 30px -18px rgba(2,6,23,.45)}' +
      '.pmx-sw{display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:13px}.pmx-sw input{width:40px;height:22px;accent-color:#16A34A}' +
      '@media(max-width:700px){.pmx-kpi{grid-template-columns:repeat(2,1fr)}.pmx-th{grid-template-columns:repeat(2,1fr)}.pmx-g{grid-template-columns:1fr}.pmx-mini{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }

  function load() { return api('GET', '').then(function (d) { S.d = d; S.c = JSON.parse(JSON.stringify(d.cfg)); S.dirty = false; }); }

  function render() {
    var root = g('pmx-root'); if (!root) return;
    if (!S.d) { root.innerHTML = '<div class="pmx-e">جاري التحميل…</div>'; load().then(render).catch(function (e) { root.innerHTML = '<div class="pmx-e">' + esc(e.message) + '</div>'; }); return; }
    var L = S.d.leads || [], nw = L.filter(function (x) { return x.status === 'new'; }).length;
    root.innerHTML = '<div class="pmx">' +
      '<div class="card pmx-top"><div><h2>📣 صفحة الدعاية <label class="pmx-sw"><input type="checkbox" id="pmxOn"' + (S.d.cfg.on ? ' checked' : '') + '>' + (S.d.cfg.on ? 'شغّالة' : 'مقفولة') + '</label></h2><small>صفحة للموبايل تعرض فيها خدمة طباعة الأشعة — تبعتها للمراكز أو تحطها في إعلان، واللي يطلب الخدمة يوصلك هنا</small></div>' +
      '<div class="pmx-link"><span class="pmx-url">' + esc(link()) + '</span><button class="btn btn-secondary btn-sm" id="pmxCp">نسخ اللينك</button><a class="btn btn-secondary btn-sm" href="' + esc(link()) + '" target="_blank" rel="noopener">فتح الصفحة</a><button class="btn btn-success btn-sm" id="pmxWa">ابعتها واتساب</button></div></div>' +
      '<div class="pmx-kpi"><div><b>' + (S.d.today || 0) + '</b><span>زيارة النهارده</span></div><div><b>' + (S.d.views || 0) + '</b><span>زيارة آخر 30 يوم</span></div><div><b>' + nw + '</b><span>طلب جديد</span></div><div><b>' + L.length + '</b><span>كل الطلبات</span></div></div>' +
      '<div class="pmx-tabs"><button data-t="leads" class="' + (S.tab === 'leads' ? 'on' : '') + '">🖨️ الطلبات' + (nw ? ' (' + nw + ')' : '') + '</button><button data-t="design" class="' + (S.tab === 'design' ? 'on' : '') + '">🎨 التصميم والمحتوى</button></div>' +
      '<div id="pmxBody"></div></div>';
    [].forEach.call(root.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { if (S.tab === 'design' && S.dirty && !confirm('فيه تعديلات مش محفوظة — تسيبها؟')) return; if (S.tab === 'design' && S.dirty) { S.c = JSON.parse(JSON.stringify(S.d.cfg)); S.dirty = false; } S.tab = b.dataset.t; render(); }; });
    g('pmxCp').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(link()) : Promise.reject()).then(function () { T('✓ اتنسخ'); }).catch(function () { prompt('انسخ اللينك', link()); }); };
    g('pmxWa').onclick = function () { window.open('https://wa.me/?text=' + encodeURIComponent('🖨️ خدمة طباعة أفلام الأشعة من ' + (S.d.cfg.brand || 'Emdadx') + '\nاعرف التفاصيل واطلب من هنا:\n' + link()), '_blank'); };
    g('pmxOn').onchange = function () { var on = this.checked, c = JSON.parse(JSON.stringify(S.d.cfg)); c.on = on; api('POST', '/cfg', { cfg: c }).then(function (j) { S.d.cfg = j.cfg; if (!S.dirty) S.c = JSON.parse(JSON.stringify(j.cfg)); else S.c.on = on; T(on ? 'الصفحة شغّالة ✓' : 'الصفحة اتقفلت'); render(); }).catch(function (e) { T(e.message, 'error'); }); };
    if (S.tab === 'leads') leads(); else design();
  }

  function leads() {
    var el = g('pmxBody'), L = (S.d.leads || []).filter(function (x) { return S.f === 'all' || x.status === S.f; });
    var cnt = function (k) { return (S.d.leads || []).filter(function (x) { return k === 'all' || x.status === k; }).length; };
    el.innerHTML = '<div class="pmx-f">' + [['all', 'الكل'], ['new', 'جديد'], ['contacted', 'اتواصلنا'], ['done', 'اتنفّذ']].map(function (f) { return '<button data-f="' + f[0] + '" class="' + (S.f === f[0] ? 'on' : '') + '">' + f[1] + ' · ' + cnt(f[0]) + '</button>'; }).join('') + '</div>' +
      '<div class="pmx-l" style="margin-top:10px">' + (L.length ? L.map(function (x) {
        var st = STN[x.status] || STN.new, wa = waNum(x.phone);
        var msg = 'السلام عليكم ' + x.name + ' 🌿\nمعاك ' + (S.d.cfg.brand || 'Emdadx') + ' — وصلنا طلبك' + (x.service ? ' (' + x.service + ')' : '') + ' رقم ' + x.code + '.';
        return '<article class="pmx-ld"><header><span class="pmx-st" style="background:' + st[1] + '">' + st[0] + '</span><b>' + esc(x.name) + '</b>' + (x.center ? '<span>· ' + esc(x.center) + '</span>' : '') + '<span class="pmx-cd">#' + esc(x.code) + '</span><time>' + esc(when(x.at)) + '</time></header>' +
          '<div class="mt">📞 <a href="tel:' + esc(x.phone) + '" dir="ltr">' + esc(x.phone) + '</a>' + (x.service ? ' · 🖨️ ' + esc(x.service) : '') + '</div>' + (x.note ? '<p>' + esc(x.note) + '</p>' : '') +
          (x.reply ? '<div class="rp">↩ اللي بيشوفه العميل: ' + esc(x.reply) + '</div>' : '') +
          '<footer><a class="btn btn-success btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + esc(wa) + '?text=' + encodeURIComponent(msg) + '">واتساب</a><a class="btn btn-secondary btn-sm" href="tel:' + esc(x.phone) + '">اتصال</a>' +
          (x.status !== 'contacted' ? '<button class="btn btn-secondary btn-sm" data-s="contacted" data-id="' + x.id + '">📞 اتواصلنا</button>' : '') + (x.status !== 'done' ? '<button class="btn btn-primary btn-sm" data-s="done" data-id="' + x.id + '">✓ اتنفّذ</button>' : '') + (x.status !== 'new' ? '<button class="btn btn-ghost btn-sm" data-s="new" data-id="' + x.id + '">↺ رجّعه جديد</button>' : '') +
          '<button class="btn btn-ghost btn-sm" data-r="' + x.id + '">✍️ رسالة للعميل</button><button class="btn btn-ghost btn-sm" style="color:#dc2626" data-del="' + x.id + '">🗑 مسح</button></footer></article>';
      }).join('') : '<div class="pmx-e card">لسه مفيش طلبات ' + (S.f === 'all' ? '— ابعت لينك الصفحة للمراكز 📣' : 'هنا') + '</div>') + '</div>';
    [].forEach.call(el.querySelectorAll('[data-f]'), function (b) { b.onclick = function () { S.f = b.dataset.f; leads(); }; });
    var upd = function (id, body) { api('POST', '/leads/' + id + '/status', body).then(function (j) { S.d.leads = j.leads; render(); }).catch(function (e) { T(e.message, 'error'); }); };
    [].forEach.call(el.querySelectorAll('[data-s]'), function (b) { b.onclick = function () { upd(b.dataset.id, { status: b.dataset.s }); }; });
    [].forEach.call(el.querySelectorAll('[data-r]'), function (b) { b.onclick = function () { var x = S.d.leads.filter(function (y) { return String(y.id) === b.dataset.r; })[0]; var r = prompt('رسالة تظهر للعميل لما يتابع رقم طلبه:', x.reply || ''); if (r == null) return; upd(x.id, { status: x.status === 'new' ? 'contacted' : x.status, reply: r }); }; });
    [].forEach.call(el.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { if (!confirm('تمسح الطلب ده نهائي؟')) return; api('POST', '/leads/' + b.dataset.del + '/delete').then(function (j) { S.d.leads = j.leads; T('اتمسح'); render(); }).catch(function (e) { T(e.message, 'error'); }); }; });
  }

  /* ── the editor ── */
  function inp(path, val, ph, max, extra) { return '<input class="form-control" data-k="' + path + '" value="' + esc(val || '') + '" placeholder="' + esc(ph || '') + '" maxlength="' + (max || 80) + '"' + (extra || '') + '>'; }
  function sel(path, val, map) { return '<select class="form-control" data-k="' + path + '">' + Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (k === val ? ' selected' : '') + '>' + esc(map[k]) + '</option>'; }).join('') + '</select>'; }
  function list(key, title, hint, max, rowFn, blank) {
    var A = S.c[key] || [];
    return '<section class="pmx-sec"><h3>' + title + '<small>' + hint + '</small></h3>' + A.map(function (x, i) {
      return '<div class="pmx-row"><div class="hd">#' + (i + 1) + '<span class="sp"><button type="button" data-mv="' + key + ':' + i + ':-1" title="فوق">↑</button><button type="button" data-mv="' + key + ':' + i + ':1" title="تحت">↓</button><button type="button" data-rm="' + key + ':' + i + '" title="شيل">✕</button></span></div>' + rowFn(x, i) + '</div>';
    }).join('') + (A.length < max ? '<button type="button" class="btn btn-secondary btn-sm" data-add="' + key + '" data-blank=\'' + esc(JSON.stringify(blank)) + '\'>+ زوّد</button>' : '') + '</section>';
  }
  function design() {
    var c = S.c, el = g('pmxBody');
    el.innerHTML = '<div class="pmx-ed"><div style="display:grid;gap:14px">' +
      '<section class="pmx-sec"><h3>شكل الصفحة<small>اختار تصميم من الأربعة</small></h3><div class="pmx-th">' + THEMES.map(function (t) { return '<button type="button" data-th="' + t[0] + '" class="' + (c.theme === t[0] ? 'on' : '') + '"><i style="background:linear-gradient(140deg,' + t[3] + ',' + t[2] + ')"></i>' + t[1] + '</button>'; }).join('') + '</div></section>' +
      '<section class="pmx-sec"><h3>البيانات الأساسية</h3><div class="pmx-g">' +
        '<label>اسم الشركة' + inp('brand', c.brand, 'Emdadx', 40) + '</label><label>الجملة اللي تحت الاسم' + inp('tagline', c.tagline, 'للتوريدات و حلول طباعة الأشعة', 80) + '</label>' +
        '<label>رقم الواتساب' + inp('wa', c.wa, '01xxxxxxxxx', 16, ' dir="ltr" inputmode="tel"') + '</label><label>رقم الاتصال' + inp('phone', c.phone, '01xxxxxxxxx', 16, ' dir="ltr" inputmode="tel"') + '</label>' +
        '<label>زرار الطلب (التصميم 1)' + inp('cta', c.cta, 'اطلب خدمة الطباعة الآن', 60) + '</label><label>زرار العرض (التصميم 4)' + inp('offer', c.offer, 'احصل على عرض مخصص لمركزك', 60) + '</label>' +
        '<label class="full">نبذة عن الشركة<textarea class="form-control" data-k="about" rows="3" maxlength="500">' + esc(c.about || '') + '</textarea></label></div></section>' +
      list('slides', 'سلايدات الواجهة', 'لحد 6 — كل سلايد صورة مرسومة أو صورة ترفعها', 6, function (x, i) {
        return '<div class="pmx-mini3"><label>العنوان' + inp('slides.' + i + '.title', x.title, 'خدمة طباعة', 60) + '</label><label>الكلمة الملوّنة (اختياري)' + inp('slides.' + i + '.hi', x.hi, 'أفلام الأشعة', 60) + '</label></div>' +
          '<label>الوصف' + inp('slides.' + i + '.sub', x.sub, 'جودة عالية ودقة تفاصيل', 140) + '</label>' +
          '<div class="pmx-mini3"><label>كلام الزرار (التصميم 2 و 3)' + inp('slides.' + i + '.btn', x.btn, 'اطلب الخدمة', 30) + '</label><label>الصورة المرسومة' + sel('slides.' + i + '.art', x.art, ARTN) + '</label></div>' +
          '<div class="pmx-img">' + (x.img ? '<img src="/promo/img/' + esc(x.img) + '" alt=""><button type="button" class="btn btn-ghost btn-sm" data-noimg="' + i + '">شيل الصورة (ارجع للمرسومة)</button>' : '') + '<label class="btn btn-secondary btn-sm" style="cursor:pointer">📷 ' + (x.img ? 'غيّر الصورة' : 'ارفع صورة بدل المرسومة') + '<input type="file" accept="image/png,image/jpeg,image/webp" data-up="' + i + '" hidden></label><small style="color:var(--text-muted,#64748b)">أحسن مقاس: عرض 1200 × ارتفاع 800</small></div>';
      }, { title: '', hi: '', sub: '', btn: '', art: 'monitor', img: '' }) +
      list('chips', 'المميزات', 'لحد 4 (تحت السلايد أو «لماذا نحن»)', 4, function (x, i) { return '<div class="pmx-mini3"><label>الميزة' + inp('chips.' + i + '.t', x.t, 'جودة عالية', 30) + '</label><label>الأيقونة' + sel('chips.' + i + '.ic', x.ic, ICN) + '</label></div>'; }, { t: '', ic: 'star' }) +
      list('services', 'الخدمات', 'لحد 8 — الضغط على أي خدمة بيفتح فورم الطلب عليها', 8, function (x, i) { return '<div class="pmx-mini"><label>الخدمة' + inp('services.' + i + '.t', x.t, 'طباعة أفلام الأشعة', 40) + '</label><label>تفصيلة صغيرة' + inp('services.' + i + '.s', x.s, 'A3 - A4 - B4', 60) + '</label><label>الأيقونة' + sel('services.' + i + '.ic', x.ic, ICN) + '</label></div>'; }, { t: '', s: '', ic: 'printer' }) +
      list('stats', 'الأرقام', 'لحد 3 — بتتعد لما تظهر', 3, function (x, i) { return '<div class="pmx-mini3"><label>الرقم' + inp('stats.' + i + '.n', x.n, '+150', 10) + '</label><label>معناه' + inp('stats.' + i + '.l', x.l, 'مركز أشعة تثق بنا', 30) + '</label></div>'; }, { n: '', l: '' }) +
      list('targets', 'بنخدم مين', 'لحد 3 (التصميم 4)', 3, function (x, i) { return '<div class="pmx-mini3"><label>الاسم' + inp('targets.' + i + '.t', x.t, 'مستشفيات', 30) + '</label><label>الأيقونة' + sel('targets.' + i + '.ic', x.ic, ICN) + '</label></div>'; }, { t: '', ic: 'hospital' }) +
      '<div class="pmx-save"><button class="btn btn-primary" id="pmxSave">💾 حفظ ونشر</button><button class="btn btn-ghost" id="pmxUndo">تراجع عن التعديلات</button><span id="pmxDirty" style="align-self:center;font-size:12.5px;color:#d97706">' + (S.dirty ? '● فيه تعديلات مش محفوظة' : '') + '</span></div>' +
      '</div><aside class="pmx-pv"><div class="pmx-ph"><iframe id="pmxIf" src="' + esc(link()) + '?pv=' + Date.now() + '" title="معاينة"></iframe></div><p style="text-align:center;font-size:12px;color:var(--text-muted,#64748b);margin:8px 0 0">المعاينة بتتحدث بعد الحفظ</p></aside></div>';
    wire(el);
  }
  function setK(path, v) { var p = path.split('.'), o = S.c; for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; dirty(); }
  function dirty() { S.dirty = true; var d = g('pmxDirty'); if (d) d.textContent = '● فيه تعديلات مش محفوظة'; }
  function wire(el) {
    [].forEach.call(el.querySelectorAll('[data-k]'), function (x) { x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', function () { setK(x.dataset.k, x.value); }); });
    [].forEach.call(el.querySelectorAll('[data-th]'), function (b) { b.onclick = function () { S.c.theme = b.dataset.th; dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-add]'), function (b) { b.onclick = function () { S.c[b.dataset.add].push(JSON.parse(b.dataset.blank)); dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-rm]'), function (b) { b.onclick = function () { var p = b.dataset.rm.split(':'); S.c[p[0]].splice(+p[1], 1); dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-mv]'), function (b) { b.onclick = function () { var p = b.dataset.mv.split(':'), A = S.c[p[0]], i = +p[1], j = i + (+p[2]); if (j < 0 || j >= A.length) return; var t = A[i]; A[i] = A[j]; A[j] = t; dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-noimg]'), function (b) { b.onclick = function () { S.c.slides[+b.dataset.noimg].img = ''; dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-up]'), function (x) { x.onchange = function () {
      var f = x.files && x.files[0]; if (!f) return; var i = +x.dataset.up;
      shrink(f).then(function (data) { return api('POST', '/img', { data: data }); }).then(function (j) { S.c.slides[i].img = j.id; dirty(); design(); T('📷 الصورة اترفعت — اضغط حفظ'); }).catch(function (e) { T(e.message || 'مش قادر أرفع الصورة', 'error'); });
    }; });
    g('pmxUndo').onclick = function () { S.c = JSON.parse(JSON.stringify(S.d.cfg)); S.dirty = false; design(); };
    g('pmxSave').onclick = function () {
      var b = this; b.disabled = true;
      api('POST', '/cfg', { cfg: S.c }).then(function (j) { S.d.cfg = j.cfg; S.c = JSON.parse(JSON.stringify(j.cfg)); S.dirty = false; T('✓ اتحفظ واتنشر'); design(); }).catch(function (e) { b.disabled = false; T(e.message, 'error'); });
    };
  }
  /* photos are resized in the browser to ≤1600px webp/jpeg before upload */
  function shrink(file) {
    return new Promise(function (ok, no) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return no(new Error('ارفع صورة PNG أو JPG أو WEBP'));
      var r = new FileReader(); r.onerror = function () { no(new Error('مش قادر أقرا الصورة')); };
      r.onload = function () {
        var im = new Image(); im.onerror = function () { no(new Error('الصورة دي مش سليمة')); };
        im.onload = function () {
          var k = Math.min(1, 1600 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          var out = cv.toDataURL('image/webp', .85); if (!/^data:image\/webp/.test(out)) out = cv.toDataURL('image/jpeg', .86);
          ok(out);
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  window.renderPromo = function () {
    var root = document.getElementById('page-content'); if (!root) return;
    css(); root.innerHTML = '<div id="pmx-root"></div>';
    S.d = null; render();
  };
  /* a new request while the page is open → refresh the list */
  try { if (typeof window.addEventListener === 'function') window.addEventListener('promo_lead', function () { if (g('pmx-root') && S.tab === 'leads' && !S.dirty) { S.d = null; render(); } }); } catch (e) {}
})();
