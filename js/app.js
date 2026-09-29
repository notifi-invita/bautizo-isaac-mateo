/* ============================================================
   Contenido, polvo de luz, pétalos, música, reloj de paletas,
   calendario y galería. La coreografía está en motion.js.
   ============================================================ */
(function () {
  "use strict";
  const C = window.CONFIG, E = C.event, T = C.texts;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const TZ = "America/Guayaquil";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Modo ligero para celulares modestos: menos partículas y efectos
  const LITE = reduce || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
  const UI = (window.UI = { reduce, LITE });
  if (LITE) document.documentElement.classList.add("lite");
  document.body.classList.add("is-locked");

  window.ART.fill();

  /* ---------- Textos desde config.js ---------- */
  const fills = { baby: C.baby, initials: C.initials, invite: T.invite, verse: T.verse, verseRef: T.verseRef, gratitude: T.gratitude, closing: T.closing };
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
  UI.eventDay = fmt(ceremony, { weekday: "long", day: "numeric", month: "long" });
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

  if (C.mainPhoto) {
    const img = new Image();
    img.alt = `Foto de ${C.baby}`;
    img.onload = () => { const p = $("#mainPhoto"); p.textContent = ""; p.appendChild(img); };
    img.src = C.mainPhoto;
  }

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

  /* ---------- Música con entrada suave ---------- */
  const bgm = $("#bgm"), musicBtn = $("#musicBtn");
  let musicOk = !!C.music;
  const hideMusic = () => { musicOk = false; musicBtn.hidden = true; $("#musicHint").hidden = true; };
  if (musicOk) { bgm.addEventListener("error", hideMusic); bgm.src = C.music; } else hideMusic();
  bgm.addEventListener("play", () => musicBtn.classList.add("playing"));
  bgm.addEventListener("pause", () => musicBtn.classList.remove("playing"));
  const fadeTo = (v, d, done) => window.gsap ? gsap.to(bgm, { volume: v, duration: d, overwrite: true, onComplete: done }) : ((bgm.volume = v), done && done());
  UI.startMusic = function () {
    if (!musicOk) return;
    bgm.volume = 0;
    bgm.play().then(() => fadeTo(0.55, 2.5)).catch(() => {});
  };
  musicBtn.addEventListener("click", () => {
    if (!musicOk) return;
    if (bgm.paused) { bgm.volume = 0; bgm.play().then(() => fadeTo(0.55, 1.2)).catch(() => {}); }
    else fadeTo(0, 0.6, () => bgm.pause());
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !bgm.paused) { bgm.pause(); bgm.dataset.auto = "1"; }
    else if (!document.hidden && bgm.dataset.auto === "1") { bgm.dataset.auto = ""; bgm.play().catch(() => {}); }
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
  function tickClock() {
    let diff = Math.max(0, ceremony - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const vals = { d, h, m, s: Math.floor(diff / 1e3) };
    flips.forEach((f) => setFlip(f, String(vals[f.u]).padStart(2, "0")));
  }
  tickClock();
  setInterval(tickClock, 1000);

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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "bautizo-isaac-mateo.ics";
    document.body.appendChild(a); a.click(); a.remove();
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
      b.addEventListener("click", () => { $("img", lb).src = src; lb.hidden = false; });
      gal.appendChild(b);
    });
    lb.addEventListener("click", () => (lb.hidden = true));
  }
})();
