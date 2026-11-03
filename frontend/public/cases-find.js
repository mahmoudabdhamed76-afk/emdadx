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
  if (C.missing) { document.body.innerHTML = '<div class="w"><div class="ld" style="margin-top:30vh"><i>🔍</i><b>الباركود ده مش شغال</b><p>كلّم المركز.</p></div></div>'; return; }
  /* V2: One clear home, two equal service cards; expanding either opens its own matching card. */
  document.body.innerHTML = '<div class="w pv2-page">' +
    '<header class="top pv2-top"><span class="tlg">' + (window.OZSkin ? OZSkin.logo('') : '') + '</span>' +
      '<div class="tn"><b>' + esc(C.center) + '</b><small>بوابة المرضى الإلكترونية</small></div>' +
      '<span class="pv2-online" title="الخدمات الإلكترونية"><i></i>أونلاين</span></header>' +
    '<section class="pv2-hero" aria-label="مرحباً بك">' +
      '<div class="pv2-hero-bg" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<div class="pv2-hero-copy"><span class="pv2-eyebrow">✦ تجربة أسهل للاطمئنان عليك</span>' +
      '<h1 class="ttl" id="patient-title">ألف سلامة عليك <span>♥</span></h1>' +
      '<p>نتيجة الأشعة، حجز فحص، شكوى أو طلب تقرير — كل خدمات المركز من موبايلك.</p>' +
      '<div class="pv2-hero-chip"><span class="pv2-chip-dot"></span> اختار الخدمة اللي محتاجها</div></div>' +
      '<div class="pv2-hero-art" aria-hidden="true"><span class="pv2-art-ring r1"></span><span class="pv2-art-ring r2"></span><span class="pv2-art-core">✚</span>' +
      '<svg class="pv2-art-ecg" viewBox="0 0 160 42" fill="none"><path d="M0 22h48l8-11 8 22 9-30 9 19h78" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '</section>' +
    '<div class="pv2-section-title"><div><span>الخدمات</span><h2>تحب تعمل إيه النهارده؟</h2></div><small>اختار واحدة للمتابعة</small></div>' +
    '<div class="patient-chooser" role="tablist" aria-label="خدمات المركز">' +
      '<button type="button" id="tab-booking" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-book">' +
        '<span class="pv2-service-icon">📅</span><b>حجز أشعة</b><small>اختار الفحص واليوم المناسب</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-results" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-results">' +
        '<span class="pv2-service-icon">🩻</span><b>نتيجة الأشعة</b><small>استعلم عن نتيجتك بسهولة</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-complaint" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-complaint">' +
        '<span class="pv2-service-icon">📝</span><b>تقديم شكوى</b><small>قولنا إيه اللي ضايقك وهنساعدك</small><span class="pv2-service-go" aria-hidden="true">←</span></button>' +
      '<button type="button" id="tab-report" class="pv2-service" role="tab" aria-selected="false" aria-controls="patient-report">' +
        '<span class="pv2-service-icon">📤</span><b>طلب تقرير أشعة</b><small>ارفع صورة واطلب تقريرك</small><span class="pv2-service-go" aria-hidden="true">←</span></button></div>' +
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
        '<div class="pv2-upload-images"><input id="rfiles" class="fld" type="file" accept="image/jpeg,image/png,image/webp" multiple>' +
          '<p>JPG أو PNG أو WebP · حد أقصى 4 ميجا لكل صورة</p><div id="rpreview" class="pv2-image-preview"></div></div>' +
        '<p class="booking-note">🔒 الصور محفوظة بشكل مشفر، وبتتمسح من النظام بعد 30 يوم. المركز هيشوف طلبك ويتواصل معاك.</p>' +
        '<div class="booking-msg" id="rmsg" role="status" aria-live="polite"></div>' +
        '<button class="btn w" id="rgo" type="submit">إرسال طلب التقرير والصور ←</button>' +
      '</form></div></section>' +
    '<div class="pv2-trust"><div><i>🔒</i><span>خصوصية بياناتك</span></div><div><i>⚡</i><span>خطوات سريعة</span></div><div><i>📱</i><span>كل حاجة من موبايلك</span></div></div>' +
    '<p class="pv2-footer">نتمنالك دوام الصحة والعافية ♥</p><p class="pv2-analytics-note">يتم احتساب مرات فتح رابط الباركود فقط، بدون تحديد موقع المريض أو تسجيل مكانه.</p>' +
  '</div>';
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
      if (panel) panel.hidden = !active;
      if (btn) { btn.classList.toggle('on',active); btn.setAttribute('aria-selected',String(active)); }
    });
    $('patient-hint').textContent=current[2];
    try { history.replaceState(null,'',location.pathname+current[3]); }catch(e){}
    var panel=$(current[0]);
    if (panel && panel.scrollIntoView) setTimeout(function () {
      panel.scrollIntoView({behavior:window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    },70);
    if (which==='complaint') {
      var intro=document.querySelector('.pv2-complaint-intro');
      if (intro) { intro.classList.remove('pv2-play'); void intro.offsetWidth; intro.classList.add('pv2-play'); }
    }
  }
  [['booking','tab-booking'],['results','tab-results'],['complaint','tab-complaint'],['report','tab-report']].forEach(function (x) {
    $(x[1]).onclick=function () { chooseJourney(x[0]); };
  });
  var initial={ '#book':'booking','#results':'results','#complaint':'complaint','#report':'report' }[location.hash];
  if (initial) chooseJourney(initial);
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
        body: JSON.stringify({ name: name, phone: phone, exam: exam, day: day, slot: slot, note: note })
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
        if(['image/jpeg','image/png','image/webp'].indexOf(file.type)<0||file.size>4*1048576){
          $('rmsg').textContent='الصور لازم تكون JPG أو PNG أو WebP، كل واحدة أقل من 4 ميجا';
          $('rmsg').className='booking-msg err';return;
        }
        var img=document.createElement('img');img.alt='معاينة '+file.name;
        try{var u=URL.createObjectURL(file);urls.push(u);img.src=u;preview.appendChild(img);}catch(e){}
      });
    };
    function fileData(file) {
      return new Promise(function(resolve,reject){
        var reader=new FileReader();reader.onload=function(){resolve({name:file.name,data:String(reader.result||'')});};
        reader.onerror=function(){reject(Error('مش قادر أقرأ الصورة، جرّب صورة تانية'));};reader.readAsDataURL(file);
      });
    }
    form.onsubmit=function(e){
      e.preventDefault();
      var name=$('rn').value.trim(),phone=requestPhone($('rp').value),message=$('rm').value.trim(),
        files=Array.prototype.slice.call(input.files||[]),msg=$('rmsg'),btn=$('rgo');
      if(name.length<3||!phone||message.length<8) {
        msg.textContent='كمّل الاسم والموبايل الصحيح وتفاصيل التقرير المطلوب.';msg.className='booking-msg err';return;
      }
      if(files.length<1||files.length>3||files.some(function(f){return ['image/jpeg','image/png','image/webp'].indexOf(f.type)<0||f.size>4*1048576||f.size===0;})){
        msg.textContent='ارفع من 1 إلى 3 صور JPG أو PNG أو WebP؛ الصورة أقل من 4 ميجا.';
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
    fetch(location.pathname.replace(/\/$/, '') + '/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: String(name).trim(), phone: ph, note: String(note || '').trim() }) })
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
