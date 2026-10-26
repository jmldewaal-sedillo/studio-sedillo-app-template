# Template voor Studio Sedillo-apps

Dit is de template waar elke nieuwe app van Studio Sedillo mee begint. De opzet volgt
`Apps/CLAUDE.md`, sectie 11 ("App-structuur Studio Sedillo"): één codebase, drie bouwdoelen
(de app voor Android en iOS met Capacitor, webportals, en later eventueel web), een testversie op github.io, de
blocklist tegen privégegevens en de vindbaar-schakelaar op "nee".

Maak een app niet met de hand uit deze repo, maar met het script (in de map `Apps/`):

```bash
tools/nieuwe-app.sh --dry-run <slug> <repo-naam> "<App-naam>"     # laat alles zien, maakt niets aan
tools/nieuwe-app.sh <slug> <repo-naam> "<App-naam>"
```

Het script maakt de repo's, vult de placeholders in, zet de hooks en het geheim voor de
blocklist en zet GitHub Pages aan voor de testversie. Dit bestand en `.template` verdwijnen
daarbij uit de nieuwe app.

## Placeholders

| Placeholder | Wat | Voorbeeld |
|---|---|---|
| `{{APP_NAAM}}` | Volledige naam | Sudoku Kids & Crazy Grids |
| `{{KORTE_NAAM}}` | Naam onder het icoon (hoogstens 12 tekens) | Sudoku Kids |
| `{{SLUG}}` | Kleine letters en cijfers; subdomein, package-naam, prefix van de opslag | sudokukids |
| `{{REPO}}` | Naam van de GitHub-repo | sudoku-kids |
| `{{THEMA_KLEUR}}` | Kleur van de balk en het icoon, `#rrggbb` | #2B6CB0 |
| `{{DATUM}}` | Dag van aanmaken (automatisch) | 2026-10-11 |

`tools/vul-in.mjs` vult ze in en houdt rekening met tekens die in HTML, JSON of JavaScript
iets betekenen (een `&` of aanhalingsteken in de naam).

## De template zelf testen

```bash
npm install
npx playwright install chromium
npm test
```

Omdat de template placeholders bevat, maken de tests eerst een ingevulde kopie in
`.test-build/` (met dezelfde `tools/vul-in.mjs` die het script gebruikt) en testen die. De
test in `tests/placeholders.spec.js` faalt als daar nog een placeholder in staat. Zodra
`.template` weg is (in een echte app) testen dezelfde tests de app zelf.

## Iets aan de template veranderen

- Houd het algemeen: niets wat bij één app hoort.
- Nooit een adres of ander privégegeven in de template of in een app. `tools/install-hooks.sh`
  zet de controle aan (lijst buiten de repo: `~/.studio-sedillo/blocklist.txt`); in GitHub
  Actions gebruikt `tests/no-private-data.py --ci` het geheim `PRIVATE_BLOCKLIST`.
  `Apps/tools/nieuwe-app.sh` regelt beide voor een nieuwe app.
- Nieuw bestand voor de app? Zet het in `ASSETS` in `sw.js` (een test controleert dat).
- Iets dat per bouwdoel verschilt? In `platform/`, in elk bestand met dezelfde onderdelen (een
  test controleert dat). De spelcode kijkt nooit zelf op welk bouwdoel ze draait.
- Geen SDK van een portal en geen advertentie-plug-in in de template: die komen per app, na
  akkoord van Jenn.
- Nieuwe sleutel in de opslag? Zet hem in `docs/privacy-audit.md` (een test controleert dat).
- Nieuwe tekst? In elk bestand in `i18n/` (een test controleert dat).
- Draai de tests en push naar `main`. Bestaande apps krijgen de wijziging niet vanzelf.

## Vaste controles (sinds 26 oktober 2026)

Deze tests en scripts bewaken de regels uit `Apps/CLAUDE.md` in elke app. Een test uitzetten mag
niet; past iets echt niet bij een app, dan eerst Jenn vragen en de reden in de CLAUDE.md van de app.

| Wat | Waar |
|---|---|
| Toegankelijkheid WCAG 2.1 AA (contrast, alt, knopnamen, taal) in elk scherm, elke dialoog en elke taal; reflow op 320 px | `tests/toegankelijkheid.spec.js` (axe-core) |
| Alles met het toetsenbord; focus blijft in een dialoog en gaat terug na sluiten | `tests/toetsenbord.spec.js` |
| Strenge Content-Security-Policy in elke pagina en elk bouwdoel; SDK van een portal via `portalCsp` in `bouw.config.json` | `tests/beveiliging.spec.js` |
| "Voortgang overzetten": zonder `AppStorage.cleanPart` geen import; vijandige codes en kapotte opslag | `tests/beveiliging.spec.js` |
| Android: geen cloud-back-up, geen `AD_ID` zonder advertenties | `tools/android-instellingen.mjs` (`app:init`, `app:sync`, `app.yml --check`) |
| Store-teksten zonder "gratis", "beste", "#1", sterren, reviews of emoji; kloppend met `ADVERTENTIES`/`AANKOPEN` | `tests/inhoud.spec.js`; vóór uploaden `node tools/store-klaar.mjs` |
| Geen trackers, session replay, Google Fonts of onbekende hosts; elk asset in `docs/credits.md` | `tests/inhoud.spec.js` |
| Advertenties en aankopen nooit in een kinder-app; met aankopen een voorwaardenpagina | `tests/geld.spec.js`; `docs/publiceren.md`, punt 11 |
| KvK in credits, privacyverklaring en voettekst | `tests/start.spec.js`, `tests/paginas.spec.js` |
| Geen privégegevens, ook niet in de geschiedenis; CI stopt zonder het geheim | `.github/workflows/privacy.yml`, `ci.yml` |
| Dependabot (npm en Actions) | `.github/dependabot.yml`; `Apps/tools/nieuwe-app.sh` zet de meldingen aan |
