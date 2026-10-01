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
  dlEl.textContent = "Te agradeceremos confirmar hasta el ";
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

  /* ---------- Frases sugeridas (al asistir y al no asistir) ---------- */
  const ACCEPT = C.acceptSuggestions || [], DECLINE = C.declineSuggestions || [];
  // optional: al asistir el mensaje es opcional, así que tocar de nuevo la frase elegida la quita
  function buildSuggest(box, list, optional) {
    if (!box) return;
    list.forEach((text) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.addEventListener("click", () => {
        msg.value = optional && msg.value === text ? "" : text;
        markSuggestion();
        msg.focus({ preventScroll: true });
      });
      box.appendChild(b);
    });
  }
  buildSuggest($("#suggestYes"), ACCEPT, true);
  buildSuggest(suggestBox, DECLINE, false);
  function markSuggestion() {
    $$(".suggest button").forEach((b) => {
      const on = b.textContent === msg.value;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
  }
  msg.addEventListener("input", markSuggestion);

  /* ---------- Plato de la recepción: uno por persona ---------- */
  const M = C.menu, mealRows = $("#mealRows"), mealsSum = $("#mealsSum");
  const meals = []; // elección de cada persona: "pollo" | "cuy" | null
  const who = (i) => (i === 0 ? "Tú" : `Acompañante ${i}`);
  const mealCount = (id, n) => meals.slice(0, n).filter((m) => m === id).length;
  function mealRow(i) {
    const row = document.createElement("div");
    row.className = "meal-row";
    row.setAttribute("role", "radiogroup");
    row.setAttribute("aria-label", `Plato para ${i === 0 ? "ti" : who(i).toLowerCase()}`);
    const w = document.createElement("span");
    w.className = "meal-who";
    w.textContent = who(i);
    row.appendChild(w);
    M.options.forEach((o) => {
      const label = document.createElement("label"), input = document.createElement("input"), span = document.createElement("span");
      label.className = "meal-opt";
      input.type = "radio"; input.name = `meal-${i}`; input.value = o.id; input.checked = meals[i] === o.id;
      input.addEventListener("change", () => {
        meals[i] = o.id;
        row.classList.remove("err");
        updateMeals();
        // Si ya no falta nadie, se borra el aviso de error
        if (!meals.slice(0, guests + 1).some((m) => !m)) errBox.textContent = "";
      });
      span.textContent = o.name;
      label.append(input, span);
      row.appendChild(label);
    });
    return row;
  }
  function updateMeals() {
    const n = guests + 1, missing = n - meals.slice(0, n).filter(Boolean).length;
    $("#mealsQ").textContent = n === 1 ? M.question : M.questionGroup || M.question;
    $("#mealsHint").textContent = n === 1 ? M.hint : M.hintGroup || M.hint;
    const chosen = M.options.filter((o) => mealCount(o.id, n) > 0).map((o) => `${mealCount(o.id, n)} ${o.name.toLowerCase()}`);
    mealsSum.textContent = missing === n ? "" : missing ? (missing === 1 ? "Falta elegir 1 plato" : `Faltan elegir ${missing} platos`) : `Listo: ${chosen.join(" y ")}`;
  }
  // Una fila por persona (se agregan o quitan sin perder lo ya elegido)
  function renderMeals() {
    const n = guests + 1;
    while (meals.length < n) meals.push(null);
    while (mealRows.children.length > n) mealRows.lastElementChild.remove();
    while (mealRows.children.length < n) {
      const row = mealRow(mealRows.children.length);
      mealRows.appendChild(row);
      if (window.gsap && !UI.reduce) gsap.from(row, { opacity: 0, y: -8, duration: 0.45, ease: "power3.out" });
    }
    updateMeals();
  }

  /* ---------- Acompañantes ---------- */
  let guests = 0;
  const gNum = $("#gNum"), gHint = $("#gHint");
  function setGuests(n) {
    guests = Math.max(0, Math.min(C.maxGuests, n));
    gNum.textContent = guests;
    gHint.textContent = guests === 0 ? "Solo tú" : guests === 1 ? "Tú y 1 acompañante · 2 personas" : `Tú y ${guests} acompañantes · ${guests + 1} personas`;
    renderMeals();
    if (window.gsap && !UI.reduce) gsap.fromTo(gNum, { scale: 1.35 }, { scale: 1, duration: 0.5, ease: "power3.out" });
  }
  $("#gPlus").addEventListener("click", () => setGuests(guests + 1));
  $("#gMinus").addEventListener("click", () => setGuests(guests - 1));

  /* ---------- Pasos: 1) asistencia y datos · 2) menú (solo si asistirá) ---------- */
  const step1 = $("#step1"), step2 = $("#step2"), backBtn = $("#backBtn"), sendBtn = $("#sendBtn");
  let step = 1;
  const setBtn = (t) => (UI.setLabel ? UI.setLabel(sendBtn, t) : (sendBtn.textContent = t));
  const btnText = () => (step === 1 && form.elements.att.value === "yes" ? "Continuar al menú" : "Enviar confirmación");
  const scrollCard = () => {
    const card = $("#rsvpCard");
    if (UI.lenis) UI.lenis.scrollTo(card, { offset: -12, duration: 0.9 });
    else card.scrollIntoView({ behavior: UI.reduce ? "auto" : "smooth", block: "start" });
  };
  function goStep(n, first) {
    step = n;
    const show = n === 1 ? step1 : step2, hide = n === 1 ? step2 : step1;
    hide.hidden = true;
    show.hidden = false;
    backBtn.hidden = n === 1;
    heading(n === 1);
    errBox.textContent = "";
    setBtn(btnText());
    if (n === 2) {
      $("#step2Title").textContent = `${first}, solo falta elegir el menú`;
      renderMeals();
      $("#step2Title").focus({ preventScroll: true });
      // Un segundo toque rápido sobre el mismo botón no debe "enviar" sin haber elegido
      sendBtn.disabled = true;
      setTimeout(() => { sendBtn.disabled = false; }, 700);
    } else {
      const sel = form.querySelector('input[name="att"]:checked') || $("#fName");
      sel.focus({ preventScroll: true });
    }
    if (window.gsap && !UI.reduce) gsap.fromTo(show, { opacity: 0, x: n === 2 ? 24 : -24 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" });
    scrollCard();
  }
  backBtn.addEventListener("click", () => goStep(1));

  /* ---------- Asistiré / No podré ---------- */
  // yes: true (asistirá) · false (no podrá) · null (aún no elige: ninguna sección abierta).
  // Acompañantes y plato de la recepción solo aparecen después de «Con gusto asistiré».
  function setMode(yes) {
    yesBox.classList.toggle("closed", yes !== true);
    noBox.classList.toggle("closed", yes !== false);
    yesBox.inert = yes !== true;
    noBox.inert = yes !== false;
    msgLabel.textContent = yes === false ? "Tu mensaje para la familia" : "Tu mensaje para la familia (opcional)";
    // Una frase sugerida del otro grupo no tiene sentido al cambiar de opción: se reemplaza.
    // Lo que el invitado escribió por su cuenta se respeta.
    if (yes === false) {
      setGuests(0);
      if (!msg.value.trim() || ACCEPT.includes(msg.value)) msg.value = DECLINE[0] || "";
    } else if (yes === true && DECLINE.includes(msg.value)) {
      msg.value = "";
    }
    markSuggestion();
  }
  $$('input[name="att"]').forEach((r) => r.addEventListener("change", () => { errBox.textContent = ""; setMode(form.elements.att.value === "yes"); setBtn(btnText()); }));
  setMode(null);
  gHint.textContent = "Solo tú";
  renderMeals();

  /* ---------- Estados finales ---------- */
  // El título «Confirma tu asistencia» y la fecha límite solo se muestran mientras hay que
  // llenar el paso 1. En el menú, en el agradecimiento y con las confirmaciones cerradas se ocultan
  // (si no, «confirmar» aparecía una y otra vez). El botón de la tarjeta principal también cambia.
  const secTitle = $("#rsvpCard .sec-title"), heroCta = $("#heroCta");
  function heading(show) {
    secTitle.hidden = !show;
    dlEl.hidden = !show;
  }
  function heroLabel(state) {
    if (!heroCta) return;
    heroCta.hidden = state === "closed";
    const t = state === "done" ? "Ver mi confirmación" : "Confirmar asistencia";
    UI.setLabel ? UI.setLabel(heroCta, t) : (heroCta.textContent = t);
  }
  function showClosed() {
    form.hidden = true; thanks.hidden = true; closed.hidden = false;
    heading(false);
    heroLabel("closed");
  }
  function showThanks(d, fresh) {
    form.hidden = true; closed.hidden = true; thanks.hidden = false;
    heading(false);
    heroLabel("done");
    const quote = $("#thanksQuote");
    if (d.attending) {
      const conf = d.guests === 0 ? "Tu asistencia quedó confirmada." : d.guests === 1 ? "Tu asistencia y la de tu acompañante quedaron confirmadas." : `Tu asistencia y la de tus ${d.guests} acompañantes quedaron confirmadas.`;
      $("#thanksTitle").textContent = `¡Qué alegría, ${d.first}!`;
      $("#thanksText").textContent = `${conf} Te esperamos con mucho cariño el ${eventDay} para celebrar juntos este regalo de fe.` + (d.message ? " Tus lindas palabras ya llegaron a nuestra familia:" : "");
    } else {
      $("#thanksTitle").textContent = `Te llevamos en el corazón, ${d.first}`;
      $("#thanksText").textContent = "Te extrañaremos mucho, pero sabemos que nos acompañarás con tus oraciones. Tus palabras ya llegaron a nuestra familia:";
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

  function showForm() {
    thanks.hidden = true; closed.hidden = true; form.hidden = false;
    heading(step === 1);
    heroLabel("form");
    if (Date.now() > deadline) showClosed();
  }
  const forget = () => { try { localStorage.removeItem(KEY); } catch (_) {} };
  // Id aleatorio de la respuesta: con él se puede preguntar a la base si sigue existiendo
  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  // ¿Ya respondió desde este celular? Se confirma con la base de datos: si los papás
  // borraron la respuesta en el panel, el formulario vuelve a aparecer.
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (_) {}
  if (saved && saved.first && saved.id) {
    showThanks(saved, false);
    if (configured) {
      getSupabase()
        .then((sb) => sb && sb.rpc("rsvp_exists", { p_id: saved.id }))
        .then((res) => { if (res && !res.error && res.data === false) { forget(); showForm(); } })
        .catch(() => {});
    }
  } else {
    if (saved) forget(); // guardado por la versión anterior (sin id): se muestra el formulario
    if (Date.now() > deadline) showClosed();
  }

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
    const choice = form.elements.att.value, attending = choice === "yes";
    if (!choice) {
      errBox.textContent = "Por favor, indica si podrás acompañarnos.";
      form.querySelector('input[name="att"]').focus();
      return;
    }
    const message = clean(msg.value).slice(0, 500);
    if (!nameOk(first)) return fail("#fName", "Por favor, escribe tu nombre.");
    if (!nameOk(last)) return fail("#fLast", "Por favor, escribe tu apellido.");
    if (!attending && !message) return fail("#fMsg", "Por favor, déjanos unas palabras o elige una de las frases.");
    if (attending && step === 1) return goStep(2, first);
    if (attending) {
      const n = guests + 1, i = meals.slice(0, n).findIndex((m) => !m);
      if (i !== -1) {
        const row = mealRows.children[i];
        row.classList.add("err");
        errBox.textContent = n === 1 ? "Por favor, elige tu plato." : i === 0 ? "Por favor, elige también tu plato." : `Por favor, elige también el plato de «${who(i)}».`;
        row.querySelector("input").focus();
        return;
      }
    }
    const pollo = attending ? mealCount("pollo", guests + 1) : 0, cuy = attending ? mealCount("cuy", guests + 1) : 0;

    // Anti-spam: los robots llenan el campo invisible o envían al instante
    if ($("#fTrap").value || Date.now() - pageStart < 3000) return showThanks({ first, attending, guests: 0, pollo: 0, cuy: 0, message: "" }, true);

    const btn = sendBtn, label = setBtn;
    btn.disabled = true;
    backBtn.hidden = true;
    label("Enviando…");
    try {
      const sb = await getSupabase();
      if (configured && !sb) throw new Error("No se pudo cargar Supabase");
      const id = newId();
      if (sb) {
        const { error } = await sb.from("rsvps").insert({
          id, first_name: first, last_name: last, attending, guests: attending ? guests : 0, pollo, cuy, message: message || null
        });
        if (error) {
          if (error.code === "23505") {
            errBox.textContent = `Ya recibimos una confirmación a nombre de ${first} ${last}. Si necesitas hacer algún cambio, con gusto te ayudarán ${C.parents.join(" o ")}.`;
            return;
          }
          // Fuera de plazo: la base no acepta respuestas después de la fecha límite
          // (aunque el reloj del celular esté atrasado)
          if (error.code === "42501") return showClosed();
          throw error;
        }
      } else {
        UI.toast("Vista previa: la respuesta no se guardó porque aún falta conectar Supabase.");
      }
      const data = { id, first, attending, guests: attending ? guests : 0, pollo, cuy, message };
      if (sb) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {} }
      showThanks(data, true);
    } catch (err) {
      console.error(err);
      errBox.textContent = "No pudimos enviar tu respuesta. Por favor, revisa tu conexión a internet e inténtalo de nuevo.";
    } finally {
      btn.disabled = false;
      backBtn.hidden = step === 1 || !thanks.hidden;
      label(btnText());
    }
  });
})();
