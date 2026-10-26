// Controle van store-teksten en de teksten in de app (Apps/CLAUDE.md, sectie 11, punt 8: geen misleiding).
// Gebruikt door tests/inhoud.spec.js (altijd) en tools/store-klaar.mjs (vóór uploaden naar een store).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Woorden die Google Play en Apple niet willen zien, of die we niet kunnen bewijzen.
export const VERBODEN = [
  /\b(gratis|free|freemium)\b/i,
  /\b(beste|best|leukste|most fun|greatest|ultieme?|ultimate|nummer (één|1)|number one|nr\.? ?1)\b/i,
  /#\s?1\b/,
  /\btop[ -]?\d+\b/i,
  /\b(award|prijswinnende?|award-winning|winnaar|winner)\b/i,
  /\b(gegarandeerd|guaranteed|bewezen|proven|wetenschappelijk|scientifically)\b/i,
  /\b(goedgekeurd door (docenten|leraren)|teacher[- ]approved|aanbevolen door|recommended by)\b/i,
  /\b(miljoen|million|\d+[.,]?\d*\s?(k|m)\+? (spelers|players|downloads))\b/i,
  /\b\d\s?(sterren|stars)\b/i,
  /[★☆⭐]/,
];
// Een citaat met een naam erachter lijkt op een review ("Geweldig!" – Lisa).
export const REVIEW = /["“„«][^"”»]{3,120}["”»]\s*[–—-]\s*\p{Lu}/u;
export const EMOJI = /\p{Extended_Pictographic}/u;
export const NOG_INVULLEN = /\b(INVULLEN|TO ?DO|TODO)\b|\{\{\s*[A-Z_]+\s*\}\}/;

const GEEN_ADVERTENTIES = /\b(geen advertenties|no advertising|no ads|reclamevrij|ad-free)\b/i;
const GEEN_AANKOPEN = /\b(geen (in-app-)?aankopen|no (in-app )?purchases|zonder aankopen)\b/i;

export function storeBestanden(root) {
  const dir = join(root, 'store');
  if (!existsSync(dir)) return [];
  const out = [];
  for (const taal of readdirSync(dir)) {
    const sub = join(dir, taal);
    if (!statSync(sub).isDirectory()) continue;
    for (const f of readdirSync(sub)) if (f.endsWith('.txt')) out.push(join(sub, f));
  }
  return out.sort();
}

function appConfig(root) {
  const window = {};
  new Function('window', readFileSync(join(root, 'config.js'), 'utf8'))(window);
  return window.APP_CONFIG;
}

/** Problemen in een tekst. `klaar` = ook placeholders als "INVULLEN" tellen. */
export function controleerTekst(text, { config, klaar = false } = {}) {
  const found = [];
  for (const re of VERBODEN) { const m = text.match(re); if (m) found.push(`verboden of onbewezen: "${m[0]}"`); }
  const review = text.match(REVIEW);
  if (review) found.push(`lijkt op een review of citaat: ${review[0].slice(0, 60)}`);
  const emoji = text.match(EMOJI);
  if (emoji) found.push(`emoji: ${emoji[0]}`);
  if (config && config.ADVERTENTIES === true && GEEN_ADVERTENTIES.test(text)) found.push('zegt "geen advertenties", maar ADVERTENTIES staat aan');
  if (config && config.AANKOPEN === true && GEEN_AANKOPEN.test(text)) found.push('zegt "geen aankopen", maar AANKOPEN staat aan');
  if (klaar) { const m = text.match(NOG_INVULLEN); if (m) found.push(`nog in te vullen: "${m[0]}"`); }
  return found;
}

/** Alle store-teksten van de app; geeft ['store/nl-NL/x.txt: probleem', ...]. */
export function controleerStore(root, { klaar = false } = {}) {
  const config = appConfig(root);
  const out = [];
  for (const file of storeBestanden(root)) {
    for (const p of controleerTekst(readFileSync(file, 'utf8'), { config, klaar })) out.push(`${file.slice(root.length + 1)}: ${p}`);
  }
  return out;
}
