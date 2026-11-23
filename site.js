'use strict';

const aviso = document.querySelector('#aviso');
let toast;
function informar(texto) {
  aviso.textContent = texto;
  clearTimeout(toast);
  toast = setTimeout(() => { aviso.textContent = ''; }, 4200);
}

const filtros = document.querySelector('.filters');
if (filtros) {
  filtros.hidden = false;
  filtros.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    const categoria = button.dataset.filter;
    for (const filtro of filtros.querySelectorAll('button')) {
      filtro.setAttribute('aria-pressed', String(filtro === button));
    }
    let total = 0;
    for (const jogo of document.querySelectorAll('[data-groups]')) {
      jogo.hidden = categoria !== 'todos' && !jogo.dataset.groups.split(' ').includes(categoria);
      if (!jogo.hidden) total++;
    }
    document.querySelector('#filter-status').textContent = total === 1 ? '1 jogo exibido' : `${total} jogos exibidos`;
  });
}

function evento(nome, detail) {
  document.dispatchEvent(new CustomEvent(nome, { bubbles: true, detail }));
}

for (const botao of document.querySelectorAll('[data-share]')) {
  botao.hidden = false;
  botao.addEventListener('click', async () => {
    const { share: url, title, game } = botao.dataset;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        informar('Link copiado');
      }
      evento('kabem:compartilhar', { jogo: game });
    } catch (error) {
      if (error.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        informar('Link copiado');
        evento('kabem:compartilhar', { jogo: game });
      } catch {
        window.prompt('Copie o endereço para compartilhar', url);
      }
    }
  });
}

function registrarJogo(event) {
  const link = event.target.closest('[data-play]');
  if (link && (event.type === 'click' || event.button === 1)) {
    evento('kabem:jogar', { jogo: link.dataset.play, origem: link.dataset.origin });
  }
}
document.addEventListener('click', registrarJogo);
document.addEventListener('auxclick', registrarJogo);
