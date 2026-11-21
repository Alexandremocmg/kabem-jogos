// Gera index.html, sitemap.xml e robots.txt a partir de games.json.
// Uso: node build.mjs        (sem dependências; Node 18 ou mais novo)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = dirname(fileURLToPath(import.meta.url));
const { site, jogos } = JSON.parse(readFileSync(join(raiz, 'games.json'), 'utf8'));

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (caminho) => `${site.url}/${caminho.replace(/^\//, '')}`;

// ----------------------------------------------------------------- validação
const ids = new Set();
for (const j of jogos) {
  for (const campo of ['id', 'nome', 'gancho', 'descricao', 'url', 'imagem', 'imagemAlt', 'modos', 'jogadores', 'duracao', 'plataforma', 'generos', 'playMode']) {
    if (j[campo] === undefined || j[campo] === '') throw new Error(`games.json: "${j.id ?? '?'}" sem o campo "${campo}"`);
  }
  if (ids.has(j.id)) throw new Error(`games.json: id repetido "${j.id}"`);
  ids.add(j.id);
  if (!/^https:\/\//.test(j.url)) throw new Error(`games.json: "${j.id}" precisa de uma url https`);
}

// ------------------------------------------------------------------ dados SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#site`,
      name: site.nome,
      url: `${site.url}/`,
      description: site.descricao,
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'ItemList',
      name: 'Jogos disponíveis',
      itemListElement: jogos.map((j, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'VideoGame',
          name: j.nome,
          description: j.descricao,
          url: j.url,
          image: abs(j.imagem),
          genre: j.generos,
          inLanguage: 'pt-BR',
          applicationCategory: 'Game',
          operatingSystem: 'Navegador (web)',
          gamePlatform: 'Navegador (web)',
          playMode: j.playMode,
        },
      })),
    },
  ],
};

