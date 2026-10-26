# Publiceren op Google Play – checklist voor {{APP_NAAM}}

*Begin van de checklist, aangemaakt op {{DATUM}} uit de template. De eisen zijn overgenomen
uit de checklist van Sudoku Kids (bronnen geraadpleegd op 11 oktober 2026, lijst onderaan).
Dit is geen juridisch advies. Google past dit beleid regelmatig aan: lees vlak voor het
indienen de gelinkte pagina's nog een keer na en zet de datum erbij.*

Vaste gegevens:

- Uitgever: **Studio Sedillo**, contact **studio.sedillo@gmail.com**.
- De app is een Capacitor-app voor Android en iOS (alle bestanden in de app); er is geen app-website.
  Deze checklist gaat over Google Play; voor de App Store zie `docs/app.md` en `Apps/docs/apple-developer.md`.
- Package name: **com.studiosedillo.{{SLUG}}**
- Privacybeleid: `https://studiosedillo.com/{{REPO}}/privacy`
- Gegevens verwijderen: `https://studiosedillo.com/{{REPO}}/delete`

Nog te besluiten (vul in):

- Doelgroep en leeftijd: …
- `KINDER_APP` in `config.js`: …
- Advertenties en aankopen: nee. Bij een kinder-app nooit; bij andere apps pas na akkoord van
  Jenn en nadat het zakelijke postadres geregeld is (`Apps/CLAUDE.md`, sectie 11, punt 5).

---

## Wat Jenn zelf moet doen (in deze volgorde)

- [ ] De testversie nalopen op https://jmldewaal-sedillo.github.io/{{REPO}}-test/ en akkoord geven.
- [ ] App aanmaken in Play Console: naam "{{APP_NAAM}}", gratis. Pas als de twee verklaringen
      hieronder ("0. Verklaringen bij App maken") kloppen.
- [ ] De **upload key** maken en veilig opbergen, en de app bouwen (`docs/app.md`).
- [ ] De `.aab` uploaden naar **Interne test** en op de eigen telefoon proberen.
- [ ] Akkoord geven om de privacy- en verwijderpagina op studiosedillo.com te zetten.
- [ ] App-content invullen met de antwoorden uit dit document: privacybeleid-URL,
      advertenties, app-toegang, doelgroep, Data safety, contentclassificatie (IARC).
- [ ] Store-pagina vullen met het materiaal uit `store/`.
- [ ] Bij een persoonlijk account van na 13 november 2023: gesloten test met minstens
      12 testers die 14 dagen aaneengesloten aangemeld blijven (eis 8).
- [ ] Productietoegang aanvragen, daarna de productierelease.

---

## Checklist per eis

### 0. Verklaringen bij App maken

Vaste regels: `Apps/CLAUDE.md`, sectie 11, punt 8.

- [ ] **Programmabeleid voor ontwikkelaars:** alle punten hieronder klaar, en de vaste regels
      kloppen (inhoud, eigen of vrij materiaal in `docs/credits.md`, geen misleiding en geen
      knoppen zonder werking, echte offline app, gegevens, kinderen, geld).
- [ ] **Amerikaanse exportwetten:** geen eigen versleuteling in de app (alleen HTTPS van het
      systeem); `ITSAppUsesNonExemptEncryption = false` in `ios/App/App/Info.plist`.

### 1. Privacyverklaring

Bron: [User Data-beleid][userdata]. Ook apps die geen gegevens verzamelen moeten er een hebben.

- [ ] Live op `https://studiosedillo.com/{{REPO}}/privacy`: openbaar, geen pdf. (De app toont
      dezelfde tekst zelf, ook zonder internet.)
- [ ] In minimaal EN en NL, plus de grote talen van de app.
- [ ] De lijst "Wat er wordt bewaard, en waar" in `i18n/*.js` klopt met `docs/privacy-audit.md`.
- [ ] Bij een kinder-app: `KINDER_APP: true`, zodat de paragraaf "Kinderen en ouders" erin staat.
- [ ] Datum van laatste wijziging klopt (`PRIVACY_DATUM` in `config.js`).
- [ ] Het EU-U.S. Data Privacy Framework geldt nog voor GitHub en Google
      ([GitHub][gh-privacy], [Google][google-frameworks], [Europese Commissie][dpf-ec]).
      Zo niet: de paragraaf "Gegevens buiten de EU" aanpassen, in alle apps en op de hoofdsite.
