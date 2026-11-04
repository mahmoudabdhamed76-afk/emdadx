/* 5.28 · a referring doctor's page /r/<slug>#<key>: his patients' results from this center.
   Each case key reaches this page wrapped by the doctor's own key, which lives only in the link's #hash. */
(function () {
  'use strict';
  var C = window.CD || {}, K = String(location.hash || '').slice(1), $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dmy(ts) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(ts || '')); return m ? (+m[3]) + '/' + (+m[2]) + '/' + m[1] : ''; }
  var logo = window.OZSkin ? OZSkin.logo('') : '';
  if (C.missing) { document.body.innerHTML = '<div class="w"><div class="ld" style="margin-top:30vh"><i>🔍</i><b>اللينك ده مش شغال</b><p>كلّم المركز يبعتلك لينك جديد.</p></div></div>'; return; }
  document.body.innerHTML = '<div class="w dr"><div class="top"><span class="tlg">' + logo + '</span><div class="tn"><b>' + esc(C.center) + '</b><small>بوابة الدكاترة</small></div></div>' +
    '<section class="dr-h"><small>أهلاً يا دكتور 👋</small><h1>د. ' + esc(C.doctor) + '</h1>' + (C.spec ? '<p>' + esc(C.spec) + '</p>' : '') + '<div class="dr-k" id="drK"></div></section>' +
    '<input class="fld dr-q" id="drQ" type="search" placeholder="دوّر باسم المريض أو نوع الفحص…">' +
    '<div id="drL"><div class="ld"><div class="spin"></div><b>بنجيب حالات مرضاك…</b></div></div><p class="foot">النتايج متشفّرة — بتتفتح بس من اللينك ده. · ' + esc(C.center) + '</p></div>';
  var L = [];
  function paint() {
    var q = $('drQ').value.trim(), rows = L.filter(function (x) { return !q || (x.patient + ' ' + x.exam).indexOf(q) > -1; });
    var by = {}; rows.forEach(function (x) { var m = String(x.at || '').slice(0, 7); (by[m] = by[m] || []).push(x); });
    $('drL').innerHTML = rows.length ? Object.keys(by).map(function (m) {
      var p = m.split('-'); return '<div class="dr-m"><b>' + ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][+p[1]] + ' ' + p[0] + '</b><small>' + by[m].length + ' حالة</small></div>' +
        by[m].map(function (x, i) { return '<button type="button" class="dr-c' + (x.key ? '' : ' off') + '" data-t="' + x.token + '" style="--i:' + i + '"><span class="dr-i">' + (x.kind === 'dicom' ? '🩻' : '📄') + '</span><div><b>' + esc(x.patient) + '</b><small>' + esc(x.exam || 'فحص') + ' · ' + dmy(x.at) + '</small></div><em>' + (x.key ? 'افتح ←' : 'مش متاحة') + '</em></button>'; }).join('');
    }).join('') : '<div class="ld"><i>🗂</i><b>' + (L.length ? 'مفيش نتيجة للبحث ده' : 'لسه مفيش حالات') + '</b><p>' + (L.length ? '' : 'أول ما المركز يرفع نتيجة لمريض حوّلته، هتلاقيها هنا.') + '</p></div>';
    [].forEach.call(document.querySelectorAll('.dr-c'), function (b) { b.onclick = function () {
      var x = L.filter(function (y) { return y.token === b.dataset.t; })[0]; if (!x || !x.key) return alert('النتيجة دي اتضافت لاسمك من جهاز تاني — اطلبها من المركز.');
      try { sessionStorage.setItem('ozx_drv', x.token); sessionStorage.setItem('ozx_back', ''); } catch (e) {} location.href = '/v/' + x.token + '#' + x.key;
    }; });
  }
  fetch('/r/' + C.slug + '/list', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
    var list = j.list || [];
    return Promise.all(list.map(function (x) { return x.w && K ? OZK.unwrapRaw(x.w, K).then(function (k) { x.key = k; return x; }) : Promise.resolve(x); }));
  }).then(function (list) {
    L = list; var opened = L.filter(function (x) { return x.opened; }).length, mo = new Date().toISOString().slice(0, 7);
    $('drK').innerHTML = '<span><b>' + L.length + '</b>حالة</span><span><b>' + L.filter(function (x) { return String(x.at).slice(0, 7) === mo; }).length + '</b>الشهر ده</span><span><b>' + opened + '</b>المريض فتحها</span>';
    $('drQ').oninput = paint; paint();
  }).catch(function () { $('drL').innerHTML = '<div class="ld"><i>⚠️</i><b>النت فصل</b><p>جرّب تاني.</p></div>'; });
})();
