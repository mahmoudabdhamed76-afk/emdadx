/* ════════════════════════════════════════════════════════════════════
   4.90 · حالات المرضى — صفحة المريض /v/<token>#<key>
   بيجيب الملف المشفّر (من النسخة المؤقتة أو من جهاز المركز لايف)،
   ويفك تشفيره هنا بالمفتاح اللي في الباركود، ويعرضه صفحات (pdf.js).
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var C = window.CD || {}, $ = function (id) { return document.getElementById(id); }, KEY = String(location.hash || '').slice(1), PDF = null, TRY = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function dmy(ts) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(ts || '')); return m ? (+m[3]) + '/' + (+m[2]) + '/' + m[1] : ''; }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }
  /* 5.28 · opened from a referring doctor's page → doctor mode (no rating, counted as «دكتور») */
  try { if (C.token && sessionStorage.getItem('ozx_drv') === C.token) C.doctor = true; } catch (e) {}
  try { if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js'; } catch (e) {}

  function shell() {
    var head = '<div class="top"><span class="tlg">' + (window.OZSkin ? OZSkin.logo('') : '') + '</span><div class="tn"><b>' + esc(C.center || '') + '</b><small>نتيجة الفحص</small></div></div>';
    if (C.missing) { document.body.innerHTML = '<div class="w"><div class="ld" style="margin-top:30vh"><i>' + (C.expired ? '⌛' : '🔍') + '</i><b>' + (C.expired ? 'اللينك ده انتهى' : 'الحالة دي مش موجودة') + '</b><p>' + (C.expired ? 'مدة اللينك خلصت أو صاحبه وقّفه — اطلب لينك جديد من المريض.' : 'اتأكد من الباركود، أو كلّم المركز.') + '</p></div></div>'; return; }
    if (C.doctor) head = head.replace('<small>نتيجة الفحص</small>', '<small>👨‍⚕️ ' + (C.share ? 'لينك للدكتور · صالح لحد ' + dmy(new Date(C.share.expires).toISOString()) : 'نتيجة مريض محوّل منك') + '</small>');
    var back = null; try { back = /^\/h\/[A-Za-z0-9]{8}$/.exec(sessionStorage.getItem('ozx_back') || ''); } catch (e) {}
    if (back) head = head.replace(/<\/div><\/div>$/, '</div><a class="bk" href="' + back[0] + '">↩ نتايج تانية</a></div>');
    document.body.innerHTML = '<div class="w">' + head + '<div class="pt"><small>المريض</small><h1>' + esc(C.patient) + '</h1><div class="m">' + (C.exam ? '<span>🩻 ' + esc(C.exam) + '</span>' : '') + '<span>📅 ' + dmy(C.at) + '</span>' + (C.pages ? '<span>' + (C.kind === 'dicom' ? '🩻 ' + C.pages + ' صورة' : '📄 ' + C.pages + ' صفحة') + '</span>' : '') + '</div></div>' +
      '<div id="deck"></div><div id="body"></div><p class="foot">الملف متشفّر — بيتفتح بس بالباركود ده. · ' + esc(C.center || '') + '</p></div>';
  }
  /* 5.28 · «أهلاً يا أحمد 👋 نتيجتك جاهزة» — a moment before the result */
  function hello() {
    if (C.missing || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var first = String(C.patient || '').trim().split(/\s+/)[0] || '';
    var o = document.createElement('div'); o.className = 'vh2';
    o.innerHTML = '<div class="vh2-c"><span class="vh2-lg">' + (window.OZSkin ? OZSkin.logo('') : '') + '</span><b>' + (C.doctor ? 'نتيجة المريض' : 'أهلاً يا ' + esc(first) + ' 👋') + '</b><small>' + (C.doctor ? esc(C.patient || '') : 'نتيجتك جاهزة') + '</small><i class="vh2-bar"></i></div>';
    document.body.appendChild(o); requestAnimationFrame(function () { o.classList.add('in'); });
    setTimeout(function () { o.classList.add('out'); setTimeout(function () { o.remove(); }, 500); }, 1700);
    o.onclick = function () { o.classList.add('out'); setTimeout(function () { o.remove(); }, 400); };
  }
  /* 5.28 · app-style cards under the patient's name — swipe sideways like stories */
  function deck() {
    var el = $('deck'); if (!el || el.dataset.on) return; el.dataset.on = '1';
    var cards = [];
    cards.push(['res', C.kind === 'dicom' ? '🩻' : '📄', C.kind === 'dicom' ? 'الصور' : 'التقرير', C.kind === 'dicom' ? 'عارض كامل · تكبير وقياس' : (C.pages ? C.pages + ' صفحة · نزّلها PDF' : 'افتحها ونزّلها'), 'c1']);
    if (!C.doctor) cards.push(['doc', '👨‍⚕️', 'ابعتها لدكتورك', 'لينك آمن بمدة إنت بتحددها', 'c2']);
    if (!C.doctor && C.follow) cards.push(['fol', '🔁', 'ميعاد المتابعة', 'يوم ' + dmy(C.follow) + ' · احجز أو فكّرني', 'c3']);
    if (!C.doctor && C.pub) cards.push(['all', '📂', 'كل فحوصاتك', 'ملفك كامل في المركز', 'c4']);
    if (!C.doctor) cards.push(['rate', '⭐', 'قيّم زيارتك', 'رأيك بيفرق معانا', 'c5']);
    el.className = 'dk2';
    el.innerHTML = '<div class="dk2-tr" id="dkTr">' + cards.map(function (c, i) { return '<button type="button" class="dk2-c ' + c[4] + '" data-dk="' + c[0] + '" style="--i:' + i + '"><i>' + c[1] + '</i><b>' + c[2] + '</b><small>' + c[3] + '</small><em>←</em></button>'; }).join('') + '</div>' +
      '<div class="dk2-dots">' + cards.map(function (c, i) { return '<i class="' + (i ? '' : 'on') + '"></i>'; }).join('') + '</div>';
    var tr = $('dkTr'), dots = el.querySelectorAll('.dk2-dots i');
    tr.addEventListener('scroll', function () { var w = tr.firstChild.offsetWidth + 12, k = Math.round(Math.abs(tr.scrollLeft) / w); [].forEach.call(dots, function (d, i) { d.classList.toggle('on', i === k); }); }, { passive: true });
    [].forEach.call(el.querySelectorAll('[data-dk]'), function (b) { b.onclick = function () {
      var k = b.dataset.dk;
      if (k === 'res') return $('body').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (k === 'doc') return shareSheet();
      if (k === 'fol') return followSheet();
      if (k === 'all') { try { sessionStorage.setItem('ozx_back', '/h/' + C.pub); } catch (e) {} location.href = '/h/' + C.pub + '#find'; return; }
      if (k === 'rate') { var r = $('rate'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }; });
  }
  function sheet(html) {
    var o = document.createElement('div'); o.className = 'sh2'; o.innerHTML = '<div class="sh2-c" role="dialog" aria-modal="true"><i class="sh2-h"></i>' + html + '</div>';
    document.body.appendChild(o); requestAnimationFrame(function () { o.classList.add('in'); });
    var close = function () { o.classList.remove('in'); setTimeout(function () { o.remove(); }, 320); };
    o.addEventListener('click', function (e) { if (e.target === o || e.target.closest('[data-x]')) close(); });
    return { el: o, close: close };
  }
  /* 5.28 · «ابعتها لدكتورك»: a separate key wraps this case's key — the doctor's link works only for the days chosen, and can be stopped */
  function shareSheet() {
    var mine = []; try { mine = JSON.parse(localStorage.getItem('ozx_sh:' + C.token) || '[]'); } catch (e) {}
    mine = mine.filter(function (x) { return x.exp > Date.now(); });
    var S = sheet('<b class="sh2-t">👨‍⚕️ ابعت النتيجة لدكتورك</b><p class="sh2-p">هنعمل لينك خاص للدكتور يفتح بيه التقرير والصور، ويقف لوحده بعد المدة اللي تختارها.</p>' +
      '<label class="sh2-l">اسم الدكتور (اختياري)</label><input class="fld" id="shN" maxlength="60" placeholder="مثلاً: د. محمد">' +
      '<label class="sh2-l">اللينك يفضل شغال</label><div class="sh2-ch" id="shD">' + [[1, 'يوم'], [3, '3 أيام'], [7, 'أسبوع'], [30, 'شهر']].map(function (x) { return '<button type="button" data-d="' + x[0] + '" class="' + (x[0] === 7 ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn w" id="shGo">اعمل اللينك</button><div id="shOut"></div>' +
      (mine.length ? '<div class="sh2-ls"><small>لينكات عملتها قبل كده</small>' + mine.map(function (x) { return '<div class="sh2-li"><span>' + esc(x.label || 'دكتور') + ' · لحد ' + dmy(new Date(x.exp).toISOString()) + '</span><button type="button" data-rv="' + x.sid + '">وقّفه</button></div>'; }).join('') + '</div>' : '') +
      '<button type="button" class="btn g w" data-x>قفل</button>');
    var days = 7, el = S.el;
    [].forEach.call(el.querySelectorAll('[data-d]'), function (b) { b.onclick = function () { days = +b.dataset.d; [].forEach.call(el.querySelectorAll('[data-d]'), function (x) { x.classList.toggle('on', x === b); }); }; });
    [].forEach.call(el.querySelectorAll('[data-rv]'), function (b) { b.onclick = function () {
      b.disabled = true; fetch(location.pathname.replace(/\/$/, '') + '/share/' + b.dataset.rv + '/revoke', { method: 'POST' }).then(function () { b.parentNode.innerHTML = '<span>⛔ اللينك اتوقف</span>'; mine = mine.filter(function (x) { return x.sid !== b.dataset.rv; }); try { localStorage.setItem('ozx_sh:' + C.token, JSON.stringify(mine)); } catch (e) {} });
    }; });
    $('shGo').onclick = function () {
      var b = this, label = $('shN').value.trim(), k2 = OZK.newKey(); b.disabled = true; b.textContent = 'بنجهّز اللينك…';
      OZK.wrapRaw(KEY, k2).then(function (w) { return fetch(location.pathname.replace(/\/$/, '') + '/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ w: w, days: days, label: label }) }); })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || 'محصلش'); return j; }); })
        .then(function (j) {
          var url = location.origin + '/s/' + j.sid + '#' + k2, msg = 'نتيجة ' + (C.exam || 'الأشعة') + ' — ' + (C.patient || '') + ' من ' + (C.center || 'المركز') + ':\n' + url;
          mine.push({ sid: j.sid, exp: j.expires, label: label }); try { localStorage.setItem('ozx_sh:' + C.token, JSON.stringify(mine)); } catch (e) {}
          b.remove();
          $('shOut').innerHTML = '<div class="sh2-ok">✅ اللينك جاهز — صالح لحد ' + dmy(new Date(j.expires).toISOString()) + '</div><div class="sh2-row"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">واتساب</a><button type="button" class="btn g" id="shC">انسخ اللينك</button>' + (navigator.share ? '<button type="button" class="btn g" id="shS">مشاركة</button>' : '') + '</div>';
          $('shC').onclick = function () { var t = this; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { t.textContent = '✓ اتنسخ'; }).catch(function () { prompt('انسخ اللينك', url); }); };
          if ($('shS')) $('shS').onclick = function () { navigator.share({ title: 'نتيجة أشعة', text: msg.split('\n')[0], url: url }).catch(function () {}); };
        }).catch(function (e) { b.disabled = false; b.textContent = 'اعمل اللينك'; $('shOut').innerHTML = '<p class="rt-er">' + esc(e.message) + '</p>'; });
    };
  }
  /* 5.28 · the follow-up the center set for this exam: add it to the phone's calendar, or book now */
  function followSheet() {
    var d = String(C.follow || '').replace(/-/g, ''), S = sheet('<b class="sh2-t">🔁 ميعاد المتابعة</b><p class="sh2-p">المركز بينصح بمتابعة <b>' + esc(C.exam || 'الفحص') + '</b> يوم <b>' + dmy(C.follow) + '</b>.</p>' +
      '<div class="sh2-row"><button type="button" class="btn" id="fCal">📅 فكّرني (ضيفه للتقويم)</button>' + (C.pub ? '<a class="btn g" href="/h/' + esc(C.pub) + '#book">احجز ميعاد</a>' : '') + '</div><button type="button" class="btn g w" data-x>قفل</button>');
    $('fCal').onclick = function () {
      var nx = new Date(C.follow + 'T12:00:00Z'); nx.setUTCDate(nx.getUTCDate() + 1); var d2 = nx.toISOString().slice(0, 10).replace(/-/g, '');
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QR Patient//AR', 'BEGIN:VEVENT', 'UID:' + C.token + '-follow@qr', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + d2,
        'SUMMARY:متابعة ' + (C.exam || 'الأشعة') + ' — ' + (C.center || ''), 'DESCRIPTION:احجز من بوابة المركز: ' + location.origin + '/h/' + (C.pub || ''), 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:ميعاد المتابعة بكرة', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'متابعة.ics'; document.body.appendChild(a); a.click(); a.remove(); this.textContent = '✓ اتضاف';
    };
  }
  /* 4.92 · stuck (center offline / file missing / stopped) → ask the center on WhatsApp */
  function waBtn() { return '<button class="btn ask2" id="askc" style="margin-top:10px;display:flex;width:100%">📨 اطلبها من المركز</button>'; }
  function wireAsk() {
    var b = $('askc'); if (!b) return;
    b.onclick = function () {
      b.disabled = true; b.textContent = 'بنبعت…';
      fetch(location.pathname.replace(/\/$/, '') + '/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || 'محصلش'); }); })
        .then(function () { b.outerHTML = '<p style="margin-top:10px;color:#15803D;font-weight:800">✅ طلبك وصل للمركز — هيرفعوا نتيجتك تاني</p>'; })
        .catch(function (e) { b.disabled = false; b.textContent = '📨 اطلبها من المركز'; b.textContent = e.message; });
    };
  }
  function box(icon, title, sub, extra) { if (icon !== 'spin' && icon !== '🔑') extra = (extra || '') + waBtn(); $('body').innerHTML = '<div class="ld">' + (icon === 'spin' ? '<div class="spin"></div>' : '<i>' + icon + '</i>') + '<b>' + title + '</b>' + (sub ? '<p>' + sub + '</p>' : '') + (extra || '') + '</div>';  wireAsk(); }

  function load() {
    if (!C.active) return box('⏸', 'الحالة دي اتوقفت', 'كلّم المركز لو محتاجها.');
    if (!KEY || KEY.length < 20) return box('🔑', 'اللينك ناقص', 'امسح الباركود تاني بكاميرا الموبايل — أو افتح اللينك كامل زي ما اتبعتلك.');
    if (!(window.crypto && crypto.subtle)) return box('⚠️', 'المتصفح ده قديم', 'افتح اللينك من Chrome أو Safari.');
    box('spin', 'بنجيب الحالة…', '', '<div class="bar"><i id="pr" style="width:4%"></i></div><p id="prt" style="margin-top:6px"></p>');
    var viaH = false; try { viaH = /^\/h\//.test(sessionStorage.getItem('ozx_back') || ''); } catch (e) {}
    fetch((C.doctor ? '/v/' + C.token : location.pathname.replace(/\/$/, '')) + '/file' + (C.doctor ? '?d=1' : viaH ? '?h=1' : '') + (function () { try { return localStorage.getItem('qrd-staff') ? (viaH ? '&' : '?') + 's=1' : ''; } catch (e) { return ''; } })(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { var e = new Error(j.message || 'محصلش'); e.j = j; e.status = r.status; throw e; });
      var total = Number(r.headers.get('Content-Length')) || C.size || 0, src = r.headers.get('X-Source');
      if (!r.body || !r.body.getReader) return r.arrayBuffer().then(function (b) { return { buf: b, src: src }; });
      var rd = r.body.getReader(), parts = [], got = 0;
      return (function pump() { return rd.read().then(function (x) {
        if (x.done) { var o = new Uint8Array(got), p = 0; parts.forEach(function (c) { o.set(c, p); p += c.length; }); return { buf: o.buffer, src: src }; }
        parts.push(x.value); got += x.value.length;
        if (total) { var k = Math.min(99, Math.round(got / total * 100)), e1 = $('pr'), e2 = $('prt'); if (e1) e1.style.width = k + '%'; if (e2) e2.textContent = mb(got) + ' من ' + mb(total) + (src === 'center' ? ' · من جهاز المركز لايف' : ''); }
        return pump();
      }); })();
    }).then(function (x) {
      var all = new Uint8Array(x.buf), iv = all.slice(0, 12), ct = all.slice(12);
      return crypto.subtle.importKey('raw', unb64u(KEY), { name: 'AES-GCM' }, false, ['decrypt']).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, k, ct); })
        .catch(function () { var e = new Error('bad'); e.bad = true; throw e; });
    }).then(function (plain) { if (C.kind === 'dicom') showDicom(plain); else { PDF = new Uint8Array(plain); show(); } deck(); if (!C.doctor) rateCard(); })
      .catch(function (e) {
        if (e.bad) return box('🔑', 'مش قادر أفتح الملف', 'الباركود ده مش بتاع الحالة دي أو ناقص — امسحه تاني.');
        if (e.j && e.j.stopped) return box('⏸', 'الحالة دي اتوقفت', 'كلّم المركز لو محتاجها.');
        if (e.j && e.j.missing) return box('📁', 'الملف مش موجود على جهاز المركز', 'كلّم المركز يرفع الحالة تاني.');
        if (e.j && e.j.offline) { TRY++; box('🌙', 'جهاز المركز مقفول دلوقتي', 'الحالة محفوظة على كمبيوتر المركز، وهتتفتح أول ما يشتغل. هنجرّب تاني لوحدنا…', '<button class="btn" id="re" style="margin-top:14px">↻ جرّب دلوقتي</button>'); $('re').onclick = load; clearTimeout(load.t); load.t = setTimeout(load, Math.min(120000, 20000 * TRY)); return; }
        box('⚠️', 'محصلش', esc(e.message || 'النت فصل — جرّب تاني'), '<button class="btn" id="re" style="margin-top:14px">↻ جرّب تاني</button>'); $('re').onclick = load;
      });
  }
  /* 5.21 · after the result opens: «قيّم زيارتك» — stars, quick reasons, a line; low stars offer the complaint form */
  function rateCard() {
    if (C.missing || $('rate')) return; var K = 'ozx_rate:' + C.token, done = null; try { done = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {}
    var host = document.createElement('section'); host.id = 'rate'; host.className = 'rt'; var body = $('body'); if (!body) return; body.parentNode.insertBefore(host, body.nextSibling);
    var st = done ? done.s : 0, tags = done ? done.t || [] : [], T = C.rateTags || [], good = T.slice(0, 4), bad = T.slice(4);
    function paint(sent) {
      if (sent) { host.innerHTML = '<div class="rt-ok"><span>💚</span><b>شكرًا على تقييمك</b><p>' + (st >= 4 ? 'فرّحتنا! ألف سلامة عليك 🤍' : 'هنراجع ملاحظتك ونتحسّن.') + '</p>' + (st <= 2 && C.pub ? '<a class="btn g" href="/h/' + esc(C.pub) + '#complaint">📝 قدّم شكوى للمركز</a>' : '') + '<button type="button" class="rt-ed" id="rtE">تعديل التقييم</button></div>'; $('rtE').onclick = function () { paint(false); }; return; }
      var list = st ? (st >= 4 ? good : bad) : [];
      host.innerHTML = '<div class="rt-h"><b>قيّم زيارتك لـ ' + esc(C.center || 'المركز') + '</b><small>رأيك بيوصل للمركز على طول ومن غير اسمك</small></div>' +
        '<div class="rt-st" role="radiogroup" aria-label="عدد النجوم">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" role="radio" aria-checked="' + (k === st) + '" aria-label="' + k + ' من 5" data-st="' + k + '" class="' + (k <= st ? 'on' : '') + '">★</button>'; }).join('') + '</div>' +
        '<p class="rt-lb">' + (['', 'وحش 😞', 'مش كويس 🙁', 'مقبول 😐', 'كويس 🙂', 'ممتاز 🤩'][st] || 'اختار من 1 لـ 5 نجوم') + '</p>' +
        (st ? '<div class="rt-tg">' + list.map(function (t) { return '<button type="button" data-tg="' + esc(t) + '" class="' + (tags.indexOf(t) > -1 ? 'on' : '') + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
          '<textarea class="fld rt-n" id="rtN" maxlength="300" rows="2" placeholder="عايز تقول حاجة تانية؟ (اختياري)">' + esc(done && done.n || '') + '</textarea><button type="button" class="btn w" id="rtS">ابعت التقييم</button><p class="rt-er" id="rtR"></p>' : '');
      [].forEach.call(host.querySelectorAll('[data-st]'), function (b) { b.onclick = function () { var n = +b.dataset.st; if ((n >= 4) !== (st >= 4)) tags = []; st = n; paint(false); }; });
      [].forEach.call(host.querySelectorAll('[data-tg]'), function (b) { b.onclick = function () { var t = b.dataset.tg, i = tags.indexOf(t); if (i > -1) tags.splice(i, 1); else tags.push(t); b.classList.toggle('on', i < 0); }; });
      var sb = $('rtS'); if (sb) sb.onclick = function () {
        var n = $('rtN').value.trim(), vid = ''; try { vid = localStorage.getItem('ozx_vid') || ''; } catch (e) {}
        sb.disabled = true; sb.textContent = 'بنبعت…';
        fetch(location.pathname.replace(/\/$/, '') + '/rate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stars: st, tags: tags, note: n, vid: vid }) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || 'محصلش'); }); })
          .then(function () { try { localStorage.setItem(K, JSON.stringify({ s: st, t: tags, n: n })); } catch (e) {} paint(true); })
          .catch(function (e) { sb.disabled = false; sb.textContent = 'ابعت التقييم'; $('rtR').textContent = e.message; });
      };
    }
    paint(!!done);
    setTimeout(function () { host.classList.add('in'); }, 30);
    /* 5.22 · a few seconds after the result opens: a small stars-only pop-up in the middle of the screen — one tap and it's gone */
    /* 5.25 · every visit, after the result opens: the stars pop-up (worded by the center) */
    var staff = false, P = C.pop || {}; try { staff = !!localStorage.getItem('qrd-staff'); } catch (e) {}
    if (P.onV !== false) setTimeout(function () {
      if (document.fullscreenElement || document.querySelector('.pz.max') || document.querySelector('.rp-pop')) return;
      OZK.ratePop(Object.assign(OZK.popOpts(P, C, 'v'), { url: location.pathname.replace(/\/$/, '') + '/rate', dry: staff, onDone: function (n) { if (staff) return; try { localStorage.setItem(K, JSON.stringify({ s: n, t: [], n: '' })); } catch (e) {} st = n; tags = []; paint(true); } }));
    }, (P.delay || 2) * 1000);
  }
  /* 5.00 · a DICOM case → the mini PACS right here */
  function showDicom(buf) {
    if (!window.OZPacs || !window.DecompressionStream) { box('⚠️', 'المتصفح ده قديم', 'افتح اللينك من Chrome أو Safari جديد.'); return; }
    $('body').innerHTML = '<div id="pacs"></div><p class="pxtip">🔒 الصور مشفّرة ومحدش يقدر يفتحها غير بالباركود ده · المسطرة والمنطقة للقياس بالملّي</p>';
    try { OZPacs.viewer($('pacs'), buf, { name: String(C.patient || 'صورة').replace(/[\\/:*?"<>|]+/g, ' ') }); }
    catch (e) { box('⚠️', 'مش قادر أفتح الصور', esc(e.message || '')); }
  }
  function fname() { return (String(C.patient || 'case') + (C.exam ? ' - ' + C.exam : '')).replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.pdf'; }
  function blobUrl() { if (!blobUrl.u) blobUrl.u = URL.createObjectURL(new Blob([PDF], { type: 'application/pdf' })); return blobUrl.u; }
  function show() {
    var canShare = false; try { canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([PDF], fname(), { type: 'application/pdf' })] })); } catch (e) {}
    $('body').innerHTML = '<div class="tools"><a class="btn" id="dl" download="' + esc(fname()) + '">⬇ نزّل PDF</a>' + (canShare ? '<button class="btn g" id="sh">↗ ابعتها للدكتور</button>' : '<a class="btn g" id="op" target="_blank" rel="noopener">↗ افتح</a>') + '</div><div class="pages" id="pages"></div>';
    var dl = $('dl'); dl.href = blobUrl();
    var op = $('op'); if (op) op.href = blobUrl();
    var sh = $('sh'); if (sh) sh.onclick = function () { navigator.share({ files: [new File([PDF], fname(), { type: 'application/pdf' })], title: fname() }).catch(function () {}); };
    if (!window.pdfjsLib) { $('pages').innerHTML = '<div class="ld"><i>📄</i><b>الحالة جاهزة</b><p>دوس «نزّل PDF» وافتحها.</p></div>'; return; }
    pdfjsLib.getDocument({ data: PDF.slice(0) }).promise.then(function (doc) {
      var wrap = $('pages'), W = Math.min(wrap.clientWidth || 360, 900), dpr = Math.min(2.5, window.devicePixelRatio || 1);
      var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); draw(e.target); } }); }, { rootMargin: '600px 0px' }) : null;
      function draw(el) {
        var n = +el.dataset.p; if (el.dataset.done) return; el.dataset.done = '1';
        doc.getPage(n).then(function (pg) { var v1 = pg.getViewport({ scale: 1 }), k = W / v1.width, vp = pg.getViewport({ scale: k * dpr }), cv = document.createElement('canvas'); cv.dir = 'ltr'; cv.style.direction = 'ltr'; cv.width = Math.round(vp.width); cv.height = Math.round(vp.height); el.style.minHeight = ''; el.insertBefore(cv, el.firstChild); return pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; }).catch(function () {});
      }
      for (var i = 1; i <= doc.numPages; i++) {
        var d = document.createElement('div'); d.className = 'pg'; d.dataset.p = i; d.style.minHeight = Math.round(W * 1.3) + 'px'; d.innerHTML = '<em>' + i + ' / ' + doc.numPages + '</em>';
        wrap.appendChild(d); if (io) io.observe(d); else draw(d);
      }
    }).catch(function () { $('pages').innerHTML = '<div class="ld"><i>📄</i><b>الحالة جاهزة</b><p>مش قادر أعرضها هنا — دوس «نزّل PDF» وافتحها.</p></div>'; });
  }
  shell(); hello();
  if (!C.missing) {
    if (C.share) OZK.unwrapRaw(C.share, KEY).then(function (k) { if (!k) return box('🔑', 'اللينك ناقص', 'افتح اللينك كامل زي ما اتبعتلك.'); KEY = k; load(); }).catch(function () { box('🔑', 'اللينك ناقص', 'افتح اللينك كامل زي ما اتبعتلك.'); });
    else load();
  }
})();
