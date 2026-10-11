# Template voor Studio Sedillo-apps

Dit is de template waar elke nieuwe app van Studio Sedillo mee begint. Maak een app niet met
de hand uit deze repo, maar met het script (in de map `Apps/`):

```bash
tools/nieuwe-app.sh <slug> <repo-naam> "<App-naam>"
tools/nieuwe-app.sh --dry-run <slug> <repo-naam> "<App-naam>"     # laat alles zien, maakt niets aan
```

Het script maakt de repo's, vult de placeholders in en zet GitHub Pages aan. Dit bestand en
`.template` verdwijnen daarbij uit de nieuwe app.

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
- Nieuw bestand voor de app? Zet het in `ASSETS` in `sw.js` (een test controleert dat).
- Nieuwe sleutel in de opslag? Zet hem in `docs/privacy-audit.md` (een test controleert dat).
- Nieuwe tekst? In elk bestand in `i18n/` (een test controleert dat).
- Draai de tests en push naar `main`. Bestaande apps krijgen de wijziging niet vanzelf.
