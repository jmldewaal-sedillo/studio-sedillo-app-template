// ============================================================
// {{APP_NAAM}} – platform/hoofdsite.js
// De dunne laag voor de pagina's privacy en verwijderen op studiosedillo.com/{{SLUG}}/.
// Dat zijn de adressen voor de Play Store. De app zelf staat daar niet: "terug" gaat naar
// de hoofdsite. Zie platform/web.js.
// ============================================================
window.Platform = {
  DOEL: 'hoofdsite',
  SERVICE_WORKER: false,
  EXTERNE_LINKS: true,
  TERUG_URL: '../',

  start(app) {},

  advertenties: {
    beschikbaar: false,
    tussendoor() { return Promise.resolve(false); },
  },

  spel: {
    geladen() {},
    start() {},
    stop() {},
  },
};
