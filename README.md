# {{APP_NAAM}}

Een app van Studio Sedillo. Vanilla HTML, CSS en JavaScript; geen build-stap, geen externe
bestanden, werkt zonder internet (PWA).

| | |
|---|---|
| Live | https://{{SLUG}}.studiosedillo.com |
| Test | https://test-{{SLUG}}.studiosedillo.com |
| Privacyverklaring | https://{{SLUG}}.studiosedillo.com/privacy |
| Gegevens verwijderen | https://{{SLUG}}.studiosedillo.com/delete |
| Repo live | https://github.com/jmldewaal-sedillo/{{REPO}} (remote `origin`) |
| Repo test | https://github.com/jmldewaal-sedillo/{{REPO}}-test (remote `test`) |
| Android package | `com.studiosedillo.{{SLUG}}` |
| Prefix opslag | `{{SLUG}}.` |

De vaste afspraken voor alle apps staan in `Apps/CLAUDE.md`; wat alleen voor deze app geldt
in `CLAUDE.md` hier. De planning en het logboek staan in `ROADMAP.md`.

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
schermafbeeldingen in `tests/screenshots/`. Ze controleren onder meer: laden zonder fouten,
taal wisselen, werken zonder internet, dat verwijderen geen enkele `{{SLUG}}.`-sleutel en geen
cache achterlaat, dat exporteren en importeren dezelfde gegevens teruggeeft, en dat er geen
placeholder van de template is blijven staan.

## Naar het testadres en live

Elke push draait de tests op GitHub. Een push naar `main` publiceert daarna de app, maar
alleen als de tests groen zijn. Welk adres het wordt hangt af van de repo:

```bash
git push test HEAD:main      # -> https://test-{{SLUG}}.studiosedillo.com
git push origin main         # -> https://{{SLUG}}.studiosedillo.com   (alleen na akkoord van Jenn)
```

Verhoog bij elke wijziging aan de app `CACHE_VERSION` in `sw.js`.

## Bestanden

| Bestand | Wat |
|---|---|
| `config.js` | Naam, slug, themakleur, `KINDER_APP` (ouderslot aan of uit), talen, credits |
| `index.html`, `style.css`, `app.js` | Het startscherm en de instellingen |
| `storage.js` | Alle opslag, altijd met de prefix `{{SLUG}}.`; wissen, exporteren, importeren |
| `i18n/` | De teksten per taal, ook die van de privacyverklaring |
| `common.js`, `pages.js` | Taalkeuze en de pagina's privacy en verwijderen |
| `sw.js`, `manifest.webmanifest`, `icons/` | De PWA: cache voor gebruik zonder internet, naam en iconen |
| `privacy.html`, `delete.html`, `verwijderen.html` | Privacyverklaring, verwijderpagina, doorverwijzing |
| `.well-known/assetlinks.json` | Koppeling met de Android-app (zie `docs/twa.md`) |
| `docs/` | Privacy-audit, credits, TWA, checklist voor Google Play |
| `store/` | Teksten en beeldmateriaal voor Google Play |
| `tools/` | Lokale server, iconen maken, de site klaarzetten voor GitHub Pages |
| `tests/` | Playwright-tests |
