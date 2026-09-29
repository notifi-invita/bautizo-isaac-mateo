/* ============================================================
   WebGL sutil (sin librerías, ~2 shaders por efecto)
   1) Foto con revelado líquido: un borde orgánico con filo
      dorado avanza desde el centro; al pasar el mouse la foto
      ondula como agua.
   2) Partículas de luz con profundidad: pocas, lentas y con
      desenfoque según la distancia; se mueven con el scroll.
   Se desactiva en celulares modestos, con "reducir movimiento",
   si no hay WebGL o con ?gl=0. Siempre hay alternativa en CSS.
   ============================================================ */
(function () {
  "use strict";
  const UI = window.UI, C = window.CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  let off = false;
  try { off = new URLSearchParams(location.search).get("gl") === "0"; } catch (_) {}
  if (!window.gsap || UI.LITE || UI.reduce || off) return;

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // La foto se dibuja a resolución completa (se mira de cerca); las luces son desenfocadas y basta 1x
  const DPR = Math.min(window.devicePixelRatio || 1, 3);

  function getGL(canvas) {
    const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" };
    try { return canvas.getContext("webgl", o) || canvas.getContext("experimental-webgl", o); } catch (_) { return null; }
  }
  function build(gl, vs, fs, attr) {
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, attr);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  }

  /* ======================= 1) FOTO CON REVELADO LÍQUIDO ======================= */
  const PHOTO_VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;
  // Alta precisión cuando existe (casi todos los celulares): el ruido la necesita
  const PHOTO_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uP, uT, uH;
uniform vec2 uM;
float hash(vec2 p){
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; }
  return v;
}
void main(){
  vec2 uv = vUv;
  // Onda de agua alrededor del mouse
  vec2 dm = uv - uM;
  float dl = length(dm) + 1e-4;
  float rip = sin(dl * 34. - uT * 4.2) * smoothstep(.45, 0., dl) * uH;
  uv += dm / dl * rip * .007;
  // Borde orgánico que avanza desde el centro
  float n = fbm(uv * 3.1 + vec2(0., uT * .11));
  float e = length(uv - .5) * 1.35 + (n - .5) * .55;
  float th = uP * 1.4 - .32;
  float m = smoothstep(th, th - .08, e);
  float near = smoothstep(.18, 0., abs(e - th)) * (1. - uP);
  // Leve acercamiento mientras revela y refracción cerca del borde
  vec2 tuv = (uv - .5) * (1. - .1 * (1. - uP));
  tuv += (vec2(n, fbm(uv * 3.1 + 4.3)) - .5) * .09 * near;
  vec3 photo = texture2D(uTex, tuv + .5).rgb;
  // Filo dorado que se apaga al terminar
  float rim = smoothstep(.05, 0., abs(e - th + .025)) * (1. - smoothstep(.8, 1., uP)) * .95;
  vec3 gold = mix(vec3(.66, .47, .24), vec3(.97, .87, .63), smoothstep(.3, .7, n));
  float a = rim + m * (1. - rim);
  gl_FragColor = vec4(gold * rim + photo * m * (1. - rim), a);
}`;

  const photoEl = $("#mainPhoto"), ringEl = $("#photoRing");
  let P = null;

  // Imagen fuente: la foto real recortada al cuadrado o un monograma dibujado igual que en CSS
  function makeSource(img) {
    const want = Math.max(512, Math.min(1024, Math.round(photoEl.clientWidth * DPR) || 640));
    const S = img ? Math.min(1024, img.naturalWidth, img.naturalHeight) : want;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const x = cv.getContext("2d");
    if (img) {
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      x.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, S, S);
      return cv;
    }
    const cx = S * 0.4, cy = S * 0.32, r = Math.hypot(S - cx, S - cy);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "#fffdf9"); g.addColorStop(0.62, "#e8eee9"); g.addColorStop(1, "#d3ddd5");
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    const fs = S * 0.4;
    x.font = `400 ${fs}px "Pinyon Script", cursive`;
    x.textAlign = "center";
    x.textBaseline = "alphabetic";
    const txt = C.initials || "IM", mt = x.measureText(txt);
    const asc = mt.actualBoundingBoxAscent || fs * 0.7, desc = mt.actualBoundingBoxDescent || fs * 0.2;
    const y = S / 2 + (asc - desc) / 2;
    const lg = x.createLinearGradient(S * 0.2, S * 0.3, S * 0.8, S * 0.7);
    lg.addColorStop(0, "#b8894e"); lg.addColorStop(0.5, "#dcbc84"); lg.addColorStop(1, "#94693a");
    x.fillStyle = lg;
    x.fillText(txt, S / 2, y);
    return cv;
  }

  function initPhoto(src) {
    const cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    const gl = getGL(cv);
    if (!gl) throw new Error("Sin WebGL");
    const { u } = build(gl, PHOTO_VS, PHOTO_FS, "aPos");
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u.uTex, 0);
    gl.clearColor(0, 0, 0, 0);
    photoEl.appendChild(cv);
    return { cv, gl, u, p: UI.photoDone ? 1 : 0, h: 0, mx: 0.5, my: 0.5, busy: false, w: 0, t0: performance.now() };
  }

  function sizePhoto() {
    const w = Math.round(photoEl.clientWidth * DPR);
    if (!w || w === P.w) return;
    P.w = P.cv.width = P.cv.height = w;
    P.gl.viewport(0, 0, w, w);
    drawPhoto();
  }
  function drawPhoto() {
    const { gl, u } = P;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.uP, P.p);
    gl.uniform1f(u.uT, ((performance.now() - P.t0) / 1000) % 600);
    gl.uniform1f(u.uH, P.h);
    gl.uniform2f(u.uM, P.mx, P.my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  // Solo se dibuja mientras algo cambia (revelado u onda del mouse)
  function tickPhoto() { if (P && (P.busy || P.h > 0.002) && !document.hidden) drawPhoto(); }

  // Si WebGL falla, vuelve la foto/monograma normal: con fundido si la tarjeta ya se está
  // mostrando; si no, queda oculto y motion.js lo revela con la animación de respaldo.
  function failPhoto() {
    if (P && P.tw) P.tw.kill();
    if (P && P.cv) P.cv.remove();
    photoEl.classList.remove("gl-on");
    P = null;
    delete UI.photoReveal;
    if (UI.heroStarted) gsap.to("#mainPhoto > *", { opacity: 1, scale: 1, duration: 1 });
    else gsap.set("#mainPhoto > *", { opacity: 0, scale: 1.1 });
  }

  UI.glReady = (async () => {
    try {
      const img = await (UI.photoReady || Promise.resolve(null));
      if (!img && document.fonts && document.fonts.load) await document.fonts.load('400 100px "Pinyon Script"').catch(() => {});
      P = initPhoto(makeSource(img));
      P.cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); failPhoto(); });
      photoEl.classList.add("gl-on");
      sizePhoto();
      if ("ResizeObserver" in window) new ResizeObserver(() => P && sizePhoto()).observe(photoEl);
      gsap.ticker.add(tickPhoto);
      UI.photoReveal = () => {
        const s = P;
        s.tw = gsap.to(s, {
          p: 1, duration: 2.8, ease: "power1.inOut",
          onStart: () => { s.busy = true; },
          onComplete: () => { s.busy = false; if (P === s) drawPhoto(); }
        });
        return s.tw;
      };
      if (fine) {
        const pos = (e) => {
          const r = photoEl.getBoundingClientRect();
          P.mx = (e.clientX - r.left) / r.width;
          P.my = 1 - (e.clientY - r.top) / r.height;
        };
        ringEl.addEventListener("pointerenter", (e) => { if (!P) return; pos(e); gsap.to(P, { h: 1, duration: 0.8, ease: "soft", overwrite: "auto" }); });
        ringEl.addEventListener("pointermove", (e) => P && pos(e));
        ringEl.addEventListener("pointerleave", () => P && gsap.to(P, { h: 0, duration: 1.6, ease: "soft", overwrite: "auto" }));
      }
    } catch (err) {
      console.warn("WebGL de la foto desactivado:", err);
      failPhoto();
    }
  })();

  /* ======================= 2) PARTÍCULAS DE LUZ ======================= */
  const LIGHT_VS = `
