"""Gera as imagens da vitrine a partir de capturas de tela dos jogos.

Uso (na raiz do projeto):
    python tools/imagens.py <pasta-com-as-capturas>

Entrada: <pasta>/<id>.png (1280x720), um por jogo listado em `CAPTURAS`.
Saída:   img/<id>.webp (800x450), img/og.jpg (1200x630, prévia de compartilhamento),
         img/apple-touch-icon.png (180x180).
Requer Pillow (`pip install pillow`) e a fonte Segoe UI (Windows) para o texto da prévia.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
IMG = RAIZ / "img"

# id do jogo (games.json) -> nome do arquivo de captura (sem extensão)
CAPTURAS = {
    "kabemjunto": "kabemjunto",
    "fendas": "fendas",
    "corrida": "corrida",
    "raizes": "raizes",
    "esconde": "esconde-cacador",
}

BG_TOPO = (14, 15, 35)
BG_BASE = (45, 27, 84)
AMARELO = (255, 210, 63)
TEXTO = (244, 243, 255)
MUDO = (179, 182, 220)


def fonte(nome, tamanho):
    for caminho in (f"C:/Windows/Fonts/{nome}", f"/usr/share/fonts/truetype/dejavu/{nome}"):
        if Path(caminho).exists():
            return ImageFont.truetype(caminho, tamanho)
    return ImageFont.load_default()


def arredondar(imagem, raio):
    mascara = Image.new("L", imagem.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, *imagem.size), raio, fill=255)
    saida = imagem.convert("RGBA")
    saida.putalpha(mascara)
    return saida


def gradiente(largura, altura):
    img = Image.new("RGB", (largura, altura))
    px = img.load()
    for y in range(altura):
        t = y / (altura - 1)
        cor = tuple(round(BG_TOPO[i] + (BG_BASE[i] - BG_TOPO[i]) * t) for i in range(3))
        for x in range(largura):
            px[x, y] = cor
    return img


def main(pasta):
    pasta = Path(pasta)
    miniaturas = []
    for jogo, arquivo in CAPTURAS.items():
        origem = pasta / f"{arquivo}.png"
        img = Image.open(origem).convert("RGB").resize((800, 450), Image.LANCZOS)
        img.save(IMG / f"{jogo}.webp", "WEBP", quality=78, method=6)
        miniaturas.append(img)
        print(f"img/{jogo}.webp", (IMG / f"{jogo}.webp").stat().st_size // 1024, "KB")

    # ---- prévia de compartilhamento 1200x630
    og = gradiente(1200, 630).convert("RGBA")
    d = ImageDraw.Draw(og)
    d.rounded_rectangle((56, 64, 120, 128), 16, fill=AMARELO)
    d.polygon([(79, 82), (79, 110), (103, 96)], fill=(27, 20, 0))
    d.text((140, 62), "Kabem Jogos", font=fonte("seguibl.ttf", 68), fill=TEXTO)
    d.text((56, 168), "Jogue no navegador.", font=fonte("seguibl.ttf", 54), fill=AMARELO)
    d.text((56, 238), "Sem instalar, sem cadastro. No celular ou no PC.", font=fonte("segoeui.ttf", 32), fill=MUDO)
    largura, vão, y = 208, 12, 400
    x = 56
    for mini in miniaturas:
        pequena = arredondar(mini.resize((largura, 117), Image.LANCZOS), 14)
        og.alpha_composite(pequena, (x, y))
        x += largura + vão
    og.convert("RGB").save(IMG / "og.jpg", "JPEG", quality=86, optimize=True)
    print("img/og.jpg", (IMG / "og.jpg").stat().st_size // 1024, "KB")

    # ---- ícone para a tela inicial do celular
    ic = Image.new("RGBA", (180, 180), AMARELO + (255,))
    ImageDraw.Draw(ic).polygon([(68, 52), (68, 128), (132, 90)], fill=(27, 20, 0))
    ic.convert("RGB").save(IMG / "apple-touch-icon.png")
    print("img/apple-touch-icon.png")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
