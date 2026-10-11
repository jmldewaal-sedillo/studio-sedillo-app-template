// ============================================================
// {{APP_NAAM}} – app.js
// The start screen, the settings (profiles, deleting data, moving progress,
// credits, privacy), the parent lock and the service worker.
// ============================================================
(function () {
  'use strict';
  const C = window.APP_CONFIG;
  const Store = window.AppStorage;
  const App = window.App;
  const t = App.t;
  const $ = id => document.getElementById(id);
  const on = (id, ev, fn) => $(id).addEventListener(ev, fn);

  // Test copy: the address starts with "test-" (test-<slug>.studiosedillo.com).
  // It has its own address, so its own storage and cache; a strip makes it recognisable.
  const IS_TEST = /^test[-.]/.test(location.hostname);

  // ---------- screens and modals ----------
  let currentScreen = 'start';
  let reloadWaiting = false;
  function showScreen(name) {
    currentScreen = name;
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 'screen-' + name; });
    if (name === 'start' && reloadWaiting) location.reload();
    render();
    const first = document.querySelector('#screen-' + name + ' .icon-btn');
    if (first) first.focus();
  }
  function showModal(name) {
    document.querySelectorAll('.modal').forEach(m => { m.hidden = m.id !== 'modal-' + name; });
    const first = document.querySelector('#modal-' + name + ' button');
    if (first) first.focus();
  }
  function hideModals() { document.querySelectorAll('.modal').forEach(m => { m.hidden = true; }); }

  // ---------- rendering ----------
  function profileName(p) {
    return p.name || t('profileUnnamed', { n: p.id.slice(1) });
  }
  function render() {
    $('app-title').textContent = C.APP_NAAM;
    document.title = C.APP_NAAM;
    $('version').textContent = t('version', { v: C.VERSIE });

    // EXAMPLE: the counter of the active profile.
    const active = Store.profile(Store.activeId());
    const progress = Store.read('progress');
    const count = progress && Number.isInteger(progress.count) ? progress.count : 0;
    $('demo-count').textContent = t('demoCount', { name: profileName(active), count });

    // Profiles: one button each, the active one is pressed.
    const list = $('profile-list');
    list.textContent = '';
    Store.profiles().forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn profile';
      b.dataset.id = p.id;
      b.textContent = profileName(p);
      b.setAttribute('aria-pressed', String(p.id === Store.activeId()));
      b.addEventListener('click', () => { Store.setActive(p.id); render(); });
      list.appendChild(b);
    });

    // Credits
    $('credits-own').textContent = C.CREDITS.length ? t('creditsOthers') : t('creditsOwn');
    const credits = $('credits-list');
    credits.textContent = '';
    C.CREDITS.forEach(c => {
      const li = document.createElement('li');
      li.textContent = [c.wat, c.maker, c.licentie].filter(Boolean).join(' – ');
      credits.appendChild(li);
    });
    $('credits-contact').textContent = t('creditsContact');
  }

  // ---------- parent lock ----------
  // Press and hold the button twice in a row (2 × 1.5 s within 5 s). Too
  // fiddly for a young child, no reading or sums needed for the parent.
  // Only in the way when KINDER_APP is true.
  const HOLD_MS = 1500;
  const HOLD_WINDOW_MS = 5000;
  const RING_LENGTH = 2 * Math.PI * 52;
  let parentAction = null;
  let holdTimer = null;       // runs while the button is held
  let holdsDone = 0;          // 0, 1 (or 2 = open)
  let holdWindow = null;      // time limit for the second hold

  function setRing(part) {
    $('hold-progress').style.strokeDasharray = RING_LENGTH;
    $('hold-progress').style.strokeDashoffset = RING_LENGTH * (1 - part);
    $('hold-label').textContent = t(holdsDone === 1 ? 'parentAgain' : 'parentHold');
    $('btn-parent-hold').dataset.holds = holdsDone;
  }
  function resetHold() {
    clearInterval(holdTimer); holdTimer = null;
    clearTimeout(holdWindow); holdWindow = null;
    holdsDone = 0;
    setRing(0);
  }
  // Runs the action: straight away, or (children's app) after the parent lock.
  function guarded(action) {
    if (C.KINDER_APP !== true) { action(); return; }
    parentAction = action;
    resetHold();
    showModal('parent');
  }
  function startHold() {
    if (holdTimer) return;
    const t0 = performance.now();
    holdTimer = setInterval(() => {
      const part = Math.min(1, (performance.now() - t0) / HOLD_MS);
      setRing((holdsDone + part) / 2);
      if (part < 1) return;
      clearInterval(holdTimer); holdTimer = null;
      holdsDone++;
      if (holdsDone < 2) {                       // first hold done: now once more, in time
        setRing(0.5);
        holdWindow = setTimeout(resetHold, HOLD_WINDOW_MS);
        return;
      }
      const action = parentAction;
      parentAction = null;
      resetHold();
      hideModals();
      if (action) action();
    }, 40);
  }
  function releaseHold() {
    if (!holdTimer) return;
    clearInterval(holdTimer); holdTimer = null;
    setRing(holdsDone / 2);                      // an unfinished hold does not count
  }

  // ---------- confirming ----------
  let confirmAction = null;
  function confirmFirst(title, text, yes, action) {
    $('confirm-title').textContent = title;
    $('confirm-text').textContent = text;
    $('btn-confirm-yes').textContent = yes;
    confirmAction = action;
    showModal('confirm');
    $('btn-confirm-no').focus();                 // the safe choice has the focus
  }

  // ---------- deleting ----------
  function askDeleteProfile() {
    const p = Store.profile(Store.activeId());
    confirmFirst(t('profileDeleteTitle'), t('profileDeleteText', { name: profileName(p) }), t('profileDeleteYes'), () => {
      Store.deleteProfile(p.id);
      render();
    });
  }
  function askWipeAll() {
    confirmFirst(t('wipeTitle'), t('wipeText'), t('wipeYes'), async () => {
      await Store.wipeEverything();
      showModal('wiped');                        // nothing is written again until the user starts again
    });
  }

  // ---------- moving progress ----------
  function openTransfer(message) {
    $('transfer-code').value = '';
    $('transfer-input').value = '';
    $('transfer-file').value = '';
    $('transfer-msg').textContent = message || '';
    showModal('transfer');
  }
  function exportToBox() {
    $('transfer-code').value = Store.exportCode();
    return $('transfer-code').value;
  }
  function copyCode() {
    const code = $('transfer-code').value || exportToBox();
    const done = () => { $('transfer-msg').textContent = t('copied'); };
    const fallback = () => { $('transfer-code').select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } done(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, fallback);
    else fallback();
  }
  function askImport(code) {
    if (!Store.readCode(code)) { $('transfer-msg').textContent = t('importBad'); return; }
    confirmFirst(t('importTitle'), t('importText'), t('importYes'), () => {
      const ok = Store.importCode(code);
      const saved = Store.readSetting('language');
      if (ok && App.LANGS.includes(saved)) App.setLanguage(saved);
      render();
      openTransfer(t(ok ? 'importDone' : 'importBad'));
    });
  }

  // ---------- events ----------
  function bind() {
    on('btn-settings', 'click', () => showScreen('settings'));
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => showScreen(b.dataset.go)));

    // EXAMPLE: saving something for the active profile.
    on('btn-demo', 'click', () => {
      const progress = Store.read('progress');
      const count = progress && Number.isInteger(progress.count) ? progress.count : 0;
      Store.write('progress', { count: count + 1 });
      render();
    });

    on('btn-profile-add', 'click', () => {
      const made = Store.createProfile($('profile-name').value);
      $('profile-msg').textContent = made ? '' : t('profileFull');
      if (made) $('profile-name').value = '';
      render();
    });
    on('btn-profile-delete', 'click', () => guarded(askDeleteProfile));
    on('btn-wipe-all', 'click', () => guarded(askWipeAll));
    on('btn-transfer', 'click', () => guarded(() => openTransfer()));

    on('btn-confirm-yes', 'click', () => { const action = confirmAction; confirmAction = null; hideModals(); if (action) action(); });
    on('btn-confirm-no', 'click', () => { confirmAction = null; hideModals(); });
    on('btn-restart', 'click', () => location.reload());

    on('btn-export', 'click', exportToBox);
    on('btn-copy', 'click', copyCode);
    on('btn-file', 'click', () => { $('transfer-code').value = Store.exportFile(); $('transfer-msg').textContent = t('saved'); });
    on('btn-import', 'click', () => askImport($('transfer-input').value));
    on('transfer-file', 'change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      file.text().then(text => { $('transfer-input').value = text.trim(); askImport(text); });
    });
    on('btn-transfer-ok', 'click', hideModals);

    // Parent lock: no context menu, no text selection, no scrolling while holding.
    const hold = $('btn-parent-hold');
    hold.addEventListener('pointerdown', e => { e.preventDefault(); startHold(); });
    hold.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
    ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach(ev => hold.addEventListener(ev, releaseHold));
    ['contextmenu', 'selectstart', 'dragstart'].forEach(ev => hold.addEventListener(ev, e => e.preventDefault()));
    on('btn-parent-cancel', 'click', () => { parentAction = null; resetHold(); hideModals(); });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.modal:not([hidden])');
      if (open && open.id !== 'modal-wiped') { parentAction = null; confirmAction = null; resetHold(); hideModals(); }
    });
  }

  // ---------- service worker (offline use) ----------
  function registerSW() {
    if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
    const hadController = !!navigator.serviceWorker.controller;
    // A new version took over: load it, but only from the start screen, never
    // in the middle of something.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloadWaiting) return;
      reloadWaiting = true;
      if (currentScreen === 'start' && !document.querySelector('.modal:not([hidden])')) location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ---------- start ----------
  App.applyTheme();
  App.buildLanguageButtons();
  App.applyTexts();
  App.onLanguage(render);
  if (IS_TEST) { document.body.classList.add('is-test'); $('test-strip').hidden = false; }
  bind();
  render();
  registerSW();
})();
