// Service worker: alles in de cache, de app werkt zonder internet, en de site die naar
// GitHub Pages gaat krijgt per repo het juiste adres.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, BASE, appConfig, slug, prefix, once, open, storage, copyOfApp, bouw, allFiles, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

const swSource = () => fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const assets = () => [...swSource().match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
// De bouwdoelen staan al in dist/ (tests/start-server.mjs bouwt ze voor de tests beginnen).
const DIST = path.join(ROOT, 'dist');
const read = (...parts) => fs.readFileSync(path.join(DIST, ...parts), 'utf8');

test.describe('met service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('installeert, zet alle bestanden in de cache en werkt daarna zonder internet', async ({ page, context }) => {
    const problems = await open(page);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const version = swSource().match(/const CACHE_VERSION = '([^']+)';/)[1];
    expect(version).toMatch(new RegExp(`^${slug()}-v\\d+$`));

    const cached = await page.evaluate(async () => {
      const names = await caches.keys();
      const keys = await (await caches.open(names[0])).keys();
      return { names, urls: keys.map(r => new URL(r.url).pathname).sort() };
    });
    expect(cached.names).toEqual([version]);
    expect(cached.urls).toEqual(assets().map(a => a.replace(/^\.\//, '/')).sort());

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#app-title')).toBeVisible();
    await page.locator('#btn-demo').click();
    await expect(page.locator('#demo-count')).toHaveText('Teller van Speler 1: 1');
    expect((await storage(page))[prefix() + 'profile.p1.progress']).toEqual({ count: 1 });

    // Taal wisselen, privacy en verwijderen: ook zonder internet.
    await page.locator('#btn-settings').click();
    await page.locator('#screen-settings .langs button[data-lang="en"]').click();
    await expect(page.locator('#btn-wipe-all')).toHaveText('Delete all data of this app');
    await page.locator('#link-privacy').click();
    await expect(page.locator('#page-text h1')).toHaveText('Privacy policy');
    for (const url of ['./delete.html', './privacy', './delete', './verwijderen', './?bron=startscherm']) {
      await page.goto(url);
      await expect(page.locator('h1').first(), url).toBeVisible();
    }
    // De iconen ook (anders toont een geïnstalleerde app geen icoon zonder internet).
    const icon = await page.evaluate(async () => (await fetch('icons/icon-192.png')).status);
    expect(icon).toBe(200);
    await context.setOffline(false);
    expectNoProblems(problems);
  });
});

