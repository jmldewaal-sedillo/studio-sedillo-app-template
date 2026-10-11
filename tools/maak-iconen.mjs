// Maakt de tijdelijke iconen (een witte ring op de themakleur), zonder extra pakketten.
// Vervang ze door het echte icoon zodra dat er is; de bestandsnamen en formaten blijven gelijk.
// Gebruik: node tools/maak-iconen.mjs "#2B2140" [map van de app]
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const color = process.argv[2] || '#2B2140';
const root = resolve(process.argv[3] || fileURLToPath(new URL('..', import.meta.url)));
const hex = /^#([0-9a-f]{6})$/i.exec(color);
if (!hex) { console.error(`Geen geldige kleur: ${color} (verwacht #rrggbb)`); process.exit(1); }
const RGB = [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16));

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc(body), 8 + data.length);
  return out;
}

// maskable: de kleur loopt door tot de rand (het toestel snijdt zelf de vorm uit) en de
// tekening blijft binnen de veilige zone. Anders: afgeronde hoeken, daarbuiten doorzichtig.
function png(size, maskable) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const mid = (size - 1) / 2;
  const outer = size * (maskable ? 0.24 : 0.30), inner = outer * 0.58, corner = size * 0.18;
  const cover = d => Math.max(0, Math.min(1, 0.5 - d));          // 1 binnen de vorm, 0 erbuiten, zachte rand
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(x - mid, y - mid);
      const ring = cover(r - outer) * (1 - cover(r - inner));
      const qx = Math.abs(x - mid) - (size / 2 - corner), qy = Math.abs(y - mid) - (size / 2 - corner);
      const alpha = maskable ? 1 : cover(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - corner);
      const p = row + 1 + x * 4;
      for (let i = 0; i < 3; i++) raw[p + i] = Math.round(RGB[i] + (255 - RGB[i]) * ring);
      raw[p + 3] = Math.round(alpha * 255);
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0); head.writeUInt32BE(size, 4);
  head[8] = 8; head[9] = 6;                                       // 8 bits, RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const files = [
  ['icons/icon-192.png', 192, false],
  ['icons/icon-512.png', 512, false],
  ['icons/icon-maskable-512.png', 512, true],
  ['store/icon-512.png', 512, true],
];
for (const [name, size, maskable] of files) {
  mkdirSync(join(root, name, '..'), { recursive: true });
  writeFileSync(join(root, name), png(size, maskable));
}
console.log(`Iconen gemaakt in ${color}: ${files.map(f => f[0]).join(', ')}`);
