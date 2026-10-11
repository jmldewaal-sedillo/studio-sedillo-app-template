// Bouwt de app voor één bouwdoel. Eén codebase, per bouwdoel alleen een dunne laag
// (platform/<doel>.js). Zie Apps/CLAUDE.md, sectie 11, "App-structuur Studio Sedillo".
//
//   node tools/bouw.mjs android              -> dist/android/            voor Capacitor (docs/android.md)
//   node tools/bouw.mjs portal <naam>        -> dist/portal-<naam>.zip   upload voor een webportal (docs/webportals.md)
//   node tools/bouw.mjs test [commit]        -> dist/test/               testversie voor github.io, altijd noindex
//   node tools/bouw.mjs web                  -> dist/web/                PWA voor <slug>.studiosedillo.com ("lanceren web")
//   node tools/bouw.mjs hoofdsite            -> dist/hoofdsite/<app>/    privacy en verwijderen voor studiosedillo.com/<app>/
//   node tools/bouw.mjs pages <repo> [commit]   wat de workflow publiceert: de testversie voor <repo>-test,
//                                               de webversie voor <repo> als web.live aan staat, anders niets
//   node tools/bouw.mjs moet-publiceren <repo>  print true of false
//   --uit <map>                              andere uitvoermap
//
// Per bouwdoel:
//   android, portal   geen service worker, geen manifest; portal ook geen links naar buiten
//   test, web         service worker en manifest; noindex tenzij VINDBAAR in config.js true is (test: altijd)
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const argv = process.argv.slice(2);
let outArg = null;
const uit = argv.indexOf('--uit');
if (uit >= 0) { outArg = argv[uit + 1]; argv.splice(uit, 2); }
const [doel, ...rest] = argv;

function fail(message) { console.error('bouw: ' + message); process.exit(1); }

// ---------- gegevens van de app ----------
function appConfig() {
  const window = {};
  new Function('window', readFileSync(join(ROOT, 'config.js'), 'utf8'))(window);
  return window.APP_CONFIG;
}
const CONFIG = appConfig();
const BUILD_CONFIG = JSON.parse(readFileSync(join(ROOT, 'bouw.config.json'), 'utf8'));
const SLUG = CONFIG.SLUG;
if (!/^[a-z0-9]+$/.test(SLUG)) fail(`config.js bevat geen geldige slug: "${SLUG}"`);

// Wat niet bij de app hoort en dus in geen enkel bouwdoel komt.
const NOT_IN_APP = new Set([
  '.git', '.github', '.gitignore', '.template', '.test-build', '_site', 'dist', 'android', 'node_modules',
  'docs', 'store', 'tests', 'tools', 'test-results', 'playwright-report', 'platform',
  'package.json', 'package-lock.json', 'playwright.config.js', 'capacitor.config.json', 'bouw.config.json',
]);
const ONLY_WITH_SERVICE_WORKER = ['sw.js', 'manifest.webmanifest'];

function outDir(standard) {
  const out = resolve(outArg || join(ROOT, 'dist', standard));
  if (out === ROOT || ROOT.startsWith(out + sep)) fail('de uitvoermap mag niet de app-map zelf zijn');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  return out;
}
function copyTree(from, to, skipTop) {
  for (const name of readdirSync(from)) {
    const src = join(from, name), dst = join(to, name);
    if (from === ROOT && (skipTop(name) || name.endsWith('.md'))) continue;
    if (statSync(src).isDirectory()) { mkdirSync(dst, { recursive: true }); copyTree(src, dst, skipTop); } else copyFileSync(src, dst);
  }
}
function allFiles(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) allFiles(full, base, out); else out.push(relative(base, full).split(sep).join('/'));
  }
  return out.sort();
}

