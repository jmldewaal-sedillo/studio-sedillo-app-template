// Het startscherm en de instellingen laden goed, op elk formaat (telefoon staand en liggend, tablet).
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, appConfig, once, open, expectNoProblems, textFiles } = require('./helpers');

const SHOTS = path.join(__dirname, 'screenshots');

// Niets steekt buiten het scherm en alles wat je kunt aantikken is groot genoeg.
async function expectFits(page, what) {
  const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, screen: window.innerWidth }));
  expect(size.content, `${what}: geen horizontaal schuiven`).toBeLessThanOrEqual(size.screen);
  const small = await page.evaluate(() => [...document.querySelectorAll('button, a.btn, input')]
    .filter(el => el.offsetParent !== null)
    .map(el => ({ el: el.id || el.textContent.trim().slice(0, 30), r: el.getBoundingClientRect() }))
    .filter(x => x.r.height < 47.5 || x.r.width < 47.5 || x.r.left < 0 || x.r.right > window.innerWidth + 0.5)
    .map(x => `${x.el} (${Math.round(x.r.width)}×${Math.round(x.r.height)})`));
  expect(small, `${what}: te klein of buiten beeld`).toEqual([]);
}

test('startscherm laadt met de naam van de app, zonder fouten en zonder verzoeken naar buiten', async ({ page }, info) => {
  const config = appConfig();
  const problems = await open(page);
  await expect(page).toHaveTitle(config.APP_NAAM);
  await expect(page.locator('#app-title')).toHaveText(config.APP_NAAM);
  await expect(page.locator('#btn-settings')).toBeVisible();
  await expect(page.locator('#screen-settings')).toBeHidden();
  await expectFits(page, 'startscherm');
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-start.png`) });

  await page.locator('#btn-settings').click();
  await expect(page.locator('#screen-settings')).toBeVisible();
  await expect(page.locator('#screen-start')).toBeHidden();
  for (const id of ['btn-profile-delete', 'btn-wipe-all', 'btn-transfer', 'btn-credits', 'link-privacy', 'link-delete']) {
    await expect(page.locator('#' + id), id).toBeVisible();
  }
  await expectFits(page, 'instellingen');
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-instellingen.png`), fullPage: true });

  await page.locator('#btn-credits').click();
  await expect(page.locator('#credits-made-by')).toHaveText('Gemaakt door Studio Sedillo');
  await expect(page.locator('#credits-contact')).toContainText('studio.sedillo@gmail.com');
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-credits.png`) });
  expectNoProblems(problems);
});

test('privacypagina past op het scherm', async ({ page }, info) => {
  const problems = await open(page, './privacy.html');
  await expect(page.locator('#page-text h1')).toBeVisible();
  await expectFits(page, 'privacy');
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-privacy.png`), fullPage: true });
  expectNoProblems(problems);
});

test('veilige zones: viewport-fit=cover en env(safe-area-inset-*) aan alle vier de kanten', async ({ page }, info) => {
  once(info);
  await open(page);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
  const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
  for (const side of ['top', 'right', 'bottom', 'left']) expect(css, side).toContain(`env(safe-area-inset-${side}`);
  // De balk en de inhoud gebruiken ze ook echt.
  expect(css).toMatch(/\.bar\s*\{[^}]*var\(--safe-top\)/);
  expect(css).toMatch(/\.content\s*\{[^}]*var\(--safe-bottom\)/);
});

test('themakleur uit config.js staat in de pagina en het manifest', async ({ page, request }, info) => {
  once(info);
  const config = appConfig();
  await open(page);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', config.THEMA_KLEUR);
  const theme = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--theme').trim());
  expect(theme.toLowerCase()).toBe(config.THEMA_KLEUR.toLowerCase());
  const manifest = await (await request.get('./manifest.webmanifest')).json();
  expect(manifest.theme_color).toBe(config.THEMA_KLEUR);
});

test('manifest: naam, relatieve start-URL en iconen van 192, 512 en maskable die echt zo groot zijn', async ({ request }, info) => {
  once(info);
  const config = appConfig();
  const response = await request.get('./manifest.webmanifest');
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.name).toBe(config.APP_NAAM);
  expect(manifest.short_name).toBe(config.KORTE_NAAM);
  expect(manifest.start_url).toBe('./');
  expect(manifest.scope).toBe('./');
  expect(manifest.display).toBe('standalone');
  const wanted = [['192x192', 'any'], ['512x512', 'any'], ['512x512', 'maskable']];
  for (const [sizes, purpose] of wanted) {
    expect(manifest.icons.some(i => i.sizes === sizes && i.purpose === purpose), `${sizes} ${purpose}`).toBe(true);
  }
  for (const icon of manifest.icons) {
    const body = await (await request.get('./' + icon.src)).body();
    expect(body.subarray(1, 4).toString(), icon.src).toBe('PNG');
    expect(`${body.readUInt32BE(16)}x${body.readUInt32BE(20)}`, icon.src).toBe(icon.sizes);
  }
});

test('geen emoji in de bestanden van de app', async ({}, info) => {
  once(info);
  const found = [];
  for (const file of textFiles(ROOT, ['.git', 'node_modules', 'test-results', 'playwright-report', '.test-build', '_site', 'tests', 'tools', 'docs', 'store', '.github'])) {
    if (file.endsWith('.md')) continue;
    const hits = fs.readFileSync(file, 'utf8').match(/\p{Extended_Pictographic}/gu);
    if (hits) found.push(`${path.relative(ROOT, file)}: ${[...new Set(hits)].join(' ')}`);
  }
  expect(found).toEqual([]);
});
