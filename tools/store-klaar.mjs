// Vóór het uploaden naar Google Play of de App Store (docs/publiceren.md):
//   node tools/store-klaar.mjs
// Faalt als een store-tekst nog "INVULLEN"/"TO DO" bevat, iets belooft dat we niet kunnen bewijzen
// ("gratis", "beste", "#1", sterren, reviews), emoji bevat, of zegt "geen advertenties" / "geen
// aankopen" terwijl die in config.js aan staan.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { controleerStore, storeBestanden } from './store-controle.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const problems = controleerStore(ROOT, { klaar: true });
if (problems.length) {
  console.error('Store-teksten nog niet klaar:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`Store-teksten in orde (${storeBestanden(ROOT).length} bestanden).`);
