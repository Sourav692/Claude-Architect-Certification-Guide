/* Client-side sync layer.
   - On boot, hydrate localStorage from /api/progress (server is authoritative).
   - Intercept localStorage writes for `enh:*` keys and PATCH them to /api/progress.
   - Queue writes when offline; flush when online.
   This file is loaded BEFORE enhance.js so the patched localStorage is in place
   by the time enhance.js reads from it.
*/
(function () {
  'use strict';

  const PREFIX = 'enh:';
  const PENDING_KEY = '__enhSyncQueue__';
  const HYDRATED_FLAG = '__enhSyncHydrated__';
  const DEBOUNCE_MS = 350;

  // Public state object that enhance.js can read
  const sync = window.enhSync = {
    user: null,
    ready: false,
    hydrated: false,
    online: navigator.onLine !== false,
    error: null
  };

  /* ───── localStorage interception ───── */
  const _setItem = localStorage.setItem.bind(localStorage);
  const _removeItem = localStorage.removeItem.bind(localStorage);

  let pending = {};
  let flushTimer = null;
  // Avoid echoing server-hydrated writes back to the server.
  let suppress = false;

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, DEBOUNCE_MS);
  }

  async function flush() {
    flushTimer = null;
    if (!sync.user) return;                    // not signed in → keep queueing
    const payload = pending; pending = {};
    if (!Object.keys(payload).length) return;
    try {
      const r = await fetch('/api/progress', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      sync.error = null;
    } catch (err) {
      // Put updates back at the front of the queue.
      pending = Object.assign({}, payload, pending);
      sync.error = err.message || String(err);
      // Persist queue across page loads.
      try { _setItem(PENDING_KEY, JSON.stringify(pending)); } catch {}
      // Retry on next online event or after delay.
      setTimeout(scheduleFlush, 5000);
    }
  }

  localStorage.setItem = function (key, value) {
    _setItem(key, value);
    if (suppress || !key.startsWith(PREFIX)) return;
    try {
      pending[key] = JSON.parse(value);
    } catch {
      pending[key] = value;                    // raw string
    }
    scheduleFlush();
  };

  localStorage.removeItem = function (key) {
    _removeItem(key);
    if (suppress || !key.startsWith(PREFIX)) return;
    pending[key] = null;                       // null → delete on server
    scheduleFlush();
  };

  /* ───── hydration ───── */
  async function hydrate() {
    try {
      const meR = await fetch('/api/me', { credentials: 'include' });
      if (meR.status === 401) { sync.ready = true; return; }
      if (!meR.ok) throw new Error('HTTP ' + meR.status);
      sync.user = await meR.json();
    } catch (err) {
      sync.error = err.message || String(err);
      sync.ready = true;
      return;
    }

    // Replay any pending queue that survived a reload.
    try {
      const stored = localStorage.getItem(PENDING_KEY);
      if (stored) {
        pending = Object.assign({}, JSON.parse(stored), pending);
        _removeItem(PENDING_KEY);
        scheduleFlush();
      }
    } catch {}

    try {
      const r = await fetch('/api/progress', { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        suppress = true;
        // Server wins for any key it knows about; local-only keys are pushed up.
        const localOnly = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith(PREFIX)) continue;
          if (!(k in data)) {
            try { localOnly[k] = JSON.parse(localStorage.getItem(k)); }
            catch { localOnly[k] = localStorage.getItem(k); }
          }
        }
        // Skip any key that the current tab has a newer write queued for —
        // otherwise hydration would clobber unsaved local changes.
        Object.entries(data).forEach(([k, v]) => {
          if (k in pending) return;
          _setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        });
        suppress = false;
        sync.hydrated = true;
        if (Object.keys(localOnly).length) {
          pending = Object.assign(localOnly, pending);
          scheduleFlush();
        }
      }
    } catch (err) {
      sync.error = err.message || String(err);
    }
    sync.ready = true;
    document.dispatchEvent(new CustomEvent('enh-sync-ready', { detail: sync }));
  }

  window.addEventListener('online',  () => { sync.online = true;  scheduleFlush(); });
  window.addEventListener('offline', () => { sync.online = false; });
  window.addEventListener('beforeunload', () => {
    if (Object.keys(pending).length) {
      try { _setItem(PENDING_KEY, JSON.stringify(pending)); } catch {}
    }
  });

  // Kick off hydration immediately.
  hydrate();
})();
