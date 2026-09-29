/* ============================================================
   Coreografía profesional con GSAP 3.15
   Principios: una sola familia de curvas, un foco a la vez,
   solo transform/opacity en lo que se mueve cada cuadro,
   bucles mínimos y sutiles, y orden narrativo claro.

   Carga:     monograma que se escribe con el progreso real
              (loader.js) → el sobre aparece.
   Apertura:  sello que se agrieta y se parte (física real) →
              solapa 3D → la carta sale → el sobre baja y se va →
              la carta viaja al centro → destello de luz → tarjeta.
   Tarjeta:   papel → flores que aparecen por capas → marcos dorados →
              foto con revelado líquido (WebGL) y corona →
              palomas que llegan volando →
              "Bautizo" escrito a mano → cinta → texto.
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const UI = window.UI, reduce = UI.reduce, LITE = UI.LITE;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const intro = $("#intro"), openBtn = $("#openBtn"), quietBtn = $("#openQuiet"), musicBtn = $("#musicBtn");
  const sfx = (name, arg) => window.SFX && SFX[name](arg);
  // La pantalla de carga avisa cuándo empezar. Si algo fallara, a los 12 s se retira igual
  // (la carga espera como máximo 7 s más su salida).
  const whenReady = Promise.race([UI.ready || Promise.resolve(), new Promise((r) => setTimeout(() => {
    const l = $("#loader");
    if (l) l.hidden = true;
    r();
  }, 12000))]);
  // Mientras carga, el sobre no recibe foco ni toques; si alguien alcanza a pedirlo, se recuerda
  const introCtrls = [$(".env-stage"), quietBtn];
  introCtrls.forEach((el) => { el.inert = true; });
  let wanted = null;
  const release = () => { introCtrls.forEach((el) => { el.inert = false; }); };
  const mainEl = $("#main");
  mainEl.inert = true;
  const focusMain = () => { mainEl.inert = false; mainEl.setAttribute("tabindex", "-1"); mainEl.focus({ preventScroll: true }); };
  let lenis = null;

  function unlock() {
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    if (lenis) lenis.start();
  }
  function goTo(el) {
    if (lenis) lenis.scrollTo(el, { offset: -12, duration: 1.8 });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }
  $$("[data-goto]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); goTo($(a.getAttribute("href"))); }));

  // Sin GSAP o con "reducir movimiento": apertura directa, todo visible
  if (!window.gsap || reduce) {
    let ok = false, done = false;
    const direct = (withSound) => {
      if (!ok) { wanted = withSound; return; }
      if (done) return;
      done = true;
      intro.hidden = true;
      unlock();
      UI.setSound(withSound);
      musicBtn.classList.add("is-shown");
      focusMain();
    };
    openBtn.addEventListener("click", () => direct(true));
    quietBtn.addEventListener("click", () => direct(false));
    whenReady.then(() => {
      ok = true;
      release();
      document.body.classList.remove("is-loading");
      if (wanted !== null) direct(wanted);
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, SplitText, CustomEase, Physics2DPlugin);
  gsap.config({ force3D: true });
  CustomEase.create("out", "0.16,1,0.3,1");     // salida larga y suave (entradas)
  CustomEase.create("inOut", "0.76,0,0.24,1");  // transiciones de estado
  CustomEase.create("soft", "0.33,1,0.68,1");   // movimientos secundarios
  gsap.defaults({ ease: "out", duration: 1.2 });

  // Scroll suave en computadora, sincronizado con ScrollTrigger (en táctil se usa el nativo)
  if (window.Lenis && !isTouch && !LITE) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    UI.lenis = lenis;
  }

  /* ================= ORO QUE REACCIONA A LA INCLINACIÓN ================= */
  // Solo se actualiza lo que está a la vista (un IntersectionObserver lo sabe), a ~30 cuadros
  // por segundo y con cambios redondeados: el brillo se ve igual y cuesta mucho menos.
  const shiny = [
    ...$$(".foil-grad").map((g) => ({ box: g.closest("svg"), kind: "g", el: g, w: Number(g.dataset.w || 1) })),
    ...$$(".seal-face, #photoRing, #coin").map((el) => ({ box: el, kind: "v", el }))
  ];
  const inView = new Set();
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target))));
    new Set(shiny.map((s) => s.box)).forEach((b) => io.observe(b));
  } else shiny.forEach((s) => inView.add(s.box));
  const tilt = (UI.tilt = { x: 0, y: 0, auto: -1.1 });
  let lastKey = "", lastT = 0;
  gsap.ticker.add((time) => {
    if (time - lastT < 0.032) return;
    lastT = time;
    const sx = Math.max(-1.6, Math.min(1.6, tilt.x + tilt.auto)), sy = tilt.y;
    const key = sx.toFixed(2) + sy.toFixed(2);
    if (key === lastKey) return;
    lastKey = key;
    const lx = (34 + sx * 18).toFixed(1) + "%", ly = (28 + sy * 14).toFixed(1) + "%";
    for (const s of shiny) {
      if (!inView.has(s.box)) continue;
      if (s.kind === "g") s.el.setAttribute("gradientTransform", `translate(${(sx * 0.32 * s.w).toFixed(1)} 0)`);
      else { s.el.style.setProperty("--lx", lx); s.el.style.setProperty("--ly", ly); }
    }
  });
  // Un destello lento que recorre el oro de vez en cuando
  gsap.to(tilt, { auto: 1.1, duration: 2.6, ease: "inOut", yoyo: true, repeat: -1, repeatDelay: 3.5, delay: 1 });
  const tx = gsap.quickTo(tilt, "x", { duration: 1, ease: "power3.out" });
  const ty = gsap.quickTo(tilt, "y", { duration: 1, ease: "power3.out" });
  const env = $("#envelope");
  const envRX = gsap.quickTo(env, "rotationX", { duration: 1.2, ease: "power3.out" });
  const envRY = gsap.quickTo(env, "rotationY", { duration: 1.2, ease: "power3.out" });
  // El sobre se inclina solo mientras espera; al abrirlo queda quieto (si no, la carta
  // salía torcida y el acercamiento se descentraba en celulares con giroscopio).
  let introActive = true, envTilt = true, layerTilt = null;
  const envK = isTouch ? 0.6 : 1;
  function applyTilt(nx, ny) {
    tx(nx); ty(ny);
    if (introActive) { if (envTilt) { envRY(nx * 8 * envK); envRX(-ny * 6 * envK); } }
    else if (layerTilt) layerTilt(nx, ny);
  }
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") applyTilt((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  });
  // Giroscopio: se mide la diferencia con la posición en que la persona sostiene el celular
  // (y esa referencia se re-centra despacio). Así, en reposo, el sobre se ve derecho.
  let gyro = false;
  function listenGyro() {
    if (gyro) return;
    gyro = true;
    let base = null, last = 0;
    const clamp1 = gsap.utils.clamp(-1, 1);
    const wrap = (d, r) => ((((d + r) % (2 * r)) + 2 * r) % (2 * r)) - r;
    addEventListener("deviceorientation", (e) => {
      if (e.gamma == null || e.beta == null) return;
      const now = performance.now(), dt = Math.min(0.5, (now - (last || now)) / 1000);
      last = now;
      if (!base) base = { b: e.beta, g: e.gamma };
      let db = wrap(e.beta - base.b, 180), dg = wrap(e.gamma - base.g, 90);
      // Un salto brusco (celular volteado o que pasa por la vertical) reinicia la referencia
      if (Math.abs(db) > 45 || Math.abs(dg) > 45) { base = { b: e.beta, g: e.gamma }; db = dg = 0; }
      const k = 1 - Math.exp(-dt / 2.5); // la referencia se re-centra en unos segundos
      base.b += db * k;
      base.g += dg * k;
      applyTilt(clamp1(dg / 25), clamp1(db / 25));
    });
  }
  // En iPhone el giroscopio pide permiso con un cuadro del sistema: no se pide (taparía la apertura)
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== "function") listenGyro();

  /* ================= SOBRE EN REPOSO ================= */
  const stage = $(".env-stage"), letter = $("#envLetter"), flap = $("#envFlap"), seal = $("#seal");
  // Capas separadas en profundidad: al inclinarse el sobre en 3D el sello siempre queda
  // encima (si no, la solapa podía "tapar" el sello y el toque no llegaba).
  gsap.set(letter, { z: 1 });
  gsap.set(flap, { z: 3 });
  gsap.set(seal, { z: 6 });
  gsap.set(".seal-crack path", { drawSVG: "0%" });
  // Todo arranca en pausa: se reproduce cuando la pantalla de carga se retira
  const idle = gsap.timeline({ paused: true })
    .from(".intro-glow", { opacity: 0, scale: 0.7, duration: 2.2 })
    .from("#introTo", { opacity: 0, y: 14, duration: 1.4 }, 0.2)
    .from(env, { opacity: 0, y: 40, scale: 0.95, duration: 1.8 }, 0.35)
    .from(seal, { opacity: 0, scale: 0.7, duration: 1.4 }, 1.05)
    .from(".intro-cta > *", { opacity: 0, y: 8, duration: 1.2, stagger: 0.14 }, 1.4);
  const float = gsap.to(stage, { y: -6, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2, paused: true });
  const sealPulse = gsap.to(".seal-glow", { opacity: 0.5, scale: 1.06, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.2, paused: true });

  /* ================= EL SELLO SE PARTE ================= */
  function breakSeal() {
    sealPulse.kill();
    const tl = gsap.timeline();
    tl.call(sfx, ["crack"], 0.08)
      .to(seal, { scale: 0.93, duration: 0.14, ease: "power2.in" }, 0)
      .to(".seal-glow", { opacity: 1, scale: 1.2, duration: 0.3, ease: "soft" }, 0.06)
      .to(".seal-crack path", { drawSVG: "100%", duration: 0.2, ease: "power1.in" }, 0.1)
      .to(seal, { scale: 1, duration: 0.35, ease: "soft" }, 0.3)
      .set(".seal-crack", { opacity: 0 }, 0.34)
      .to(".seal-half.l", { physics2D: { velocity: 170, angle: -125, gravity: 1300 }, rotation: -95, duration: 1.15, ease: "none" }, 0.32)
      .to(".seal-half.r", { physics2D: { velocity: 170, angle: -55, gravity: 1300 }, rotation: 95, duration: 1.15, ease: "none" }, 0.32)
      .to(".seal-half", { opacity: 0, duration: 0.45, ease: "power1.in" }, 0.95)
      .to(".seal-glow", { opacity: 0, scale: 1.9, duration: 1, ease: "soft" }, 0.36);
    const box = $("#crumbs");
    for (let i = 0; i < 9; i++) {
      const c = document.createElement("i");
      c.className = "crumb";
      c.style.setProperty("--s", rand(3, 7).toFixed(1) + "px");
      box.appendChild(c);
      tl.fromTo(c, { x: rand(-8, 8), y: rand(-12, 12), opacity: 1 },
        { physics2D: { velocity: rand(90, 230), angle: rand(-165, -15), gravity: 1100 }, rotation: rand(-220, 220), duration: 1.2, ease: "none" }, 0.33)
        .to(c, { opacity: 0, duration: 0.4 }, 1.05);
    }
    return tl;
  }

  /* ================= SOLAPA, CARTA Y LUZ ================= */
  // La carta sale, el sobre baja y se desvanece, la carta viaja al centro de la pantalla
  // y crece un poco; un destello cálido la cubre y, al disiparse, ya está la tarjeta.
  const RISE = -64;
  // Distancia para dejar la carta en el centro (se calcula al momento: sirve en cualquier pantalla)
  function letterToCenter() {
    const r = letter.getBoundingClientRect(), h = letter.offsetHeight;
    const pending = ((RISE - gsap.getProperty(letter, "yPercent")) / 100) * h;
    return innerHeight * 0.47 - (r.top + r.height / 2 + pending);
  }
  const letterGrow = () => gsap.utils.clamp(1, 1.3, (innerWidth * 0.84) / letter.offsetWidth);
  function openEnvelope() {
    return gsap.timeline()
      .to(["#introTo", ".intro-cta"], { opacity: 0, y: -8, duration: 0.6, ease: "soft" }, 0)
      .to(env, { rotationX: 0, rotationY: 0, duration: 0.6, ease: "soft", overwrite: "auto" }, 0)
      // La solapa se abre en 3D
      .call(sfx, ["paper", 0.8], 0.4)
      .to(flap, { rotationX: 180, duration: 1, ease: "inOut" }, 0.4)
      .set(flap, { zIndex: 0, z: -1 }, 0.9)
      // La carta sale del sobre
      .call(sfx, ["paper", 1.1], 1)
      .to(letter, { yPercent: RISE, duration: 1.2 }, 1)
      // El sobre baja y se desvanece; la carta va al centro y crece
      .call(() => env.classList.add("is-open"), null, 1.55)
      .to([".env-back", ".env-front", flap], { y: 90, duration: 1.1, ease: "inOut" }, 1.55)
      .to([".env-back", ".env-front", ".flap-face"], { opacity: 0, duration: 1.1, ease: "inOut" }, 1.55)
      .to(letter, { y: letterToCenter, scale: letterGrow, duration: 1.3, ease: "inOut" }, 1.75)
      .to(".intro-glow", { opacity: 0.4, duration: 1.2, ease: "soft" }, 1.6)
      // Destello cálido y fundido a la tarjeta
      .call(sfx, ["glint"], 2.4)
      .to("#bloom", { opacity: 1, scale: 1, duration: 1.1, ease: "power2.in" }, 2.35)
      .to(letter, { opacity: 0, duration: 0.5, ease: "power1.in" }, 2.95)
      .to(intro, { autoAlpha: 0, duration: 0.9, ease: "soft" }, 3.25)
      .set(intro, { display: "none" });
  }

  /* ================= PALOMAS: ALETEO CUADRO A CUADRO (ACUARELA) ================= */
  // Un ciclo: alas arriba → medio → abajo → medio. Cada cuadro dura "s" segundos.
  // La imagen tiene 4 cuadros en fila; se muestra uno moviéndola de a 25% (solo transform).
  const frame = (img, k) => gsap.set(img, { xPercent: -25 * k });
  function flapCycle(root, s) {
    const img = $(".pd img", root);
    const tl = gsap.timeline({ paused: true, repeat: -1 });
    [0, 1, 2, 1].forEach((k, i) => tl.set(img, { xPercent: -25 * k }, i * s));
    return tl.set({}, {}, 4 * s); // largo del ciclo
  }
  // Posada: alas recogidas
  function foldWings(root) { frame($(".pd img", root), 3); }

  /* ================= ESCRITURA A MANO ================= */
  // Cada letra se revela dibujando su máscara; la duración depende del largo del trazo
  function writeScript(svg) {
    const tl = gsap.timeline();
    let t = 0;
    $$(".gm", svg).forEach((p) => {
      const d = gsap.utils.clamp(0.32, 0.95, p.getTotalLength() / 950);
      tl.fromTo(p, { drawSVG: "0%" }, { drawSVG: "100%", duration: d, ease: "sine.inOut" }, t);
      t += d * 0.6;
    });
    return tl;
  }
  UI.writeScript = (el) => writeScript($("svg", el));

  /* ================= ESTADOS INICIALES ================= */
  const split = {};
  // Textos divididos en líneas: si antes de animarlos cambia el ancho (se gira el celular)
  // o llegan tarde las fuentes, se vuelven a dividir para que los cortes coincidan.
  const lines = {};
  function lineSplit(key, sel) {
    const o = lines[key] || (lines[key] = { sel, s: null, busy: false, done: false });
    if (o.s) o.s.revert();
    o.s = SplitText.create(sel, { type: "lines", mask: "lines" });
    gsap.set(o.s.lines, { yPercent: 110 });
    return o;
  }
  const finishLines = (o) => { o.done = true; o.s.revert(); };
  const resplit = () => Object.keys(lines).forEach((k) => { const o = lines[k]; if (!o.busy && !o.done) lineSplit(k, o.sel); });
  let lastW = innerWidth, resizeT = 0;
  addEventListener("resize", () => {
    if (innerWidth === lastW) return; // en celular la barra del navegador cambia solo el alto
    lastW = innerWidth;
    clearTimeout(resizeT);
    resizeT = setTimeout(resplit, 200);
  });
  const perched = $$(".dove.perch .dove-in");
  let heroReadyAt = Infinity;
  function prepare() {
    gsap.set(".invite", { opacity: 0, y: 40, scale: 0.985 });
    gsap.set(".floral .lay", { opacity: 0, scale: 0.9, rotation: -4, transformOrigin: "0% 0%" });
    gsap.set(".frame .draw", { drawSVG: "0%" });
    gsap.set(".glow", { opacity: 0, scale: 0.7 });
    gsap.set("#photoRing", { opacity: 0, scale: 0.92 });
    if (!UI.photoReveal) gsap.set("#mainPhoto > *", { opacity: 0, scale: 1.1 });
    gsap.set(".wreath", { opacity: 0, scale: 0.86, rotation: -18 });
    gsap.set(perched, { opacity: 0 });
    gsap.set(".title .gm", { drawSVG: "0%" });
    gsap.set("#ribbon", { opacity: 0 });
    gsap.set(".ribbon-art", { scaleX: 0.78 });
    split.name = SplitText.create(".rn-text", { type: "words,chars", mask: "words" });
    gsap.set(split.name.chars, { yPercent: 110 });
    lineSplit("invite", ".invite-text");
    gsap.set(".bear", { opacity: 0, y: 24 });
    gsap.set([".splat", ".sparkles", ".scroll-cue"], { opacity: 0 });
    // Fecha, familia y botón (se revelan al llegar a ellos)
    gsap.set(".date-side i", { scaleX: 0 });
    gsap.set(".date-side.left i", { transformOrigin: "100% 50%" });
    gsap.set(".date-side.right i", { transformOrigin: "0% 50%" });
    gsap.set(".date-side span", { opacity: 0, y: 10 });
    gsap.set("#coin", { opacity: 0, scale: 0.86, y: 10 });
    gsap.set(".month-arc", { opacity: 0 });
    gsap.set(".month-arc text", { letterSpacing: "22px" });
    gsap.set("#family > div", { opacity: 0, y: 22 });
    gsap.set(".cross .draw", { drawSVG: "0%", fillOpacity: 0 });
    gsap.set("#heroCta", { opacity: 0, y: 16 });
    // Secciones
    gsap.set(".sprig", { scaleX: 0, opacity: 0 });
    gsap.set(".sec-title", { clipPath: "polygon(0% -40%, 0% -40%, 0% 140%, 0% 140%)", y: 10 });
    lineSplit("verse", ".verse");
    lineSplit("lead", ".lead");
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resplit);
    gsap.set([".verse-ref", ".date-long", ".deadline"], { opacity: 0, y: 14 });
    gsap.set(".unit", { opacity: 0, y: 26 });
    gsap.set(".event", { opacity: 0, y: 44 });
    gsap.set(".event-icon .draw", { drawSVG: "0%" });
    gsap.set(".cal > *", { opacity: 0, y: 16 });
    gsap.set("#rsvpCard", { opacity: 0, y: 50 });
    gsap.set(".foot > *", { opacity: 0, y: 16 });
  }

  /* ================= ENTRADA DE LA TARJETA ================= */
  function dovesIn() {
    const tl = gsap.timeline().call(sfx, ["flutter", 10], 0.1);
    perched.forEach((d, i) => {
      const cyc = flapCycle(d, 0.085);
      const at = i * 0.3;
      tl.call(() => cyc.play(0), null, at)
        .to(d, { opacity: 1, duration: 0.5, ease: "soft" }, at)
        .fromTo(d, { rotation: -14, scale: 0.72 }, {
          motionPath: { path: [{ x: -230, y: -180 }, { x: -120, y: -70 }, { x: -34, y: -20 }, { x: 0, y: 0 }], curviness: 1.3 },
          rotation: 0, scale: 1, duration: 2.5, ease: "soft"
        }, at)
        .to(cyc, { timeScale: 0.45, duration: 0.9, ease: "power1.in" }, at + 1.6)
        .add(() => { cyc.kill(); foldWings(d, 0.45); }, at + 2.5);
    });
    return tl;
  }

  // Foto: revelado líquido con WebGL si está disponible; si no, un fundido limpio
  function photoIn() {
    if (UI.photoReveal) return UI.photoReveal();
    UI.photoDone = true;
    return gsap.to("#mainPhoto > *", { opacity: 1, scale: 1, duration: 1.8 });
  }

  function heroIn() {
    const title = $(".title svg");
    lines.invite.busy = true; // desde aquí sus líneas ya no se vuelven a dividir
    return gsap.timeline()
      .to(".invite", { opacity: 1, y: 0, scale: 1, duration: 1.6 }, 0)
      // Flores por capas (fondo → medio → frente), primero la esquina de arriba
      .to(".floral.tl .lay", { opacity: 1, scale: 1, rotation: 0, duration: 2.2, stagger: 0.16 }, 0.1)
      .to(".floral.br .lay", { opacity: 1, scale: 1, rotation: 0, duration: 2.2, stagger: 0.16 }, 0.4)
      .to(".frame .draw", { drawSVG: "100%", duration: 2.4, ease: "inOut", stagger: 0.06 }, 0.4)
      .to(".glow", { opacity: 1, scale: 1, duration: 2.2 }, 0.3)
      .to("#photoRing", { opacity: 1, scale: 1, duration: 1.6 }, 0.35)
      .add(photoIn(), 0.5)
      .to(".wreath", { opacity: 1, scale: 1, rotation: 0, duration: 2 }, 0.6)
      .add(dovesIn(), 1.1)
      .add(writeScript(title), 1.8)
      .to("#ribbon", { opacity: 1, duration: 0.7, ease: "soft" }, 3.8)
      .to(".ribbon-art", { scaleX: 1, duration: 1.1 }, 3.8)
      .to(split.name.chars, { yPercent: 0, duration: 1, stagger: 0.03, onComplete: () => split.name.revert() }, 4.55)
      .to(lines.invite.s.lines, { yPercent: 0, duration: 1.2, stagger: 0.1, onComplete: () => finishLines(lines.invite) }, 4.7)
      .to(".bear", { opacity: 1, y: 0, duration: 1.4 }, 4.9)
      .to([".splat", ".sparkles"], { opacity: 1, duration: 2, ease: "soft" }, 5)
      .call(startLoops, null, 5.5);
  }

  /* ================= BUCLES SUTILES ================= */
  function startLoops() {
    gsap.to(".glow", { opacity: 0.7, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(perched, { y: -5, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 1.1 });
    perched.forEach((d) => {
      const burst = flapCycle(d, 0.12).repeat(1);
      const next = () => gsap.delayedCall(rand(4, 8), () => burst.restart());
      burst.eventCallback("onComplete", () => { foldWings(d, 0.3); next(); });
      next();
    });
    gsap.to(".bear", { rotation: 1.6, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    if (!LITE) {
      gsap.to(".floral .lay.front", { rotation: -0.6, duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      const q = $$(".floral .lay.mid, .floral .lay.front").map((el) => ({
        k: el.classList.contains("front") ? 10 : 5,
        x: gsap.quickTo(el, "x", { duration: 1.6, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.6, ease: "power3.out" })
      }));
      layerTilt = (nx, ny) => q.forEach((l) => { l.x(nx * l.k); l.y(ny * l.k); });
    }
    startLeaves();
    if (UI.lightsOn) UI.lightsOn();
  }

  /* ================= REVELADOS AL HACER SCROLL ================= */
  // Si un bloque de la tarjeta ya está a la vista, espera a que termine la entrada (orden narrativo)
  // "tl" puede ser una animación ya creada o una función que la crea en ese momento
  function reveal(trigger, tl, start, inHero) {
    const make = typeof tl === "function" ? tl : null;
    if (!make) tl.pause();
    ScrollTrigger.create({
      trigger, start: start || "top 86%", once: true,
      onEnter: () => gsap.delayedCall(inHero ? Math.max(0, (heroReadyAt - performance.now()) / 1000) : 0, () => (make ? make() : tl.play()))
    });
  }
  function initScroll() {
    reveal("#dateRow", gsap.timeline()
      .to(".date-side i", { scaleX: 1, duration: 1.3, ease: "inOut", stagger: 0.06 })
      .to(".date-side span", { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.35)
      .to("#coin", { opacity: 1, scale: 1, y: 0, duration: 1.5 }, 0.15)
      .to(".month-arc", { opacity: 1, duration: 1 }, 0.5)
      .to(".month-arc text", { letterSpacing: "6px", duration: 1.6 }, 0.5), "top 92%", true);
    reveal("#family", gsap.timeline()
      .to("#family > div", { opacity: 1, y: 0, duration: 1.2, stagger: 0.14 })
      .to(".cross .draw", { drawSVG: "100%", duration: 1.4, ease: "inOut" }, 0.1)
      .to(".cross .draw", { fillOpacity: 1, duration: 1, ease: "soft" }, 1)
      .to("#heroCta", { opacity: 1, y: 0, duration: 1.1 }, 0.7)
      .to(".scroll-cue", { opacity: 1, duration: 1 }, 1.2), "top 94%", true);

    $$(".section").forEach((sec) => {
      const tl = gsap.timeline(), sprig = $(".sprig", sec), title = $(".sec-title", sec);
      if (sprig) tl.to(sprig, { scaleX: 1, opacity: 1, duration: 1.4 }, 0);
      if (title) tl.to(title, { clipPath: "polygon(0% -40%, 110% -40%, 110% 140%, 0% 140%)", y: 0, duration: 1.7, ease: "inOut" }, 0.2);
      reveal(sec, tl, "top 80%");
    });
    const lineIn = (o, d, st) => () => { o.busy = true; return gsap.to(o.s.lines, { yPercent: 0, duration: d, stagger: st, onComplete: () => finishLines(o) }); };
    reveal(".verse", lineIn(lines.verse, 1.3, 0.1));
    reveal(".verse-ref", gsap.to(".verse-ref", { opacity: 1, y: 0, duration: 1.1 }));
    reveal(".lead", lineIn(lines.lead, 1.2, 0.08));
    reveal(".flipclock", gsap.to(".unit", { opacity: 1, y: 0, duration: 1.2, stagger: 0.09 }));
    reveal(".date-long", gsap.to(".date-long", { opacity: 1, y: 0, duration: 1.1 }));
    reveal(".events", gsap.timeline()
      .to(".event", { opacity: 1, y: 0, duration: 1.4, stagger: 0.15 })
      .to(".event-icon .draw", { drawSVG: "100%", duration: 1.8, ease: "inOut", stagger: 0.04 }, 0.3));
    reveal(".cal", gsap.to(".cal > *", { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }));
    reveal("#rsvpCard", gsap.timeline()
      .to("#rsvpCard", { opacity: 1, y: 0, duration: 1.4 })
      .to(".deadline", { opacity: 1, y: 0, duration: 1 }, 0.6), "top 90%");
    reveal(".foot", gsap.timeline()
      .to(".foot > *", { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 })
      .to(".foot .sprig", { scaleX: 1, opacity: 1, duration: 1.4 }, 0), "top 94%");

    if (!LITE) {
      const scrub = { trigger: "#inicio", start: "top top", end: "bottom top", scrub: 0.6 };
      gsap.to(".floral.tl", { y: -50, ease: "none", scrollTrigger: scrub });
      gsap.to(".floral.br", { y: 36, ease: "none", scrollTrigger: scrub });
      gsap.to("#portrait", { y: -24, ease: "none", scrollTrigger: scrub });
    }
    ScrollTrigger.refresh();
  }

  /* ================= HOJAS QUE CAEN (pocas y lentas) ================= */
  function startLeaves() {
    const box = $("#leaves");
    for (let i = 0; i < (LITE ? 3 : 6); i++) {
      const d = document.createElement("div");
      d.className = "leaf-fall";
      d.style.setProperty("--sz", rand(16, 26).toFixed(0) + "px");
      d.innerHTML = window.ART.fallingLeaf(Math.random() < 0.55 ? "round" : "willow");
      box.appendChild(d);
      const dur = rand(18, 30), dir = Math.random() < 0.5 ? -1 : 1;
      gsap.set(d, { x: rand(0, innerWidth), y: -40, rotation: rand(0, 360), opacity: 0.85 });
      gsap.to(d, { y: innerHeight + 60, duration: dur, ease: "none", repeat: -1, delay: rand(0, 10) });
      gsap.to(d, { x: "+=" + rand(30, 70).toFixed(0), duration: rand(3, 5), ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(d, { rotation: "+=" + (dir * rand(120, 260)).toFixed(0), duration: dur, ease: "none", repeat: -1 });
    }
  }

  /* ================= SUELTA DE PALOMAS AL CONFIRMAR ================= */
  UI.releaseDoves = function (from, n) {
    const r = from.getBoundingClientRect(), layer = $("#flyLayer");
    sfx("flutter", 12);
    for (let i = 0; i < n; i++) {
      const w = rand(46, 78), d = document.createElement("div");
      d.className = "fly-dove";
      d.style.setProperty("--w", w.toFixed(0) + "px");
      d.innerHTML = window.ART.dove();
      layer.appendChild(d);
      const dir = i % 2 ? -1 : 1;
      if (dir < 0) gsap.set(d.firstElementChild, { scaleX: -1 });
      const sx = r.left + r.width / 2 + rand(-50, 50) - w / 2, sy = r.top + r.height / 2 - w * 0.4;
      const cyc = flapCycle(d, rand(0.07, 0.09)).play(rand(0, 0.3));
      gsap.set(d, { x: sx, y: sy, scale: 0.35, opacity: 0 });
      gsap.timeline({ delay: i * 0.16, onComplete: () => { cyc.kill(); d.remove(); } })
        .to(d, { opacity: 1, duration: 0.35, ease: "soft" }, 0)
        .to(d, {
          motionPath: { path: [{ x: sx, y: sy }, { x: sx + dir * rand(40, 130), y: sy - rand(130, 220) }, { x: sx + dir * rand(170, 380), y: -200 }], curviness: 1.4 },
          scale: rand(0.95, 1.35), rotation: dir * -8, duration: rand(2.6, 3.4), ease: "power1.in"
        }, 0)
        .to(d, { opacity: 0, duration: 0.6, ease: "soft" }, ">-0.6");
    }
  };

  /* ================= APERTURA ================= */
  // El sello abre con sonido; "Abrir sin música" abre sin él. Ambos son un gesto del
  // invitado, así el navegador permite reproducir la música.
  let ready = false, opened = false;
  function showMusicBtn() {
    musicBtn.classList.add("is-shown");
    gsap.from(musicBtn, { opacity: 0, scale: 0.6, duration: 1, ease: "out" });
  }
  function open(withSound) {
    if (!ready) { wanted = withSound; return; }
    if (opened) return;
    opened = true;
    // El sello deja de ser "tocable" (y el cursor vuelve a su forma normal)
    openBtn.style.pointerEvents = quietBtn.style.pointerEvents = "none";
    if (UI.cursorState) UI.cursorState("base");
    UI.setSound(withSound, 2.5);
    envTilt = false;
    UI.heroStarted = true;
    gsap.killTweensOf(env, "rotationX,rotationY");
    idle.progress(1).kill();
    float.kill();
    gsap.set(stage, { y: 0 });
    const HERO = 3;
    heroReadyAt = performance.now() + (HERO + 5.3) * 1000;
    gsap.timeline()
      .add(breakSeal(), 0)
      .add(openEnvelope(), 0.3)
      .add(heroIn(), HERO)
      .call(() => { unlock(); initScroll(); }, null, HERO - 0.1)
      .call(() => { intro.hidden = true; introActive = false; focusMain(); }, null, HERO + 1.5)
      .call(showMusicBtn, null, HERO + 5.6);
  }
  openBtn.addEventListener("click", () => open(true));
  quietBtn.addEventListener("click", () => open(false));
  let prepared = false;
  const prepareOnce = () => { if (!prepared) { prepared = true; prepare(); } };
  Promise.race([UI.fontsReady || Promise.resolve(), new Promise((r) => setTimeout(r, 7000))]).then(prepareOnce);
  whenReady.then(() => {
    prepareOnce();
    // Ya con la tarjeta en su estado inicial (casi invisible) se deja pintar debajo del sobre
    document.body.classList.remove("is-loading");
    ready = true;
    release();
    idle.play();
    float.play();
    sealPulse.play();
    if (wanted !== null) open(wanted);
  });
})();