- [ ] Link in Play Console én in de app zelf (Instellingen → Privacyverklaring).
- [ ] Vermeld op studiosedillo.com/privacy bij de lijst van spellen (na de lancering).

### 2. Gegevens kunnen verwijderen

Bron: [eisen voor accountverwijdering][deletion]. De harde eis geldt voor apps met accounts.
Deze app heeft geen accounts; we voldoen er toch aan.

- [ ] In de app: "Profiel verwijderen" en "Alle gegevens van deze app verwijderen" werken
      (`tests/wissen.spec.js` is groen).
- [ ] Webpagina live op `https://studiosedillo.com/{{REPO}}/delete`; de stappen op de pagina
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
| URL voor het verwijderen van gegevens | `https://studiosedillo.com/{{REPO}}/delete` |
| Privacybeleid-URL | `https://studiosedillo.com/{{REPO}}/privacy` |

- [ ] Ingevuld. Opnieuw invullen zodra er ooit iets het toestel verlaat.

### 4. Leeftijdsclassificatie (IARC)

Bron: [contentclassificaties][iarc]. Verplicht; verkeerd invullen kan tot verwijdering leiden.

- [ ] Vragenlijst ingevuld (Beleid → App-content), e-mailadres studio.sedillo@gmail.com.
- [ ] Uitkomst genoteerd: …

### 5. Doelgroep en, bij kinderen, het Families-beleid

Bronnen: [doelgroep en content][target], [Families-beleid][families].

- [ ] Doelleeftijd gekozen: …
- [ ] Zit er een kindergroep in de doelgroep, dan geldt het Families-beleid volledig: geen
      inloggen via Google of Facebook, geen advertentie-ID, **geen advertenties en geen
      aankopen** (`Apps/CLAUDE.md`, sectie 11, punt 5).
- [ ] App-toegang: "Alle functies zijn zonder speciale toegang beschikbaar". Bij een
      kinder-app in de notities zetten hoe het ouderslot werkt (knop twee keer 1,5 seconde
      ingedrukt houden).
- [ ] Aandachtspunt bij kinder-apps: het Families-beleid wil geen app die alleen een webview
      van een website is. Deze app heeft al zijn bestanden bij zich en start zonder internet;
      controleer dat dat zo blijft.

### 6. Store-pagina

Bronnen: [previewmateriaal][assets], [metadatabeleid][metadata]. Formaten: `store/README.md`.

- [ ] Titel (hoogstens 30 tekens), korte beschrijving (80), volledige beschrijving (4000), per taal.
- [ ] Icoon 512 × 512.
- [ ] Feature graphic 1024 × 500.
- [ ] Telefoonscreenshots (2 tot 8) en tabletscreenshots, uit de echte app.
- [ ] Ontwikkelaarsnaam Studio Sedillo, e-mail studio.sedillo@gmail.com, website https://studiosedillo.com.
- [ ] Categorie en tags gekozen: …
- [ ] `node tools/store-klaar.mjs` is groen: niets meer "INVULLEN", geen "gratis", "beste", "#1",
      sterren of reviews, en de teksten kloppen met `ADVERTENTIES` en `AANKOPEN` in `config.js`.
- [ ] Screenshots en teksten tonen alleen wat echt in de app zit; geen knoppen zonder werking.

### 7. Android-app (Capacitor)

Zie `docs/app.md`. Bron: [target-API-eisen][targetapi].

- [ ] App gebouwd met Capacitor; `targetSdkVersion` voldoet aan de eis van dat moment.
- [ ] Geen permissie `AD_ID`, geen locatie- of meldingspermissie; geen cloud-back-up.
      `tools/android-instellingen.mjs` regelt dat (draait mee met `app:init` en `app:sync`; `app.yml`
      controleert het met `--check`).
