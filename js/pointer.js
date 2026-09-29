/* ============================================================
   Detalles para computadora (mouse):
   · cursor propio: punto + anillo que lo sigue con suavidad y
     crece sobre lo que se puede tocar ("Abrir" sobre el sello)
   · botones magnéticos que se acercan un poco al cursor
   · el relleno del botón nace desde donde entra el mouse
   · el texto rueda a una cursiva elegante al pasar encima
   En celulares no se activa nada de esto (no hay hover).
   ============================================================ */
(function () {
  "use strict";
  const UI = window.UI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sfx = () => window.SFX && SFX.tick();

  // Cambia el texto de un botón respetando el "rodillo" si existe
  UI.setLabel = function (el, text) {
    const a = el.querySelector(".roll-a"), b = el.querySelector(".roll-b");
    if (a && b) { a.textContent = text; b.textContent = text; }
    else el.textContent = text;
  };

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine || UI.reduce || !window.gsap) return;

  /* ---------- Texto que rueda a cursiva ---------- */
  function roll(el) {
    const text = el.textContent.trim();
    if (!text || el.children.length) return;
    const r = document.createElement("span"), a = document.createElement("span"), b = document.createElement("span");
    r.className = "roll"; a.className = "roll-a"; b.className = "roll-b";
    b.setAttribute("aria-hidden", "true");
    a.textContent = b.textContent = text;
    r.append(a, b);
    el.textContent = "";
    el.appendChild(r);
  }
  $$(".btn, .quiet-btn").forEach(roll);

  /* ---------- Botones magnéticos + relleno desde el cursor ---------- */
  $$(".btn, .quiet-btn, .music-btn").forEach((el) => {
    const st = { x: 0, y: 0 };
    const apply = () => { el.style.translate = `${st.x.toFixed(2)}px ${st.y.toFixed(2)}px`; };
    const k = el.classList.contains("big") ? 0.12 : 0.28, maxX = el.classList.contains("big") ? 8 : 14, maxY = 8;
    const origin = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--fx", (e.clientX - r.left).toFixed(1) + "px");
      el.style.setProperty("--fy", (e.clientY - r.top).toFixed(1) + "px");
      return r;
    };
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { origin(e); sfx(); } });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || el.disabled) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - st.x, cy = r.top + r.height / 2 - st.y;
      gsap.to(st, {
        x: gsap.utils.clamp(-maxX, maxX, (e.clientX - cx) * k),
        y: gsap.utils.clamp(-maxY, maxY, (e.clientY - cy) * k * 1.2),
        duration: 0.6, ease: "power3.out", overwrite: true, onUpdate: apply
      });
    });
    el.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      origin(e);
      gsap.to(st, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.45)", overwrite: true, onUpdate: apply });
    });
  });

  /* ---------- Cursor propio ---------- */
  const cur = $("#cursor");
  if (!cur) return;
  const ring = $(".cursor-ring", cur), dot = $(".cursor-dot", cur), label = $(".cursor-label", cur);
  label.textContent = "Abrir";
  const html = document.documentElement;
  const SCALE = { base: 0.5, hover: 0.9, seal: 1.55, text: 0.28 };
  let state = "base", visible = false, pressed = false;
  gsap.set(cur, { opacity: 0 });
  gsap.set(ring, { scale: SCALE.base });
  const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });
  const dx = gsap.quickSetter(dot, "x", "px"), dy = gsap.quickSetter(dot, "y", "px");

  function setState(s) {
    if (s === state) return;
    state = s;
    ring.classList.toggle("is-hover", s === "hover");
    ring.classList.toggle("is-seal", s === "seal");
    gsap.to(ring, { scale: SCALE[s] * (pressed ? 0.86 : 1), duration: 0.5, ease: "power3.out", overwrite: "auto" });
    gsap.to(dot, { scale: s === "seal" ? 0 : s === "hover" ? 0.6 : 1, duration: 0.3, ease: "power3.out", overwrite: "auto" });
  }
  UI.cursorState = setState;
  function show(on) {
    if (on === visible) return;
    visible = on;
    gsap.to(cur, { opacity: on ? 1 : 0, duration: 0.3, overwrite: "auto" });
  }

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (!html.classList.contains("has-cursor")) {
      html.classList.add("has-cursor");
      gsap.set(ring, { x: e.clientX, y: e.clientY });
    }
    dx(e.clientX); dy(e.clientY);
    rx(e.clientX); ry(e.clientY);
    show(true);
  }, { passive: true });
  // Si se usa el dedo en una pantalla táctil, vuelve el cursor normal
  addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") { html.classList.remove("has-cursor"); show(false); return; }
    pressed = true;
    gsap.to(ring, { scale: SCALE[state] * 0.86, duration: 0.2, ease: "power2.out", overwrite: "auto" });
  });
  addEventListener("pointerup", () => {
    if (!pressed) return;
    pressed = false;
    gsap.to(ring, { scale: SCALE[state], duration: 0.5, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
  });
  document.addEventListener("mouseleave", () => show(false));
  document.addEventListener("mouseenter", () => html.classList.contains("has-cursor") && show(true));

  const TEXT = 'input[type="text"], input:not([type]), textarea';
  const HOT = 'a, button, label, [role="button"], .chip, .gallery button';
  document.addEventListener("pointerover", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest("#openBtn")) setState("seal");
    else if (t.closest(TEXT)) setState("text");
    else if (t.closest(HOT) && !t.closest("[disabled]")) setState("hover");
    else setState("base");
  });
})();
