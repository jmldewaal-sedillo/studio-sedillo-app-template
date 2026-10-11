// Eén codebase, drie bouwdoelen (Apps/CLAUDE.md, sectie 11): android, webportals en web.
// Deze tests openen de gebouwde versies uit dist/ (tests/start-server.mjs bouwt ze eerst).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { ROOT, appConfig, slug, prefix, sitePath, once, open, storage, copyOfApp, bouw, allFiles, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

const DIST = path.join(ROOT, 'dist');

// De onderdelen van een laag, als lijst van "naam: soort", om ze te kunnen vergelijken.
function shape(file) {
  const window = {};
  new Function('window', fs.readFileSync(path.join(ROOT, 'platform', file), 'utf8'))(window);
  const out = [];
  (function walk(value, at) {
    for (const key of Object.keys(value).sort()) {
      const v = value[key];
      if (v && typeof v === 'object') walk(v, `${at}${key}.`); else out.push(`${at}${key}: ${typeof v}`);
    }
  })(window.Platform, '');
  return { platform: window.Platform, shape: out };
}

test('elke laag in platform/ heeft precies dezelfde onderdelen', async () => {
  const files = fs.readdirSync(path.join(ROOT, 'platform')).filter(f => f.endsWith('.js')).sort();
  expect(files).toEqual(['android.js', 'hoofdsite.js', 'portal.js', 'web.js']);
  const web = shape('web.js');
  expect(web.shape.length).toBeGreaterThan(8);
  for (const file of files) expect(shape(file).shape, file).toEqual(web.shape);
  // Wat per bouwdoel vastligt.
  expect(shape('web.js').platform).toMatchObject({ DOEL: 'web', SERVICE_WORKER: true, EXTERNE_LINKS: true });
  expect(shape('android.js').platform).toMatchObject({ DOEL: 'android', SERVICE_WORKER: false, EXTERNE_LINKS: true });
  expect(shape('portal.js').platform).toMatchObject({ DOEL: 'portal', SERVICE_WORKER: false, EXTERNE_LINKS: false });
  for (const file of files) expect(shape(file).platform.advertenties.beschikbaar, `${file}: advertenties staan uit`).toBe(false);
  expect(appConfig().ADVERTENTIES, 'ADVERTENTIES staat op false tot Jenn akkoord geeft').toBe(false);
});

test('de spelcode kijkt nooit zelf op welk bouwdoel ze draait', async () => {
  const offenders = [];
  for (const file of fs.readdirSync(ROOT).filter(f => f.endsWith('.js') && f !== 'playwright.config.js')) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    if (/Platform\.DOEL|window\.Capacitor|\bCapacitor\./.test(text)) offenders.push(file);
  }
  expect(offenders).toEqual([]);
});

