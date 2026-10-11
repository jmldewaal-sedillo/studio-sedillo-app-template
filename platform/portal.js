// ============================================================
// {{APP_NAAM}} – platform/portal.js
// De dunne laag voor het bouwdoel WEBPORTAL (CrazyGames, Poki, …): de app draait in een
// kader op de site van de portal. Geen service worker en geen links naar buiten.
//
// Dit bestand bevat GEEN SDK en doet geen enkel verzoek naar buiten. De SDK van een portal
// komt in platform/portals/<naam>.js en alleen na akkoord van Jenn (eerst de voorwaarden over
// exclusiviteit en advertenties lezen). Zie docs/portals.md en platform/web.js.
// ============================================================
window.Platform = {
  DOEL: 'portal',
  SERVICE_WORKER: false,
  EXTERNE_LINKS: false,          // portals staan geen links naar buiten toe
  TERUG_URL: './',

  start(app) {},

  advertenties: {
    beschikbaar: false,
    tussendoor() { return Promise.resolve(false); },
  },

  // platform/portals/<naam>.js vervangt deze drie door de aanroepen van de SDK van die portal.
  spel: {
    geladen() {},
    start() {},
    stop() {},
  },
};
