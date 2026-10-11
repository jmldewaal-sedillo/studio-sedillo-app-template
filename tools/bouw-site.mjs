// Zet klaar wat naar GitHub Pages gaat. Draait in de deploy-workflow, voor de live-repo en de
// test-repo, en zorgt dat elk zijn eigen adres krijgt:
//
//   repo <naam>        -> het adres uit het bestand CNAME            (live)
//   repo <naam>-test   -> "test-" + dat adres, een eigen cache per commit en "TEST" in de naam
//
// Gebruik: node tools/bouw-site.mjs <uitvoermap> <repo-naam> [commit-id]
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const [outArg, repo, commit = ''] = process.argv.slice(2);
if (!outArg || !repo) { console.error('Gebruik: node tools/bouw-site.mjs <uitvoermap> <repo-naam> [commit-id]'); process.exit(1); }
const out = resolve(outArg);
if (out === ROOT || ROOT.startsWith(out + sep)) { console.error('De uitvoermap mag niet de app-map zelf zijn.'); process.exit(1); }

// Wat niet bij de app hoort en dus niet op de site komt.
const NOT_ON_SITE = new Set([
  '.git', '.github', '.gitignore', '.template', '.test-build', '_site', 'node_modules',
  'docs', 'store', 'tests', 'tools', 'twa', 'test-results', 'playwright-report',
  'package.json', 'package-lock.json', 'playwright.config.js',
]);

const liveDomain = readFileSync(join(ROOT, 'CNAME'), 'utf8').trim();
if (!/^[a-z0-9]+\.studiosedillo\.com$/.test(liveDomain)) { console.error(`CNAME bevat geen geldig adres: "${liveDomain}"`); process.exit(1); }
const isTest = /-test$/.test(repo);
const domain = (isTest ? 'test-' : '') + liveDomain;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// Zelf kopiëren: de uitvoermap mag in de app-map staan (_site), en dat kan cpSync niet.
(function copy(from, to) {
  for (const name of readdirSync(from)) {
    const src = join(from, name), dst = join(to, name);
    const top = from === ROOT;
    if (resolve(src) === out || (top && (NOT_ON_SITE.has(name) || name.endsWith('.md')))) continue;
    if (statSync(src).isDirectory()) { mkdirSync(dst, { recursive: true }); copy(src, dst); } else copyFileSync(src, dst);
  }
})(ROOT, out);

writeFileSync(join(out, 'CNAME'), domain + '\n');
writeFileSync(join(out, '.nojekyll'), '');     // anders slaat GitHub Pages de map .well-known over
writeFileSync(join(out, 'version.json'), JSON.stringify({ repo, commit, built: new Date().toISOString() }) + '\n');

if (isTest) {
  const build = commit.slice(0, 7);
  if (build) {
    const sw = readFileSync(join(out, 'sw.js'), 'utf8');
    const stamped = sw.replace("const BUILD = '';", `const BUILD = '${build}';`);
    if (stamped === sw) { console.error('sw.js: de regel "const BUILD = \'\';" is niet gevonden.'); process.exit(1); }
    writeFileSync(join(out, 'sw.js'), stamped);
  }
  // Eigen naam, zodat een geïnstalleerde testversie herkenbaar is op het startscherm.
  const manifestFile = join(out, 'manifest.webmanifest');
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  manifest.name = 'TEST – ' + manifest.name;
  manifest.short_name = ('TEST ' + manifest.short_name).slice(0, 12);
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
}

for (const must of ['index.html', 'sw.js', 'manifest.webmanifest', 'privacy.html', 'delete.html', join('.well-known', 'assetlinks.json')]) {
  if (!existsSync(join(out, must))) { console.error(`Ontbreekt in de site: ${must}`); process.exit(1); }
}
console.log(`Site klaargezet in ${relative(process.cwd(), out) || out} voor ${domain}${isTest ? ' (testversie)' : ''}`);
