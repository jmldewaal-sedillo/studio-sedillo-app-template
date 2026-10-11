# {{APP_NAAM}} — Roadmap

## Status
Live: https://{{SLUG}}.studiosedillo.com — versie 0.1 (nog alleen de template)
Test: https://test-{{SLUG}}.studiosedillo.com

## Nu bezig
- [ ] `CLAUDE.md` invullen: doel, doelgroep, toon, techniek
- [ ] `KINDER_APP` in `config.js` kiezen (true = ouderslot en paragraaf "Kinderen en ouders")
- [ ] DNS: twee CNAME-records bij Namecheap (host `{{SLUG}}` en `test-{{SLUG}}`, waarde `jmldewaal-sedillo.github.io.`)
- [ ] Na DNS: `tools/controleer-domein.sh {{SLUG}}` draaien (in `Apps/`) tot "Enforce HTTPS" aan staat
- [ ] Het voorbeeld op het startscherm (de teller) vervangen door de app zelf

## Volgende
- [ ] Echte iconen in `icons/` (192, 512, maskable) in plaats van de tijdelijke ring
- [ ] Privacyverklaring nalopen: de lijst "Wat er wordt bewaard" in `i18n/*.js` moet kloppen met `docs/privacy-audit.md`
- [ ] App op studiosedillo.com zetten (repo `studio-sedillo`), als dat bij het aanmaken is overgeslagen

## Later / ideeën
- [ ] ...

## Voor publicatie in Google Play
Uitleg per punt: `docs/publiceren.md`.
- [ ] Privacyverklaring en verwijderpagina live
- [ ] Data Safety ingevuld
- [ ] Store-teksten, icoon, feature graphic, screenshots
- [ ] assetlinks.json live, TWA gebouwd en getest
- [ ] Contentbeoordeling (IARC) ingevuld

## Logboek
### {{DATUM}}
- App aangemaakt uit de template met `tools/nieuwe-app.sh`: repo's `{{REPO}}` en `{{REPO}}-test`, GitHub Pages met eigen domein, versie 0.1.
