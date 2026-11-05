/* ════════════════════════════════════════════════════════════════════
   EMDADX · «صفحة الدعاية» (4.77) — the admin side of /promo
   · الطلبات: who asked for the printing service from the page, call /
     WhatsApp, mark contacted / done (+ a note the center sees when it
     follows its code), delete
   · التصميم والمحتوى: the 6 designs, texts, slides (drawn picture or an
     uploaded photo), features, services, numbers, with a live phone preview
   All data goes through /api/promo (admin only on the server too).
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var API = (typeof API_BASE !== 'undefined' ? API_BASE : '');
  var S = { tab: 'stats', d: null, c: null, f: 'all', dirty: false, days: 30, st: null, pvMode: 'phone', pvSeq: 0, uploads: 0 };
  var ALONE = !!window.PMX_STANDALONE;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function T(m, t) { if (typeof toast === 'function') toast(m, t || 'success'); }
  function g(id) { return document.getElementById(id); }
  function api(method, path, body) {
    return fetch((window.PMX_BASE || (API + '/api/promo')) + (path || ''), { method: method, credentials: 'same-origin', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error((j && j.message) || 'محصلش — جرّب تاني'); return j; }); });
  }
  function link() { return location.origin + (typeof APP_PATH !== 'undefined' && APP_PATH ? APP_PATH : '') + '/promo'; }
  function waNum(n) { return String(n || '').replace(/[^\d]/g, '').replace(/^00/, '').replace(/^0(?=1\d{9}$)/, '20'); }
  function when(t) { if (!t) return ''; var d = new Date(t), s = (Date.now() - t) / 1000; if (s < 3600) return 'من ' + Math.max(1, Math.round(s / 60)) + ' دقيقة'; if (s < 86400) return 'من ' + Math.round(s / 3600) + ' ساعة'; return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }); }

  var THEMES = [['1', 'الأزرق الكلاسيك', '#0B3D91', '#1D5FD6'], ['2', 'الوردي الفاخر', '#5B1240', '#C42F72'], ['3', 'الكحلي بالأرقام', '#061A3F', '#1E63D6'], ['4', 'الفاتح الطبي', '#A9C6EA', '#1E5BB8'], ['5', 'الطبي الهادئ — اتجاه ١', '#FFFFFF', '#087F7C'], ['6', 'التقني الفاخر — اتجاه ٢', '#041322', '#00C6EF']];
  var ARTN = { monitor: 'شاشة + طابعة', film: 'فيلم في الإيد', ring: 'طابعة بحلقة نور', clinic: 'غرفة أشعة', studio: 'صورة الطابعة حسب التصميم', 'studio-light': 'صورة الطابعة الفاتحة', 'studio-dark': 'صورة الطابعة الكحلية' };
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
      '.pmx-pv{min-width:0}.pmx-ph{max-width:100%;margin:auto}.pmx-preview-tools{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.pmx-ed.pmx-wide{grid-template-columns:minmax(0,1fr)}.pmx-wide .pmx-pv{display:block!important;position:relative;top:auto;grid-row:1}.pmx-wide .pmx-ph{width:100%;max-width:none;border-radius:16px;height:780px}.pmx-wide .pmx-ph iframe{border-radius:8px}.pmx-range{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pmx-range input{width:100%;accent-color:#087F7C}.pmx-preview-status{font-size:12px;color:var(--text-muted,#64748b);margin:8px 0}.pmx-th button[data-th="5"] i{background-image:url(/promo-assets/studio-light.jpg)!important;background-size:cover;background-position:center}.pmx-th button[data-th="6"] i{background-image:url(/promo-assets/studio-dark.jpg)!important;background-size:cover;background-position:center}@media(max-width:1100px){.pmx-ed .pmx-pv{display:block;position:relative;top:auto;grid-row:1}.pmx-ph{height:680px;width:min(414px,100%)}}' +
      '.pmx-save{position:sticky;bottom:12px;z-index:5;display:flex;gap:8px;justify-content:flex-start;padding:10px;border-radius:14px;background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);box-shadow:0 12px 30px -18px rgba(2,6,23,.45)}' +
      '.pmx-sw{display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:13px}.pmx-sw input{width:40px;height:22px;accent-color:#16A34A}' +
      '.pmx-kpi6{grid-template-columns:repeat(6,minmax(0,1fr))}.pmx-kpi em{font-style:normal;font-size:11px;font-weight:800;margin-inline-start:4px}.pmx-kpi em.up{color:#16A34A}.pmx-kpi em.dn{color:#DC2626}' +
      '.pmx-live{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22C55E;margin-inline-end:5px;box-shadow:0 0 0 0 rgba(34,197,94,.6);animation:pmxP 1.6s infinite}@keyframes pmxP{70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}' +
      '.pmx-ch{width:100%;height:auto;display:block}.pmx-ch .gl{stroke:var(--border,#e5e7eb);stroke-width:1}.pmx-ch .tk{font-size:11px;fill:var(--text-muted,#64748b)}.pmx-ch .v{fill:#93B4F5}.pmx-ch .u{fill:#1D5FD6}.pmx-ch .l{fill:#F59E0B;stroke:var(--surface,#fff);stroke-width:2}.pmx-ch .b:hover .v{fill:#7AA2F2}' +
      '.pmx-lg{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--text-muted,#64748b)}.pmx-lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:5px;vertical-align:-1px}.pmx-lg i.v{background:#93B4F5}.pmx-lg i.u{background:#1D5FD6}.pmx-lg i.l{background:#F59E0B;border-radius:50%}' +
      '.pmx-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}@media(max-width:900px){.pmx-2{grid-template-columns:1fr}.pmx-kpi6{grid-template-columns:repeat(2,1fr)}}' +
      '.pmx-bars{display:grid;gap:7px}.pmx-bar{display:grid;grid-template-columns:minmax(90px,38%) 1fr 44px;align-items:center;gap:8px;font-size:13px}.pmx-bar span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pmx-bar i{display:block;height:10px;border-radius:6px;background:var(--tint-sky,#e7f1fd);position:relative;overflow:hidden}.pmx-bar i::after{content:"";position:absolute;inset:0 auto 0 0;width:var(--w);background:#1D5FD6;border-radius:6px}.pmx-bar b{text-align:left;font-variant-numeric:tabular-nums}' +
      '.pmx-hr{display:grid;grid-template-columns:repeat(24,1fr);gap:3px}.pmx-hr i{height:38px;border-radius:6px;background:rgba(29,95,214,calc(.08 + var(--a) * .92));position:relative}.pmx-hr span{position:absolute;bottom:-18px;left:0;right:0;text-align:center;font-size:10px;color:var(--text-muted,#64748b);font-style:normal}.pmx-hr{margin-bottom:18px}' +
      '.pmx-rc{display:grid;gap:4px}.pmx-rc div{display:grid;grid-template-columns:110px 1.4fr 1fr 1fr;gap:8px;font-size:12.5px;padding:7px 4px;border-bottom:1px solid var(--border,#e5e7eb)}.pmx-rc time{color:var(--text-muted,#64748b)}@media(max-width:700px){.pmx-rc div{grid-template-columns:1fr 1fr}}' +
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
      '<div class="pmx-tabs"><button data-t="stats" class="' + (S.tab === 'stats' ? 'on' : '') + '">📊 الإحصائيات</button><button data-t="leads" class="' + (S.tab === 'leads' ? 'on' : '') + '">🖨️ الطلبات' + (nw ? ' (' + nw + ')' : '') + '</button><button data-t="design" class="' + (S.tab === 'design' ? 'on' : '') + '">🎨 التصميم والمحتوى</button>' + (S.d.erp ? '<button data-t="ctl" class="' + (S.tab === 'ctl' ? 'on' : '') + '">🔐 صفحة التحكم</button>' : '') + (ALONE ? '<button id="pmxOut" style="margin-inline-start:auto">↩ خروج</button>' : '') + '</div>' +
      '<div id="pmxBody"></div></div>';
    [].forEach.call(root.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { if (S.tab === 'design' && S.dirty && !confirm('فيه تعديلات مش محفوظة — تسيبها؟')) return; if (S.tab === 'design' && S.dirty) { S.c = JSON.parse(JSON.stringify(S.d.cfg)); S.dirty = false; } S.tab = b.dataset.t; render(); }; });
    g('pmxCp').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(link()) : Promise.reject()).then(function () { T('✓ اتنسخ'); }).catch(function () { prompt('انسخ اللينك', link()); }); };
    g('pmxWa').onclick = function () { window.open('https://wa.me/?text=' + encodeURIComponent('🖨️ خدمة طباعة أفلام الأشعة من ' + (S.d.cfg.brand || 'Emdadx') + '\nاعرف التفاصيل واطلب من هنا:\n' + link()), '_blank'); };
    g('pmxOn').onchange = function () { var on = this.checked, c = JSON.parse(JSON.stringify(S.d.cfg)); c.on = on; api('POST', '/cfg', { cfg: c }).then(function (j) { S.d.cfg = j.cfg; if (!S.dirty) S.c = JSON.parse(JSON.stringify(j.cfg)); else S.c.on = on; T(on ? 'الصفحة شغّالة ✓' : 'الصفحة اتقفلت'); render(); }).catch(function (e) { T(e.message, 'error'); }); };
    if (g('pmxOut')) g('pmxOut').onclick = function () { fetch(location.pathname.replace(/\/$/, '') + '/logout', { method: 'POST' }).then(function () { location.reload(); }); };
    if (S.tab === 'leads') leads(); else if (S.tab === 'stats') statsView(); else if (S.tab === 'ctl') ctlView(); else design();
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

  /* ── 📊 the numbers ── */
  var SRCN = { direct: 'دخول مباشر', whatsapp: 'واتساب', facebook: 'فيسبوك', instagram: 'إنستجرام', google: 'جوجل', telegram: 'تيليجرام', tiktok: 'تيك توك', x: 'إكس', qr: 'باركود QR' };
  var DEVN = { mobile: '📱 موبايل', desktop: '🖥️ كمبيوتر', tablet: '📟 تابلت' };
  function bars(rows, label, max) {
    if (!rows.length) return '<p class="pmx-e" style="padding:12px">لسه مفيش بيانات</p>';
    var m = max || Math.max.apply(null, rows.map(function (r) { return r.n; })) || 1;
    return '<div class="pmx-bars">' + rows.map(function (r) { return '<div class="pmx-bar"><span>' + label(r) + '</span><i style="--w:' + Math.max(2, Math.round(r.n / m * 100)) + '%"></i><b>' + r.n + '</b></div>'; }).join('') + '</div>';
  }
  function chart(series, width) {
    var W = Math.max(520, Math.round(width || 720)), H = 200, pad = 26, n = series.length, mx = Math.max(1, Math.max.apply(null, series.map(function (x) { return x.v; }))), bw = (W - pad * 2) / n;
    var ticks = [0, Math.round(mx / 2), mx];
    var o = '<svg class="pmx-ch" viewBox="0 0 ' + W + ' ' + (H + 26) + '" role="img" aria-label="الزيارات في اليوم">';
    ticks.forEach(function (t) { var y = H - (t / mx) * (H - 20); o += '<line x1="' + pad + '" x2="' + (W - 4) + '" y1="' + y + '" y2="' + y + '" class="gl"/><text x="' + (pad - 6) + '" y="' + (y + 4) + '" class="tk" text-anchor="end">' + t + '</text>'; });
    series.forEach(function (d, i) {
      var h = (d.v / mx) * (H - 20), x = pad + i * bw + bw * .15, w = Math.max(2, bw * .7), hu = (d.u / mx) * (H - 20);
      o += '<g class="b"><rect x="' + (pad + i * bw) + '" y="0" width="' + bw + '" height="' + H + '" fill="transparent"/><rect x="' + x + '" y="' + (H - h) + '" width="' + w + '" height="' + h + '" rx="3" class="v"/><rect x="' + x + '" y="' + (H - hu) + '" width="' + w + '" height="' + hu + '" rx="3" class="u"/>' +
        (d.l ? '<circle cx="' + (x + w / 2) + '" cy="' + (H - h - 9) + '" r="4.5" class="l"/>' : '') +
        '<title>' + d.day + ' — ' + d.v + ' زيارة · ' + d.u + ' زائر' + (d.l ? ' · ' + d.l + ' طلب' : '') + '</title></g>';
      var stp = Math.max(1, Math.ceil(n / 8)); if (i === n - 1 || (i % stp === 0 && n - 1 - i >= stp * .6)) o += '<text x="' + (x + w / 2) + '" y="' + (H + 18) + '" class="tk" text-anchor="middle">' + d.day.slice(5).replace('-', '/') + '</text>';
    });
    return o + '</svg><div class="pmx-lg"><span><i class="v"></i>زيارات</span><span><i class="u"></i>زوّار مختلفين</span><span><i class="l"></i>يوم فيه طلب</span></div>';
  }
  function pct(a, b) { if (!b) return a ? '<em class="up">جديد</em>' : ''; var d = Math.round((a - b) / b * 100); return '<em class="' + (d >= 0 ? 'up' : 'dn') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '%</em>'; }
  function statsView() {
    var el = g('pmxBody');
    el.innerHTML = '<div class="pmx-f">' + [[1, 'النهارده'], [7, '7 أيام'], [30, '30 يوم'], [90, '3 شهور'], [365, 'سنة']].map(function (d) { return '<button data-d="' + d[0] + '" class="' + (S.days === d[0] ? 'on' : '') + '">' + d[1] + '</button>'; }).join('') + '<button id="pmxRf">↻ تحديث</button></div><div id="pmxSt" style="margin-top:12px"><div class="pmx-e">جاري التحميل…</div></div>';
    [].forEach.call(el.querySelectorAll('[data-d]'), function (b) { b.onclick = function () { S.days = +b.dataset.d; statsView(); }; });
    g('pmxRf').onclick = statsView;
    api('GET', '/stats?days=' + S.days).then(function (x) {
      S.st = x; var box = g('pmxSt'); if (!box) return;
      box.innerHTML = '<div class="pmx-kpi pmx-kpi6">' +
        '<div><b>' + x.views + '</b><span>زيارة ' + pct(x.views, x.pviews) + '</span></div><div><b>' + x.uniq + '</b><span>زائر مختلف</span></div>' +
        '<div><b>' + x.today + '</b><span>زيارة النهارده · ' + x.todayU + ' زائر</span></div><div><b>' + x.live + '</b><span>' + (x.live ? '<i class="pmx-live"></i>' : '') + 'موجود دلوقتي</span></div>' +
        '<div><b>' + x.leads + '</b><span>طلب ' + pct(x.leads, x.pleads) + '</span></div><div><b>' + x.conv + '%</b><span>نسبة اللي طلبوا من الزوار</span></div></div>' +
        '<section class="pmx-sec"><h3>الزيارات يوم بيوم<small>' + (x.days === 1 ? 'النهارده' : 'آخر ' + x.days + ' يوم') + '</small></h3>' + chart(x.series, box.clientWidth - 34) + '</section>' +
        '<div class="pmx-2">' +
          '<section class="pmx-sec"><h3>📍 الزوار منين<small>المدينة حسب الإنترنت</small></h3>' + bars(x.cities.map(function (r) { return { n: r.n, t: r.city + (r.region && r.region !== r.city ? '، ' + r.region : '') + (r.country ? ' — ' + r.country : '') }; }), function (r) { return esc(r.t); }) + '</section>' +
          '<section class="pmx-sec"><h3>🔗 جايين منين<small>اللينك اللي دخلوا منه</small></h3>' + bars(x.sources.map(function (r) { return { n: r.n, t: SRCN[r.k] || r.k }; }), function (r) { return esc(r.t); }) + '<small style="color:var(--text-muted,#64748b)">💡 حط <b dir="ltr">?src=qr</b> أو <b dir="ltr">?src=facebook</b> في آخر اللينك وانت بتنشره، عشان تعرف كل إعلان جاب كام زائر</small></section>' +
          '<section class="pmx-sec"><h3>📱 بيفتحوا من إيه</h3>' + bars(x.devices.map(function (r) { return { n: r.n, t: DEVN[r.k] || r.k }; }), function (r) { return esc(r.t); }) + bars(x.os.map(function (r) { return { n: r.n, t: r.k }; }), function (r) { return esc(r.t); }) + '</section>' +
          '<section class="pmx-sec"><h3>🌍 الدول</h3>' + bars(x.countries.map(function (r) { return { n: r.n, t: r.k || 'غير معروف' }; }), function (r) { return esc(r.t); }) + '</section>' +
        '</div>' +
        '<section class="pmx-sec"><h3>🕐 أكتر ساعات الزيارة<small>بتوقيت مصر</small></h3><div class="pmx-hr">' + x.hours.map(function (n, h) { var m = Math.max.apply(null, x.hours) || 1; return '<i style="--a:' + (n / m).toFixed(2) + '" title="الساعة ' + h + ' — ' + n + ' زيارة"><span>' + (h % 3 === 0 ? h : '') + '</span></i>'; }).join('') + '</div></section>' +
        '<section class="pmx-sec"><h3>👀 آخر الزيارات</h3><div class="pmx-rc">' + (x.recent.length ? x.recent.map(function (r) { return '<div><time>' + esc(when(r.at)) + '</time><span>' + esc(r.city || 'غير معروف') + (r.country ? ' — ' + esc(r.country) : '') + '</span><span>' + esc(DEVN[r.dev] || r.dev) + ' · ' + esc(r.os) + '</span><span>' + esc(SRCN[r.src] || r.src) + '</span></div>'; }).join('') : '<p class="pmx-e">لسه مفيش زيارات</p>') + '</div></section>';
    }).catch(function (e) { var box = g('pmxSt'); if (box) box.innerHTML = '<div class="pmx-e">' + esc(e.message) + '</div>'; });
  }

  /* ── 🔐 the control page (ERP only) ── */
  function ctlView() {
    var el = g('pmxBody'), t = S.d.ctl && S.d.ctl.token, url = t ? location.origin + '/promo/c/' + t : '';
    el.innerHTML = '<section class="pmx-sec"><h3>🔐 صفحة التحكم<small>لينك لوحده بباسوورد — فيه الإحصائيات والطلبات والتصميم، من غير ما تدخل البرنامج</small></h3>' +
      (t ? '<div class="pmx-link"><span class="pmx-url">' + esc(url) + '</span><button class="btn btn-secondary btn-sm" id="pcCp">نسخ</button><a class="btn btn-secondary btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener">فتح</a><button class="btn btn-success btn-sm" id="pcWa">ابعته واتساب</button></div>' +
        '<div class="pmx-link"><b>الباسوورد:</b><span class="pmx-url" id="pcPv" style="letter-spacing:2px">••••••</span><button class="btn btn-secondary btn-sm" id="pcShow">👁 اعرض</button></div>'
        : '<p style="margin:0">لسه مفيش صفحة تحكم — اعملها دلوقتي.</p>') +
      '<div class="pmx-link"><input class="form-control" id="pcNp" maxlength="40" dir="ltr" placeholder="' + (t ? 'باسوورد جديد (4 على الأقل)' : 'باسوورد (فاضي = عشوائي)') + '" style="max-width:260px"><button class="btn btn-primary btn-sm" id="pcSet">' + (t ? 'غيّر الباسوورد' : 'اعمل صفحة التحكم') + '</button>' +
      (t ? '<button class="btn btn-ghost btn-sm" id="pcRot" style="color:#dc2626">🔄 لينك جديد (القديم يقف)</button>' : '') + '</div>' +
      '<small style="color:var(--text-muted,#64748b)">تغيير الباسوورد أو اللينك بيخرّج أي حد فاتح الصفحة.</small></section>';
    var after = function (x) { S.d.ctl = { token: x.token }; ctlView(); if (g('pcPv') && x.pass) { g('pcPv').textContent = x.pass; var sb = g('pcShow'); if (sb) sb.remove(); } };
    if (g('pcCp')) g('pcCp').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { T('✓ اتنسخ'); }).catch(function () { prompt('انسخ اللينك', url); }); };
    if (g('pcWa')) g('pcWa').onclick = function () { api('POST', '/ctl/show').then(function (x) { window.open('https://wa.me/?text=' + encodeURIComponent('🔐 لوحة تحكم صفحة الدعاية\n' + url + (x.pass ? '\nالباسوورد: ' + x.pass : '')), '_blank'); }); };
    if (g('pcShow')) g('pcShow').onclick = function () { api('POST', '/ctl/show').then(function (x) { g('pcPv').textContent = x.pass || '—'; g('pcShow').remove(); }).catch(function (e) { T(e.message, 'error'); }); };
    g('pcSet').onclick = function () { var p = g('pcNp').value.trim(); if (t && p.length < 4) { T('اكتب باسوورد 4 حروف على الأقل', 'error'); return; } api('POST', '/ctl', { pass: p }).then(function (x) { T(t ? '🔑 الباسوورد اتغيّر' : '✓ صفحة التحكم جاهزة'); after(x); }).catch(function (e) { T(e.message, 'error'); }); };
    if (g('pcRot')) g('pcRot').onclick = function () { if (!confirm('تعمل لينك جديد؟ اللينك القديم هيقف خالص.')) return; api('POST', '/ctl', { rotate: true }).then(function (x) { T('🔄 اللينك اتغيّر'); after(x); }).catch(function (e) { T(e.message, 'error'); }); };
  }

  /* ── the editor ── */
  function inp(path, val, ph, max, extra) { return '<input class="form-control" data-k="' + path + '" value="' + esc(val || '') + '" placeholder="' + esc(ph || '') + '" maxlength="' + (max || 80) + '"' + (extra || '') + '>'; }
  function sel(path, val, map) { return '<select class="form-control" data-k="' + path + '">' + Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (k === val ? ' selected' : '') + '>' + esc(map[k]) + '</option>'; }).join('') + '</select>'; }
  function list(key, title, hint, max, rowFn, blank) {
    var A = getK(key) || [];
    return '<section class="pmx-sec"><h3>' + title + '<small>' + hint + '</small></h3>' + A.map(function (x, i) {
      return '<div class="pmx-row"><div class="hd">#' + (i + 1) + '<span class="sp"><button type="button" data-mv="' + key + ':' + i + ':-1" title="فوق">↑</button><button type="button" data-mv="' + key + ':' + i + ':1" title="تحت">↓</button><button type="button" data-rm="' + key + ':' + i + '" title="شيل">✕</button></span></div>' + rowFn(x, i) + '</div>';
    }).join('') + (A.length < max ? '<button type="button" class="btn btn-secondary btn-sm" data-add="' + key + '" data-blank=\'' + esc(JSON.stringify(blank)) + '\'>+ زوّد</button>' : '') + '</section>';
  }
  function getK(path) { return path.split('.').reduce(function (value, key) { return value && value[key]; }, S.c); }
  function imageEditor(key, id, fallback) {
    return '<div class="pmx-img">' + (id || fallback ? '<img src="' + esc(id ? '/promo/img/' + id : fallback) + '" alt="معاينة الصورة">' : '') +
      (id ? '<button type="button" class="btn btn-ghost btn-sm" data-noimg="' + key + '">شيل الصورة المرفوعة</button>' : '') +
      '<label class="btn btn-secondary btn-sm" style="cursor:pointer">📷 ' + (id ? 'غيّر الصورة' : 'ارفع صورة') + '<input type="file" accept="image/png,image/jpeg,image/webp" data-up="' + key + '" hidden></label><small>PNG / JPG / WebP — الصور المرفوعة تتبدل بحرية، والحفظ ينشر التعديل</small></div>';
  }
  function fitPreview() {
    var frame = g('pmxIf'); if (!frame) return;
    var shell = frame.parentNode;
    if (S.pvMode !== 'wide') { frame.style.cssText = ''; shell.style.height = ''; return; }
    var scale = Math.min(1, Math.max(0.15, (shell.clientWidth - 24) / 1200));
    shell.style.position = 'relative'; shell.style.overflow = 'hidden'; shell.style.height = Math.ceil(900 * scale + 24) + 'px';
    frame.style.cssText = 'position:absolute;right:12px;top:12px;width:1200px;height:900px;max-width:none;transform-origin:top right;transform:scale(' + scale + ')';
  }
  function preview() {
    clearTimeout(S.pvT);
    S.pvT = setTimeout(function () {
      var frame = g('pmxIf'); if (!frame || !S.c) return;
      var serial = ++S.pvSeq;
      api('POST', '/preview', { cfg: S.c }).then(function (j) {
        if (serial !== S.pvSeq || frame !== g('pmxIf')) return;
        frame.onload = fitPreview; frame.srcdoc = j.html; fitPreview();
        var status = g('pmxPreviewStatus'); if (status) status.textContent = 'معاينة التعديلات الحالية — الصفحة المنشورة مش هتتغير قبل الحفظ';
      }).catch(function (e) { var status = g('pmxPreviewStatus'); if (status && frame === g('pmxIf')) status.textContent = e.message || 'تعذّر تحديث المعاينة'; });
    }, 300);
  }
  function design() {
    var c = S.c, el = g('pmxBody');
    el.innerHTML = '<div class="pmx-ed' + (S.pvMode === 'wide' ? ' pmx-wide' : '') + '"><div style="display:grid;gap:14px">' +
      '<section class="pmx-sec"><h3>شكل الصفحة<small>٦ تصميمات — الاتجاهان الجديدان قابلان للتعديل بالكامل</small></h3><div class="pmx-th">' + THEMES.map(function (t) { return '<button type="button" data-th="' + t[0] + '" class="' + (c.theme === t[0] ? 'on' : '') + '"><i style="background:linear-gradient(140deg,' + t[3] + ',' + t[2] + ')"></i>' + t[1] + '</button>'; }).join('') + '</div></section>' +
      '<section class="pmx-sec"><h3>البيانات الأساسية</h3><div class="pmx-g">' +
        '<label>اسم الشركة' + inp('brand', c.brand, 'Emdadx', 40) + '</label><label>الجملة اللي تحت الاسم' + inp('tagline', c.tagline, 'للتوريدات و حلول طباعة الأشعة', 80) + '</label>' +
        '<label>رقم الواتساب' + inp('wa', c.wa, '01xxxxxxxxx', 16, ' dir="ltr" inputmode="tel"') + '</label><label>رقم الاتصال' + inp('phone', c.phone, '01xxxxxxxxx', 16, ' dir="ltr" inputmode="tel"') + '</label>' +
        '<label>زرار الطلب الرئيسي' + inp('cta', c.cta, 'اطلب خدمة الطباعة الآن', 60) + '</label><label>زرار العرض' + inp('offer', c.offer, 'احصل على عرض مخصص لمركزك', 60) + '</label>' +
        '<label class="full">نبذة عن الشركة<textarea class="form-control" data-k="about" rows="3" maxlength="500">' + esc(c.about || '') + '</textarea></label></div></section>' +
      ((c.theme === '5' || c.theme === '6') ? '<section class="pmx-sec"><h3>محتوى التصميم الجديد</h3><div class="pmx-g"><label>الزرار الثاني في السلايد' + inp('modern.secondary', (c.modern || {}).secondary, 'شاهد الخدمة', 40) + '</label><label>عنوان خطوات الخدمة' + inp('modern.stepsTitle', (c.modern || {}).stepsTitle, 'من الطلب إلى التشغيل', 80) + '</label><label>عنوان طلب عرض السعر' + inp('modern.quoteTitle', (c.modern || {}).quoteTitle, 'اطلب عرض سعر', 80) + '</label><label>كلام زرار عرض السعر' + inp('modern.quoteButton', (c.modern || {}).quoteButton, 'اطلب عرض سعر', 40) + '</label><label class="full">وصف عرض السعر' + inp('modern.quoteText', (c.modern || {}).quoteText, '', 180) + '</label><label class="pmx-sw"><input type="checkbox" data-b="modern.workOn"' + ((c.modern || {}).workOn !== false ? ' checked' : '') + '>إظهار الصورة الإضافية بجانب طلب العرض</label><label>عنوان الصورة الإضافية' + inp('modern.workTitle', (c.modern || {}).workTitle, '', 80) + '</label><label>وصف الصورة' + inp('modern.workAlt', (c.modern || {}).workAlt, '', 120) + '</label></div>' + imageEditor('modern.workImg', (c.modern || {}).workImg, '/promo-assets/studio-' + (c.theme === '6' ? 'dark' : 'light') + '.jpg') + '</section>' +
        list('modern.steps', 'خطوات الخدمة', 'تقدر تغيّر الكلام والأيقونة والترتيب أو تمسح الخطوات', 6, function (x, i) { return '<div class="pmx-mini3"><label>العنوان' + inp('modern.steps.' + i + '.t', x.t, '', 60) + '</label><label>الوصف' + inp('modern.steps.' + i + '.s', x.s, '', 100) + '</label><label>الأيقونة' + sel('modern.steps.' + i + '.ic', x.ic, ICN) + '</label></div>'; }, { t: 'خطوة جديدة', s: '', ic: 'check' }) : '') +
      '<section class="pmx-sec"><h3>حركة السلايدر</h3><div class="pmx-g">' +
        '<label>يقلب كل كام ثانية<input class="form-control" type="number" min="3" max="12" step="0.5" data-k="slider.sec" value="' + esc((c.slider || {}).sec || 4.5) + '"></label>' +
        '<label>نوع الحركة' + sel('slider.fx', (c.slider || {}).fx || 'fade', { fade: 'ظهور تدريجي', slide: 'انزلاق', zoom: 'زووم هادي' }) + '</label>' +
        '<label class="pmx-sw"><input type="checkbox" data-b="slider.auto"' + ((c.slider || {}).auto !== false ? ' checked' : '') + '>يقلب لوحده</label>' +
        '<label class="pmx-sw"><input type="checkbox" data-b="slider.dots"' + ((c.slider || {}).dots !== false ? ' checked' : '') + '>يظهر النقط</label></div></section>' +
      list('slides', 'سلايدات الواجهة', 'لحد 10 — اقفل أي سلايد من غير ما تمسحه، ورتّبهم بالأسهم', 10, function (x, i) {
        return '<label class="pmx-sw"><input type="checkbox" data-b="slides.' + i + '.on"' + (x.on !== false ? ' checked' : '') + '>' + (x.on !== false ? 'ظاهر' : 'مقفول') + '</label>' +
          '<div class="pmx-mini3"><label>العنوان' + inp('slides.' + i + '.title', x.title, 'خدمة طباعة', 60) + '</label><label>الكلمة الملوّنة (اختياري)' + inp('slides.' + i + '.hi', x.hi, 'أفلام الأشعة', 60) + '</label></div>' +
          '<label>الوصف<small style="font-weight:500;color:var(--text-muted,#64748b)"> — في التصميم 3 افصل النقط بـ · عشان تظهر ✓</small>' + inp('slides.' + i + '.sub', x.sub, 'جودة عالية ودقة تفاصيل', 160) + '</label>' +
          '<div class="pmx-mini3"><label>كلام الزرار (فاضي = من غير زرار)' + inp('slides.' + i + '.btn', x.btn, 'اطلب الخدمة', 30) + '</label><label>الزرار يودّي على' + sel('slides.' + i + '.act', x.act || 'order', { order: 'فورم طلب الخدمة', quote: 'طلب عرض سعر', wa: 'واتساب', call: 'اتصال', track: 'متابعة طلب', url: 'لينك خارجي', none: 'من غير زرار' }) + '</label></div>' +
          ((x.act === 'url') ? '<label>اللينك (يبدأ بـ https://)' + inp('slides.' + i + '.url', x.url, 'https://', 300, ' dir="ltr"') + '</label>' : '') +
          '<div class="pmx-mini3"><label>الصورة الافتراضية' + sel('slides.' + i + '.art', x.art, ARTN) + '</label><label>شكل الصورة' + sel('slides.' + i + '.fit', x.fit || 'cover', { cover: 'تملى مساحة الصورة', contain: 'تظهر كاملة' }) + '</label><label>وصف الصورة' + inp('slides.' + i + '.alt', x.alt, '', 120) + '</label><label class="pmx-sw"><input type="checkbox" data-b="slides.' + i + '.shade"' + (x.shade !== false ? ' checked' : '') + '>تغميق خفيف للصورة</label></div>' +
          '<div class="pmx-range"><label>موضع الصورة أفقيًا<input type="range" min="0" max="100" step="1" data-k="slides.' + i + '.posX" value="' + (x.posX == null ? 50 : x.posX) + '"></label><label>موضع الصورة رأسيًا<input type="range" min="0" max="100" step="1" data-k="slides.' + i + '.posY" value="' + (x.posY == null ? 50 : x.posY) + '"></label></div>' +
          imageEditor('slides.' + i + '.img', x.img, /^(studio|monitor)/.test(x.art || '') && (c.theme === '5' || c.theme === '6' || /^studio/.test(x.art || '')) ? '/promo-assets/studio-' + (x.art === 'studio-dark' || x.art !== 'studio-light' && c.theme === '6' ? 'dark' : 'light') + '.jpg' : '') +
          '<div><button type="button" class="btn btn-ghost btn-sm" data-dup="' + i + '">⧉ نسخة من السلايد ده</button></div>';
      }, { on: true, title: 'سلايد جديد', hi: '', sub: '', btn: 'اطلب الخدمة', act: 'order', url: '', art: 'studio', img: '', alt: '', posX: 50, posY: 50, shade: true, fit: 'cover' }) +
      list('chips', 'المميزات', 'لحد 4 (تحت السلايد أو «لماذا نحن»)', 4, function (x, i) { return '<div class="pmx-mini3"><label>الميزة' + inp('chips.' + i + '.t', x.t, 'جودة عالية', 30) + '</label><label>الأيقونة' + sel('chips.' + i + '.ic', x.ic, ICN) + '</label></div>'; }, { t: '', ic: 'star' }) +
      list('services', 'الخدمات', 'لحد 8 — الضغط على أي خدمة بيفتح فورم الطلب عليها', 8, function (x, i) { return '<div class="pmx-mini"><label>الخدمة' + inp('services.' + i + '.t', x.t, 'طباعة أفلام الأشعة', 40) + '</label><label>تفصيلة صغيرة' + inp('services.' + i + '.s', x.s, 'A3 - A4 - B4', 60) + '</label><label>الأيقونة' + sel('services.' + i + '.ic', x.ic, ICN) + '</label><label>وصف صورة الخدمة' + inp('services.' + i + '.alt', x.alt, '', 120) + '</label></div>' + imageEditor('services.' + i + '.img', x.img); }, { t: '', s: '', ic: 'printer', img: '', alt: '' }) +
      list('stats', 'الأرقام', 'لحد 3 — بتتعد لما تظهر', 3, function (x, i) { return '<div class="pmx-mini3"><label>الرقم' + inp('stats.' + i + '.n', x.n, '+150', 10) + '</label><label>معناه' + inp('stats.' + i + '.l', x.l, 'مركز أشعة تثق بنا', 30) + '</label></div>'; }, { n: '', l: '' }) +
      list('targets', 'بنخدم مين', 'لحد 3 (التصميم 4)', 3, function (x, i) { return '<div class="pmx-mini3"><label>الاسم' + inp('targets.' + i + '.t', x.t, 'مستشفيات', 30) + '</label><label>الأيقونة' + sel('targets.' + i + '.ic', x.ic, ICN) + '</label></div>'; }, { t: '', ic: 'hospital' }) +
      '<div class="pmx-save"><button class="btn btn-primary" id="pmxSave">💾 حفظ ونشر</button><button class="btn btn-ghost" id="pmxUndo">تراجع عن التعديلات</button><span id="pmxDirty" style="align-self:center;font-size:12.5px;color:#d97706">' + (S.dirty ? '● فيه تعديلات مش محفوظة' : '') + '</span></div>' +
       '</div><aside class="pmx-pv"><div class="pmx-preview-tools"><button type="button" class="btn btn-secondary btn-sm" data-pv="phone">📱 معاينة الموبايل</button><button type="button" class="btn btn-secondary btn-sm" data-pv="wide">🖥️ معاينة الكمبيوتر</button></div><div class="pmx-ph"><iframe id="pmxIf" src="about:blank" title="معاينة التعديلات" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div><p class="pmx-preview-status" id="pmxPreviewStatus">جاري تحديث المعاينة…</p></aside></div>' ;
    wire(el); fitPreview();
    if (S.pvObserver) S.pvObserver.disconnect();
    if (window.ResizeObserver) { S.pvObserver = new ResizeObserver(fitPreview); S.pvObserver.observe(g('pmxIf').parentNode); }
    preview();
  }
  function setK(path, v) { var p = path.split('.'), o = S.c; for (var i = 0; i < p.length - 1; i++) { if (o[p[i]] == null) o[p[i]] = {}; o = o[p[i]]; } o[p[p.length - 1]] = v; dirty(); }
  function dirty() { S.dirty = true; preview(); var d = g('pmxDirty'); if (d) d.textContent = '● فيه تعديلات مش محفوظة'; }
  function wire(el) {
    [].forEach.call(el.querySelectorAll('[data-k]'), function (x) { x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', function () { setK(x.dataset.k, x.value); }); });
    [].forEach.call(el.querySelectorAll('[data-b]'), function (x) { x.onchange = function () { setK(x.dataset.b, x.checked); if (/^slides\.\d+\.on$/.test(x.dataset.b)) design(); }; });
    [].forEach.call(el.querySelectorAll('[data-k$=".act"]'), function (x) { x.addEventListener('change', function () { design(); }); });
    [].forEach.call(el.querySelectorAll('[data-dup]'), function (b) { b.onclick = function () { if (S.c.slides.length >= 10) return T('أقصى حاجة 10 سلايدات', 'error'); var i = +b.dataset.dup; S.c.slides.splice(i + 1, 0, JSON.parse(JSON.stringify(S.c.slides[i]))); dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-th]'), function (b) { b.onclick = function () { S.c.theme = b.dataset.th; dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-add]'), function (b) { b.onclick = function () { getK(b.dataset.add).push(JSON.parse(b.dataset.blank)); dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-rm]'), function (b) { b.onclick = function () { var p = b.dataset.rm.split(':'); getK(p[0]).splice(+p[1], 1); dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-mv]'), function (b) { b.onclick = function () { var p = b.dataset.mv.split(':'), A = getK(p[0]), i = +p[1], j = i + (+p[2]); if (j < 0 || j >= A.length) return; var t = A[i]; A[i] = A[j]; A[j] = t; dirty(); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-noimg]'), function (b) { b.onclick = function () { setK(b.dataset.noimg, ''); design(); }; });
    [].forEach.call(el.querySelectorAll('[data-up]'), function (x) { x.onchange = function () {
      var f = x.files && x.files[0]; if (!f) return; var key = x.dataset.up, parts = key.split('.'), property = parts.pop(), target = getK(parts.join('.'));
      S.uploads++; if (g('pmxSave')) g('pmxSave').disabled = true; T('📷 جاري رفع الصورة…');
      shrink(f).then(function (data) { return api('POST', '/img', { data: data }); }).then(function (j) {
        /* Keep the image attached to its slide even if the slide moves during upload. */
        var attached = parts[0] === 'slides' || parts[0] === 'services' ? (S.c[parts[0]] || []).indexOf(target) >= 0 : S.c.modern === target;
        if (!attached) return;
        target[property] = j.id; dirty(); design(); T('📷 الصورة اترفعت — اضغط حفظ');
      }).catch(function (e) { T(e.message || 'مش قادر أرفع الصورة', 'error'); }).finally(function () { S.uploads--; if (g('pmxSave')) g('pmxSave').disabled = S.uploads > 0; });
    }; });
    [].forEach.call(el.querySelectorAll('[data-pv]'), function (b) { b.onclick = function () { S.pvMode = b.dataset.pv; design(); }; });
    g('pmxUndo').onclick = function () { S.c = JSON.parse(JSON.stringify(S.d.cfg)); S.dirty = false; design(); };
    g('pmxSave').disabled = S.uploads > 0;
    g('pmxSave').onclick = function () {
      if (S.uploads) return T('استنى رفع الصور يخلص الأول');
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
