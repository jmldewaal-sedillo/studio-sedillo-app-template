// Privacyverklaring, verwijderpagina en de vaste bestanden voor het eigen domein en Google Play.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, appConfig, slug, sitePath, once, open, kinderApp, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

const MAIL = 'studio.sedillo@gmail.com';

test('privacyverklaring (NL) bevat alles uit sectie 5 van Apps/CLAUDE.md', async ({ page }) => {
  const config = appConfig();
  const problems = await open(page, './privacy?lang=nl');
  const text = page.locator('#page-text');
  await expect(page).toHaveTitle(`Privacyverklaring – ${config.APP_NAAM}`);
  await expect(text.locator('h1')).toHaveText('Privacyverklaring');
  await expect(text).toContainText(`${config.APP_NAAM} wordt gemaakt en uitgegeven door Studio Sedillo`);
  await expect(text.locator(`a[href="mailto:${MAIL}"]`).first()).toHaveText(MAIL);
  for (const part of [
    'Alleen op het toestel zelf',                         // welke gegevens, alleen lokaal
    'zodat je de volgende keer verder kunt',              // waarom
    'Wij delen niets met derden',
    'Geen tracking',
    'Hoe lang gegevens bewaard blijven',
    'Alle gegevens van deze app verwijderen',
    'inzage, correctie en verwijdering',
    'Autoriteit Persoonsgegevens',
    'Gmail, een dienst van Google',
    'GitHub Pages',
    'EU-U.S. Data Privacy Framework',
    'gerechtvaardigd belang',
    'artikel 6 lid 1 sub f AVG',
  ]) await expect(text, part).toContainText(part);
  await expect(text.locator('a[href="https://policies.google.com/privacy"]').first()).toBeVisible();
  await expect(text.locator('a[href^="https://docs.github.com/"]')).toBeVisible();
  // Datum van de laatste wijziging, voluit, uit config.js.
  const date = new Date(config.PRIVACY_DATUM + 'T12:00:00').toLocaleDateString('nl', { day: 'numeric', month: 'long', year: 'numeric' });
  await expect(text.locator('.updated')).toHaveText(`${config.APP_NAAM} – laatst bijgewerkt op ${date}`);
  await expect(text).not.toContainText('{');
  expectNoProblems(problems);
});

test('privacyverklaring (EN)', async ({ page }) => {
  const config = appConfig();
  await open(page, './privacy?lang=en');
  const text = page.locator('#page-text');
  await expect(text.locator('h1')).toHaveText('Privacy policy');
  await expect(text).toContainText(`${config.APP_NAAM} is made and published by Studio Sedillo`);
  for (const part of ['Only on the device itself', 'We share nothing with third parties', 'Autoriteit Persoonsgegevens',
    'EU-U.S. Data Privacy Framework', 'legitimate interest', 'Article 6(1)(f) GDPR', 'How long data is kept']) {
    await expect(text, part).toContainText(part);
  }
  await expect(text.locator(`a[href="mailto:${MAIL}"]`).first()).toBeVisible();
  await expect(text).not.toContainText('{');
});

test('paragraaf "Kinderen en ouders" en het ouderslot staan er alleen bij een kinder-app', async ({ page }) => {
  await kinderApp(page, false);
  await open(page, './privacy.html?lang=nl');
  await expect(page.locator('#page-text h1')).toBeVisible();
  await expect(page.locator('#page-text')).not.toContainText('Kinderen en ouders');
  await expect(page.locator('#page-text')).not.toContainText('ouderslot');
  await page.goto('./delete.html?lang=nl');
  await expect(page.locator('#page-text h1')).toBeVisible();
  await expect(page.locator('#page-text')).not.toContainText('ouderslot');

  await kinderApp(page, true);
  await page.goto('./privacy.html?lang=nl');
  await expect(page.locator('#page-text h2', { hasText: 'Kinderen en ouders' })).toBeVisible();
  await expect(page.locator('#page-text')).toContainText('Beide knoppen zitten achter het ouderslot.');
  await page.goto('./delete.html?lang=nl');
  await expect(page.locator('#page-text')).toContainText('houd het ouderslot twee keer ingedrukt en bevestig');
  await page.goto('./privacy.html?lang=en');
  await expect(page.locator('#page-text h2', { hasText: 'Children and parents' })).toBeVisible();
});

