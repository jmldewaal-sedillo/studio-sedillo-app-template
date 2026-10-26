// Beveiliging: Content-Security-Policy in elk bouwdoel, vijandige codes bij "Voortgang overzetten",
// kapotte opslag, en de vaste Android-instellingen (geen back-up, geen advertentie-ID).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { ROOT, slug, prefix, once, open, storage, copyOfApp, bouw, allFiles, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
const code = data => slug() + '1.' + encode({ app: slug(), v: 1, data });

function cspOf(html) {
  const m = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html);
  return m ? m[1] : null;
}

test('elke pagina heeft een strenge Content-Security-Policy, in de bron en in elk bouwdoel', async () => {
  const check = (dir, label) => {
    const pages = allFiles(dir).filter(f => f.endsWith('.html'));
    expect(pages.length, label).toBeGreaterThan(0);
    for (const file of pages) {
      const html = fs.readFileSync(path.join(dir, file), 'utf8');
      const csp = cspOf(html);
      expect(csp, `${label}/${file}: CSP ontbreekt`).not.toBeNull();
      expect(csp, `${label}/${file}`).toContain("default-src 'self'");
      expect(csp, `${label}/${file}`).toContain("object-src 'none'");
      expect(csp, `${label}/${file}: geen unsafe-inline of unsafe-eval`).not.toMatch(/unsafe-(inline|eval)/);
      expect(html, `${label}/${file}: referrer`).toContain('<meta name="referrer" content="strict-origin-when-cross-origin" />');
      expect(html, `${label}/${file}: geen inline style-attribuut (de CSP verbiedt het)`).not.toMatch(/\sstyle="/);
    }
  };
  check(ROOT, 'bron');
  const copy = copyOfApp();
  for (const doel of ['app', 'test', 'hoofdsite']) { bouw(copy, doel); check(path.join(copy, 'dist', doel), doel); }
});

test('portal: extra bronnen uit portalCsp komen in de CSP, en alleen als https-adres', async () => {
  const copy = copyOfApp(dir => {
    const file = path.join(dir, 'bouw.config.json');
    const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
    cfg.portalCsp = { proef: ['https://sdk.voorbeeld.com'] };
    fs.writeFileSync(file, JSON.stringify(cfg));
  });
  bouw(copy, 'portal', 'proef');
  const csp = cspOf(fs.readFileSync(path.join(copy, 'dist', 'portal-proef', 'index.html'), 'utf8'));
  expect(csp).toMatch(/script-src 'self' https:\/\/sdk\.voorbeeld\.com/);
  expect(csp).toMatch(/connect-src 'self' https:\/\/sdk\.voorbeeld\.com/);
  expect(csp).toContain('frame-src https://sdk.voorbeeld.com');
  // Een andere portal krijgt die bron niet.
  bouw(copy, 'portal', 'andere');
  expect(cspOf(fs.readFileSync(path.join(copy, 'dist', 'portal-andere', 'index.html'), 'utf8'))).not.toContain('voorbeeld');
  // Iets anders dan een kaal https-adres wordt geweigerd.
  const bad = copyOfApp(dir => {
    const file = path.join(dir, 'bouw.config.json');
    const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
    cfg.portalCsp = { proef: ["https://x.com 'unsafe-inline'"] };
    fs.writeFileSync(file, JSON.stringify(cfg));
  });
  expect(() => bouw(bad, 'portal', 'proef')).toThrow();
});

test('vijandige codes: niets wordt uitgevoerd, vreemde waarden vallen weg, en de app start daarna gewoon', async ({ page }) => {
  const problems = await open(page);
  const hostile = code({
    settings: { language: 'constructor', __proto__x: 1, '<b>': 'x', theme: { nested: true }, ok: true },
    profiles: { v: 1, active: 'p1', next: 3, list: [{ id: 'p1', name: '<img src=x onerror="window.__xss=1">' }, { id: 'p2', name: 'B' }] },
    'profile.p1.progress': { count: 7, extra: '<script>window.__xss=2</script>' },
    'profile.p2.progress': { count: '<img src=x onerror="window.__xss=3">' },
    'profile.p1.onbekend': { iets: 1 },
    'profile.x.progress': { count: 1 },
  });
  const read = await page.evaluate(c => window.AppStorage.readCode(c), hostile);
  expect(read).toEqual({
    settings: { ok: true },
    profiles: { v: 1, active: 'p1', next: 3, list: [{ id: 'p1', name: '<img src=x onerror="window.__xss=1">' }, { id: 'p2', name: 'B' }] },
    'profile.p1.progress': { count: 7 },
  });

  await page.locator('#btn-settings').click();
  await page.locator('#btn-transfer').click();
  await page.locator('#transfer-input').fill(hostile);
  await page.locator('#btn-import').click();
  await page.locator('#btn-confirm-yes').click();
  await page.locator('#btn-transfer-ok').click();
  await page.reload();
  await page.locator('#btn-settings').click();
  // De naam staat er als tekst (ingekort tot MAX_NAME), er is geen <img> gemaakt en er is niets uitgevoerd.
  await expect(page.locator('#profile-list button').first()).toHaveText('<img src=x onerror="window.__xss=1">'.slice(0, 20));
  expect(await page.locator('#profile-list img').count()).toBe(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  expect(Object.keys(await storage(page)).sort()).toEqual([`${prefix()}profile.p1.progress`, `${prefix()}profiles`, `${prefix()}settings`]);
  expectNoProblems(problems);
});

test('zonder cleanPart weigert de app elke code', async ({ page }) => {
  await open(page);
  const ok = code({ 'profile.p1.progress': { count: 1 } });
  expect(await page.evaluate(c => !!window.AppStorage.readCode(c), ok)).toBe(true);
  expect(await page.evaluate(c => { window.AppStorage.cleanPart = null; return window.AppStorage.readCode(c); }, ok)).toBeNull();
});

test('kapotte of vreemde gegevens in de opslag: de app start gewoon, zonder fouten', async ({ page }) => {
  await open(page);
  await page.evaluate(p => {
    localStorage.setItem(p + 'profiles', '{kapot');
    localStorage.setItem(p + 'settings', JSON.stringify({ language: 'constructor' }));
    localStorage.setItem(p + 'profile.p1.progress', JSON.stringify({ count: '<b>x</b>' }));
  }, prefix());
  const problems = await open(page);
  await expect(page.locator('#app-title')).toBeVisible();
  await expect(page.locator('#demo-count')).toContainText(': 0');
  await page.locator('#btn-settings').click();
  await expect(page.locator('#profile-list button')).toHaveCount(1);
  expectNoProblems(problems);
});

test('Android: geen back-up en geen advertentie-ID, en --check vangt een terugval', async () => {
  const dir = copyOfApp();
  const main = path.join(dir, 'android', 'app', 'src', 'main');
  fs.mkdirSync(main, { recursive: true });
  // Zoals Capacitor hem aanmaakt.
  fs.writeFileSync(path.join(main, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">
    </application>

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`);
  const tool = (...args) => execFileSync('node', [path.join(dir, 'tools', 'android-instellingen.mjs'), '--root', dir, ...args], { stdio: 'pipe' }).toString();
  expect(() => tool('--check'), 'zonder aanpassing faalt de controle').toThrow();
  tool();
  const xml = fs.readFileSync(path.join(main, 'AndroidManifest.xml'), 'utf8');
  expect(xml).toContain('xmlns:tools="http://schemas.android.com/tools"');
  expect(xml).toContain('android:allowBackup="false"');
  expect(xml).not.toContain('android:allowBackup="true"');
  expect(xml).toContain('android:fullBackupContent="false"');
  expect(xml).toContain('android:dataExtractionRules="@xml/data_extraction_rules"');
  expect(xml).toContain('<uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove" />');
  const rules = fs.readFileSync(path.join(main, 'res', 'xml', 'data_extraction_rules.xml'), 'utf8');
  for (const part of ['cloud-backup', 'device-transfer', 'domain="sharedpref"', 'domain="root"']) expect(rules).toContain(part);
  expect(tool('--check')).toContain('in orde');
  expect(tool()).toContain('was al in orde');
  expect(fs.readFileSync(path.join(main, 'AndroidManifest.xml'), 'utf8'), 'twee keer draaien verandert niets').toBe(xml);

  // Met advertenties (alleen na akkoord van Jenn) mag de advertentie-ID wel; de back-up blijft uit.
  const cfg = path.join(dir, 'config.js');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace('ADVERTENTIES: false', 'ADVERTENTIES: true'));
  tool();
  const withAds = fs.readFileSync(path.join(main, 'AndroidManifest.xml'), 'utf8');
  expect(withAds).not.toContain('AD_ID');
  expect(withAds).toContain('android:allowBackup="false"');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('zonder android/ doet het script niets', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'geen-android-'));
  fs.copyFileSync(path.join(ROOT, 'config.js'), path.join(dir, 'config.js'));
  const out = execFileSync('node', [path.join(ROOT, 'tools', 'android-instellingen.mjs'), '--root', dir, '--check']).toString();
  expect(out).toContain('niets te doen');
  fs.rmSync(dir, { recursive: true, force: true });
});
