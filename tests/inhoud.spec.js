// Inhoud: geen loze beloftes in de store-teksten, geen diensten van buiten (trackers, session replay,
// Google Fonts) en elk bestand van buiten staat in docs/credits.md.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');
const { ROOT, appConfig, once, textFiles } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

const controle = () => import(pathToFileURL(path.join(ROOT, 'tools', 'store-controle.mjs')).href);

test('store-teksten: geen "gratis", "beste", "#1", sterren, reviews of emoji, en kloppend met config.js', async () => {
  const { controleerStore, storeBestanden } = await controle();
  expect(storeBestanden(ROOT).length, 'er zijn store-teksten').toBeGreaterThan(3);
  expect(controleerStore(ROOT)).toEqual([]);
});

test('de controle werkt echt: verboden woorden, een review en tegenspraak met config.js worden gevonden', async () => {
  const { controleerTekst } = await controle();
  const zonder = { ADVERTENTIES: false, AANKOPEN: false };
  expect(controleerTekst('Het leukste spel, 100% gratis!', { config: zonder }).length).toBe(2);
  expect(controleerTekst('De #1 puzzel met 5 sterren', { config: zonder }).length).toBe(2);
  expect(controleerTekst('"Geweldig spel!" – Lisa', { config: zonder })).toHaveLength(1);
  expect(controleerTekst('Geen advertenties', { config: { ADVERTENTIES: true } })).toHaveLength(1);
  expect(controleerTekst('No in-app purchases', { config: { AANKOPEN: true } })).toHaveLength(1);
  expect(controleerTekst('INVULLEN: tekst', { config: zonder, klaar: true })).toHaveLength(1);
  expect(controleerTekst('INVULLEN: tekst', { config: zonder })).toEqual([]);
  expect(controleerTekst('Puzzels voor kinderen, zonder advertenties.', { config: zonder })).toEqual([]);
});

test('teksten in de app: geen loze beloftes in de vertalingen en het manifest', async () => {
  const { VERBODEN } = await controle();
  const found = [];
  const files = [...fs.readdirSync(path.join(ROOT, 'i18n')).map(f => path.join(ROOT, 'i18n', f)), path.join(ROOT, 'manifest.webmanifest')];
  for (const file of files) {
    // Alleen de teksten, niet de links (policies.google.com bevat geen verboden woorden, maar toch).
    const text = fs.readFileSync(file, 'utf8').replace(/https?:\/\/\S+/g, '');
    for (const re of VERBODEN) { const m = text.match(re); if (m) found.push(`${path.relative(ROOT, file)}: "${m[0]}"`); }
  }
  expect(found).toEqual([]);
});

// Bestanden die in de app (of op de pagina's) terechtkomen.
const appFiles = () => textFiles(ROOT, ['.git', 'node_modules', 'test-results', 'playwright-report', '.test-build', '_site', 'dist',
  'android', 'ios', 'tests', 'tools', 'docs', 'store', '.github', 'screenshots'])
  .filter(f => !f.endsWith('.md') && !['package.json', 'package-lock.json', 'playwright.config.js'].includes(path.basename(f)));

test('geen trackers, analytics, session replay of lettertypen van buiten', async () => {
  const BANNED = /fonts\.googleapis|fonts\.gstatic|use\.typekit|googletagmanager|google-analytics|gtag\(|\bga\(|fbq\(|connect\.facebook|hotjar|clarity\.ms|fullstory|logrocket|smartlook|mouseflow|mixpanel|segment\.(com|io)|amplitude|posthog|sentry|bugsnag|firebase|appsflyer|adjust\.com|branch\.io/i;
  const found = [];
  for (const file of appFiles()) {
    const m = fs.readFileSync(file, 'utf8').match(BANNED);
    if (m) found.push(`${path.relative(ROOT, file)}: ${m[0]}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) if (BANNED.test(dep)) found.push(`package.json: ${dep}`);
  expect(found, 'alleen na een besluit van Jenn, en dan eerst privacyverklaring en Data safety bijwerken').toEqual([]);
});

test('adressen in de app: alleen bekende hosts (beleidspagina\'s en de eigen domeinen)', async () => {
  const ALLOWED = [/^policies\.google\.com$/, /^docs\.github\.com$/, /^(.+\.)?studiosedillo\.com$/, /^jmldewaal-sedillo\.github\.io$/, /^www\.w3\.org$/, /^schemas\.android\.com$/];
  const found = [];
  for (const file of appFiles()) {
    for (const [, host] of fs.readFileSync(file, 'utf8').matchAll(/\bhttps?:\/\/([a-z0-9.-]+)/gi)) {
      if (!ALLOWED.some(re => re.test(host.toLowerCase()))) found.push(`${path.relative(ROOT, file)}: ${host}`);
    }
  }
  expect([...new Set(found)], 'nieuwe host? Eerst Jenn vragen, dan in de CSP, de privacyverklaring en deze lijst').toEqual([]);
});

test('credits: elk bestand in een map met beeld, geluid of lettertypen staat in docs/credits.md', async () => {
  const credits = fs.readFileSync(path.join(ROOT, 'docs', 'credits.md'), 'utf8');
  const DIRS = ['icons', 'assets', 'images', 'img', 'sounds', 'audio', 'music', 'fonts', 'models', 'textures'];
  const missing = [];
  for (const dir of DIRS) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    const walk = d => fs.readdirSync(d).flatMap(n => fs.statSync(path.join(d, n)).isDirectory() ? walk(path.join(d, n)) : [path.join(d, n)]);
    for (const file of walk(full)) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      // Het bestand zelf, of een map erboven met een / erachter ("icons/").
      const parts = rel.split('/');
      const covered = credits.includes(rel) || parts.slice(0, -1).some((_, i) => credits.includes(parts.slice(0, i + 1).join('/') + '/'));
      if (!covered) missing.push(rel);
    }
  }
  expect(missing, 'zet ze in docs/credits.md (eigen werk of met maker, licentie en link)').toEqual([]);
  for (const c of appConfig().CREDITS) expect(credits, `CREDITS in config.js: ${c.maker} staat ook in docs/credits.md`).toContain(c.maker);
});
