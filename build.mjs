import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const { site, jogos } = JSON.parse(readFileSync(root + 'games.json', 'utf8'));
const turbo = jogos.find(game => game.id === 'turbo');
const turboPath = 'jogos/turbo-mare/';
const kabem = jogos.find(game => game.id === 'kabemjunto');
const kabemPath = 'jogos/kabemjunto/';
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const absolute = path => new URL(path, site.url + '/').href;
const categories = [
  ['todos', 'Todos'], ['amigos', 'Com amigos'], ['rapidas', 'Partidas rápidas'],
  ['estrategia', 'Estratégia'], ['aventuras', 'Aventuras solo']
];
const gameCategories = {
  turbo: 'amigos rapidas', 'metro-dash': 'rapidas', casa64: 'estrategia',
  kabemjunto: 'amigos estrategia', corrida: 'rapidas',
  fendas: 'amigos rapidas', esconde: 'amigos rapidas', raizes: 'aventuras'
};
const tracks = [
  ['Baía do Kraken', 'copa-baia', 'Pilotos no píer da Baía do Kraken, com um tentáculo atravessando a pista.',
    'Pegue os anéis de turbo, salte entre plataformas e escape dos tentáculos no píer tropical.'],
  ['Estaleiro à Deriva', 'copa-estaleiro', 'Contêineres e guindastes cercam a pista do Estaleiro à Deriva.',
    'Desvie das cargas em movimento. Contorne pelo cais estreito ou salte no contêiner suspenso.'],
  ['Farol da Ressaca', 'copa-farol', 'Passarela em espiral ao redor do Farol da Ressaca, sobre a água.',
    'A maré baixa revela dois atalhos de pedra. Na maré alta, siga pela pista principal e suba em espiral até a lanterna.']
];
const title = 'Turbo Maré — Copa das Marés | Kabem Jogos';
const description = 'Dispute três pistas de corrida 3D com até seis pilotos no navegador. Veja como criar uma sala, os controles e os atalhos da maré baixa.';
const shareImage = 'img/turbo-social.jpg';
const kabemTitle = 'Kabemjunto — O jogo de cartas que te denuncia | Kabem Jogos';
const kabemDescription = 'Jogue Kabemjunto grátis no navegador com 2 a 10 pessoas, sem cadastro. Mesa 3D, Regra do 7 no chat, Corta-Frente e 0+ Zero Mais para devolver ataques.';
const kabemShareImage = 'img/kabemjunto-social.jpg';
const kabemCards = [
  ['0+ Zero Mais', '1 carta única', 'img/kabemjunto/zero-mais.webp',
    'Devolve toda a pilha de ataque acumulado para o último atacante, sem defesa. Sem ataque ativo, escolhe a cor.'],
  ['+2 Para Todos', '1 carta', 'img/kabemjunto/mais-dois-todos.webp',
    'Todos os adversários compram 2 cartas na hora, sem defesa ou repasse. Quem jogou escolhe a cor.'],
  ['Troca Mão', '1 carta', 'img/kabemjunto/troca-mao.webp',
    'Escolha qualquer adversário na mesa e troque todas as suas cartas pelas dele.'],
  ['Gira Mão', '1 carta', 'img/kabemjunto/gira-mao.webp',
    'Todas as mãos da mesa passam para o jogador ao lado no sentido atual da rodada.'],
  ['+4', '4 cartas', 'img/kabemjunto/mais-quatro.webp',
    'Obriga o próximo a comprar 4 cartas (ou empilhar outro +4 / devolver com 0+ Zero Mais) e define a nova cor.'],
  ['Coringa', '1 carta', 'img/kabemjunto/coringa.webp',
    'Muda a cor ativa da mesa na hora que você precisar.']
];

