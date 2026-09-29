/* ============================================================
   Confirmación de asistencia
   Una sola respuesta por nombre y apellido (lo asegura la base).
   ============================================================ */
(function () {
  "use strict";
  const C = window.CONFIG, E = C.event, UI = window.UI;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const TZ = "America/Guayaquil";
  const KEY = "bautizo-isaac-rsvp";

  const form = $("#rsvpForm"), thanks = $("#thanks"), closed = $("#closed");
  const errBox = $("#formError"), msg = $("#fMsg"), dlEl = $("#deadlineTxt");
  const yesBox = $("#yesBox"), noBox = $("#noBox"), msgLabel = $("#msgLabel"), suggestBox = $("#suggest");

  /* ---------- Fecha límite ---------- */
  const deadline = new Date(`${C.rsvpDeadline}T23:59:59${E.timezone}`);
  const eventDay = UI.eventDay;
  dlEl.textContent = "Por favor, confírmanos hasta el ";
  const strong = document.createElement("strong");
  strong.textContent = deadline.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).replace(",", "");
  dlEl.append(strong, ".");

  /* ---------- Conexión con Supabase (se descarga solo cuando hace falta) ---------- */
  const configured = !!C.SUPABASE_URL && !C.SUPABASE_URL.startsWith("TU_");
  let sbPromise = null;
  function getSupabase() {
    if (!configured) return Promise.resolve(null);
    if (!sbPromise) {
      sbPromise = new Promise((resolve) => {
        // Sin sesión guardada: si en este celular se abrió el panel admin, el formulario no debe
        // enviar como administrador (esa cuenta no tiene permiso de insertar y fallaría).
        const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
        const done = () => { try { resolve(window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, opts)); } catch (e) { console.error(e); resolve(null); } };
        if (window.supabase) return done();
        const sc = document.createElement("script");
        sc.src = "vendor/supabase.js";
        sc.onload = done;
        sc.onerror = () => { sbPromise = null; resolve(null); };
        document.head.appendChild(sc);
      });
    }
    return sbPromise;
  }
  // Se precarga cuando el invitado se acerca al formulario o empieza a escribir
  if (configured && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { getSupabase(); io.disconnect(); } }, { rootMargin: "900px 0px" });
    io.observe(form);
  }
  form.addEventListener("focusin", () => getSupabase(), { once: true });
  const pageStart = Date.now();

  /* ---------- Frases sugeridas al no asistir ---------- */
  C.declineSuggestions.forEach((text) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.addEventListener("click", () => { msg.value = text; markSuggestion(); msg.focus(); });
    suggestBox.appendChild(b);
  });
  function markSuggestion() {
    $$("#suggest button").forEach((b) => b.classList.toggle("on", b.textContent === msg.value));
  }
  msg.addEventListener("input", markSuggestion);

  /* ---------- Acompañantes ---------- */
  let guests = 0;
  const gNum = $("#gNum"), gHint = $("#gHint");
  function setGuests(n) {
    guests = Math.max(0, Math.min(C.maxGuests, n));
    gNum.textContent = guests;
    gHint.textContent = guests === 0 ? "Solo tú" : guests === 1 ? "Tú y 1 acompañante · 2 personas" : `Tú y ${guests} acompañantes · ${guests + 1} personas`;
    if (window.gsap && !UI.reduce) gsap.fromTo(gNum, { scale: 1.35 }, { scale: 1, duration: 0.5, ease: "power3.out" });
  }
  $("#gPlus").addEventListener("click", () => setGuests(guests + 1));
  $("#gMinus").addEventListener("click", () => setGuests(guests - 1));

  /* ---------- Asistiré / No podré ---------- */
  function setMode(yes) {
    yesBox.classList.toggle("closed", !yes);
    noBox.classList.toggle("closed", yes);
    yesBox.inert = !yes;
    noBox.inert = yes;
    msgLabel.textContent = yes ? `Un mensaje para ${C.baby} (opcional)` : "Tu mensaje para la familia";
    if (!yes) {
      setGuests(0);
      if (!msg.value.trim()) msg.value = C.declineSuggestions[0];
    } else if (C.declineSuggestions.includes(msg.value)) {
      msg.value = "";
    }
    markSuggestion();
  }
  $$('input[name="att"]').forEach((r) => r.addEventListener("change", () => setMode(form.elements.att.value === "yes")));
  setMode(true);
  gHint.textContent = "Solo tú";

  /* ---------- Estados finales ---------- */
  function showClosed() {
    form.hidden = true; thanks.hidden = true; dlEl.hidden = true; closed.hidden = false;
  }
  function showThanks(d, fresh) {
    form.hidden = true; closed.hidden = true; dlEl.hidden = true; thanks.hidden = false;
    const quote = $("#thanksQuote");
    if (d.attending) {
      const extra = d.guests === 0 ? "" : d.guests === 1 ? " con 1 acompañante" : ` con ${d.guests} acompañantes`;
      $("#thanksTitle").textContent = `¡Qué alegría, ${d.first}!`;
      $("#thanksText").textContent = `Confirmaste tu asistencia${extra}. Te esperamos el ${eventDay} para celebrar juntos este regalo de fe.`;
    } else {
      $("#thanksTitle").textContent = `Gracias por tu cariño, ${d.first}`;
      $("#thanksText").textContent = "Te vamos a extrañar, pero sabemos que nos acompañas desde el corazón. Tus palabras ya llegaron a nuestra familia:";
    }
    quote.hidden = !d.message;
    quote.textContent = d.message ? `“${d.message}”` : "";
    if (fresh) {
      const card = $("#rsvpCard");
      if (UI.lenis) UI.lenis.scrollTo(card, { offset: -Math.max(12, (innerHeight - card.offsetHeight) / 2), duration: 1.2 });
      else card.scrollIntoView({ behavior: UI.reduce ? "auto" : "smooth", block: "center" });
      if (window.SFX) SFX.chime();
      if (UI.writeScript) UI.writeScript($(".thanks-script"));
      if (window.gsap && !UI.reduce) gsap.from(thanks.children, { opacity: 0, y: 20, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.2 });
      setTimeout(() => {
        const btnBox = $(".thanks-script").getBoundingClientRect();
        if (UI.releaseDoves) UI.releaseDoves($(".thanks-script"), d.attending ? 7 : 2);
        if (d.attending) UI.celebrate();
        else UI.petals(btnBox.left + btnBox.width / 2, btnBox.top + btnBox.height / 2, 50, 7);
      }, 500);
    }
  }

  // ¿Ya respondió desde este dispositivo?
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (_) {}
  if (saved && saved.first) showThanks(saved, false);
  else if (Date.now() > deadline) showClosed();

  /* ---------- Envío ---------- */
  const clean = (s) => s.replace(/\s+/g, " ").trim();
  const nameOk = (s) => /^\p{L}[\p{L}'’ .-]{1,59}$/u.test(s);
  function fail(sel, text) {
    const el = $(sel);
    el.closest(".field").classList.add("err");
    errBox.textContent = text;
    el.focus();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.textContent = "";
    $$(".field.err").forEach((f) => f.classList.remove("err"));
    if (Date.now() > deadline) return showClosed();

    const first = clean($("#fName").value), last = clean($("#fLast").value);
    const attending = form.elements.att.value === "yes";
    const message = clean(msg.value).slice(0, 500);
    if (!nameOk(first)) return fail("#fName", "Escribe tu nombre (mínimo 2 letras).");
    if (!nameOk(last)) return fail("#fLast", "Escribe tu apellido (mínimo 2 letras).");
    if (!attending && !message) return fail("#fMsg", "Déjanos unas palabras o elige una de las frases.");

    // Anti-spam: los robots llenan el campo invisible o envían al instante
    if ($("#fTrap").value || Date.now() - pageStart < 3000) return showThanks({ first, attending, guests: 0, message: "" }, true);

    const btn = $("#sendBtn");
    const label = (t) => (UI.setLabel ? UI.setLabel(btn, t) : (btn.textContent = t));
    btn.disabled = true;
    label("Enviando…");
    try {
      const sb = await getSupabase();
      if (configured && !sb) throw new Error("No se pudo cargar Supabase");
      if (sb) {
        const { error } = await sb.from("rsvps").insert({
          first_name: first, last_name: last, attending, guests: attending ? guests : 0, message: message || null
        });
        if (error) {
          if (error.code === "23505") {
            errBox.textContent = `Ya recibimos una confirmación a nombre de ${first} ${last}. Si necesitas cambiarla, escríbele a ${C.parents.join(" o a ")}.`;
            return;
          }
          throw error;
        }
      } else {
        UI.toast("Vista previa: la respuesta no se guardó porque aún falta conectar Supabase.");
      }
      const data = { first, attending, guests: attending ? guests : 0, message };
      if (sb) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {} }
      showThanks(data, true);
    } catch (err) {
      console.error(err);
      errBox.textContent = "No pudimos enviar tu respuesta. Revisa tu conexión a internet e inténtalo otra vez.";
    } finally {
      btn.disabled = false;
      label("Enviar confirmación");
    }
  });
})();
