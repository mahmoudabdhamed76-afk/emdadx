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
    var Z = window.OZAds; if (!Z) return '';
    var base = [
      { art: 'ct', tag: 'QR Patient', title: 'ألف سلامة عليك 🤍', body: 'إزاي نقدر نساعدك النهارده؟' },
      { art: 'doc', tag: 'تقارير الأشعة', title: 'تقارير دقيقة.. وسرعة في الخدمة', body: 'فريق متخصص وأحدث أجهزة التصوير' },
      { art: 'xray', tag: 'كل الفحوصات', title: 'مقطعية، رنين، سونار وعادية', body: 'احجز فحصك من موبايلك في دقيقة', cta: 'book' },
      { art: 'phone', tag: 'نتيجتك معاك', title: 'نتيجتك على موبايلك', body: 'التقرير وصور الأشعة معاك في أي وقت', cta: 'results' }
    ];
    /* 5.15 · the center's own ads come right after the welcome slide */
    var all = C.ads || [], L, i;
    all.forEach(function (a) { if (a.kind === 'ad' || !a.kind) a.ad = true; if (a.kind === 'slide') { a.pic = true; a.tag = ''; a.cta = ''; } });
    if (all.some(function (a) { return a.kind === 'base'; })) L = all.filter(function (a) { return a.kind !== 'slide' || a.image; });   /* 5.20 · the center controls every slide and their order */
    else L = [base[0]].concat(all.filter(function (a) { return a.kind !== 'slide'; }).slice(0, 6), all.filter(function (a) { return a.kind === 'slide' && a.image; }).slice(0, 10), C.base === false ? [] : base.slice(1));
    if (!L.length) L = [base[0]];
    var h = '<div class="pvs" id="pvs" role="region" aria-roledescription="carousel" aria-label="عن المركز"><div class="pvs-tr" id="pvsTr">';
    for (i = 0; i < L.length; i++) h += Z.slide(L[i], !i, !i);
    h += '</div><div class="pvs-dots" role="tablist">';
    for (i = 0; i < L.length; i++) h += '<button type="button" role="tab" aria-label="شريحة ' + (i + 1) + '"' + (i ? '' : ' class="on" aria-selected="true"') + '><i style="animation-duration:' + (C.slideMs || 5200) + 'ms"></i></button>';
    if (L.length < 2) h = h.replace('class="pvs-dots"', 'class="pvs-dots" hidden');
    return h + '</div></div>';
  }
  function pvsWire() {
    var box = $('pvs'), tr = $('pvsTr'); if (!box || !tr) return;
    var S = [].slice.call(tr.children), D = [].slice.call(box.querySelectorAll('.pvs-dots button')), n = S.length, cur = 0, timer = 0,
      still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches || S.length < 2, WAIT = Math.max(3000, Math.min(12000, C.slideMs || 5200));
    function go(i) {
      cur = (i + n) % n; tr.style.transition = ''; tr.style.transform = 'translateX(' + (cur * 100) + '%)';
      S.forEach(function (s, k) { s.classList.toggle('on', k === cur); if (k === cur) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true'); });
      D.forEach(function (d, k) { d.classList.toggle('on', k === cur); d.setAttribute('aria-selected', String(k === cur)); });
      plan();
    }
    function plan() { clearTimeout(timer); if (!still && !document.hidden) timer = setTimeout(function () { go(cur + 1); }, WAIT); }
    D.forEach(function (d, k) { d.onclick = function () { go(k); }; });
    box.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('[data-cta]'); if (!c) return; var w = c.dataset.cta === 'book' ? 'booking' : c.dataset.cta, t = document.querySelector('.pvd-tab [data-pvd="' + w + '"]'); if (t) t.click(); else chooseJourney(w); });
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
    (function () { var w = C.wait, me = ''; try { me = localStorage.getItem('ozx_me:' + C.pub) || ''; } catch (e) {}
      var h = (w ? '<div class="pvd-wait" role="status"><i></i><b>' + (w.min ? 'الانتظار دلوقتي حوالي ' + w.min + ' دقيقة' : 'مفيش انتظار دلوقتي — اتفضّل') + '</b><small>اتحدّث من ' + Math.max(1, Math.round((Date.now() - w.at) / 60000)) + ' د</small></div>' : '') +
        (me && C.on ? '<button type="button" class="pvd-me" id="pvdMe">📂 ملفي في المركز <small>كل فحوصاتك في مكان واحد</small><em>←</em></button>' : '');
      return h ? '<div class="pvd-chips">' + h + '</div>' : ''; })() +
    '<div class="pv2-section-title pvd-sec"><div><h2>الخدمات</h2></div><small>كلها من موبايلك</small></div>' +
    '<div class="patient-chooser" role="tablist" aria-label="خدمات المركز">' +
      '<button type="button" id="tab-booking" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-book">' +
        '<span class="pv2-service-icon pvd-c1"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"3\"/><path d=\"M3 10h18M8 3v4M16 3v4\"/><path d=\"M8 14h3v3H8z\"/></svg></span><b>حجز أشعة</b><small>اختار الفحص واليوم المناسب</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-results" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-results">' +
        '<span class="pv2-service-icon pvd-c2"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4v8M12 12c-2 0-3 1-3 3v3c0 1.7-1.3 3-3 3s-3-1.3-3-3v-4c0-4 3-8 6-8M12 12c2 0 3 1 3 3v3c0 1.7 1.3 3 3 3s3-1.3 3-3v-4c0-4-3-8-6-8\"/></svg></span><b>نتيجة الأشعة</b><small>استعلم عن نتيجتك بسهولة</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-complaint" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-complaint">' +
        '<span class="pv2-service-icon pvd-c3"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z\"/><path d=\"M8.5 12h.01M12 12h.01M15.5 12h.01\"/></svg></span><b>الشكاوى والمقترحات</b><small>شكوى أو اقتراح — وتابع الرد بكود</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-report" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-report">' +
        '<span class="pv2-service-icon pvd-c4"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h4\"/></svg></span><b>طلب تقرير أشعة</b><small>ارفع صورة واطلب تقريرك</small><span class="pv2-service-go" aria-hidden="true">←</span></button></div>' +
    '<p class="pv2-action-hint" id="patient-hint" aria-live="polite">اختار أي خدمة للمتابعة</p>' +
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
      '<div class="booking-card pv2-request-card"><div class="booking-heading"><span>📝</span><div><b>الشكاوى والمقترحات</b><small>قولنا اللي ضايقك أو اقترح علينا حاجة تحسّن الخدمة</small></div></div>' +
      '<div class="sg-sw" role="radiogroup" aria-label="نوع الرسالة"><button type="button" role="radio" aria-checked="true" class="on" data-ck="complaint">📝 شكوى</button><button type="button" role="radio" aria-checked="false" data-ck="suggestion">💡 مقترح</button></div>' +
      '<div class="pv2-complaint-intro" role="status"><span>💬</span><p id="ckIntro">اكتب شكوى حضرتك وهتاخد كود تتابع بيه رد المركز</p></div>' +
      '<form id="complaint-form" novalidate>' +
        '<label class="l" for="cn">الاسم بالكامل *</label><input class="fld" id="cn" type="text" maxlength="60" autocomplete="name" placeholder="اسم حضرتك">' +
        '<label class="l" for="cp">رقم الموبايل *</label><input class="fld n" id="cp" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" dir="ltr" placeholder="01xxxxxxxxx">' +
        '<label class="l" for="cs" id="csL">عنوان الشكوى *</label><input class="fld" id="cs" type="text" maxlength="100" placeholder="مثلاً: تأخير في استلام النتيجة">' +
        '<label class="l" for="cm" id="cmL">اكتب تفاصيل الشكوى *</label><textarea class="fld" id="cm" maxlength="1200" rows="5" placeholder="احكي لنا تفاصيل المشكلة علشان نقدر نساعدك"></textarea>' +
        '<p class="booking-note">🔒 الشكوى وبيانات التواصل بتوصل لإدارة المركز فقط للمتابعة.</p>' +
        '<div class="booking-msg" id="cmsg" role="status" aria-live="polite"></div>' +
        '<button class="btn w" id="cgo" type="submit">إرسال الشكوى ←</button>' +
      '</form></div>' +
      '<div class="booking-card tk-card" id="tkCard"><div class="booking-heading"><span>🔎</span><div><b>تابع شكوتك</b><small>اكتب الكود اللي خدته وشوف رد المركز</small></div></div>' +
        '<form id="tk-form" class="tk-row" novalidate><input class="fld tk-in" id="tkC" maxlength="9" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="مثلاً K7P4QX" dir="ltr"><button class="btn" id="tkGo" type="submit">اعرض الرد</button></form>' +
        '<div id="tkMine" class="tk-mine"></div><div id="tkRes" aria-live="polite"></div></div>' +
    '</section>' +
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
      '<button type="button" data-pvd="report"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h4\"/></svg><span>تقرير</span></button><button type="button" data-pvd="complaint"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z\"/><path d=\"M8.5 12h.01M12 12h.01M15.5 12h.01\"/></svg><span>شكاوى</span></button></nav>' +
    '<p class="pv2-footer">نتمنالك دوام الصحة والعافية ♥</p><p class="pv2-analytics-note">يتم احتساب مرات فتح رابط الباركود فقط، بدون تحديد موقع المريض أو تسجيل مكانه.</p>' +
  '</div>';
  /* 5.31 · the center decides the services grid: on/off, names, order, and its own link services */
  (function applySvc() {
    var L = C.svc; if (!Array.isArray(L) || !L.length) return;
    var box = document.querySelector('.patient-chooser'); if (!box) return;
    var ID = { booking: 'tab-booking', results: 'tab-results', complaint: 'tab-complaint', report: 'tab-report' };
    L.forEach(function (x) {
      if (ID[x.k]) {
        var b = $(ID[x.k]); if (!b) return;
        if (x.title) b.querySelector('b').textContent = x.title;
        if (x.sub) b.querySelector('small').textContent = x.sub;
        b.hidden = !x.on; if (!x.on) b.style.setProperty('display', 'none', 'important');
        var nb = document.querySelector('.pvd-tab [data-pvd="' + x.k + '"]'); if (nb && !x.on) nb.hidden = true;
        if (x.k === 'results' && !x.on) { var sr = $('pvdSearch'); if (sr) sr.hidden = true; }
        box.appendChild(b); return;
      }
      if (!x.on) return;
      var href = x.t === 'wa' ? 'https://wa.me/' + x.v.replace(/^\+/, '').replace(/^0/, '20') : x.t === 'tel' ? 'tel:' + x.v : x.t === 'map' ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(x.v) : x.v;
      var a = document.createElement('button'); a.type = 'button'; a.className = 'pv2-service pvx';
      a.onclick = function () { if (x.t === 'tel') location.href = href; else window.open(href, '_blank', 'noopener'); };
      a.innerHTML = '<span class="pv2-service-icon pvx-' + esc(x.color) + '"><i>' + esc(x.icon) + '</i></span><b>' + esc(x.title) + '</b><small>' + esc(x.sub || '') + '</small><span class="pv2-service-go" aria-hidden="true">←</span>';
      box.appendChild(a);
    });
  })();
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
      complaint: ['patient-complaint','tab-complaint','📝 اكتب شكوى أو مقترح — وتابع الرد بالكود','#complaint'],
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
    /* 5.28 · the chosen card slides in (the inner card, never the panel — keeps Safari from blanking) */
    var card = panel && panel.firstElementChild;
    if (card && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { card.classList.remove('pv-in'); void card.offsetWidth; card.classList.add('pv-in'); }
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
  /* 5.25 · every visit, after the welcome screen: the stars pop-up, worded by the center (Ads → «نافذة التقييم») */
  (function centerRatePop() {
    var P = C.pop || {}; if (C.missing || P.onH === false || !window.OZK || !OZK.ratePop) return;
    var K = 'ozx_hrate:' + C.pub;
    var tries = 0;
    /* the welcome screen mounts a moment after this runs — look only after it had the chance to appear, then wait until it's gone */
    setTimeout(function wait() {
      if (document.querySelector('.splw') || document.visibilityState !== 'visible') { if (++tries < 80) return setTimeout(wait, 250); return; }
      setTimeout(function () {
        if (document.querySelector('.rp-pop')) return;
        OZK.ratePop(Object.assign(OZK.popOpts(P, C, 'h'), { url: '/h/' + C.pub + '/rate', onDone: function (n) { try { localStorage.setItem(K, JSON.stringify({ s: n, t: Date.now() })); } catch (e) {} } }));
      }, (P.delay || 2) * 1000);
    }, 500);
  })();
  /* 5.28 · motion: tiles cascade in, a ripple where the finger lands, the header tightens on scroll, the tab bar bubble follows */
  (function motion() {
    var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; if (RM) return;
    document.body.classList.add('pvm');
    [].forEach.call(document.querySelectorAll('.pv2-service, .pv2-trust > div, .pvd-chips > *'), function (el, i) { el.style.setProperty('--mi', i); });
    document.addEventListener('pointerdown', function (e) {
      var t = e.target.closest && e.target.closest('.pv2-service, .btn, .pvd-tab button, .rc, .dk2-c, .pvd-me'); if (!t) return;
      var r = t.getBoundingClientRect(), d = Math.max(r.width, r.height) * 1.2, sp = document.createElement('span'); sp.className = 'pvm-rp';
      sp.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
      if (getComputedStyle(t).position === 'static') t.style.position = 'relative'; t.style.overflow = 'hidden'; t.appendChild(sp); setTimeout(function () { sp.remove(); }, 650);
    }, { passive: true });
    var hd = document.querySelector('.pvd-hd'), tick = false;
    window.addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false; if (hd) hd.classList.toggle('pvm-sc', window.scrollY > 30); }); }, { passive: true });
    var bar = document.querySelector('.pvd-tab');
    if (bar) { var blob = document.createElement('i'); blob.className = 'pvm-blob'; bar.appendChild(blob);
      var place = function () { var on = bar.querySelector('button.on'); if (!on) return; var a = bar.getBoundingClientRect(), b = on.getBoundingClientRect(); blob.style.width = b.width + 'px'; blob.style.transform = 'translateX(' + (b.left - a.left) + 'px)'; };
      new MutationObserver(place).observe(bar, { attributes: true, subtree: true, attributeFilter: ['class'] }); window.addEventListener('resize', place); setTimeout(place, 60); }
  })();
  var initial={ '#book':'booking','#results':'results','#find':'results','#complaint':'complaint','#report':'report' }[location.hash];
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
  /* 5.30 · «الشكاوى والمقترحات»: complaint or suggestion; each gets a short code to read the center's reply later */
  (function setupComplaint() {
    var form=$('complaint-form'), type='complaint', KEY='ozx_tk:'+C.pub;
    function mine(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch(e){ return []; } }
    function paintMine(){ var L=mine(), el=$('tkMine'); if(!el) return; el.innerHTML=L.length?'<small>أكوادك على الموبايل ده:</small>'+L.slice(0,5).map(function(x){ return '<button type="button" data-tk="'+esc(x.c)+'">'+(x.t==='suggestion'?'💡 ':'📝 ')+esc(x.c)+'</button>'; }).join(''):'';
      [].forEach.call(el.querySelectorAll('[data-tk]'),function(b){ b.onclick=function(){ $('tkC').value=b.dataset.tk; track(); }; }); }
    function setType(t){ type=t; [].forEach.call(document.querySelectorAll('[data-ck]'),function(b){ var on=b.dataset.ck===t; b.classList.toggle('on',on); b.setAttribute('aria-checked',String(on)); });
      var sg=t==='suggestion'; $('csL').textContent=sg?'عنوان المقترح (اختياري)':'عنوان الشكوى *'; $('cs').placeholder=sg?'مثلاً: إضافة مواعيد مسائية':'مثلاً: تأخير في استلام النتيجة';
      $('cmL').textContent=sg?'اكتب مقترحك *':'اكتب تفاصيل الشكوى *'; $('cm').placeholder=sg?'إيه اللي ممكن نعمله أحسن؟':'احكي لنا تفاصيل المشكلة علشان نقدر نساعدك';
      $('ckIntro').textContent=sg?'شاركنا فكرتك — كل مقترح بيوصل لإدارة المركز وهتاخد كود تتابع بيه الرد':'اكتب شكوى حضرتك وهتاخد كود تتابع بيه رد المركز';
      $('cgo').textContent=sg?'إرسال المقترح ←':'إرسال الشكوى ←'; }
    [].forEach.call(document.querySelectorAll('[data-ck]'),function(b){ b.onclick=function(){ setType(b.dataset.ck); }; });
    form.onsubmit=function (e) {
      e.preventDefault();
      var sg=type==='suggestion', name=$('cn').value.trim(),phone=requestPhone($('cp').value),subject=$('cs').value.trim(),
        message=$('cm').value.trim(), msg=$('cmsg'),btn=$('cgo');
      if(name.length<3||!phone||(!sg&&subject.length<3)||message.length<8) {
        msg.textContent=sg?'اكتب الاسم ورقم موبايل صحيح ومقترحك (8 حروف على الأقل).':'اكتب الاسم ورقم موبايل صحيح وعنوان الشكوى والتفاصيل (8 حروف على الأقل).';
        msg.className='booking-msg err';return;
      }
      btn.disabled=true;btn.textContent='بنبعت…';msg.textContent='';msg.className='booking-msg';
      requestJson('complaint',{name:name,phone:phone,subject:subject,message:message,type:type})
        .then(function(j){
          var L=mine(); if(j.code){ L.unshift({c:j.code,t:type}); try{ localStorage.setItem(KEY,JSON.stringify(L.slice(0,10))); }catch(er){} }
          form.innerHTML='<div class="booking-success tk-ok" role="status"><span>'+(sg?'💡':'✅')+'</span><h2>'+(sg?'شكرًا على مقترحك':'وصلتنا شكواك')+'</h2>'+
            (j.code?'<p>كود المتابعة بتاعك</p><div class="tk-code" dir="ltr">'+esc(j.code)+'</div><button type="button" class="btn g" id="tkCopy">انسخ الكود</button><p class="tk-hint">احتفظ بالكود — اكتبه في «تابع شكوتك» تحت وهتلاقي رد المركز أول ما يرد.</p>':'')+
            '<button type="button" class="btn g w" id="new-request">رجوع للخدمات</button></div>';
          $('new-request').onclick=function(){ location.href=location.pathname; };
          var cpb=$('tkCopy'); if(cpb) cpb.onclick=function(){ (navigator.clipboard?navigator.clipboard.writeText(j.code):Promise.reject()).then(function(){ cpb.textContent='✓ اتنسخ'; }).catch(function(){}); };
          paintMine();
        })
        .catch(function(err){msg.textContent=err.message;msg.className='booking-msg err';btn.disabled=false;btn.textContent=sg?'إرسال المقترح ←':'إرسال الشكوى ←';});
    };
    function track(){
      var c=$('tkC').value.toUpperCase().replace(/[^A-Z0-9]/g,''), out=$('tkRes'), b=$('tkGo');
      if(c.length!==6){ out.innerHTML='<p class="booking-msg err">الكود 6 حروف وأرقام — اتأكد منه</p>'; return; }
      b.disabled=true; out.innerHTML='';
      fetch(location.pathname.replace(/\/$/,'')+'/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:c})})
        .then(function(r){ return r.json().catch(function(){return {};}).then(function(j){ if(!r.ok) throw new Error(j.message||'محصلش'); return j; }); })
        .then(function(j){
          var sg=j.type==='suggestion', st=j.reply?['r','💬 المركز رد عليك']:j.status==='done'?['d','✅ اتحلّت — المركز تواصل معاك']:['w','⏳ لسه بتتراجع'];
          out.innerHTML='<div class="tk-res"><div class="tk-h"><span>'+(sg?'💡 مقترح':'📝 شكوى')+' · <b dir="ltr">'+esc(j.code)+'</b></span><em class="tk-st '+st[0]+'">'+st[1]+'</em></div>'+
            (j.subject?'<b class="tk-s">'+esc(j.subject)+'</b>':'')+'<small>اتبعتت '+dmy(j.at)+'</small>'+
            (j.reply?'<div class="tk-rp"><small>رد '+esc(C.center||'المركز')+' · '+dmy(j.reply_at)+'</small><p>'+esc(j.reply)+'</p></div>':'<p class="tk-w">'+(j.status==='done'?'المركز قفل الطلب بعد ما تواصل معاك.':'أول ما المركز يرد هتلاقي الرد هنا بنفس الكود.')+'</p>')+'</div>';
        })
        .catch(function(e){ out.innerHTML='<p class="booking-msg err">'+esc(e.message)+'</p>'; })
        .then(function(){ b.disabled=false; });
    }
    $('tk-form').onsubmit=function(e){ e.preventDefault(); track(); };
    paintMine();
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
  var ME = ''; try { ME = localStorage.getItem('ozx_me:' + C.pub) || ''; } catch (e) {}
  if (ME && !$('ph').value) $('ph').value = ME;
  setTimeout(function () {
    var mbtn = $('pvdMe'); if (mbtn) mbtn.onclick = function () { FILE = true; chooseJourney('results'); $('ph').value = ME; $('go').click(); };
    if (FILE && $('ph').value) $('go').click();
  }, 0);
  /* 4.99 · the mobile alone opens the key (w2); the old (name + mobile) key stays for cases the center hasn't re-keyed yet */
  var FILE = location.hash === '#find';
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
        if (M.length === 1 && !FILE) { $('res').innerHTML = '<div class="ld"><i>✅</i><b>لقينا نتيجتك</b><p>بنفتحها…</p></div>'; setTimeout(function () { location.href = href(M[0]); }, 450); return; }
        /* 5.28 · «ملفي»: every exam of this mobile at the center, as a timeline by year, filterable by exam type */
        var me = ''; try { me = localStorage.getItem('ozx_me:' + C.pub) || ''; } catch (e) {}
        var ex = []; M.forEach(function (m) { var e = m.x.exam || 'فحص'; if (ex.indexOf(e) < 0) ex.push(e); });
        var years = {}; M.forEach(function (m) { var y = String(m.x.at || '').slice(0, 4); (years[y] = years[y] || []).push(m); });
        var first = String(M[M.length - 1].x.at || '').slice(0, 4);
        $('res').innerHTML = '<div class="mf-h"><span>📂</span><div><b>ملفك في ' + esc(C.center || 'المركز') + '</b><small>' + M.length + ' فحص' + (first ? ' · من ' + first : '') + '</small></div></div>' +
          '<label class="mf-me"><input type="checkbox" id="mfMe"' + (me ? ' checked' : '') + '><span>افتكر رقمي على الموبايل ده عشان أفتح ملفي على طول</span></label>' +
          (ex.length > 1 ? '<div class="mf-f" id="mfF"><button type="button" class="on" data-mf="">الكل</button>' + ex.map(function (e) { return '<button type="button" data-mf="' + esc(e) + '">' + esc(e) + '</button>'; }).join('') + '</div>' : '') +
          '<div class="mf-tl">' + Object.keys(years).sort().reverse().map(function (y) { return '<div class="mf-y"><b>' + y + '</b></div>' + years[y].map(function (m, i) {
          var dm = /(\d{4})-(\d{2})-(\d{2})/.exec(String(m.x.at || '')), MO = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          return '<a class="rc mf-i" data-ex="' + esc(m.x.exam || 'فحص') + '" href="' + href(m) + '" style="animation-delay:' + (i * 60) + 'ms"><span class="ri ' + (m.x.kind === 'dicom' ? 'd' : '') + '">' + (m.x.kind === 'dicom' ? '🩻' : '📄') + '</span>' + (dm ? '<span class="dn">' + dm[3] + '<small>' + MO[+dm[2] - 1] + '</small></span>' : '') + '<div><b>' + esc(m.x.exam || 'نتيجة فحص') + '</b><small>📅 ' + dmy(m.x.at) + (m.x.pages ? ' · ' + m.x.pages + (m.x.kind === 'dicom' ? ' صورة DICOM' : ' صفحة') : '') + ' · ' + esc(m.x.hint) + '</small></div><span class="go">←</span></a>';
        }).join(''); }).join('') + '</div>';
        var mb = $('mfMe'); if (mb) mb.onchange = function () { try { if (mb.checked) localStorage.setItem('ozx_me:' + C.pub, ph); else localStorage.removeItem('ozx_me:' + C.pub); } catch (e) {} };
        [].forEach.call(document.querySelectorAll('[data-mf]'), function (b) { b.onclick = function () { var v = b.dataset.mf; [].forEach.call(document.querySelectorAll('[data-mf]'), function (x) { x.classList.toggle('on', x === b); }); [].forEach.call(document.querySelectorAll('.mf-i'), function (a) { a.hidden = !!v && a.dataset.ex !== v; }); [].forEach.call(document.querySelectorAll('.mf-y'), function (yy) { var n = yy.nextElementSibling, any = false; while (n && !n.classList.contains('mf-y')) { if (!n.hidden) any = true; n = n.nextElementSibling; } yy.hidden = !any; }); }; });
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
