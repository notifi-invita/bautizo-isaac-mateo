/* ============================================================
   Solo para generar las imágenes pre-renderizadas (img/*.webp).
   No se carga en la invitación. Se usa desde tools/render-assets.py
   después de js/art.js, que expone sus utilidades en ART._
   ============================================================ */
(function () {
  "use strict";
  const ART = window.ART;
  const { seeded, f, pick, leaf, branch, EUCA, OLIVE } = ART._;
  ART.buildDefs = () => `
<linearGradient id="lgBow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2d4c6"/><stop offset="1" stop-color="#8aa592"/></linearGradient>
<linearGradient id="lgPetal" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b1bfb4"/><stop offset=".5" stop-color="#e0e7e1"/><stop offset="1" stop-color="#f9fbf7"/></linearGradient>
<linearGradient id="lgPetalWarm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d2c4aa"/><stop offset=".55" stop-color="#efe8d9"/><stop offset="1" stop-color="#fdfbf6"/></linearGradient>
<radialGradient id="rgBerry" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#71897a"/><stop offset=".55" stop-color="#3b5244"/><stop offset="1" stop-color="#28392e"/></radialGradient>
<radialGradient id="rgFur" cx=".45" cy=".38" r=".7"><stop offset="0" stop-color="#f5e9d6"/><stop offset=".7" stop-color="#e7d1b1"/><stop offset="1" stop-color="#d2b48d"/></radialGradient>
<radialGradient id="rgFurIn" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#fcf5ea"/><stop offset="1" stop-color="#eedcc2"/></radialGradient>
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
})();
