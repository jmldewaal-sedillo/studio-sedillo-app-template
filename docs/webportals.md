# Webportals – {{APP_NAAM}}

Het bouwdoel **webportals** (`Apps/CLAUDE.md`, sectie 11, punt 2): per portal een upload-zip
met de SDK van die portal, **zonder service worker en zonder externe links**.

```bash
node tools/bouw.mjs portal <naam>     # -> dist/portal-<naam>.zip, met index.html bovenaan
```

## Eerst: de voorwaarden (Jenn beslist)

**Niets inbouwen zonder akkoord van Jenn, ook geen SDK.** Lees per portal eerst de
voorwaarden en leg ze voor:

| Portal | Exclusiviteit? | Advertenties verplicht? | Mag de app ook in de Play Store? | Kinderen toegestaan? | Gelezen op | Besluit Jenn |
|---|---|---|---|---|---|---|
| | | | | | | |

Let op bij een kinder-app: kinder-apps hebben geen advertenties (sectie 11, punt 5). Een
portal die advertenties verplicht, valt dan af.

## Wat de zip al doet, zonder SDK

- `platform/portal.js`: geen service worker, geen links naar buiten. De links in de
  privacyverklaring worden gewone tekst; het contactadres blijft leesbaar.
- Geen enkel verzoek naar buiten (de tests bewaken dat).
- Geen `manifest.webmanifest`, geen `sw.js`, geen `robots.txt`.

## Een portal toevoegen (na akkoord)

1. Zet de portal in `bouw.config.json` bij `portals`.
2. Maak `platform/portals/<naam>.js`. Dat bestand wordt na `platform/portal.js` geladen en
   vult de onderdelen van `Platform` in met de aanroepen van de SDK van die portal:

   ```js
   // platform/portals/<naam>.js
   window.Platform.spel.geladen = function () { /* SDK: laden klaar */ };
   window.Platform.spel.start = function () { /* SDK: er wordt gespeeld */ };
   window.Platform.spel.stop = function () { /* SDK: pauze of menu */ };
   window.Platform.advertenties.tussendoor = function () { /* SDK: advertentie, daarna verder */ };
   ```

   De spelcode roept alleen `Platform.spel.…` en `Platform.advertenties.…` aan; ze weet niet
   welke portal het is.
3. De SDK zelf laadt een bestand van de portal: dat is een verzoek naar buiten. Zet het in
   `docs/privacy-audit.md` en pas de test aan die verzoeken naar buiten verbiedt, alleen voor
   dit bouwdoel.
4. Voeg een test toe in `tests/bouwdoelen.spec.js` die de zip van deze portal opent.
5. Upload `dist/portal-<naam>.zip` bij de portal en noteer het in `ROADMAP.md`.

## Opslag en voortgang

Een portal draait de app in een kader op zijn eigen adres. De voortgang hoort bij dat adres
en staat los van de app voor Android en iOS. Sommige portals wissen de opslag of bieden een eigen opslag
via de SDK; dat komt dan in de laag van die portal, via `storage.js`.
