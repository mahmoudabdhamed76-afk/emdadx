/* ════════════════════════════════════════════════════════════
   4.32 · رسومات EMDADX الخاصة (بنفس روح Hairline: خطوط رفيعة إيزومترك)
   1) ثلاث رسومات كبيرة لرأس الصفحة: الشيكات / الموردين / الأرباح
      — بتتحرك لوحدها وبترد على الماوس أو اللمس.
   2) أيقونات صغيرة متحركة لكل أقسام القايمة الجانبية بدل الأيقونات الثابتة.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var K = 0.8660254, NS = 'http://www.w3.org/2000/svg';
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function f2(n) { return Math.round(n * 100) / 100; }

  /* ═════════ 1 · big figures — a tiny engine ═════════ */
  function iso(S, ox, oy) { return function (x, y, z) { return [ox + (x - y) * K * S, oy + (x + y) * 0.5 * S - z * S]; }; }
  function pts(a) { return a.map(function (p, i) { return (i ? 'L' : 'M') + f2(p[0]) + ' ' + f2(p[1]); }).join(''); }
  /* box: filled silhouette + the edges a viewer can see */
  function box(P, out, x, y, z, w, d, h, hiTop) {
    var t0 = P(x, y, z + h), t1 = P(x + w, y, z + h), t2 = P(x + w, y + d, z + h), t3 = P(x, y + d, z + h);
    var b1 = P(x + w, y, z), b2 = P(x + w, y + d, z), b3 = P(x, y + d, z);
    out.push(['p', pts([t0, t1, b1, b2, b3, t3]) + 'Z']);
    out.push([hiTop ? 'hi' : 'edge', pts([t0, t1, t2, t3]) + 'Z']);
    out.push(['edge', pts([t1, b1, b2, b3, t3])]);
    out.push(['mid', pts([t2, b2])]);
  }
  function ring(P, cx, cy, z, r, a0, a1, n) {
    var o = []; n = n || 24;
    for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; o.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); }
    return o;
  }
  /* a standing cylinder (coin stack) with stripes */
  function cyl(P, out, cx, cy, z, r, h, stripe, hiTop) {
    var R = -Math.PI / 4, L = 3 * Math.PI / 4;       // screen right / left extremes
    var top = ring(P, cx, cy, z + h, r, 0, Math.PI * 2, 28);
    var front = ring(P, cx, cy, z, r, L, R, 16);      // through 45° (front)
    var back = ring(P, cx, cy, z + h, r, R, R - Math.PI, 16);
    out.push(['p', pts(back.concat(front)) + 'Z']);
    out.push(['edge', pts(front)]);
    out.push(['edge', pts([P(cx + Math.cos(L) * r, cy + Math.sin(L) * r, z), P(cx + Math.cos(L) * r, cy + Math.sin(L) * r, z + h)])]);
    out.push(['edge', pts([P(cx + Math.cos(R) * r, cy + Math.sin(R) * r, z), P(cx + Math.cos(R) * r, cy + Math.sin(R) * r, z + h)])]);
    if (stripe) for (var s = z + stripe; s < z + h - 0.05; s += stripe) out.push(['lo', pts(ring(P, cx, cy, s, r, L, R, 12))]);
    out.push([hiTop ? 'hi' : 'edge', pts(top) + 'Z']);
  }

  function engine(el, opts, draw, tour) {
    opts = opts || {};
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 250 200'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', opts.label || '');
    el.classList.add('axfig'); el.setAttribute('data-axfig', '');
    el.appendChild(svg);
    var pool = [], st = { t: 0, v: 0, target: 0, px: null, py: null, clock: 0 }, raf = 0, last = 0, vis = true, hover = false, dead = false;
    var play = opts.play !== false && !reduced();
    function sync(list) {
      for (var i = 0; i < list.length; i++) {
        var p = pool[i]; if (!p) { p = pool[i] = document.createElementNS(NS, 'path'); svg.appendChild(p); }
        if (p._c !== list[i][0]) { p._c = list[i][0]; p.setAttribute('class', 'f-' + list[i][0]); }
        if (p._d !== list[i][1]) { p._d = list[i][1]; p.setAttribute('d', list[i][1]); }
        if (p.style.display) p.style.display = '';
      }
      for (var j = list.length; j < pool.length; j++) pool[j].style.display = 'none';
    }
    function frame(now) {
      raf = 0; if (dead) return; if (!framed) frameIt();
      var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      st.clock += dt;
      if (!hover && play) st.target = tour(st.clock);
      /* spring toward the target */
      st.v += ((st.target - st.t) * 60 - st.v * 13) * dt; st.t += st.v * dt;
      var out = []; draw(st, out); sync(out);
      var moving = Math.abs(st.v) > 0.0008 || Math.abs(st.target - st.t) > 0.0008 || (play && !hover) || st.busy;
      if (vis && moving) raf = requestAnimationFrame(frame); else last = 0;
    }
    function kick() { if (!raf && !dead) raf = requestAnimationFrame(frame); }
    function at(e) {
      var r = svg.getBoundingClientRect(); if (!r.width) return;
      st.px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      st.py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      st.target = st.px; hover = true; kick();
    }
    function leave() { hover = false; st.clock = 0; kick(); }
    el.addEventListener('pointermove', at); el.addEventListener('pointerdown', at);
    el.addEventListener('pointerleave', leave); el.addEventListener('pointercancel', leave);
    var io = null;
    try { io = new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) kick(); }); io.observe(el); } catch (e) {}
    /* frame the drawing: measure it at rest, midway and at full answer, then fit a 5:4 view around all three */
    var framed = false;
    function frameIt() {
    try {
      if (!el.isConnected || framed) return; framed = true;
      var U = null;
      [0, 0.5, 1].forEach(function (tt) { st.t = tt; var o2 = []; draw(st, o2); sync(o2); var bb = svg.getBBox(); if (!bb.width) return;
        U = U ? { x0: Math.min(U.x0, bb.x), y0: Math.min(U.y0, bb.y), x1: Math.max(U.x1, bb.x + bb.width), y1: Math.max(U.y1, bb.y + bb.height) } : { x0: bb.x, y0: bb.y, x1: bb.x + bb.width, y1: bb.y + bb.height }; });
      st.t = 0;
      if (U) { var w = U.x1 - U.x0, h = U.y1 - U.y0, pad = 0.07, W = w * (1 + pad * 2), H = h * (1 + pad * 2);
        if (W / H > 1.25) H = W / 1.25; else W = H * 1.25;
        svg.setAttribute('viewBox', [f2((U.x0 + U.x1) / 2 - W / 2), f2((U.y0 + U.y1) / 2 - H / 2), f2(W), f2(H)].join(' ')); }
    } catch (e) { st.t = 0; }
    }
    frameIt();
    var out0 = []; draw(st, out0); sync(out0); kick();
    return {
      update: function () {},
      destroy: function () { dead = true; if (raf) cancelAnimationFrame(raf); if (io) io.disconnect(); el.removeEventListener('pointermove', at); el.removeEventListener('pointerdown', at); el.removeEventListener('pointerleave', leave); el.removeEventListener('pointercancel', leave); if (svg.parentNode) svg.parentNode.removeChild(svg); el.classList.remove('axfig'); el.removeAttribute('data-axfig'); }
    };
  }
  /* a tour: hold at 0, travel to 1, hold, come back — in seconds */
  function shuttle(T) { return function (c) { var u = (c % T) / T; return u < 0.12 ? 0 : u < 0.42 ? ease((u - 0.12) / 0.3) : u < 0.62 ? 1 : u < 0.92 ? 1 - ease((u - 0.62) / 0.3) : 0; }; }
  function ease(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

  /* ── الشيكات: دفتر شيكات — الشيك اللي فوق بيطلع، بيتمضي، ويتحط على كومة «اتصرف» ── */
  function cheques(el, o) {
    var P = iso(10, 118, 92);
    return engine(el, Object.assign({ label: 'دفتر شيكات: الشيك بيطلع ويتمضي ويتصرف' }, o), function (st, out) {
      var t = Math.max(-0.05, Math.min(1.05, st.t));
      box(P, out, -8, -4, -1, 16, 8, 1);                                  // plinth
      var W = 6.6, D = 3.4, sh = 0.32;
      for (var i = 0; i < 5; i++) box(P, out, -7.2, -1.7, i * sh, W, D, 0.16, false);   // the pad
      box(P, out, 0.6, -1.7, 0, W, D, 0.16); box(P, out, 0.6, -1.7, sh, W, D, 0.16);   // cleared pile
      /* lines on the pad's next cheque */
      var zt = 5 * sh + 0.17;
      out.push(['lo', pts([P(-6.6, -1.1, zt - sh), P(-2.4, -1.1, zt - sh)])]);
      /* the moving cheque */
      var x0 = -7.2 + t * 7.8, z0 = zt + Math.sin(Math.PI * Math.max(0, Math.min(1, t))) * 2.6;
      box(P, out, x0, -1.7, z0, W, D, 0.16, true);
      var zz = z0 + 0.17;
      out.push(['mid', pts([P(x0 + 0.5, -1.1, zz), P(x0 + 3.9, -1.1, zz)])]);            // pay to
      out.push(['mid', pts([P(x0 + 0.5, -0.3, zz), P(x0 + 3.2, -0.3, zz)])]);
      out.push(['edge', pts([P(x0 + 4.6, -1.35, zz), P(x0 + 6.1, -1.35, zz), P(x0 + 6.1, -0.45, zz), P(x0 + 4.6, -0.45, zz)]) + 'Z']);  // amount
      /* the signature, drawn as it travels */
      var sig = [], n = Math.max(2, Math.round(26 * Math.max(0, Math.min(1, t * 1.25))));
      for (var k = 0; k < n; k++) { var u = k / 25; sig.push(P(x0 + 3.4 + u * 2.6, 0.75 + Math.sin(u * 14) * 0.32 - u * 0.2, zz)); }
      if (t > 0.03) out.push(['hi', pts(sig)]);
      /* ✓ on the pile once it lands */
      if (t > 0.9) out.push(['hi', pts([P(2.2, 0.6, 2 * sh + 0.17 + (t > 0.98 ? 0 : 3)), P(2.8, 1.1, 2 * sh + 0.17), P(4, -0.2, 2 * sh + 0.17)])]);
    }, shuttle(5.2));
  }

  /* ── الموردين: عربية نقل رايحة جاية بين مخزن المورد ومخزنك ── */
  function suppliers(el, o) {
    var P = iso(9.2, 126, 96);
    return engine(el, Object.assign({ label: 'عربية نقل بين المورد ومخزنك' }, o), function (st, out) {
      var t = Math.max(-0.05, Math.min(1.05, st.t));
      /* road */
      out.push(['lo', pts([P(-7, -1.6, 0), P(7.5, -1.6, 0)])]);
      out.push(['lo', pts([P(-7, 2.4, 0), P(7.5, 2.4, 0)])]);
      for (var s = -6.5; s < 7; s += 1.6) out.push(['mid', pts([P(s, 0.4, 0), P(s + 0.7, 0.4, 0)])]);
      /* supplier's warehouse (back left) with a gable */
      box(P, out, -11, -6.5, 0, 4.2, 4.6, 3);
      var g1 = P(-11, -4.2, 4.4), g2 = P(-6.8, -4.2, 4.4);
      out.push(['p', pts([P(-11, -6.5, 3), P(-6.8, -6.5, 3), g2, P(-6.8, -1.9, 3), P(-11, -1.9, 3), g1]) + 'Z']);
      out.push(['edge', pts([P(-11, -1.9, 3), g1, g2, P(-6.8, -1.9, 3)])]);
      out.push(['edge', pts([g2, P(-6.8, -6.5, 3)])]);
      out.push(['mid', pts([P(-9.6, -1.9, 0), P(-9.6, -1.9, 1.8), P(-8.2, -1.9, 1.8), P(-8.2, -1.9, 0)])]);   // door
      /* your store (back right) with crates delivered */
      box(P, out, 6.2, -7, 0, 3.6, 3.8, 2.4, true);
      out.push(['mid', pts([P(9.8, -6.3, 1.9), P(9.8, -3.9, 1.9)])]);
      var got = t > 0.93 ? 3 : t > 0.6 ? 2 : 1;
      for (var c = 0; c < got; c++) box(P, out, 7 + (c % 2) * 1.15, -2.9, (c > 1 ? 1 : 0), 1, 1, 1, c === got - 1 && t > 0.93);
      /* the truck */
      var x = -6.2 + t * 9.6, y = -0.9, wz = 0.55, r = 0.55;
      box(P, out, x, y, 0.45, 3.4, 2.2, 2, true);                          // cargo
      box(P, out, x + 3.5, y + 0.15, 0.45, 1.3, 1.9, 1.45);               // cab
      out.push(['mid', pts([P(x + 4.8, y + 0.4, 1.45), P(x + 4.8, y + 1.8, 1.45)])]);   // windscreen
      [x + 0.8, x + 2.8, x + 4.2].forEach(function (wx) {
        var cy = y + 2.2 + (wx > x + 4 ? -0.15 : 0), wheel = [];
        for (var i = 0; i <= 18; i++) { var a = i / 18 * Math.PI * 2; wheel.push(P(wx + Math.cos(a) * r, cy, wz + Math.sin(a) * r)); }
        out.push(['p', pts(wheel) + 'Z']); out.push(['edge', pts(wheel) + 'Z']);
        var sp = -(x + 6.2) / r;                                            // the spoke turns with the road
        out.push(['hi', pts([P(wx, cy, wz), P(wx + Math.cos(sp) * r, cy, wz + Math.sin(sp) * r)])]);
      });
    }, shuttle(6));
  }

  /* ── الأرباح: أعمدة عملات بتعلى، وخط المكسب فوقها ── */
  function profit(el, o) {
    var P = iso(9, 125, 120);
    return engine(el, Object.assign({ label: 'أعمدة عملات بتعلى وخط المكسب فوقها' }, o), function (st, out) {
      var t = st.t, N = 6;
      box(P, out, -7.5, -2.6, -0.9, 15, 5.2, 0.9);
      var tops = [];
      for (var i = 0; i < N; i++) {
        var cx = -6 + i * 2.4, base = 0.7 + i * 0.62;
        var near = Math.exp(-Math.pow(i - t * (N - 1), 2) / 1.1);           // the wave / the pointer
        var h = base + near * 2.2;
        h = Math.round(h / 0.38) * 0.38 + (h % 0.38) * 0.0;                 // whole coins
        cyl(P, out, cx, 0, 0, 0.95, Math.max(0.38, h), 0.38, near > 0.6);
        tops.push(P(cx, 0, Math.max(0.38, h) + 1.1));
      }
      out.push(['hi', pts(tops)]);
      var a = tops[N - 1], b = tops[N - 2], ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
      out.push(['hi', pts([[a[0] - 7 * Math.cos(ang - 0.5), a[1] - 7 * Math.sin(ang - 0.5)], a, [a[0] - 7 * Math.cos(ang + 0.5), a[1] - 7 * Math.sin(ang + 0.5)]])]);
      tops.forEach(function (p) { out.push(['hi', 'M' + f2(p[0] - 1.6) + ' ' + f2(p[1]) + 'a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0']); });
    }, function (c) { var T = 5.5, u = (c % T) / T; return u < 0.75 ? ease(u / 0.75) : 1 - ease((u - 0.75) / 0.25); });
  }

  /* ═════════ 2 · small moving icons for the side menu ═════════ */
  var O = [12, 13.2];
  function Q(x, y, z) { return [O[0] + (x - y) * K, O[1] + (x + y) * 0.5 - z]; }
  function sp(a) { return a.map(function (p, i) { return (i ? 'L' : 'M') + f2(p[0]) + ' ' + f2(p[1]); }).join(''); }
  function mbox(x, y, z, w, d, h, inner) {
    var t0 = Q(x, y, z + h), t1 = Q(x + w, y, z + h), t2 = Q(x + w, y + d, z + h), t3 = Q(x, y + d, z + h), b1 = Q(x + w, y, z), b2 = Q(x + w, y + d, z), b3 = Q(x, y + d, z);
    return '<path class="mf" d="' + sp([t0, t1, b1, b2, b3, t3]) + 'Z"/><path d="' + sp([t0, t1, t2, t3]) + 'Z' + sp([t1, b1, b2, b3, t3]) + sp([t2, b2]) + '"/>' + (inner || '');
  }
  function mpath(list) { return '<path d="' + sp(list.map(function (p) { return Q(p[0], p[1], p[2]); })) + '"/>'; }
  /* draw flat 2-D content on one of the three iso planes */
  function plane(kind, x, y, z, inner) {
    var c = Q(x, y, z), m = kind === 'xy' ? [K, 0.5, -K, 0.5] : kind === 'xz' ? [K, 0.5, 0, -1] : [-K, 0.5, 0, -1];
    return '<g transform="matrix(' + m.join(' ') + ' ' + f2(c[0]) + ' ' + f2(c[1]) + ')">' + inner + '</g>';
  }
  function bob(a, d, b) { return '<animateTransform attributeName="transform" type="translate" values="0 0;0 ' + (-a) + ';0 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".4 0 .2 1;.4 0 .2 1" dur="' + d + 's" begin="' + (b || 0) + 's" repeatCount="indefinite"/>'; }
  function slide(dx, dy, d, b) { return '<animateTransform attributeName="transform" type="translate" values="' + (-dx) + ' ' + (-dy) + ';' + dx + ' ' + dy + ';' + (-dx) + ' ' + (-dy) + '" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .2 1;.45 0 .2 1" dur="' + d + 's" begin="' + (b || 0) + 's" repeatCount="indefinite"/>'; }
  function spin(d, rev) { return '<animateTransform attributeName="transform" type="rotate" from="0" to="' + (rev ? -360 : 360) + '" dur="' + d + 's" repeatCount="indefinite"/>'; }
  function blink(d, b) { return '<animate attributeName="opacity" values="1;.2;1" dur="' + d + 's" begin="' + (b || 0) + 's" repeatCount="indefinite"/>'; }
  function draw(len, d) { return '<animate attributeName="stroke-dashoffset" values="' + len + ';0;0;' + len + '" keyTimes="0;.45;.85;1" dur="' + d + 's" repeatCount="indefinite"/>'; }
  function g(inner, anim, cls) { return '<g' + (cls ? ' class="' + cls + '"' : '') + '>' + inner + (anim || '') + '</g>'; }

  var ICONS = {
    dashboard: function () { return g(mbox(-7, -7, 0, 6, 6, 1.4), bob(2, 2.4, 0)) + g(mbox(0.8, -7, 0, 6, 6, 1.4), bob(2, 2.4, -0.6)) + g(mbox(-7, 0.8, 0, 6, 6, 1.4), bob(2, 2.4, -1.2)) + g(mbox(0.8, 0.8, 0, 6, 6, 1.4), bob(2, 2.4, -1.8)); },
    issuances: function () { return mbox(-9, -2.5, 0, 17, 5, 0.9) + g(mbox(-3, -2, 0.9, 5, 4, 0.9) + mpath([[-2.2, -1, 1.8], [1.2, -1, 1.8]]), slide(3.6, 2.1, 2.6)); },
    forecast: function () { return mbox(-5, -5, 0, 10, 10, 6) + mpath([[-3, 5, 4.2], [3, 5, 4.2]]) + plane('xy', 0, 0, 6, '<circle r="3.4" fill="none"/>' + g('<path d="M0 0V-2.8"/>', spin(4))); },
    customers: function () { return mpath([[0, 0, 0], [-9, 0, 0]]) + mpath([[0, 0, 0], [0, -9, 0]]) + mpath([[0, 0, 0], [7, 7, 0]]) + g(mbox(-2, -11, 0, 4, 4, 1.4), bob(1.8, 2.2, 0)) + g(mbox(-11, -2, 0, 4, 4, 1.4), bob(1.8, 2.2, -0.7)) + mbox(-2.5, -2.5, 0, 5, 5, 4.5) + g(mbox(5, 5, 0, 4, 4, 1.4), bob(1.8, 2.2, -1.4)); },
    invoices: function () { return mbox(-6, -4, 0, 12, 8, 0.7) + mbox(-6, -4, 1.4, 12, 8, 0.7) + g(mbox(-6, -4, 2.8, 12, 8, 0.7) + mpath([[-4.5, -2, 3.5], [3, -2, 3.5]]) + mpath([[-4.5, 0.5, 3.5], [1, 0.5, 3.5]]), bob(3, 2.4)); },
    payments: function () { return mbox(-5, -5, 0, 10, 10, 8) + plane('yz', 5, 0, 4, '<circle r="3" fill="none"/>' + g('<path d="M0 0V-2.4M0 0L2 1.3M0 0L-2 1.3"/>', spin(3.2))); },
    aging: function () { return mbox(-6, -6, 0, 12, 12, 1.2) + g(mbox(-6, -6, 2.6, 12, 12, 1.2), bob(1.6, 2.4)) + mbox(-6, -6, 5.2, 12, 12, 1.2); },
    transfers: function () { var arc = Q(-6, -1, 4.5), arc2 = Q(6, -1, 4.5); return mbox(-9, -3, 0, 5, 5, 3.6) + mbox(4, -3, 0, 5, 5, 3.6) + '<path d="M' + f2(arc[0]) + ' ' + f2(arc[1]) + 'Q12 1 ' + f2(arc2[0]) + ' ' + f2(arc2[1]) + '" stroke-dasharray="1.4 1.6"/>' + '<circle r="1.4" class="mfs"><animateMotion dur="2.2s" repeatCount="indefinite" path="M' + f2(arc[0]) + ' ' + f2(arc[1]) + 'Q12 1 ' + f2(arc2[0]) + ' ' + f2(arc2[1]) + '"/></circle>'; },
    cheques: function () { return mbox(-8, -4.5, 0, 16, 9, 0.7) + g(mbox(-8, -4.5, 1.6, 16, 9, 0.7) + plane('xy', 0, 0, 2.3, '<path d="M-6 -2.5H2M-6 0H0" opacity=".6"/><path d="M-1 2.6c1-2 2 2 3-.2s2 2 3.4-.2" stroke-dasharray="12" stroke-dashoffset="12">' + draw(12, 2.8) + '</path>'), bob(1.6, 2.8)); },
    debts: function () { return plane('xy', 0, 0, 0, '<circle r="9" fill="none" opacity=".45"/><circle r="6" fill="none"/><circle r="2.6" class="mfs"/><circle r="3" fill="none"><animate attributeName="r" values="3;9.5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite"/></circle>'); },
    suppliers: function () { var w = function (x) { return plane('xz', x, 2.2, 1.3, '<circle r="1.3" class="mf"/><circle r="1.3" fill="none"/>' + g('<path d="M0 0V-1.2"/>', spin(0.9))); }; return mpath([[-10, 3.2, 0], [10, 3.2, 0]]) + g(mbox(-7, -2, 1, 7.4, 4.2, 4.6) + mbox(0.6, -1.7, 1, 3, 3.9, 3.2) + w(-5) + w(-1.6) + w(2.2), slide(1.8, 1, 2.6)); },
    purchases: function () { var a = Q(-6, -5, 5), b = Q(6, -5, 5), c = Q(6, 5, 5), d = Q(-6, 5, 5), e = Q(5, -4, 0), f = Q(5, 4, 0), h = Q(-5, 4, 0);
      return '<path d="' + sp([a, b, c, d]) + 'Z"/>' + g(mbox(-1.8, -1.8, 4.5, 3.6, 3.6, 3.6), '<animateTransform attributeName="transform" type="translate" values="0 -5;0 0;0 0;0 -5" keyTimes="0;.4;.8;1" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.3;.8;1" dur="2.6s" repeatCount="indefinite"/>') +
        '<path class="mf" d="' + sp([b, e, f, h, d, c]) + 'Z"/><path d="' + sp([b, e, f, h, d]) + sp([c, f]) + sp([b, c, d]) + '"/>'; },
    inventory: function () { return mbox(-5, -4, 0, 8, 8, 11) + plane('yz', 3, 0, 2.6, '<rect x="-3" y="-1.4" width="6" height="2.8" fill="none" rx=".4"/>') + g(mbox(1.4, -3, 5.4, 2, 6, 3), slide(1.3, 0.75, 2.6)); },
    stock: function () { return mbox(-7, -3, 0, 6, 6, 4) + mbox(0, -3, 0, 6, 6, 4) + g(mbox(-3.5, -3, 4, 6, 6, 4) + mpath([[-1.5, 3, 6.2], [0, 3, 5.2], [2.2, 3, 7.4]]), bob(2, 2.4)); },
    expenses: function () { var coin = function (z) { return plane('xy', 0, 0, z, '<circle r="3" class="mf"/><circle r="3" fill="none"/>'); }; return mbox(-7, -4.5, 0, 14, 9, 1.4) + mpath([[-7, 1.5, 1.4], [7, 1.5, 1.4]]) + g(coin(3) + coin(3.8) + plane('xy', 0, 0, 3.8, '<path d="M-1.2 0H1.2"/>'), bob(3, 2.2)); },
    reports: function () {
      function bar(x, h1, h2, b) { var a = mbox(x, -1.5, 0, 3, 3, h1).match(/d="([^"]+)"/g), c = mbox(x, -1.5, 0, 3, 3, h2).match(/d="([^"]+)"/g); var s1 = a.map(function (q) { return q.slice(3, -1); }), s2 = c.map(function (q) { return q.slice(3, -1); });
        return '<path class="mf" d="' + s1[0] + '"><animate attributeName="d" values="' + s1[0] + ';' + s2[0] + ';' + s1[0] + '" dur="2.8s" begin="' + b + 's" repeatCount="indefinite"/></path><path d="' + s1[1] + '"><animate attributeName="d" values="' + s1[1] + ';' + s2[1] + ';' + s1[1] + '" dur="2.8s" begin="' + b + 's" repeatCount="indefinite"/></path>'; }
      return mbox(-9, -3, -1, 18, 6, 1) + bar(-8, 3, 7, 0) + bar(-2.5, 6, 3.5, -0.5) + bar(3, 9, 5, -1); },
    monthly: function () { return mbox(-6, -6, 0, 12, 12, 1) + mbox(-6, -6, 1.8, 12, 12, 1) + mbox(-6, -6, 3.6, 12, 12, 1) + g(mbox(-6, -6, 5.4, 12, 12, 1) + mpath([[-4, -3, 6.4], [2, -3, 6.4]]), bob(2.6, 2.6)); },
    profit: function () { var c = function (x, h, b) { var o = ''; for (var z = 0; z < h; z += 1.4) o += plane('xy', x, 0, z, '<circle r="2" class="mf"/><circle r="2" fill="none"/>'); return g(o, bob(1, 2.4, b)); };
      var a = Q(-8, 3, 4), m1 = Q(-3, 3, 6), m2 = Q(1, 3, 5.5), e = Q(7, 3, 11), ang = Math.atan2(e[1] - m2[1], e[0] - m2[0]);
      var head = 'M' + f2(e[0] - 2.4 * Math.cos(ang - 0.6)) + ' ' + f2(e[1] - 2.4 * Math.sin(ang - 0.6)) + 'L' + f2(e[0]) + ' ' + f2(e[1]) + 'L' + f2(e[0] - 2.4 * Math.cos(ang + 0.6)) + ' ' + f2(e[1] - 2.4 * Math.sin(ang + 0.6));
      return c(-6, 3, 0) + c(-1, 5.6, -0.4) + c(4, 8.4, -0.8) + '<path d="' + sp([a, m1, m2, e]) + head + '" class="mhi" stroke-dasharray="40" stroke-dashoffset="40">' + draw(40, 2.8) + '</path>'; },
    aiassistant: function () { return mbox(-5, -5, 0, 10, 10, 8) + plane('yz', 5, 0, 4.4, '<circle cx="-2.2" r="1" class="mfs">' + blink(3) + '</circle><circle cx="2.2" r="1" class="mfs">' + blink(3) + '</circle><path d="M-2 -2.6H2" opacity=".5"/>') + g(mpath([[0, 0, 8], [0, 0, 11]]) + plane('xz', 0, 0, 12, '<circle r="1.1" class="mfs"/>'), bob(1.2, 1.6)); },
    approvals: function () { return mbox(-5, -4, 0, 9, 8, 11) + plane('yz', 4, 0, 5.5, '<path d="M-2.4 0L-.6 2L2.6 -2" stroke-dasharray="8" stroke-dashoffset="8" class="mhi">' + draw(8, 2.4) + '</path>'); },
    requests: function () { return plane('xy', 0, 0, 0, '<path d="M-9 0H9M-4 0C-2 0 -2 -5 2 -5H7" fill="none"/><circle cx="-6" r="1.3" class="mfs">' + blink(2.4, 0) + '</circle><circle cx="1" r="1.3" class="mfs">' + blink(2.4, -0.8) + '</circle><circle cx="7" cy="-5" r="1.3" class="mfs">' + blink(2.4, -1.6) + '</circle><circle cx="7" r="1.3" fill="none"/>'); },
    users: function () { var k = function (x, y, b) { return g(mbox(x, y, 0, 4.6, 4.6, 2), '<animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 1.4;0 0" keyTimes="0;.6;.75;1" dur="2.8s" begin="' + b + 's" repeatCount="indefinite"/>'); };
      return k(-5.5, -5.5, 0) + k(0.5, -5.5, -0.7) + k(-5.5, 0.5, -1.4) + k(0.5, 0.5, -2.1); },
    audit: function () { return mbox(-7, -1, 0, 13, 2, 9) + plane('xz', -0.5, 1, 4.5, '<path d="M-5 -2.4L-3.6 -1.2L-5 0M-2.4 0H1M-5 2H3" opacity=".75"/><rect x="2" y="-0.9" width="1.6" height="1.8" class="mfs">' + blink(1.1) + '</rect>'); },
    security: function () { return mbox(-5, -2.5, 0, 9, 5, 6.5) + g(plane('xz', -0.5, 0, 6.5, '<path d="M-2.8 0V2.2A2.8 2.8 0 0 0 2.8 2.2V0" fill="none"/>'), bob(1.6, 2.6)) + plane('xz', -0.5, 2.5, 3.2, '<circle r="1" class="mfs"/><path d="M0 0V-1.8"/>'); },
    settings: function () { var teeth = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; teeth += 'M' + f2(Math.cos(a) * 5.2) + ' ' + f2(Math.sin(a) * 5.2) + 'L' + f2(Math.cos(a) * 7) + ' ' + f2(Math.sin(a) * 7); }
      return mbox(-8, -8, -1, 16, 16, 1) + plane('xy', 0, 0, 0.2, g('<circle r="5.2" class="mf"/><circle r="5.2" fill="none"/><circle r="2" fill="none"/><path d="' + teeth + '" stroke-width="2.2"/>', spin(6))); }
  };
  var cache = {}, fitter = null;
  /* each drawing is measured once and framed in a square, so tall and wide ones fit the same slot */
  function fit(body) {
    try {
      if (!fitter) { fitter = document.createElementNS(NS, 'svg'); fitter.setAttribute('width', '24'); fitter.setAttribute('height', '24'); fitter.setAttribute('style', 'position:fixed;left:0;top:0;opacity:0;pointer-events:none'); }
      fitter.innerHTML = '<g fill="none" stroke="#000">' + body + '</g>';
      document.body.appendChild(fitter);
      var bb = fitter.firstChild.getBBox(), pad = 2.4, sz = Math.max(bb.width, bb.height) + pad * 2;
      fitter.innerHTML = ''; fitter.remove();
      if (!bb.width) return '0 0 24 24';
      return [f2(bb.x + bb.width / 2 - sz / 2), f2(bb.y + bb.height / 2 - sz / 2 - 0.6), f2(sz), f2(sz)].join(' ');
    } catch (e) { return '0 0 24 24'; }
  }
  function icon(key) {
    if (!ICONS[key]) return '';
    if (!cache[key]) { var body = ICONS[key](); cache[key] = '<svg class="axmi" viewBox="' + fit(body) + '" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + body + '</svg>'; }
    return cache[key];
  }

  /* swap the side menu's icons whenever it is drawn; pause them while the menu is out of sight */
  var vis = true;
  function decorate(nav) {
    nav.querySelectorAll('.nav-item').forEach(function (it) {
      var m = /navigate\('([\w-]+)'\)/.exec(it.getAttribute('onclick') || ''); if (!m) return;
      var ic = it.querySelector('.icon'); if (!ic || ic.getAttribute('data-axmi') === m[1]) return;
      var s = icon(m[1]); if (!s) return;
      ic.innerHTML = s; ic.setAttribute('data-axmi', m[1]); ic.classList.add('axmi-box');
    });
    pause(nav);
  }
  function pause(nav) {
    var stop = reduced() || !vis;
    nav.querySelectorAll('svg.axmi').forEach(function (s) { try { stop ? s.pauseAnimations() : s.unpauseAnimations(); } catch (e) {} });
  }
  function wire() {
    var nav = document.getElementById('sidebar-nav'); if (!nav) { setTimeout(wire, 400); return; }
    decorate(nav);
    new MutationObserver(function () { decorate(nav); }).observe(nav, { childList: true });
    try { new IntersectionObserver(function (en) { vis = en[0].isIntersecting; pause(nav); }).observe(nav); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  window.AXFigs = { cheques: cheques, suppliers: suppliers, profit: profit, icon: icon, keys: Object.keys(ICONS) };
})();
