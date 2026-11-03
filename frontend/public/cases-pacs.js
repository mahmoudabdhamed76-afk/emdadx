/* ════════════════════════════════════════════════════════════════════
   5.00 · QR Patient — حالة DICOM
   صفحة المركز: ملفات DICOM ← بتتقري هنا ← البكسلات بتتضغط (فرق الجيران + gzip
   من المتصفح نفسه، من غير ما نبوّظ ولا قيمة) ← حزمة واحدة بتتشفّر وتترفع زي الـ PDF.
   صفحة المريض: «باكس صغير» على الموبايل — تباين/سطوع بالصباع، زوم بصباعين، تحريك،
   تقليب الشرايح، قوالب CT، عكس، تشغيل الشرايح، صورة للدكتور.
════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var MAGIC = 'OZXD1\n';

  /* ── read one DICOM file: tags + the raw pixels (every frame) ── */
  function parse(bytes) {
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var VALID = { AE: 1, AS: 1, AT: 1, CS: 1, DA: 1, DS: 1, DT: 1, FL: 1, FD: 1, IS: 1, LO: 1, LT: 1, OB: 1, OD: 1, OF: 1, OL: 1, OW: 1, PN: 1, SH: 1, SL: 1, SQ: 1, SS: 1, ST: 1, TM: 1, UC: 1, UI: 1, UL: 1, UN: 1, UR: 1, US: 1, UT: 1 };
    var LONG = { OB: 1, OW: 1, OF: 1, SQ: 1, UC: 1, UN: 1, UR: 1, UT: 1, OD: 1, OL: 1 };
    var pxi = -1, i;
    for (i = 132; i < bytes.length - 4; i++) if (bytes[i] === 0xE0 && bytes[i + 1] === 0x7F && bytes[i + 2] === 0x10 && bytes[i + 3] === 0x00) { pxi = i; break; }
    if (pxi < 0) return null;
    /* 5.02 · explicit VR (most devices) AND implicit VR little endian (1.2.840.10008.1.2 — RadiAnt exports, many PACS) */
    var tags = {}, pos = 0, implicit = false;
    var hasMagic = bytes.length > 132 && bytes[128] === 68 && bytes[129] === 73 && bytes[130] === 67 && bytes[131] === 77;
    if (hasMagic) {
      pos = 132;
      while (pos < pxi && dv.getUint16(pos, true) === 0x0002) {
        var mg = dv.getUint16(pos, true), me = dv.getUint16(pos + 2, true), mvr = String.fromCharCode(bytes[pos + 4], bytes[pos + 5]), ml, mv;
        if (LONG[mvr]) { ml = dv.getUint32(pos + 8, true); mv = pos + 12; } else { ml = dv.getUint16(pos + 6, true); mv = pos + 8; }
        tags[(mg << 16) | me] = [mv, ml]; pos = mv + ml;
      }
      var tsT = tags[0x00020010], ts = tsT ? new TextDecoder('latin1').decode(bytes.subarray(tsT[0], tsT[0] + tsT[1])).replace(/[\0\s]/g, '') : '';
      implicit = ts === '1.2.840.10008.1.2';
    } else {   /* no preamble: guess — an explicit file has two letters after the first tag */
      var v0 = String.fromCharCode(bytes[4], bytes[5]); implicit = !VALID[v0];
    }
    while (pos < pxi) {
      try {
        var g = dv.getUint16(pos, true), e = dv.getUint16(pos + 2, true), len, vs;
        if (implicit) {
          len = dv.getUint32(pos + 4, true); vs = pos + 8;
          if (len === 0xFFFFFFFF || g === 0xFFFE) { pos = vs; continue; }   /* sequences / items: walk inside */
        } else {
          var vr = String.fromCharCode(bytes[pos + 4], bytes[pos + 5]);
          if (g === 0xFFFE) { pos += 8; continue; }
          if (!VALID[vr]) { pos++; continue; }
          if (LONG[vr]) { len = dv.getUint32(pos + 8, true); vs = pos + 12; } else { len = dv.getUint16(pos + 6, true); vs = pos + 8; }
          if (len === 0xFFFFFFFF) { pos = vs; continue; }
        }
        if (vs + len > bytes.length) break;
        var key = (g << 16) | e; if (!tags[key]) tags[key] = [vs, len];
        pos = vs + len; if (len % 2 && !implicit) pos++;
      } catch (er) { pos++; }
    }
    function gus(g, e) { var t = tags[(g << 16) | e]; return (t && t[1] >= 2) ? dv.getUint16(t[0], true) : 0; }
    function raw(g, e) { var t = tags[(g << 16) | e]; return t ? bytes.subarray(t[0], t[0] + t[1]) : null; }
    var cs = (function () { var b = raw(0x0008, 0x0005); return b ? new TextDecoder('latin1').decode(b).toUpperCase() : ''; })();
    var enc = /ISO_IR 192/.test(cs) ? 'utf-8' : /ISO_IR 127/.test(cs) ? 'iso-8859-6' : 'latin1';
    function gst(g, e) { var b = raw(g, e); if (!b) return ''; var s; try { s = new TextDecoder(enc).decode(b); } catch (er) { s = new TextDecoder('latin1').decode(b); } return s.replace(/\0/g, '').trim(); }
    function gfl(g, e) { var v = parseFloat(gst(g, e)); return isNaN(v) ? null : v; }
    var rows = gus(0x0028, 0x0010), cols = gus(0x0028, 0x0011); if (!rows || !cols) return null;
    var bits = gus(0x0028, 0x0100) || 16, spp = gus(0x0028, 0x0002) || 1, signed = gus(0x0028, 0x0103) === 1, planar = gus(0x0028, 0x0006) === 1;
    var nf = parseInt(gst(0x0028, 0x0008), 10) || 1, sp = gst(0x0028, 0x0030).split('\\').map(parseFloat), ipp = gst(0x0020, 0x0032).split('\\').map(parseFloat);
    var pxVR = String.fromCharCode(bytes[pxi + 4], bytes[pxi + 5]), pxStart, pxLen;
    if (LONG[pxVR]) { pxLen = dv.getUint32(pxi + 8, true); pxStart = pxi + 12; } else { pxLen = dv.getUint32(pxi + 4, true); pxStart = pxi + 8; }
    if (pxLen === 0xFFFFFFFF) throw new Error('الصور مضغوطة (JPEG) — صدّرها من الجهاز من غير ضغط');
    var per = rows * cols * spp * (bits === 16 ? 2 : 1), frames = [];
    for (var f = 0; f < nf; f++) {
      var st = pxStart + f * per; if (st + per > bytes.length) break;
      if (bits === 16) { var ab = bytes.buffer.slice(bytes.byteOffset + st, bytes.byteOffset + st + per); frames.push(new Uint16Array(ab)); }
      else if (spp === 3 && planar) { var o = new Uint8Array(rows * cols * 3), n = rows * cols; for (var p = 0; p < n; p++) { o[p * 3] = bytes[st + p]; o[p * 3 + 1] = bytes[st + n + p]; o[p * 3 + 2] = bytes[st + 2 * n + p]; } frames.push(o); }
      else frames.push(bytes.slice(st, st + per));
    }
    if (!frames.length) return null;
    var wc = gfl(0x0028, 0x1050), ww = gfl(0x0028, 0x1051);
    return {
      rows: rows, cols: cols, b: bits === 16 ? 16 : 8, rgb: spp === 3, signed: signed, slope: gfl(0x0028, 0x1053) || 1, inter: gfl(0x0028, 0x1052) || 0,
      wc: wc, ww: ww, mono1: gst(0x0028, 0x0004) === 'MONOCHROME1', spacing: sp.length === 2 && sp[0] > 0 ? sp : null, frames: frames,
      modality: gst(0x0008, 0x0060), patient: gst(0x0010, 0x0010).replace(/\^+/g, ' ').replace(/\s+/g, ' ').trim(), patID: gst(0x0010, 0x0020), sex: gst(0x0010, 0x0040), age: gst(0x0010, 0x1010),
      study: gst(0x0008, 0x1030), series: gst(0x0008, 0x103E), date: gst(0x0008, 0x0020), studyUID: gst(0x0020, 0x000D), serUID: gst(0x0020, 0x000E),
      serNum: parseInt(gst(0x0020, 0x0011), 10) || 0, inst: parseInt(gst(0x0020, 0x0013), 10) || 0, z: ipp.length === 3 && !isNaN(ipp[2]) ? ipp[2] : null, inst2: gst(0x0008, 0x0080)
    };
  }

  /* ── squeeze: big images → max 1536 px, then delta per row + gzip (lossless on what's kept) ── */
  function shrink(fr, rows, cols, b, rgb, maxSide) {
    var k = Math.ceil(Math.max(rows, cols) / maxSide); if (k <= 1) return { fr: fr, rows: rows, cols: cols };
    var R = Math.floor(rows / k), Cc = Math.floor(cols / k), ch = rgb ? 3 : 1, out = b === 16 ? new Uint16Array(R * Cc) : new Uint8Array(R * Cc * ch);
    for (var y = 0; y < R; y++) for (var x = 0; x < Cc; x++) for (var c = 0; c < ch; c++) {
      var s = 0; for (var yy = 0; yy < k; yy++) for (var xx = 0; xx < k; xx++) s += fr[((y * k + yy) * cols + (x * k + xx)) * ch + c];
      out[(y * Cc + x) * ch + c] = Math.round(s / (k * k));
    }
    return { fr: out, rows: R, cols: Cc };
  }
  function delta(a) { var o = new a.constructor(a.length), m = a instanceof Uint16Array ? 0xFFFF : 0xFF; o[0] = a[0]; for (var i = 1; i < a.length; i++) o[i] = (a[i] - a[i - 1]) & m; return o; }
  function undelta(a) { var m = a instanceof Uint16Array ? 0xFFFF : 0xFF; for (var i = 1; i < a.length; i++) a[i] = (a[i] + a[i - 1]) & m; return a; }
  function gz(u8) { return new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function ungz(u8) { return new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); }
  function examOf(s) {
    var m = String(s.modality || '').toUpperCase(), t = (s.study || '') + ' ' + (s.series || '');
    return ({ CT: 'أشعة مقطعية', MR: 'رنين مغناطيسي', US: 'سونار', MG: 'ماموجرام', CR: 'أشعة عادية', DX: 'أشعة عادية', XA: 'أشعة قسطرة', NM: 'مسح ذري', PT: 'PET', OT: 'أشعة', PX: 'أشعة بانوراما', IO: 'أشعة أسنان' })[m] || (t.trim() ? t.trim().slice(0, 60) : 'أشعة');
  }
  function fmtDate(d) { return d && d.length >= 8 ? (+d.slice(6, 8)) + '/' + (+d.slice(4, 6)) + '/' + d.slice(0, 4) : ''; }

  /* files → [{ blob, patient, exam, date, count, series, thumb }] — one per study (one patient's exam) */
  function pack(files, o) {
    o = o || {}; var step = o.step || function () {}, maxBytes = (o.maxMb || 80) * 1048576;
    var parsed = [], bad = 0, i = 0;
    return (function nx() {
      if (i >= files.length) return Promise.resolve();
      var f = files[i++]; step('read', i, files.length);
      return f.arrayBuffer().then(function (b) { var r = null; try { r = parse(new Uint8Array(b)); } catch (e) { if (/JPEG/.test(e.message)) throw e; } if (r) parsed.push(r); else bad++; }).then(nx);
    })().then(function () {
      if (!parsed.length) throw new Error('مفيش ملفات DICOM مقروءة' + (bad ? ' (' + bad + ' ملف اتساب)' : ''));
      var studies = {}; parsed.forEach(function (p) { var k = p.studyUID || p.patID || p.patient || 'x'; (studies[k] = studies[k] || []).push(p); });
      return Object.keys(studies).reduce(function (pr, k) { return pr.then(function (acc) { return build(studies[k], 1536).then(function (r) { if (r.blob.size > maxBytes) return build(studies[k], 768); return r; }).then(function (r) { if (r.blob.size > maxBytes) throw new Error('الحالة كبيرة أوي حتى بعد الضغط — اختار سيريز أقل'); acc.push(r); return acc; }); }); }, Promise.resolve([]));
    });
    function build(L, maxSide) {
      var ser = {}; L.forEach(function (p) { var k = p.serUID || (p.serNum + '|' + p.series); (ser[k] = ser[k] || []).push(p); });
      var S = Object.keys(ser).map(function (k) { return ser[k].sort(function (a, b) { return (a.z != null && b.z != null && a.z !== b.z) ? b.z - a.z : a.inst - b.inst; }); }).sort(function (a, b) { return b.reduce(function (n, p) { return n + p.frames.length; }, 0) - a.reduce(function (n, p) { return n + p.frames.length; }, 0) || a[0].serNum - b[0].serNum; });
      var head = { v: 1, patient: L[0].patient, patID: L[0].patID, sex: L[0].sex, age: L[0].age, date: L[0].date, modality: L[0].modality, study: L[0].study, inst: L[0].inst2, series: [] }, parts = [], total = 0, done = 0;
      S.forEach(function (s) { s.forEach(function (p) { total += p.frames.length; }); });
      return S.reduce(function (pr, s) {
        return pr.then(function () {
          var p0 = s[0], sh = shrink(p0.frames[0], p0.rows, p0.cols, p0.b, p0.rgb, maxSide), k = p0.rows / sh.rows;
          var se = { desc: p0.series || p0.study || p0.modality || '', rows: sh.rows, cols: sh.cols, b: p0.b, rgb: p0.rgb, signed: p0.signed, slope: p0.slope, inter: p0.inter, wc: p0.wc, ww: p0.ww, mono1: p0.mono1, sp: p0.spacing ? [p0.spacing[0] * k, p0.spacing[1] * k] : null, modality: p0.modality, f: [] };
          head.series.push(se);
          var fl = []; s.forEach(function (p) { if (p.rows === p0.rows && p.cols === p0.cols) p.frames.forEach(function (fr) { fl.push(fr); }); });
          return fl.reduce(function (q, fr) { return q.then(function () { var r = shrink(fr, p0.rows, p0.cols, p0.b, p0.rgb, maxSide); return gz(new Uint8Array(delta(r.fr).buffer)).then(function (z) { parts.push(z); se.f.push(z.length); step('pack', ++done, total); }); }); }, Promise.resolve());
        });
      }, Promise.resolve()).then(function () {
        var hb = new TextEncoder().encode(JSON.stringify(head)), blob = new Blob([MAGIC, String(hb.length).padStart(10, '0') + '\n', hb].concat(parts), { type: 'application/octet-stream' });
        var s0 = head.series[0], mid = Math.floor(s0.f.length / 2);
        return thumbOf(blob, head, mid).then(function (th) { return { blob: blob, patient: head.patient, exam: examOf(L[0]), date: fmtDate(head.date), count: head.series.reduce(function (n, s) { return n + s.f.length; }, 0), series: head.series.length, thumb: th }; });
      });
    }
  }

  /* ── open a bundle ── */
  function openBundle(buf) {
    var u = new Uint8Array(buf), t = new TextDecoder().decode(u.subarray(0, 17));
    if (t.slice(0, 6) !== MAGIC) throw new Error('الملف ده مش حالة DICOM');
    var n = Number(t.slice(6, 16)), head = JSON.parse(new TextDecoder().decode(u.subarray(17, 17 + n))), off = 17 + n;
    head.series.forEach(function (s) { s.o = []; s.f.forEach(function (len) { s.o.push(off); off += len; }); s.cache = {}; s.busy = {}; });
    /* 5.20 · decoded frames live in a size-capped LRU (phones run out of memory on long CT series) */
    var lru = [], bytes = 0, CAP = Math.min(260, Math.max(90, ((navigator.deviceMemory || 4) * 40))) * 1048576;
    function keep(si, fi, a) {
      head.series[si].cache[fi] = a; bytes += a.byteLength; lru.push([si, fi]);
      var guard = lru.length;
      while (bytes > CAP && guard-- > 0) {
        var o = lru.shift(), so = head.series[o[0]], x = so.cache[o[1]]; if (!x) continue;
        if (o[0] === head.pin[0] && Math.abs(o[1] - head.pin[1]) < 3) { lru.push(o); continue; }
        bytes -= x.byteLength; delete so.cache[o[1]];
      }
    }
    head.pin = [0, 0];
    head.frame = function (si, fi) {
      var s = head.series[si]; if (s.cache[fi]) return Promise.resolve(s.cache[fi]); if (s.busy[fi]) return s.busy[fi];
      return (s.busy[fi] = ungz(u.subarray(s.o[fi], s.o[fi] + s.f[fi])).then(function (ab) { var a = undelta(s.b === 16 ? new Uint16Array(ab) : new Uint8Array(ab)); if (s.b === 16 && s.signed) a = new Int16Array(a.buffer); delete s.busy[fi]; keep(si, fi, a); return a; }, function (e) { delete s.busy[fi]; throw e; }));
    };
    head.has = function (si, fi) { return !!head.series[si].cache[fi]; };
    return head;
  }
  function autoWL(s, a) {
    if (s.wc != null && s.ww != null && s.ww > 1) return [s.wc, s.ww];
    var h = [], st = Math.max(1, Math.floor(a.length / 40000)); for (var i = 0; i < a.length; i += st) h.push(a[i] * s.slope + s.inter);
    h.sort(function (x, y) { return x - y; }); var lo = h[Math.floor(h.length * 0.01)], hi = h[Math.floor(h.length * 0.995)]; return [(lo + hi) / 2, Math.max(1, hi - lo)];
  }
  function paint(s, a, wc, ww, inv, id) {
    var px = id.data, n = s.rows * s.cols, lo = wc - ww / 2, sc = 255 / ww, m1 = s.mono1 !== !!inv;
    if (s.rgb) { for (var i = 0; i < n; i++) { var r = a[i * 3], g = a[i * 3 + 1], b = a[i * 3 + 2]; if (inv) { r = 255 - r; g = 255 - g; b = 255 - b; } px[i * 4] = r; px[i * 4 + 1] = g; px[i * 4 + 2] = b; px[i * 4 + 3] = 255; } return; }
    var sl = s.slope, it = s.inter;
    for (var j = 0; j < n; j++) { var v = ((a[j] * sl + it) - lo) * sc; v = v < 0 ? 0 : v > 255 ? 255 : v; if (m1) v = 255 - v; px[j * 4] = px[j * 4 + 1] = px[j * 4 + 2] = v; px[j * 4 + 3] = 255; }
  }
  function thumbOf(blob, head0, mid) {
    return blob.arrayBuffer().then(function (b) {
      var h = openBundle(b), s = h.series[0];
      return h.frame(0, mid).then(function (a) {
        var wl = autoWL(s, a), cv = document.createElement('canvas'); cv.width = s.cols; cv.height = s.rows; var x = cv.getContext('2d'), id = x.createImageData(s.cols, s.rows); paint(s, a, wl[0], wl[1], false, id); x.putImageData(id, 0, 0);
        var t = document.createElement('canvas'), k = 220 / Math.max(s.cols, s.rows); t.width = Math.round(s.cols * k); t.height = Math.round(s.rows * k); t.getContext('2d').drawImage(cv, 0, 0, t.width, t.height); return t.toDataURL('image/jpeg', 0.7);
      });
    }).catch(function () { return ''; });
  }

  /* ════════════════════════════════════════════════════════════════════
     5.20 · the PACS viewer (patient's phone + the center's computer)
     tools: window/level · pan · zoom · stack scroll · ruler (mm) · ellipse ROI (mean/SD/area, HU on CT)
     view: rotate · flip · invert · presets · cine with fps · series rail with thumbnails · info panel
     fast path: a LUT per window/level + 32-bit writes; rendering is batched to one paint per frame.
  ════════════════════════════════════════════════════════════════════ */
  var SV = {
    wl: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/>',
    pan: '<path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M11 8v6M8 11h6"/>',
    stack: '<rect x="4" y="3" width="13" height="13" rx="2"/><path d="M8 20h11a2 2 0 0 0 2-2V7"/>',
    ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    roi: '<ellipse cx="12" cy="12" rx="9" ry="6.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    inv: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
    rot: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    flip: '<path d="M12 3v18M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    clear: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    fs: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    snap: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>', pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  function svg(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (SV[n] || '') + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var PRESETS = {
    CT: [['تلقائي', null], ['مخ', [40, 80]], ['نزيف', [75, 215]], ['بطن', [40, 400]], ['كبد', [60, 160]], ['منصف', [50, 350]], ['رئة', [-600, 1500]], ['عظم', [400, 1800]]],
    X: [['تلقائي', null], ['تباين عالي', 'hi'], ['ناعم', 'lo']]
  };
  function viewer(el, buf, o) {
    o = o || {};
    var H = openBundle(buf), si = 0, fi = 0, S = H.series[0], A = null, wc = 0, ww = 1, inv = false, z = 1, panX = 0, panY = 0, rot = 0, flip = false;
    var tool = 'wl', fps = 10, play = 0, lastT = 0, dirty = false, lutKey = '', lut = null, M = null, meas = {}, drag = null;
    var MOD = String(H.modality || S.modality || '').toUpperCase(), isCT = MOD === 'CT', PRE = isCT ? PRESETS.CT : PRESETS.X, preI = 0;
    var tools = [['wl', 'تباين'], ['pan', 'تحريك'], ['zoom', 'زوم'], ['stack', 'شرايح'], ['ruler', 'مسطرة'], ['roi', 'منطقة']];
    var acts = [['inv', 'عكس'], ['rot', 'لف'], ['flip', 'قلب'], ['reset', 'رجّع'], ['clear', 'امسح القياس']];
    el.innerHTML = '<div class="pz" tabindex="0" aria-label="عارض صور الأشعة">' +
      '<header class="pz-top"><div class="pz-id"><b>' + esc(H.patient || o.name || '') + '</b><span>' + [MOD, fmtDate(H.date), H.study].filter(Boolean).map(esc).join(' · ') + '</span></div>' +
        '<div class="pz-tb"><button type="button" data-a="info" aria-label="بيانات الدراسة" title="بيانات الدراسة">' + svg('info') + '</button><button type="button" data-a="snap" aria-label="احفظ صورة" title="احفظ صورة">' + svg('snap') + '</button><button type="button" data-a="fs" aria-label="ملء الشاشة" title="ملء الشاشة">' + svg('fs') + '</button>' + (o.onClose ? '<button type="button" data-a="close" aria-label="قفل" title="قفل">' + svg('x') + '</button>' : '') + '</div></header>' +
      '<div class="pz-body">' + (H.series.length > 1 ? '<div class="pz-rail" role="tablist" aria-label="السيريز">' + H.series.map(function (s, i) { return '<button type="button" role="tab" data-s="' + i + '" aria-selected="' + (i ? 'false' : 'true') + '" class="' + (i ? '' : 'on') + '"><canvas width="72" height="72"></canvas><span>' + esc(s.desc || ('سيريز ' + (i + 1))) + '</span><em>' + s.f.length + '</em></button>'; }).join('') + '</div>' : '') +
        '<div class="pz-vp" id="pzV"><canvas id="pzC"></canvas>' +
          '<div class="pz-o tl" id="pzTL"></div><div class="pz-o tr" id="pzTR"></div><div class="pz-o bl" id="pzBL"></div><div class="pz-o br" id="pzBR"></div>' +
          '<div class="pz-sb" id="pzSB" role="slider" tabindex="0" aria-label="الشريحة" aria-valuemin="1"><i id="pzST"></i></div>' +
          '<div class="pz-ld" id="pzLD"><span></span></div><div class="pz-hint" id="pzH">' + (window.matchMedia && matchMedia('(pointer:coarse)').matches ? 'صباع واحد للأداة · صباعين للزوم والتحريك · دبل تاب يرجّعها' : 'اسحب بالماوس للأداة · العجلة للشرايح · Ctrl+العجلة للزوم') + '</div></div></div>' +
      '<div class="pz-cine" id="pzCine"><button type="button" class="pz-play" id="pzPl" aria-label="شغّل الشرايح">' + svg('play') + '</button><input type="range" id="pzR" min="1" value="1" aria-label="الشريحة"><span id="pzN"></span>' +
        '<div class="pz-fps" role="group" aria-label="السرعة">' + [5, 10, 15, 24].map(function (f) { return '<button type="button" data-fps="' + f + '" class="' + (f === fps ? 'on' : '') + '">' + f + '</button>'; }).join('') + '</div></div>' +
      '<nav class="pz-tools" role="toolbar" aria-label="الأدوات">' + tools.map(function (t) { return '<button type="button" data-t="' + t[0] + '" aria-pressed="' + (t[0] === tool) + '" class="' + (t[0] === tool ? 'on' : '') + '">' + svg(t[0]) + '<span>' + t[1] + '</span></button>'; }).join('') +
        '<i class="pz-sep"></i>' + acts.map(function (t) { return '<button type="button" data-a="' + t[0] + '"' + (t[0] === 'inv' ? ' aria-pressed="false"' : '') + '>' + svg(t[0]) + '<span>' + t[1] + '</span></button>'; }).join('') + '</nav>' +
      '<div class="pz-pre" role="group" aria-label="قوالب التباين">' + PRE.map(function (p, i) { return '<button type="button" data-p="' + i + '" class="' + (i ? '' : 'on') + '">' + p[0] + '</button>'; }).join('') + '</div>' +
      '<div class="pz-info" id="pzI" hidden></div></div>';
    var root = el.querySelector('.pz'), $ = function (id) { return el.querySelector('#' + id); }, cv = $('pzC'), ctx = cv.getContext('2d'), V = $('pzV'), oc = document.createElement('canvas'), ox = oc.getContext('2d'), img = null, img32 = null;
    var DPR = Math.min(2, window.devicePixelRatio || 1);
    /* ── data ── */
    function key() { return si + ':' + fi; }
    function val(a, j) { return a[j] * S.slope + S.inter; }
    function buildLut() {
      var k = [S.b, S.signed, wc.toFixed(2), ww.toFixed(2), inv, S.mono1, S.slope, S.inter].join('|'); if (k === lutKey) return; lutKey = k;
      var n = S.b === 16 ? 65536 : 256, off = S.b === 16 && S.signed ? 32768 : 0, lo = wc - ww / 2, sc = 255 / ww, m1 = !!S.mono1 !== !!inv; lut = new Uint8Array(n);
      for (var i = 0; i < n; i++) { var v = ((i - off) * S.slope + S.inter - lo) * sc; v = v < 0 ? 0 : v > 255 ? 255 : v; lut[i] = m1 ? 255 - v : v; }
    }
    function paintImg() {
      if (!A) return; var n = S.rows * S.cols;
      if (S.rgb) { var px = img.data; for (var i = 0; i < n; i++) { var r = A[i * 3], g = A[i * 3 + 1], b = A[i * 3 + 2]; if (inv) { r = 255 - r; g = 255 - g; b = 255 - b; } px[i * 4] = r; px[i * 4 + 1] = g; px[i * 4 + 2] = b; px[i * 4 + 3] = 255; } }
      else { buildLut(); var off = S.b === 16 && S.signed ? 32768 : 0; for (var j = 0; j < n; j++) { var v = lut[A[j] + off]; img32[j] = 0xFF000000 | (v << 16) | (v << 8) | v; } }
      ox.putImageData(img, 0, 0);
    }
    function autoWL() {
      if (S.wc != null && S.ww != null && S.ww > 1) return [S.wc, S.ww];
      var h = [], st = Math.max(1, Math.floor(A.length / 40000)); for (var i = 0; i < A.length; i += st) h.push(val(A, i));
      h.sort(function (x, y) { return x - y; }); var lo = h[Math.floor(h.length * 0.01)], hi = h[Math.floor(h.length * 0.995)]; return [(lo + hi) / 2, Math.max(1, hi - lo)];
    }
    function applyPreset(i) {
      preI = i; var p = PRE[i][1], a = A ? autoWL() : [wc, ww];
      if (!p) { wc = a[0]; ww = a[1]; } else if (p === 'hi') { wc = a[0]; ww = a[1] * 0.55; } else if (p === 'lo') { wc = a[0]; ww = a[1] * 1.6; } else { wc = p[0]; ww = p[1]; }
      [].forEach.call(el.querySelectorAll('[data-p]'), function (b) { b.classList.toggle('on', +b.dataset.p === i); });
      render(true);
    }
    /* ── view transform: image px → canvas px ── */
    function matrix() {
      var W = cv.width, Hh = cv.height, sw = rot % 2 ? S.rows : S.cols, sh = rot % 2 ? S.cols : S.rows, k = Math.min(W / sw, Hh / sh) * z;
      var m = new DOMMatrix(); m.translateSelf(W / 2 + panX * DPR, Hh / 2 + panY * DPR); m.rotateSelf(rot * 90); m.scaleSelf(k * (flip ? -1 : 1), k); m.translateSelf(-S.cols / 2, -S.rows / 2); return m;
    }
    function toImg(cx, cy) { var r = cv.getBoundingClientRect(), p = M.inverse().transformPoint(new DOMPoint((cx - r.left) * DPR, (cy - r.top) * DPR)); return [p.x, p.y]; }
    function toScr(p) { var q = M.transformPoint(new DOMPoint(p[0], p[1])); return [q.x, q.y]; }
    function mm(dx, dy) { return S.sp ? Math.hypot(dx * S.sp[1], dy * S.sp[0]) : null; }
    function roiStats(m) {
      var cx = (m.a[0] + m.b[0]) / 2, cy = (m.a[1] + m.b[1]) / 2, rx = Math.abs(m.b[0] - m.a[0]) / 2, ry = Math.abs(m.b[1] - m.a[1]) / 2; if (rx < 1 || ry < 1 || !A || S.rgb) return null;
      var s = 0, s2 = 0, n = 0, x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(S.cols - 1, Math.ceil(cx + rx)), y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(S.rows - 1, Math.ceil(cy + ry));
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) { var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1) continue; var v = val(A, y * S.cols + x); s += v; s2 += v * v; n++; }
      if (!n) return null; var mean = s / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean)), area = S.sp ? Math.PI * rx * ry * S.sp[0] * S.sp[1] / 100 : null;
      return { mean: mean, sd: sd, area: area, n: n };
    }
    function label(t, x, y) {
      ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.font = '600 ' + Math.round(12 * DPR) + 'px system-ui,sans-serif'; var w = ctx.measureText(t).width + 12 * DPR, h = 20 * DPR;
      x = Math.max(4, Math.min(cv.width - w - 4, x)); y = Math.max(4, Math.min(cv.height - h - 4, y));
      ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6 * DPR); else ctx.rect(x, y, w, h); ctx.fill();
      ctx.fillStyle = '#FDE68A'; ctx.textBaseline = 'middle'; ctx.fillText(t, x + 6 * DPR, y + h / 2);
    }
    function drawMeas() {
      var L = (meas[key()] || []).concat(drag && drag.m ? [drag.m] : []);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineWidth = 2 * DPR; ctx.strokeStyle = '#FACC15'; ctx.fillStyle = '#FACC15';
      L.forEach(function (m) {
        var a = toScr(m.a), b = toScr(m.b);
        if (m.t === 'ruler') {
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); [a, b].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.5 * DPR, 0, 7); ctx.fill(); });
          var d = mm(m.b[0] - m.a[0], m.b[1] - m.a[1]); label(d != null ? (d >= 10 ? (d / 10).toFixed(2) + ' سم' : d.toFixed(1) + ' مم') : Math.round(Math.hypot(m.b[0] - m.a[0], m.b[1] - m.a[1])) + ' px', (a[0] + b[0]) / 2 + 8 * DPR, (a[1] + b[1]) / 2 - 24 * DPR);
        } else {
          var c = toScr([(m.a[0] + m.b[0]) / 2, (m.a[1] + m.b[1]) / 2]), ex = toScr([m.b[0], (m.a[1] + m.b[1]) / 2]), ey = toScr([(m.a[0] + m.b[0]) / 2, m.b[1]]);
          var rx = Math.hypot(ex[0] - c[0], ex[1] - c[1]), ry = Math.hypot(ey[0] - c[0], ey[1] - c[1]), ang = Math.atan2(ex[1] - c[1], ex[0] - c[0]);
          ctx.beginPath(); ctx.ellipse(c[0], c[1], Math.max(1, rx), Math.max(1, ry), ang, 0, 7); ctx.stroke();
          var st = m.st || roiStats(m); if (st) { m.st = drag && drag.m === m ? null : st; label((isCT ? 'متوسط ' + Math.round(st.mean) + ' HU' : 'متوسط ' + Math.round(st.mean)) + ' · ±' + Math.round(st.sd) + (st.area != null ? ' · ' + st.area.toFixed(2) + ' سم²' : ''), c[0] + rx * 0.7, c[1] - ry - 26 * DPR); }
        }
      });
    }
    function draw() {
      if (!A) return; M = matrix();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(M.a, M.b, M.c, M.d, M.e, M.f); ctx.imageSmoothingEnabled = z < 3; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(oc, 0, 0);
      drawMeas(); overlays();
    }
    function overlays() {
      $('pzTL').innerHTML = S.rgb ? '' : '<span>W ' + Math.round(ww) + ' · L ' + Math.round(wc) + '</span>' + (z !== 1 ? '<span>' + z.toFixed(1) + '×</span>' : '') + (rot || flip ? '<span>' + (rot ? rot * 90 + '°' : '') + (flip ? ' ⇆' : '') + '</span>' : '');
      $('pzTR').innerHTML = '<span>' + esc(S.desc || MOD) + '</span>' + (S.sp ? '<span>FOV ' + (S.sp[1] * S.cols / 10).toFixed(1) + ' × ' + (S.sp[0] * S.rows / 10).toFixed(1) + ' cm</span>' : '');
      $('pzBL').textContent = S.f.length > 1 ? 'Im ' + (fi + 1) + ' / ' + S.f.length : '';
      /* scale bar: a round length that fits ~1/5 of the view */
      var br = $('pzBR');
      if (S.sp && M) { var pxPerMm = Math.hypot(M.a, M.b) / S.sp[1] / DPR, target = (cv.width / DPR) / 5 / pxPerMm, steps = [1, 2, 5, 10, 20, 50, 100, 200], L = steps.filter(function (v) { return v <= target; }).pop() || 1; br.innerHTML = '<i style="width:' + Math.round(L * pxPerMm) + 'px"></i><span>' + (L >= 10 ? L / 10 + ' cm' : L + ' mm') + '</span>'; } else br.innerHTML = '';
      var n = S.f.length, th = $('pzST'), sb = $('pzSB'); sb.hidden = n < 2; if (n > 1) { th.style.height = Math.max(8, 100 / n) + '%'; th.style.top = (fi / (n - 1)) * (100 - Math.max(8, 100 / n)) + '%'; sb.setAttribute('aria-valuemax', n); sb.setAttribute('aria-valuenow', fi + 1); }
      $('pzN').textContent = (fi + 1) + ' / ' + n; var r = $('pzR'); if (+r.value !== fi + 1) r.value = fi + 1;
    }
    function render(repaint) { if (repaint) dirty = 'img'; else if (!dirty) dirty = 'view'; if (render.q) return; render.q = requestAnimationFrame(function () { render.q = 0; if (dirty === 'img') paintImg(); dirty = false; draw(); }); }
    /* ── frames ── */
    var want = -1;
    function load(first) {
      var w = fi, s0 = si; want = w; H.pin = [si, fi];
      var ld = $('pzLD'), slow = setTimeout(function () { ld.classList.add('on'); }, 160);
      H.frame(si, w).then(function (a) { clearTimeout(slow); ld.classList.remove('on'); if (want !== w || s0 !== si) return; A = a; if (first) applyPreset(0); else render(true); prefetch(); })
        .catch(function () { clearTimeout(slow); ld.classList.remove('on'); });
    }
    var pfT = 0;
    function prefetch() {
      clearTimeout(pfT); var s0 = si, f0 = fi, order = []; for (var d = 1; d <= 24; d++) { order.push(f0 + d); order.push(f0 - d); }
      order = order.filter(function (i) { return i >= 0 && i < S.f.length && !H.has(s0, i); });
      (function nx(k) { if (k >= order.length || s0 !== si || Math.abs(fi - f0) > 12) return; H.frame(s0, order[k]).then(function () { pfT = setTimeout(function () { nx(k + 1); }, 0); }, function () {}); })(0);
    }
    function go(n, quiet) { n = Math.max(0, Math.min(S.f.length - 1, n)); if (n === fi) return; fi = n; if (S.f.length > 1 && !quiet) hint(false); if (H.has(si, fi)) { A = S.cache[fi]; H.pin = [si, fi]; render(true); if (!play) prefetch(); } else load(false); }
    function setSeries(i) {
      stop(); si = i; S = H.series[i]; fi = Math.floor(S.f.length / 2); oc.width = S.cols; oc.height = S.rows; img = ox.createImageData(S.cols, S.rows); img32 = new Uint32Array(img.data.buffer); A = null; z = 1; panX = panY = 0; rot = 0; flip = false; lutKey = '';
      MOD = String(S.modality || H.modality || '').toUpperCase(); isCT = MOD === 'CT';
      var r = $('pzR'); r.max = S.f.length; $('pzCine').hidden = S.f.length < 2;
      [].forEach.call(el.querySelectorAll('[data-s]'), function (b) { var on = +b.dataset.s === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      load(true);
    }
    function thumbs() {
      [].forEach.call(el.querySelectorAll('.pz-rail [data-s]'), function (b) {
        var i = +b.dataset.s, s = H.series[i], c = b.querySelector('canvas'), mid = Math.floor(s.f.length / 2);
        H.frame(i, mid).then(function (a) {
          var t = document.createElement('canvas'); t.width = s.cols; t.height = s.rows; var x = t.getContext('2d'), d = x.createImageData(s.cols, s.rows), wl = (function () { var sv = S, av = A; S = s; A = a; var r = autoWL(); S = sv; A = av; return r; })();
          var px = d.data, n = s.rows * s.cols, lo = wl[0] - wl[1] / 2, sc = 255 / wl[1];
          for (var j = 0; j < n; j++) { var v; if (s.rgb) { px[j * 4] = a[j * 3]; px[j * 4 + 1] = a[j * 3 + 1]; px[j * 4 + 2] = a[j * 3 + 2]; px[j * 4 + 3] = 255; continue; } v = ((a[j] * s.slope + s.inter) - lo) * sc; v = v < 0 ? 0 : v > 255 ? 255 : v; if (s.mono1) v = 255 - v; px[j * 4] = px[j * 4 + 1] = px[j * 4 + 2] = v; px[j * 4 + 3] = 255; }
          x.putImageData(d, 0, 0); var cx = c.getContext('2d'), k = Math.min(72 / s.cols, 72 / s.rows); cx.fillStyle = '#000'; cx.fillRect(0, 0, 72, 72); cx.drawImage(t, (72 - s.cols * k) / 2, (72 - s.rows * k) / 2, s.cols * k, s.rows * k);
        }).catch(function () {});
      });
    }
    /* ── cine ── */
    function stop() { if (play) { cancelAnimationFrame(play); play = 0; } var b = $('pzPl'); if (b) { b.innerHTML = svg('play'); b.setAttribute('aria-label', 'شغّل الشرايح'); } }
    function start() {
      if (S.f.length < 2) return; var b = $('pzPl'); b.innerHTML = svg('pause'); b.setAttribute('aria-label', 'وقّف'); lastT = 0;
      (function tick(t) { play = requestAnimationFrame(tick); if (t - lastT < 1000 / fps) return; lastT = t; var n = fi + 1 >= S.f.length ? 0 : fi + 1; if (H.has(si, n)) go(n, true); else H.frame(si, n).then(function () { if (play) go(n, true); }); for (var d = 2; d < 8; d++) { var q = (fi + d) % S.f.length; if (!H.has(si, q)) H.frame(si, q).catch(function () {}); } })(performance.now());
    }
    /* ── interaction ── */
    var P = {}, last = null, pinch = null, moved = 0, tapT = 0, acc = 0, btn = 0;
    function hint(on) { var h = $('pzH'); if (h) h.classList.toggle('gone', !on); }
    function activeTool(e) { if (btn === 2 || e.shiftKey && tool !== 'wl') return 'wl'; if (btn === 1) return 'pan'; return tool; }
    V.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    V.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.pz-sb')) return; V.setPointerCapture(e.pointerId); P[e.pointerId] = { x: e.clientX, y: e.clientY }; last = { x: e.clientX, y: e.clientY }; moved = 0; btn = e.button; hint(false);
      if (Object.keys(P).length > 1) { pinch = null; if (drag && drag.m) drag = null; return; }
      var t = activeTool(e); if ((t === 'ruler' || t === 'roi') && A) { var p = toImg(e.clientX, e.clientY); drag = { m: { t: t, a: p, b: p.slice() } }; }
    });
    V.addEventListener('pointermove', function (e) {
      if (!P[e.pointerId]) return; P[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(P);
      if (ids.length >= 2) {
        var a = P[ids[0]], b = P[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        if (pinch) { z = Math.max(0.3, Math.min(16, z * d / pinch.d)); panX += cx - pinch.x; panY += cy - pinch.y; render(); }
        pinch = { d: d, x: cx, y: cy }; moved += 10; return;
      }
      var dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy);
      var t = activeTool(e);
      if (drag && drag.m) { drag.m.b = toImg(e.clientX, e.clientY); render(); return; }
      if (t === 'wl' && !S.rgb) { var k = Math.max(0.4, ww / 240); ww = Math.max(1, ww + dx * k); wc = wc + dy * k; if (preI) [].forEach.call(el.querySelectorAll('[data-p]'), function (b) { b.classList.remove('on'); }); preI = -1; render(true); }
      else if (t === 'pan' || (S.rgb && t === 'wl')) { panX += dx; panY += dy; render(); }
      else if (t === 'zoom') { z = Math.max(0.3, Math.min(16, z * (1 - dy / 180))); render(); }
      else if (t === 'stack') { acc += dy; var st = Math.max(3, 260 / S.f.length); while (Math.abs(acc) > st) { go(fi + (acc > 0 ? 1 : -1)); acc -= acc > 0 ? st : -st; } }
    });
    function up(e) {
      delete P[e.pointerId];
      if (drag && drag.m) { var m = drag.m; drag = null; var big = Math.hypot(m.b[0] - m.a[0], m.b[1] - m.a[1]) > 3; if (big) { m.st = null; (meas[key()] = meas[key()] || []).push(m); } render(); return; }
      if (!Object.keys(P).length) { pinch = null; if (moved < 6) { var t = Date.now(); if (t - tapT < 320) { resetView(); tapT = 0; } else tapT = t; } }
    }
    V.addEventListener('pointerup', up); V.addEventListener('pointercancel', up);
    V.addEventListener('wheel', function (e) { e.preventDefault(); hint(false); if (e.ctrlKey || e.metaKey) { z = Math.max(0.3, Math.min(16, z * (e.deltaY < 0 ? 1.12 : 0.89))); render(); } else go(fi + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    /* slice scrollbar */
    var SB = $('pzSB');
    function sbGo(e) { var r = SB.getBoundingClientRect(), k = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); go(Math.round(k * (S.f.length - 1))); }
    SB.addEventListener('pointerdown', function (e) { e.stopPropagation(); SB.setPointerCapture(e.pointerId); SB.dataset.d = '1'; sbGo(e); });
    SB.addEventListener('pointermove', function (e) { if (SB.dataset.d) sbGo(e); });
    SB.addEventListener('pointerup', function () { delete SB.dataset.d; });
    function resetView() { z = 1; panX = panY = 0; rot = 0; flip = false; render(); }
    function resetAll() { inv = false; var ib = el.querySelector('[data-a="inv"]'); if (ib) { ib.classList.remove('on'); ib.setAttribute('aria-pressed', 'false'); } resetView(); if (A) applyPreset(0); }
    function setTool(t) { tool = t; [].forEach.call(el.querySelectorAll('[data-t]'), function (x) { var on = x.dataset.t === t; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); V.dataset.tool = t; }
    function info() {
      var I = $('pzI'); if (!I.hidden) { I.hidden = true; return; } var tot = H.series.reduce(function (n, s) { return n + s.f.length; }, 0);
      var rows = [['المريض', H.patient], ['رقم المريض', H.patID], ['النوع / السن', [H.sex === 'M' ? 'ذكر' : H.sex === 'F' ? 'أنثى' : H.sex, H.age].filter(Boolean).join(' · ')], ['الفحص', H.study], ['الجهاز', MOD], ['التاريخ', fmtDate(H.date)], ['المركز', H.inst], ['السيريز', H.series.length + ' · ' + tot + ' صورة'], ['السيريز الحالي', S.desc + ' · ' + S.cols + '×' + S.rows + (S.sp ? ' · ' + S.sp[1].toFixed(2) + ' مم/بكسل' : '')]];
      I.innerHTML = '<div class="pz-ih"><b>بيانات الدراسة</b><button type="button" data-a="info" aria-label="قفل">' + svg('x') + '</button></div><dl>' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl><p>الأدوات: W تباين · P تحريك · Z زوم · S شرايح · M مسطرة · O منطقة · I عكس · R رجّع · مسافة تشغيل</p>';
      I.hidden = false;
    }
    function snap() {
      cv.toBlob(function (bl) {
        if (!bl) return; var f = new File([bl], (o.name || 'صورة') + ' - ' + (S.desc || 'سيريز') + ' - ' + (fi + 1) + '.png', { type: 'image/png' });
        try { if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: f.name }).catch(function () {}); } catch (er) {}
        var l = document.createElement('a'); l.href = URL.createObjectURL(bl); l.download = f.name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(l.href); }, 2000);
      }, 'image/png');
    }
    function fullscreen() { if (document.fullscreenElement) return document.exitFullscreen(); if (root.requestFullscreen) root.requestFullscreen().catch(function () { root.classList.toggle('max'); setTimeout(size, 60); }); else { root.classList.toggle('max'); setTimeout(size, 60); } }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      if (b.dataset.t) setTool(b.dataset.t);
      if (b.dataset.s) setSeries(+b.dataset.s);
      if (b.dataset.p) applyPreset(+b.dataset.p);
      if (b.dataset.fps) { fps = +b.dataset.fps; [].forEach.call(el.querySelectorAll('[data-fps]'), function (x) { x.classList.toggle('on', x === b); }); }
      var a = b.dataset.a;
      if (a === 'inv') { inv = !inv; b.classList.toggle('on', inv); b.setAttribute('aria-pressed', String(inv)); render(true); }
      if (a === 'rot') { rot = (rot + 1) % 4; render(); }
      if (a === 'flip') { flip = !flip; render(); }
      if (a === 'reset') resetAll();
      if (a === 'clear') { delete meas[key()]; render(); }
      if (a === 'info') info();
      if (a === 'snap') snap();
      if (a === 'fs') fullscreen();
      if (a === 'close' && o.onClose) { stop(); o.onClose(); }
      if (b.id === 'pzPl') { if (play) stop(); else start(); }
    });
    $('pzR').oninput = function () { go(+this.value - 1); };
    root.addEventListener('keydown', function (e) {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return;
      var k = e.key, used = true;
      if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown') go(fi + (k === 'PageDown' ? 10 : 1)); else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') go(fi - (k === 'PageUp' ? 10 : 1));
      else if (k === 'Home') go(0); else if (k === 'End') go(S.f.length - 1); else if (k === ' ') { if (play) stop(); else start(); }
      else if (k === '+' || k === '=') { z = Math.min(16, z * 1.2); render(); } else if (k === '-') { z = Math.max(0.3, z / 1.2); render(); }
      else if (/^[1-8]$/.test(k) && PRE[+k - 1]) applyPreset(+k - 1);
      else if ({ w: 'wl', p: 'pan', z: 'zoom', s: 'stack', m: 'ruler', o: 'roi' }[k.toLowerCase()]) setTool({ w: 'wl', p: 'pan', z: 'zoom', s: 'stack', m: 'ruler', o: 'roi' }[k.toLowerCase()]);
      else if (k.toLowerCase() === 'i') el.querySelector('[data-a="inv"]').click(); else if (k.toLowerCase() === 'r') resetAll(); else if (k.toLowerCase() === 'f') fullscreen();
      else if (k === 'Delete' || k === 'Backspace') { delete meas[key()]; render(); } else if (k === 'Escape' && o.onClose && !document.fullscreenElement) { stop(); o.onClose(); } else used = false;
      if (used) e.preventDefault();
    });
    function size() { var r = V.getBoundingClientRect(); cv.width = Math.max(1, Math.round(r.width * DPR)); cv.height = Math.max(1, Math.round(r.height * DPR)); render(); }
    var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(V); else window.addEventListener('resize', size);
    document.addEventListener('fullscreenchange', function () { root.classList.toggle('fs', document.fullscreenElement === root); setTimeout(size, 60); });
    setTool('wl'); setSeries(0); size(); setTimeout(thumbs, 400);
    if (!o.noFocus && !(window.matchMedia && matchMedia('(pointer:coarse)').matches)) try { root.focus({ preventScroll: true }); } catch (e) {}
    return { head: H, destroy: function () { stop(); if (ro) ro.disconnect(); } };
  }

  window.OZPacs = { parse: parse, pack: pack, open: openBundle, viewer: viewer, isBundle: function (u8) { return new TextDecoder().decode(u8.subarray(0, 6)) === MAGIC; } };
})();