test('verwijderpagina /delete in NL en EN, en /verwijderen verwijst door', async ({ page }) => {
  const config = appConfig();
  const problems = await open(page, './delete?lang=nl');
  const text = page.locator('#page-text');
  await expect(text.locator('h1')).toHaveText('Gegevens verwijderen');
  await expect(text).toContainText(`${config.APP_NAAM} heeft geen accounts`);
  await expect(text).toContainText('Alle gegevens van deze app verwijderen');
  await expect(text).toContainText('Profiel verwijderen');
  await expect(text.locator(`a[href="mailto:${MAIL}"]`)).toHaveText(MAIL);
  await expect(text).not.toContainText('{');

  await page.goto('./verwijderen?lang=en');
  await expect(page).toHaveURL(/\/delete\.html\?lang=en$/);
  await expect(page.locator('#page-text h1')).toHaveText('Deleting your data');
  await expect(page.locator('#page-text')).toContainText('Delete all data of this app');

  // De knop terug gaat naar de app.
  await page.locator('a.btn', { hasText: 'Back to the app' }).first().click();
  await expect(page.locator('#app-title')).toBeVisible();
  expectNoProblems(problems);
});

test('de teksten op de pagina kloppen met de knoppen in de app', async ({ page }) => {
  for (const lang of appConfig().TALEN) {
    await open(page, `./?lang=${lang}`);
    await page.locator('#btn-settings').click();
    const wipe = (await page.locator('#btn-wipe-all').textContent()).trim();
    const profile = (await page.locator('#btn-profile-delete').textContent()).trim();
    const transfer = (await page.locator('#btn-transfer').textContent()).trim();
    await page.goto(`./privacy.html?lang=${lang}`);
    await expect(page.locator('#page-text'), lang).toContainText(wipe);
    await expect(page.locator('#page-text'), lang).toContainText(profile);
    await expect(page.locator('#page-text'), lang).toContainText(transfer);
    await page.goto(`./delete.html?lang=${lang}`);
    await expect(page.locator('#page-text'), lang).toContainText(wipe);
    await expect(page.locator('#page-text'), lang).toContainText(profile);
  }
});

test('ROADMAP, docs en store-teksten zijn aanwezig en binnen de limieten van Google Play', async () => {
  const roadmap = fs.readFileSync(path.join(ROOT, 'ROADMAP.md'), 'utf8');
  for (const head of ['## Status', '## Nu bezig', '## Volgende', '## Later / ideeën', '## Voor publicatie in Google Play', '## Logboek']) {
    expect(roadmap, head).toContain(head);
  }
  expect(roadmap, 'het testadres op github.io').toMatch(/https:\/\/jmldewaal-sedillo\.github\.io\/[A-Za-z0-9._-]+-test\//);
  expect(roadmap, 'de URL voor de Play Store').toContain(`https://studiosedillo.com/${sitePath()}/privacy`);
  for (const doc of ['lanceren.md', 'privacy-audit.md', 'credits.md', 'android.md', 'webportals.md', 'publiceren.md']) {
    expect(fs.existsSync(path.join(ROOT, 'docs', doc)), doc).toBe(true);
  }
  const LIMITS = { 'titel.txt': 30, 'korte-beschrijving.txt': 80, 'volledige-beschrijving.txt': 4000 };
  for (const lang of ['nl-NL', 'en-US']) {
    for (const [file, max] of Object.entries(LIMITS)) {
      const text = fs.readFileSync(path.join(ROOT, 'store', lang, file), 'utf8').trim();
      expect(text.length, `store/${lang}/${file} is leeg`).toBeGreaterThan(0);
      expect([...text].length, `store/${lang}/${file}: hoogstens ${max} tekens`).toBeLessThanOrEqual(max);
    }
  }
});
