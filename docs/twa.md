# Android-app (TWA) bouwen en ondertekenen – {{APP_NAAM}}

*Overgenomen uit de werkwijze van Sudoku Kids (bronnen geraadpleegd op 11 oktober 2026):
[Trusted Web Activity, snelstart][twa], [Play App Signing][signing],
[Android App Links verifiëren][applinks], [target-API-eisen][targetapi]. Lees ze opnieuw na
vóór de eerste build.*

De Android-app is een **Trusted Web Activity**: een dun Android-jasje dat
`https://{{SLUG}}.studiosedillo.com/` schermvullend opent in de browser van de telefoon,
zonder adresbalk. De app bevat de webapp dus niet zelf; een update gaat via de website en
heeft geen nieuwe Play-release nodig.

| | |
|---|---|
| Package name | `com.studiosedillo.{{SLUG}}` (kan na de eerste upload nooit meer veranderen) |
| Startadres | `https://{{SLUG}}.studiosedillo.com/` |
| Gereedschap | Bubblewrap (Google) |
| Instellingen | `twa/twa-manifest.json` in deze repo |

**Kan pas als** het subdomein live is: Bubblewrap leest het manifest van het echte adres.

## Twee sleutels: wat is wat

| | Upload key | App signing key |
|---|---|---|
| Wie heeft hem | **Jenn** (bestand `android.keystore` + wachtwoord) | **Google** (Play App Signing) |
| Waarvoor | Bewijst aan Google dat een upload van jou komt | Ondertekent de app die gebruikers installeren |
| Kwijt? | Vervelend maar oplosbaar: in Play Console een reset aanvragen met een nieuwe sleutel | Kan niet kwijtraken; Google bewaart hem |
| Vingerafdruk nodig in `assetlinks.json` | Nee (alleen om een lokale build te testen) | **Ja** |

## Wat Jenn zelf doet

1. **Maak de upload key** (zie "Bouwen"). Kies een lang wachtwoord dat je nergens anders
   gebruikt.
2. **Bewaar op twee plekken**, los van deze repo: het bestand `android.keystore`, en het
   wachtwoord van de keystore, de alias (`upload`) en het wachtwoord van de sleutel.
   **Nooit** in Git, e-mail of een chat. `.gitignore` sluit `*.keystore`, `*.jks` en
   `twa/build/` al uit.
3. Geef de sleutel of het wachtwoord niet aan Claude Code. De build-commando's draai je zelf;
   ze vragen het wachtwoord in de terminal.

## Bouwen

Eenmalig: Node 18 of nieuwer. Bubblewrap biedt bij de eerste keer aan om de JDK en de
Android-SDK zelf te downloaden; zeg ja.

```bash
mkdir -p twa/build && cd twa/build
cp ../twa-manifest.json .
keytool -genkeypair -v -keystore android.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000   # alleen de eerste keer
npx @bubblewrap/cli update      # maakt het Android-project uit twa-manifest.json
npx @bubblewrap/cli build       # vraagt de wachtwoorden
```

Uitkomst: `app-release-bundle.aab` (voor Play Console) en `app-release-signed.apk` (om op je
eigen telefoon te proberen met `adb install`).

**Controleer vóór het uploaden:**

- [ ] `app/build.gradle`: `targetSdkVersion` voldoet aan de eis van dat moment (zie
      [target-API-eisen][targetapi]; Google verhoogt hem elk jaar in augustus).
- [ ] `app/src/main/AndroidManifest.xml`: geen permissie
      `com.google.android.gms.permission.AD_ID`, geen locatie- of meldingspermissie.
- [ ] De app start in vliegtuigmodus (nadat hij één keer met internet geopend is).

## De koppeling met de website (`assetlinks.json`)

Zonder geldige koppeling toont de app een adresbalk bovenin.

1. Upload de `.aab` naar **Interne test** in Play Console.
2. Ga naar **Testen en releasen → Instellen → App-integriteit → App-ondertekening** en
   kopieer de **SHA-256-vingerafdruk van het certificaat van de app-ondertekeningssleutel**.
3. Zet hem in `.well-known/assetlinks.json`, in de lijst `sha256_cert_fingerprints`, in de
   plaats van de regel die met `VERVANG` begint (hoofdletters, met dubbele punten).
4. Push naar test en daarna live.
5. Controleer: `https://{{SLUG}}.studiosedillo.com/.well-known/assetlinks.json` toont het
   bestand, rechtstreeks (zonder doorverwijzing) en als JSON. Installeer de app daarna
   opnieuw vanuit de interne test: geen adresbalk meer.

Het bestand hoort bij het subdomein: elke app heeft zijn eigen `assetlinks.json`.

## Een update uitbrengen

- **Alleen de webapp verandert:** niets doen in Play Console. Gebruikers krijgen de nieuwe
  versie via de website (`CACHE_VERSION` in `sw.js`).
- **De Android-schil verandert** (naam, icoon, startadres, nieuwe target-API-eis): verhoog
  `appVersionCode` en `appVersionName` in `twa/twa-manifest.json`, bouw opnieuw met dezelfde
  upload key en upload de nieuwe `.aab`.

[twa]: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
[signing]: https://support.google.com/googleplay/android-developer/answer/9842756?hl=en
[applinks]: https://developer.android.com/training/app-links/verify-android-applinks
[targetapi]: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
