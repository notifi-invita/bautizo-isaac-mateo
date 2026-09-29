/* ============================================================
   Pantalla de carga con progreso real
   Espera fuentes, flores, corona, osito, foto y textura WebGL.
   El monograma "IM" se dibuja al ritmo del progreso (mínimo
   1,6 s para que se aprecie; máximo 7 s aunque algo falle).
   Expone UI.ready: se cumple cuando la pantalla se retira.
   ============================================================ */
(function () {
  "use strict";
  const UI = window.UI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const loader = $("#loader"), fillEl = $("#loaderFill"), pctEl = $("#loaderPct"), msgEl = $("#loaderMsg");
  const G = window.gsap, calm = UI.reduce || !G;
  const MIN = calm ? 0 : 1.6, MAX = 7;
  const t0 = performance.now();

  let resolveReady;
  UI.ready = new Promise((r) => (resolveReady = r));
  if (!loader) { resolveReady(); return; }

  /* ---------- Tareas con peso ---------- */
  const jobs = [];
  function track(p, w) {
    const j = { w: w || 1, done: false };
    jobs.push(j);
    Promise.resolve(p).catch(() => {}).then(() => { j.done = true; });
  }
  if (document.fonts && document.fonts.load) {
    ['400 1em "Pinyon Script"', '400 1em "Playfair Display"', 'italic 400 1em "Playfair Display"', '600 1em "Playfair Display"', '400 1em "Questrial"']
      .forEach((f) => track(document.fonts.load(f), 1));
  }
  // Imágenes de la tarjeta: se esperan cargadas y decodificadas (así no hay tirones al aparecer)
  $$("#main img").filter((img) => img.loading !== "lazy").forEach((img) => {
    const decoded = () => (img.decode ? img.decode().catch(() => {}) : null);
    track(img.complete ? decoded() : new Promise((res) => {
      img.addEventListener("load", () => Promise.resolve(decoded()).then(res), { once: true });
      img.addEventListener("error", res, { once: true });
    }), 1);
  });
  if (UI.photoReady) track(UI.photoReady, 2);
  if (UI.glReady) track(UI.glReady, 1);

  /* ---------- Dibujo del progreso ---------- */
  const paths = $$(".lm", loader).map((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len} ${len}`;
    p.style.strokeDashoffset = len;
    return { p, len };
  });
  loader.classList.add("is-live");
  let shown = 0, finished = false, lastPct = -1;
  function paint(v) {
    paths.forEach(({ p, len }) => { p.style.strokeDashoffset = (len * (1 - v)).toFixed(1); });
    fillEl.style.transform = `scaleX(${v.toFixed(4)})`;
    const pct = Math.round(v * 100);
    if (pct !== lastPct) { lastPct = pct; pctEl.textContent = pct + "%"; }
  }
  function frame() {
    if (finished) return;
    const t = (performance.now() - t0) / 1000;
    const total = jobs.reduce((a, j) => a + j.w, 0) || 1;
    const real = t >= MAX ? 1 : jobs.reduce((a, j) => a + (j.done ? j.w : 0), 0) / total;
    const target = Math.min(real, MIN ? Math.min(1, t / MIN) : 1);
    shown += (target - shown) * (calm ? 1 : 0.12);
    if (target >= 1 && shown > 0.996) shown = 1;
    paint(shown);
    if (shown >= 1) return finish();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Salida ---------- */
  function finish() {
    finished = true;
    msgEl.textContent = "Tu invitación está lista";
    if (calm) {
      loader.hidden = true;
      resolveReady();
      return;
    }
    G.timeline({ defaults: { ease: "power3.out" } })
      .to(".loader-mono .lm", { fillOpacity: 1, strokeOpacity: 0, duration: 0.7, ease: "power2.out" }, 0)
      .to(".loader-mono", { scale: 1.04, duration: 0.7 }, 0)
      .to([".loader-bar", ".loader-txt"], { opacity: 0, y: 8, duration: 0.5, ease: "power2.in" }, 0.25)
      .to(".loader-mono", { opacity: 0, scale: 0.9, y: -10, duration: 0.6, ease: "power3.in" }, 0.75)
      .to(loader, { opacity: 0, duration: 0.9, ease: "power2.inOut" }, 1.0)
      .call(resolveReady, null, 1.1)
      .set(loader, { display: "none" });
  }
})();