if (!turbo) throw new Error('Turbo Maré é obrigatório no catálogo.');
if (!kabem) throw new Error('Kabemjunto é obrigatório no catálogo.');
const used = new Set();
for (const game of jogos) {
  for (const key of ['id', 'nome', 'gancho', 'descricao', 'url', 'imagem', 'imagemAlt', 'modos', 'jogadores', 'duracao', 'plataforma', 'generos', 'playMode']) {
    if (!game[key]?.length) throw new Error(`Campo "${key}" ausente em ${game.id}`);
  }
  if (used.has(game.id) || !/^[a-z0-9-]+$/.test(game.id)) throw new Error(`ID de jogo inválido ou duplicado: ${game.id}`);
  if (new URL(game.url, site.url).protocol !== 'https:') throw new Error(`URL sem HTTPS em ${game.id}`);
  if (game.url.startsWith('./')) readFileSync(root + game.url.slice(2) + 'index.html');
  used.add(game.id);
}
for (const image of [
  shareImage,
  kabemShareImage,
  ...jogos.map(game => game.imagem),
  ...tracks.map(([, img]) => `img/${img}.webp`),
  ...kabemCards.map(([, , img]) => img)
]) {
  if (!readFileSync(root + image).length) throw new Error(`Imagem vazia: ${image}`);
}

function gameSchema(game) {
  return {
    '@type': 'VideoGame', name: game.nome, description: game.descricao,
    url: game.id === 'turbo' ? absolute(turboPath) : game.id === 'kabemjunto' ? absolute(kabemPath) : absolute(game.url),
    image: absolute(game.imagem), genre: game.generos, inLanguage: 'pt-BR',
    gamePlatform: 'Navegador', playMode: game.playMode.map(mode => `https://schema.org/${mode}`)
  };
}

