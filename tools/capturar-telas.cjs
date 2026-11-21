// Captura imagens de jogo em ação de cada jogo, pelos endereços públicos (requer Playwright instalado).
// Uso: node tools/capturar-telas.cjs <pasta-saida> [jogo ...]

const { chromium } = require('@playwright/test');
const out = process.argv[2];
const only = process.argv.slice(3);

const JOGOS = {
  kabemjunto: {
    url: 'https://kabemjunto.kabemmanager.online/',
    async fluxo(p) {
      await p.getByRole('button', { name: 'Jogar agora' }).first().click({ timeout: 20000 });
      await p.waitForTimeout(6000);
      await p.getByRole('button', { name: 'Entendi' }).first().click({ timeout: 5000 }).catch(() => {});
      await p.waitForTimeout(2500);
    },
  },
  fendas: {
    url: 'https://jogo.kabemmanager.online/',
    async fluxo(p) {
      await p.getByRole('button', { name: /jogar agora/i }).first().click({ timeout: 20000 });
      await p.waitForTimeout(9000);
    },
  },
  corrida: {
    url: 'https://corrida.kabemmanager.online/',
    async fluxo(p) {
      await p.waitForTimeout(3000);
      await p.mouse.click(640, 490);
      await p.waitForTimeout(3500);
      await p.keyboard.press('ArrowLeft');
      await p.waitForTimeout(1800);
    },
  },
  raizes: {
    url: 'https://raizes.kabemmanager.online/',
    async fluxo(p) {
      await p.waitForTimeout(3000);
      await p.getByRole('button', { name: /começar/i }).first().click({ timeout: 20000 });
      await p.waitForTimeout(9000);
    },
  },
  turbo: {
    url: 'https://alexandremocmg.github.io/turbo_mare/',
    async fluxo(p) {
      await p.waitForTimeout(4000);
      await p.getByRole('button', { name: /disputar corrida/i }).first().click({ timeout: 15000 });
      await p.waitForTimeout(9000);
      await p.keyboard.down('ArrowUp');
      await p.waitForTimeout(3500);
      await p.keyboard.up('ArrowUp');
    },
  },
  esconde: {
    url: 'https://esconde.kabemmanager.online/',
    async fluxo(p) {
      await p.waitForTimeout(3000);
      await p.locator('#menu-play-btn').click({ timeout: 20000 });
      await p.waitForTimeout(1500);
      await p.locator('[data-mode="chameleon"]').first().click({ timeout: 15000 });
      await p.waitForTimeout(9000);
    },
  },
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [nome, j] of Object.entries(JOGOS)) {
    if (only.length && !only.includes(nome)) continue;
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    const erros = [];
    page.on('pageerror', (e) => erros.push(String(e).slice(0, 100)));
    try {
      await page.goto(j.url, { waitUntil: 'load', timeout: 60000 });
      await j.fluxo(page);
      console.log(nome, 'ok', erros.length ? 'erros: ' + erros.join(' | ') : '');
    } catch (e) {
      console.log(nome, 'FLUXO FALHOU (screenshot do estado atual):', e.message.split('\n')[0].slice(0, 120));
    }
    await page.screenshot({ path: `${out}/${nome}.png` });
    await page.context().close();
  }
  await browser.close();
})();
