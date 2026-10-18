# Lanceren – checklist voor {{APP_NAAM}}

Begin hier. Dit is de weg van een nieuwe app naar de Play Store, in de volgorde waarin het
gebeurt. De vaste opzet staat in `Apps/CLAUDE.md`, sectie 11 ("App-structuur Studio
Sedillo"); deze lijst past hem toe op deze app. Vink af, en zet de datum in het logboek van
`ROADMAP.md`.

Volgorde van de bouwdoelen: **eerst de app** (Android in de Play Store; iOS zodra het Apple
Developer-account er is), dan **webportals**, en de **webversie** pas
als Jenn "lanceren web" zegt.

## 1. Besluiten (Jenn)

- [ ] Doel, doelgroep en toon staan in `CLAUDE.md`.
- [ ] Kinder-app? Zo ja: `KINDER_APP: true` in `config.js`, **geen advertenties en geen
      aankopen**, en het Families-beleid geldt.
- [ ] Geld verdienen? Advertenties (AdMob) of aankopen kunnen pas nadat het zakelijke
      postadres bij de KvK is vastgelegd en het bezoekadres is afgeschermd. Tot dan blijft
      `ADVERTENTIES` in `config.js` op `false`.
- [ ] De slug `{{SLUG}}` en de package-naam `com.studiosedillo.{{SLUG}}` kloppen. Na de
      eerste upload naar de Play Store kunnen ze niet meer veranderen.

## 2. De app bouwen

- [ ] De spelcode staat los van het bouwdoel: alles wat per bouwdoel verschilt gaat via
      `Platform` (`platform/*.js`), nooit rechtstreeks.
- [ ] Alle opslag via `storage.js`, elke sleutel in `docs/privacy-audit.md`.
- [ ] Elke tekst in elke taal in `i18n/`.
- [ ] Geen verzoeken naar buiten, geen tracking, geen analytics (de tests bewaken dat).
- [ ] Alles van buiten staat in `docs/credits.md`, met licentie.
- [ ] `npm test` is groen.

## 3. Testen

- [ ] Testversie: `git push test HEAD:main` → https://jmldewaal-sedillo.github.io/{{REPO}}-test/
      (noindex, nergens naar gelinkt). Jenn loopt hem na op haar telefoon.
- [ ] Na akkoord van Jenn: mergen naar `main`.

## 4. De app: Android en iOS (`docs/app.md`)

- [ ] `npm run app:init` gedaan en `android/` en `ios/` gecommit; de workflow `app.yml` is groen
      (test-APK en iOS-simulatorbuild).
- [ ] Jenn heeft de upload key gemaakt en op twee plekken bewaard (nooit in Git).
- [ ] De app start in vliegtuigmodus en de terugknop werkt.
- [ ] Geen permissies die de app niet nodig heeft (geen `AD_ID`, locatie of meldingen).
- [ ] `.aab` geüpload naar de **interne test** in de Play Console; Jenn heeft hem geprobeerd.

## 5. Hoofdsite: de URL's voor de Play Store

Pas bij de lancering, na akkoord van Jenn (dit gaat live op studiosedillo.com).

- [ ] `npm run bouw:hoofdsite` en daarna, vanuit `Apps/`:
      `tools/hoofdsite-toevoegen.sh --dry-run --app {{REPO}} --paginas {{REPO}}/dist/hoofdsite/{{REPO}}`
      en dan echt.
- [ ] https://studiosedillo.com/{{REPO}}/privacy en https://studiosedillo.com/{{REPO}}/delete
      werken, in EN en NL (plus de grote talen van de app).
- [ ] Controleren dat het EU-U.S. Data Privacy Framework nog geldt (de tekst gaat daarvan uit).

## 6. Play Console (`docs/publiceren.md`)

- [ ] App-content: privacybeleid-URL, advertenties, app-toegang, doelgroep, Data safety, IARC.
- [ ] Store-pagina gevuld uit `store/`.
- [ ] **Gesloten test: 12 testers, 14 dagen aaneengesloten** (eis voor een nieuw persoonlijk
      ontwikkelaarsaccount). Feedback bijhouden.
- [ ] Productietoegang aanvragen en de productierelease doen.
- [ ] Daarna pas: de app bij de spellen op studiosedillo.com.

## 7. Webportals (`docs/webportals.md`) – na Android

- [ ] Per portal de voorwaarden over exclusiviteit en advertenties gelezen en aan Jenn
      voorgelegd. **Niets inbouwen zonder akkoord**, ook geen SDK.
- [ ] Na akkoord: `platform/portals/<naam>.js`, dan `node tools/bouw.mjs portal <naam>`.

## 8. Webversie – alleen als Jenn "lanceren web" zegt

- [ ] `Apps/CLAUDE.md`, sectie 4: `web.live` aan, eerst de site, dan het DNS-record, dan
      `tools/controleer-domein.sh {{SLUG}}`.
- [ ] `VINDBAAR` in `config.js` blijft op `false` tot Jenn zegt dat de app gevonden mag worden.
