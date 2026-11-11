import sys, base64, io
from PIL import Image, ImageOps, ImageFilter, ImageDraw
src, out = sys.argv[1], sys.argv[2]
g = Image.open(src).convert('L')
inv = ImageOps.invert(g)
mask = inv.point(lambda v: 0 if v < 60 else min(255, int((v - 60) * 255 / 120)))
mask = mask.crop(mask.point(lambda v: 255 if v > 80 else 0).getbbox())
side = int(max(mask.size) * 1.04)  # quase sem margem: raquetes ocupam a aba toda
sq = Image.new('L', (side, side), 0)
sq.paste(mask, ((side - mask.width) // 2, (side - mask.height) // 2))

def m(n, thicken=0):
    x = sq.resize((n * 4, n * 4), Image.LANCZOS)
    if thicken: x = x.filter(ImageFilter.MaxFilter(thicken))
    return x.resize((n, n), Image.LANCZOS)

DARK = (31, 24, 19)      # marrom escuro da marca (aba clara)
LIGHT = (238, 228, 210)  # marfim (aba escura)
def colored(n, thicken, color):
    """Raquetes escuras com um contorno claro fino: aparecem em aba clara e escura."""
    core = m(n, thicken)
    halo = core.filter(ImageFilter.MaxFilter(3))
    im = Image.new('RGBA', (n, n), LIGHT + (0,))
    im.putalpha(halo.point(lambda v: int(v * .9)))
    top = Image.new('RGBA', (n, n), color + (0,)); top.putalpha(core)
    return Image.alpha_composite(im, top)

# PNG/ICO transparentes (raquetes escuras) — usados por navegadores sem ícone SVG
i16, i32, i48 = colored(16, 3, DARK), colored(32, 3, DARK), colored(48, 3, DARK)
i32.save(f'{out}/favicon-32.png'); i16.save(f'{out}/favicon-16.png')
i48.save(f'{out}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[i16, i32])

# SVG que troca de cor conforme o tema do navegador (Chrome, Edge, Firefox)
mk = m(64, 5)  # máscara 64px com traço reforçado para tamanhos pequenos
buf = io.BytesIO(); mk.save(buf, 'PNG', optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64">
<style>.r{{fill:#1f1813}}@media (prefers-color-scheme:dark){{.r{{fill:#eee4d2}}}}</style>
<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><image width="64" height="64" href="data:image/png;base64,{b64}" xlink:href="data:image/png;base64,{b64}"/></mask>
<rect class="r" width="64" height="64" mask="url(#m)"/>
</svg>'''
open(f'{out}/favicon.svg', 'w').write(svg)
print('svg bytes', len(svg))
