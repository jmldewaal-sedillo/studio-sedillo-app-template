/* ============================================================
   {{APP_NAAM}} – storage.js
   The only place where this app stores anything. Nothing else in the app may
   call localStorage, caches or indexedDB directly (tests/opslag.spec.js checks).

   Every key starts with PREFIX. Keys in use (keep docs/privacy-audit.md in step):
       {{SLUG}}.settings                 settings of this device (language)
       {{SLUG}}.profiles                 list of profiles and which one is active
       {{SLUG}}.profile.<id>.<part>      what one profile saved, e.g. "progress"

   Keys never change once the app is live. If one must change: add a migration
   that reads the old key and writes the new one, and a test that proves it.
   ============================================================ */
(function (root) {
  'use strict';

  const SLUG = '{{SLUG}}';
  const PREFIX = SLUG + '.';
  const CODE_PREFIX = SLUG + '1.';        // start of a transfer code; the 1 is the format version
  const MAX_PROFILES = 6;
  const MAX_NAME = 20;
  const MAX_CODE = 2000000;               // characters; a code can come from anywhere
  const PART = /^[a-z0-9][a-z0-9-]{0,39}$/;
  const SHORT_KEY = /^[a-z0-9][a-z0-9._-]{0,99}$/;

  function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

  // ---------- raw access: always with the prefix ----------
  function fullKey(name) {
    if (typeof name !== 'string' || !SHORT_KEY.test(name)) throw new Error('storage: invalid key "' + name + '"');
    return PREFIX + name;
  }
  function get(name) {
    try { const raw = localStorage.getItem(fullKey(name)); return raw === null ? null : JSON.parse(raw); }
    catch (e) { if (/invalid key/.test(e.message)) throw e; return null; }   // private mode / blocked storage / broken data
  }
  function set(name, value) {
    const key = fullKey(name);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ }
  }
  function del(name) {
    const key = fullKey(name);
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }
  // Every key this app has written on this device.
  function keys() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) out.push(k); } } catch (e) { /* ignore */ }
    return out.sort();
  }

  // ---------- profiles ----------
  // Without a saved list there is exactly one profile: p1.
  let index = null;
  function loadIndex() {
    const saved = get('profiles');
    const list = isPlainObject(saved) && Array.isArray(saved.list)
      ? saved.list.filter(p => isPlainObject(p) && typeof p.id === 'string' && /^p\d{1,6}$/.test(p.id)).slice(0, MAX_PROFILES)
          .map(p => ({ id: p.id, name: typeof p.name === 'string' ? p.name.slice(0, MAX_NAME) : '' }))
      : [];
    if (!list.length) list.push({ id: 'p1', name: '' });
    const highest = Math.max(...list.map(p => +p.id.slice(1)));
    index = {
      v: 1,
      active: isPlainObject(saved) && list.some(p => p.id === saved.active) ? saved.active : list[0].id,
      next: Math.max(isPlainObject(saved) && Number.isInteger(saved.next) ? saved.next : 2, highest + 1),
      list,
    };
    return index;
  }
  function idx() { return index || loadIndex(); }
  function saveIndex() { set('profiles', index); }
  function partKey(id, part) {
    if (typeof part !== 'string' || !PART.test(part)) throw new Error('storage: invalid part "' + part + '"');
    return 'profile.' + id + '.' + part;
  }

  const api = {
    SLUG, PREFIX, MAX_PROFILES, MAX_NAME,

    // ----- settings of this device (not tied to a profile) -----
    readSetting(name) { const s = get('settings'); return isPlainObject(s) && name in s ? s[name] : null; },
    writeSetting(name, value) {
      const s = get('settings');
      const next = isPlainObject(s) ? s : {};
      next[name] = value;
      set('settings', next);
    },

    // ----- profiles -----
    profiles() { return idx().list.map(p => ({ id: p.id, name: p.name })); },
    activeId() { return idx().active; },
    profile(id) { return idx().list.find(p => p.id === id) || null; },
    setActive(id) { if (this.profile(id)) { index.active = id; saveIndex(); return true; } return false; },
    createProfile(name) {
      if (idx().list.length >= MAX_PROFILES) return null;
      const p = { id: 'p' + index.next++, name: String(name || '').trim().slice(0, MAX_NAME) };
      index.list.push(p);
      index.active = p.id;
      saveIndex();
      return { id: p.id, name: p.name };
    },
    renameProfile(id, name) {
      const p = this.profile(id);
      if (!p) return false;
      p.name = String(name || '').trim().slice(0, MAX_NAME);
      saveIndex();
      return true;
    },
    // Removes one profile and everything it saved. Other profiles are untouched.
    // Was it the last one, then a new, empty profile takes its place.
    deleteProfile(id) {
      if (!this.profile(id)) return false;
      const start = PREFIX + 'profile.' + id + '.';
      keys().filter(k => k.startsWith(start)).forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
      index.list = index.list.filter(p => p.id !== id);
      if (!index.list.length) index.list.push({ id: 'p' + index.next++, name: '' });
      if (index.active === id) index.active = index.list[0].id;
      saveIndex();
      return true;
    },

    // ----- what a profile saves (default: the active profile) -----
    read(part, id) { return get(partKey(id || this.activeId(), part)); },
    write(part, value, id) { set(partKey(id || this.activeId(), part), value); },
    remove(part, id) { del(partKey(id || this.activeId(), part)); },

    // ----- deleting everything -----
    keys,
    // All data of this app in localStorage.
    wipeAll() {
      keys().forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
      index = null;
    },
    // "Delete all data of this app": localStorage, the files kept for offline
    // use (every cache of this address) and the service worker. The address
    // belongs to this app alone, so nothing of another app can be hit.
    async wipeEverything() {
      this.wipeAll();
      try {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      } catch (e) { /* no caches */ }
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      } catch (e) { /* no service worker */ }
    },

    // ----- moving progress to another device -----
    // Everything this app saved, as one text ("code"). Nothing is sent
    // anywhere: the user copies the code or saves it as a file.
    exportCode() {
      const data = {};
      keys().forEach(k => {
        try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) { /* broken value: leave it out */ }
      });
      return CODE_PREFIX + toBase64(JSON.stringify({ app: SLUG, v: 1, when: Date.now(), data }));
    },
    exportFileName() { return SLUG + '-voortgang.txt'; },
    // Offers the code as a file to save. Returns the code.
    exportFile() {
      const code = this.exportCode();
      const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = this.exportFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return code;
    },
    // Reads a code. Returns the checked data { shortKey: value }, or null if
    // it is not a valid code of this app.
    readCode(code) {
      try {
        const text = String(code || '').replace(/\s+/g, '');
        if (!text.startsWith(CODE_PREFIX) || text.length > MAX_CODE) return null;
        const parsed = JSON.parse(fromBase64(text.slice(CODE_PREFIX.length)));
        if (!isPlainObject(parsed) || parsed.app !== SLUG || parsed.v !== 1 || !isPlainObject(parsed.data)) return null;
        const out = {};
        Object.keys(parsed.data).forEach(k => { if (SHORT_KEY.test(k) && parsed.data[k] !== undefined) out[k] = parsed.data[k]; });
        // App-specific check of the contents: set AppStorage.cleanImport = data => data (or null to refuse).
        return typeof api.cleanImport === 'function' ? api.cleanImport(out) : out;
      } catch (e) { return null; }
    },
    // Replaces everything on this device with the contents of the code.
    // Returns false (and changes nothing) if the code is not valid.
    importCode(code) {
      const data = this.readCode(code);
      if (!data) return false;
      this.wipeAll();
      Object.keys(data).forEach(k => set(k, data[k]));
      index = null;
      return true;
    },
    cleanImport: null,
  };

  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromBase64(text) {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  root.AppStorage = api;
})(typeof window !== 'undefined' ? window : globalThis);
