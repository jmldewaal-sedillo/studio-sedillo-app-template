// Geld: advertenties en aankopen staan uit tot Jenn ze goedkeurt, nooit in een kinder-app, en als ze
// aan gaan klopt de rest mee (privacyverklaring, voorwaardenpagina). Zie docs/publiceren.md, punt 11.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, appConfig, once, copyOfApp } = require('./helpers');

test.beforeEach(async ({}, info) => once(info));

function configOf(dir) {
  const window = {};
  new Function('window', fs.readFileSync(path.join(dir, 'config.js'), 'utf8'))(window);
  return window.APP_CONFIG;
}
const i18nText = dir => fs.readdirSync(path.join(dir, 'i18n')).map(f => fs.readFileSync(path.join(dir, 'i18n', f), 'utf8')).join('\n');

/** Wat niet klopt aan de instellingen voor geld in deze map. */
function problemen(dir) {
  const c = configOf(dir);
  const text = i18nText(dir);
  const out = [];
  if (typeof c.ADVERTENTIES !== 'boolean' || typeof c.AANKOPEN !== 'boolean') out.push('ADVERTENTIES en AANKOPEN staan in config.js als true of false');
  if (c.KINDER_APP === true && c.ADVERTENTIES === true) out.push('geen advertenties in een kinder-app');
  if (c.KINDER_APP === true && c.AANKOPEN === true) out.push('geen aankopen in een kinder-app');
  if (c.ADVERTENTIES === true) {
    if (/Geen advertenties|No advertising/.test(text)) out.push('privacyverklaring zegt nog "geen advertenties"');
    if (!/AdMob/.test(text)) out.push('privacyverklaring noemt AdMob niet');
  }
  if (c.AANKOPEN === true) {
    if (/Geen aankopen in de app|No in-app purchases/.test(text)) out.push('privacyverklaring zegt nog "geen aankopen"');
    if (!fs.existsSync(path.join(dir, 'voorwaarden.html'))) out.push('voorwaarden.html ontbreekt (terugbetalen, herroepingsrecht, munten zonder geldwaarde)');
  }
  return out;
}

function zet(dir, naam, waarde) {
  const file = path.join(dir, 'config.js');
  const before = fs.readFileSync(file, 'utf8');
  const re = new RegExp(`${naam}:\\s*(true|false)`);
  expect(re.test(before), `${naam} staat in config.js`).toBe(true);
  const after = before.replace(re, `${naam}: ${waarde}`);
  fs.writeFileSync(file, after);
}

test('advertenties en aankopen: de instellingen van deze app kloppen', async () => {
  expect(problemen(ROOT)).toEqual([]);
  const c = appConfig();
  if (c.KINDER_APP) expect([c.ADVERTENTIES, c.AANKOPEN]).toEqual([false, false]);
});

test('de controle werkt echt: kinder-app met advertenties of aankopen, en aankopen zonder voorwaarden', async () => {
  const kids = copyOfApp(dir => { zet(dir, 'KINDER_APP', true); zet(dir, 'ADVERTENTIES', true); zet(dir, 'AANKOPEN', true); });
  const p = problemen(kids);
  expect(p).toContain('geen advertenties in een kinder-app');
  expect(p).toContain('geen aankopen in een kinder-app');
  expect(p).toContain('privacyverklaring zegt nog "geen advertenties"');
  expect(p).toContain('privacyverklaring zegt nog "geen aankopen"');
  expect(p.some(x => x.startsWith('voorwaarden.html ontbreekt'))).toBe(true);
  fs.rmSync(kids, { recursive: true, force: true });
});
