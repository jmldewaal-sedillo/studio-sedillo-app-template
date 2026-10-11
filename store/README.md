# Materiaal voor Google Play — {{APP_NAAM}}

Alles wat in Play Console bij de store-vermelding ingevuld of geüpload wordt. De teksten staan
per taal in een eigen map; `tests/paginas.spec.js` controleert de lengtes.

## Mappen

```
store/
  nl-NL/  en-US/           teksten per taal (map = taalcode van Play Console)
    titel.txt              naam van de app
    korte-beschrijving.txt
    volledige-beschrijving.txt
  icon-512.png             app-icoon
  feature-graphic.png      banner bovenaan de store-pagina (nog maken)
  screenshots/nl/  en/     telefoon- en tabletscreenshots per taal
```

Een taal erbij: kopieer een map en geef hem de taalcode van Play Console (`de-DE`, `fr-FR`,
`es-ES`, `pt-BR`, `id`, …).

## Vereiste formaten

| Onderdeel | Formaat | Let op |
|---|---|---|
| Titel | hoogstens 30 tekens | geen emoji, geen "gratis", "nr. 1" of ander lokaas |
| Korte beschrijving | hoogstens 80 tekens | |
| Volledige beschrijving | hoogstens 4000 tekens | geen losse trefwoordenlijsten |
| App-icoon | 512 × 512 px, PNG (32 bits, met alfa), hoogstens 1 MB | Play snijdt zelf de hoeken af: vul het hele vlak |
| Feature graphic | 1024 × 500 px, PNG of JPG (zonder alfa), hoogstens 15 MB | belangrijke dingen in het midden; geen tekst vlak bij de rand |
| Telefoonscreenshots | 2 tot 8 stuks, PNG of JPG, verhouding 16:9 of 9:16, elke zijde 320 tot 3840 px | 1080 × 1920 is een veilige maat |
| Tabletscreenshots 7 inch | tot 8 stuks, verhouding 16:9 of 9:16, elke zijde 320 tot 3840 px | nodig om "geschikt voor tablets" te tonen |
| Tabletscreenshots 10 inch | tot 8 stuks, verhouding 16:9 of 9:16, elke zijde 1080 tot 7680 px | |

Controleer de maten vlak voor het uploaden in Play Console zelf; Google past ze soms aan.

## Vaste gegevens voor het formulier

| Veld | Waarde |
|---|---|
| Ontwikkelaar | Studio Sedillo |
| E-mail | studio.sedillo@gmail.com |
| Website | https://studiosedillo.com |
| Privacybeleid | https://{{SLUG}}.studiosedillo.com/privacy |
| Gegevens verwijderen | https://{{SLUG}}.studiosedillo.com/delete |
| Package-naam | `com.studiosedillo.{{SLUG}}` |

## Screenshots maken

Screenshots moeten de echte app tonen. `npm test` zet schermafbeeldingen van elk formaat in
`tests/screenshots/`; maak voor de store een eigen test die de mooiste schermen op
1080 × 1920 vastlegt en ze in `store/screenshots/<taal>/` zet.
