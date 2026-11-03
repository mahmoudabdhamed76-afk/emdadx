/* Patient Portal V2 — six daylight palettes and a dismissible welcome screen. */
(function () {
  'use strict';
  var C = window.CD || {}, H = document.documentElement;
  var T = ['a','b','c','d','e','f'].indexOf(C.theme) >= 0 ? C.theme : 'a';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  H.classList.remove('dk');
  H.classList.add('tx', 't' + T, 'patient-daylight');
  H.style.colorScheme = 'light';
  var colors = { a:'#F2FBFA', b:'#EDF6FF', c:'#FBF6EF', d:'#F6F3FF', e:'#F2F8FF', f:'#F3FAF5' };
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', colors[T]);
  function logo(cls) {
    return C.logo ? '<img class="' + (cls || '') + '" src="' + C.logo + '" alt="لوجو المركز">' :
      '<b class="' + (cls || '') + ' ini">' + esc(String(C.center || 'م').trim().charAt(0)) + '</b>';
  }
  var name = String(C.center || '').trim();
  var nm2 = /^مركز/.test(name) ? name : 'مركز ' + name;
  function welcome() {
    return '<div class="pv2-splash" dir="rtl">' +
      '<div class="pv2-splash-orb o1"></div><div class="pv2-splash-orb o2"></div>' +
      '<div class="pv2-welcome-logo">' + logo('') + '</div>' +
      '<span class="pv2-splash-eyebrow">✦ بوابة المريض الإلكترونية</span>' +
      '<h1>تقارير دقيقة <span>وسرعة في الخدمة</span></h1>' +
      '<p class="pv2-welcome-name">' + esc(nm2) + '</p>' +
      '<p class="pv2-splash-sub">فريق متخصص وأحدث أجهزة التصوير<br>وخدماتك متاحة من موبايلك</p>' +
      '<div class="pv2-welcome-steps"><span>📅 حجز الأشعة</span><span>🩻 نتائج الفحوصات</span></div>' +
      '<button type="button" class="pv2-enter">ابدأ الآن <span aria-hidden="true">←</span></button>' +
      '<small class="pv2-welcome-foot">خدمة سهلة · خصوصية بياناتك</small>' +
    '</div>';
  }
  function splash() {
    if (C.missing || !C.pub || C.token) return;
    var key = 'ozx_spl_v2:' + C.pub;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var o = document.createElement('div');
    o.className = 'splw pv2-splw';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-label', 'أهلاً بيك في بوابة المركز');
    o.innerHTML = welcome();
    document.body.appendChild(o);
    var prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    var done = false;
    var close = function () {
      if (done) return;
      done = true;
      o.classList.add('out');
      document.body.style.overflow = prev;
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 400);
    };
    var b = o.querySelector('.pv2-enter');
    if (b) b.onclick = close;
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    setTimeout(close, 2400);
  }
  /* Keep the webpage at its natural scale; medical image zoom remains available in .pxv. */
  function preventPageZoom() {
    if (C.missing) return;
    function isMedicalViewer(target) {
      return !!(target && target.closest && target.closest('.pxv'));
    }
    ['gesturestart', 'gesturechange'].forEach(function (type) {
      document.addEventListener(type, function (e) {
        if (!isMedicalViewer(e.target) && e.cancelable) e.preventDefault();
      }, { capture: true, passive: false });
    });
    document.addEventListener('dblclick', function (e) {
      if (!isMedicalViewer(e.target) && e.cancelable) e.preventDefault();
    }, { passive: false });
  }
  preventPageZoom();
  function mount() { splash(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else setTimeout(mount, 0);
  window.OZSkin = { theme: T, logo: logo, nm2: nm2 };
})();