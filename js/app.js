/* ============================================================
   Contenido desde config.js, pétalos, sonido (música + efectos),
   reloj de paletas, calendario y galería.
   La coreografía está en motion.js.
   ============================================================ */
(function () {
  "use strict";
  const C = window.CONFIG, E = C.event, T = C.texts;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const TZ = "America/Guayaquil";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Modo ligero para celulares modestos: menos partículas y efectos.
  // Ojo: los iPhone siempre reportan 4 núcleos (privacidad) y no reportan memoria,
  // así que solo se considera modesto con menos de 4 núcleos o 3 GB de memoria o menos.
  const cores = navigator.hardwareConcurrency || 8, mem = navigator.deviceMemory || 8;
  const LITE = reduce || cores < 4 || mem <= 3;
  const UI = (window.UI = { reduce, LITE });
  if (LITE) document.documentElement.classList.add("lite");
  document.body.classList.add("is-locked", "is-loading");

  window.ART.fill();
  // Palomas posadas: se muestra el 4.º cuadro (alas recogidas). Con GSAP para que luego
  // el aleteo (xPercent) parta de este mismo valor.
  document.querySelectorAll(".pd img").forEach((img) => {
    if (window.gsap) gsap.set(img, { xPercent: -75 });
    else img.style.transform = "translateX(-75%)";
  });

  /* ---------- Textos desde config.js ---------- */
  const fills = { baby: C.baby, initials: C.initials, invite: T.invite, verse: T.verse, verseRef: T.verseRef, gratitude: T.gratitude, closing: T.closing,
    parentsOr: C.parents.join(" o a ") };
  $$("[data-fill]").forEach((el) => { if (fills[el.dataset.fill]) el.textContent = fills[el.dataset.fill]; });
  $$("[data-list]").forEach((el) => {
    el.textContent = "";
    (C[el.dataset.list] || []).forEach((name, i) => {
      if (i) el.appendChild(document.createElement("br"));
      el.appendChild(document.createTextNode(name));
    });
  });
  $("#footNames").textContent = C.parents.join(" y ");

  const at = (t) => new Date(`${E.date}T${t}:00${E.timezone}`);
  const ceremony = at(E.ceremonyTime);
  const fmt = (d, o) => d.toLocaleString("es-EC", Object.assign({ timeZone: TZ }, o));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const time12 = (t) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "P.M." : "A.M."}`;
  };
  const longDate = cap(fmt(ceremony, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  UI.eventDay = fmt(ceremony, { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
  $("#weekday").textContent = fmt(ceremony, { weekday: "long" });
  $("#dayNum").textContent = fmt(ceremony, { day: "numeric" });
  $("#monthArc").textContent = fmt(ceremony, { month: "long" }).toUpperCase();
  $("#timeTxt").textContent = time12(E.ceremonyTime);
  $("#dateLong").textContent = longDate;
  $("#dateSr").textContent = `${longDate}, ${time12(E.ceremonyTime)}`;
  [["c", E.ceremonyTime, E.ceremonyPlace, E.ceremonyCity, E.ceremonyMap], ["r", E.receptionTime, E.receptionPlace, E.receptionCity, E.receptionMap]]
    .forEach(([p, time, place, city, map]) => {
      $(`#${p}Time`).textContent = time12(time);
      $(`#${p}Place`).textContent = place;
      $(`#${p}City`).textContent = city;
      $(`#${p}Map`).href = map;
    });

  // Enlace personalizado: ?para=Familia%20Pérez
  let para = null;
  try { para = new URLSearchParams(location.search).get("para"); } catch (_) {}
  if (para) {
    const el = $("#introTo");
    el.textContent = "Una invitación especial para";
    const b = document.createElement("strong");
    b.textContent = para.slice(0, 60);
    el.appendChild(b);
  }

  // Foto principal: reemplaza al monograma (si hay WebGL, gl.js la usa como textura)
  UI.photoReady = new Promise((resolve) => {
    if (!C.mainPhoto) return resolve(null);
    const img = new Image();
    img.alt = `Foto de ${C.baby}`;
    img.decoding = "async";
    img.onload = () => {
      const p = $("#mainPhoto"), mono = $(".monogram", p);
      if (mono) mono.remove();
      p.prepend(img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = C.mainPhoto;
  });

  /* ---------- Aviso ---------- */
  let toastT = 0;
  UI.toast = function (msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 4200);
  };

  /* ---------- Pétalos: lluvia suave al confirmar ---------- */
  const petCv = $("#petals"), pctx = petCv.getContext("2d");
  let W = 0, H = 0;
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    petCv.width = W * dpr; petCv.height = H * dpr;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  addEventListener("resize", size);
  // Pétalos pre-dibujados en 5 tonos (se dibujan como imagen: rápido en celulares)
  const TONES = [["#fffaf1", "#ecdcc0"], ["#f7e7cf", "#d9b77e"], ["#e8eee9", "#a9bcae"], ["#fbefe6", "#e2c1a4"], ["#f4e3bd", "#c39a5c"]];
  const sprites = TONES.map(([a, b]) => {
    const c = document.createElement("canvas");
    c.width = 40; c.height = 56;
    const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 56);
    g.addColorStop(0, a); g.addColorStop(1, b);
    x.fillStyle = g;
    x.beginPath(); x.moveTo(20, 54); x.bezierCurveTo(2, 40, 2, 12, 20, 2); x.bezierCurveTo(38, 12, 38, 40, 20, 54); x.fill();
    x.strokeStyle = "rgba(150,120,70,.22)"; x.lineWidth = 1; x.stroke();
    return c;
  });
  let parts = [], raf = 0, last = 0;
  function addPetal(x, y, vx, vy, s) {
    parts.push({ x, y, vx, vy, s, rot: rand(0, 6.28), vr: rand(-1.4, 1.4), ph: rand(0, 6.28), fr: rand(1.6, 3.4), sw: rand(16, 38), img: sprites[Math.floor(rand(0, sprites.length))], life: 0 });
  }
  function loop(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    pctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => p.y < H + 40 && p.life < 14);
    for (const p of parts) {
      p.life += dt; p.ph += p.fr * dt;
      p.vy = Math.min(p.vy + 180 * dt, 115);
      p.vx *= 0.985;
      p.x += (p.vx + Math.sin(p.ph) * p.sw) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      pctx.save();
      pctx.translate(p.x, p.y); pctx.rotate(p.rot);
      pctx.scale(p.s * (0.25 + 0.75 * Math.abs(Math.cos(p.ph * 1.3))), p.s);
      pctx.globalAlpha = Math.max(0, Math.min(1, p.life * 3, (H + 40 - p.y) / 120));
      pctx.drawImage(p.img, -20, -28);
      pctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop);
    else { raf = 0; last = 0; pctx.clearRect(0, 0, W, H); }
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  UI.petalShower = function (n) {
    if (reduce) return;
    n = LITE ? Math.round(n * 0.5) : n;
    for (let i = 0; i < n; i++) addPetal(rand(0, W), rand(-H * 0.7, -20), rand(-20, 20), rand(20, 70), rand(0.28, 0.5));
    kick();
  };
  UI.petals = function (x, y, n) {
    if (reduce) return;
    n = LITE ? Math.round(n * 0.5) : n;
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05), v = rand(80, 240);
      addPetal(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.22, 0.42));
    }
    kick();
  };
  UI.celebrate = () => UI.petalShower(70);

  /* ---------- Sonido: música de fondo + efectos sutiles ---------- */
  // Un solo interruptor controla ambos. Se decide al abrir: con música (tocando el sello) o «Abrir sin música».
  const bgm = $("#bgm"), musicBtn = $("#musicBtn");
  let musicOk = !!C.music, gain = null, fadeT = 0;
  UI.sound = false;
  // Sin archivo de música no tiene sentido ofrecer "con música / sin música"
  const noMusic = () => {
    musicOk = false;
    $("#musicHint").hidden = true;
    $("#openQuiet").hidden = true;
    $("#openBtn").setAttribute("aria-label", "Abrir la invitación");
  };
  if (musicOk) {
    bgm.addEventListener("error", noMusic);
    bgm.src = C.music; // preload="none": la canción se descarga recién al abrir la invitación
    // Consulta mínima para saber si el archivo existe (sin descargarlo)
    if (window.fetch) fetch(C.music, { method: "HEAD" }).then((r) => { if (!r.ok) noMusic(); }).catch(() => {});
  } else noMusic();
  // Fundido: con Web Audio si existe (así funciona también en iPhone); si no, con el volumen del <audio>
  function fadeTo(v, d, done) {
    clearTimeout(fadeT);
    if (gain) {
      const g = gain.gain, t = SFX.now();
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(v, t + d);
      if (done) fadeT = setTimeout(done, d * 1000);
    } else if (window.gsap) gsap.to(bgm, { volume: v, duration: d, overwrite: true, onComplete: done });
    else { bgm.volume = v; if (done) done(); }
  }
  function paintBtn() {
    musicBtn.classList.toggle("playing", UI.sound);
    musicBtn.setAttribute("aria-pressed", String(UI.sound));
  }
  UI.setSound = function (on, fade) {
    UI.sound = on;
    if (window.SFX) on ? SFX.enable() : SFX.disable();
    if (musicOk) {
      if (on) {
        if (!gain && window.SFX && SFX.connectMedia) { gain = SFX.connectMedia(bgm); if (gain) bgm.volume = 1; }
        if (!gain) bgm.volume = 0;
        bgm.play()
          .then(() => { if (UI.sound) fadeTo(0.55, fade || 1.2); else bgm.pause(); })
          .catch((e) => {
            // El navegador bloqueó el audio: el botón queda en "apagado" para no mentir
            if (e && e.name === "NotAllowedError") { UI.sound = false; if (window.SFX) SFX.disable(); paintBtn(); }
          });
      } else if (!bgm.paused) fadeTo(0, 0.6, () => { if (!UI.sound) bgm.pause(); });
    }
    paintBtn();
  };
  musicBtn.addEventListener("click", () => UI.setSound(!UI.sound));
  document.addEventListener("visibilitychange", () => {
    if (!UI.sound || !musicOk) return;
    if (document.hidden) bgm.pause();
    else bgm.play().catch(() => {});
  });

  /* ---------- Reloj de paletas ---------- */
  const flips = $$(".flip").map((el) => {
    el.innerHTML = '<div class="half top"><span>00</span></div><div class="half bottom"><span>00</span></div><div class="leaf"><div class="half top front"><span>00</span></div><div class="half back"><span>00</span></div></div>';
    return { u: el.dataset.u, top: el.querySelector(":scope > .top span"), bottom: el.querySelector(":scope > .bottom span"),
      leaf: el.querySelector(".leaf"), front: el.querySelector(".front span"), back: el.querySelector(".back span"), val: null };
  });
  function setFlip(f, v) {
    if (f.val === v) return;
    const old = f.val;
    f.val = v;
    if (old === null || !window.gsap || reduce) {
      f.top.textContent = f.bottom.textContent = f.front.textContent = f.back.textContent = v;
      return;
    }
    f.top.textContent = v; f.bottom.textContent = old; f.front.textContent = old; f.back.textContent = v;
    gsap.fromTo(f.leaf, { rotationX: 0 }, { rotationX: -180, duration: 0.65, ease: "power2.inOut", overwrite: true,
      onComplete() { f.bottom.textContent = v; f.front.textContent = v; gsap.set(f.leaf, { rotationX: 0 }); } });
  }
  const clock = $("#flipclock"), done = $("#cdDone");
  const dayKey = (d) => fmt(d, { year: "numeric", month: "2-digit", day: "2-digit" });
  let clockTimer = 0;
  function tickClock() {
    let diff = Math.max(0, ceremony - Date.now());
    if (diff === 0) {
      clock.hidden = true;
      done.hidden = false;
      done.textContent = dayKey(new Date()) === dayKey(ceremony) ? "¡Hoy es el gran día!" : "Gracias por acompañarnos";
      clearInterval(clockTimer);
      return;
    }
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const vals = { d, h, m, s: Math.floor(diff / 1e3) };
    flips.forEach((f) => setFlip(f, String(vals[f.u]).padStart(2, "0")));
  }
  clockTimer = setInterval(tickClock, 1000);
  tickClock();

  /* ---------- Calendario ---------- */
  const ymd = E.date.replace(/-/g, "");
  const hhmm = (t, add) => { const [h, m] = t.split(":").map(Number); return String(h + add).padStart(2, "0") + String(m).padStart(2, "0") + "00"; };
  const details = `Ceremonia: ${time12(E.ceremonyTime)} · ${E.ceremonyPlace}\nRecepción: ${time12(E.receptionTime)} · ${E.receptionPlace}, ${E.receptionCity}`;
  $("#calBtn").href = "https://calendar.google.com/calendar/render?" + new URLSearchParams({
    action: "TEMPLATE", text: `Bautizo de ${C.baby}`, dates: `${ymd}T${hhmm(E.ceremonyTime, 0)}/${ymd}T${hhmm(E.receptionTime, 4)}`,
    ctz: TZ, location: `${E.ceremonyPlace}, ${E.ceremonyCity}`, details
  }).toString();
  $("#icsBtn").addEventListener("click", () => {
    const esc = (s) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bautizo//ES", "BEGIN:VEVENT", `UID:bautizo-${ymd}@invitacion`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART;TZID=${TZ}:${ymd}T${hhmm(E.ceremonyTime, 0)}`, `DTEND;TZID=${TZ}:${ymd}T${hhmm(E.receptionTime, 4)}`,
      `SUMMARY:${esc("Bautizo de " + C.baby)}`, `LOCATION:${esc(E.ceremonyPlace + ", " + E.ceremonyCity)}`, `DESCRIPTION:${esc(details)}`,
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"), url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.href = url;
    a.download = "bautizo-isaac-mateo.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    UI.toast("Abre el archivo descargado para guardar el evento en tu calendario.");
  });

  /* ---------- Galería ---------- */
  if (C.photos && C.photos.length) {
    $("#galeria").hidden = false;
    const gal = $("#gallery"), lb = $("#lightbox");
    C.photos.forEach((src, i) => {
      const b = document.createElement("button");
      b.type = "button";
      const img = document.createElement("img");
      img.src = src; img.alt = `Foto ${i + 1} de ${C.baby}`; img.loading = "lazy";
      b.appendChild(img);
      b.addEventListener("click", () => { $("img", lb).src = src; lb.hidden = false; lb._from = b; $("button", lb).focus(); });
      gal.appendChild(b);
    });
    const closeLb = () => { lb.hidden = true; if (lb._from) lb._from.focus(); };
    lb.addEventListener("click", closeLb);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLb(); });
  }
})();
