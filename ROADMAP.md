# {{APP_NAAM}} — Roadmap

## Status
Android: nog niet in de Play Store — versie 0.1 (nog alleen de template)
iOS: nog niet in de App Store
Test: https://jmldewaal-sedillo.github.io/{{REPO}}-test/
Webportals: nog geen

## Nu bezig
Volg `docs/lanceren.md`; dat is de checklist van idee tot lancering.
- [ ] `CLAUDE.md` invullen: doel, doelgroep, toon, techniek
- [ ] `KINDER_APP` in `config.js` kiezen (true = ouderslot en paragraaf "Kinderen en ouders"; dan geen advertenties of aankopen)
- [ ] Het voorbeeld op het startscherm (de teller) vervangen door de app zelf
- [ ] Eén keer `npm run app:init` draaien en de mappen `android/` en `ios/` committen (`docs/app.md`)

## Volgende
- [ ] Echte iconen in `icons/` (192, 512, maskable) in plaats van de tijdelijke ring
- [ ] Privacyverklaring nalopen: de lijst "Wat er wordt bewaard" in `i18n/*.js` moet kloppen met `docs/privacy-audit.md`
- [ ] Op een echte telefoon proberen via het testadres

## Later / ideeën
- [ ] Webportals (CrazyGames, Poki, …): eerst de voorwaarden lezen, niets inbouwen zonder akkoord (`docs/webportals.md`)
- [ ] Webversie op {{SLUG}}.studiosedillo.com: pas als Jenn "lanceren web" zegt

## Voor publicatie in Google Play
Uitleg per punt: `docs/publiceren.md`.
- [ ] Privacyverklaring en verwijderpagina live op https://studiosedillo.com/{{REPO}}/privacy en https://studiosedillo.com/{{REPO}}/delete
- [ ] Data Safety ingevuld
- [ ] Store-teksten, icoon, feature graphic, screenshots
- [ ] Android-app gebouwd met Capacitor en getest in de interne test
- [ ] Gesloten test: 12 testers, 14 dagen
- [ ] Contentbeoordeling (IARC) ingevuld

## Logboek
### {{DATUM}}
- App aangemaakt uit de template met `tools/nieuwe-app.sh`: repo's `{{REPO}}` en `{{REPO}}-test`, testversie op github.io, versie 0.1.
