// Taalkeuze NL/EN: wisselen, onthouden, en elke tekst bestaat in elke taal.
const { test, expect } = require('@playwright/test');
const { appConfig, prefix, once, open, storage, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

test('start in de taal van het toestel (Nederlands) en wisselt naar Engels', async ({ page }) => {
  const problems = await open(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  await page.locator('#btn-settings').click();
  await expect(page.locator('#screen-settings .bar-title')).toHaveText('Instellingen');
  await expect(page.locator('#btn-wipe-all')).toHaveText('Alle gegevens van deze app verwijderen');
  await expect(page.locator('#screen-settings .langs button[data-lang="nl"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#screen-settings .langs button[data-lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#screen-settings .bar-title')).toHaveText('Settings');
  await expect(page.locator('#btn-wipe-all')).toHaveText('Delete all data of this app');
  await expect(page.locator('#btn-profile-delete')).toHaveText('Delete profile');
  await expect(page.locator('#btn-transfer')).toHaveText('Move progress');
  await expect(page.locator('#profile-name')).toHaveAttribute('placeholder', 'Name or nickname (optional)');
  await expect(page.locator('#screen-settings .icon-btn')).toHaveAttribute('aria-label', 'Back');
  await expect(page.locator('#screen-settings .langs button[data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#screen-settings .langs button[data-lang="nl"]')).toHaveAttribute('aria-pressed', 'false');
  expect((await storage(page))[prefix() + 'settings']).toEqual({ language: 'en' });

  // De keuze blijft na opnieuw laden, ook op de privacypagina.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('#btn-settings').click();
  await expect(page.locator('#screen-settings .bar-title')).toHaveText('Settings');
  await page.locator('#btn-credits').click();
  await expect(page.locator('#credits-made-by')).toHaveText('Made by Studio Sedillo · KvK 42122276');
  await page.goto('./privacy.html');
  await expect(page.locator('#page-text h1')).toHaveText('Privacy policy');

  // En terug naar Nederlands.
  await page.locator('.langs button[data-lang="nl"]').click();
  await expect(page.locator('#page-text h1')).toHaveText('Privacyverklaring');
  expect((await storage(page))[prefix() + 'settings']).toEqual({ language: 'nl' });
  expectNoProblems(problems);
});

test.describe('toestel in een taal die de app niet heeft', () => {
  test.use({ locale: 'fr-FR' });
  test('valt terug op Engels', async ({ page }) => {
    await open(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.locator('#btn-settings').click();
    await expect(page.locator('#screen-settings .bar-title')).toHaveText('Settings');
    expect(await storage(page), 'alleen kijken slaat niets op').toEqual({});
  });
});

test('elke tekst bestaat in elke taal, met dezelfde invulvelden', async ({ page }) => {
  await open(page);
  const report = await page.evaluate(talen => {
    const T = window.TEKSTEN;
    const problems = [];
    const fields = text => (text.match(/\{\w+\}/g) || []).sort().join(',');
    const flat = (value, at, out) => {
      if (typeof value === 'string') out[at] = value;
      else if (Array.isArray(value)) value.forEach((v, i) => flat(v, `${at}[${i}]`, out));
      else Object.keys(value).forEach(k => flat(value[k], at ? `${at}.${k}` : k, out));
      return out;
    };
    for (const code of talen) if (!T[code]) problems.push(`taalbestand ontbreekt: ${code}`);
    const first = flat(T[talen[0]], '', {});
    for (const code of talen.slice(1)) {
      const other = flat(T[code] || {}, '', {});
      for (const key of Object.keys(first)) {
        if (!(key in other)) problems.push(`${code}: ontbreekt ${key}`);
        else if (!other[key].trim()) problems.push(`${code}: leeg ${key}`);
        else if (fields(first[key]) !== fields(other[key])) problems.push(`${code}: andere invulvelden in ${key}`);
      }
      for (const key of Object.keys(other)) if (!(key in first)) problems.push(`${talen[0]}: ontbreekt ${key}`);
    }
    return { problems, count: Object.keys(first).length };
  }, appConfig().TALEN);
  expect(report.problems).toEqual([]);
  expect(report.count).toBeGreaterThan(50);
});

test('elke tekst in de pagina heeft een vertaling, geen tekst staat vast in de HTML', async ({ page }) => {
  for (const url of ['./', './privacy.html', './delete.html']) {
    await open(page, url);
    const missing = await page.evaluate(talen => {
      const out = [];
      const keys = [...document.querySelectorAll('[data-i18n]')].map(n => n.dataset.i18n)
        .concat([...document.querySelectorAll('[data-i18n-aria]')].map(n => n.dataset.i18nAria))
        .concat([...document.querySelectorAll('[data-i18n-ph]')].map(n => n.dataset.i18nPh));
      for (const key of keys) for (const code of talen) if (typeof window.TEKSTEN[code][key] !== 'string') out.push(`${code}: ${key}`);
      // Knoppen en koppen zonder vertaalsleutel die toch tekst tonen (en niet door app.js gevuld worden).
      const filled = ['app-title', 'confirm-title', 'btn-confirm-yes', 'page-text'];
      document.querySelectorAll('button, h1, h2, a.btn, label').forEach(n => {
        if (n.dataset.i18n || n.closest('.langs, .profile-list, #page-text') || filled.includes(n.id)) return;
        if ([...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) out.push(`vaste tekst: ${n.textContent.trim().slice(0, 40)}`);
      });
      return out;
    }, appConfig().TALEN);
    expect(missing, url).toEqual([]);
  }
});
