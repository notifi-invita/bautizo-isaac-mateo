"""
Genera los íconos de la invitación a partir de img/favicon.svg:
  img/favicon-32.png (pestaña del navegador) e img/apple-touch-icon.png (inicio del celular).
Las ilustraciones (ramo, corona, osito, ramita y palomas) son acuarelas en img/ y no se generan aquí.
Uso (desde la carpeta del proyecto):  python3 tools/render-assets.py
Requiere: pip install playwright  (y un Chromium instalado para Playwright)
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

R = Path(__file__).resolve().parent.parent

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 400, "height": 400})
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
