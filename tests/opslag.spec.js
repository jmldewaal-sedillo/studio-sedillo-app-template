// Alle opslag loopt via storage.js en elke sleutel begint met "<slug>.".
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, prefix, once, open, storage, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

// De app gebruiken zoals een speler: taal kiezen, tellen, profielen maken, code maken.
async function useEverything(page) {
  await page.locator('#btn-demo').click();
  await page.locator('#btn-demo').click();
  await page.locator('#btn-settings').click();
  await page.locator('#screen-settings .langs button[data-lang="en"]').click();
  await page.locator('#profile-name').fill('Mila');
  await page.locator('#btn-profile-add').click();
  await page.locator('#screen-settings .icon-btn').click();
  await page.locator('#btn-demo').click();
  await page.locator('#btn-settings').click();
  await page.locator('#btn-transfer').click();
  await page.locator('#btn-export').click();
  await page.locator('#btn-transfer-ok').click();
}

test('de app bewaart alleen onder de eigen prefix, en nergens anders', async ({ page, context }) => {
  const problems = await open(page);
  expect(await storage(page), 'alleen openen slaat niets op').toEqual({});
  await useEverything(page);

  const saved = await storage(page);
  const P = prefix();
  expect(Object.keys(saved).sort()).toEqual([`${P}profile.p1.progress`, `${P}profile.p2.progress`, `${P}profiles`, `${P}settings`]);
  expect(saved[`${P}profile.p1.progress`]).toEqual({ count: 2 });
  expect(saved[`${P}profile.p2.progress`]).toEqual({ count: 1 });
  expect(saved[`${P}profiles`]).toEqual({ v: 1, active: 'p2', next: 3, list: [{ id: 'p1', name: '' }, { id: 'p2', name: 'Mila' }] });
  expect(saved[`${P}settings`]).toEqual({ language: 'en' });

  const elsewhere = await page.evaluate(async () => ({
    session: sessionStorage.length,
    cookie: document.cookie,
    databases: indexedDB.databases ? (await indexedDB.databases()).length : 0,
  }));
  expect(elsewhere).toEqual({ session: 0, cookie: '', databases: 0 });
  expect(await context.cookies()).toEqual([]);
  expectNoProblems(problems);
});

test('elke sleutel die de app schrijft staat in docs/privacy-audit.md', async ({ page }) => {
  await open(page);
  await useEverything(page);
  const audit = fs.readFileSync(path.join(ROOT, 'docs', 'privacy-audit.md'), 'utf8');
  const keys = Object.keys(await storage(page));
  expect(keys.length).toBeGreaterThan(0);
  for (const key of keys) {
    const documented = key.replace(/\.profile\.p\d+\./, '.profile.<id>.');
    expect(audit, `${documented} ontbreekt in docs/privacy-audit.md`).toContain('`' + documented + '`');
  }
});

test('elk profiel heeft zijn eigen gegevens', async ({ page }) => {
  await open(page);
  await useEverything(page);      // eindigt in de instellingen
  await expect(page.locator('#profile-list button')).toHaveText(['Player 1', 'Mila']);
  await expect(page.locator('#profile-list button[aria-pressed="true"]')).toHaveText('Mila');
  await page.locator('#profile-list button', { hasText: 'Player 1' }).click();
  await page.locator('#screen-settings .icon-btn').click();
  await expect(page.locator('#demo-count')).toHaveText('Counter of Player 1: 2');
  await page.reload();
  await expect(page.locator('#demo-count')).toHaveText('Counter of Player 1: 2');
});

test('storage.js weigert sleutels die buiten de prefix zouden vallen en laat andermans sleutels met rust', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const S = window.AppStorage;
    localStorage.setItem('iemand.anders', '"blijft"');
    const refused = ['', '../x', 'A B', 'x'.repeat(41)].filter(part => {
      try { S.write(part, 1); return false; } catch (e) { return true; }
    }).length;
    S.write('progress', { count: 7 });
    S.wipeAll();
    return { refused, prefix: S.PREFIX, own: S.keys(), other: localStorage.getItem('iemand.anders'), total: localStorage.length };
  });
  expect(result).toEqual({ refused: 4, prefix: prefix(), own: [], other: '"blijft"', total: 1 });
});

test('alleen storage.js (en sw.js voor de cache) raakt de opslag van de browser aan', async () => {
  const offenders = [];
  const files = fs.readdirSync(ROOT).filter(f => /\.(js|html)$/.test(f) && f !== 'playwright.config.js')
    .concat(fs.readdirSync(path.join(ROOT, 'i18n')).map(f => 'i18n/' + f));
  expect(files).toContain('storage.js');
  for (const file of files) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    if (file !== 'storage.js' && /\b(localStorage|sessionStorage|indexedDB)\b|document\.cookie/.test(text)) offenders.push(file);
    if (file !== 'storage.js' && file !== 'sw.js' && /\bcaches\./.test(text)) offenders.push(file + ' (caches)');
  }
  expect(offenders).toEqual([]);
  const storageJs = fs.readFileSync(path.join(ROOT, 'storage.js'), 'utf8');
  expect(storageJs).toContain(`const SLUG = '${prefix().slice(0, -1)}';`);
  expect(storageJs).toContain("const PREFIX = SLUG + '.';");
});
