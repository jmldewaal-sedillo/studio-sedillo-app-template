# De app bouwen: Android en iOS (Capacitor) – {{APP_NAAM}}

De app is het bouwdoel **app** (`Apps/CLAUDE.md`, sectie 11, punt 2): één set bestanden
(`dist/app/`) in twee Capacitor-apps, één voor Android en één voor iOS. Alle bestanden zitten
in de app. Hij werkt zonder internet en heeft geen service worker. Een update van de app is
dus een nieuwe versie in de Play Store of App Store.

| | |
|---|---|
| Package / bundle-ID | `com.studiosedillo.{{SLUG}}` (Android en iOS hetzelfde; kan na de eerste upload nooit meer veranderen) |
| Instellingen | `capacitor.config.json` |
| Bestanden van de app | `dist/app/`, gemaakt door `npm run bouw:app` (niet in Git) |
| Laag voor dit bouwdoel | `platform/app.js` (terugknop van Android; advertenties staan uit) |
| Android-project | `android/` (ontstaat bij `npm run app:init`, daarna in Git) |
| iOS-project | `ios/` (idem; Swift Package Manager, geen CocoaPods) |
| Workflow | `.github/workflows/app.yml`: test-APK en iOS-simulatorbuild bij elke push, zodra `android/` en `ios/` er zijn |

## Eenmalig

Nodig: Node 22 of nieuwer. Android Studio of Xcode is **niet** nodig: de workflow bouwt op
GitHub (Xcode draait alleen op een Mac; de macOS-runners van GitHub zijn gratis voor publieke
repo's).

```bash
npm install
npm run app:init          # bouwt dist/app en maakt de mappen android/ en ios/
git add android ios && git commit -m "App-projecten voor Android en iOS (Capacitor)"
```

Controleer daarna in `android/app/src/main/AndroidManifest.xml` dat er geen permissie staat
die de app niet nodig heeft: geen `com.google.android.gms.permission.AD_ID`, geen locatie,
geen meldingen. `INTERNET` zet Capacitor er standaard in; de app gebruikt hem niet.

Aanraders (zoals in The Flush Factor):
- Een eigen package-naam voor de test-APK, zodat hij naast de echte app kan staan: in
  `android/app/build.gradle` onder `buildTypes` een blok
  `debug { applicationIdSuffix ".test"; versionNameSuffix "-test" }`, en
  `android/app/src/debug/res/values/strings.xml` met `app_name` "TEST …".
- Icoon en opstartscherm maken met `@capacitor/assets` (zie "Icoon").

## Na elke wijziging aan de app

```bash
npm test
npm run app:sync          # bouwt dist/app opnieuw en zet het in android/ en ios/
```

Push; de workflow **App bouwen (Android en iOS)** maakt een test-APK (onder **Artifacts** van
de run, direct op een Android-telefoon te installeren) en bouwt de iOS-app voor de simulator.

Verhoog voor elke upload naar een store de versie:
- Android: `versionCode` (altijd +1) en `versionName` in `android/app/build.gradle`.
- iOS: `MARKETING_VERSION` en `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`.

## Android: de sleutels (Jenn)

| | Upload key | App signing key |
|---|---|---|
| Wie heeft hem | **Jenn** (bestand `android.keystore` + wachtwoord) | **Google** (Play App Signing) |
| Waarvoor | Bewijst aan Google dat een upload van jou komt | Ondertekent de app die gebruikers installeren |
| Kwijt? | Oplosbaar: in Play Console een reset aanvragen met een nieuwe sleutel | Kan niet kwijtraken; Google bewaart hem |

1. Maak de upload key met:
   `keytool -genkeypair -v -keystore android.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000`
2. Bewaar het bestand en de wachtwoorden op twee plekken, los van deze repo. **Nooit** in Git,
   e-mail of een chat; `.gitignore` sluit `*.keystore` en `*.jks` uit.
3. Geef de sleutel of het wachtwoord niet aan Claude Code. Het ondertekenen doe je zelf.

## Android: uitbrengen

1. Ondertekende `.aab` maken (Android Studio: **Build → Generate Signed App Bundle**; of later
   in de workflow met de sleutel als geheim in GitHub, alleen als Jenn dat wil).
2. Upload naar **Interne test** in de Play Console en probeer hem op je telefoon.
3. Daarna productie: `docs/publiceren.md`.

**Controleer vóór het uploaden:**

- [ ] `targetSdkVersion` voldoet aan de eis van dat moment (Google verhoogt hem elk jaar in
      augustus; werk dan Capacitor bij).
- [ ] De app start in vliegtuigmodus.
- [ ] De terugknop gaat een stap terug en sluit de app op het startscherm.
- [ ] Geen overbodige permissies (zie boven).

## iOS (App Store)

Het Apple Developer-account staat in `Apps/docs/apple-developer.md`. Tot dat er is, bewijst de
simulatorbuild in de workflow alleen dat het Xcode-project klopt.

Zodra het account er is:
1. In App Store Connect een app aanmaken met bundle-ID `com.studiosedillo.{{SLUG}}`.
2. Jenn maakt een **App Store Connect API-sleutel**; die komt als geheim in GitHub, nooit in de repo.
3. De workflow uitbreiden met ondertekenen en uploaden naar **TestFlight** (macOS-runner).
4. Testen via TestFlight op een iPhone of iPad; daarna indienen voor de App Store.

**Let op bij iOS:**
- Aankopen van digitale inhoud gaan in de App Store via Apple (in-app purchase).
- Inloggen met Google of Facebook betekent ook "Sign in with Apple" aanbieden.
- In App Store Connect de privacylabels invullen (zelfde antwoorden als Data safety).
- Kinderapps: de Kids-categorie heeft strengere regels (zie `Apps/docs/apple-developer.md`).

## Icoon

```bash
mkdir .cap-assets
cp <icoon 1024x1024, zonder transparantie>.png .cap-assets/icon-only.png
cp <logo voor het opstartscherm>.png .cap-assets/logo.png
cp .cap-assets/logo.png .cap-assets/logo-dark.png
npx @capacitor/assets@3.0.5 generate --assetPath .cap-assets --ios --android \
  --iconBackgroundColor '<kleur>' --iconBackgroundColorDark '<kleur>' \
  --splashBackgroundColor '<kleur>' --splashBackgroundColorDark '<kleur>' --logoSplashScale 0.3
rm -rf .cap-assets
```

## Opslag

De app bewaart in localStorage van de WebView, met de prefix `{{SLUG}}.`, via `storage.js`.
Dat blijft staan tot de gebruiker de app verwijdert of de opslag wist. Wil een app later iets
anders (bijvoorbeeld de plug-in Preferences), dan gaat dat via `storage.js` en `Platform`,
met een migratie van de bestaande sleutels en een test die dat bewijst.

## Advertenties

Staan uit (`ADVERTENTIES: false` in `config.js`; `Platform.advertenties.beschikbaar` is
`false`). AdMob komt er alleen in via de Capacitor-plug-in, na akkoord van Jenn, nooit in een
kinder-app (`Apps/CLAUDE.md`, sectie 11, punt 5). Dan eerst de privacyverklaring,
`docs/privacy-audit.md`, het Data safety-formulier en de privacylabels van Apple bijwerken.
