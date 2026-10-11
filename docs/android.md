# Android-app bouwen met Capacitor – {{APP_NAAM}}

De Android-app is het bouwdoel **android** (`Apps/CLAUDE.md`, sectie 11, punt 2): een
Capacitor-app met **alle bestanden in de app**. Hij werkt zonder internet en heeft geen
service worker. Een update van de app is dus een nieuwe versie in de Play Store.

| | |
|---|---|
| Package | `com.studiosedillo.{{SLUG}}` (kan na de eerste upload nooit meer veranderen) |
| Instellingen | `capacitor.config.json` |
| Bestanden van de app | `dist/android/`, gemaakt door `npm run bouw:android` |
| Laag voor dit bouwdoel | `platform/android.js` (terugknop; advertenties staan uit) |
| Android-project | `android/` (ontstaat bij de eerste keer, daarna in Git) |

## Eenmalig

Nodig: Node 22 of nieuwer, Android Studio (brengt de JDK en de Android-SDK mee).

```bash
npm install
npm run android:init      # bouwt dist/android en maakt de map android/
git add android && git commit -m "Android-project (Capacitor)"
```

Controleer daarna in `android/app/src/main/AndroidManifest.xml` dat er geen permissie staat
die de app niet nodig heeft: geen `com.google.android.gms.permission.AD_ID`, geen locatie,
geen meldingen. `INTERNET` zet Capacitor er standaard in; de app gebruikt hem niet.

## Na elke wijziging aan de app

```bash
npm test
npm run android:sync      # bouwt dist/android opnieuw en zet het in het Android-project
npm run android:open      # opent Android Studio: daar draaien op een toestel of bouwen
```

Verhoog voor elke upload `versionCode` (en `versionName`) in `android/app/build.gradle`.

## De sleutels (Jenn)

| | Upload key | App signing key |
|---|---|---|
| Wie heeft hem | **Jenn** (bestand `android.keystore` + wachtwoord) | **Google** (Play App Signing) |
| Waarvoor | Bewijst aan Google dat een upload van jou komt | Ondertekent de app die gebruikers installeren |
| Kwijt? | Oplosbaar: in Play Console een reset aanvragen met een nieuwe sleutel | Kan niet kwijtraken; Google bewaart hem |

1. Maak de upload key in Android Studio (**Build → Generate Signed App Bundle → Create new**),
   of met:
   `keytool -genkeypair -v -keystore android.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000`
2. Bewaar het bestand en de wachtwoorden op twee plekken, los van deze repo. **Nooit** in Git,
   e-mail of een chat; `.gitignore` sluit `*.keystore` en `*.jks` uit.
3. Geef de sleutel of het wachtwoord niet aan Claude Code. Het ondertekenen doe je zelf.

## Uitbrengen

1. In Android Studio: **Build → Generate Signed App Bundle** → `.aab`.
2. Upload naar **Interne test** in de Play Console en probeer hem op je telefoon.
3. Daarna de gesloten test (12 testers, 14 dagen) en productie: `docs/publiceren.md`.

**Controleer vóór het uploaden:**

- [ ] `targetSdkVersion` voldoet aan de eis van dat moment (Google verhoogt hem elk jaar in
      augustus; werk dan Capacitor bij).
- [ ] De app start in vliegtuigmodus.
- [ ] De terugknop gaat een stap terug en sluit de app op het startscherm.
- [ ] Geen overbodige permissies (zie boven).

## Opslag

De app bewaart in localStorage van de WebView, met de prefix `{{SLUG}}.`, via `storage.js`.
Dat blijft staan tot de gebruiker de app verwijdert of de opslag wist. Wil een app later iets
anders (bijvoorbeeld de plug-in Preferences), dan gaat dat via `storage.js` en `Platform`,
met een migratie van de bestaande sleutels en een test die dat bewijst.

## Advertenties

Staan uit (`ADVERTENTIES: false` in `config.js`; `Platform.advertenties.beschikbaar` is
`false`). AdMob komt er alleen in via de Capacitor-plug-in, na akkoord van Jenn, nooit in een
kinder-app, en pas nadat het zakelijke postadres geregeld is (`Apps/CLAUDE.md`, sectie 11,
punt 5). Dan eerst de privacyverklaring, `docs/privacy-audit.md` en het Data safety-formulier
bijwerken.
