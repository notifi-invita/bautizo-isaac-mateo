/* Panel privado: solo quien inicia sesión puede ver las respuestas */
(function () {
  "use strict";
  const C = window.CONFIG;
  const $ = (s) => document.querySelector(s);
  const TZ = "America/Guayaquil";

  $("#loginSub").textContent = "Solo para " + C.parents.join(" y ");
  const configured = C.SUPABASE_URL && !C.SUPABASE_URL.startsWith("TU_");
  if (!configured || !window.supabase) {
    $("#loginErr").textContent = "Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY en js/config.js.";
    $("#loginBtn").disabled = true;
    return;
  }
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  let rows = [], timer = 0, toastT = 0;

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 3200);
  }
  const fmtDate = (iso) => new Date(iso).toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
  const people = (r) => (r.attending ? 1 + r.guests : 0);

  function filtered() {
    const q = $("#q").value.trim().toLowerCase();
    const f = $("#filter").value;
    return rows.filter((r) => {
      if (f === "yes" && !r.attending) return false;
      if (f === "no" && r.attending) return false;
      if (f === "msg" && !r.message) return false;
      return !q || `${r.first_name} ${r.last_name}`.toLowerCase().includes(q);
    });
  }

  function render() {
    const body = $("#rows");
    body.textContent = "";
    const list = filtered();
    if (!list.length) {
      const tr = document.createElement("tr"), td = document.createElement("td");
      td.colSpan = 8;
      td.className = "empty";
      td.textContent = rows.length ? "No hay respuestas con ese filtro." : "Todavía no hay confirmaciones.";
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    list.forEach((r, i) => {
      const tr = document.createElement("tr");
      tr.className = "row";
      tr.style.animationDelay = Math.min(i * 0.03, 0.5) + "s";
      const cell = (txt, cls) => {
        const td = document.createElement("td");
        if (cls) td.className = cls;
        td.textContent = txt;
        tr.appendChild(td);
        return td;
      };
      cell(r.first_name);
      cell(r.last_name);
      const tag = document.createElement("span");
      tag.className = "tag " + (r.attending ? "yes" : "no");
      tag.textContent = r.attending ? "Sí" : "No";
      cell("").appendChild(tag);
      cell(r.attending ? String(r.guests) : "—", "num");
      cell(String(people(r)), "num");
      cell(r.message || "", "msg");
      cell(fmtDate(r.created_at));
      const del = document.createElement("button");
      del.type = "button";
      del.className = "del";
      del.textContent = "Eliminar";
      del.addEventListener("click", () => remove(r));
      cell("").appendChild(del);
      body.appendChild(tr);
    });
  }

  async function remove(r) {
    if (!confirm(`¿Eliminar la respuesta de ${r.first_name} ${r.last_name}? Después podrá volver a confirmar.`)) return;
    const { error } = await sb.from("rsvps").delete().eq("id", r.id);
    if (error) return toast("No se pudo eliminar: " + error.message);
    rows = rows.filter((x) => x.id !== r.id);
    stats();
    render();
    toast("Respuesta eliminada");
  }

  function stats() {
    const yes = rows.filter((r) => r.attending);
    const guests = yes.reduce((a, r) => a + r.guests, 0);
    $("#sPeople").textContent = yes.length + guests;
    $("#sYes").textContent = yes.length;
    $("#sGuests").textContent = guests;
    $("#sNo").textContent = rows.length - yes.length;
  }

  async function load(quiet) {
    const { data, error } = await sb.from("rsvps").select("*").order("created_at", { ascending: false });
    if (error) return toast("No se pudieron cargar las respuestas: " + error.message);
    rows = data || [];
    stats();
    render();
    if (!quiet) toast("Lista actualizada");
  }

  function show(dash) {
    $("#login").hidden = dash;
    $("#dash").hidden = !dash;
    clearInterval(timer);
    if (dash) {
      load(true);
      timer = setInterval(() => load(true), 60000);
    }
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#loginErr").textContent = "";
    const btn = $("#loginBtn");
    btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: $("#email").value.trim(), password: $("#pass").value });
    btn.disabled = false;
    if (error) {
      $("#loginErr").textContent = "Correo o contraseña incorrectos.";
      return;
    }
    $("#pass").value = "";
    show(true);
  });

  function csvCell(v) {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = "'" + s; // evita que Excel lo tome como fórmula
    return '"' + s.replace(/"/g, '""') + '"';
  }

  $("#q").addEventListener("input", render);
  $("#filter").addEventListener("change", render);
  $("#refresh").addEventListener("click", () => load(false));
  $("#logout").addEventListener("click", async () => { await sb.auth.signOut(); rows = []; show(false); });
  $("#csv").addEventListener("click", () => {
    const head = ["Nombre", "Apellido", "Asiste", "Acompañantes", "Total personas", "Mensaje", "Fecha"];
    const lines = rows.map((r) =>
      [r.first_name, r.last_name, r.attending ? "Sí" : "No", r.guests, people(r), r.message || "", fmtDate(r.created_at)].map(csvCell).join(",")
    );
    const blob = new Blob(["﻿" + [head.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "confirmaciones-bautizo-isaac-mateo.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  sb.auth.getSession().then(({ data }) => show(!!(data && data.session)));
})();
