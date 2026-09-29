/* ============================================================
   CONFIGURACIÓN · Bautizo de Isaac Mateo
   Edita solo este archivo para cambiar textos, fechas y claves.
   ============================================================ */
window.CONFIG = {
  // ---- Supabase (ver README.md, paso 2) ----
  // URL: https://xxxxx.supabase.co · Clave: la "Publishable key" (sb_publishable_…) o la antigua "anon".
  // Nunca pongas aquí la "secret key" ni la "service_role".
  SUPABASE_URL: "https://lenpveqkcdkzyebltssw.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_5nddLMlAjGqLSl_nBospIg_PGQf00u2",

  // ---- Familia ----
  baby: "Isaac Mateo",
  initials: "IM",
  parents: ["Cristina", "Andrés"],       // primero mamá, luego papá
  godparents: ["María José", "Julio"],   // primero madrina, luego padrino

  // ---- Evento ----
  event: {
    date: "2026-10-17",            // sábado 17 de octubre de 2026
    ceremonyTime: "10:00",         // formato 24 h
    receptionTime: "13:00",
    ceremonyPlace: "Iglesia de San Blas",
    ceremonyCity: "Cuenca, Ecuador",
    ceremonyMap: "https://www.google.com/maps/search/?api=1&query=Iglesia+de+San+Blas+Cuenca+Ecuador",
    receptionPlace: "Bioyanuncay",
    receptionCity: "Vía a Soldados, Cuenca",
    receptionMap: "https://www.google.com/maps/search/?api=1&query=Bioyanuncay+Via+a+Soldados+Cuenca+Ecuador",
    timezone: "-05:00"             // Ecuador continental
  },

  // ---- Confirmación ----
  rsvpDeadline: "2026-10-04",      // domingo 4 de octubre (incluido)
  maxGuests: 10,                   // máximo de acompañantes por persona

  // ---- Textos ----
  texts: {
    invite:
      "Con mucha alegría y gratitud a Dios por el regalo de la vida, te invito a acompañarme el día en que recibiré el sacramento del Bautismo.",
    verse: "“Por este niño oraba, y el Señor me concedió lo que le pedí.”",
    verseRef: "1 Samuel 1:27",
    gratitude:
      "Tu presencia hará este día aún más especial. Gracias por acompañarnos con tu cariño, tus oraciones y tu alegría en este primer paso de fe de nuestro hijo.",
    closing: "Con amor y gratitud,"
  },

  // Frases sugeridas para quien no puede asistir (pueden editarlas antes de enviar)
  declineSuggestions: [
    "No podré asistir, pero les dejo mis mejores deseos y muchas felicitaciones en este día tan especial. ¡Un abrazo enorme para Isaac Mateo!",
    "Aunque no pueda estar presente, los acompaño con mis oraciones. Que Dios bendiga siempre a Isaac Mateo y a toda su familia.",
    "Lamento no poder acompañarlos. ¡Felicidades por este hermoso paso de fe! Los llevo en el corazón."
  ],

  // ---- Foto principal (círculo dorado) ----
  // Sube la foto a la carpeta img/ y escribe su ruta, por ejemplo: "img/isaac.jpg"
  mainPhoto: "",

  // ---- Música de fondo ----
  // Coloca el archivo de audio en la carpeta principal con este nombre.
  music: "musica.mp3",

  // ---- Galería (opcional) ----
  // Ejemplo: photos: ["img/foto1.jpg", "img/foto2.jpg"]
  photos: []
};
