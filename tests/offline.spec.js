// Service worker: alles in de cache, de app werkt zonder internet, en de site die naar
// GitHub Pages gaat krijgt per repo het juiste adres.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { ROOT, BASE, slug, prefix, once, open, storage, expectNoProblems } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

const swSource = () => fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const assets = () => [...swSource().match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
function build(repo, commit = 'abcdef1234567890') {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'site-'));
  execFileSync('node', [path.join(ROOT, 'tools', 'bouw-site.mjs'), out, repo, commit], { stdio: 'pipe' });
  return out;
}
function allFiles(dir, base = dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) allFiles(full, base, out); else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out.sort();
}

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

test('de lijst in sw.js is compleet: elk bestand van de site staat erin, en elk bestand bestaat', async () => {
  const site = build(slug());
  // Wat de app niet nodig heeft om te werken, of wat de service worker niet mag vasthouden.
  const notCached = ['sw.js', 'CNAME', '.nojekyll', 'version.json', '.well-known/assetlinks.json'];
  const onSite = allFiles(site).filter(f => !notCached.includes(f));
  const listed = assets().filter(a => a !== './').map(a => a.replace(/^\.\//, '')).sort();
  expect(listed).toEqual(onSite);
  expect(assets()).toContain('./');
});

test('de site krijgt per repo het juiste adres: live en test', async () => {
  const live = build(slug());
  expect(fs.readFileSync(path.join(live, 'CNAME'), 'utf8')).toBe(`${slug()}.studiosedillo.com\n`);
  expect(fs.readFileSync(path.join(live, 'sw.js'), 'utf8')).toBe(swSource());
  expect(JSON.parse(fs.readFileSync(path.join(live, 'manifest.webmanifest'), 'utf8')).name).not.toContain('TEST');

  const testSite = build(`${slug()}-test`);
  expect(fs.readFileSync(path.join(testSite, 'CNAME'), 'utf8')).toBe(`test-${slug()}.studiosedillo.com\n`);
  expect(fs.readFileSync(path.join(testSite, 'sw.js'), 'utf8')).toContain("const BUILD = 'abcdef1';");
  const manifest = JSON.parse(fs.readFileSync(path.join(testSite, 'manifest.webmanifest'), 'utf8'));
  expect(manifest.name.startsWith('TEST – ')).toBe(true);
  expect(manifest.short_name.length).toBeLessThanOrEqual(12);

  for (const site of [live, testSite]) {
    const files = allFiles(site);
    for (const must of ['.nojekyll', '.well-known/assetlinks.json', 'index.html', 'privacy.html', 'delete.html', 'verwijderen.html', 'version.json']) {
      expect(files, must).toContain(must);
    }
    const leaked = files.filter(f => /^(tests|tools|docs|store|twa|node_modules|\.github|\.git)\//.test(f) || /\.md$|^package|^playwright|^\.template$/.test(f));
    expect(leaked, 'alleen de app zelf gaat naar de site').toEqual([]);
  }
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