test.describe('bouwdoel android', () => {
  test.use({ serviceWorkers: 'allow' });

  test('alle bestanden in de app, zonder service worker, en de app werkt', async ({ page, request }) => {
    const files = allFiles(path.join(DIST, 'android'));
    for (const gone of ['sw.js', 'manifest.webmanifest', 'CNAME', 'robots.txt', 'platform/web.js', 'platform/portal.js']) expect(files, gone).not.toContain(gone);
    for (const must of ['index.html', 'privacy.html', 'delete.html', 'platform/android.js', 'storage.js', 'i18n/nl.js', 'icons/icon-192.png']) expect(files, must).toContain(must);
    expect(files.filter(f => /^(tests|tools|docs|store|node_modules)\//.test(f) || /\.md$/.test(f))).toEqual([]);
    expect((await request.get('./dist/android/sw.js')).status()).toBe(404);

    const problems = await open(page, './dist/android/');
    await expect(page.locator('#app-title')).toHaveText(appConfig().APP_NAAM);
    expect(await page.evaluate(() => window.Platform.DOEL)).toBe('android');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
    await page.locator('#btn-demo').click();
    await page.reload();
    await expect(page.locator('#demo-count')).toHaveText('Teller van Speler 1: 1');
    expect((await storage(page))[prefix() + 'profile.p1.progress']).toEqual({ count: 1 });
    // Geen service worker: ook na herladen en even wachten is er niets geregistreerd.
    await page.locator('#btn-settings').click();
    await page.locator('#link-privacy').click();
    await expect(page.locator('#page-text h1')).toHaveText('Privacyverklaring');
    expect(await page.evaluate(async () => ({ workers: (await navigator.serviceWorker.getRegistrations()).length, caches: (await caches.keys()).length })))
      .toEqual({ workers: 0, caches: 0 });
    expectNoProblems(problems);
  });

  test('de terugknop van Android: een stap terug, en op het startscherm de app sluiten', async ({ page }) => {
    // De echte app heeft de plug-in @capacitor/app; hier een namaak die bijhoudt wat er gebeurt.
    await page.addInitScript(() => {
      window.__exits = 0;
      window.Capacitor = { Plugins: { App: {
        addListener(name, fn) { if (name === 'backButton') window.__back = fn; },
        exitApp() { window.__exits++; },
      } } };
    });
    const back = () => page.evaluate(() => window.__back());
    const problems = await open(page, './dist/android/');
    await page.locator('#btn-settings').click();
    await page.locator('#btn-credits').click();
    await expect(page.locator('#screen-credits')).toBeVisible();

    await back();
    await expect(page.locator('#screen-settings')).toBeVisible();
    // Een open venster gaat eerst dicht; er wordt niets gewist.
    await page.locator('#btn-wipe-all').click();
    await expect(page.locator('#modal-confirm')).toBeVisible();
    await back();
    await expect(page.locator('#modal-confirm')).toBeHidden();
    await expect(page.locator('#screen-settings')).toBeVisible();
    await back();
    await expect(page.locator('#screen-start')).toBeVisible();
    expect(await page.evaluate(() => window.__exits)).toBe(0);
    await back();
    expect(await page.evaluate(() => window.__exits), 'op het startscherm sluit de app').toBe(1);

    // Vanaf de privacypagina terug naar de app.
    await page.goto('./dist/android/privacy.html');
    await expect(page.locator('#page-text h1')).toBeVisible();
    await back();
    await expect(page.locator('#app-title')).toBeVisible();
    expectNoProblems(problems);
  });
});

test.describe('bouwdoel webportal', () => {
  test.use({ serviceWorkers: 'allow' });

  test('de upload-zip: index.html bovenaan, zonder service worker en zonder wat er niet in hoort', async () => {
    const zip = path.join(DIST, 'portal-proef.zip');
    const listing = JSON.parse(execFileSync('python3', ['-c',
      'import json,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({"bad": z.testzip(), "names": sorted(z.namelist())}))', zip]).toString());
    expect(listing.bad, 'de zip is heel').toBeNull();
    expect(listing.names).toEqual(allFiles(path.join(DIST, 'portal-proef')));
    for (const must of ['index.html', 'platform/portal.js', 'storage.js', 'privacy.html']) expect(listing.names, must).toContain(must);
    for (const gone of ['sw.js', 'manifest.webmanifest', 'CNAME', 'robots.txt', 'platform/web.js', 'platform/android.js']) expect(listing.names, gone).not.toContain(gone);
    expect(listing.names.filter(f => /^(tests|tools|docs|store|node_modules|\.git)/.test(f) || /\.md$|^package|^capacitor/.test(f))).toEqual([]);
  });

  test('geen links naar buiten, geen verzoeken naar buiten, geen service worker', async ({ page }) => {
    const problems = await open(page, './dist/portal-proef/');
    expect(await page.evaluate(() => window.Platform.DOEL)).toBe('portal');
    await page.locator('#btn-demo').click();
    await expect(page.locator('#demo-count')).toHaveText('Teller van Speler 1: 1');
    const outside = () => page.evaluate(() => [...document.querySelectorAll('a[href], form[action], iframe[src]')]
      .map(el => el.getAttribute('href') || el.getAttribute('action') || el.getAttribute('src'))
      .filter(url => /^(https?:|mailto:|\/\/)/.test(url)));
    await page.locator('#btn-settings').click();
    await page.locator('#btn-credits').click();
    expect(await outside(), 'app').toEqual([]);
    for (const lang of appConfig().TALEN) {
      for (const file of ['privacy.html', 'delete.html']) {
        await page.goto(`./dist/portal-proef/${file}?lang=${lang}`);
        await expect(page.locator('#page-text h1')).toBeVisible();
        expect(await outside(), `${file} ${lang}`).toEqual([]);
        // De tekst zelf staat er nog wel: het contactadres is leesbaar, alleen niet aanklikbaar.
        await expect(page.locator('#page-text')).toContainText('studio.sedillo@gmail.com');
        if (file === 'privacy.html') await expect(page.locator('#page-text')).toContainText('Google');
      }
    }
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
    expectNoProblems(problems);
  });

  test('zonder akkoord zit er geen SDK in; een SDK-laag in platform/portals/ komt alleen in de zip van die portal', async () => {
    expect(fs.existsSync(path.join(ROOT, 'platform', 'portals')), 'de template bevat geen enkele portal-SDK').toBe(false);
    expect(fs.readFileSync(path.join(DIST, 'portal-proef', 'index.html'), 'utf8')).not.toContain('platform/portals/');

    const copy = copyOfApp(dir => {
      fs.mkdirSync(path.join(dir, 'platform', 'portals'));
      fs.writeFileSync(path.join(dir, 'platform', 'portals', 'proef.js'), 'window.Platform.spel.start = function () { window.__sdk = true; };\n');
    });
    expect(bouw(copy, 'portal', 'proef')).toContain('met SDK-laag');
    const html = fs.readFileSync(path.join(copy, 'dist', 'portal-proef', 'index.html'), 'utf8');
    expect(html.indexOf('platform/portals/proef.js'), 'na de algemene portal-laag').toBeGreaterThan(html.indexOf('platform/portal.js'));
    expect(fs.existsSync(path.join(copy, 'dist', 'portal-proef', 'platform', 'portals', 'proef.js'))).toBe(true);
    bouw(copy, 'portal', 'andere');
    expect(fs.readFileSync(path.join(copy, 'dist', 'portal-andere', 'index.html'), 'utf8')).not.toContain('platform/portals/');
    bouw(copy, 'android');
    expect(allFiles(path.join(copy, 'dist', 'android')).filter(f => f.includes('portals'))).toEqual([]);
  });
});

test('hoofdsite: privacy en verwijderen op studiosedillo.com/<app>/, met terug naar de hoofdsite', async ({ page }) => {
  const base = `./dist/hoofdsite/${sitePath()}/`;
  expect(sitePath()).toMatch(/^[a-z0-9][a-z0-9-]*$/);
  const files = allFiles(path.join(DIST, 'hoofdsite', sitePath()));
  for (const gone of ['index.html', 'app.js', 'sw.js', 'manifest.webmanifest']) expect(files, gone).not.toContain(gone);
  const problems = await open(page, base + 'privacy?lang=nl');
  await expect(page.locator('#page-text h1')).toHaveText('Privacyverklaring');
  await expect(page.locator('#page-text')).toContainText(`${appConfig().APP_NAAM} wordt gemaakt en uitgegeven door Studio Sedillo`);
  await expect(page.locator('a[data-back]').first()).toHaveAttribute('href', '../');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.locator('.langs button[data-lang="en"]').click();
  await expect(page.locator('#page-text h1')).toHaveText('Privacy policy');
  await page.goto(base + 'delete?lang=en');
  await expect(page.locator('#page-text h1')).toHaveText('Deleting your data');
  await page.goto(base + 'verwijderen?lang=nl');
  await expect(page.locator('#page-text h1')).toHaveText('Gegevens verwijderen');
  expectNoProblems(problems);
});

test('Capacitor: package-naam, de map van het bouwdoel en de scripts', async () => {
  const cap = JSON.parse(fs.readFileSync(path.join(ROOT, 'capacitor.config.json'), 'utf8'));
  expect(cap.appId).toBe(`com.studiosedillo.${slug()}`);
  expect(cap.appName).toBe(appConfig().APP_NAAM);
  expect(cap.webDir).toBe('dist/android');
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  for (const dep of ['@capacitor/core', '@capacitor/android', '@capacitor/app']) expect(pkg.dependencies[dep], dep).toBeTruthy();
  expect(pkg.devDependencies['@capacitor/cli']).toBeTruthy();
  for (const script of ['bouw:android', 'android:init', 'android:sync']) expect(pkg.scripts[script], script).toContain('tools/bouw.mjs android');
  // Advertenties komen er alleen in na akkoord: geen AdMob-plug-in in een nieuwe app.
  expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter(d => /admob|ads/i.test(d))).toEqual([]);
  const build = JSON.parse(fs.readFileSync(path.join(ROOT, 'bouw.config.json'), 'utf8'));
  expect(build.web).toEqual({ live: false, domein: `${slug()}.studiosedillo.com` });
  expect(build.portals, 'geen portal zonder akkoord').toEqual([]);
});

test('CLAUDE.md van de app verwijst naar de sectie "App-structuur Studio Sedillo"', async () => {
  const text = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
  expect(text).toContain('App-structuur Studio Sedillo');
  expect(text).toMatch(/Apps\/CLAUDE\.md.*sectie 11/s);
  expect(fs.readFileSync(path.join(ROOT, 'docs', 'lanceren.md'), 'utf8')).toContain('sectie 11');
});
