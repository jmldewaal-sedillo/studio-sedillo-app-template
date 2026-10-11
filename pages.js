// ============================================================
// {{APP_NAAM}} – pages.js
// Shows the privacy policy and the delete page (<body data-page="privacyPage">
// or "deletePage") in the language of the app. The texts are in i18n/*.js.
// ============================================================
(function () {
  'use strict';
  const C = window.APP_CONFIG;
  const App = window.App;
  const page = document.body.dataset.page;

  function show() {
    const T = window.TEKSTEN[App.lang][page];
    const kids = C.KINDER_APP === true;
    const mail = '<a href="mailto:' + C.CONTACT + '">' + C.CONTACT + '</a>';
    const date = new Date(C.PRIVACY_DATUM + 'T12:00:00').toLocaleDateString(App.lang, { day: 'numeric', month: 'long', year: 'numeric' });
    const lock = kids ? App.t(page === 'privacyPage' ? 'privacyLock' : 'deleteLock') : '';
    const fill = text => text
      .split('{app}').join(App.escapeHtml(C.APP_NAAM))
      .split('{short}').join(App.escapeHtml(C.KORTE_NAAM))
      .split('{mail}').join(mail)
      .split('{date}').join(App.escapeHtml(date))
      .split('{lock}').join(lock);
    document.title = T.title + ' – ' + C.APP_NAAM;
    document.getElementById('page-text').innerHTML =
      '<h1>' + T.title + '</h1><p class="updated">' + fill(T.sub) + '</p>' +
      T.sections.filter(s => s[2] !== 'kids' || kids).map(s => '<h2>' + s[0] + '</h2>' + fill(s[1])).join('');
    App.applyTexts();
  }

  App.applyTheme();
  App.buildLanguageButtons();
  App.onLanguage(show);
  show();
})();
