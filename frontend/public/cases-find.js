/* ════════════════════════════════════════════════════════════════════
   4.91 · «دوّر على نتيجتك» — الباركود الثابت المطبوع على كل تقارير المركز /h/<pub>
   المريض يكتب موبايله وأول اسمه ← السيرفر بيرجّع الحالات المتسجّلة على الرقم ده
   (من غير مفاتيحها) ← المفتاح بيتفك هنا بس لو الاسم صح ← يفتح الحالة.
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var C = window.CD || {}, K = window.OZK, $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dmy(ts) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(ts || '')); return m ? (+m[3]) + '/' + (+m[2]) + '/' + m[1] : ''; }
  document.body.className = 'v f';
  /* 5.14 · hero slider — drawn radiology scenes (CT, reading room, chest X-ray, result on the phone), auto-plays + swipe */
  function PVS_HTML() {
    var A = '#7DE3F4', ribs = '', i;
    for (i = 0; i < 6; i++) { var y = 46 + i * 13; ribs += '<path d="M108 ' + y + 'q-26 -4 -40 ' + (12 + i) + '"/><path d="M112 ' + y + 'q26 -4 40 ' + (12 + i) + '"/>'; }
    var ART = [
      /* CT scanner with a patient sliding in */
      '<svg viewBox="0 0 220 170" aria-hidden="true"><defs><radialGradient id="pg1" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="' + A + '" stop-opacity=".45"/><stop offset="1" stop-color="' + A + '" stop-opacity="0"/></radialGradient><linearGradient id="pg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6FAFC"/><stop offset="1" stop-color="#BFD0DB"/></linearGradient></defs>' +
        '<circle cx="118" cy="78" r="86" fill="url(#pg1)"/><path d="M0 146h220" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>' +
        '<rect x="30" y="92" width="34" height="52" rx="6" fill="#9FB3C1"/><rect x="4" y="84" width="140" height="9" rx="4.5" fill="#E9F0F5"/>' +
        '<g class="pvs-slide-in"><rect x="26" y="70" width="88" height="15" rx="7.5" fill="#4F9DCB"/><circle cx="18" cy="76" r="9" fill="#F0C6A2"/><path d="M10 72q8-9 17-2" fill="none" stroke="#3B2A22" stroke-width="4" stroke-linecap="round"/></g>' +
        '<path fill="url(#pg2)" fill-rule="evenodd" d="M114 22h8a44 44 0 0 1 44 44v24a44 44 0 0 1-44 44h-8a44 44 0 0 1-44-44V66a44 44 0 0 1 44-44zM118 46a28 28 0 1 0 0 56a28 28 0 1 0 0-56z"/>' +
        '<circle class="pvs-spin" cx="118" cy="74" r="32" fill="none" stroke="' + A + '" stroke-width="3" stroke-dasharray="22 12" stroke-linecap="round"/>' +
        '<rect x="80" y="130" width="76" height="16" rx="6" fill="#A9BDCA"/><rect x="132" y="30" width="22" height="8" rx="4" fill="#0B2530" opacity=".85"/><circle class="pvs-blink" cx="137" cy="34" r="2" fill="#4ADE80"/><circle cx="144" cy="34" r="2" fill="' + A + '"/></svg>',
      /* reading room: doctor reviewing two CT slices */
      '<svg viewBox="0 0 220 170" aria-hidden="true"><g transform="translate(220 0) scale(-1 1)"><defs><radialGradient id="pg3" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#E6EEF3"/><stop offset=".7" stop-color="#7F95A3"/><stop offset="1" stop-color="#2B3B45"/></radialGradient></defs>' +
        '<rect x="6" y="20" width="128" height="86" rx="9" fill="#0A1B24" stroke="#36586A" stroke-width="2"/><rect x="13" y="27" width="114" height="72" rx="4" fill="#040D13"/>' +
        '<g><ellipse cx="42" cy="63" rx="21" ry="27" fill="url(#pg3)"/><path d="M36 54q6-6 12 0q-2 10-6 14q-4-4-6-14z" fill="#0A1B24"/><ellipse cx="98" cy="63" rx="21" ry="27" fill="url(#pg3)"/><path d="M92 56q6-5 12 0q-1 8-6 12q-5-4-6-12z" fill="#0A1B24"/></g>' +
        '<rect class="pvs-scan" x="13" y="27" width="114" height="3" fill="' + A + '" opacity=".75"/>' +
        '<rect x="62" y="106" width="16" height="22" fill="#28424F"/><rect x="40" y="128" width="60" height="6" rx="3" fill="#36586A"/><path d="M0 140h220" stroke="#fff" stroke-opacity=".14" stroke-width="2"/>' +
        '<path d="M150 170v-62q0-26 30-26h4q30 0 30 26v62z" fill="#F3F7FA"/><path d="M170 84l14 22 14-22z" fill="#5AA9D6"/><path d="M182 106v40M162 104q-6 26 8 36" fill="none" stroke="#9FB3C1" stroke-width="2.5"/><circle cx="170" cy="142" r="4" fill="#9FB3C1"/>' +
        '<rect x="176" y="68" width="16" height="16" rx="5" fill="#E3AE88"/><circle cx="184" cy="54" r="17" fill="#EDBB95"/><path d="M167 52q0-20 19-19q16 1 15 17q-8-8-20-6q-8 1-14 8z" fill="#2E211B"/><circle cx="170" cy="56" r="2" fill="#2E211B"/></g></svg>',
      /* chest X-ray on a lightbox */
      '<svg viewBox="0 0 220 170" aria-hidden="true"><rect x="36" y="10" width="148" height="150" rx="12" fill="#0A141B" stroke="#33505F" stroke-width="2"/>' +
        '<path d="M60 150q0-70 18-96q14-16 32-16t32 16q18 26 18 96z" fill="#9FB3C1" opacity=".28"/>' +
        '<path d="M104 50q-30 2-36 40q-4 34 8 52q16 4 28-6z" fill="#06101A"/><path d="M116 50q30 2 36 40q4 34-8 52q-16 4-28-6z" fill="#06101A"/>' +
        '<g fill="none" stroke="#DDE8EF" stroke-opacity=".75" stroke-width="3" stroke-linecap="round">' + ribs + '<path d="M80 42q20-8 28 2M140 42q-20-8-28 2"/></g>' +
        '<path d="M110 36v116" stroke="#E7EFF4" stroke-width="7" stroke-dasharray="6 3" opacity=".8"/>' +
        '<circle class="pvs-ring" cx="134" cy="96" r="14" fill="none" stroke="' + A + '" stroke-width="2.5"/></svg>',
      /* the result on the patient's phone */
      '<svg viewBox="0 0 220 170" aria-hidden="true"><defs><radialGradient id="pg4" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + A + '" stop-opacity=".4"/><stop offset="1" stop-color="' + A + '" stop-opacity="0"/></radialGradient></defs><circle cx="110" cy="86" r="80" fill="url(#pg4)"/>' +
        '<rect x="70" y="8" width="80" height="154" rx="16" fill="#0B1A22" stroke="#E3ECF2" stroke-width="3"/><rect x="77" y="18" width="66" height="134" rx="9" fill="#F4F8FB"/>' +
        '<rect x="82" y="24" width="56" height="58" rx="6" fill="#0A141B"/><path d="M108 32q-16 2-19 22q-2 16 4 24h14zM112 32q16 2 19 22q2 16-4 24h-14z" fill="#33505F"/><path d="M110 30v50" stroke="#DDE8EF" stroke-width="3"/>' +
        '<rect x="84" y="90" width="42" height="5" rx="2.5" fill="#B8C7D1"/><rect x="84" y="100" width="30" height="5" rx="2.5" fill="#D3DEE5"/><rect x="84" y="118" width="52" height="16" rx="8" fill="#0E7C86"/>' +
        '<g class="pvs-pop"><circle cx="150" cy="40" r="15" fill="#22C55E"/><path d="M143 40l5 5 9-10" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>' +
        '<g class="pvs-pop2"><rect x="28" y="92" width="44" height="30" rx="8" fill="#fff"/><text x="50" y="112" text-anchor="middle" font-size="12" font-weight="800" fill="#E11D48" font-family="sans-serif">PDF</text></g></svg>'
    ];
    var TX = [
      ['QR Patient', '<h1 id="patient-title">ألف سلامة عليك 🤍</h1>', 'إزاي نقدر نساعدك النهارده؟'],
      ['تقارير الأشعة', '<b>تقارير دقيقة.. وسرعة في الخدمة</b>', 'فريق متخصص وأحدث أجهزة التصوير'],
      ['كل الفحوصات', '<b>مقطعية، رنين، سونار وعادية</b>', 'احجز فحصك من موبايلك في دقيقة'],
      ['نتيجتك معاك', '<b>نتيجتك على موبايلك</b>', 'التقرير وصور الأشعة معاك في أي وقت']
    ];
    var h = '<div class="pvs" id="pvs" role="region" aria-roledescription="carousel" aria-label="عن المركز"><div class="pvs-tr" id="pvsTr">';
    for (i = 0; i < ART.length; i++) h += '<div class="pvs-s' + (i ? '' : ' on') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' من ' + ART.length + '"' + (i ? ' aria-hidden="true"' : '') + '><div class="pvs-art">' + ART[i] + '</div><div class="pvs-tx"><span class="pvs-k">' + TX[i][0] + '</span>' + TX[i][1] + '<small>' + TX[i][2] + '</small></div></div>';
    h += '</div><div class="pvs-dots" role="tablist">';
    for (i = 0; i < ART.length; i++) h += '<button type="button" role="tab" aria-label="شريحة ' + (i + 1) + '"' + (i ? '' : ' class="on" aria-selected="true"') + '><i></i></button>';
    return h + '</div></div>';
  }
  function pvsWire() {
    var box = $('pvs'), tr = $('pvsTr'); if (!box || !tr) return;
    var S = [].slice.call(tr.children), D = [].slice.call(box.querySelectorAll('.pvs-dots button')), n = S.length, cur = 0, timer = 0,
      still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, WAIT = 5200;
    function go(i) {
      cur = (i + n) % n; tr.style.transition = ''; tr.style.transform = 'translateX(' + (cur * 100) + '%)';
      S.forEach(function (s, k) { s.classList.toggle('on', k === cur); if (k === cur) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true'); });
      D.forEach(function (d, k) { d.classList.toggle('on', k === cur); d.setAttribute('aria-selected', String(k === cur)); });
      plan();
    }
    function plan() { clearTimeout(timer); if (!still && !document.hidden) timer = setTimeout(function () { go(cur + 1); }, WAIT); }
    D.forEach(function (d, k) { d.onclick = function () { go(k); }; });
    var x0 = null, y0 = 0, dx = 0, w = 1, lock = 0;
    tr.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; dx = 0; lock = 0; w = box.offsetWidth || 1; clearTimeout(timer); }, { passive: true });
    tr.addEventListener('touchmove', function (e) { if (x0 == null) return; var t = e.touches[0], ddx = t.clientX - x0, ddy = t.clientY - y0;
      if (!lock) lock = Math.abs(ddx) > Math.abs(ddy) + 4 ? 1 : (Math.abs(ddy) > 8 ? 2 : 0);
      if (lock !== 1) return; dx = ddx; tr.style.transition = 'none'; tr.style.transform = 'translateX(calc(' + (cur * 100) + '% + ' + dx + 'px))'; }, { passive: true });
    tr.addEventListener('touchend', function () { if (x0 == null) return; x0 = null; if (lock === 1 && Math.abs(dx) > w * 0.18) go(cur + (dx > 0 ? 1 : -1)); else go(cur); });
    document.addEventListener('visibilitychange', plan);
    plan();
  }
  if (C.missing) { document.body.innerHTML = '<div class="w"><div class="ld" style="margin-top:30vh"><i>🔍</i><b>الباركود ده مش شغال</b><p>كلّم المركز.</p></div></div>'; return; }
  /* V2: One clear home, two equal service cards; expanding either opens its own matching card. */
  document.body.innerHTML = '<div class="w pv2-page pvd">' +
    /* 5.03 · design D «تطبيق»: gradient header + floating mobile search + coloured service tiles + bottom tab bar */
    '<header class="pvd-hd"><div class="pvd-r1"><span class="tlg">' + (window.OZSkin ? OZSkin.logo('') : '') + '</span>' +
      '<div class="tn"><b>' + esc(C.center) + '</b><small>معاكم 24 ساعة · بوابة المرضى</small></div>' +
      '<button type="button" class="pvd-bell" id="pvdBell" aria-label="الإشعارات"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 16V11a6 6 0 1 1 12 0v5l2 2H4z\"/><path d=\"M10 20a2 2 0 0 0 4 0\"/></svg></button></div>' +
      PVS_HTML() + '</header>' +
    '<div class="pvd-pop" id="pvdPop" hidden><div id="caseNotify"><b>🔔 إشعارات طلبك</b><small>هيوصلك تنبيه على موبايلك أول ما المركز يرد على طلبك أو نتيجتك تجهز.</small>' +
      '<button class="pvd-pop-btn" id="patientPushToggle" type="button">فعّل الإشعارات</button></div></div>' +
    (C.on ? '<form class="pvd-sr" id="pvdSearch" novalidate><label class="pvd-in" for="pvdPh"><span class="pvd-ic"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"3\"/><path d=\"M11 18h2\"/></svg></span><input id="pvdPh" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" dir="ltr" placeholder="اكتب رقم موبايلك لنتيجتك"></label><button class="pvd-go" type="submit" aria-label="اعرض نتيجتي"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 6l-6 6 6 6\"/></svg></button></form>' : '') +
    '<div class="pv2-section-title pvd-sec"><div><h2>الخدمات</h2></div><small>كلها من موبايلك</small></div>' +
    '<div class="patient-chooser" role="tablist" aria-label="خدمات المركز">' +
      '<button type="button" id="tab-booking" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-book">' +
        '<span class="pv2-service-icon pvd-c1"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"3\"/><path d=\"M3 10h18M8 3v4M16 3v4\"/><path d=\"M8 14h3v3H8z\"/></svg></span><b>حجز أشعة</b><small>اختار الفحص واليوم المناسب</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-results" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-results">' +
        '<span class="pv2-service-icon pvd-c2"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4v8M12 12c-2 0-3 1-3 3v3c0 1.7-1.3 3-3 3s-3-1.3-3-3v-4c0-4 3-8 6-8M12 12c2 0 3 1 3 3v3c0 1.7 1.3 3 3 3s3-1.3 3-3v-4c0-4-3-8-6-8\"/></svg></span><b>نتيجة الأشعة</b><small>استعلم عن نتيجتك بسهولة</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-complaint" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-complaint">' +
        '<span class="pv2-service-icon pvd-c3"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z\"/><path d=\"M8.5 12h.01M12 12h.01M15.5 12h.01\"/></svg></span><b>تقديم شكوى</b><small>قولنا إيه اللي ضايقك وهنساعدك</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-report" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-report">' +
        '<span class="pv2-service-icon pvd-c4"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h4\"/></svg></span><b>طلب تقرير أشعة</b><small>ارفع صورة واطلب تقريرك</small><span class="pv2-service-go" aria-hidden="true">←</span></button></div>' +
    '<p class="pv2-action-hint" id="patient-hint" aria-live="polite">اختار أي خدمة من الأربع خدمات للمتابعة</p>' +
    '<section id="patient-results" class="patient-panel" role="tabpanel" aria-labelledby="tab-results" hidden>' +
      '<div class="srch results-card" id="sr"><div class="booking-heading"><span>🩻</span><div><b>استعلام نتيجة الأشعة</b><small>نتيجتك في مكان واحد، بمجرد إدخال رقم الموبايل</small></div></div>' + (C.on ?
        '<label class="l" for="ph">رقم الموبايل المسجل في المركز</label><input class="fld n" id="ph" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="01xxxxxxxxx" style="text-align:right" dir="ltr">' +
        '<p class="hint">اكتب نفس رقم الموبايل اللي سجلته يوم الفحص.</p>' +
        '<button class="btn w" id="go">🩻 اعرض نتيجتي ←</button><div class="err" id="er" role="status" aria-live="polite" style="color:var(--pacc);font-weight:700;text-align:center;margin-top:8px;min-height:20px"></div>'
        : '<div class="ld" style="box-shadow:none;padding:6px"><i>⏸</i><b>البحث غير متاح حاليًا</b><p>تواصل مع المركز لمساعدة إضافية.</p></div>') + '</div>' +
      '<div class="res" id="res"></div>' +
      (C.on ? '<div class="miss" id="miss"><b>محتاج مساعدة في النتيجة؟</b><p>لو نتيجتك لسه مش موجودة، اطلبها من المركز وهيتابع معاك.</p>' +
        '<div class="af"><label class="l">اسمك زي ما اتسجّل في المركز *</label><input class="fld" id="an0" maxlength="60" autocomplete="name" placeholder="الاسم بالكامل">' +
        '<label class="l">تاريخ عمل الأشعة *</label><input class="fld" id="ad0" type="date"><label class="l">نوع الفحص (اختياري)</label>' +
        '<input class="fld" id="nt0" maxlength="60" placeholder="مثلاً: مقطعية على الصدر"><div class="aer" id="ae0"></div></div>' +
        '<button class="btn ask2 w" id="wa0">📨 اطلب نتيجتك من المركز</button></div>' : '') +
      '<p class="foot">🔒 ملفات الأشعة مشفّرة، ولازم تستخدم رقم الموبايل المسجّل للفحص.</p>' +
    '</section>' +
    '<section id="patient-book" class="patient-panel" role="tabpanel" aria-labelledby="tab-booking" hidden>' +
      '<div class="booking-card"><div class="booking-heading"><span>📅</span><div><b>اطلب حجز أشعة</b><small>حدد الفحص والوقت المناسب، والمركز هيتواصل معاك للتأكيد</small></div></div>' +
      '<form id="booking-form" novalidate><label class="l" for="bn">الاسم بالكامل *</label><input id="bn" class="fld" type="text" autocomplete="name" maxlength="60" placeholder="اسم المريض">' +
      '<label class="l" for="bp">رقم الموبايل *</label><input id="bp" class="fld n" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="01xxxxxxxxx" dir="ltr">' +
      '<label class="l" for="be">نوع الأشعة *</label><select class="fld" id="be"><option value="">اختار نوع الفحص</option><option>أشعة عادية</option><option>سونار</option><option>أشعة مقطعية</option><option>رنين مغناطيسي</option><option>دوبلر</option><option>ماموجرام</option><option>فحص آخر</option></select>' +
      '<div class="booking-grid"><div><label class="l" for="bd">اليوم المناسب *</label><input id="bd" class="fld" type="date"></div><div><label class="l" for="bs">الوقت المفضل *</label><select class="fld" id="bs"><option>أي وقت</option><option>صباحًا</option><option>ظهرًا</option><option>مساءً</option></select></div></div>' +
      '<label class="l" for="bnote">ملاحظات للحجز (اختياري)</label><textarea id="bnote" class="fld" rows="2" maxlength="180" placeholder="مثلاً: محتاج أعرف تعليمات التحضير"></textarea>' +
      '<p class="booking-note">🔒 بيانات التواصل لتأكيد طلب الحجز فقط. الموعد مش مؤكد غير لما موظف المركز يتواصل معاك.</p><div id="bmsg" class="booking-msg" role="status" aria-live="polite"></div>' +
      '<button class="btn w" type="submit" id="bgo">إرسال طلب الحجز ←</button></form></div>' +
    '</section>' +
    '<section id="patient-complaint" class="patient-panel pv2-extra-panel" role="tabpanel" aria-labelledby="tab-complaint" hidden>' +
      '<div class="booking-card pv2-request-card"><div class="booking-heading"><span>📝</span><div><b>تقديم شكوى للمركز</b><small>احكي لنا اللي حصل وهنراجع طلبك</small></div></div>' +
      '<div class="pv2-complaint-intro" role="status"><span>💬</span><p>اكتب شكوى حضرتك وهنحلها في أقرب وقت وهنتواصل معاك</p></div>' +
      '<form id="complaint-form" novalidate>' +
        '<label class="l" for="cn">الاسم بالكامل *</label><input class="fld" id="cn" type="text" maxlength="60" autocomplete="name" placeholder="اسم حضرتك">' +
        '<label class="l" for="cp">رقم الموبايل *</label><input class="fld n" id="cp" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" dir="ltr" placeholder="01xxxxxxxxx">' +
        '<label class="l" for="cs">عنوان الشكوى *</label><input class="fld" id="cs" type="text" maxlength="100" placeholder="مثلاً: تأخير في استلام النتيجة">' +
        '<label class="l" for="cm">اكتب تفاصيل الشكوى *</label><textarea class="fld" id="cm" maxlength="1200" rows="5" placeholder="احكي لنا تفاصيل المشكلة علشان نقدر نساعدك"></textarea>' +
        '<p class="booking-note">🔒 الشكوى وبيانات التواصل بتوصل لإدارة المركز فقط للمتابعة.</p>' +
        '<div class="booking-msg" id="cmsg" role="status" aria-live="polite"></div>' +
        '<button class="btn w" id="cgo" type="submit">إرسال الشكوى ←</button>' +
      '</form></div></section>' +
    '<section id="patient-report" class="patient-panel pv2-extra-panel" role="tabpanel" aria-labelledby="tab-report" hidden>' +
      '<div class="booking-card pv2-request-card"><div class="booking-heading"><span>📤</span><div><b>طلب تقرير أشعة</b><small>ارفع صورة طلب الفحص أو الأشعة، والمركز هيتواصل معاك</small></div></div>' +
      '<form id="report-form" novalidate>' +
        '<label class="l" for="rn">الاسم بالكامل *</label><input class="fld" id="rn" type="text" maxlength="60" autocomplete="name" placeholder="اسم المريض">' +
        '<label class="l" for="rp">رقم الموبايل *</label><input class="fld n" id="rp" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" dir="ltr" placeholder="01xxxxxxxxx">' +
        '<label class="l" for="rm">نوع التقرير أو تفاصيل طلبك *</label><textarea class="fld" id="rm" maxlength="1200" rows="3" placeholder="عايز تقرير لإيه؟ اكتب تفاصيل الفحص المطلوب"></textarea>' +
        '<label class="l" for="rfiles">صور الطلب أو الأشعة * (من 1 إلى 3 صور)</label>' +
        '<div class="pv2-upload-images"><input id="rfiles" class="fld" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple>' +
          '<p>صور JPG أو PNG أو WebP أو صور الآيفون · هنجهز الصور الكبيرة تلقائيًا</p><div id="rpreview" class="pv2-image-preview"></div></div>' +
        '<p class="booking-note">🔒 الصور محفوظة بشكل مشفر، وبتتمسح من النظام بعد 30 يوم. المركز هيشوف طلبك ويتواصل معاك.</p>' +
        '<div class="booking-msg" id="rmsg" role="status" aria-live="polite"></div>' +
        '<button class="btn w" id="rgo" type="submit">إرسال طلب التقرير والصور ←</button>' +
      '</form></div></section>' +
    '<div class="pv2-trust"><div><i>🔒</i><span>خصوصية بياناتك</span></div><div><i>⚡</i><span>خطوات سريعة</span></div><div><i>📱</i><span>كل حاجة من موبايلك</span></div></div>' +
    '<nav class="pvd-tab" aria-label="التنقل"><button type="button" data-pvd="home" class="on"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/></svg><span>الرئيسية</span></button>' +
      '<button type="button" data-pvd="results"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4v8M12 12c-2 0-3 1-3 3v3c0 1.7-1.3 3-3 3s-3-1.3-3-3v-4c0-4 3-8 6-8M12 12c2 0 3 1 3 3v3c0 1.7 1.3 3 3 3s3-1.3 3-3v-4c0-4-3-8-6-8\"/></svg><span>نتيجتي</span></button><button type="button" data-pvd="booking"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"3\"/><path d=\"M3 10h18M8 3v4M16 3v4\"/><path d=\"M8 14h3v3H8z\"/></svg><span>احجز</span></button>' +
      '<button type="button" data-pvd="report"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h4\"/></svg><span>تقرير</span></button><button type="button" data-pvd="complaint"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z\"/><path d=\"M8.5 12h.01M12 12h.01M15.5 12h.01\"/></svg><span>شكوى</span></button></nav>' +
    '<p class="pv2-footer">نتمنالك دوام الصحة والعافية ♥</p><p class="pv2-analytics-note">يتم احتساب مرات فتح رابط الباركود فقط، بدون تحديد موقع المريض أو تسجيل مكانه.</p>' +
  '</div>';
  /* Gentle, low-cost hero copy carousel; no resizing or transform on service icons. */
  (function heroCarousel() {
    var title=$('patient-title'),sub=document.querySelector('.pv3-radiology-copy>p');
    var dots=[].slice.call(document.querySelectorAll('.pv3-hero-dots i'));
    if(!title||!sub||!dots.length)return;
    var slides=[
      ['تقارير دقيقة.. <span>وسرعة في الخدمة</span>','فريق متخصص وأحدث أجهزة التصوير'],
      ['رعايتك تبدأ <span>من أول زيارة</span>','احجز أشعتك واختار اليوم المناسب بسهولة'],
      ['نتيجتك أقرب <span>وأسرع ليك</span>','تابع نتيجة الأشعة من أي مكان بأمان']
    ];
    var index=0;
    if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    setInterval(function(){
      if(document.visibilityState==='hidden')return;
      index=(index+1)%slides.length;
      title.classList.remove('pv3-slide-in');sub.classList.remove('pv3-slide-in');
      title.innerHTML=slides[index][0];sub.textContent=slides[index][1];
      void title.offsetWidth;title.classList.add('pv3-slide-in');sub.classList.add('pv3-slide-in');
      dots.forEach(function(d,i){d.classList.toggle('on',i===index);});
    },7000);
  })();
  function chooseJourney(which) {
    var modes = {
      booking: ['patient-book','tab-booking','📅 اختار اليوم والفحص، وهنبعت طلبك للمركز','#book'],
      results: ['patient-results','tab-results','🩻 اكتب رقم موبايلك علشان توصل لنتيجتك','#results'],
      complaint: ['patient-complaint','tab-complaint','📝 اكتب شكواك والمركز هيتابع معاك','#complaint'],
      report: ['patient-report','tab-report','📤 ارفع صور طلب التقرير وابعت بياناتك للمركز','#report']
    };
    var current = modes[which] || modes.results;
    Object.keys(modes).forEach(function (name) {
      var item=modes[name], active = name === which, panel=$(item[0]), btn=$(item[1]);
      if (panel) {
        panel.hidden = !active;
        panel.setAttribute('aria-hidden',String(!active));
        /* Keep the chosen panel visible even if Mobile Safari delays a hidden reflow. */
        panel.style.display = active ? 'block' : 'none';
        if (active) { panel.style.visibility = 'visible'; panel.style.opacity = '1'; }
      }
      if (btn) { btn.classList.toggle('on',active); btn.setAttribute('aria-selected',String(active)); }
    });
    $('patient-hint').textContent=current[2];
    try { history.replaceState(null,'',location.pathname+current[3]); }catch(e){}
    var panel=$(current[0]);
    if (panel && panel.scrollIntoView) setTimeout(function () {
      /* No transform animation while revealing a mobile panel: avoids white screens in Safari. */
      if (window.innerWidth && window.innerWidth <= 760) {
        panel.style.animation='none';panel.style.transform='none';panel.style.opacity='1';
      }
      panel.scrollIntoView({behavior:window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
    },90);
    if (which==='complaint') {
      var intro=document.querySelector('.pv2-complaint-intro');
      if (intro) { intro.classList.remove('pv2-play'); void intro.offsetWidth; intro.classList.add('pv2-play'); }
    }
  }
  [['booking','tab-booking'],['results','tab-results'],['complaint','tab-complaint'],['report','tab-report']].forEach(function (x) {
    $(x[1]).onclick=function () { chooseJourney(x[0]); };
  });
  /* 5.03 · design D wiring: floating search, bell, bottom tab bar */
  (function pvdWire() {
    var tabs = [].slice.call(document.querySelectorAll('.pvd-tab [data-pvd]'));
    function mark(w) { tabs.forEach(function (b) { b.classList.toggle('on', b.dataset.pvd === w); }); }
    tabs.forEach(function (b) { b.onclick = function () {
      var w = b.dataset.pvd; mark(w);
      if (w === 'home') { ['patient-results','patient-book','patient-complaint','patient-report'].forEach(function (id) { var p = $(id); if (p) { p.hidden = true; p.style.display = 'none'; } });
        [].forEach.call(document.querySelectorAll('.pv2-service'), function (x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
        try { history.replaceState(null, '', location.pathname); } catch (e) {} window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      chooseJourney(w);
    }; });
    [['tab-booking','booking'],['tab-results','results'],['tab-complaint','complaint'],['tab-report','report']].forEach(function (x) { var b = $(x[0]); if (b) b.addEventListener('click', function () { mark(x[1]); }); });
    var f = $('pvdSearch');
    if (f) f.onsubmit = function (e) { e.preventDefault(); var v = $('pvdPh').value.trim(); if (!K.last10(v)) { $('pvdPh').focus(); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); return; }
      mark('results'); chooseJourney('results'); var ph = $('ph'); if (ph) { ph.value = v; var g = $('go'); if (g) setTimeout(function () { g.click(); }, 120); } };
    /* 5.14 · the bell opens a small popover with the notifications switch (no instructions bar on the page) */
    var bell = $('pvdBell'), pop = $('pvdPop');
    if (bell && pop) {
      bell.setAttribute('aria-haspopup', 'true'); bell.setAttribute('aria-expanded', 'false');
      var shut = function () { pop.hidden = true; bell.setAttribute('aria-expanded', 'false'); };
      bell.onclick = function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; bell.setAttribute('aria-expanded', String(!pop.hidden)); };
      pop.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', shut); document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    }
    pvsWire();
  })();
  var initial={ '#book':'booking','#results':'results','#complaint':'complaint','#report':'report' }[location.hash];
  if (initial) chooseJourney(initial);
  function pushDeviceToken() {
    try { return localStorage.getItem('qrd-push-device:' + C.pub) || ''; } catch(e) { return ''; }
  }
  (function setupBooking() {
    var input = $('bd'), d = new Date(), loc = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    input.min = loc.toISOString().slice(0, 10); loc.setUTCDate(loc.getUTCDate() + 90); input.max = loc.toISOString().slice(0, 10);
    $('booking-form').onsubmit = function (e) {
      e.preventDefault();
      var name = $('bn').value.trim(), phone = K.digits($('bp').value), exam = $('be').value, day = input.value,
        slot = $('bs').value, note = $('bnote').value.trim(), msg = $('bmsg'), btn = $('bgo');
      if (phone.length === 12 && phone.slice(0, 2) === '20') phone = phone.slice(2);
      if (phone.length === 10 && phone.charAt(0) === '1') phone = '0' + phone;
      if (name.length < 3 || !/^01[0125]\d{8}$/.test(phone) || !exam || !day || !slot) {
        msg.textContent = 'كمّل الاسم ورقم موبايل مصري صحيح ونوع الأشعة واليوم المناسب.'; msg.className = 'booking-msg err'; return;
      }
      if (day < input.min || day > input.max) {
        msg.textContent = 'اختار يوم من النهارده ولحد 90 يوم قدام.'; msg.className = 'booking-msg err'; return;
      }
      btn.disabled = true; btn.textContent = 'بنبعت طلبك…'; msg.textContent = ''; msg.className = 'booking-msg';
      fetch(location.pathname.replace(/\/$/, '') + '/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone, exam: exam, day: day, slot: slot, note: note, notifyDevice: pushDeviceToken() })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw Error(j.message || 'محصلش — جرّب تاني'); return j; }); })
        .then(function (j) {
          $('booking-form').innerHTML = '<div class="booking-success" role="status"><span>✅</span><h2>طلب حجزك وصل للمركز</h2><p>رقم الطلب #' + esc(j.id) + '</p><p>المركز هيتواصل معاك على الموبايل علشان يأكد اليوم والوقت. <b>ده طلب حجز، مش موعد مؤكد لسه.</b></p><button type="button" class="btn g w" id="book-again">طلب حجز جديد</button></div>';
          $('book-again').onclick = function () { location.reload(); };
        }).catch(function (err) { msg.textContent = err.message; msg.className = 'booking-msg err'; btn.disabled = false; btn.textContent = 'إرسال طلب الحجز ←'; });
    };
  })();

  function requestPhone(input) {
    var digits=K.digits(input||'');
    if (digits.length===12 && digits.slice(0,2)==='20') digits=digits.slice(2);
    if (digits.length===10 && digits.charAt(0)==='1') digits='0'+digits;
    return /^01[0125]\d{8}$/.test(digits)?digits:'';
  }
  function requestJson(url,body) {
    body.notifyDevice = pushDeviceToken();
    return fetch(location.pathname.replace(/\/$/,'')+'/'+url,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
    }).then(function (response) {
      return response.json().catch(function(){return {};}).then(function (j) {
        if (!response.ok) throw Error(j.message||'حصلت مشكلة؛ جرّب تاني');
        return j;
      });
    });
  }
  function requestSuccess(form,id,title,message) {
    form.innerHTML='<div class="booking-success" role="status"><span>✅</span><h2>'+title+'</h2>'+
      '<p>رقم الطلب #'+esc(id)+'</p><p>'+message+'</p>'+
      '<button type="button" class="btn g w" id="new-request">رجوع للخدمات</button></div>';
    $('new-request').onclick=function(){ location.href=location.pathname; };
  }
  (function setupComplaint() {
    var form=$('complaint-form');
    form.onsubmit=function (e) {
      e.preventDefault();
      var name=$('cn').value.trim(),phone=requestPhone($('cp').value),subject=$('cs').value.trim(),
        message=$('cm').value.trim(), msg=$('cmsg'),btn=$('cgo');
      if(name.length<3||!phone||subject.length<3||message.length<8) {
        msg.textContent='اكتب الاسم ورقم موبايل صحيح وعنوان الشكوى والتفاصيل (8 حروف على الأقل).';
        msg.className='booking-msg err';return;
      }
      btn.disabled=true;btn.textContent='بنبعت الشكوى…';msg.textContent='';msg.className='booking-msg';
      requestJson('complaint',{name:name,phone:phone,subject:subject,message:message})
        .then(function(j){requestSuccess(form,j.id,'وصلتنا شكواك','هنراجع الشكوى ونتواصل معاك على رقم الموبايل المسجل.');})
        .catch(function(err){msg.textContent=err.message;msg.className='booking-msg err';btn.disabled=false;btn.textContent='إرسال الشكوى ←';});
    };
  })();
  (function setupReportRequest() {
    var input=$('rfiles'),preview=$('rpreview'),form=$('report-form'),urls=[];
    function clearUrls(){urls.forEach(function(u){try{URL.revokeObjectURL(u);}catch(e){}});urls=[];}
    input.onchange=function () {
      clearUrls();preview.innerHTML='';
      var files=Array.prototype.slice.call(input.files||[]);
      if(!files.length)return;
      if(files.length>3) { $('rmsg').textContent='اختار 3 صور بالكتير';$('rmsg').className='booking-msg err';return; }
      files.forEach(function(file){
        if(['image/jpeg','image/png','image/webp','image/heic','image/heif'].indexOf(file.type)<0||file.size>24*1048576){
          $('rmsg').textContent='اختار صورة مدعومة، والملف الأصلي يكون أقل من 24 ميجا';
          $('rmsg').className='booking-msg err';return;
        }
        var img=document.createElement('img');img.alt='معاينة '+file.name;
        try{var u=URL.createObjectURL(file);urls.push(u);img.src=u;preview.appendChild(img);}catch(e){}
      });
    };
    function fileData(file) {
      return new Promise(function(resolve,reject) {
        var allowed=['image/jpeg','image/png','image/webp','image/heic','image/heif'];
        if(allowed.indexOf(file.type)<0||!file.size||file.size>24*1048576) {
          reject(Error('اختار صورة JPG أو PNG أو WebP أو HEIC بحجم أقل من 24 ميجا'));return;
        }
        if(file.size<=4*1048576 && ['image/jpeg','image/png','image/webp'].indexOf(file.type)>=0) {
          var reader=new FileReader();
          reader.onload=function(){resolve({name:file.name,data:String(reader.result||'')});};
          reader.onerror=function(){reject(Error('مش قادر أقرأ الصورة، جرّب صورة تانية'));};
          reader.readAsDataURL(file);return;
        }
        /* Large iPhone/HEIC pictures are converted to a bounded JPEG in the browser. */
        var url;
        try{url=URL.createObjectURL(file);}catch(e){reject(Error('تعذر فتح الصورة'));return;}
        var img=new Image();
        var finish=function(){try{URL.revokeObjectURL(url);}catch(e){}};
        img.onerror=function(){finish();reject(Error('تعذر تحويل الصورة. اختار نسخة JPG أو خُد Screenshot للصورة.'));};
        img.onload=function(){
          try {
            var maxEdge=2400, factor=Math.min(1,maxEdge/Math.max(img.naturalWidth,img.naturalHeight,1));
            var canvas=document.createElement('canvas');
            canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));
            canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
            var ctx=canvas.getContext('2d');
            if(!ctx)throw Error('canvas');
            ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(img,0,0,canvas.width,canvas.height);
            var data='',quality=[0.90,0.80,0.69];
            for(var k=0;k<quality.length;k++){
              data=canvas.toDataURL('image/jpeg',quality[k]);
              if(data.length<5550000)break;
            }
            finish();
            if(!/^data:image\/jpeg;base64,/.test(data)||data.length>5550000) {
              reject(Error('الصورة كبيرة بعد التحويل؛ جرّب صورة أصغر.'));return;
            }
            resolve({name:file.name.replace(/\.(heic|heif|png|webp|jpe?g)$/i,'')+'.jpg',data:data});
          }catch(e){finish();reject(Error('مش قادر أجهز الصورة؛ جرّب JPG أو Screenshot.'));}
        };
        img.src=url;
      });
    }
    form.onsubmit=function(e){
      e.preventDefault();
      var name=$('rn').value.trim(),phone=requestPhone($('rp').value),message=$('rm').value.trim(),
        files=Array.prototype.slice.call(input.files||[]),msg=$('rmsg'),btn=$('rgo');
      if(name.length<3||!phone||message.length<8) {
        msg.textContent='كمّل الاسم والموبايل الصحيح وتفاصيل التقرير المطلوب.';msg.className='booking-msg err';return;
      }
      if(files.length<1||files.length>3||files.some(function(f){return ['image/jpeg','image/png','image/webp','image/heic','image/heif'].indexOf(f.type)<0||f.size>24*1048576||f.size===0;})){
        msg.textContent='ارفع من 1 إلى 3 صور مدعومة. الصور الكبيرة هنحوّلها تلقائيًا.';
        msg.className='booking-msg err';return;
      }
      btn.disabled=true;btn.textContent='بنبعت الطلب والصور…';msg.textContent='';msg.className='booking-msg';
      Promise.all(files.map(fileData)).then(function(data){
        return requestJson('report-request',{name:name,phone:phone,message:message,files:data});
      }).then(function(j) {
        clearUrls();requestSuccess(form,j.id,'طلب التقرير وصل للمركز','المركز هيطّلع على الصور ويتواصل معاك. ده طلب تقرير، مش تقرير جاهز.');
      }).catch(function(err){
        msg.textContent=err.message;msg.className='booking-msg err';btn.disabled=false;
        btn.textContent='إرسال طلب التقرير والصور ←';
      });
    };
    window.addEventListener('pagehide',clearUrls);
  })();
  /* 4.95 · «اطلب نتيجتك» → a request inside the system (the center sees it live on its cases page) — no WhatsApp */
  var wa0 = $('wa0');
  if (wa0) wa0.onclick = function () {
    var ph = $('ph').value.trim(), er = $('er');
    if (!K.last10(ph)) { if (er) er.textContent = 'اكتب رقم موبايلك الأول'; $('ph').focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var f = form('0'); if (!f) return;
    askIn(ph, f.name, f.note, wa0);
  };
  if (!C.on) return;
  try { var last = JSON.parse(sessionStorage.getItem('ozx_find') || 'null'); if (last) { $('ph').value = last.p || ''; } } catch (e) {}
  /* 4.99 · the mobile alone opens the key (w2); the old (name + mobile) key stays for cases the center hasn't re-keyed yet */
  function open1(x, ph) { return x.w2 ? K.unwrap2(x.w2, ph) : Promise.resolve(null); }
  var go = function () {
    var ph = $('ph').value, b = $('go'), er = $('er'); er.textContent = '';
    if (!K.last10(ph)) { er.textContent = 'اكتب رقم الموبايل كامل'; $('ph').focus(); return; }
    if (!(window.crypto && crypto.subtle)) { er.textContent = 'المتصفح ده قديم — افتح من Chrome أو Safari'; return; }
    b.disabled = true; b.innerHTML = '<span class="spin" style="width:20px;height:20px;border-width:3px;margin:0"></span> بندوّر…'; $('res').innerHTML = '';
    fetch(location.pathname.replace(/\/$/, '') + '/find', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: ph }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || 'محصلش — جرّب تاني'); return j.list || []; }); })
      .then(function (L) { return Promise.all(L.map(function (x) { return open1(x, ph).then(function (k) { return k ? { x: x, k: k } : null; }); })); })
      .then(function (M) {
        M = M.filter(Boolean); b.disabled = false; b.innerHTML = '🔍 دوّر على نتيجتي';
        if (!M.length) { er.textContent = ''; notFound(ph); return; }
        try { sessionStorage.setItem('ozx_find', JSON.stringify({ p: ph })); sessionStorage.setItem('ozx_back', location.pathname.replace(/\/$/, '')); } catch (e) {}
        var href = function (m) { return '/v/' + m.x.token + '?h=1#' + m.k; };
        if (M.length === 1) { $('res').innerHTML = '<div class="ld"><i>✅</i><b>لقينا نتيجتك</b><p>بنفتحها…</p></div>'; setTimeout(function () { location.href = href(M[0]); }, 450); return; }
        $('res').innerHTML = '<p style="color:var(--mut);font-weight:700;margin:4px 4px 0">لقينا ' + M.length + ' نتايج — اختار:</p>' + M.map(function (m, i) {
          var dm = /(\d{4})-(\d{2})-(\d{2})/.exec(String(m.x.at || '')), MO = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          return '<a class="rc" href="' + href(m) + '" style="animation-delay:' + (i * 60) + 'ms"><span class="ri ' + (m.x.kind === 'dicom' ? 'd' : '') + '">' + (m.x.kind === 'dicom' ? '🩻' : '📄') + '</span>' + (dm ? '<span class="dn">' + dm[3] + '<small>' + MO[+dm[2] - 1] + '</small></span>' : '') + '<div><b>' + esc(m.x.exam || 'نتيجة فحص') + '</b><small>📅 ' + dmy(m.x.at) + (m.x.pages ? ' · ' + m.x.pages + (m.x.kind === 'dicom' ? ' صورة DICOM' : ' صفحة') : '') + ' · ' + esc(m.x.hint) + '</small></div><span class="go">←</span></a>';
        }).join('');
      })
      .catch(function (e) { b.disabled = false; b.innerHTML = '🔍 دوّر على نتيجتي'; er.textContent = e.message; });
  };
  /* 5.00 · asking for a result: the name as registered + the day of the exam (both needed by the center to find it) */
  function form(k) {
    var n = ($('an' + k) || {}).value || '', d = ($('ad' + k) || {}).value || '', t = ($('nt' + k) || {}).value || '', e = $('ae' + k);
    n = n.trim(); t = t.trim();
    if (n.length < 3) { if (e) e.textContent = 'اكتب اسمك زي ما اتسجّل في المركز'; $('an' + k).focus(); return null; }
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (!m) { if (e) e.textContent = 'اختار تاريخ عمل الأشعة'; $('ad' + k).focus(); return null; }
    if (new Date(+m[1], m[2] - 1, +m[3]) > new Date()) { if (e) e.textContent = 'التاريخ ده لسه مجاش'; return null; }
    if (e) e.textContent = '';
    return { name: n, note: 'يوم الأشعة ' + (+m[3]) + '/' + (+m[2]) + '/' + m[1] + (t ? ' · ' + t : '') };
  }
  function askIn(ph, name, note, b) {
    var t0 = b ? b.innerHTML : ''; if (b) { b.disabled = true; b.innerHTML = '<span class="spin" style="width:18px;height:18px;border-width:3px;margin:0"></span> بنبعت…'; }
    fetch(location.pathname.replace(/\/$/, '') + '/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: String(name).trim(), phone: ph, note: String(note || '').trim(), notifyDevice: pushDeviceToken() }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || 'محصلش — جرّب تاني'); }); })
      .then(function () {
        var mi = $('miss'); if (mi) mi.style.display = 'none';
        $('res').innerHTML = '<div class="ld ok2"><i>✅</i><b>طلبك وصل للمركز</b><p>أول ما يرفعوا نتيجتك هتلاقيها هنا برقم موبايلك. سيب الصفحة مفتوحة وهنفتحهالك لوحدها أول ما تجهز.</p><p style="margin-top:10px;display:flex;gap:8px;align-items:center;justify-content:center;font-weight:700;color:#0F766E"><span class="spin" style="width:18px;height:18px;border-width:3px;margin:0"></span> مستنيين المركز يرفعها…</p></div>';
        try { sessionStorage.setItem('ozx_find', JSON.stringify({ p: ph })); } catch (e) {}
        watch(ph);
      })
      .catch(function (e) { if (b) { b.disabled = false; b.innerHTML = t0; } var er = $('er'); if (er) er.textContent = e.message; toastIn(e.message); });
  }
  function toastIn(t) { var r = $('res'); if (r && !r.innerHTML) r.innerHTML = '<p style="color:var(--red);font-weight:700;text-align:center">' + esc(t) + '</p>'; }
  /* after asking: look again every 2 minutes (quietly) and open the result once it's uploaded */
  function watch(ph) {
    var n = 0; clearInterval(watch.t);
    watch.t = setInterval(function () {
      if (++n > 15) return clearInterval(watch.t);
      if (document.visibilityState !== 'visible') return;
      fetch(location.pathname.replace(/\/$/, '') + '/find', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: ph }) })
        .then(function (r) { return r.ok ? r.json() : { list: [] }; })
        .then(function (j) { return Promise.all((j.list || []).map(function (x) { return open1(x, ph).then(function (k) { return k ? { x: x, k: k } : null; }); })); })
        .then(function (M) { M = M.filter(Boolean); if (!M.length) return; clearInterval(watch.t); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} $('res').innerHTML = '<div class="ld"><i>🎉</i><b>نتيجتك جهزت!</b><p>بنفتحها…</p></div>'; try { sessionStorage.setItem('ozx_back', location.pathname.replace(/\/$/, '')); } catch (e) {} setTimeout(function () { location.href = '/v/' + M[0].x.token + '?h=1#' + M[0].k; }, 900); })
        .catch(function () {});
    }, 120000);
  }
  function notFound(ph) {
    var mi = $('miss'); if (mi) mi.style.display = 'none';
    $('res').innerHTML = '<div class="ld"><i>🤔</i><b>ملقيناش نتيجة بالبيانات دي</b><p>اتأكد إن الرقم هو اللي اتسجّل في المركز. لو النتيجة لسه طالعة النهارده جرّب بعد شوية.</p>' +
      '<div class="ask">' + '<div class="af"><label class="l">اسمك زي ما اتسجّل في المركز *</label><input class="fld" id="an" maxlength="60" autocomplete="name" placeholder="الاسم بالكامل"><label class="l">تاريخ عمل الأشعة *</label><input class="fld" id="ad" type="date"><label class="l">نوع الفحص (اختياري)</label><input class="fld" id="nt" maxlength="60" placeholder="مثلاً: مقطعية على الصدر"><div class="aer" id="ae"></div></div>' + '<button class="btn ask2" id="wa">📨 اطلب نتيجتك من المركز</button><small>طلبك بيوصل للمركز على طول، وهم يرفعولك النتيجة.</small></div></div>';
    var b = $('wa'); if (!b) return;
    b.onclick = function () { var f = form(''); if (f) askIn(ph, f.name, f.note, b); };
  }
  if ($('go') && $('ph')) { $('go').onclick = go; $('ph').onkeydown = function (e) { if (e.key === 'Enter') go(); }; }
})();
