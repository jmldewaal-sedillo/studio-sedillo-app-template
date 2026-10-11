// ============================================================
// {{APP_NAAM}} – platform/android.js
// De dunne laag voor het bouwdoel ANDROID (Capacitor). Alle bestanden zitten in de app:
// geen service worker, geen netwerk nodig. Zie platform/web.js voor de onderdelen en
// docs/android.md voor het bouwen.
// ============================================================
window.Platform = {
  DOEL: 'android',
  SERVICE_WORKER: false,
  EXTERNE_LINKS: true,           // Capacitor opent een link naar buiten in de browser van de telefoon
  TERUG_URL: './',

  start(app) {
    // De terugknop van Android: een stap terug in de app, en op het startscherm de app sluiten.
    // De plug-in @capacitor/app zit er alleen in de echte app; in een browser gebeurt er niets.
    const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (!plugin) return;
    plugin.addListener('backButton', () => { if (!app.back()) plugin.exitApp(); });
  },

  // Advertenties: uit. AdMob komt er alleen in via de Capacitor-plug-in, na akkoord van Jenn
  // (ADVERTENTIES in config.js) en nooit in een kinder-app. Zie Apps/CLAUDE.md, sectie 11, punt 5.
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
