// Toegankelijkheid volgens WCAG 2.1 AA, met axe-core: contrast, alt-teksten, namen van knoppen en
// velden, taal van de pagina, koppen en ARIA. Elk scherm, elke dialoog en elke pagina, in elke taal.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { appConfig, once, open, kinderApp } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

async function expectAccessible(page, what) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const found = result.violations.map(v =>
    `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 3).map(n => n.target.join(' ') + (n.failureSummary ? ' – ' + n.failureSummary.split('\n')[1] : '')).join('\n    ')}`);
  expect(found, `${what}: toegankelijkheidsproblemen\n${found.join('\n')}`).toEqual([]);
}

for (const lang of appConfig().TALEN) {
  test(`app (${lang}): startscherm, instellingen, credits en de dialogen`, async ({ page }) => {
    await open(page, `./?lang=${lang}`);
    await expectAccessible(page, 'startscherm');
    await page.locator('#btn-settings').click();
    await expectAccessible(page, 'instellingen');
    await page.locator('#btn-transfer').click();
    await page.locator('#btn-export').click();
    await expectAccessible(page, 'dialoog voortgang overzetten');
    await page.keyboard.press('Escape');
    await page.locator('#btn-profile-delete').click();
    await expectAccessible(page, 'dialoog bevestigen');
    await page.keyboard.press('Escape');
    await page.locator('#btn-credits').click();
    await expectAccessible(page, 'credits');
  });

  test(`app (${lang}): ouderslot van een kinder-app`, async ({ page }) => {
    await kinderApp(page, true);
    await open(page, `./?lang=${lang}`);
    await page.locator('#btn-settings').click();
    await page.locator('#btn-wipe-all').click();
    await expect(page.locator('#modal-parent')).toBeVisible();
    await expectAccessible(page, 'ouderslot');
  });

  test(`privacy- en verwijderpagina (${lang})`, async ({ page }) => {
    await open(page, `./privacy.html?lang=${lang}`);
    await expect(page.locator('#page-text h1')).toBeVisible();
    await expectAccessible(page, 'privacy');
    await page.goto(`./delete.html?lang=${lang}`);
    await expect(page.locator('#page-text h1')).toBeVisible();
    await expectAccessible(page, 'verwijderen');
  });
}

test('reflow (WCAG 1.4.10): op 320 px breed niets horizontaal schuiven, op elk scherm en elke pagina', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await open(page, './?lang=nl');
  const fits = async what => {
    const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, screen: window.innerWidth }));
    expect(size.content, `${what}: geen horizontaal schuiven op 320 px`).toBeLessThanOrEqual(size.screen);
  };
  await fits('start');
  await page.locator('#btn-settings').click();
  await fits('instellingen');
  await page.locator('#btn-transfer').click();
  await fits('voortgang overzetten');
  await page.goto('./privacy.html?lang=nl');
  await fits('privacy');
});

test('de controle werkt echt: een knop zonder naam en tekst met te weinig contrast worden gevonden', async ({ page }) => {
  await open(page, './?lang=nl');
  await page.evaluate(() => {
    const b = document.createElement('button');                 // geen tekst, geen aria-label
    b.className = 'icon-btn';
    document.querySelector('main').appendChild(b);
    const p = document.createElement('p');
    p.textContent = 'Lichtgrijs op wit';
    p.style.color = '#cccccc';
    p.style.background = '#ffffff';
    document.querySelector('main').appendChild(p);
  });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const ids = result.violations.map(v => v.id);
  expect(ids).toContain('button-name');
  expect(ids).toContain('color-contrast');
});
