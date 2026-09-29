/* ============================================================
   Ilustraciones de la invitación. Pintadas en acuarela (img/):
   flores de esquina, corona, osito, ramita y palomas (4 cuadros).
   Hechas con código (SVG): cinta, marcos, destellos, cruz, iconos
   y la letra cursiva que se escribe a mano.
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
${lg("lgWing", "#fffefb", "#ece3d2", 'x1="0" y1="0" x2="1" y2="1"')}${lg("lgWingFar", "#f4efe5", "#e2d8c5", 'x1="0" y1="0" x2="1" y2="1"')}${lg("lgDove", "#ffffff", "#ebe3d4", 'x1="0" y1="0" x2="0" y2="1"')}
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e0b5"/><stop offset=".35" stop-color="#c79c5e"/><stop offset=".6" stop-color="#e9cf98"/><stop offset="1" stop-color="#9a7240"/></linearGradient>
<linearGradient id="gGoldSoft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf0d4"/><stop offset="1" stop-color="#dcbc84"/></linearGradient>
<linearGradient id="gGoldLine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="220"><stop offset="0" stop-color="#e9cf98"/><stop offset=".4" stop-color="#b88a4e"/><stop offset=".7" stop-color="#f0dcaf"/><stop offset="1" stop-color="#a87c45"/></linearGradient>
<linearGradient id="foil" class="foil-grad" x1="0" y1="0" x2="1" y2=".4" spreadMethod="reflect"><stop offset="0" stop-color="#9b6f3a"/><stop offset=".25" stop-color="#c9a062"/><stop offset=".45" stop-color="#f8edcc"/><stop offset=".58" stop-color="#d5ad6c"/><stop offset=".8" stop-color="#a87b44"/><stop offset="1" stop-color="#e3c68b"/></linearGradient>
<linearGradient id="gRose" class="foil-grad" x1="0" y1="0" x2="1" y2="0" spreadMethod="reflect"><stop offset="0" stop-color="#c38658"/><stop offset=".2" stop-color="#e3bb95"/><stop offset=".45" stop-color="#c78c60"/><stop offset=".7" stop-color="#ecc9a6"/><stop offset="1" stop-color="#b47850"/></linearGradient>
${lg("gRoseDark", "#b87c52", "#8e5a37", 'x1="0" y1="0" x2="1" y2="1"')}
<filter id="wc" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".3"/></filter>`;
  // Utilidades compartidas con tools/art-build.js (generador de imágenes)
  ART._ = { seeded, f, pick, leaf, branch, EUCA, OLIVE };

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


  /* ---------- Paloma en acuarela: 4 cuadros en una sola imagen ---------- */
  // Cuadros: 0 alas arriba · 1 alas al medio · 2 alas abajo · 3 posada.
  // Se muestra un cuadro moviendo la imagen (motion.js hace el aleteo).
  ART.dove = () => `<div class="pd"><img src="img/doves.webp" alt="" width="1896" height="650" draggable="false"></div>`;

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

  ART.sprig = () => `<img class="sprig-img" src="img/sprig.webp" alt="" width="900" height="193" draggable="false">`;

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
