# Kabem Jogos

Vitrine estática dos jogos da Kabem: a **porta de entrada** para jogar no navegador. Mostra cada jogo com uma imagem de partida, uma descrição curta e um botão **Jogar** que leva direto ao jogo. Pensada para ser encontrada em buscas e compartilhada (celular primeiro).

- **Endereço:** https://jogos.kabemmanager.online
- **Sem framework e sem dependências:** uma página HTML, imagens WebP leves e um script de poucas linhas que só ativa o botão **Compartilhar**.
- **Sem cookies e sem rastreadores.**

## Como funciona

A página **não é escrita à mão**: `index.html` é gerado por `build.mjs` a partir de `games.json`. Assim os dados de cada jogo (texto, imagem, selos, dados estruturados para busca) ficam num lugar só e não saem de sincronia.

| Arquivo                    | Para que serve                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `games.json`               | Os dados do site e de cada jogo. **É o único arquivo que você edita para mudar a vitrine.**     |
| `build.mjs`                | Gera `index.html`, `sitemap.xml` e `robots.txt`. Valida o `games.json` antes de escrever.       |
| `index.html`               | **Gerado.** Vai commitado, porque a VPS serve a raiz do repositório sem build.                  |
| `img/*.webp`               | Imagem de cada jogo (800×450). `img/og.jpg` é a prévia de compartilhamento (1200×630).          |
| `tools/imagens.py`         | Converte capturas de tela em `img/*.webp`, `og.jpg` e `apple-touch-icon.png` (requer Pillow).   |
| `tools/capturar-telas.cjs` | Joga cada jogo por um navegador e salva uma captura em ação (requer Playwright).                |

## Mudar a vitrine

```bash
# edite games.json, depois:
node build.mjs
```

Abra `index.html` por um servidor local (por exemplo `python -m http.server 5290`) para conferir. Abrir o arquivo direto do disco também funciona para olhar, mas o botão de compartilhar e os caminhos relativos se comportam melhor por HTTP.

## Adicionar um jogo

1. Confirme que o jogo está no ar, em HTTPS, e que abre sem cadastro.
2. Adicione um objeto em `jogos` no `games.json`, com todos os campos (o `build.mjs` recusa o arquivo se faltar algum):
   `id`, `nome`, `gancho` (uma frase), `descricao`, `url`, `imagem`, `imagemAlt`, `modos`, `jogadores`, `duracao`, `plataforma`, `selo` (`null`, `"Beta"` ou `"Protótipo"`), `generos` e `playMode` (`SinglePlayer` e/ou `MultiPlayer`).
3. Gere a imagem: coloque uma captura 1280×720 em ação em uma pasta, acrescente o `id` em `CAPTURAS` no `tools/imagens.py` e rode `python tools/imagens.py <pasta>`. O primeiro jogo da lista é o **destaque** (cartão grande).
4. Rode `node build.mjs` e confira a página.
5. Faça o commit e atualize a VPS (abaixo).

**Escreva só o que o jogo faz de verdade.** A descrição é lida por pessoas e por mecanismos de busca; promessas que o jogo não cumpre custam jogadores. Use o selo **Beta** ou **Protótipo** para jogos incompletos.

**Nomes de terceiros:** não use marcas de outras empresas no texto da vitrine (nem como comparação), para não ligar os jogos a elas.

## Publicar (VPS)

A vitrine roda na mesma VPS dos jogos, servida pelo nginx dos jogos, atrás do Traefik com HTTPS. Nada atualiza sozinho: um `git push` **não** muda o site. Como `root` no terminal da VPS:

```bash
runuser -u jogos -- env HOME=/srv/jogos git -C /srv/jogos/vitrine pull --ff-only
```

Não há build nem reinício: o nginx serve os arquivos novos de imediato. A infraestrutura compartilhada (usuário `jogos`, nginx, rotas, firewall) e como desfazer tudo estão no [runbook da VPS](https://github.com/Alexandremocmg/kabemjunto/blob/main/docs/OPERACAO-VPS.md#6-outros-jogos-hospedados-nesta-vps).

> Não registre neste repositório o IP da VPS, o link do terminal web da Hostinger, tokens ou senhas.

## Busca e compartilhamento

O que já está no `index.html`, gerado pelo `build.mjs`:

- `<title>`, descrição, `canonical` e `robots`.
- Open Graph e Twitter Card, com `img/og.jpg` (a prévia que aparece ao colar o link no WhatsApp e nas redes).
- Dados estruturados (`schema.org`): um `WebSite` e uma lista de `VideoGame`, um por jogo.
- `sitemap.xml` e `robots.txt`.
- Cada cartão tem o botão **Compartilhar** (menu nativo do celular; no PC, copia o link).

Para a página ser **encontrada**, falta o que o código não faz: cadastrar o endereço no Google Search Console e no Bing Webmaster Tools, enviar o `sitemap.xml` e divulgar o link (redes, comunidades, canais). Para medir visitas sem rastreadores, use o log de acesso do nginx dos jogos.
