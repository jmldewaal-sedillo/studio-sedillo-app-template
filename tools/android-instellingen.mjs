// Vaste Android-instellingen voor elke app van Studio Sedillo (Apps/CLAUDE.md, sectie 5 en 11).
// Draait na `cap add android` en `cap sync` (zie package.json); app.yml controleert met --check.
//
//   - Geen cloud-back-up en niets mee bij het overzetten naar een ander toestel: profielnamen en
//     voortgang blijven op het toestel. Overzetten gaat met "Voortgang overzetten" in de app.
//   - Geen advertentie-ID (AD_ID) zolang ADVERTENTIES in config.js niet true is.
//
//   node tools/android-instellingen.mjs            zet alles goed
//   node tools/android-instellingen.mjs --check    verandert niets; exitcode 1 als er iets niet klopt
//   --root <map>                                    andere app-map (voor de tests)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const check = argv.includes('--check');
const r = argv.indexOf('--root');
const ROOT = r >= 0 ? resolve(argv[r + 1]) : resolve(fileURLToPath(new URL('..', import.meta.url)));
const MANIFEST = join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const RULES = join(ROOT, 'android', 'app', 'src', 'main', 'res', 'xml', 'data_extraction_rules.xml');
const AD_ID = 'com.google.android.gms.permission.AD_ID';

if (!existsSync(MANIFEST)) {
  console.log('android-instellingen: nog geen android/ (eerst npm run app:init); niets te doen.');
  process.exit(0);
}

const config = (() => { const window = {}; new Function('window', readFileSync(join(ROOT, 'config.js'), 'utf8'))(window); return window.APP_CONFIG; })();
const ads = config.ADVERTENTIES === true;

const DOMAINS = ['root', 'file', 'database', 'sharedpref', 'external'];
const RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Niets van de app gaat mee in een cloud-back-up of bij het overzetten naar een ander toestel.
     Voortgang overzetten gaat met "Voortgang overzetten" in de app. (tools/android-instellingen.mjs) -->
<data-extraction-rules>
    <cloud-backup>
${DOMAINS.map(d => `        <exclude domain="${d}" />`).join('\n')}
    </cloud-backup>
    <device-transfer>
${DOMAINS.map(d => `        <exclude domain="${d}" />`).join('\n')}
    </device-transfer>
</data-extraction-rules>
`;

function setAttr(tag, name, value) {
  const re = new RegExp(`(\\s)${name}="[^"]*"`);
  return re.test(tag) ? tag.replace(re, `$1${name}="${value}"`) : tag.replace(/^<application/, `<application\n        ${name}="${value}"`);
}

const before = readFileSync(MANIFEST, 'utf8');
let xml = before;
if (!/xmlns:tools=/.test(xml)) xml = xml.replace(/<manifest\b/, '<manifest xmlns:tools="http://schemas.android.com/tools"');
xml = xml.replace(/<application\b[^>]*>/, tag => {
  let t = tag;
  t = setAttr(t, 'android:allowBackup', 'false');
  t = setAttr(t, 'android:fullBackupContent', 'false');
  t = setAttr(t, 'android:dataExtractionRules', '@xml/data_extraction_rules');
  return t;
});
const removeAdId = `    <uses-permission android:name="${AD_ID}" tools:node="remove" />`;
const hasRemove = xml.includes(`android:name="${AD_ID}" tools:node="remove"`);
if (!ads && !hasRemove) xml = xml.replace(/(\n)(\s*)<\/manifest>/, `\n${removeAdId}$1$2</manifest>`);
if (ads && hasRemove) xml = xml.replace(new RegExp(`\\n[ \\t]*<uses-permission android:name="${AD_ID.replace(/\./g, '\\.')}" tools:node="remove" />`), '');

const rulesOk = existsSync(RULES) && readFileSync(RULES, 'utf8') === RULES_XML;
const problems = [];
if (xml !== before) problems.push('AndroidManifest.xml: back-up of AD_ID staat niet goed');
if (!rulesOk) problems.push('res/xml/data_extraction_rules.xml ontbreekt of is anders');

if (check) {
  if (problems.length) { problems.forEach(p => console.error('android-instellingen: ' + p)); console.error('Los op met: node tools/android-instellingen.mjs'); process.exit(1); }
  console.log('android-instellingen: in orde (geen back-up' + (ads ? ', AD_ID toegestaan voor advertenties' : ', geen AD_ID') + ').');
  process.exit(0);
}
if (xml !== before) writeFileSync(MANIFEST, xml);
if (!rulesOk) { mkdirSync(dirname(RULES), { recursive: true }); writeFileSync(RULES, RULES_XML); }
console.log(problems.length ? 'android-instellingen: bijgewerkt (geen back-up' + (ads ? '' : ', geen AD_ID') + ').' : 'android-instellingen: was al in orde.');
