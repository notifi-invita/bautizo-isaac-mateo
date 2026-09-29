/* ============================================================
   Ilustraciones SVG procedurales en estilo acuarela.
   Las esquinas florales y las manchas de acuarela se pre-renderizan
   a WebP (img/); aquí viven la corona, palomas, osito, cinta,
   marcos, iconos y la letra cursiva en trazos.
   ============================================================ */
(function () {
  "use strict";
  const ART = {};

  // Aleatorio con semilla: el dibujo sale igual en cada visita
  function seeded(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f = (n) => Math.round(n * 10) / 10;
  const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
  const EUCA = ["url(#lgEucaA)", "url(#lgEucaB)", "url(#lgEucaC)"];
  const OLIVE = ["url(#lgOliveA)", "url(#lgOliveB)"];
  const STAR = "M20 0C21.6 13 27 18.4 40 20C27 21.6 21.6 27 20 40C18.4 27 13 21.6 0 20C13 18.4 18.4 13 20 0Z";
  ART.seeded = seeded;

  /* ---------- Degradados y filtros compartidos ---------- */
  const lg = (id, a, b, attrs) => `<linearGradient id="${id}" ${attrs || 'x1="0" y1="0" x2="1" y2="0"'}><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  ART.defs = () => `
${lg("lgEucaA", "#86a092", "#cbd8cf")}${lg("lgEucaB", "#738e80", "#b5c8bb")}${lg("lgEucaC", "#a3b6a9", "#e2e9e3")}
${lg("lgOliveA", "#50695a", "#8ea596")}${lg("lgOliveB", "#657f6f", "#a8bbad")}
${lg("lgFeather", "#ebe3d2", "#fffefb")}${lg("lgWing", "#fffefb", "#ece3d2", 'x1="0" y1="0" x2="1" y2="1"')}${lg("lgWingFar", "#f4efe5", "#e2d8c5", 'x1="0" y1="0" x2="1" y2="1"')}${lg("lgDove", "#ffffff", "#ebe3d4", 'x1="0" y1="0" x2="0" y2="1"')}
${lg("lgBow", "#c2d4c6", "#8aa592", 'x1="0" y1="0" x2="0" y2="1"')}
<linearGradient id="lgPetal" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b1bfb4"/><stop offset=".5" stop-color="#e0e7e1"/><stop offset="1" stop-color="#f9fbf7"/></linearGradient>
<linearGradient id="lgPetalWarm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d2c4aa"/><stop offset=".55" stop-color="#efe8d9"/><stop offset="1" stop-color="#fdfbf6"/></linearGradient>
<radialGradient id="rgBerry" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#71897a"/><stop offset=".55" stop-color="#3b5244"/><stop offset="1" stop-color="#28392e"/></radialGradient>
<radialGradient id="rgFur" cx=".45" cy=".38" r=".7"><stop offset="0" stop-color="#f5e9d6"/><stop offset=".7" stop-color="#e7d1b1"/><stop offset="1" stop-color="#d2b48d"/></radialGradient>
<radialGradient id="rgFurIn" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#fcf5ea"/><stop offset="1" stop-color="#eedcc2"/></radialGradient>
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e0b5"/><stop offset=".35" stop-color="#c79c5e"/><stop offset=".6" stop-color="#e9cf98"/><stop offset="1" stop-color="#9a7240"/></linearGradient>
<linearGradient id="gGoldSoft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf0d4"/><stop offset="1" stop-color="#dcbc84"/></linearGradient>
<linearGradient id="gGoldLine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="220"><stop offset="0" stop-color="#e9cf98"/><stop offset=".4" stop-color="#b88a4e"/><stop offset=".7" stop-color="#f0dcaf"/><stop offset="1" stop-color="#a87c45"/></linearGradient>
<linearGradient id="foil" class="foil-grad" x1="0" y1="0" x2="1" y2=".4" spreadMethod="reflect"><stop offset="0" stop-color="#9b6f3a"/><stop offset=".25" stop-color="#c9a062"/><stop offset=".45" stop-color="#f8edcc"/><stop offset=".58" stop-color="#d5ad6c"/><stop offset=".8" stop-color="#a87b44"/><stop offset="1" stop-color="#e3c68b"/></linearGradient>
<linearGradient id="gRose" class="foil-grad" x1="0" y1="0" x2="1" y2="0" spreadMethod="reflect"><stop offset="0" stop-color="#c38658"/><stop offset=".2" stop-color="#e3bb95"/><stop offset=".45" stop-color="#c78c60"/><stop offset=".7" stop-color="#ecc9a6"/><stop offset="1" stop-color="#b47850"/></linearGradient>
${lg("gRoseDark", "#b87c52", "#8e5a37", 'x1="0" y1="0" x2="1" y2="1"')}
<filter id="wc" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".3"/></filter>
<filter id="fuzz" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="wcHQ" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
 <feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="4" seed="4" result="n"/>
 <feDisplacementMap in="SourceGraphic" in2="n" scale="8" xChannelSelector="R" yChannelSelector="G" result="shape"/>
 <feGaussianBlur in="shape" stdDeviation=".6" result="soft"/>
 <feTurbulence type="fractalNoise" baseFrequency=".055" numOctaves="3" seed="7" result="blot"/>
 <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .9 0 0 0 .38" result="blotA"/>
 <feComposite in="soft" in2="blotA" operator="in" result="pigment"/>
 <feMorphology in="soft" operator="erode" radius="1.4" result="inner"/>
 <feComposite in="soft" in2="inner" operator="out" result="rim"/>
 <feColorMatrix in="rim" type="matrix" values=".6 0 0 0 0  0 .64 0 0 0  0 0 .62 0 0  0 0 0 .7 0" result="rimDark"/>
 <feGaussianBlur in="rimDark" stdDeviation=".6" result="rimSoft"/>
 <feMerge><feMergeNode in="pigment"/><feMergeNode in="rimSoft"/></feMerge>
</filter>`;

  /* ---------- Formas base ---------- */
  // Hoja con base en (0,0) y punta en (len,0)
  function leafShape(len, wid, kind) {
    if (kind === "round")
      return `M0 0C${f(len * 0.15)} ${f(-wid * 1.25)} ${f(len * 1.05)} ${f(-wid * 1.1)} ${f(len)} 0C${f(len * 1.05)} ${f(wid * 1.1)} ${f(len * 0.15)} ${f(wid * 1.25)} 0 0Z`;
    if (kind === "willow")
      return `M0 0Q${f(len * 0.4)} ${f(-wid * 1.1)} ${f(len)} ${f(-wid * 0.15)}Q${f(len * 0.5)} ${f(wid * 0.75)} 0 0Z`;
    return `M0 0Q${f(len * 0.45)} ${f(-wid)} ${f(len)} 0Q${f(len * 0.45)} ${f(wid)} 0 0Z`;
  }
  ART.leafShape = leafShape;

  function leaf(x, y, ang, len, wid, o) {
    const fill = o.outline ? "none" : o.fill;
    const stroke = o.outline ? ' stroke="#7f978a" stroke-width=".9"' : "";
    const vein = !o.outline && o.vein ? `<path d="M${f(len * 0.12)} 0L${f(len * 0.82)} 0" stroke="rgba(255,255,255,.4)" stroke-width=".7"/>` : "";
    const cls = o.cls ? ` class="${o.cls}"` : "";
    const style = o.i != null ? ` style="--i:${o.i}"` : "";
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><g${cls}${style}><path d="${leafShape(len, wid, o.kind)}" fill="${fill}" opacity="${f(o.op || 0.9)}"${stroke}/>${vein}</g></g>`;
  }

  // Rama sobre una curva cuadrática con hojas alternadas
  function branch(b, rnd) {
    const P = (t) => [(1 - t) * (1 - t) * b.x0 + 2 * (1 - t) * t * b.cx + t * t * b.x1, (1 - t) * (1 - t) * b.y0 + 2 * (1 - t) * t * b.cy + t * t * b.y1];
    const D = (t) => [2 * (1 - t) * (b.cx - b.x0) + 2 * t * (b.x1 - b.cx), 2 * (1 - t) * (b.cy - b.y0) + 2 * t * (b.y1 - b.cy)];
    let out = `<path d="M${f(b.x0)} ${f(b.y0)}Q${f(b.cx)} ${f(b.cy)} ${f(b.x1)} ${f(b.y1)}" fill="none" stroke="${b.outline ? "#8fa597" : "#6f8878"}" stroke-width="${b.sw || 1.3}" stroke-linecap="round"/>`;
    for (let i = 0; i < b.n; i++) {
      const t = 0.08 + (0.92 * i) / (b.n - 1);
      const [x, y] = P(t), [dx, dy] = D(t);
      const base = (Math.atan2(dy, dx) * 180) / Math.PI;
      const side = i % 2 ? 1 : -1, shrink = 1 - t * 0.45, last = i === b.n - 1;
      out += leaf(x, y, last ? base : base + side * (b.spread || 48) + (rnd() - 0.5) * 16,
        b.len * shrink * (0.85 + rnd() * 0.3), b.wid * shrink * (0.85 + rnd() * 0.3), {
          kind: b.kind, outline: b.outline, vein: b.kind !== "round",
          fill: pick(rnd, b.palette || EUCA), op: 0.78 + rnd() * 0.2
        });
    }
    return out;
  }

  // Curva cerrada suave (Catmull-Rom) para manchas orgánicas
  function smoothClosed(pts) {
    const n = pts.length;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + "Z";
  }
  function blob(cx, cy, rx, ry, n, rnd, j) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, k = 1 - j + rnd() * j * 2;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return smoothClosed(pts);
  }

  /* ---------- Flores ---------- */
  const petal = (len, wid) => `M0 0C${f(-wid)} ${f(-len * 0.25)} ${f(-wid * 0.95)} ${f(-len)} 0 ${f(-len)}C${f(wid * 0.95)} ${f(-len)} ${f(wid)} ${f(-len * 0.25)} 0 0Z`;

  function rose(cx, cy, r, rnd, warm) {
    const fill = warm ? "url(#lgPetalWarm)" : "url(#lgPetal)";
    const st = warm ? "rgba(150,125,90,.35)" : "rgba(110,135,118,.35)";
    let s = `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r * 1.05)}" ry="${f(r)}" fill="${warm ? "#efe6d6" : "#e3eae4"}" opacity=".7"/>`;
    [[9, 1, 0.62], [7, 0.74, 0.5], [5, 0.5, 0.38]].forEach(([n, k, w], li) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 360 + li * 21 + rnd() * 14;
        s += `<path transform="translate(${f(cx)} ${f(cy)}) rotate(${f(a)})" d="${petal(r * k * (0.9 + rnd() * 0.15), r * w)}" fill="${fill}" stroke="${st}" stroke-width=".7" opacity=".95"/>`;
      }
    });
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.26)}" fill="${warm ? "#d9cbb1" : "#c2cfc6"}" opacity=".75"/>`;
    const k = r * 0.24;
    s += `<path d="M${f(cx - k * 0.2)} ${f(cy)}a${f(k * 0.3)} ${f(k * 0.3)} 0 1 1 ${f(k * 0.5)} ${f(k * 0.1)}a${f(k * 0.6)} ${f(k * 0.55)} 0 1 1 ${f(-k * 1.1)} ${f(-k * 0.3)}a${f(k * 0.95)} ${f(k * 0.9)} 0 1 1 ${f(k * 1.7)} ${f(k * 0.5)}" fill="none" stroke="${warm ? "#a8936f" : "#86998c"}" stroke-width="1.1" stroke-linecap="round"/>`;
    return s;
  }

  function blossom(x, y, r, rnd) {
    let s = "";
    for (let i = 0; i < 5; i++) {
      const a = i * 72 + rnd() * 10;
      s += `<ellipse cx="${f(x)}" cy="${f(y - r * 0.55)}" rx="${f(r * 0.42)}" ry="${f(r * 0.55)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})" fill="#fbf9f3" stroke="rgba(150,140,110,.35)" stroke-width=".6"/>`;
    }
    return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.22)}" fill="#d9b776"/>`;
  }

  function lavender(x0, y0, ang, len, rnd) {
    const rad = (ang * Math.PI) / 180, dx = Math.cos(rad), dy = Math.sin(rad);
    let s = `<path d="M${f(x0)} ${f(y0)}L${f(x0 + dx * len)} ${f(y0 + dy * len)}" stroke="#7f957f" stroke-width="1"/>`;
    for (let i = 0; i < 11; i++) {
      const t = 0.42 + (i / 10) * 0.58, side = i % 2 ? 1 : -1;
      const x = x0 + dx * len * t - dy * side * 2.2, y = y0 + dy * len * t + dx * side * 2.2;
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(3.6 - t * 1.4)}" ry="${f(2.2 - t * 0.6)}" transform="rotate(${f(ang + side * 25)} ${f(x)} ${f(y)})" fill="${rnd() < 0.5 ? "#a79dc3" : "#8f86ae"}" opacity=".85"/>`;
    }
    return s;
  }

  function berries(x, y, n, rnd) {
    let stems = "", dots = "";
    for (let i = 0; i < n; i++) {
      const bx = x + (rnd() - 0.5) * 26, by = y + (rnd() - 0.5) * 22, br = 3.2 + rnd() * 2.2;
      stems += `<path d="M${f(x)} ${f(y)}L${f(bx)} ${f(by)}" stroke="#6f8878" stroke-width=".7"/>`;
      dots += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(br)}" fill="url(#rgBerry)"/><circle cx="${f(bx - br * 0.35)}" cy="${f(by - br * 0.35)}" r="${f(br * 0.28)}" fill="#fff" opacity=".4"/>`;
    }
    return stems + dots;
  }

  /* ---------- Esquina floral en 3 capas (se pre-renderiza) ---------- */
  ART.cornerLayers = function (seed) {
    const rnd = seeded(seed);
    const j = () => (rnd() - 0.5) * 16;
    const back =
      `<path d="${blob(80, 78, 92, 80, 11, rnd, 0.24)}" fill="#e2eae4" opacity=".32"/>` +
      `<path d="${blob(150, 46, 52, 34, 8, rnd, 0.25)}" fill="#f1e6cc" opacity=".3"/>` +
      branch({ x0: 60, y0: 60, cx: 140, cy: 150 + j(), x1: 120, y1: 262, n: 8, len: 19, wid: 6, outline: true, sw: 0.9 }, rnd) +
      branch({ x0: 70, y0: 40, cx: 170, cy: 70 + j(), x1: 272, y1: 122, n: 8, len: 18, wid: 6, outline: true, sw: 0.9 }, rnd) +
      branch({ x0: 0, y0: 90, cx: 60, cy: 170, x1: 70, y1: 280, n: 9, len: 20, wid: 9, kind: "round", palette: ["url(#lgEucaC)"] }, rnd);
    const mid =
      branch({ x0: 40, y0: -4, cx: 150, cy: -2 + j(), x1: 282, y1: 24, n: 12, len: 20, wid: 6.5, spread: 40, kind: "willow", palette: OLIVE }, rnd) +
      branch({ x0: -4, y0: 70, cx: -8, cy: 190, x1: 12, y1: 298, n: 12, len: 20, wid: 6.5, spread: 40, kind: "willow", palette: OLIVE }, rnd) +
      branch({ x0: 0, y0: 0, cx: 70, cy: 120, x1: 150, y1: 150 + j(), n: 11, len: 21, wid: 9.5, kind: "round" }, rnd) +
      branch({ x0: 8, y0: 8, cx: 120 + j(), cy: 80, x1: 185, y1: 192, n: 12, len: 22, wid: 7 }, rnd) +
      branch({ x0: -6, y0: 30, cx: 100, cy: 18, x1: 232, y1: 66 + j(), n: 13, len: 24, wid: 11, kind: "round" }, rnd) +
      branch({ x0: 20, y0: -6, cx: 34 + j(), cy: 110, x1: 30, y1: 252, n: 12, len: 23, wid: 10, kind: "round" }, rnd) +
      lavender(96, 92, 38, 92, rnd) + lavender(84, 104, 58, 80, rnd) +
      berries(130, 120, 5, rnd) + berries(62, 208, 4, rnd) + berries(204, 62, 3, rnd);
    const front =
      rose(72, 64, 44, rnd, false) + rose(34, 160, 28, rnd, true) + rose(160, 34, 24, rnd, false) +
      [[112, 100, 58], [98, 34, -20], [52, 112, 110], [20, 104, 95], [116, 58, 20], [60, 190, 80]].map(([x, y, a]) =>
        leaf(x, y, a, 26, 8, { fill: pick(rnd, OLIVE), vein: true, op: 0.92 })).join("") +
      blossom(118, 72, 9, rnd) + blossom(66, 124, 7, rnd) + blossom(186, 50, 6, rnd);
    return { back, mid, front };
  };

  /* ---------- Manchas de acuarela para las secciones (se pre-renderizan) ---------- */
  ART.wash = function (seed) {
    const rnd = seeded(seed);
    return `<path d="${blob(200, 150, 170, 110, 13, rnd, 0.18)}" fill="#e2eae4" opacity=".85"/>` +
      `<path d="${blob(250 + rnd() * 30, 120, 90, 70, 10, rnd, 0.25)}" fill="#f2e7cf" opacity=".55"/>` +
      `<path d="${blob(140, 190, 70, 40, 9, rnd, 0.3)}" fill="#d3ded6" opacity=".5"/>`;
  };

  /* ---------- Corona de olivo alrededor de la foto ---------- */
  ART.wreath = function () {
    const rnd = seeded(11);
    const cx = 215, cy = 140, R = 124, rad = (d) => (d * Math.PI) / 180;
    let k = 0;
    const side = (a0, a1) => {
      const p0 = [cx + R * Math.cos(rad(a0)), cy + R * Math.sin(rad(a0))];
      const p1 = [cx + R * Math.cos(rad(a1)), cy + R * Math.sin(rad(a1))];
      const sweep = a1 > a0 ? 1 : 0, dir = sweep ? 1 : -1;
      let g = `<path class="stem" d="M${f(p0[0])} ${f(p0[1])}A${R} ${R} 0 0 ${sweep} ${f(p1[0])} ${f(p1[1])}" fill="none" stroke="#6f8878" stroke-width="1.6" stroke-linecap="round"/>`;
      const n = 13;
      for (let i = 0; i < n; i++) {
        const r = rad(a0 + ((a1 - a0) * (i + 0.5)) / n);
        const x = cx + R * Math.cos(r), y = cy + R * Math.sin(r);
        const tang = (Math.atan2(Math.cos(r) * dir, -Math.sin(r) * dir) * 180) / Math.PI;
        const len = 27 * (1 - (i / n) * 0.35), wid = 6.5 * (1 - (i / n) * 0.3);
        [-1, 1].forEach((sd) => {
          g += leaf(x, y, tang + sd * (34 + rnd() * 10), len * (0.85 + rnd() * 0.3), wid, {
            fill: (i + (sd > 0 ? 1 : 0)) % 3 ? pick(rnd, OLIVE) : pick(rnd, EUCA), op: 0.86 + rnd() * 0.12, vein: true, cls: "lf", i: k++
          });
        });
        if (i % 4 === 2) g += `<circle class="lf" style="--i:${k++}" cx="${f(x + Math.cos(r) * 9)}" cy="${f(y + Math.sin(r) * 9)}" r="3.4" fill="url(#rgBerry)"/>`;
      }
      return g;
    };
    return `<svg viewBox="0 0 430 280" aria-hidden="true"><g filter="url(#wc)">${side(118, 236)}${side(62, -56)}</g></svg>`;
  };

  /* ---------- Paloma estilizada con 3 poses de ala (para MorphSVG) ---------- */
  // Mira a la derecha. El ala cercana y el ala lejana cambian de forma entre
  // arriba → medio → abajo para un aleteo real (no un simple aplastado).
  ART.WING = {
    up:   "M132 68C136 46 126 22 104 6C101 16 96 22 88 24C90 31 87 37 79 40C83 47 80 53 73 56C80 62 86 68 98 72C110 76 124 74 132 68Z",
    mid:  "M132 68C122 52 100 42 60 40C66 46 68 50 64 54C71 56 74 59 70 63C78 64 82 67 80 71C86 73 92 75 98 76C112 78 126 75 132 68Z",
    down: "M132 68C130 86 118 106 96 120C97 110 95 105 90 102C94 96 93 91 88 88C93 84 94 80 92 77C96 76 98 75 100 74C112 76 126 74 132 68Z",
    cUp:  "M132 68C132 56 124 44 112 36C110 44 104 50 98 54C100 60 100 66 104 70C114 72 126 72 132 68Z",
    cMid: "M132 68C126 60 114 54 98 52C100 58 98 62 94 64C98 68 100 71 104 73C114 75 126 73 132 68Z",
    cDown:"M132 68C132 78 126 88 116 94C112 88 108 86 104 86C104 80 104 77 104 74C114 75 126 73 132 68Z"
  };
  ART.dove = function () {
    const W = ART.WING, st = 'stroke="#cdbd9f" stroke-width="1" stroke-linejoin="round"', cst = 'stroke="#e2d6c0" stroke-width=".8" stroke-linejoin="round"';
    return `<svg viewBox="0 -18 200 160" aria-hidden="true" class="dove-svg">
<g transform="translate(-9 -5) translate(132 68) scale(1.22) translate(-132 -68)"><path class="w-far" d="${W.up}" fill="url(#lgWingFar)" ${st}/><path class="c-far" d="${W.cUp}" fill="#efe8dc" ${cst}/></g>
<path d="M168 56C166 48 158 44 150 47C143 50 140 57 132 61C114 69 88 72 62 76L28 70C22 69 20 75 25 78C19 80 19 87 26 87C22 91 26 97 32 94L62 88C80 99 112 101 134 93C150 88 162 78 168 64Z" fill="url(#lgDove)" ${st}/>
<path d="M36 78L60 80M34 86L60 84" stroke="#e2d6c0" stroke-width="1" fill="none" stroke-linecap="round"/>
<path d="M167 55L181 60L167 64Z" fill="#d6ae6c"/>
<circle cx="159" cy="55" r="2.1" fill="#3d3530"/><circle cx="159.7" cy="54.3" r=".7" fill="#fff"/>
<g transform="translate(132 68) scale(1.22) translate(-132 -68)"><path class="w-near" d="${W.up}" fill="url(#lgWing)" ${st}/><path class="c-near" d="${W.cUp}" fill="#f8f3ea" ${cst}/></g>
</svg>`;
  };

  /* ---------- Osito de peluche con moño salvia ---------- */
  ART.bear = function () {
    const ln = 'stroke="#a88866" stroke-width="1.5"';
    const pad = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="8" fill="url(#rgFurIn)" stroke="#b89a78" stroke-width="1"/>` +
      [-6, 0, 6].map((d) => `<circle cx="${x + d}" cy="${y - 9}" r="2.2" fill="url(#rgFurIn)" stroke="#b89a78" stroke-width=".8"/>`).join("");
    return `<svg viewBox="0 0 160 175" aria-hidden="true"><g filter="url(#fuzz)">
<ellipse cx="50" cy="156" rx="20" ry="15" fill="url(#rgFur)" ${ln}/><ellipse cx="110" cy="156" rx="20" ry="15" fill="url(#rgFur)" ${ln}/>
${pad(46, 159)}${pad(114, 159)}
<ellipse cx="80" cy="128" rx="42" ry="36" fill="url(#rgFur)" ${ln}/><ellipse cx="80" cy="134" rx="24" ry="20" fill="url(#rgFurIn)" stroke="#c2a47f" stroke-width="1"/>
<path d="M80 118v32" stroke="#c2a47f" stroke-width="1" stroke-dasharray="2 3"/>
<ellipse cx="40" cy="122" rx="13" ry="22" transform="rotate(28 40 122)" fill="url(#rgFur)" ${ln}/>
<g class="bear-arm"><ellipse cx="122" cy="118" rx="13" ry="22" transform="rotate(-28 122 118)" fill="url(#rgFur)" ${ln}/></g>
<g class="bear-head">
<circle cx="40" cy="30" r="17" fill="url(#rgFur)" ${ln}/><circle cx="120" cy="30" r="17" fill="url(#rgFur)" ${ln}/>
<circle cx="41" cy="31" r="9" fill="#f1d9c8"/><circle cx="119" cy="31" r="9" fill="#f1d9c8"/>
<ellipse cx="80" cy="60" rx="46" ry="40" fill="url(#rgFur)" ${ln}/><ellipse cx="80" cy="76" rx="19" ry="14" fill="url(#rgFurIn)" stroke="#c2a47f" stroke-width="1"/>
<ellipse cx="80" cy="69" rx="7.5" ry="5.5" fill="#5b4535"/><ellipse cx="78" cy="67.5" rx="2.4" ry="1.4" fill="#fff" opacity=".45"/>
<path d="M80 75v5M72 81c4 4 12 4 16 0" fill="none" stroke="#5b4535" stroke-width="1.6" stroke-linecap="round"/>
<g class="bear-eyes"><circle cx="63" cy="54" r="4.3" fill="#3f3129"/><circle cx="97" cy="54" r="4.3" fill="#3f3129"/>
<circle cx="64.5" cy="52.5" r="1.4" fill="#fff"/><circle cx="98.5" cy="52.5" r="1.4" fill="#fff"/></g>
<ellipse cx="55" cy="70" rx="6.5" ry="3.8" fill="#f2b6a0" opacity=".5"/><ellipse cx="105" cy="70" rx="6.5" ry="3.8" fill="#f2b6a0" opacity=".5"/>
</g>
<g stroke="#6f8c79" stroke-width="1.2"><path d="M80 100L59 89C54 96 54 107 59 113Z" fill="url(#lgBow)"/><path d="M80 100L101 89C106 96 106 107 101 113Z" fill="url(#lgBow)"/><circle cx="80" cy="101" r="6.2" fill="#9db6a3"/></g>
</g></svg>`;
  };

  /* ---------- Cinta de oro rosa ---------- */
  ART.ribbon = () => `<svg viewBox="0 0 470 110" aria-hidden="true">
<path d="M86 34L8 40L34 67L6 98L86 94Z" fill="url(#gRoseDark)"/><path d="M384 34L462 40L436 67L464 98L384 94Z" fill="url(#gRoseDark)"/>
<path d="M58 78L86 94L86 72Z" fill="#6f4429"/><path d="M412 78L384 94L384 72Z" fill="#6f4429"/>
<path d="M58 16Q235 2 412 16L412 78Q235 64 58 78Z" fill="url(#gRose)"/>
<path d="M58 20Q235 6 412 20" fill="none" stroke="#f8e2cb" stroke-width="1.4" opacity=".85"/>
<path d="M58 74Q235 60 412 74" fill="none" stroke="#8a5534" stroke-width="1" opacity=".5"/>
</svg>`;

  /* ---------- Marco dorado de esquina con voluta ---------- */
  ART.frame = () => `<svg viewBox="0 0 220 220" fill="none" stroke="url(#gGoldLine)" stroke-linecap="round" aria-hidden="true">
<path class="draw" d="M0 5H150C176 5 192 8 200 20"/><path class="draw" d="M14 13H146C166 13 180 16 188 24"/>
<path class="draw" d="M200 20C210 32 215 46 215 70V220"/><path class="draw" d="M188 24C198 36 207 50 207 80V206"/>
<path class="draw" d="M200 20C205 11 215 9 216 17C217 25 207 28 204 22C202 17 209 14 211 19"/>
<path class="draw" d="M150 5C160 -1 170 0 174 5M215 120C221 128 221 138 215 144"/>
<circle cx="193" cy="40" r="1.8" fill="#c9a260" stroke="none"/><circle cx="172" cy="22" r="1.3" fill="#c9a260" stroke="none"/>
</svg>`;

  /* ---------- Polvo dorado ---------- */
  ART.splat = function (seed) {
    const rnd = seeded(seed || 21), cols = ["#d6b77a", "#c9a260", "#e8d3a2", "#b8894c"];
    let s = `<svg viewBox="0 0 200 200" aria-hidden="true">`;
    for (let i = 0; i < 160; i++) {
      const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 1.8) * 95;
      const r = rnd() < 0.08 ? 1.6 + rnd() * 1.6 : 0.4 + rnd() * 1.1;
      s += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d * 0.8)}" r="${f(r)}" fill="${cols[Math.floor(rnd() * 4)]}" opacity="${f(0.45 + rnd() * 0.5)}"/>`;
    }
    return s + `</svg>`;
  };

  ART.star = () => `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="${STAR}" fill="url(#gGold)"/></svg>`;
  ART.sparkles = () => [[9, 47, 26, 0], [16, 52, 15, 0.8], [90, 47, 26, 1.4], [83, 53, 15, 2.1], [86, 9, 22, 0.5], [13, 90, 20, 1.8], [50, 3, 14, 2.6], [93, 72, 14, 1.1]]
    .map(([l, t, s, d]) => `<span class="sparkle" style="left:${l}%;top:${t}%;--s:${s}px;--d:${d}s">${ART.star()}</span>`).join("");

  ART.cross = () => `<svg viewBox="0 0 60 100" aria-hidden="true">
<path class="draw" d="M24 2H36V26H58V38H36V98H24V38H2V26H24Z" fill="url(#foil)" stroke="#9a7240" stroke-width=".8"/>
<path d="M28 6H32V30H54V34H32V94H28V34H6V30H28Z" fill="url(#gGoldSoft)" opacity=".7"/>
</svg>`;

  ART.sprig = function () {
    const rnd = seeded(5);
    let s = `<svg viewBox="0 0 220 44" aria-hidden="true"><g filter="url(#wc)">`;
    s += branch({ x0: 110, y0: 24, cx: 60, cy: 14, x1: 6, y1: 28, n: 8, len: 16, wid: 6.5, kind: "round" }, rnd);
    s += branch({ x0: 110, y0: 24, cx: 160, cy: 14, x1: 214, y1: 28, n: 8, len: 16, wid: 6.5, kind: "round" }, rnd);
    return s + `</g><path class="sprig-star" d="${STAR}" transform="translate(101 12) scale(.45)" fill="url(#gGold)"/></svg>`;
  };

  ART.church = () => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path class="draw" d="M32 4v10M27.5 8.5h9"/><path class="draw" d="M32 14L18 28v28h28V28z"/><path class="draw" d="M26 56V45a6 6 0 0 1 12 0v11"/>
