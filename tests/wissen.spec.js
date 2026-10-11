// "Profiel verwijderen" en "Alle gegevens van deze app verwijderen" (inclusief cache), en het ouderslot.
const { test, expect } = require('@playwright/test');
const { prefix, once, open, kinderApp, storage, hold, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

// Twee profielen met elk een teller, Engels als taal, en iets van een andere herkomst.
async function fillApp(page) {
  await page.evaluate(() => localStorage.setItem('iemand.anders', '"blijft"'));
  await page.locator('#btn-demo').click();
  await page.locator('#btn-demo').click();
  await page.locator('#btn-settings').click();
  await page.locator('#screen-settings .langs button[data-lang="en"]').click();
  await page.locator('#profile-name').fill('Mila');
  await page.locator('#btn-profile-add').click();
  await page.locator('#screen-settings .icon-btn').click();
  for (let i = 0; i < 3; i++) await page.locator('#btn-demo').click();
  await expect(page.locator('#demo-count')).toHaveText('Counter of Mila: 3');
  await page.locator('#btn-settings').click();
}
const ownKeys = async page => Object.keys(await storage(page)).filter(k => k.startsWith(prefix())).sort();

test.describe('alles verwijderen, met service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('laat geen enkele sleutel met de prefix, geen cache en geen service worker achter', async ({ page }) => {
    const problems = await open(page);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await fillApp(page);
    const P = prefix();
    expect(await ownKeys(page)).toEqual([`${P}profile.p1.progress`, `${P}profile.p2.progress`, `${P}profiles`, `${P}settings`]);
    const before = await page.evaluate(async () => ({ caches: await caches.keys(), workers: (await navigator.serviceWorker.getRegistrations()).length }));
    expect(before.caches.length, 'er is een cache om te wissen').toBeGreaterThan(0);
    expect(before.workers).toBe(1);

    // Eerst vraagt de app om bevestiging; annuleren wist niets.
    await page.locator('#btn-wipe-all').click();
    await expect(page.locator('#modal-parent'), 'geen ouderslot als KINDER_APP uit staat').toBeHidden();
    await expect(page.locator('#modal-confirm')).toBeVisible();
    await expect(page.locator('#confirm-title')).toHaveText('Delete everything?');
    await page.locator('#btn-confirm-no').click();
    await expect(page.locator('#modal-confirm')).toBeHidden();
    expect((await ownKeys(page)).length).toBe(4);
    expect((await page.evaluate(() => caches.keys())).length).toBeGreaterThan(0);

    await page.locator('#btn-wipe-all').click();
    await page.locator('#btn-confirm-yes').click();
    await expect(page.locator('#modal-wiped')).toBeVisible();

    expect(await ownKeys(page), 'geen sleutel met de prefix meer').toEqual([]);
    expect(await storage(page), 'gegevens van een ander blijven staan').toEqual({ 'iemand.anders': 'blijft' });
    const after = await page.evaluate(async () => ({ caches: await caches.keys(), workers: (await navigator.serviceWorker.getRegistrations()).length }));
    expect(after).toEqual({ caches: [], workers: 0 });

    // Daarna start de app schoon: één leeg profiel, teller 0, taal van het toestel.
    await page.locator('#btn-restart').click();
    await expect(page.locator('#demo-count')).toHaveText('Teller van Speler 1: 0');
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
    await page.locator('#btn-settings').click();
    await expect(page.locator('#profile-list button')).toHaveText(['Speler 1']);
    expect(await ownKeys(page)).toEqual([]);
    expectNoProblems(problems);
  });
});

test('profiel verwijderen wist alleen dat profiel', async ({ page }) => {
  const problems = await open(page);
  await fillApp(page);
  const P = prefix();
  const before = await storage(page);

  await page.locator('#btn-profile-delete').click();
  await expect(page.locator('#confirm-text')).toHaveText('Everything Mila has saved on this device will be erased. Other profiles stay.');
  await page.locator('#btn-confirm-no').click();
  expect(await storage(page), 'annuleren wist niets').toEqual(before);

  await page.locator('#btn-profile-delete').click();
  await page.locator('#btn-confirm-yes').click();
  await expect(page.locator('#profile-list button')).toHaveText(['Player 1']);
  const after = await storage(page);
  expect(Object.keys(after).filter(k => k.includes('.profile.p2.')), 'niets van het verwijderde profiel').toEqual([]);
  expect(after[`${P}profile.p1.progress`]).toEqual({ count: 2 });
  expect(after[`${P}profiles`]).toEqual({ v: 1, active: 'p1', next: 3, list: [{ id: 'p1', name: '' }] });
  expect(after[`${P}settings`]).toEqual({ language: 'en' });
  expect(after['iemand.anders']).toBe('blijft');

  // Het laatste profiel verwijderen: er komt een nieuw, leeg profiel voor in de plaats.
  await page.locator('#btn-profile-delete').click();
  await page.locator('#btn-confirm-yes').click();
  const last = await storage(page);
  expect(Object.keys(last).filter(k => k.includes('.profile.'))).toEqual([]);
  expect(last[`${P}profiles`]).toEqual({ v: 1, active: 'p3', next: 4, list: [{ id: 'p3', name: '' }] });
  await page.locator('#screen-settings .icon-btn').click();
  await expect(page.locator('#demo-count')).toHaveText('Counter of Player 3: 0');
  expectNoProblems(problems);
});

test('kinder-app: verwijderen en overzetten zitten achter het ouderslot', async ({ page }) => {
  await kinderApp(page, true);
  const problems = await open(page);
  await fillApp(page);
  const before = await storage(page);

  for (const button of ['btn-wipe-all', 'btn-profile-delete', 'btn-transfer']) {
    await page.locator('#' + button).click();
    await expect(page.locator('#modal-parent'), button).toBeVisible();
    await expect(page.locator('#modal-confirm')).toBeHidden();
    await expect(page.locator('#modal-transfer')).toBeHidden();
    await page.locator('#btn-parent-cancel').click();
    await expect(page.locator('#modal-parent')).toBeHidden();
  }

  // Kort tikken of één keer vasthouden is niet genoeg.
  await page.locator('#btn-wipe-all').click();
  await page.locator('#btn-parent-hold').click();
  await page.locator('#btn-parent-hold').click();
  await expect(page.locator('#btn-parent-hold')).toHaveAttribute('data-holds', '0');
  await hold(page);
  await expect(page.locator('#btn-parent-hold')).toHaveAttribute('data-holds', '1');
  await expect(page.locator('#hold-label')).toHaveText('Once more');
  await expect(page.locator('#modal-parent')).toBeVisible();
  await expect(page.locator('#modal-confirm')).toBeHidden();
  expect(await storage(page)).toEqual(before);

  // Twee keer vasthouden opent de bevestiging; pas daarna wordt er gewist.
  await hold(page);
  await expect(page.locator('#modal-parent')).toBeHidden();
  await expect(page.locator('#modal-confirm')).toBeVisible();
  expect(await storage(page)).toEqual(before);
  await page.locator('#btn-confirm-yes').click();
  await expect(page.locator('#modal-wiped')).toBeVisible();
  expect(await ownKeys(page)).toEqual([]);
  expectNoProblems(problems);
});