- [ ] Getest op een echte telefoon via de interne test: start in vliegtuigmodus, de terugknop werkt.

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

### 10. Wetten en regels (nalopen bij elke app)

Geen juridisch advies; bij twijfel navragen (KvK, ACM, Autoriteit Persoonsgegevens).

- [ ] **AVG:** zie punt 9. Gaat er ooit iets van het toestel af (account, cloud, statistieken), dan
      eerst grondslag, privacyverklaring, Data safety en `docs/privacy-audit.md` bijwerken. Onder 16
      jaar is in Nederland toestemming van een ouder nodig als toestemming de grondslag is.
- [ ] **ePrivacy (cookies en vergelijkbare opslag):** alleen opslag die nodig is voor wat de gebruiker
      vraagt (voortgang, taal). Dan is geen cookiebanner nodig. Statistieken of advertenties: eerst
      toestemming vragen.
- [ ] **COPPA (VS, onder 13):** geen persoonsgegevens van kinderen verzamelen. Met
      `KINDER_APP: true` en niets dat het toestel verlaat is daaraan voldaan.
- [ ] **Families-beleid van Google Play / Apple Kids-categorie:** zie punt 5; links naar buiten en
      instellingen achter het ouderslot. Apple wil een slot dat een kind niet zomaar opent.
- [ ] **European Accessibility Act:** spellen vallen er meestal buiten en een micro-onderneming is
      vrijgesteld; volg toch WCAG 2.1 AA (`tests/toegankelijkheid.spec.js`).
- [ ] **Handelsregister:** KvK-nummer in de app (credits), op de pagina's (voettekst) en in e-mails.
- [ ] **DSA (handelaarsgegevens):** Google Play en Apple tonen naam, adres, e-mail en telefoon van
      een handelaar. Eerst een zakelijk postadres regelen (Apps/CLAUDE.md, sectie 1).
- [ ] **Mailing of nieuwsbrief:** alleen met aanmelding vooraf (opt-in), een afmeldlink in elke mail
      en een bijgewerkte privacyverklaring. Nu niet van toepassing.

### 11. Geld: advertenties en aankopen (alleen na akkoord van Jenn)

Nooit in een kinder-app (`KINDER_APP: true`); `tests/geld.spec.js` bewaakt dat.

**Advertenties** (`ADVERTENTIES: true`):
- [ ] Zakelijk postadres geregeld (Google toont het adres).
- [ ] Toestemming via Google UMP (TCF) **vóór** de eerste advertentie; zonder toestemming of onder
      16 alleen niet-gepersonaliseerde advertenties. Een knop "Privacyopties" in Instellingen.
- [ ] Privacyverklaring (welke gegevens AdMob gebruikt, met link), Data safety en de verklaring
      "Bevat advertenties" in Play Console bijgewerkt; store-teksten zeggen niet meer "geen advertenties".
- [ ] `tools/android-instellingen.mjs` laat dan de advertentie-ID toe; nergens anders.

**Aankopen** (`AANKOPEN: true`):
- [ ] Alleen via Google Play Billing / Apple In-App Purchase. Aankopen **op een server controleren**
      (Play Developer API), nooit alleen in de app; wat iemand gekocht heeft komt nooit uit
      localStorage of uit een code van "Voortgang overzetten".
- [ ] Een voorwaardenpagina (`voorwaarden.html`, in elke taal) met: wat je koopt, dat virtuele
      munten geen geldwaarde hebben, terugbetalen via Google Play / Apple, Nederlands recht en contact.
- [ ] Bij de koopknop: de prijs (inclusief btw), eenmalig of abonnement, en de melding dat het
      herroepingsrecht vervalt zodra de inhoud geleverd is (met een vinkje of knop vooraf).
- [ ] **Abonnementen:** prijs, periode, automatische verlenging en hoe je opzegt direct bij de koopknop,
      niet in kleine letters of verderop.
- [ ] Geen knoppen zonder werking: niets laten zien dat nog niet te koop is.
- [ ] Store-teksten zeggen niet meer "geen aankopen"; Play Console: "Bevat in-app-aankopen".

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