function page({
  heading,
  description,
  path = '',
  relative = './',
  schema,
  content,
  detail = false,
  ogImage = detail ? shareImage : 'img/og.jpg',
  ogAlt = detail ? 'Turbo Maré e Copa das Marés sobre uma captura do Farol da Ressaca' : 'Kabem Jogos e capturas de jogos do catálogo'
}) {
  const url = absolute(path);
  const ogImageUrl = absolute(ogImage);
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(heading)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#0d1526">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="${esc(url)}">
  <link rel="icon" href="${relative}favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${relative}img/apple-touch-icon.png">
  <link rel="stylesheet" href="${relative}site.css">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Kabem Jogos">
  <meta property="og:title" content="${esc(heading)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(ogImageUrl)}">
  <meta property="og:image:alt" content="${esc(ogAlt)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...schema }).replace(/</g, '\\u003c')}</script>
  <script src="${relative}site.js" defer></script>
</head>
<body class="${detail ? 'game-page' : 'home'}">
  <a class="skip-link" href="#principal">Pular para o conteúdo</a>
  <header class="topbar">
    <div class="wrap topbar-inner">
      <a class="brand" href="${relative}" aria-label="Kabem Jogos, início"><span aria-hidden="true">K</span>KABEM<span class="brand-games"> JOGOS</span></a>
      <nav aria-label="Principal"><a href="${relative}#jogos">Jogos</a><a href="${relative}${turboPath}">Copa das Marés</a><a href="${relative}${kabemPath}">Kabemjunto</a></nav>
    </div>
  </header>
  <main id="principal" tabindex="-1">${content}
  </main>
  <footer id="sobre"><div class="wrap footer-inner"><a class="brand" href="${relative}">KABEM<span class="brand-games"> JOGOS</span></a>
    <p>Jogos independentes feitos em português.</p><a href="https://github.com/Alexandremocmg/kabem-jogos">GitHub <span aria-hidden="true">↗</span></a></div></footer>
  <p id="aviso" class="notice" role="status"></p>
</body>
</html>
`;
}

function play(game, label, origin) {
  return `<a class="button primary" href="${esc(game.url)}" aria-label="Jogar ${esc(game.nome)}" data-play="${esc(game.id)}" data-origin="${origin}">${esc(label)} <span aria-hidden="true">↗</span></a>`;
}

function share(game, url) {
  return `<button class="button quiet share" type="button" hidden aria-label="Compartilhar ${esc(game.nome)}" data-share="${esc(url)}" data-title="${esc(game.nome)}" data-game="${esc(game.id)}">Compartilhar <span aria-hidden="true">↗</span></button>`;
}

function hero(detail = false) {
  const base = detail ? '../../' : './';
  return `
    <section class="feature wrap" aria-labelledby="feature-title">
      <div class="feature-media">
        <img src="${base}img/copa-farol.webp" width="1200" height="675" alt="${esc(tracks[2][2])}" fetchpriority="high">
      </div>
      <div class="feature-copy">
        <p class="eyebrow">${detail ? 'Copa das Marés' : 'Turbo Maré'}</p>
        <h1 id="feature-title">${detail ? 'Turbo <em>Maré</em>' : 'Copa das <em>Marés</em>'}</h1>
        <p>${detail ? 'Corrida 3D em três pistas, com maré baixa, obstáculos e um pódio para decidir quem manda na água.' : 'Do píer do Kraken ao topo do Farol. Três provas, um placar e até seis pilotos na mesma sala.'}</p>
        <div class="actions">${play(turbo, 'Jogar Turbo Maré', detail ? 'turbo_capa' : 'inicio_destaque')}
          ${detail ? share(turbo, absolute(turboPath)) : `<a class="button quiet" href="./${turboPath}">Conheça a Copa <span aria-hidden="true">→</span></a>`}
        </div>
      </div>
      <div class="feature-caption">Farol da Ressaca <span aria-hidden="true">◆</span> Final da Copa</div>
    </section>`;
}

function card(game) {
  const info = game.id === 'turbo'
    ? `<a class="text-link" href="./${turboPath}">Ver pistas</a>`
    : game.id === 'kabemjunto'
      ? `<a class="text-link" href="./${kabemPath}">Como jogar</a>`
      : share(game, absolute(game.url));
  return `
      <article class="card" id="${esc(game.id)}" data-groups="${esc(gameCategories[game.id] || '')}">
        <div class="card-cover"><img src="./${esc(game.imagem)}" width="800" height="450" alt="${esc(game.imagemAlt)}" loading="lazy" decoding="async">${game.selo ? `<span class="badge">${esc(game.selo)}</span>` : ''}</div>
        <div class="card-content">
          <p class="category">${esc(game.generos[0])} <span aria-hidden="true">/</span> ${esc(game.plataforma)}</p>
          <h3>${esc(game.nome)}</h3>
          <p class="card-description">${esc(game.gancho)}</p>
          <p class="game-meta">${esc(game.jogadores)} <span aria-hidden="true">·</span> ${esc(game.duracao)}</p>
          <div class="actions">${play(game, 'Jogar', 'catalogo')} ${info}</div>
        </div>
      </article>`;
}

const home = `${hero()}
    <section id="jogos" class="wrap collection" aria-labelledby="catalog-title">
      <div class="section-heading"><div><p class="eyebrow">Catálogo</p><h2 id="catalog-title">Escolha seu jogo</h2></div>
        <div class="filters" role="group" aria-label="Filtrar jogos" hidden>${categories.map(([key, name]) =>
          `<button type="button" data-filter="${key}" aria-pressed="${key === 'todos'}">${name}</button>`).join('')}</div>
      </div>
      <p id="filter-status" class="sr-only" role="status"></p>
      <div class="grid">${[turbo, ...jogos.filter(game => game !== turbo)].map(card).join('')}
      </div>
    </section>`;
const trackCards = tracks.map(([name, image, alt, desc], index) => `
      <article class="card">
        <div class="card-cover"><img src="../../img/${image}.webp" width="1200" height="675" alt="${esc(alt)}" loading="lazy" decoding="async"></div>
        <div class="card-content"><p class="category">${index === 2 ? 'Final' : `${index + 1}ª prova`}</p><h3>${name}</h3><p class="card-description">${desc}</p></div>
      </article>`).join('');
const detail = `${hero(true)}
    <div class="wrap detail-nav"><a href="../../#jogos">← Todos os jogos</a><a href="#pistas">Pistas</a><a href="#com-amigos">Com amigos</a><a href="#controles">Controles</a></div>
    <section class="wrap collection" id="pistas" aria-labelledby="pistas-title">
      <div class="section-heading"><div><p class="eyebrow">Copa das Marés</p><h2 id="pistas-title">As três pistas</h2></div></div>
      <div class="grid">${trackCards}</div>
    </section>
    <div class="wrap guide">
      <section class="panel" id="com-amigos">
        <p class="eyebrow">2 a 6 pilotos</p><h2>Jogue com amigos</h2>
        <ol>
          <li>Abra o jogo, escolha <strong>Jogar com amigos</strong> e crie uma sala.</li>
          <li>Copie o convite e envie ao grupo. Cada amigo abre o link, escolhe um apelido e entra.</li>
          <li>Com o grupo na sala, clique em <strong>Largar na Baía</strong>. Depois do pódio, <strong>Revanche</strong> abre outra Copa com o mesmo convite.</li>
        </ol>
        <p>As provas somam 10, 8, 6, 4, 2 e 1 ponto por colocação. Em caso de empate na soma, vale a pontuação do Farol.</p>
      </section>
      <section class="panel" id="controles">
        <h2>Controles</h2>
        <table><thead><tr><th scope="col">Ação</th><th scope="col">PC</th><th scope="col">Celular</th></tr></thead>
          <tbody><tr><th scope="row">Mover</th><td>WASD ou setas</td><td>Arraste na metade esquerda</td></tr>
          <tr><th scope="row">Pular</th><td>Espaço</td><td>Um toque na metade direita</td></tr>
          <tr><th scope="row">Mergulhar</th><td>Shift</td><td>Dois toques na metade direita</td></tr></tbody></table>
        <p>Pode jogar solo contra bots ou entrar em <strong>Treino livre</strong> para aprender os saltos.</p>
        <div class="actions">${play(turbo, 'Jogar Turbo Maré', 'turbo_controles')}</div>
      </section>
    </div>`;

const kabemHero = `
    <section class="feature wrap" aria-labelledby="feature-title">
      <div class="feature-media">
        <img src="../../${esc(kabem.imagem)}" width="800" height="450" alt="${esc(kabem.imagemAlt)}" fetchpriority="high">
      </div>
      <div class="feature-copy">
        <p class="eyebrow">Cartas · 2 a 10 jogadores</p>
        <h1 id="feature-title">Kabem<em>junto</em></h1>
        <p>O jogo de cartas que te denuncia. Reúna de 2 a 10 pessoas na mesma mesa 3D pelo navegador, sem cadastro e sem baixar nada.</p>
        <div class="actions">${play(kabem, 'Jogar Kabemjunto', 'kabemjunto_capa')} ${share(kabem, absolute(kabemPath))}</div>
      </div>
      <div class="feature-caption">Baralho de 109 cartas <span aria-hidden="true">◆</span> Mesa 3D e 2D</div>
    </section>`;
const kabemSpecialCards = kabemCards.map(([name, qty, image, desc]) => `
      <article class="card">
        <div class="card-cover deck-card"><img src="../../${esc(image)}" alt="Carta ${esc(name)} do Kabemjunto" loading="lazy" decoding="async"></div>
        <div class="card-content"><p class="category">${esc(qty)}</p><h3>${esc(name)}</h3><p class="card-description">${esc(desc)}</p></div>
      </article>`).join('');
const kabemDetail = `${kabemHero}
    <div class="wrap detail-nav"><a href="../../#jogos">← Todos os jogos</a><a href="#regras">Regras</a><a href="#cartas">Cartas especiais</a><a href="#como-jogar">Como jogar</a><a href="#duvidas">Dúvidas</a></div>
    <section class="wrap collection" id="regras" aria-labelledby="regras-title">
      <div class="section-heading"><div><p class="eyebrow">Por que vira caos</p><h2 id="regras-title">4 regras que mudam tudo na mesa</h2></div></div>
      <div class="rules-grid">
        <section class="panel">
          <p class="eyebrow">Online</p>
          <h3>Regra do 7 (Silêncio)</h3>
          <p>O 7 tem face comum, sem ícone especial. Quando cai na mesa online, abre o silêncio até a próxima carta: quem mandar mensagem ou fala rápida no chat compra +2 na hora.</p>
        </section>
        <section class="panel">
          <p class="eyebrow">Reviravolta</p>
          <h3>0+ Zero Mais (Reflexo)</h3>
          <p>Recebeu uma pilha acumulada de +2 e +4? Jogue o 0+ Zero Mais para devolver tudo ao último atacante, sem direito a defesa.</p>
        </section>
        <section class="panel">
          <p class="eyebrow">Fora da vez</p>
          <h3>Corta-Frente</h3>
          <p>Tem uma carta idêntica (mesma cor e mesmo número ou ação) à que acabou de cair? Arraste antes do anel acabar para cortar a frente fora da vez.</p>
        </section>
        <section class="panel">
          <p class="eyebrow">Combos</p>
          <h3>Descarte Múltiplo e Ataques</h3>
          <p>Junte duas ou mais cartas da mesma face para jogar de uma vez. Nos ataques, +2 soma com +2 e +4 cobre +2 ou +4, mas +2 sobre +4 é proibido.</p>
        </section>
      </div>
    </section>
    <section class="wrap collection" id="cartas" aria-labelledby="cartas-title">
      <div class="section-heading"><div><p class="eyebrow">Baralho de 109 cartas</p><h2 id="cartas-title">As cartas especiais</h2></div></div>
      <div class="grid">${kabemSpecialCards}</div>
    </section>
    <div class="wrap guide">
      <section class="panel" id="como-jogar">
        <p class="eyebrow">Sem manual longo</p><h2>Como jogar</h2>
        <ol>
          <li>Escolha <strong>Jogar agora</strong> (mesa pública que completa com bots em até 10 s), crie uma sala privada com código ou jogue <strong>Só contra bots</strong>.</li>
          <li>Na sua vez, as cartas válidas brilham na mão. Arraste uma até o centro da mesa 3D (ou toque duas vezes).</li>
          <li>Toque em cartas da mesma face para montar grupo, ou toque no monte para comprar.</li>
          <li>Quem esvaziar a mão primeiro vence na hora.</li>
        </ol>
        <table><thead><tr><th scope="col">Ação</th><th scope="col">Como fazer na mesa</th></tr></thead>
          <tbody><tr><th scope="row">Jogar carta</th><td>Arraste a carta que brilha até o centro (ou toque 2×)</td></tr>
          <tr><th scope="row">Descarte múltiplo</th><td>Toque nas cartas da mesma face e jogue o grupo</td></tr>
          <tr><th scope="row">Comprar</th><td>Toque no monte central</td></tr>
          <tr><th scope="row">Corta-Frente</th><td>Arraste a carta idêntica enquanto o anel gira</td></tr></tbody></table>
      </section>
      <section class="panel" id="modos">
        <p class="eyebrow">Online e offline</p><h2>Modos e personalização</h2>
        <ul>
          <li><strong>Mesa pública rápida (Jogar agora):</strong> escolha de 2 a 10 lugares; se faltar gente, os bots completam em até 10 segundos.</li>
          <li><strong>Sala com amigos:</strong> crie uma sala privada ou pública, mande o código ou Card de Desafio, use chat, falas rápidas e ranking semanal em salas privadas.</li>
          <li><strong>Offline contra bots (PWA):</strong> instale na tela inicial do celular e jogue mesmo sem internet.</li>
          <li><strong>Personalização e acessibilidade:</strong> 12 avatares, 3 temas de mesa (Floresta, Neon e Areia), modo 2D automático sem WebGL, navegação por teclado e símbolos geométricos em cada cor.</li>
        </ul>
      </section>
    </div>
    <section class="wrap panel faq" id="duvidas" aria-labelledby="faq-title">
      <p class="eyebrow">Perguntas frequentes</p><h2 id="faq-title">Dúvidas</h2>
      <details><summary>Preciso baixar aplicativo ou criar conta?</summary><p>Não. O Kabemjunto abre direto no navegador do celular ou PC, sem cadastro. Para jogar offline contra bots, você pode instalar como PWA pelo menu do navegador.</p></details>
      <details><summary>Quantas pessoas podem jogar juntas?</summary><p>De 2 a 10 jogadores na mesma partida, seja online com amigos, na mesa pública rápida ou contra bots no seu aparelho.</p></details>
      <details><summary>A Regra do 7 usa o microfone do celular?</summary><p>Não. O jogo não acessa seu microfone. No modo online, a Regra do 7 monitora o chat escrito e as falas rápidas dentro da sala: quem enviar mensagem durante o silêncio compra +2 cartas.</p></details>
      <details><summary>Posso jogar +2 em cima de +4?</summary><p>Não. O acúmulo é assimétrico: +2 acumula com +2 e +4 cobre +2 ou +4, mas +2 sobre +4 é proibido. Para devolver um +4, só com outro +4 ou com o 0+ Zero Mais.</p></details>
      <details><summary>Funciona em celulares mais simples?</summary><p>Sim. Além da Mesa 3D carregada sob demanda, o jogo conta com uma Mesa 2D embutida com as mesmas regras e interações.</p></details>
      <div class="actions">${play(kabem, 'Jogar Kabemjunto', 'kabemjunto_rodape')} <a class="button quiet" href="../../#jogos">← Voltar ao catálogo</a></div>
    </section>`;

const homeSchema = {
  '@graph': [
    { '@type': 'WebSite', name: site.nome, url: absolute(''), description: site.descricao, inLanguage: 'pt-BR' },
    { '@type': 'ItemList', itemListElement: [turbo, ...jogos.filter(game => game !== turbo)].map((game, index) =>
      ({ '@type': 'ListItem', position: index + 1, item: gameSchema(game) })) }
  ]
};
writeFileSync(root + 'index.html', page({ heading: site.titulo, description: site.descricao, schema: homeSchema, content: home }));
mkdirSync(root + turboPath, { recursive: true });
writeFileSync(root + turboPath + 'index.html', page({
  heading: title, description, path: turboPath, relative: '../../', detail: true, content: detail,
  schema: { ...gameSchema(turbo), description, image: absolute(shareImage) }
}));
mkdirSync(root + kabemPath, { recursive: true });
writeFileSync(root + kabemPath + 'index.html', page({
  heading: kabemTitle, description: kabemDescription, path: kabemPath, relative: '../../', detail: true,
  ogImage: kabemShareImage,
  ogAlt: 'Kabemjunto — O jogo de cartas que te denuncia. Cartas especiais e mesa 3D no navegador.',
  content: kabemDetail,
  schema: { ...gameSchema(kabem), description: kabemDescription, image: absolute(kabemShareImage) }
}));
writeFileSync(root + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['', turboPath, kabemPath, ...jogos.filter(game => game.url.startsWith('./')).map(game => game.url)].map(path =>
  `  <url><loc>${esc(absolute(path))}</loc><lastmod>${site.atualizado}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(root + 'robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${absolute('sitemap.xml')}\n`);
console.log(`Vitrine com ${jogos.length} jogos e páginas de Turbo Maré e Kabemjunto geradas.`);
