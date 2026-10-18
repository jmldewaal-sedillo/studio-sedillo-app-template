# Privacy-audit – wat {{APP_NAAM}} verstuurt en bewaart

*Begin van de audit, aangemaakt op {{DATUM}} uit de template. Werk dit document bij bij elke
nieuwe sleutel en bij elke wijziging die een verzoek naar buiten kan toevoegen. Het
onderbouwt de antwoorden in het Data safety-formulier en de privacyverklaring
(`docs/publiceren.md`).*

## Conclusie

- De app doet **geen enkel verzoek naar buiten**. De app (Android en iOS) en een portal-zip hebben al
  hun bestanden bij zich; de webversie haalt alleen (GET) zijn eigen bestanden op bij het
  adres waar hij zelf staat. Er wordt niets verzonden.
- Alles wat de app onthoudt staat in **localStorage** op het toestel, onder sleutels die met
  `{{SLUG}}.` beginnen. Geen cookies, geen sessionStorage, geen IndexedDB.
- De app vraagt geen toestemmingen (camera, microfoon, locatie, meldingen).

Dit geldt voor de template. **Controleer elk punt opnieuw** zodra de app zelf erbij komt.

## Hoe het gecontroleerd wordt

`npm test` controleert dit bij elke push:

| Wat | Test |
|---|---|
| Geen verzoek naar een ander adres, geen fouten bij het laden | elke test die een pagina opent (`open()` in `tests/helpers.js`) |
| Alleen sleutels met de prefix `{{SLUG}}.`; geen cookies, sessionStorage of IndexedDB | `tests/opslag.spec.js` |
| Alleen `storage.js` raakt de opslag aan | `tests/opslag.spec.js` |
| Elke sleutel die de app schrijft staat in de tabel hieronder | `tests/opslag.spec.js` |
| "Alle gegevens verwijderen" laat geen sleutel, geen cache en geen service worker achter | `tests/wissen.spec.js` |
| De app (Android en iOS) en de portal-versie: geen service worker, geen verzoek naar buiten; portal ook geen link naar buiten | `tests/bouwdoelen.spec.js` |
| Advertenties staan uit en er zit geen advertentie-plug-in of portal-SDK in | `tests/bouwdoelen.spec.js` |
| "Profiel verwijderen" wist alleen dat profiel | `tests/wissen.spec.js` |
| Exporteren en importeren geeft precies dezelfde gegevens terug | `tests/overzetten.spec.js` |

## Wat er lokaal staat

Alle opslag loopt via `storage.js`. `<id>` is het nummer van een profiel (`p1`, `p2`, …).

| Sleutel | Inhoud | Waarom | Hoe lang | Persoonsgegeven? | In de overzet-code? |
|---|---|---|---|---|---|
| `{{SLUG}}.settings` | de gekozen taal | de app in je eigen taal tonen | tot je het wist | nee | ja |
| `{{SLUG}}.profiles` | lijst van hoogstens zes profielen (een **optionele naam** van hoogstens 20 tekens) en welk profiel actief is | meer spelers op één toestel | tot je het profiel of alles wist | alleen als iemand een echte naam intypt | ja |
| `{{SLUG}}.profile.<id>.progress` | VOORBEELD uit de template: de teller van het startscherm. Vervang door wat de app echt bewaart | verdergaan waar je was | tot je het profiel of alles wist | nee | ja |

Niets hiervan verlaat het toestel. De enige manier waarop het ergens anders komt, is als de
gebruiker zelf een overzet-code maakt en die meeneemt.

**Sleutels veranderen nooit meer zodra de app live staat.** Moet het toch, dan met een
migratie die de oude sleutel leest en overzet, en een test die dat bewijst.

## Per bouwdoel

| Bouwdoel | Waar de opslag staat | Wat er naar buiten gaat |
|---|---|---|
| app (Android en iOS) | localStorage van de app op het toestel | niets |
| webportal | localStorage in de browser, bij het adres van de portal | niets vanuit de app zolang er geen SDK in zit; de portal zelf heeft een eigen privacyverklaring |
| web / testversie | localStorage in de browser, bij het adres van de site | alleen het ophalen van de eigen bestanden |

## Wat buiten de app valt

De webserver van de testversie, van de privacy- en verwijderpagina op studiosedillo.com en
(later) van de webversie. GitHub Pages levert de bestanden en kan daarbij, zoals elke
webserver, het IP-adres van de bezoeker vastleggen. Studio Sedillo heeft daar geen toegang
toe. Dit staat in de privacyverklaring.

## Wanneer deze audit opnieuw moet

Bij elke wijziging die een verzoek naar buiten kan toevoegen of nieuwe gegevens bewaart:
cloud-opslag of accounts, statistieken, advertenties (AdMob) of verwijzingen naar andere
apps, de SDK van een webportal, externe lettertypen of geluiden, pushmeldingen. Dan ook eerst de privacyverklaring en het
Data safety-formulier bijwerken, vóór de functie live gaat.
