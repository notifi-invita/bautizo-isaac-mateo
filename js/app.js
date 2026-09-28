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

  /* ---------- Lienzos: polvo de luz dorado y pétalos ---------- */
  const dustCv = $("#dust"), dctx = dustCv.getContext("2d");
  const petCv = $("#petals"), pctx = petCv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2);
    W = innerWidth; H = innerHeight;
    [[dustCv, dctx], [petCv, pctx]].forEach(([c, x]) => { c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); });
  }
  size();
  addEventListener("resize", size);

  // Destello suave (bokeh) pre-dibujado para no recalcular degradados
  const bokeh = document.createElement("canvas");
  bokeh.width = bokeh.height = 64;
  const bg = bokeh.getContext("2d"), grd = bg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(246,226,176,.9)"); grd.addColorStop(0.45, "rgba(226,193,128,.35)"); grd.addColorStop(1, "rgba(226,193,128,0)");
  bg.fillStyle = grd; bg.fillRect(0, 0, 64, 64);

  const dust = [];
  for (let i = 0; i < (LITE ? 28 : 70); i++) {
    const z = rand(0.2, 1), big = !LITE && Math.random() < 0.12;
    dust.push({ x: Math.random(), y: Math.random(), z, r: big ? rand(8, 18) : 0.5 + z * 1.6, big, vy: rand(0.004, 0.012) * z, ph: rand(0, 6.28), sp: rand(0.6, 1.8) });
  }
  let lastT = performance.now();
  function drawDust(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    dctx.clearRect(0, 0, W, H);
    const sy = window.scrollY || 0;
    for (const p of dust) {
      if (!reduce) p.y -= p.vy * dt;
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      let y = (p.y * H - sy * p.z * 0.18) % (H + 40);
      if (y < -20) y += H + 40;
      const x = p.x * W, a = 0.3 + 0.7 * Math.abs(Math.sin(p.ph + now * 0.001 * p.sp));
      if (p.big) {
        dctx.globalAlpha = a * 0.35;
        dctx.drawImage(bokeh, x - p.r, y - p.r, p.r * 2, p.r * 2);
      } else {
        dctx.globalAlpha = a * 0.85;
        dctx.fillStyle = "#d4b074";
        dctx.beginPath(); dctx.arc(x, y, p.r, 0, 6.283); dctx.fill();
        if (p.r > 1.7 && a > 0.9) {
          dctx.strokeStyle = "rgba(255,244,214,.9)"; dctx.lineWidth = 0.6;
          dctx.beginPath(); dctx.moveTo(x - 5, y); dctx.lineTo(x + 5, y); dctx.moveTo(x, y - 5); dctx.lineTo(x, y + 5); dctx.stroke();
        }
      }
    }
    dctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(drawDust);
  }
  requestAnimationFrame(drawDust);

  // Pétalos y papel dorado
  const COLORS = ["#d9b77e", "#c39a5c", "#f1dfb8", "#a9bcae", "#869d8e", "#fffaf0", "#e3c2a0"];
  let parts = [], raf = 0;
  UI.petals = function (x, y, n, spread) {
    if (reduce) return;
    n = LITE ? Math.round(n * 0.5) : n;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(3, spread || 11);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: rand(5, 11), h: rand(3, 7), rot: rand(0, 6.28), vr: rand(-0.25, 0.25), flip: rand(0, 6.28),
        c: COLORS[Math.floor(rand(0, COLORS.length))], leaf: Math.random() < 0.45, life: 0, max: rand(140, 230) });
    }
    if (!raf) raf = requestAnimationFrame(tickPetals);
  };
  function tickPetals() {
    pctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => p.life < p.max && p.y < H + 30);
    for (const p of parts) {
      p.life++; p.vx *= 0.985; p.vy = Math.min(p.vy + 0.2, 3); p.flip += 0.12;
      p.x += p.vx + Math.sin(p.life / 10) * 0.5; p.y += p.vy; p.rot += p.vr;
      pctx.save();
      pctx.globalAlpha = Math.min(1, (p.max - p.life) / 40);
      pctx.translate(p.x, p.y); pctx.rotate(p.rot); pctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.8 + 0.2);
      pctx.fillStyle = p.c;
      if (p.leaf) { pctx.beginPath(); pctx.ellipse(0, 0, p.w * 0.9, p.h * 0.55, 0, 0, 6.283); pctx.fill(); }
      else pctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      pctx.restore();
    }
    raf = parts.length ? requestAnimationFrame(tickPetals) : 0;
  }
  UI.celebrate = function () {
    UI.petals(W / 2, H * 0.45, 150);
    setTimeout(() => UI.petals(W * 0.2, H * 0.6, 80), 250);
    setTimeout(() => UI.petals(W * 0.8, H * 0.6, 80), 450);
  };

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
