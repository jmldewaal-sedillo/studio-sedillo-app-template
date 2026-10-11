// "Voortgang overzetten": exporteren als code of bestand, importeren op een ander toestel.
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { slug, prefix, once, open, storage, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

const NAME = 'Zoë & "Bo" <3';

// Het oude toestel: Engels, twee profielen met elk een teller.
async function oldDevice(page) {
  await open(page);
  await page.locator('#btn-demo').click();
  await page.locator('#btn-demo').click();
  await page.locator('#btn-settings').click();
  await page.locator('#screen-settings .langs button[data-lang="en"]').click();
  await page.locator('#profile-name').fill(NAME);
  await page.locator('#btn-profile-add').click();
  await page.locator('#screen-settings .icon-btn').click();
  for (let i = 0; i < 5; i++) await page.locator('#btn-demo').click();
  await page.locator('#btn-settings').click();
  await page.locator('#btn-transfer').click();
  const saved = await storage(page);
  expect(Object.keys(saved).length).toBe(4);
  expect(saved[prefix() + 'profile.p2.progress']).toEqual({ count: 5 });
  return saved;
}

// Het nieuwe toestel: een andere browser zonder iets erin, maar wel met eigen (andere) voortgang.
async function newDevice(browser) {
  const context = await browser.newContext({ locale: 'nl-NL' });
  const page = await context.newPage();
  const problems = await open(page);
  for (let i = 0; i < 9; i++) await page.locator('#btn-demo').click();
  await page.locator('#btn-settings').click();
  await page.locator('#profile-name').fill('Oud');
  await page.locator('#btn-profile-add').click();
  await page.locator('#profile-name').fill('Ouder');
  await page.locator('#btn-profile-add').click();
  // Het derde profiel bewaart iets dat niet in de code zit: dat moet na het terugzetten weg zijn.
  await page.locator('#screen-settings .icon-btn').click();
  await page.locator('#btn-demo').click();
  await page.locator('#btn-settings').click();
  expect(Object.keys(await storage(page)).sort()).toEqual([`${prefix()}profile.p1.progress`, `${prefix()}profile.p3.progress`, `${prefix()}profiles`]);
  await page.locator('#btn-transfer').click();
  return { context, page, problems };
}

async function expectRestored(page, saved) {
  await expect(page.locator('#transfer-msg')).toHaveText('The progress has been restored.');
  expect(await storage(page), 'precies dezelfde gegevens als op het oude toestel').toEqual(saved);
  await page.locator('#btn-transfer-ok').click();
  await expect(page.locator('#profile-list button')).toHaveText(['Player 1', NAME]);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#demo-count')).toHaveText(`Counter of ${NAME}: 5`);
}

test('als code: op een ander toestel staat daarna precies hetzelfde', async ({ page, browser }) => {
  const saved = await oldDevice(page);
  await page.locator('#btn-export').click();
  const code = await page.locator('#transfer-code').inputValue();
  expect(code.startsWith(slug() + '1.')).toBe(true);
  expect(code, 'een code is één regel zonder spaties').toMatch(/^[A-Za-z0-9._-]+$/);
  expect(await storage(page), 'exporteren verandert niets').toEqual(saved);

  const device = await newDevice(browser);
  await device.page.locator('#transfer-input').fill(`  ${code.slice(0, 40)}\n${code.slice(40)}  `);   // geplakt met een regeleinde erin
  await device.page.locator('#btn-import').click();
  await expect(device.page.locator('#confirm-title')).toHaveText('Voortgang terugzetten?');
  await device.page.locator('#btn-confirm-no').click();
  expect(Object.keys(await storage(device.page)).length, 'annuleren verandert niets').toBe(3);

  await device.page.locator('#btn-transfer').click();
  await device.page.locator('#transfer-input').fill(code);
  await device.page.locator('#btn-import').click();
  await device.page.locator('#btn-confirm-yes').click();
  await expectRestored(device.page, saved);
  expectNoProblems(device.problems);
  await device.context.close();
});

test('als bestand: opslaan, en op een ander toestel weer inlezen', async ({ page, browser }, info) => {
  const saved = await oldDevice(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#btn-file').click()]);
  expect(download.suggestedFilename()).toBe(`${slug()}-voortgang.txt`);
  const file = info.outputPath('voortgang.txt');
  await download.saveAs(file);
  const code = fs.readFileSync(file, 'utf8');
  expect(code.startsWith(slug() + '1.')).toBe(true);
  expect(await page.locator('#transfer-code').inputValue()).toBe(code);
  await expect(page.locator('#transfer-msg')).toHaveText('File made.');

  const device = await newDevice(browser);
  await device.page.locator('#transfer-file').setInputFiles(file);
  await expect(device.page.locator('#modal-confirm')).toBeVisible();
  await device.page.locator('#btn-confirm-yes').click();
  await expectRestored(device.page, saved);
  expectNoProblems(device.problems);
  await device.context.close();
});

test('een ongeldige code of een code van een andere app wordt geweigerd en verandert niets', async ({ page }) => {
  const saved = await oldDevice(page);
  await page.locator('#btn-export').click();
  const code = await page.locator('#transfer-code').inputValue();
  const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const bad = {
    'leeg': '',
    'onzin': 'dit is geen code',
    'afgekapt': code.slice(0, Math.floor(code.length / 2)),
    'andere app': 'andereapp1.' + encode({ app: 'andereapp', v: 1, data: { settings: { language: 'nl' } } }),
    'andere app met onze voorkant': slug() + '1.' + encode({ app: 'andereapp', v: 1, data: { settings: { language: 'nl' } } }),
    'nieuwere versie': slug() + '1.' + encode({ app: slug(), v: 2, data: {} }),
    'geen gegevens': slug() + '1.' + encode({ app: slug(), v: 1, data: [1, 2] }),
  };
  for (const [what, text] of Object.entries(bad)) {
    await page.locator('#transfer-input').fill(text);
    await page.locator('#btn-import').click();
    await expect(page.locator('#transfer-msg'), what).toHaveText('This is not a valid code of this app.');
    await expect(page.locator('#modal-confirm'), what).toBeHidden();
    expect(await storage(page), what).toEqual(saved);
    await page.locator('#btn-export').click();      // maakt de melding niet leeg, dus zelf leegmaken
    await page.evaluate(() => { document.getElementById('transfer-msg').textContent = ''; });
  }
  // Sleutels die niet van de app kunnen zijn, komen er bij het inlezen niet in.
  const sneaky = slug() + '1.' + encode({ app: slug(), v: 1, data: { settings: { language: 'nl' }, '../buiten': 1, 'Met Spatie': 2 } });
  expect(await page.evaluate(c => Object.keys(window.AppStorage.readCode(c)), sneaky)).toEqual(['settings']);
});
