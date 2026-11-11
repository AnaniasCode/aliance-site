import sys, os
from PIL import Image, ImageFilter, ImageDraw
D, OUT = sys.argv[1], sys.argv[2]
fs = sorted(os.listdir(D))
# código → (nº da peça nos arquivos, foto das costas, foto da frente)
MAP = {"AL-001": (2, 1, 3), "AL-002": (3, 2, 4), "AL-003": (4, 6, 5), "AL-004": (5, 8, 7),
       "AL-005": (6, 9, 10), "AL-006": (7, 12, 11), "AL-007": (8, 13, 15), "AL-008": (9, 14, 16)}
SIZE = 1200

def background(im, size):
    """Fundo do tamanho pedido, repetindo o degradê vertical das bordas da foto."""
    w, h = im.size
    edge = Image.new('RGB', (2, h))
    edge.paste(im.crop((0, 0, 10, h)).resize((1, h), Image.BOX), (0, 0))
    edge.paste(im.crop((w - 10, 0, w, h)).resize((1, h), Image.BOX), (1, 0))
    col = edge.resize((1, h), Image.BOX).filter(ImageFilter.GaussianBlur(8))
    return col.resize(size, Image.BICUBIC)

def feather(size, fade):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).rectangle((fade, fade, size[0] - fade, size[1] - fade), fill=255)
    return m.filter(ImageFilter.GaussianBlur(fade / 2))

def to_square(im):
    im = im.convert('RGB'); w, h = im.size
    canvas = background(im, (h, h))
    canvas.paste(im, ((h - w) // 2, 0), feather((w, h), 24))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)

def border_color(im):
    w, h = im.size
    parts = [im.crop((0, 0, 10, h)), im.crop((w - 10, 0, w, h)), im.crop((0, 0, w, 10)), im.crop((0, h - 10, w, h))]
    tot = [0, 0, 0]; n = 0
    for pt in parts:
        c = pt.resize((1, 1), Image.BOX).getpixel((0, 0)); a = pt.size[0] * pt.size[1]
        tot = [t + v * a for t, v in zip(tot, c)]; n += a
    return [t / n for t in tot]

def match_bg(im, target):
    """Ajusta o brilho para o fundo da foto ficar igual ao da outra."""
    src = border_color(im)
    lut = []
    for ch in range(3):
        g = target[ch] / max(1, src[ch])
        lut += [min(255, int(v * g + .5)) for v in range(256)]
    return im.point(lut)

def conjunto(front, back):
    f, b = front.convert('RGB'), back.convert('RGB')
    b = match_bg(b, border_color(f))
    w, h = f.size
    sq = background(f, (SIZE, SIZE))
    half = SIZE // 2
    scale = min(half * 1.0 / w, SIZE * 0.92 / h)
    fw, fh = int(w * scale), int(h * scale)
    for k, im in enumerate((f, b)):
        r = im.resize((fw, fh), Image.LANCZOS)
        sq.paste(r, (k * half + (half - fw) // 2, (SIZE - fh) // 2), feather((fw, fh), 16))
    return sq

only = sys.argv[3:] or list(MAP)
for code in only:
    n, ib, i_f = MAP[code]
    back = Image.open(os.path.join(D, fs[ib])); front = Image.open(os.path.join(D, fs[i_f]))
    opts = dict(quality=84, optimize=True, progressive=True)
    to_square(back).save(os.path.join(OUT, f'peca_{n}_costas_cinza.jpg'), **opts)
    to_square(front).save(os.path.join(OUT, f'peca_{n}_frente_cinza.jpg'), **opts)
    conjunto(front, back).save(os.path.join(OUT, f'peca_{n}_conjunto_cinza.jpg'), **opts)
    print(code, 'ok')