attribute vec4 aP;
uniform vec2 uRes, uTilt;
uniform float uT, uScroll, uDpr;
varying float vA, vZ;
void main(){
  float z = aP.z, s = aP.w;
  float y = fract(aP.y + uT * mix(.0035, .011, z) + uScroll / uRes.y * mix(.06, .42, z));
  float x = aP.x + sin(uT * mix(.12, .28, s) + s * 40.) * .025 * (.4 + z) + uTilt.x * .014 * z;
  y = y * 1.16 - .08 - uTilt.y * .01 * z;
  gl_Position = vec4(x * 2. - 1., y * 2. - 1., 0., 1.);
  gl_PointSize = mix(4., 30., z * z) * uDpr;
  vZ = z;
  vA = mix(.62, .2, z) * (.72 + .28 * sin(uT * (.5 + s) + s * 30.));
}`;
  const LIGHT_FS = `
precision mediump float;
varying float vA, vZ;
void main(){
  vec2 p = gl_PointCoord * 2. - 1.;
  float r2 = dot(p, p);
  if (r2 > 1.) discard;
  float r = sqrt(r2);
  float disc = 1. - smoothstep(1. - mix(.1, .5, vZ), 1., r);
  float core = exp(-r2 * 7.) * (1. - vZ * .8);
  float rim = smoothstep(.55, .95, r) * disc * vZ;
  float a = clamp((disc * .3 + rim * .28 + core * .75) * vA, 0., 1.);
  vec3 col = mix(vec3(.78, .6, .34), vec3(.99, .9, .7), clamp(core * 1.2, 0., 1.));
  gl_FragColor = vec4(col * a, a);
}`;

  const lc = $("#glLights");
  let L = null, frame = 0;
  function initLights() {
    const gl = getGL(lc);
    if (!gl) throw new Error("Sin WebGL");
    const { u } = build(gl, LIGHT_VS, LIGHT_FS, "aP");
    const N = fine ? 44 : 24, data = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      data[i * 4] = Math.random();
      data[i * 4 + 1] = Math.random();
      data[i * 4 + 2] = Math.pow(Math.random(), 1.5);
      data[i * 4 + 3] = Math.random();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform1f(u.uDpr, 1);
    lc.addEventListener("webglcontextlost", (e) => { e.preventDefault(); gsap.ticker.remove(drawLights); lc.style.display = "none"; });
    return { gl, u, N, w: 0, h: 0, t0: performance.now() };
  }
  function sizeLights() {
    const w = innerWidth, h = innerHeight;
    // En celulares la barra del navegador cambia el alto al hacer scroll: solo se ajusta si cambia mucho
    if (w === L.w && Math.abs(h - L.h) < 160) return;
    L.w = lc.width = w; L.h = lc.height = h;
    L.gl.viewport(0, 0, w, h);
  }
  function drawLights() {
    if (!L || document.hidden) return;
    if (!fine && (frame++ & 1)) return; // en táctil basta con 30 cuadros por segundo
    const { gl, u } = L, tl = UI.tilt || { x: 0, y: 0 };
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uRes, innerWidth, innerHeight);
    gl.uniform2f(u.uTilt, tl.x || 0, tl.y || 0);
    gl.uniform1f(u.uT, (performance.now() - L.t0) / 1000);
    gl.uniform1f(u.uScroll, window.scrollY || 0);
    gl.drawArrays(gl.POINTS, 0, L.N);
  }

  UI.lightsOn = function () {
    if (L) return;
    try { L = initLights(); } catch (err) { console.warn("Partículas desactivadas:", err); return; }
    sizeLights();
    addEventListener("resize", () => L && sizeLights());
    gsap.ticker.add(drawLights);
    gsap.to(lc, { opacity: 1, duration: 3, ease: "soft" });
  };
})();
