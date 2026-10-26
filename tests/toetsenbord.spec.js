// De hele app werkt met alleen het toetsenbord: Tab, Enter, spatie en Escape.
// In een open dialoog blijft de focus in de dialoog; na sluiten staat hij weer op de knop die hem opende.
const { test, expect } = require('@playwright/test');
const { once, open, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

const focusedId = page => page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.dataset.lang || document.activeElement.tagName));

/** Druk Tab tot het element met dit id de focus heeft (hoogstens 40 keer). */
async function tabTo(page, id) {
  for (let i = 0; i < 40; i++) {
    if (await focusedId(page) === id) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`#${id} is niet met Tab te bereiken`);
}

/** Tab 25 keer rond in een dialoog: de focus mag er nooit uit. */
async function expectFocusStaysIn(page, modalId) {
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(id => document.getElementById(id).contains(document.activeElement), modalId);
    expect(inside, `na ${i + 1}× Tab staat de focus nog in #${modalId}`).toBe(true);
  }
}

test('instellingen, taal, dialogen en terug: alles met het toetsenbord', async ({ page }) => {
  const problems = await open(page, './?lang=nl');
  await tabTo(page, 'btn-settings');
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-settings')).toBeVisible();

  // Taal wisselen met Enter.
  await tabTo(page, 'en');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  // Dialoog "Voortgang overzetten": focus erin, blijft erin, Escape sluit en zet de focus terug.
  await tabTo(page, 'btn-transfer');
  await page.keyboard.press('Enter');
  await expect(page.locator('#modal-transfer')).toBeVisible();
  await expectFocusStaysIn(page, 'modal-transfer');
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal-transfer')).toBeHidden();
  expect(await focusedId(page)).toBe('btn-transfer');

  // Bevestigen: de veilige keuze heeft de focus; Escape annuleert.
  await tabTo(page, 'btn-profile-delete');
  await page.keyboard.press('Enter');
  await expect(page.locator('#modal-confirm')).toBeVisible();
  expect(await focusedId(page)).toBe('btn-confirm-no');
  await expectFocusStaysIn(page, 'modal-confirm');
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal-confirm')).toBeHidden();
  expect(await focusedId(page)).toBe('btn-profile-delete');

  // Credits openen en met de knop terug weer naar de instellingen en het startscherm.
  await tabTo(page, 'btn-credits');
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-credits')).toBeVisible();
  await page.keyboard.press('Enter');                  // de focus staat op de knop terug
  await expect(page.locator('#screen-settings')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-start')).toBeVisible();
  expect(await focusedId(page)).toBe('btn-settings');
  expectNoProblems(problems);
});

test('de voorbeeldknop en een nieuw profiel werken met Enter en spatie', async ({ page }) => {
  await open(page, './?lang=nl');
  await tabTo(page, 'btn-demo');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.locator('#demo-count')).toContainText(': 2');
  await tabTo(page, 'btn-settings');
  await page.keyboard.press('Enter');
  await tabTo(page, 'profile-name');
  await page.keyboard.type('Bo');
  await page.keyboard.press('Tab');
  expect(await focusedId(page)).toBe('btn-profile-add');
  await page.keyboard.press('Enter');
  await expect(page.locator('#profile-list button[aria-pressed="true"]')).toHaveText('Bo');
});
