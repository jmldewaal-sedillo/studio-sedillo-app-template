# Publiceren op Google Play – checklist voor {{APP_NAAM}}

*Begin van de checklist, aangemaakt op {{DATUM}} uit de template. De eisen zijn overgenomen
uit de checklist van Sudoku Kids (bronnen geraadpleegd op 11 oktober 2026, lijst onderaan).
Dit is geen juridisch advies. Google past dit beleid regelmatig aan: lees vlak voor het
indienen de gelinkte pagina's nog een keer na en zet de datum erbij.*

Vaste gegevens:

- Uitgever: **Studio Sedillo**, contact **studio.sedillo@gmail.com**.
- Adres van de app: **https://{{SLUG}}.studiosedillo.com/**
- Package name: **com.studiosedillo.{{SLUG}}**
- Privacybeleid: `https://{{SLUG}}.studiosedillo.com/privacy`
- Gegevens verwijderen: `https://{{SLUG}}.studiosedillo.com/delete`

Nog te besluiten (vul in):

- Doelgroep en leeftijd: …
- `KINDER_APP` in `config.js`: …
- Advertenties: nee, tenzij Jenn anders besluit (dan eerst privacyverklaring en Data safety).

---

## Wat Jenn zelf moet doen (in deze volgorde)

- [ ] De testversie nalopen op https://test-{{SLUG}}.studiosedillo.com en akkoord geven.
- [ ] App aanmaken in Play Console: naam "{{APP_NAAM}}", gratis.
- [ ] TWA bouwen met Bubblewrap en de **upload key** maken en veilig opbergen (`docs/twa.md`).
- [ ] De `.aab` uploaden naar **Interne test**; daarna de SHA-256 van de **app signing key**
      kopiëren en in `.well-known/assetlinks.json` (laten) zetten.
- [ ] App-content invullen met de antwoorden uit dit document: privacybeleid-URL,
      advertenties, app-toegang, doelgroep, Data safety, contentclassificatie (IARC).
- [ ] Store-pagina vullen met het materiaal uit `store/`.
- [ ] Bij een persoonlijk account van na 13 november 2023: gesloten test met minstens
      12 testers die 14 dagen aaneengesloten aangemeld blijven (eis 8).
- [ ] Productietoegang aanvragen, daarna de productierelease.

---

## Checklist per eis

### 1. Privacyverklaring

Bron: [User Data-beleid][userdata]. Ook apps die geen gegevens verzamelen moeten er een hebben.

- [ ] Live op `https://{{SLUG}}.studiosedillo.com/privacy`: openbaar, geen pdf.
- [ ] In alle talen van de app.
- [ ] De lijst "Wat er wordt bewaard, en waar" in `i18n/*.js` klopt met `docs/privacy-audit.md`.
- [ ] Bij een kinder-app: `KINDER_APP: true`, zodat de paragraaf "Kinderen en ouders" erin staat.
- [ ] Datum van laatste wijziging klopt (`PRIVACY_DATUM` in `config.js`).
- [ ] Het EU-U.S. Data Privacy Framework geldt nog voor GitHub en Google
      ([GitHub][gh-privacy], [Google][google-frameworks], [Europese Commissie][dpf-ec]).
      Zo niet: de paragraaf "Gegevens buiten de EU" aanpassen, in alle apps en op de hoofdsite.
- [ ] Link in Play Console én in de app zelf (Instellingen → Privacyverklaring).
- [ ] Vermeld op studiosedillo.com/privacy bij de lijst van spellen.

### 2. Gegevens kunnen verwijderen

Bron: [eisen voor accountverwijdering][deletion]. De harde eis geldt voor apps met accounts.
Deze app heeft geen accounts; we voldoen er toch aan.

- [ ] In de app: "Profiel verwijderen" en "Alle gegevens van deze app verwijderen" werken
      (`tests/wissen.spec.js` is groen).
- [ ] Webpagina live op `https://{{SLUG}}.studiosedillo.com/delete`; de stappen op de pagina
      kloppen met waar de knoppen in de app echt zitten.
- [ ] De link ingevuld in Play Console (Data safety → gegevens verwijderen).

### 3. Data safety-formulier

Bron: [Data safety][datasafety]. Verplicht voor elke track behalve interne test.
"Verzamelen" betekent bij Google: gegevens van het toestel af sturen. Onderbouwing:
`docs/privacy-audit.md`.