test('de lijst in sw.js is compleet: elk bestand van de webversie staat erin, en elk bestand bestaat', async () => {
  // Wat de app niet nodig heeft om te werken, of wat de service worker niet mag vasthouden.
  const notCached = ['sw.js', 'CNAME', '.nojekyll', 'version.json', 'robots.txt'];
  const onSite = allFiles(path.join(DIST, 'web')).filter(f => !notCached.includes(f));
  const listed = assets().filter(a => a !== './').map(a => a.replace(/^\.\//, '')).sort();
  expect(listed).toEqual(onSite);
  expect(assets()).toContain('./');
});

test('testversie: altijd noindex, geen eigen adres, eigen naam en een cache per commit', async () => {
  const files = allFiles(path.join(DIST, 'test'));
  expect(files, 'geen CNAME: de testversie staat op github.io').not.toContain('CNAME');
  expect(read('test', 'robots.txt')).toBe('User-agent: *\nDisallow: /\n');
  const pages = files.filter(f => f.endsWith('.html'));
  expect(pages.length).toBeGreaterThanOrEqual(4);
  for (const page of pages) expect(read('test', page), `${page} heeft noindex`).toMatch(/<meta name="robots" content="noindex/);
  expect(read('test', 'sw.js')).toContain("const BUILD = 'abcdef1';");
  const manifest = JSON.parse(read('test', 'manifest.webmanifest'));
  expect(manifest.name.startsWith('TEST – ')).toBe(true);
  expect(manifest.short_name.length).toBeLessThanOrEqual(12);
  const leaked = files.filter(f => /^(tests|tools|docs|store|android|ios|node_modules|\.github|\.git)\//.test(f) || /\.md$|^package|^playwright|^\.template$|^capacitor|^bouw\.config/.test(f));
  expect(leaked, 'alleen de app zelf gaat naar de site').toEqual([]);
  expect(files).toContain('.nojekyll');
});

test('de vindbaar-schakelaar: op "nee" krijgt ook de webversie noindex; op "ja" alleen de testversie nog', async () => {
  expect(appConfig().VINDBAAR, 'VINDBAAR staat op false tot Jenn anders besluit').toBe(false);
  expect(read('web', 'index.html')).toMatch(/<meta name="robots" content="noindex/);
  expect(read('web', 'robots.txt')).toContain('Disallow: /');
  expect(read('web', 'CNAME')).toBe(`${slug()}.studiosedillo.com\n`);
  expect(read('web', 'sw.js'), 'de webversie krijgt geen build-stempel').toBe(swSource());

  const copy = copyOfApp(dir => {
    const file = path.join(dir, 'config.js');
    const text = fs.readFileSync(file, 'utf8');
    expect(text).toContain('VINDBAAR: false');
    fs.writeFileSync(file, text.replace('VINDBAAR: false', 'VINDBAAR: true'));
  });
  bouw(copy, 'web');
  bouw(copy, 'test');
  expect(fs.readFileSync(path.join(copy, 'dist', 'web', 'index.html'), 'utf8')).not.toMatch(/name="robots"/);
  expect(fs.existsSync(path.join(copy, 'dist', 'web', 'robots.txt'))).toBe(false);
  expect(fs.readFileSync(path.join(copy, 'dist', 'test', 'index.html'), 'utf8'), 'de testversie blijft noindex').toMatch(/content="noindex/);
});

test('publiceren: alleen de test-repo, en de webversie pas na "lanceren web"', async () => {
  const repo = 'mijn-app';
  expect(bouw(ROOT, 'moet-publiceren', `${repo}-test`).trim()).toBe('true');
  expect(bouw(ROOT, 'moet-publiceren', repo).trim(), 'web.live staat uit').toBe('false');
  expect(bouw(ROOT, 'pages', repo, '--uit', path.join(os.tmpdir(), 'niets-' + Date.now()))).toContain('Niets te publiceren');

  const copy = copyOfApp(dir => {
    const file = path.join(dir, 'bouw.config.json');
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(config.web.live).toBe(false);
    config.web.live = true;
    fs.writeFileSync(file, JSON.stringify(config));
  });
  expect(bouw(copy, 'moet-publiceren', repo).trim()).toBe('true');
  bouw(copy, 'pages', repo, 'abcdef1234567890');
  expect(fs.readFileSync(path.join(copy, '_site', 'CNAME'), 'utf8')).toBe(`${slug()}.studiosedillo.com\n`);
  bouw(copy, 'pages', `${repo}-test`, 'abcdef1234567890');
  expect(fs.existsSync(path.join(copy, '_site', 'CNAME')), 'de test-repo krijgt geen eigen adres').toBe(false);
  expect(fs.readFileSync(path.join(copy, '_site', 'sw.js'), 'utf8')).toContain("const BUILD = 'abcdef1';");
});

test('de strook TEST staat er alleen op een adres dat met test- begint', async ({ page }) => {
  await open(page);
  await expect(page.locator('#app-title')).toBeVisible();
  await expect(page.locator('#test-strip')).toBeHidden();
  // Chromium stuurt elk adres dat op .localhost eindigt naar deze computer.
  await page.goto(BASE.replace('localhost', `test-${slug()}.localhost`));
  await expect(page.locator('#app-title')).toBeVisible();
  await expect(page.locator('#test-strip')).toBeVisible();
  await expect(page.locator('#test-strip')).toHaveText('TEST');
});