// ----------------------------------------------------------------------- HTML
const icone = (nome) => {
  const caminhos = {
    relogio: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
    pessoas: 'M16 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0ZM6 20a6 6 0 0 1 12 0',
    aparelho: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM11 18h2',
  };
  return `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="${caminhos[nome]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};

const cartao = (j, i) => {
  const destaque = i === 0;
  const eager = i < 2;
  const selo = j.selo ? `<span class="selo">${esc(j.selo)}</span>` : '';
  const modos = j.modos.map((m) => `<span class="modo">${esc(m)}</span>`).join('');
  return `
      <article class="cartao${destaque ? ' destaque' : ''}" id="${esc(j.id)}">
        <a class="capa" href="${esc(j.url)}" aria-label="Jogar ${esc(j.nome)}" tabindex="-1">
          <img src="${esc(j.imagem)}" alt="${esc(j.imagemAlt)}" width="800" height="450"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>
        </a>
        <div class="corpo">
          <div class="etiquetas">${modos}${selo}</div>
          <h3>${esc(j.nome)}</h3>
          <p class="gancho">${esc(j.gancho)}</p>
          <p class="desc">${esc(j.descricao)}</p>
          <ul class="meta">
            <li>${icone('pessoas')}${esc(j.jogadores)}</li>
            <li>${icone('relogio')}${esc(j.duracao)}</li>
            <li>${icone('aparelho')}${esc(j.plataforma)}</li>
          </ul>
          <div class="acoes">
            <a class="jogar" href="${esc(j.url)}">Jogar ${esc(j.nome)}</a>
            <button class="compartilhar" type="button" hidden data-nome="${esc(j.nome)}" data-gancho="${esc(j.gancho)}" data-url="${esc(j.url)}">Compartilhar</button>
          </div>
        </div>
      </article>`;
};

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.titulo)}</title>
<meta name="description" content="${esc(site.descricao)}">
<link rel="canonical" href="${site.url}/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0e0f23">
<meta name="color-scheme" content="dark">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(site.nome)}">
<meta property="og:title" content="${esc(site.titulo)}">
<meta property="og:description" content="${esc(site.descricao)}">
<meta property="og:url" content="${site.url}/">
<meta property="og:image" content="${abs('img/og.jpg')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Kabem Jogos: jogue no navegador, sem instalar e sem cadastro">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(site.titulo)}">
<meta name="twitter:description" content="${esc(site.descricao)}">
<meta name="twitter:image" content="${abs('img/og.jpg')}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
:root{--bg:#0e0f23;--sup:#171a38;--sup2:#1f2347;--texto:#f4f3ff;--mudo:#b3b6dc;--amarelo:#ffd23f;--tinta:#1b1400;--verde:#2bd48a;--linha:rgba(255,255,255,.1);--raio:20px}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:radial-gradient(900px 500px at 85% -5%,#2c1d58 0%,transparent 70%),radial-gradient(700px 500px at -10% 10%,#12304a 0%,transparent 70%),var(--bg);color:var(--texto);font:400 1rem/1.55 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
a{color:inherit}
.pular{position:absolute;left:-999px}.pular:focus{left:12px;top:12px;z-index:9;background:var(--amarelo);color:var(--tinta);padding:10px 14px;border-radius:10px}
.wrap{width:min(1120px,100% - 32px);margin-inline:auto}
header{display:flex;align-items:center;justify-content:space-between;padding:18px 0}
.marca{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-size:1.15rem;letter-spacing:-.01em}
.marca svg{display:block}
nav{display:flex;gap:6px}
nav a{padding:8px 12px;border-radius:999px;text-decoration:none;color:var(--mudo);font-weight:600;font-size:.95rem}
nav a:hover{color:var(--texto);background:rgba(255,255,255,.07)}
.hero{padding:18px 0 8px}
h1{margin:0 0 10px;font-size:clamp(2rem,6.2vw,3.4rem);line-height:1.05;letter-spacing:-.03em;font-weight:900}
h1 span{color:var(--amarelo)}
.sub{margin:0 0 16px;color:var(--mudo);font-size:clamp(1rem,2.4vw,1.2rem);max-width:46ch}
.pilulas{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.pilulas li{display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--linha);border-radius:999px;background:rgba(255,255,255,.04);font-weight:600;font-size:.9rem}
.pilulas li::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--verde)}
main h2{font-size:1.35rem;margin:34px 0 14px;letter-spacing:-.01em}
.grade{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(min(100%,400px),1fr))}
.cartao{display:flex;flex-direction:column;background:linear-gradient(180deg,var(--sup2),var(--sup));border:1px solid var(--linha);border-radius:var(--raio);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.28);transition:transform .18s ease,border-color .18s ease}
.cartao:hover{transform:translateY(-3px);border-color:rgba(255,210,63,.45)}
.capa{display:block;aspect-ratio:16/9;overflow:hidden;background:#0a0b1a}
.capa img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.cartao:hover .capa img{transform:scale(1.04)}
.corpo{display:flex;flex-direction:column;gap:10px;padding:16px 16px 18px;flex:1}
.etiquetas{display:flex;flex-wrap:wrap;gap:6px}
.modo,.selo{padding:3px 10px;border-radius:999px;font-size:.78rem;font-weight:700;letter-spacing:.01em}
.modo{background:rgba(43,212,138,.14);color:#7ff0bc;border:1px solid rgba(43,212,138,.3)}
.selo{background:rgba(255,210,63,.16);color:var(--amarelo);border:1px solid rgba(255,210,63,.4)}
h3{margin:0;font-size:1.4rem;line-height:1.15;letter-spacing:-.02em}
.gancho{margin:0;color:var(--amarelo);font-weight:700}
.desc{margin:0;color:var(--mudo);font-size:.96rem}
.meta{display:flex;flex-wrap:wrap;gap:6px 14px;margin:2px 0 0;padding:0;list-style:none;color:var(--mudo);font-size:.88rem}
.meta li{display:flex;align-items:center;gap:6px}
.ic{flex:none;color:#8f94d6}
.acoes{display:flex;gap:10px;margin-top:auto;padding-top:8px}
.jogar{flex:1;display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 18px;border-radius:14px;background:var(--amarelo);color:var(--tinta);font-weight:800;text-decoration:none;text-align:center;box-shadow:0 6px 0 #b8901a;transition:transform .12s ease,box-shadow .12s ease}
.jogar:hover{transform:translateY(-1px);box-shadow:0 7px 0 #b8901a}
.jogar:active{transform:translateY(4px);box-shadow:0 2px 0 #b8901a}
.compartilhar{min-height:50px;padding:0 16px;border-radius:14px;border:1px solid var(--linha);background:rgba(255,255,255,.06);color:var(--texto);font:700 .95rem/1 inherit;font-family:inherit;cursor:pointer}
.compartilhar:hover{background:rgba(255,255,255,.12)}
.compartilhar[hidden]{display:none}
a:focus-visible,button:focus-visible{outline:3px solid #fff;outline-offset:3px}
.sobre{margin:44px 0 0;padding:22px;border:1px solid var(--linha);border-radius:var(--raio);background:rgba(255,255,255,.03)}
.sobre h2{margin:0 0 8px}
.sobre p{margin:0 0 10px;color:var(--mudo);max-width:70ch}
footer{padding:26px 0 40px;color:var(--mudo);font-size:.88rem}
.aviso{position:fixed;left:50%;bottom:22px;transform:translate(-50%,20px);opacity:0;padding:12px 18px;border-radius:12px;background:#fff;color:#111;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.4);transition:.25s;pointer-events:none}
.aviso.ver{opacity:1;transform:translate(-50%,0)}
@media(min-width:880px){
 .destaque,.grade>.cartao:last-child:nth-child(even){grid-column:1/-1;flex-direction:row}
 .destaque .capa,.grade>.cartao:last-child:nth-child(even) .capa{flex:1.15;aspect-ratio:auto;min-height:340px}
 .destaque .corpo,.grade>.cartao:last-child:nth-child(even) .corpo{flex:1;justify-content:center;padding:26px 28px}
 .destaque h3{font-size:2rem}
 .destaque .desc{font-size:1.02rem}
}
@media(max-width:600px){
 header{padding:12px 0}
 .marca{font-size:1.05rem}
 .hero{padding:2px 0 0}
 h1{font-size:1.9rem;margin-bottom:8px}
 .sub{font-size:.98rem;margin-bottom:12px}
 .pilulas{gap:6px}
 .pilulas li{padding:4px 10px;font-size:.8rem}
 main h2{margin:22px 0 12px}
}
@media(prefers-reduced-motion:reduce){*{transition:none!important}.cartao:hover,.jogar:hover{transform:none}.cartao:hover .capa img{transform:none}}
</style>
</head>
<body>
<a class="pular" href="#jogos">Ir para os jogos</a>
<div class="wrap">
  <header>
    <a class="marca" href="/" aria-label="${esc(site.nome)}, página inicial">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#ffd23f"/><path d="M13 9.5v15l12-7.5z" fill="#1b1400"/></svg>
      ${esc(site.nome)}
    </a>
    <nav aria-label="Principal"><a href="#jogos">Jogos</a><a href="#sobre">Sobre</a></nav>
  </header>

  <section class="hero" aria-labelledby="titulo">
    <h1 id="titulo">Jogue agora, <span>direto no navegador.</span></h1>
    <p class="sub">Escolha um jogo e entre em segundos, no celular ou no PC. Tem carta, corrida, aventura e esconde-esconde em 3D.</p>
    <ul class="pilulas"><li>Sem instalar</li><li>Sem cadastro</li><li>Celular e PC</li></ul>
  </section>

  <main>
    <h2 id="jogos">Escolha um jogo</h2>
    <div class="grade">${jogos.map(cartao).join('')}
    </div>

    <section class="sobre" id="sobre" aria-labelledby="sobre-t">
      <h2 id="sobre-t">Sobre a Kabem Jogos</h2>
      <p>Jogos independentes feitos em português, para jogar rápido, sem fila de download. Tudo roda no seu navegador: é só tocar em <strong>Jogar</strong>.</p>
      <p>Alguns jogos estão em fase de teste e podem mudar com o tempo. Os rótulos <strong>Beta</strong> e <strong>Protótipo</strong> avisam quais. Esta página não usa cookies nem rastreadores.</p>
    </section>
  </main>

  <footer>© ${site.atualizado.slice(0, 4)} ${esc(site.nome)}. Atualizado em ${esc(site.atualizado.split('-').reverse().join('/'))}.</footer>
</div>
<div class="aviso" role="status" aria-live="polite" id="aviso"></div>
<script>
(function(){
  var aviso=document.getElementById('aviso'),t;
  function dizer(m){aviso.textContent=m;aviso.classList.add('ver');clearTimeout(t);t=setTimeout(function(){aviso.classList.remove('ver')},2200)}
  function copiar(url){
    if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(url).then(function(){dizer('Link copiado')},function(){dizer(url)})}
    dizer(url)
  }
  document.querySelectorAll('.compartilhar').forEach(function(b){
    b.hidden=false;
    b.addEventListener('click',function(){
      var d={title:b.dataset.nome,text:b.dataset.nome+': '+b.dataset.gancho,url:b.dataset.url};
      if(navigator.share){navigator.share(d).catch(function(e){if(e&&e.name!=='AbortError')copiar(d.url)})}else{copiar(d.url)}
    })
  })
})();
</script>
</body>
</html>
`;

writeFileSync(join(raiz, 'index.html'), html);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site.url}/</loc>
    <lastmod>${site.atualizado}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
writeFileSync(join(raiz, 'sitemap.xml'), sitemap);
writeFileSync(join(raiz, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`ok: ${jogos.length} jogos -> index.html (${Buffer.byteLength(html)} bytes), sitemap.xml, robots.txt`);
