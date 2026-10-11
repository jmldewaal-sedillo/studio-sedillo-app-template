// ============================================================
// {{APP_NAAM}} – common.js
// Shared by the app (index.html) and the pages (privacy, delete):
// the language, the texts and the theme colour.
// ============================================================
(function (root) {
  'use strict';
  const C = root.APP_CONFIG;
  const Store = root.AppStorage;
  const TEXTS = root.TEKSTEN || {};
  const LANGS = C.TALEN.filter(code => TEXTS[code]);

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  // The saved choice, else the language of the device, else English, else the first language.
  function startLanguage() {
    try {
      const asked = new URLSearchParams(root.location.search).get('lang');
      if (LANGS.includes(asked)) return asked;
    } catch (e) { /* no location */ }
    const saved = Store.readSetting('language');
    if (LANGS.includes(saved)) return saved;
    const device = String(root.navigator.language || '').slice(0, 2).toLowerCase();
    if (LANGS.includes(device)) return device;
    return LANGS.includes('en') ? 'en' : LANGS[0];
  }
  let lang = startLanguage();

  // A text in the current language; {name} is replaced by vars.name.
  function t(key, vars) {
    let text = TEXTS[lang] && typeof TEXTS[lang][key] === 'string' ? TEXTS[lang][key] : null;
    if (text === null) text = TEXTS[LANGS[0]] && typeof TEXTS[LANGS[0]][key] === 'string' ? TEXTS[LANGS[0]][key] : key;
    const all = Object.assign({ app: C.APP_NAAM, short: C.KORTE_NAAM, mail: C.CONTACT }, vars || {});
    return text.replace(/\{(\w+)\}/g, (whole, name) => (name in all ? String(all[name]) : whole));
  }

  // Fills every element that carries data-i18n (text), data-i18n-aria
  // (aria-label) or data-i18n-ph (placeholder).
  function applyTexts(scope) {
    const el = scope || root.document;
    root.document.documentElement.lang = lang;
    el.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
    el.querySelectorAll('[data-i18n-aria]').forEach(n => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
    el.querySelectorAll('[data-i18n-ph]').forEach(n => { n.setAttribute('placeholder', t(n.dataset.i18nPh)); });
  }

  const listeners = [];
  function setLanguage(code) {
    if (!LANGS.includes(code)) return;
    lang = code;
    Store.writeSetting('language', code);
    applyTexts();
    listeners.forEach(fn => fn(code));
  }

  // Language buttons into every element with class "langs".
  function buildLanguageButtons() {
    root.document.querySelectorAll('.langs').forEach(box => {
      box.textContent = '';
      LANGS.forEach(code => {
        const b = root.document.createElement('button');
        b.type = 'button';
        b.dataset.lang = code;
        b.lang = code;
        b.textContent = TEXTS[code].langName || code.toUpperCase();
        b.setAttribute('aria-pressed', String(code === lang));
        b.addEventListener('click', () => setLanguage(code));
        box.appendChild(b);
      });
    });
  }
  listeners.push(() => {
    root.document.querySelectorAll('.langs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  });

  // Text on the theme colour: white or dark, whichever is easier to read.
  function applyTheme() {
    const hex = /^#([0-9a-f]{6})$/i.exec(C.THEMA_KLEUR);
    if (!hex) return;
    const n = parseInt(hex[1], 16);
    const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    const style = root.document.documentElement.style;
    style.setProperty('--theme', C.THEMA_KLEUR);
    style.setProperty('--on-theme', lum > 0.4 ? '#1d1b26' : '#ffffff');
  }

  root.App = {
    LANGS, t, escapeHtml, applyTexts, setLanguage, buildLanguageButtons, applyTheme,
    get lang() { return lang; },
    onLanguage(fn) { listeners.push(fn); },
  };
})(window);
