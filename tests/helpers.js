// Gedeelde hulpfuncties voor de Playwright-tests.
const fs = require('fs');
const path = require('path');
const { expect, test } = require('@playwright/test');
const { ROOT, BASE } = require('./root');

// De gegevens van de app, gelezen uit de bestanden die getest worden.
function appConfig() {
  const text = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
  const window = {};
  new Function('window', text)(window);
  return window.APP_CONFIG;
}
const slug = () => appConfig().SLUG;
const prefix = () => slug() + '.';

/** De meeste tests hoeven maar op één formaat te draaien. */
function once(info) {
  test.skip(info.project.name !== 'phone-portrait', 'één keer is genoeg');
}

/**
 * Opent een pagina en verzamelt alles wat niet mag: console-fouten, JS-fouten, 4xx/5xx en
 * verzoeken naar een ander adres dan de app zelf.
 */
async function open(page, url = './') {
  const problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); });
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith(BASE) && !/^(data|blob):/.test(u)) problems.push(`extern verzoek: ${u}`);
  });
  await page.goto(url);
  return problems;
}

/** Zet KINDER_APP aan of uit voor deze pagina, zonder het bestand te veranderen. */
async function kinderApp(page, value) {
  const source = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
  const body = source.replace(/KINDER_APP:\s*(true|false)/, `KINDER_APP: ${value}`);
  expect(body, 'config.js bevat een regel KINDER_APP: true/false').toContain(`KINDER_APP: ${value}`);
  await page.route('**/config.js', route => route.fulfill({ body, contentType: 'text/javascript; charset=utf-8' }));
}

/** Alles wat de app (en wie dan ook) in localStorage heeft staan, als { sleutel: waarde }. */
const storage = page => page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out[k] = JSON.parse(localStorage.getItem(k)); }
  return out;
});

/** Het ouderslot één keer lang genoeg indrukken; `holds` is de stand die daarna verwacht wordt. */
async function hold(page) {
  const box = await page.locator('#btn-parent-hold').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const before = await page.locator('#btn-parent-hold').getAttribute('data-holds');
  await page.mouse.down();
  await page.waitForFunction(b => {
    const el = document.getElementById('btn-parent-hold');
    return el.dataset.holds !== b || document.getElementById('modal-parent').hidden;
  }, before);
  await page.mouse.up();
}

/** Alle tekstbestanden onder een map (zonder de mappen die niet bij de bron horen). */
function textFiles(dir, skip = ['.git', 'node_modules', 'test-results', 'playwright-report', '.test-build', '_site', 'screenshots']) {
  const TEXT = /\.(html|css|js|mjs|json|webmanifest|md|txt|yml|yaml|sh|svg|xml)$/;
  const out = [];
  (function walk(d) {
    for (const name of fs.readdirSync(d)) {
      if (skip.includes(name)) continue;
      const full = path.join(d, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (TEXT.test(name) || name === 'CNAME' || name === '.gitignore') out.push(full);
    }
  })(dir);
  return out;
}

function expectNoProblems(problems) {
  expect(problems, `Problemen tijdens laden of gebruiken:\n${problems.join('\n')}`).toEqual([]);
}

module.exports = { ROOT, BASE, appConfig, slug, prefix, once, open, kinderApp, storage, hold, textFiles, expectNoProblems };
