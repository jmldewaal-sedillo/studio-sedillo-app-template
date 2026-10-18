# {{APP_NAAM}}

Een app van Studio Sedillo. Vanilla HTML, CSS en JavaScript: één codebase met drie
bouwdoelen (de app voor Android en iOS, webportals, en later eventueel web). De vaste opzet staat in
`Apps/CLAUDE.md`, sectie 11 ("App-structuur Studio Sedillo"); wat alleen voor deze app geldt
in `CLAUDE.md` hier. De planning en het logboek staan in `ROADMAP.md`, de weg naar de
lancering in `docs/lanceren.md`.

| | |
|---|---|
| Testversie | https://jmldewaal-sedillo.github.io/{{REPO}}-test/ (noindex, nergens naar gelinkt) |
| Privacyverklaring | https://studiosedillo.com/{{REPO}}/privacy (na de lancering) |
| Gegevens verwijderen | https://studiosedillo.com/{{REPO}}/delete (na de lancering) |
| Repo | https://github.com/jmldewaal-sedillo/{{REPO}} (remote `origin`) |
| Repo testversie | https://github.com/jmldewaal-sedillo/{{REPO}}-test (remote `test`) |
| Package / bundle-ID (Android en iOS) | `com.studiosedillo.{{SLUG}}` |
| Prefix opslag | `{{SLUG}}.` |

## De bouwdoelen

| Bouwdoel | Commando | Uitkomst |
|---|---|---|
| app (Android en iOS) | `npm run app:sync` | `dist/app/` in de projecten `android/` en `ios/` (Capacitor); test-APK en iOS-build via `app.yml`; zie `docs/app.md` |
| webportal | `node tools/bouw.mjs portal <naam>` | `dist/portal-<naam>.zip`; zie `docs/webportals.md` |
| testversie | `git push test HEAD:main` | de workflow publiceert op github.io |
| hoofdsite | `npm run bouw:hoofdsite` | de pagina's privacy en verwijderen voor studiosedillo.com |
| web (later) | `web.live` in `bouw.config.json` | PWA op {{SLUG}}.studiosedillo.com, pas na "lanceren web" |

De spelcode is voor elk bouwdoel dezelfde. Wat verschilt (service worker, links naar buiten,
terugknop, advertenties, SDK) zit in één bestand per bouwdoel in `platform/`.

## Lokaal bekijken

```bash
npm install          # één keer
npm run serve        # http://localhost:5000
```

## Testen

```bash
npx playwright install chromium    # één keer
npm test
```

De tests draaien op drie formaten (telefoon staand en liggend, tablet) en zetten
schermafbeeldingen in `tests/screenshots/`. Ze bouwen ook elk bouwdoel en openen het. Ze
controleren onder meer: laden zonder fouten en zonder verzoeken naar buiten, taal wisselen,
dat verwijderen geen enkele `{{SLUG}}.`-sleutel achterlaat, dat exporteren en importeren
dezelfde gegevens teruggeeft, dat de app en de portal-versie geen service worker hebben,
dat de portal-versie geen links naar buiten heeft, en dat de testversie noindex is.

## Werkwijze

testen = push naar test; live = merge naar `main` na akkoord van Jenn.

```bash
git push test HEAD:main      # -> de testversie op github.io
git push origin main         # alleen na akkoord van Jenn
```

De hooks tegen privégegevens staan aan na `tools/install-hooks.sh` (één keer per kopie van
de repo; `Apps/tools/nieuwe-app.sh` heeft dat al gedaan).

## Bestanden

| Bestand | Wat |
|---|---|
| `config.js` | Naam, slug, themakleur, `KINDER_APP`, `VINDBAAR`, `ADVERTENTIES`, talen, credits |
| `index.html`, `style.css`, `app.js` | Het startscherm en de instellingen |
| `storage.js` | Alle opslag, altijd met de prefix `{{SLUG}}.`; wissen, exporteren, importeren |
| `i18n/` | De teksten per taal, ook die van de privacyverklaring |
| `common.js`, `pages.js` | Taalkeuze en de pagina's privacy en verwijderen |
| `platform/` | De dunne laag per bouwdoel: `app.js`, `portal.js`, `web.js`, `hoofdsite.js` |
| `capacitor.config.json` | De app voor Android en iOS (Capacitor) |
| `bouw.config.json` | Portals, en of de webversie live staat |
| `sw.js`, `manifest.webmanifest` | Alleen bouwdoel web en de testversie: cache voor gebruik zonder internet |
| `privacy.html`, `delete.html`, `verwijderen.html` | Privacyverklaring, verwijderpagina, doorverwijzing |
| `docs/` | Lanceren, app (Android en iOS), portals, checklist voor Google Play, privacy-audit, credits |
| `store/` | Teksten en beeldmateriaal voor Google Play |
| `tools/` | `bouw.mjs` (de bouwdoelen), lokale server, iconen, hooks tegen privégegevens |
| `tests/` | Playwright-tests |
