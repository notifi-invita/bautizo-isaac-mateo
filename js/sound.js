/* ============================================================
   Efectos de sonido sutiles, sintetizados con Web Audio
   (no se descarga ningún archivo). Solo suenan si el invitado
   eligió abrir con sonido; el botón de música los apaga también.
   SFX.crack()  sello de lacre que se parte
   SFX.paper()  papel que se desliza
   SFX.glint()  destello de luz (campanita muy suave)
   SFX.flutter() aleteo de palomas
   SFX.chime()  arpegio de gratitud al confirmar
   SFX.tick()   roce mínimo al pasar sobre un botón
   También lleva la música por un control de volumen propio
   (en iPhone el volumen del <audio> no se puede cambiar).
   ============================================================ */
(function () {
  "use strict";
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, master = null, noise = null, on = false, lastTick = 0, sleepT = 0;

  function init() {
    if (ctx || !AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      // Compresor suave para que ningún efecto sobresalga
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
      master.connect(comp).connect(ctx.destination);
      // Dos segundos de ruido blanco reutilizable
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (_) { ctx = null; }
  }
  const ready = () => on && ctx && ctx.state === "running";

  // Envolvente: sube en "a" segundos hasta "peak" y cae exponencialmente en "r"
  function env(g, t, peak, a, r) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
  }
  function noiseSrc(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    // Punto de inicio al azar, sin pasarse del final del búfer
    s.start(t, Math.random() * Math.max(0, noise.duration - dur), dur);
    return s;
  }
  function filter(type, f, q) {
    const b = ctx.createBiquadFilter();
    b.type = type; b.frequency.value = f; b.Q.value = q || 0.7;
    return b;
  }
  function tone(freq, t, peak, a, r, type, detune) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    env(g, t, peak, a, r);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + a + r + 0.05);
  }

  const SFX = {
    enable() {
      init();
      on = !!ctx;
      clearTimeout(sleepT);
      if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
    },
    // Se apaga el motor de audio tras el fundido de la música (ahorra batería)
    disable() {
      on = false;
      clearTimeout(sleepT);
      if (ctx) sleepT = setTimeout(() => { if (!on && ctx.state === "running") ctx.suspend().catch(() => {}); }, 900);
    },
    get on() { return ready(); },
    now() { return ctx ? ctx.currentTime : 0; },

    // Conecta un <audio> a un control de volumen (una sola vez). Devuelve el GainNode o null.
    connectMedia(el) {
      init();
      if (!ctx) return null;
      if (el._gain) return el._gain;
      try {
        const g = ctx.createGain();
        g.gain.value = 0;
        ctx.createMediaElementSource(el).connect(g).connect(ctx.destination);
        el._gain = g;
        return g;
      } catch (_) { return null; }
    },

    crack() {
      if (!ready()) return;
      const t = ctx.currentTime + 0.01;
      // Chasquido seco + dos microfracturas + golpe grave del lacre
      [0, 0.028, 0.061].forEach((dt, i) => {
        const s = noiseSrc(t + dt, 0.12), b = filter("bandpass", 2400 - i * 500, 1.4), g = ctx.createGain();
        env(g, t + dt, i ? 0.22 : 0.5, 0.002, i ? 0.05 : 0.09);
        s.connect(b).connect(g).connect(master);
      });
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(190, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.16);
      env(g, t, 0.28, 0.004, 0.16);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.25);
    },

    paper(dur) {
      if (!ready()) return;
      dur = dur || 0.9;
      const t = ctx.currentTime + 0.01;
      const s = noiseSrc(t, dur + 0.1), hp = filter("highpass", 600), bp = filter("bandpass", 900, 0.6), g = ctx.createGain();
      bp.frequency.setValueAtTime(900, t);
      bp.frequency.exponentialRampToValueAtTime(3200, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(hp).connect(bp).connect(g).connect(master);
    },

    glint() {
      if (!ready()) return;
      const t = ctx.currentTime + 0.02;
      // Sol, Si y Re agudos con un leve desafinado: brillo cálido, nada estridente
      [[1568, 0], [1976, 0.05], [2349, 0.1]].forEach(([f, dt]) => {
        tone(f, t + dt, 0.045, 0.01, 1.8, "sine", 3);
        tone(f * 2, t + dt, 0.012, 0.01, 0.9, "sine", -4);
      });
    },

    flutter(n) {
      if (!ready()) return;
      const t = ctx.currentTime + 0.01, beats = n || 7;
      for (let i = 0; i < beats; i++) {
        const at = t + i * 0.075, k = 1 - i / beats;
        const s = noiseSrc(at, 0.08), b = filter("lowpass", 1100 + Math.random() * 400), g = ctx.createGain();
        env(g, at, 0.16 * k + 0.02, 0.012, 0.055);
        s.connect(b).connect(g).connect(master);
      }
    },

    chime() {
      if (!ready()) return;
      const t = ctx.currentTime + 0.02;
      // Do, Mi, Sol, Do: un "gracias" musical muy corto
      [1047, 1319, 1568, 2093].forEach((f, i) => {
        tone(f, t + i * 0.11, 0.05, 0.008, 1.6, "sine", 2);
        tone(f * 3, t + i * 0.11, 0.006, 0.008, 0.5, "sine");
      });
    },

    tick() {
      if (!ready()) return;
      const now = performance.now();
      if (now - lastTick < 90) return;
      lastTick = now;
      const t = ctx.currentTime + 0.005;
      const s = noiseSrc(t, 0.03), b = filter("bandpass", 5200, 3), g = ctx.createGain();
      env(g, t, 0.05, 0.001, 0.022);
      s.connect(b).connect(g).connect(master);
    }
  };

  // Al volver a la pestaña el navegador puede suspender el audio
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (on) ctx.resume().catch(() => {});
  });

  window.SFX = SFX;
})();
