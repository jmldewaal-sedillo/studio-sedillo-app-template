// Faalt zolang er nog een placeholder van de template in de bestanden staat.
// In de template zelf controleert dit de ingevulde kopie, en dus of tools/vul-in.mjs
// (dat Apps/tools/nieuwe-app.sh gebruikt) echt alles invult.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, once, textFiles } = require('./helpers');

const PLACEHOLDER = /\{\{\s*[A-Z_]+\s*\}\}/g;

test('geen enkele {{...}}-placeholder meer in de bestanden', async ({}, info) => {
  once(info);
  const files = textFiles(ROOT);
  expect(files.length, 'er zijn bestanden gecontroleerd').toBeGreaterThan(30);
  for (const must of ['index.html', 'config.js', 'storage.js', 'sw.js', 'manifest.webmanifest', 'capacitor.config.json', 'bouw.config.json', 'README.md', 'ROADMAP.md', 'CLAUDE.md',
    path.join('platform', 'app.js'), path.join('.github', 'workflows', 'ci.yml'), path.join('docs', 'lanceren.md'), path.join('docs', 'publiceren.md'), path.join('store', 'README.md')]) {
    expect(files.map(f => path.relative(ROOT, f)), `${must} is gecontroleerd`).toContain(must);
  }
  const found = [];
  for (const file of files) {
    const hits = fs.readFileSync(file, 'utf8').match(PLACEHOLDER);
    if (hits) found.push(`${path.relative(ROOT, file)}: ${[...new Set(hits)].join(' ')}`);
  }
  expect(found, 'placeholders die nog ingevuld moeten worden').toEqual([]);
  expect(fs.existsSync(path.join(ROOT, '.template')), 'het bestand .template hoort alleen in de template').toBe(false);
});
