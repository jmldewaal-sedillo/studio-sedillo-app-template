// Zet ITSAppUsesNonExemptEncryption = false in ios/App/App/Info.plist (Apps/CLAUDE.md, sectie 11, punt 8).
// De app gebruikt geen eigen versleuteling; zo stelt App Store Connect de exportvraag niet bij elke build.
// Draait na `cap add ios` (npm run app:init) en mag vaker draaien: staat de sleutel er al, dan verandert er niets.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const pad = 'ios/App/App/Info.plist';
if (!existsSync(pad)) {
  console.log(`${pad} bestaat nog niet; eerst npm run app:init.`);
  process.exit(0);
}
const plist = readFileSync(pad, 'utf8');
if (plist.includes('<key>ITSAppUsesNonExemptEncryption</key>')) {
  console.log('ITSAppUsesNonExemptEncryption staat er al.');
  process.exit(0);
}
const nieuw = plist.replace(/<dict>/, '<dict>\n\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>');
if (nieuw === plist) {
  console.error(`Geen <dict> gevonden in ${pad}.`);
  process.exit(1);
}
writeFileSync(pad, nieuw);
console.log('ITSAppUsesNonExemptEncryption = false toegevoegd.');
