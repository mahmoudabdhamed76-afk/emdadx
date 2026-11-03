/* ════════════════════════════════════════════════════════════════════
   5.15 · QR Patient — drawn radiology scenes + slide markup for the patient slider
   Shared by the patient page (/h/) and the center's ads editor (/k/) so the
   preview the center sees is exactly what the patient gets.
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var A = '#7DE3F4', uid = 0;
  function ribs() { var r = '', i, y; for (i = 0; i < 6; i++) { y = 46 + i * 13; r += '<path d="M108 ' + y + 'q-26 -4 -40 ' + (12 + i) + '"/><path d="M112 ' + y + 'q26 -4 40 ' + (12 + i) + '"/>'; } return r; }
  /* every call gets its own gradient ids — several copies of one scene can live on a page */
  var ART = {
    ct: function (u) {
      return '<svg viewBox="0 0 220 170" aria-hidden="true"><defs><radialGradient id="g1' + u + '" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="' + A + '" stop-opacity=".45"/><stop offset="1" stop-color="' + A + '" stop-opacity="0"/></radialGradient><linearGradient id="g2' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6FAFC"/><stop offset="1" stop-color="#BFD0DB"/></linearGradient></defs>' +
        '<circle cx="118" cy="78" r="86" fill="url(#g1' + u + ')"/><path d="M0 146h220" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>' +
        '<rect x="30" y="92" width="34" height="52" rx="6" fill="#9FB3C1"/><rect x="4" y="84" width="140" height="9" rx="4.5" fill="#E9F0F5"/>' +
        '<g class="pvs-slide-in"><rect x="26" y="70" width="88" height="15" rx="7.5" fill="#4F9DCB"/><circle cx="18" cy="76" r="9" fill="#F0C6A2"/><path d="M10 72q8-9 17-2" fill="none" stroke="#3B2A22" stroke-width="4" stroke-linecap="round"/></g>' +
        '<path fill="url(#g2' + u + ')" fill-rule="evenodd" d="M114 22h8a44 44 0 0 1 44 44v24a44 44 0 0 1-44 44h-8a44 44 0 0 1-44-44V66a44 44 0 0 1 44-44zM118 46a28 28 0 1 0 0 56a28 28 0 1 0 0-56z"/>' +
        '<circle class="pvs-spin" cx="118" cy="74" r="32" fill="none" stroke="' + A + '" stroke-width="3" stroke-dasharray="22 12" stroke-linecap="round"/>' +
        '<rect x="80" y="130" width="76" height="16" rx="6" fill="#A9BDCA"/><rect x="132" y="30" width="22" height="8" rx="4" fill="#0B2530" opacity=".85"/><circle class="pvs-blink" cx="137" cy="34" r="2" fill="#4ADE80"/><circle cx="144" cy="34" r="2" fill="' + A + '"/></svg>';
    },
    doc: function (u) {
      return '<svg viewBox="0 0 220 170" aria-hidden="true"><defs><radialGradient id="g3' + u + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#E6EEF3"/><stop offset=".7" stop-color="#7F95A3"/><stop offset="1" stop-color="#2B3B45"/></radialGradient></defs><g transform="translate(220 0) scale(-1 1)">' +
        '<rect x="6" y="20" width="128" height="86" rx="9" fill="#0A1B24" stroke="#36586A" stroke-width="2"/><rect x="13" y="27" width="114" height="72" rx="4" fill="#040D13"/>' +
        '<ellipse cx="42" cy="63" rx="21" ry="27" fill="url(#g3' + u + ')"/><path d="M36 54q6-6 12 0q-2 10-6 14q-4-4-6-14z" fill="#0A1B24"/><ellipse cx="98" cy="63" rx="21" ry="27" fill="url(#g3' + u + ')"/><path d="M92 56q6-5 12 0q-1 8-6 12q-5-4-6-12z" fill="#0A1B24"/>' +
        '<rect class="pvs-scan" x="13" y="27" width="114" height="3" fill="' + A + '" opacity=".75"/>' +
        '<rect x="62" y="106" width="16" height="22" fill="#28424F"/><rect x="40" y="128" width="60" height="6" rx="3" fill="#36586A"/><path d="M0 140h220" stroke="#fff" stroke-opacity=".14" stroke-width="2"/>' +
        '<path d="M150 170v-62q0-26 30-26h4q30 0 30 26v62z" fill="#F3F7FA"/><path d="M170 84l14 22 14-22z" fill="#5AA9D6"/><path d="M182 106v40M162 104q-6 26 8 36" fill="none" stroke="#9FB3C1" stroke-width="2.5"/><circle cx="170" cy="142" r="4" fill="#9FB3C1"/>' +
        '<rect x="176" y="68" width="16" height="16" rx="5" fill="#E3AE88"/><circle cx="184" cy="54" r="17" fill="#EDBB95"/><path d="M167 52q0-20 19-19q16 1 15 17q-8-8-20-6q-8 1-14 8z" fill="#2E211B"/><circle cx="170" cy="56" r="2" fill="#2E211B"/></g></svg>';
    },
    xray: function () {
      return '<svg viewBox="0 0 220 170" aria-hidden="true"><rect x="36" y="10" width="148" height="150" rx="12" fill="#0A141B" stroke="#33505F" stroke-width="2"/>' +
        '<path d="M60 150q0-70 18-96q14-16 32-16t32 16q18 26 18 96z" fill="#9FB3C1" opacity=".28"/>' +
        '<path d="M104 50q-30 2-36 40q-4 34 8 52q16 4 28-6z" fill="#06101A"/><path d="M116 50q30 2 36 40q4 34-8 52q-16 4-28-6z" fill="#06101A"/>' +
        '<g fill="none" stroke="#DDE8EF" stroke-opacity=".75" stroke-width="3" stroke-linecap="round">' + ribs() + '<path d="M80 42q20-8 28 2M140 42q-20-8-28 2"/></g>' +
        '<path d="M110 36v116" stroke="#E7EFF4" stroke-width="7" stroke-dasharray="6 3" opacity=".8"/>' +
        '<circle class="pvs-ring" cx="134" cy="96" r="14" fill="none" stroke="' + A + '" stroke-width="2.5"/></svg>';
    },
    phone: function (u) {
      return '<svg viewBox="0 0 220 170" aria-hidden="true"><defs><radialGradient id="g4' + u + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + A + '" stop-opacity=".4"/><stop offset="1" stop-color="' + A + '" stop-opacity="0"/></radialGradient></defs><circle cx="110" cy="86" r="80" fill="url(#g4' + u + ')"/>' +
        '<rect x="70" y="8" width="80" height="154" rx="16" fill="#0B1A22" stroke="#E3ECF2" stroke-width="3"/><rect x="77" y="18" width="66" height="134" rx="9" fill="#F4F8FB"/>' +
        '<rect x="82" y="24" width="56" height="58" rx="6" fill="#0A141B"/><path d="M108 32q-16 2-19 22q-2 16 4 24h14zM112 32q16 2 19 22q2 16-4 24h-14z" fill="#33505F"/><path d="M110 30v50" stroke="#DDE8EF" stroke-width="3"/>' +
        '<rect x="84" y="90" width="42" height="5" rx="2.5" fill="#B8C7D1"/><rect x="84" y="100" width="30" height="5" rx="2.5" fill="#D3DEE5"/><rect x="84" y="118" width="52" height="16" rx="8" fill="#0E7C86"/>' +
        '<g class="pvs-pop"><circle cx="150" cy="40" r="15" fill="#22C55E"/><path d="M143 40l5 5 9-10" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>' +
        '<g class="pvs-pop2"><rect x="28" y="92" width="44" height="30" rx="8" fill="#fff"/><text x="50" y="112" text-anchor="middle" font-size="12" font-weight="800" fill="#E11D48" font-family="sans-serif">PDF</text></g></svg>';
    },
    offer: function (u) {
      return '<svg viewBox="0 0 220 170" aria-hidden="true"><defs><linearGradient id="g5' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient><radialGradient id="g6' + u + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FBBF24" stop-opacity=".45"/><stop offset="1" stop-color="#FBBF24" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="110" cy="84" r="82" fill="url(#g6' + u + ')"/>' +
        '<g class="pvs-pop" style="transform-origin:110px 84px"><path d="M110 22l13 12 17-4 4 17 16 8-8 15 8 15-16 8-4 17-17-4-13 12-13-12-17 4-4-17-16-8 8-15-8-15 16-8 4-17 17 4z" fill="url(#g5' + u + ')"/>' +
        '<circle cx="110" cy="84" r="40" fill="#0B1A22" opacity=".12"/><text x="110" y="98" text-anchor="middle" font-size="46" font-weight="900" fill="#7C2D12" font-family="sans-serif">%</text></g>' +
        '<g class="pvs-blink" fill="#fff"><path d="M40 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M182 118l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><circle cx="186" cy="44" r="3"/><circle cx="34" cy="128" r="2.5"/></g></svg>';
    },
    heart: function (u) {
      return '<svg viewBox="0 0 220 170" aria-hidden="true"><defs><linearGradient id="g7' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDA4AF"/><stop offset="1" stop-color="#E11D48"/></linearGradient><radialGradient id="g8' + u + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FB7185" stop-opacity=".4"/><stop offset="1" stop-color="#FB7185" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="110" cy="84" r="80" fill="url(#g8' + u + ')"/><g class="pvs-beat"><path d="M110 138s-52-30-52-68a28 28 0 0 1 52-14a28 28 0 0 1 52 14c0 38-52 68-52 68z" fill="url(#g7' + u + ')"/></g>' +
        '<path class="pvs-ecgl" d="M20 92h56l8-16 10 30 10-36 8 22h88" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
  };
  var ARTS = [['ct', 'جهاز مقطعية'], ['doc', 'دكتور وشاشة'], ['xray', 'أشعة صدر'], ['phone', 'النتيجة على الموبايل'], ['offer', 'عرض / خصم'], ['heart', 'صحة وقلب']];
  var CTA = { book: 'احجز دلوقتي', results: 'شوف نتيجتك', report: 'اطلب تقريرك', complaint: 'كلّمنا' };
  function art(name) { var f = ART[name] || ART.offer; return f(++uid); }
  /* ad = {title, body, tag, art, image, cta}; head = the slide holds the page's <h1> */
  function slide(ad, on, head) {
    var bg = ad.image ? '<div class="pvs-img" style="background-image:url(\'' + String(ad.image).replace(/'/g, '') + '\')"></div>' : '<div class="pvs-art">' + art(ad.art) + '</div>';
    var t = head ? '<h1 id="patient-title">' + esc(ad.title) + '</h1>' : '<b>' + esc(ad.title) + '</b>';
    return '<div class="pvs-s' + (on ? ' on' : '') + (ad.image ? ' im' : '') + (ad.ad ? ' ad' : '') + '" role="group" aria-roledescription="slide">' + bg +
      '<div class="pvs-tx">' + (ad.tag ? '<span class="pvs-k">' + esc(ad.tag) + '</span>' : '') + t + (ad.body ? '<small>' + esc(ad.body) + '</small>' : '') +
      (ad.cta && CTA[ad.cta] ? '<button type="button" class="pvs-cta" data-cta="' + esc(ad.cta) + '">' + CTA[ad.cta] + ' ←</button>' : '') + '</div></div>';
  }
  window.OZAds = { art: art, slide: slide, ARTS: ARTS, CTA: CTA, esc: esc };
})();