// De pagina's van de app: de laag van dit bouwdoel erin, en zo nodig noindex.
function finishPages(out, { platform, extraScripts = [], noindex, serviceWorker }) {
  mkdirSync(join(out, 'platform'), { recursive: true });
  copyFileSync(join(ROOT, 'platform', `${platform}.js`), join(out, 'platform', `${platform}.js`));
  let pages = 0;
  for (const file of allFiles(out).filter(f => f.endsWith('.html'))) {
    let html = readFileSync(join(out, file), 'utf8');
    const prefix = '../'.repeat(file.split('/').length - 1);
    const tag = `<script src="${prefix}platform/web.js"></script>`;
    if (html.includes(tag)) {
      const scripts = [`${prefix}platform/${platform}.js`, ...extraScripts.map(s => prefix + s)];
      html = html.replace(tag, scripts.map(s => `<script src="${s}"></script>`).join('\n  '));
      pages++;
    }
    if (!serviceWorker) html = html.replace(/^[ \t]*<link rel="manifest"[^>]*>\r?\n/m, '');
    if (noindex && !/<meta name="robots"/.test(html)) {
      html = html.replace(/(<meta name="viewport"[^>]*>\r?\n)/, `$1  <meta name="robots" content="noindex, nofollow" />\n`);
      if (!/<meta name="robots"/.test(html)) fail(`${file}: geen plek gevonden voor de noindex-regel`);
    }
    writeFileSync(join(out, file), html);
  }
  if (!pages) fail('geen enkele pagina laadt platform/web.js; de laag van het bouwdoel is nergens gezet');
  if (!serviceWorker) for (const name of ONLY_WITH_SERVICE_WORKER) rmSync(join(out, name), { force: true });
  if (noindex) writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
}
function mustExist(out, files) {
  for (const f of files) if (!existsSync(join(out, f))) fail(`ontbreekt in ${relative(ROOT, out)}: ${f}`);
}

// ---------- zip (zonder extra pakketten) ----------
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function zip(dir, target) {
  const parts = [], central = [];
  let offset = 0;
  for (const name of allFiles(dir)) {
    const data = readFileSync(join(dir, name));
    const packed = deflateRawSync(data, { level: 9 });
    const nameBuf = Buffer.from(name, 'utf8');
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6); head.writeUInt16LE(8, 8);
    head.writeUInt16LE(0, 10); head.writeUInt16LE(0x21, 12);                 // vaste tijd en datum: dezelfde bestanden geven dezelfde zip
    head.writeUInt32LE(crc32(data), 14); head.writeUInt32LE(packed.length, 18); head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(nameBuf.length, 26); head.writeUInt16LE(0, 28);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6);
    head.copy(entry, 8, 6, 30);                                              // vlaggen t/m lengte van de naam
    entry.writeUInt32LE(offset, 42);
    parts.push(head, nameBuf, packed);
    central.push(entry, nameBuf);
    offset += 30 + nameBuf.length + packed.length;
  }
  const centralSize = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
  writeFileSync(target, Buffer.concat([...parts, ...central, end]));
}

// ---------- de bouwdoelen ----------
function bouwAndroid() {
  const out = outDir('android');
  copyTree(ROOT, out, name => NOT_IN_APP.has(name) || name === '.nojekyll');
  finishPages(out, { platform: 'android', noindex: false, serviceWorker: false });
  mustExist(out, ['index.html', 'privacy.html', 'delete.html', 'platform/android.js']);
  console.log(`Android: ${relative(process.cwd(), out)} (${allFiles(out).length} bestanden, zonder service worker). Daarna: npx cap sync android`);
}

function bouwPortal(naam) {
  if (!/^[a-z0-9-]+$/.test(naam || '')) fail('geef de naam van de portal in kleine letters: node tools/bouw.mjs portal <naam>');
  const out = outDir(`portal-${naam}`);
  copyTree(ROOT, out, name => NOT_IN_APP.has(name) || name === '.nojekyll');
  // De SDK-laag van deze portal, als die er is (alleen na akkoord van Jenn; zie docs/webportals.md).
  const extra = [];
  if (existsSync(join(ROOT, 'platform', 'portals', `${naam}.js`))) {
    mkdirSync(join(out, 'platform', 'portals'), { recursive: true });
    copyFileSync(join(ROOT, 'platform', 'portals', `${naam}.js`), join(out, 'platform', 'portals', `${naam}.js`));
    extra.push(`platform/portals/${naam}.js`);
  }
  finishPages(out, { platform: 'portal', extraScripts: extra, noindex: false, serviceWorker: false });
  mustExist(out, ['index.html', 'platform/portal.js']);
  const target = out + '.zip';
  zip(out, target);
  console.log(`Portal ${naam}: ${relative(process.cwd(), target)} (${allFiles(out).length} bestanden, ${Math.round(statSync(target).size / 1024)} kB${extra.length ? ', met SDK-laag' : ', zonder SDK'}).`);
}

