/* EMDADX · صفحة الدعاية — the standalone control page (/promo/c/<link>): what the ERP normally gives promoadmin.js */
(function () {
  'use strict';
  window.API_BASE = '';
  window.toast = function (m, t) {
    var w = document.getElementById('pmc-toasts'); if (!w) { w = document.createElement('div'); w.id = 'pmc-toasts'; document.body.appendChild(w); }
    var d = document.createElement('div'); d.className = 'pmc-toast ' + (t || 'success'); d.textContent = m; w.appendChild(d);
    setTimeout(function () { d.classList.add('out'); setTimeout(function () { d.remove(); }, 400); }, 2600);
  };
  document.addEventListener('DOMContentLoaded', function () {
    var h = document.createElement('header'); h.className = 'pmc-hd';
    h.innerHTML = '<img src="/icons/logo-square.png" alt=""><div><b>لوحة تحكم صفحة الدعاية</b><small>الإحصائيات · الطلبات · التصميم</small></div><a href="/promo" target="_blank" rel="noopener">فتح الصفحة ↗</a>';
    document.body.insertBefore(h, document.body.firstChild);
  });
})();
