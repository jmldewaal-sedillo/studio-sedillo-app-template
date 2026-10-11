// Statische server om de app lokaal te bekijken en voor de tests.
// Doet wat GitHub Pages ook doet: /privacy geeft privacy.html, en mappen die met een punt
// beginnen (.well-known) worden gewoon geserveerd.
// Gebruik: node tools/serve.mjs [poort] [map] [--strict]
// Is de poort bezet, dan neemt hij de eerstvolgende vrije. Met --strict (de tests) stopt hij dan
// met een fout, omdat de tests een vast adres verwachten.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const STRICT = process.argv.includes('--strict');
const PORT = Number(ARGS[0] || process.env.PORT || 5000);
const ROOT = resolve(ARGS[1] || fileURLToPath(new URL('..', import.meta.url)));
const MAX_TRIES = 20;   // zoveel poorten na de gevraagde proberen

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.txt': 'text/plain; charset=utf-8',
};

async function find(path) {
  // Volgorde van GitHub Pages: het bestand zelf, dan <pad>.html, dan <map>/index.html.
  for (const candidate of [path, path + '.html', join(path, 'index.html')]) {
    try { if ((await stat(candidate)).isFile()) return candidate; } catch { /* volgende */ }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  let path;
  try { path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); } catch { res.writeHead(400); return res.end(); }
  if (/(^|[\\/])(node_modules|\.git)([\\/]|$)/.test(path)) { res.writeHead(403); return res.end(); }
  const wanted = join(ROOT, path);
  if (wanted !== ROOT && !wanted.startsWith(ROOT + sep)) { res.writeHead(403); return res.end(); }
  const file = await find(wanted.endsWith(sep) ? join(wanted, 'index.html') : wanted);
  if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(await readFile(file));
});

let port = PORT;
server.on('error', err => {
  if (err.code !== 'EADDRINUSE') throw err;
  if (STRICT || port >= PORT + MAX_TRIES) {
    console.error(STRICT ? `Poort ${port} is bezet (--strict: geen andere poort gekozen).`
                         : `Geen vrije poort gevonden tussen ${PORT} en ${port}.`);
    process.exit(1);
  }
  server.listen(++port);
});
server.on('listening', () => {
  if (port !== PORT) console.log(`\nPoort ${PORT} is bezet; de server draait op poort ${port}.`);
  console.log(`\n  De app draait op:\n\n    http://localhost:${port}/\n\n  Map: ${ROOT}\n  Stoppen: Ctrl+C\n`);
});
server.listen(port);