function bouwWebOfTest(soort, commit = '', repo = '') {
  const isTest = soort === 'test';
  const out = outDir(soort);
  copyTree(ROOT, out, name => NOT_IN_APP.has(name));
  finishPages(out, { platform: 'web', noindex: isTest || CONFIG.VINDBAAR !== true, serviceWorker: true });
  writeFileSync(join(out, '.nojekyll'), '');
  writeFileSync(join(out, 'version.json'), JSON.stringify({ doel: soort, repo, commit, built: new Date().toISOString() }) + '\n');
  if (isTest) {
    const build = commit.slice(0, 7);
    if (build) {     // elke push naar test is een nieuwe versie, zonder CACHE_VERSION aan te raken
      const sw = readFileSync(join(out, 'sw.js'), 'utf8');
      const stamped = sw.replace("const BUILD = '';", `const BUILD = '${build}';`);
      if (stamped === sw) fail('sw.js: de regel "const BUILD = \'\';" is niet gevonden');
      writeFileSync(join(out, 'sw.js'), stamped);
    }
    // Eigen naam, zodat een geïnstalleerde testversie herkenbaar is op het startscherm.
    const manifestFile = join(out, 'manifest.webmanifest');
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    manifest.name = 'TEST – ' + manifest.name;
    manifest.short_name = ('TEST ' + manifest.short_name).slice(0, 12);
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  } else {
    const domein = BUILD_CONFIG.web && BUILD_CONFIG.web.domein;
    if (!/^[a-z0-9]+\.studiosedillo\.com$/.test(domein || '')) fail(`bouw.config.json: web.domein is geen geldig adres: "${domein}"`);
    writeFileSync(join(out, 'CNAME'), domein + '\n');
  }
  mustExist(out, ['index.html', 'sw.js', 'manifest.webmanifest', 'privacy.html', 'delete.html', 'platform/web.js']);
  console.log(`${isTest ? 'Testversie' : 'Web'}: ${relative(process.cwd(), out) || out} (${allFiles(out).length} bestanden${isTest ? ', noindex' : ''}).`);
}

function bouwHoofdsite() {
  // De map op de hoofdsite heet naar de app (de repo-naam), bijvoorbeeld studiosedillo.com/sudoku-kids/.
  const pad = BUILD_CONFIG.hoofdsite && BUILD_CONFIG.hoofdsite.pad;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(pad || '')) fail(`bouw.config.json: hoofdsite.pad moet kleine letters, cijfers en streepjes zijn: "${pad}"`);
  const out = join(outDir('hoofdsite'), pad);
  mkdirSync(out, { recursive: true });
  const NEEDED = new Set(['privacy.html', 'delete.html', 'verwijderen.html', 'redirect.js', 'style.css', 'config.js', 'storage.js', 'common.js', 'pages.js', 'i18n', 'icons']);
  copyTree(ROOT, out, name => !NEEDED.has(name));
  for (const f of allFiles(join(out, 'icons'))) if (f !== 'icon-192.png') rmSync(join(out, 'icons', f));
  finishPages(out, { platform: 'hoofdsite', noindex: CONFIG.VINDBAAR !== true, serviceWorker: false });
  rmSync(join(out, 'robots.txt'), { force: true });      // een robots.txt in een submap doet niets; de noindex-regel staat in de pagina's
  mustExist(out, ['privacy.html', 'delete.html', 'platform/hoofdsite.js']);
  console.log(`Hoofdsite: ${relative(process.cwd(), out)} -> studiosedillo.com/${pad}/privacy en /${pad}/delete`);
}

// De testversie komt van de repo <naam>-test; de webversie van <naam>, alleen na "lanceren web".
function publiceren(repo) {
  if (/-test$/.test(repo || '')) return 'test';
  return BUILD_CONFIG.web && BUILD_CONFIG.web.live === true ? 'web' : null;
}

switch (doel) {
  case 'android': bouwAndroid(); break;
  case 'portal': bouwPortal(rest[0]); break;
  case 'test': bouwWebOfTest('test', rest[0] || ''); break;
  case 'web': bouwWebOfTest('web'); break;
  case 'hoofdsite': bouwHoofdsite(); break;
  case 'moet-publiceren': console.log(publiceren(rest[0]) ? 'true' : 'false'); break;
  case 'pages': {
    const soort = publiceren(rest[0]);
    if (!soort) { console.log(`Niets te publiceren voor ${rest[0]}: geen test-repo en web.live staat uit.`); break; }
    if (!outArg) outArg = join(ROOT, '_site');
    bouwWebOfTest(soort, rest[1] || '', rest[0]);
    break;
  }
  default:
    console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(3, 13).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(2);
}
