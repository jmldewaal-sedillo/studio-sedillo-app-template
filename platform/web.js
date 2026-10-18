// ============================================================
// {{APP_NAAM}} – platform/web.js
// De dunne laag voor het bouwdoel WEB (PWA in de browser, ook de testversie).
//
// Elk bouwdoel heeft zo'n bestand met precies dezelfde onderdelen (een test controleert dat):
//   platform/web.js        browser, met service worker
//   platform/app.js        Capacitor-app voor Android én iOS, alles in de app, zonder service worker
//   platform/portal.js     webportal (CrazyGames, Poki, …), zonder service worker en externe links
//   platform/hoofdsite.js  alleen de pagina's privacy en verwijderen op studiosedillo.com
// tools/bouw.mjs zet het juiste bestand in de pagina's. De spelcode vraagt aan Platform wat
// kan en kijkt nooit zelf op welk bouwdoel ze draait. Zie Apps/CLAUDE.md, sectie 11.
// ============================================================
window.Platform = {
  DOEL: 'web',
  SERVICE_WORKER: true,          // bestanden bewaren voor gebruik zonder internet
  EXTERNE_LINKS: true,           // links naar buiten (privacyverklaringen van Google en GitHub, mailto)
  TERUG_URL: './',               // waar "Terug naar de app" op de pagina's heen gaat

  // Eén keer aangeroepen als de app klaar is. app.back() gaat een stap terug en geeft false
  // terug als dat niet meer kan (dan staat de app op het startscherm).
  start(app) {},

  // Advertenties: uit. Alleen na akkoord van Jenn, en nooit in een kinder-app.
  advertenties: {
    beschikbaar: false,
    tussendoor() { return Promise.resolve(false); },    // advertentie tussen twee potjes; true = getoond
  },

  // Voor portals die willen weten wanneer er gespeeld wordt. Hier doet het niets.
  spel: {
    geladen() {},
    start() {},
    stop() {},
  },
};