<circle class="draw" cx="32" cy="32" r="4"/><path class="draw" d="M18 36L8 42v14h10M46 36l10 6v14H46"/><path class="draw" d="M4 56h56"/></svg>`;

  ART.toast = () => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<g transform="rotate(-14 22 34)"><path class="draw" d="M15 12h14l-2 18c-.6 5-3 7-5 7s-4.4-2-5-7z"/><path class="draw" d="M22 37v17M16 54h12M16 20h12"/></g>
<g transform="rotate(14 42 34)"><path class="draw" d="M35 12h14l-2 18c-.6 5-3 7-5 7s-4.4-2-5-7z"/><path class="draw" d="M42 37v17M36 54h12M36 20h12"/></g>
<path class="draw" d="M32 2v5M26 5l2 3M38 5l-2 3"/></svg>`;

  ART.fallingLeaf = (kind) =>
    `<svg viewBox="-2 -14 32 28" aria-hidden="true"><path d="${leafShape(28, kind === "round" ? 12 : 6, kind)}" fill="url(#${kind === "round" ? "lgEucaA" : "lgOliveB"})"/><path d="M3 0H24" stroke="rgba(255,255,255,.45)" stroke-width=".8"/></svg>`;

  /* ---------- Letra cursiva que se escribe a mano ---------- */
  // Cada letra rellena en oro lleva una máscara: un trazo grueso sobre su contorno.
  // Al "dibujar" ese trazo (DrawSVG), la letra aparece como si la pluma la escribiera.
  let titleCount = 0;
  ART.title = function (key) {
    const t = window.TITLE_PATHS && window.TITLE_PATHS[key];
    if (!t) return "";
    const [x, y, w, h] = t.viewBox.split(" ").map(Number);
    const id = `t-${key}-${titleCount++}`;
    const sw = key === "name" ? 16 : 22;
    let masks = "", glyphs = "";
    t.glyphs.forEach((d, i) => {
      masks += `<mask id="${id}-m${i}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><path class="gm" d="${d}" fill="none" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></mask>`;
      glyphs += `<path class="gl" d="${d}" fill="url(#${id}-f)" mask="url(#${id}-m${i})"/>`;
    });
    return `<svg viewBox="${t.viewBox}" class="script-svg" aria-hidden="true"><defs><linearGradient id="${id}-f" class="foil-grad" data-w="${w}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${f(x + w)}" y2="${f(y + h * 0.6)}" spreadMethod="reflect"><stop offset="0" stop-color="#9b6f3a"/><stop offset=".28" stop-color="#c9a062"/><stop offset=".46" stop-color="#f8edcc"/><stop offset=".6" stop-color="#d5ad6c"/><stop offset=".82" stop-color="#a87b44"/><stop offset="1" stop-color="#dcbd80"/></linearGradient>${masks}</defs><g class="glyphs">${glyphs}</g></svg>`;
  };

  /* ---------- Rellenar la página ---------- */
  ART.fill = function (root) {
    const scope = root || document;
    if (!document.getElementById("art-defs")) {
      document.body.insertAdjacentHTML("afterbegin", `<svg id="art-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>${ART.defs()}</defs></svg>`);
    }
    scope.querySelectorAll("[data-art]").forEach((el) => {
      const name = el.dataset.art;
      if (name === "title") el.innerHTML = ART.title(el.dataset.key);
      else if (typeof ART[name] === "function") el.innerHTML = ART[name](Number(el.dataset.seed) || 0);
    });
  };

  window.ART = ART;
})();
