/* ============================================================
   Convierte textos en cursiva (Pinyon Script, licencia OFL) a trazos
   SVG por letra → js/title-paths.js
   Uso:  cd tools && npm i opentype.js @fontsource/pinyon-script
         node gen-title.js ../js/title-paths.js
   ============================================================ */
const opentype = require("opentype.js");
const fs = require("fs");
const buf = fs.readFileSync(require.resolve("@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff"));
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

function build(text, size) {
  const glyphs = [];
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const p of font.getPaths(text, 0, size, size, { kerning: true })) {
    const d = p.toPathData(1);
    if (!d) continue;
    const b = p.getBoundingBox();
    x1 = Math.min(x1, b.x1); y1 = Math.min(y1, b.y1); x2 = Math.max(x2, b.x2); y2 = Math.max(y2, b.y2);
    glyphs.push(d);
  }
  const pad = size * 0.06;
  const vb = [x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2].map((n) => Math.round(n * 10) / 10);
  return { viewBox: vb.join(" "), glyphs };
}
const out = { bautizo: build("Bautizo", 200), thanks: build("Gracias", 160), im: build("IM", 200) };
fs.writeFileSync(process.argv[2], "/* Trazos de la letra cursiva (generado por tools/gen-title.js desde Pinyon Script, licencia OFL) */\nwindow.TITLE_PATHS = " + JSON.stringify(out) + ";\n");
for (const k in out) console.log(k, out[k].viewBox, out[k].glyphs.length, "letras");
