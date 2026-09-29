"""
Genera las imágenes pre-renderizadas de la invitación (img/):
  esquinas florales en 3 capas, corona de olivo, osito e íconos.
Uso (desde la carpeta del proyecto):  python3 tools/render-assets.py
Requiere: pip install playwright pillow  (y un Chromium instalado para Playwright)
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image

R = Path(__file__).resolve().parent.parent
js = lambda p: (R / p).read_text()

PAGE = f"""<html><body style="margin:0;background:transparent">
<script>{js("js/title-paths.js")}</script><script>{js("js/art.js")}</script><script>{js("tools/art-build.js")}</script>
<div id="out"></div>
<script>
document.body.insertAdjacentHTML("afterbegin", '<svg width="0" height="0" style="position:absolute"><defs>' + ART.defs() + ART.buildDefs() + '</defs></svg>');
const out = document.getElementById("out");
const add = (id, w, h, vb, inner, filter) => out.insertAdjacentHTML("beforeend",
  `<svg id="${{id}}" width="${{w}}" height="${{h}}" viewBox="${{vb}}" style="display:block"><g ${{filter ? `filter="url(#${{filter}})"` : ""}}>${{inner}}</g></svg>`);
for (const [name, seed] of [["a", 7], ["b", 13]]) {{
  const L = ART.cornerLayers(seed);
  for (const k of ["back", "mid", "front"]) add(`corner-${{name}}-${{k}}`, 640, 640, "0 0 300 300", L[k], "wcHQ");
}}
out.insertAdjacentHTML("beforeend", ART.wreath().replace("<svg ", '<svg id="wreath" width="860" height="560" '));
out.insertAdjacentHTML("beforeend", ART.bear().replace("<svg ", '<svg id="bear" width="360" height="394" '));
</script></body></html>"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1000, "height": 1000})
        await pg.set_content(PAGE)
        await pg.wait_for_timeout(400)
        for el in await pg.query_selector_all("#out > svg"):
            name = await el.get_attribute("id")
            png = R / "img" / f"{name}.png"
            await el.screenshot(path=str(png), omit_background=True)
            Image.open(png).save(R / "img" / f"{name}.webp", "WEBP", quality=86, method=6)
            png.unlink()
            print("img/%s.webp" % name, (R / "img" / f"{name}.webp").stat().st_size // 1024, "KB")
        # Íconos (pestaña y pantalla de inicio del celular)
        ico = (R / "img/favicon.svg").read_text()
        for size, name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png")]:
            pad = 0 if size == 32 else 18
            bg = "transparent" if size == 32 else "#faf7f0"
            svg = ico.replace("<svg ", '<svg width="100%" height="100%" ')
            await pg.set_content(f'<html><body style="margin:0;background:{bg}"><div id="i" style="width:{size}px;height:{size}px;padding:{pad}px;box-sizing:border-box">{svg}</div></body></html>')
            await (await pg.query_selector("#i")).screenshot(path=str(R / "img" / name), omit_background=(size == 32))
            print("img/" + name)
        await b.close()

asyncio.run(main())
