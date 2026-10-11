// Vult de placeholders van de template in. Wordt gebruikt door Apps/tools/nieuwe-app.sh en
// door de tests van de template zelf (die een ingevulde kopie maken en dáár op testen).
// Na het invullen in de app-map zelf ruimt dit script de template-bestanden op, zichzelf incluis.
//
//   node tools/vul-in.mjs --slug mijnapp --repo mijn-app --naam "Mijn App" --kort "MijnApp" --kleur "#2B6CB0"
//   node tools/vul-in.mjs --kopie <map> [waarden]     maakt eerst een kopie en vult die in;
//                                                      waarden die ontbreken krijgen een testwaarde
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OPEN = '{' + '{', CLOSE = '}' + '}';            // zo staat er in dit bestand zelf geen placeholder
const SKIP_DIRS = new Set(['.git', 'node_modules', 'test-results', 'playwright-report', '.test-build', '_site']);
const TEXT_EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.md', '.txt', '.yml', '.yaml', '.sh', '.svg', '.xml']);
const TEXT_NAMES = new Set(['CNAME', '.gitignore']);
const ONLY_IN_TEMPLATE = ['.template', 'TEMPLATE.md', 'tools/vul-in.mjs'];
// Lastige tekens in de testnaam, zodat de tests ook het veilig invullen bewijzen.
const TEST_VALUES = { slug: 'demoapp', repo: 'demo-app', naam: 'Demo & Co\'s "App"', kort: 'Demo', kleur: '#2B6CB0' };

function fail(message) { console.error('vul-in: ' + message); process.exit(1); }

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  if (!key.startsWith('--') || process.argv[i + 1] === undefined) fail(`onbekend argument: ${key}`);
  args[key.slice(2)] = process.argv[i + 1];
}
if (args.kopie) for (const k of Object.keys(TEST_VALUES)) if (args[k] === undefined) args[k] = TEST_VALUES[k];
for (const k of Object.keys(TEST_VALUES)) if (!args[k]) fail(`--${k} ontbreekt`);
if (!/^[a-z0-9]+$/.test(args.slug)) fail('de slug mag alleen kleine letters en cijfers bevatten');
if (!/^[A-Za-z0-9._-]+$/.test(args.repo)) fail('de repo-naam mag alleen letters, cijfers, punt, streepje en underscore bevatten');
if (!/^#[0-9a-fA-F]{6}$/.test(args.kleur)) fail('de themakleur moet de vorm #rrggbb hebben');
if (/[\r\n]/.test(args.naam + args.kort)) fail('een naam mag geen regeleinde bevatten');
const today = new Date();
const datum = args.datum || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) fail('--datum moet de vorm JJJJ-MM-DD hebben');

const VALUES = { APP_NAAM: args.naam, KORTE_NAAM: args.kort, SLUG: args.slug, REPO: args.repo, THEMA_KLEUR: args.kleur, DATUM: datum };

// Een naam kan tekens bevatten die in HTML, JSON of JavaScript iets betekenen.
const ESCAPE = {
  html: v => v.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
  json: v => JSON.stringify(v).slice(1, -1),
  js: v => JSON.stringify(v).slice(1, -1).replace(/'/g, "\\'"),
  raw: v => v,
};
function kind(file) {
  const ext = extname(file);
  if (ext === '.html' || ext === '.svg' || ext === '.xml') return 'html';
  if (ext === '.json' || ext === '.webmanifest') return 'json';
  if (ext === '.js' || ext === '.mjs') return 'js';
  return 'raw';
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
}

let target = SOURCE;
if (args.kopie) {
  target = resolve(args.kopie);
  if (target === SOURCE || SOURCE.startsWith(target + sep)) fail('--kopie mag niet de template-map zelf zijn');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  // Zelf kopiëren: de kopie mag in de template-map staan (.test-build), en dat kan cpSync niet.
  (function copy(from, to) {
    for (const name of readdirSync(from)) {
      const src = join(from, name), dst = join(to, name);
      if (SKIP_DIRS.has(name) || resolve(src) === target || relative(SOURCE, src) === join('tests', 'screenshots')) continue;
      if (statSync(src).isDirectory()) { mkdirSync(dst, { recursive: true }); copy(src, dst); } else copyFileSync(src, dst);
    }
  })(SOURCE, target);
}
if (!existsSync(join(target, '.template'))) fail(`${target} is geen template (het bestand .template ontbreekt): hier is al ingevuld`);

const pattern = new RegExp('\\{\\{([A-Z_]+)\\}\\}', 'g');
let filled = 0;
for (const file of walk(target)) {
  if (!TEXT_EXT.has(extname(file)) && !TEXT_NAMES.has(basename(file))) continue;
  const before = readFileSync(file, 'utf8');
  const escape = ESCAPE[kind(file)];
  const after = before.replace(pattern, (whole, name) => {
    if (!(name in VALUES)) fail(`onbekende placeholder ${OPEN}${name}${CLOSE} in ${relative(target, file)}`);
    return escape(VALUES[name]);
  });
  if (after !== before) { writeFileSync(file, after); filled++; }
}

execFileSync(process.execPath, [join(target, 'tools', 'maak-iconen.mjs'), args.kleur, target], { stdio: 'ignore' });
for (const name of ONLY_IN_TEMPLATE) rmSync(join(target, name), { force: true });

console.log(`Ingevuld in ${filled} bestanden (${relative(process.cwd(), target) || '.'}): ${Object.entries(VALUES).map(([k, v]) => `${k}=${v}`).join(', ')}`);
