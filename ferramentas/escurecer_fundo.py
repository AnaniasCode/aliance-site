import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
TARGET = 205.0  # cinza do fundo das fotos antigas

def bg_mask(rgb):
    L = rgb.mean(axis=2)
    Lb = ndi.gaussian_filter(L, 1.5)
    grad = np.hypot(ndi.sobel(Lb, 0), ndi.sobel(Lb, 1)) / 8.0
    h, w = L.shape
    B = np.concatenate([L[:, :20], L[:, -20:]], axis=1).mean(axis=1)
    B = ndi.gaussian_filter1d(B, 15)[:, None] * np.ones((1, w))
    # contorno da camisa: qualquer variação acima do ruído do fundo
    edges = grad > 0.7
    GAP = 7  # fecha falhas do contorno de até ~14 px
    wall = ndi.binary_dilation(edges, iterations=GAP)
    cand = ~wall & (np.abs(Lb - B) < 25)
    lab, n = ndi.label(cand)
    edge_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg0 = np.isin(lab, edge_labels[edge_labels > 0])
    # devolve a faixa perdida perto do contorno, só onde o tom é de fundo
    bg = ndi.binary_dilation(bg0, iterations=GAP) & (np.abs(Lb - B) < 10) & (grad < 2.5)
    shirt = ndi.binary_fill_holes(~bg)
    # faixa logo em volta da camisa com tom de fundo: também é fundo (evita brilho claro no contorno)
    near = ndi.binary_dilation(bg, iterations=GAP + 4)
    bg = bg | (near & shirt & (np.abs(Lb - B) < 16))
    shirt = ndi.binary_fill_holes(~bg)
    shirt = ndi.binary_erosion(shirt, iterations=2)
    m = ~shirt
    return ndi.gaussian_filter(m.astype(float), 1.8), B

def darken(path_in, path_out, maskout=None):
    im = Image.open(path_in).convert('RGB'); rgb = np.asarray(im).astype(float)
    m, B = bg_mask(rgb)
    # fundo neutro: cada canal de cor vai para o mesmo cinza das fotos antigas
    w = rgb.shape[1]
    Bc = np.concatenate([rgb[:, :20], rgb[:, -20:]], axis=1).mean(axis=1)  # (h, 3)
    from scipy.ndimage import gaussian_filter1d
    Bc = gaussian_filter1d(Bc, 15, axis=0)[:, None, :]
    dark = rgb * (TARGET / np.clip(Bc, 1, None))
    out = rgb * (1 - m[..., None]) + dark * m[..., None]
    Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8)).save(path_out, quality=84, optimize=True, progressive=True)
    if maskout: Image.fromarray((m * 255).astype(np.uint8)).save(maskout)

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith('.jpg'):
            darken(os.path.join(src, f), os.path.join(dst, f), os.path.join(dst, f.replace('.jpg', '_mask.png')) if len(sys.argv) > 3 else None)
            print(f)