| Vraag | Antwoord (controleer met de audit) |
|---|---|
| Verzamelt of deelt je app een van de vereiste soorten gebruikersgegevens? | **Nee**, zolang de audit zegt dat niets het toestel verlaat |
| Kunnen gebruikers in je app een account aanmaken? | **Nee**: een profiel op het toestel is geen account |
| URL voor het verwijderen van gegevens | `https://{{SLUG}}.studiosedillo.com/delete` |
| Privacybeleid-URL | `https://{{SLUG}}.studiosedillo.com/privacy` |

- [ ] Ingevuld. Opnieuw invullen zodra er ooit iets het toestel verlaat.

### 4. Leeftijdsclassificatie (IARC)

Bron: [contentclassificaties][iarc]. Verplicht; verkeerd invullen kan tot verwijdering leiden.

- [ ] Vragenlijst ingevuld (Beleid → App-content), e-mailadres studio.sedillo@gmail.com.
- [ ] Uitkomst genoteerd: …

### 5. Doelgroep en, bij kinderen, het Families-beleid

Bronnen: [doelgroep en content][target], [Families-beleid][families].

- [ ] Doelleeftijd gekozen: …
- [ ] Zit er een kindergroep in de doelgroep, dan geldt het Families-beleid volledig: geen
      inloggen via Google of Facebook, geen advertentie-ID, advertenties alleen na expliciet
      besluit en dan alleen via een voor Families goedgekeurde SDK.
- [ ] App-toegang: "Alle functies zijn zonder speciale toegang beschikbaar". Bij een
      kinder-app in de notities zetten hoe het ouderslot werkt (knop twee keer 1,5 seconde
      ingedrukt houden).
- [ ] Aandachtspunt bij kinder-apps: het Families-beleid wil geen app die alleen een webview
      van een website is. Een TWA is technisch geen WebView, maar zorg dat `assetlinks.json`
      klopt (geen adresbalk), de app offline start en er geen link naar een website in zit.

### 6. Store-pagina

Bronnen: [previewmateriaal][assets], [metadatabeleid][metadata]. Formaten: `store/README.md`.

- [ ] Titel (hoogstens 30 tekens), korte beschrijving (80), volledige beschrijving (4000), per taal.
- [ ] Icoon 512 × 512.
- [ ] Feature graphic 1024 × 500.
- [ ] Telefoonscreenshots (2 tot 8) en tabletscreenshots, uit de echte app.
- [ ] Ontwikkelaarsnaam Studio Sedillo, e-mail studio.sedillo@gmail.com, website https://studiosedillo.com.
- [ ] Categorie en tags gekozen: …

### 7. Android-app (TWA)

Zie `docs/twa.md`. Bron: [target-API-eisen][targetapi].

- [ ] `assetlinks.json` live met de vingerafdruk van de app signing key.
- [ ] TWA gebouwd, `targetSdkVersion` voldoet aan de eis van dat moment.
- [ ] Getest op een echte telefoon: geen adresbalk, start in vliegtuigmodus.

### 8. Gesloten test voor nieuwe persoonlijke accounts

Bron: [testeisen voor nieuwe persoonlijke accounts][testing]. Geldt voor persoonlijke accounts
die na 13 november 2023 zijn aangemaakt.

- [ ] Nagekeken of dit voor het account geldt.
- [ ] Zo ja: minstens 12 testers, 14 dagen aaneengesloten; feedback bijgehouden.

### 9. AVG

- [ ] Studio Sedillo verwerkt geen persoonsgegevens van gebruikers (onderbouwd met
      `docs/privacy-audit.md`).
- [ ] Verantwoordelijke, rechten, klacht bij de Autoriteit Persoonsgegevens, e-mail via Gmail
      en hosting via GitHub staan in de privacyverklaring (`tests/paginas.spec.js` controleert
      dat de onderdelen er zijn).
- [ ] Bij kinderen: geen verwerking op basis van toestemming, dus geen ouderlijke toestemming
      nodig. Dat verandert bij cloud-opslag, statistieken of advertenties.

---

## Bronnen

Overgenomen op {{DATUM}}; geraadpleegd op 11 oktober 2026 voor Sudoku Kids. Opnieuw nagelezen op: …

[families]: https://support.google.com/googleplay/android-developer/answer/9893335?hl=en
[datasafety]: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
[userdata]: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en
[deletion]: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
[iarc]: https://support.google.com/googleplay/android-developer/answer/9859655?hl=en
[target]: https://support.google.com/googleplay/android-developer/answer/9867159?hl=en
[assets]: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
[metadata]: https://support.google.com/googleplay/android-developer/answer/9898842?hl=en
[targetapi]: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
[testing]: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
[gh-privacy]: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement
[google-frameworks]: https://policies.google.com/privacy/frameworks?hl=en
[dpf-ec]: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/eu-us-data-transfers_en
