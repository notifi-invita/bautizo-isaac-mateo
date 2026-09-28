/* ============================================================
   Coreografía con GSAP
   1. Sobre en reposo que responde al movimiento
   2. Sello de cera que se rompe, solapa 3D y carta que se vuelve página
   3. Entrada de la tarjeta: flores en capas, escritura a mano, cinta…
   4. Escenas al hacer scroll, hojas que caen y paloma viajera
   5. Oro que brilla según la inclinación del celular o el mouse
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const UI = window.UI, reduce = UI.reduce, LITE = UI.LITE;
  const intro = $("#intro"), seal = $("#openBtn");

  function unlock() {
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
  }
  $$("[data-goto]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    $(a.getAttribute("href")).scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }));

  // Sin GSAP o con movimiento reducido: apertura directa y todo visible
  if (!window.gsap || reduce) {
    seal.addEventListener("click", () => { intro.hidden = true; unlock(); UI.startMusic(); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, SplitText, CustomEase);
  CustomEase.create("silk", "0.22,1,0.36,1");
  CustomEase.create("inOutSilk", "0.65,0,0.35,1");

  /* ================= ORO QUE REACCIONA ================= */
  const foils = $$(".foil-grad");
  const tilt = { x: 0, y: 0, auto: 0 };
  let lastKey = "";
  gsap.ticker.add(() => {
    const sx = Math.max(-1.4, Math.min(1.4, tilt.x + tilt.auto)), sy = tilt.y;
    const key = sx.toFixed(3) + sy.toFixed(3);
    if (key === lastKey) return;
    lastKey = key;
    for (const g of foils) g.setAttribute("gradientTransform", `translate(${(sx * 0.35 * Number(g.dataset.w || 1)).toFixed(3)} 0)`);
    const root = document.documentElement.style;
    root.setProperty("--lx", (34 + sx * 20).toFixed(1) + "%");
    root.setProperty("--ly", (28 + sy * 16).toFixed(1) + "%");
  });
  gsap.fromTo(tilt, { auto: -0.6 }, { auto: 0.6, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1 });
  const tx = gsap.quickTo(tilt, "x", { duration: 0.9, ease: "power3.out" });
  const ty = gsap.quickTo(tilt, "y", { duration: 0.9, ease: "power3.out" });
  const env = $("#envelope");
  const envRX = gsap.quickTo(env, "rotationX", { duration: 1, ease: "power3.out" });
  const envRY = gsap.quickTo(env, "rotationY", { duration: 1, ease: "power3.out" });
  let introActive = true;
  function applyTilt(nx, ny) {
    tx(nx); ty(ny);
    if (introActive) { envRY(nx * 10); envRX(-ny * 8); }
  }
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") applyTilt((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  });
  let gyro = false;
  function listenGyro() {
    if (gyro) return;
    gyro = true;
    addEventListener("deviceorientation", (e) => {
      if (e.gamma == null) return;
      applyTilt(Math.max(-1, Math.min(1, e.gamma / 28)), Math.max(-1, Math.min(1, (e.beta - 45) / 28)));
    });
  }
  function askGyro() {
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") D.requestPermission().then((s) => s === "granted" && listenGyro()).catch(() => {});
    else if (D) listenGyro();
  }
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== "function") listenGyro();

  /* ================= SOBRE EN REPOSO ================= */
  const flap = $("#envFlap"), letter = $("#envLetter");
  const idle = gsap.timeline();
  idle.from(".intro-glow", { opacity: 0, scale: 0.6, duration: 1.8, ease: "silk" })
    .from("#introTo", { opacity: 0, y: 16, duration: 1.1, ease: "silk" }, 0.2)
    .from(env, { y: 70, rotation: -5, opacity: 0, scale: 0.88, duration: 1.4, ease: "back.out(1.3)" }, 0.3)
    .from(seal, { scale: 0, rotation: -120, duration: 1, ease: "back.out(2.2)" }, 1)
    .from(".intro-hint", { opacity: 0, y: 10, duration: 0.8 }, 1.4);
  const float = gsap.to(".env-stage", { y: -9, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6 });

  // Pedazos del sello (cuñas con borde irregular que comparten la cara del sello)
  const shardBox = $("#sealShards"), N = 7, cuts = [];
  for (let i = 0; i < N; i++) cuts.push((i / N) * 360 + rand(-9, 9));
  cuts.push(cuts[0] + 360);
  const shards = [];
  for (let i = 0; i < N; i++) {
    const a0 = cuts[i], a1 = cuts[i + 1], pts = ["50% 50%"];
    for (let k = 0; k <= 5; k++) {
      const a = ((a0 + ((a1 - a0) * k) / 5) * Math.PI) / 180, r = 50 * (0.95 + Math.random() * 0.07);
      pts.push(`${(50 + Math.cos(a) * r).toFixed(2)}% ${(50 + Math.sin(a) * r).toFixed(2)}%`);
    }
    const s = document.createElement("div");
    s.className = "shard";
    s.style.clipPath = `polygon(${pts.join(",")})`;
    s.innerHTML = $(".seal-face").innerHTML;
    shardBox.appendChild(s);
    shards.push({ el: s, mid: (((a0 + a1) / 2) * Math.PI) / 180 });
  }

  function shatter() {
    const tl = gsap.timeline();
    tl.to(seal, { scale: 0.86, duration: 0.14, ease: "power2.in" })
      .set(seal, { autoAlpha: 0 })
      .set(shards.map((s) => s.el), { opacity: 1 })
      .call(() => {
        const r = shardBox.getBoundingClientRect();
        UI.petals(r.left + r.width / 2, r.top + r.height / 2, 70, 9);
      });
    shards.forEach(({ el, mid }) => {
      const d = rand(80, 150), dx = Math.cos(mid) * d, dy = Math.sin(mid) * d;
      tl.to(el, {
        motionPath: { path: [{ x: 0, y: 0 }, { x: dx * 0.6, y: dy * 0.6 - 30 }, { x: dx, y: dy + 190 }], curviness: 1.3 },
        rotation: rand(-200, 200), scale: rand(0.55, 0.8), duration: rand(1, 1.3), ease: "power1.in"
      }, 0.15).to(el, { opacity: 0, duration: 0.4 }, 0.9);
    });
    return tl;
  }

  function openEnvelope() {
    const tl = gsap.timeline();
    tl.to(["#introTo", ".intro-hint"], { opacity: 0, y: -10, duration: 0.5, stagger: 0.05 }, 0)
      .to(env, { rotationX: 0, rotationY: 0, rotation: 0, duration: 0.5, ease: "power2.out" }, 0)
      .to(flap, { rotationX: 180, duration: 0.95, ease: "inOutSilk" }, 0.2)
      .set(flap, { zIndex: 0 }, 0.68)
      .to(letter, { yPercent: -64, duration: 1.1, ease: "silk" }, 0.95)
      .to(".intro-glow", { scale: 1.5, opacity: 0.9, duration: 1.4, ease: "silk" }, 0.9)
      .call(() => env.classList.add("open"), null, 1.9)
      .to([".env-back", ".env-front", flap], { y: 150, opacity: 0, duration: 0.8, ease: "power2.in" }, 1.9)
      .to(".env-letter-inner", { opacity: 0, duration: 0.35 }, 2)
      .to(letter, {
        y: () => { const r = letter.getBoundingClientRect(); return "+=" + (innerHeight / 2 - (r.top + r.height / 2)); },
        scale: () => { const r = letter.getBoundingClientRect(); return Math.max(innerWidth / r.width, innerHeight / r.height) * 1.25; },
        borderRadius: 0, duration: 1.05, ease: "inOutSilk"
      }, 2)
      .to(intro, { autoAlpha: 0, duration: 0.8, ease: "power1.inOut" }, 2.8)
      .set(intro, { display: "none" });
    return tl;
  }

  /* ================= ESTADOS INICIALES ================= */
  const glyphs = $$(".title .gl");
  const lay = { back: $$(".floral .lay.back"), mid: $$(".floral .lay.mid"), front: $$(".floral .lay.front") };
  const split = {};
  const wingTweens = [];
  function flapWings(root, speed, amount) {
    const front = $$(".wing.front", root), back = $$(".wing.back", root);
    const a = gsap.to(front, { scaleY: amount, rotation: -5, svgOrigin: "122 92", duration: speed, ease: "sine.inOut", yoyo: true, repeat: -1 });
    const b = gsap.to(back, { scaleY: amount, rotation: -5, svgOrigin: "112 86", duration: speed, ease: "sine.inOut", yoyo: true, repeat: -1, delay: speed * 0.25 });
    return [a, b];
  }

  function prepare() {
    gsap.set($$(".floral .lay"), { scale: 0.35, rotation: -14, opacity: 0, transformOrigin: "0% 0%" });
    gsap.set(".frame .draw", { drawSVG: "0%" });
    gsap.set([".splat", ".sparkles", ".scroll-cue"], { opacity: 0 });
    gsap.set(".rays", { opacity: 0, scale: 0.6 });
    gsap.set(".wreath .stem", { drawSVG: "0%" });
    gsap.set(".wreath .lf", { scale: 0 });
    gsap.set("#photoRing", { scale: 0.4, opacity: 0 });
    gsap.set(".dove.perch .dove-in", { opacity: 0 });
    gsap.set(".bear", { opacity: 0, scale: 0.3, y: 30, transformOrigin: "50% 100%" });
    gsap.set(glyphs, { drawSVG: "0%", fillOpacity: 0, strokeOpacity: 1 });
    gsap.set("#ribbon", { clipPath: "inset(0% 50% 0% 50%)" });
    split.name = SplitText.create(".rn-text", { type: "words,chars" });
    gsap.set(split.name.chars, { opacity: 0, y: 18, rotationX: -80 });
    split.invite = SplitText.create(".invite-text", { type: "lines", mask: "lines" });
    gsap.set(split.invite.lines, { yPercent: 115 });
    gsap.set(".date-side i", { scaleX: 0 });
    gsap.set(".date-side.left i", { transformOrigin: "100% 50%" });
    gsap.set(".date-side.right i", { transformOrigin: "0% 50%" });
    gsap.set(".date-side span", { opacity: 0, y: 8 });
    gsap.set("#coin", { opacity: 0, rotationY: -540, scale: 0.3 });
    gsap.set(".month-arc", { opacity: 0 });
    gsap.set(".month-arc text", { letterSpacing: "26px" });
    gsap.set("#family > div", { opacity: 0, y: 24 });
    gsap.set(".cross .draw", { drawSVG: "0%", fillOpacity: 0 });
    gsap.set("#heroCta", { opacity: 0, scale: 0.85 });
    // Secciones
    gsap.set(".section .wash", { opacity: 0, scale: 0.75, rotation: -4, clipPath: "circle(0% at 50% 50%)" });
    gsap.set(".sprig", { scaleX: 0, opacity: 0 });
    gsap.set(".sec-title", { clipPath: "polygon(0% -40%, 0% -40%, 0% 140%, 0% 140%)", y: 12 });
    split.verse = SplitText.create(".verse", { type: "lines", mask: "lines" });
    split.lead = SplitText.create(".lead", { type: "lines", mask: "lines" });
    gsap.set([...split.verse.lines, ...split.lead.lines], { yPercent: 115 });
    gsap.set([".verse-ref", ".date-long", ".deadline"], { opacity: 0, y: 14 });
    gsap.set(".unit", { opacity: 0, rotationX: -80, transformOrigin: "50% 0%" });
    gsap.set(".event", { opacity: 0, y: 60, rotationX: 18, transformOrigin: "50% 100%" });
    gsap.set(".event-icon .draw", { drawSVG: "0%" });
    gsap.set(".cal > *", { opacity: 0, y: 16 });
    gsap.set("#rsvpCard", { opacity: 0, y: 70 });
    gsap.set(".foot > *", { opacity: 0, y: 16 });
    $$(".dove.perch").forEach((d) => wingTweens.push(...flapWings(d, 0.85, 0.78)));
  }

  /* ================= ENTRADA DE LA TARJETA ================= */
  function writeTitle(targets) {
    return gsap.timeline()
      .to(targets, { drawSVG: "100%", duration: 0.9, ease: "power1.inOut", stagger: 0.2 })
      .to(targets, { fillOpacity: 1, duration: 0.8, ease: "power1.out", stagger: 0.14 }, 0.7)
      .to(targets, { strokeOpacity: 0.2, duration: 0.8 }, ">-0.4");
  }
  UI.writeScript = function (el) {
    const g = $$(".gl", el);
    gsap.set(g, { drawSVG: "0%", fillOpacity: 0, strokeOpacity: 1 });
    writeTitle(g);
  };

  function dovesIn() {
    const tl = gsap.timeline();
    wingTweens.forEach((t) => t.timeScale(3.5));
    $$(".dove.perch .dove-in").forEach((d, i) => {
      tl.to(d, { opacity: 1, duration: 0.3 }, i * 0.22)
        .fromTo(d, { rotation: -16, scale: 0.55 }, {
          motionPath: { path: [{ x: -300, y: -240 }, { x: -140, y: -70 }, { x: -40, y: -34 }, { x: 0, y: 0 }], curviness: 1.4 },
          rotation: 0, scale: 1, duration: 2, ease: "power2.out"
        }, i * 0.22);
    });
    tl.call(() => wingTweens.forEach((t) => gsap.to(t, { timeScale: 1, duration: 1.2 })), null, 1.6);
    return tl;
  }

  function heroIn() {
    return gsap.timeline({ defaults: { ease: "silk" } })
      .to(lay.back, { scale: 1, rotation: 0, opacity: 1, duration: 1.8, stagger: 0.1 }, 0)
      .to(lay.mid, { scale: 1, rotation: 0, opacity: 1, duration: 1.8, stagger: 0.1 }, 0.2)
      .to(lay.front, { scale: 1, rotation: 0, opacity: 1, duration: 1.6, ease: "back.out(1.4)", stagger: 0.1 }, 0.45)
      .to(".frame .draw", { drawSVG: "100%", duration: 2.2, ease: "inOutSilk", stagger: 0.08 }, 0.1)
      .to(".rays", { opacity: 1, scale: 1, duration: 2 }, 0.2)
      .to("#photoRing", { scale: 1, opacity: 1, duration: 1.4, ease: "elastic.out(1,0.6)" }, 0.3)
      .to(".wreath .stem", { drawSVG: "100%", duration: 1.1, ease: "power2.out" }, 0.5)
      .to(".wreath .lf", { scale: 1, duration: 0.6, ease: "back.out(2)", stagger: 0.018 }, 0.6)
      .add(dovesIn(), 0.6)
      .to(".bear", { opacity: 1, scale: 1, y: 0, duration: 1, ease: "back.out(2.2)" }, 1.4)
      .add(writeTitle(glyphs), 1)
      .to("#ribbon", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut" }, 2.7)
      .to(split.name.chars, { opacity: 1, y: 0, rotationX: 0, duration: 0.7, stagger: 0.035, ease: "back.out(1.8)" }, 3.2)
      .to(split.invite.lines, { yPercent: 0, duration: 1, stagger: 0.12 }, 3.4)
      .to([".splat", ".sparkles"], { opacity: 1, duration: 1.4, stagger: 0.2 }, 3.2)
      .call(startLoops, null, 3.9);
  }

  function startLoops() {
    gsap.to(".rays", { rotation: 360, duration: 90, ease: "none", repeat: -1 });
    gsap.to(".dove.perch .dove-in", { y: -8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.7 });
    gsap.to(lay.mid, { rotation: 1.4, duration: 5.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(lay.front, { rotation: -1.1, duration: 4.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.timeline({ repeat: -1, repeatDelay: 3.2 })
      .to(".bear-arm", { rotation: -38, svgOrigin: "112 104", duration: 0.35, ease: "power2.out" })
      .to(".bear-arm", { rotation: -16, svgOrigin: "112 104", duration: 0.22, ease: "sine.inOut", yoyo: true, repeat: 3 })
      .to(".bear-arm", { rotation: 0, svgOrigin: "112 104", duration: 0.45, ease: "power2.inOut" })
      .to(".bear-head", { rotation: -7, svgOrigin: "80 96", duration: 0.5, ease: "sine.inOut" }, 0)
      .to(".bear-head", { rotation: 4, svgOrigin: "80 96", duration: 0.6, ease: "sine.inOut" }, 0.5)
      .to(".bear-head", { rotation: 0, svgOrigin: "80 96", duration: 0.5, ease: "sine.inOut" }, 1.1);
    gsap.timeline({ repeat: -1, repeatDelay: 3.8 })
      .to(".bear-eyes", { scaleY: 0.1, svgOrigin: "80 54", duration: 0.08, yoyo: true, repeat: 1 });
    if (!LITE) {
      const q = $$(".floral .lay.mid, .floral .lay.front").map((el) => ({
        k: el.classList.contains("front") ? 12 : 6,
        x: gsap.quickTo(el, "x", { duration: 1.4, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.4, ease: "power3.out" })
      }));
      UI.layerTilt = (nx, ny) => q.forEach((l) => { l.x(nx * l.k); l.y(ny * l.k); });
    }
  }
  const baseApply = applyTilt;
  applyTilt = function (nx, ny) { baseApply(nx, ny); if (UI.layerTilt) UI.layerTilt(nx, ny); };

  /* ================= ESCENAS AL HACER SCROLL ================= */
  function initScroll() {
    const st = (trigger, start) => ({ trigger, start: start || "top 84%", once: true });
    gsap.timeline({ scrollTrigger: st("#dateRow", "top 90%") })
      .to(".date-side i", { scaleX: 1, duration: 1.1, ease: "silk", stagger: 0.08 })
      .to(".date-side span", { opacity: 1, y: 0, duration: 0.8, ease: "silk", stagger: 0.1 }, 0.2)
      .to("#coin", { opacity: 1, rotationY: 0, scale: 1, duration: 1.4, ease: "back.out(1.3)" }, 0.1)
      .to(".month-arc", { opacity: 1, duration: 0.8 }, 0.6)
      .to(".month-arc text", { letterSpacing: "6px", duration: 1.2, ease: "silk" }, 0.6);
    gsap.timeline({ scrollTrigger: st("#family", "top 92%") })
      .to("#family > div", { opacity: 1, y: 0, duration: 0.9, ease: "silk", stagger: 0.15 })
      .to(".cross .draw", { drawSVG: "100%", duration: 1.2, ease: "power1.inOut" }, 0.1)
      .to(".cross .draw", { fillOpacity: 1, duration: 0.8 }, 0.9)
      .to("#heroCta", { opacity: 1, scale: 1, duration: 0.9, ease: "back.out(2)" }, 0.6)
      .to(".scroll-cue", { opacity: 1, duration: 0.8 }, 1);

    $$(".section").forEach((sec) => {
      const tl = gsap.timeline({ scrollTrigger: st(sec, "top 78%"), defaults: { ease: "silk" } });
      const wash = $(".wash", sec), sprig = $(".sprig", sec), title = $(".sec-title", sec);
      if (wash) tl.to(wash, { opacity: 0.72, scale: 1, rotation: 0, clipPath: "circle(75% at 50% 50%)", duration: 2 }, 0);
      if (sprig) tl.to(sprig, { scaleX: 1, opacity: 1, duration: 1.2 }, 0.2);
      if (title) tl.to(title, { clipPath: "polygon(0% -40%, 110% -40%, 110% 140%, 0% 140%)", y: 0, duration: 1.5, ease: "power2.inOut" }, 0.3);
    });
    gsap.to(split.verse.lines, { yPercent: 0, duration: 1.1, ease: "silk", stagger: 0.12, scrollTrigger: st(".verse") });
    gsap.to(".verse-ref", { opacity: 1, y: 0, duration: 0.9, ease: "silk", scrollTrigger: st(".verse-ref") });
    gsap.to(split.lead.lines, { yPercent: 0, duration: 1, ease: "silk", stagger: 0.1, scrollTrigger: st(".lead") });
    gsap.to(".unit", { opacity: 1, rotationX: 0, duration: 1, ease: "back.out(1.6)", stagger: 0.12, scrollTrigger: st(".flipclock") });
    gsap.to(".date-long", { opacity: 1, y: 0, duration: 0.9, ease: "silk", scrollTrigger: st(".date-long") });
    gsap.timeline({ scrollTrigger: st(".events") })
      .to(".event", { opacity: 1, y: 0, rotationX: 0, duration: 1.2, ease: "silk", stagger: 0.18 })
      .to(".event-icon .draw", { drawSVG: "100%", duration: 1.6, ease: "power1.inOut", stagger: 0.04 }, 0.3);
    gsap.to(".cal > *", { opacity: 1, y: 0, duration: 0.9, ease: "silk", stagger: 0.12, scrollTrigger: st(".cal") });
    gsap.timeline({ scrollTrigger: st("#rsvpCard", "top 88%") })
      .to("#rsvpCard", { opacity: 1, y: 0, duration: 1.2, ease: "silk" })
      .to(".deadline", { opacity: 1, y: 0, duration: 0.8, ease: "silk" }, 0.6);
    gsap.to(".foot > *", { opacity: 1, y: 0, duration: 0.9, ease: "silk", stagger: 0.12, scrollTrigger: st(".foot", "top 92%") });
    gsap.to(".foot .sprig", { scaleX: 1, opacity: 1, duration: 1.2, ease: "silk", scrollTrigger: st(".foot", "top 92%") });

    if (!LITE) {
      const scrub = { trigger: "#inicio", start: "top top", end: "bottom top", scrub: true };
      gsap.to(".floral.tl", { y: -70, ease: "none", scrollTrigger: scrub });
      gsap.to(".floral.br", { y: 50, ease: "none", scrollTrigger: scrub });
      gsap.to("#portrait", { y: -40, ease: "none", scrollTrigger: scrub });
      gsap.to(".title", { y: -18, ease: "none", scrollTrigger: scrub });
      scrollDove();
    }
    ScrollTrigger.refresh();
  }

  // Paloma que cruza la pantalla mientras bajas por el mensaje y la cuenta regresiva
  function scrollDove() {
    const sd = $("#scrollDove"), W = innerWidth, H = innerHeight;
    flapWings(sd, 0.2, 0.5);
    gsap.timeline({ scrollTrigger: { trigger: "#mensaje", start: "top 75%", endTrigger: "#detalles", end: "top 25%", scrub: 1.2 } })
      .to(sd, { opacity: 1, duration: 0.06 }, 0)
      .fromTo(sd, { scale: 0.7 }, {
        scale: 1.1, duration: 1, ease: "none",
        motionPath: { path: [{ x: -150, y: H * 0.62 }, { x: W * 0.28, y: H * 0.34 }, { x: W * 0.62, y: H * 0.52 }, { x: W + 170, y: H * 0.16 }], curviness: 1.25 }
      }, 0)
      .to(sd, { opacity: 0, duration: 0.06 }, 0.94);
  }

  /* ================= HOJAS QUE CAEN ================= */
  function startLeaves() {
    const box = $("#leaves");
    for (let i = 0; i < (LITE ? 6 : 12); i++) {
      const d = document.createElement("div");
      d.className = "leaf-fall";
      d.style.setProperty("--sz", rand(16, 30).toFixed(0) + "px");
      d.innerHTML = ART.fallingLeaf(Math.random() < 0.55 ? "round" : "willow");
      box.appendChild(d);
      const dur = rand(14, 26), dir = Math.random() < 0.5 ? -1 : 1;
      gsap.set(d, { x: rand(0, innerWidth), y: -40, rotation: rand(0, 360) });
      gsap.to(d, { y: innerHeight + 80, duration: dur, ease: "none", repeat: -1, delay: rand(0, 8) });
      gsap.to(d, { x: "+=" + rand(40, 90).toFixed(0), duration: rand(2.5, 4.5), ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(d, { rotation: "+=" + (dir * rand(180, 400)).toFixed(0), rotationX: rand(120, 360), duration: dur, ease: "none", repeat: -1 });
    }
  }

  /* ================= SUELTA DE PALOMAS ================= */
  UI.releaseDoves = function (from, n) {
    const r = from.getBoundingClientRect(), layer = $("#flyLayer");
    for (let i = 0; i < n; i++) {
      const w = rand(64, 110), d = document.createElement("div");
      d.className = "fly-dove";
      d.style.setProperty("--w", w.toFixed(0) + "px");
      d.innerHTML = ART.dove();
      layer.appendChild(d);
      const dir = Math.random() < 0.5 ? -1 : 1;
      if (dir < 0) gsap.set(d.firstElementChild, { scaleX: -1 });
      const sx = r.left + r.width / 2 + rand(-60, 60) - w / 2, sy = r.top + r.height / 2 - w * 0.4;
      const flaps = flapWings(d, rand(0.14, 0.2), 0.42);
      gsap.set(d, { x: sx, y: sy, scale: 0.3, opacity: 0 });
      gsap.timeline({ delay: i * 0.14, onComplete: () => { flaps.forEach((t) => t.kill()); d.remove(); } })
        .to(d, { opacity: 1, duration: 0.25 }, 0)
        .to(d, {
          motionPath: { path: [{ x: sx, y: sy }, { x: sx + dir * rand(40, 140), y: sy - rand(140, 240) }, { x: sx + dir * rand(180, 420), y: -180 }], curviness: 1.4 },
          scale: rand(0.9, 1.35), duration: rand(2.4, 3.3), ease: "power1.in"
        }, 0)
        .to(d, { opacity: 0, duration: 0.5 }, ">-0.5");
    }
  };

  /* ================= APERTURA ================= */
  let ready = false, pending = false, opened = false;
  function open() {
    if (opened) return;
    opened = true;
    askGyro();
    UI.startMusic();
    idle.progress(1).kill();
    float.kill();
    gsap.set(".env-stage", { y: 0 });
    gsap.timeline()
      .add(shatter(), 0)
      .add(openEnvelope(), 0.15)
      .add(heroIn(), 2.55)
      .call(() => { introActive = false; unlock(); ScrollTrigger.refresh(); }, null, 2.9)
      .call(startLeaves, null, 3.2)
      .call(initScroll, null, 3.6)
      .call(() => { intro.hidden = true; const m = $("#main"); m.setAttribute("tabindex", "-1"); m.focus({ preventScroll: true }); }, null, 4);
  }
  seal.addEventListener("click", () => (ready ? open() : (pending = true)));
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => {
    prepare();
    ready = true;
    if (pending) open();
  });
})();
