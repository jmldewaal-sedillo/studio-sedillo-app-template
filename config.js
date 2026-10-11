// ============================================================
// {{APP_NAAM}} – config.js
// Everything that differs per app, in one place. Fixed Studio Sedillo data
// (brand, contact address) comes from Apps/CLAUDE.md; do not change it here.
// ============================================================
window.APP_CONFIG = {
  APP_NAAM: '{{APP_NAAM}}',
  KORTE_NAAM: '{{KORTE_NAAM}}',
  SLUG: '{{SLUG}}',                 // prefix of every localStorage key and cache: never change after going live
  THEMA_KLEUR: '{{THEMA_KLEUR}}',
  VERSIE: '0.1',

  // true  = app for children (under 13): deleting data and moving progress sit
  //         behind the parent lock, and the privacy policy gets the paragraph
  //         "Children and parents".
  // false = no parent lock.
  KINDER_APP: false,

  // Languages of the app, in the order of the buttons. Each one needs a file
  // i18n/<code>.js (and a <script> tag in every HTML page, and a line in sw.js).
  TALEN: ['nl', 'en'],

  // Fixed for all Studio Sedillo apps.
  MAKER: 'Studio Sedillo',
  CONTACT: 'studio.sedillo@gmail.com',

  // Date of the last change to the privacy policy (YYYY-MM-DD). Change it
  // together with the text in i18n/*.js.
  PRIVACY_DATUM: '{{DATUM}}',

  // Everything in the app that is not our own work. Keep in step with docs/credits.md.
  // { wat: 'Icons', maker: 'Name', licentie: 'CC BY 4.0', url: 'https://…' }
  CREDITS: [],
};
