/* Enhancement layer · Phase 1
   Top bar · ⌘K search · dark mode · TOC sidebar · progress · visited tracking
*/
(function () {
  'use strict';

  const PAGES = [
    { url: 'index.html',                title: 'Home',                       section: 'Overview',  tag: 'HOME' },
    { url: 'domain1_study_guide.html',  title: 'Architecture & Orchestration', section: 'Domain 1',  tag: 'STUDY' },
    { url: 'domain1_practice.html',     title: 'Practice Questions',         section: 'Domain 1',  tag: 'PRACTICE' },
    { url: 'domain1_build_exercise.html', title: 'Build Exercise',           section: 'Domain 1',  tag: 'BUILD' },
    { url: 'domain2_study_guide.html',  title: 'Workflow & Orchestration',   section: 'Domain 2',  tag: 'STUDY' },
    { url: 'domain2_practice.html',     title: 'Practice Questions',         section: 'Domain 2',  tag: 'PRACTICE' },
    { url: 'domain2_build_exercise.html', title: 'Build Exercise',           section: 'Domain 2',  tag: 'BUILD' },
    { url: 'domain3_study_guide.html',  title: 'Tools & Permissions',        section: 'Domain 3',  tag: 'STUDY' },
    { url: 'domain3_practice.html',     title: 'Practice Questions',         section: 'Domain 3',  tag: 'PRACTICE' },
    { url: 'domain3_build_exercise.html', title: 'Build Exercise',           section: 'Domain 3',  tag: 'BUILD' },
    { url: 'domain4_study_guide.html',  title: 'Automation',                 section: 'Domain 4',  tag: 'STUDY' },
    { url: 'domain4_practice.html',     title: 'Practice Questions',         section: 'Domain 4',  tag: 'PRACTICE' },
    { url: 'domain4_build_exercise.html', title: 'Build Exercise',           section: 'Domain 4',  tag: 'BUILD' },
    { url: 'domain5_study_guide.html',  title: 'Reliability & Production',   section: 'Domain 5',  tag: 'STUDY' },
    { url: 'domain5_practice.html',     title: 'Practice Questions',         section: 'Domain 5',  tag: 'PRACTICE' },
    { url: 'domain5_build_exercise.html', title: 'Build Exercise',           section: 'Domain 5',  tag: 'BUILD' },
    { url: 'anti_patterns.html',        title: 'Anti-Patterns Catalog',      section: 'Reference', tag: 'REF' },
    { url: 'mock_exam.html',            title: 'Mock Exam',                  section: 'Reference', tag: 'EXAM' }
  ];

  const STORAGE = {
    theme:   'enh:theme',
    visited: 'enh:visited',
    index:   'enh:searchIndex:v1'
  };

  const currentPath = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  /* ─────────── theme ─────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
  }
  function getTheme() {
    return localStorage.getItem(STORAGE.theme) ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  applyTheme(getTheme()); // run early to avoid flash

  /* ─────────── visited tracking ─────────── */
  function getVisited() {
    try { return JSON.parse(localStorage.getItem(STORAGE.visited) || '{}'); } catch { return {}; }
  }
  function markVisited(url) {
    const v = getVisited();
    v[url] = Date.now();
    localStorage.setItem(STORAGE.visited, JSON.stringify(v));
  }
  function visitedCount() { return Object.keys(getVisited()).length; }

  /* ─────────── DOM build ─────────── */
  function svg(path, opts) {
    opts = opts || {};
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${opts.sw || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }
  const ICON = {
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    sun:    svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'),
    moon:   svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>'),
    caret:  svg('<path d="m6 9 6 6 6-6"/>')
  };

  function build() {
    document.body.classList.add('enh-ready');

    // progress bar
    const prog = document.createElement('div');
    prog.className = 'enh-progress';
    document.body.appendChild(prog);

    // top bar
    const visited = getVisited();
    const groups = {};
    PAGES.forEach(p => { (groups[p.section] = groups[p.section] || []).push(p); });

    const navHtml = Object.keys(groups).map(section => `
      <div class="enh-nav-group" data-group>
        <button class="enh-nav-trigger" aria-expanded="false">${section} ${ICON.caret}</button>
        <div class="enh-nav-menu" role="menu">
          ${groups[section].map(p => `
            <a href="${p.url}" class="${visited[p.url] ? 'visited' : ''}" ${currentPath === p.url ? 'aria-current="page"' : ''}>
              <span class="enh-row-left">
                <span class="enh-visited" aria-label="visited"></span>
                <span>${p.title}</span>
              </span>
              <span class="enh-tag">${p.tag}</span>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');

    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    const keyHint = isMac ? '⌘K' : 'Ctrl K';

    const total = PAGES.length;
    const done = visitedCount();
    const pct = Math.round((done / total) * 100);
    const circ = 2 * Math.PI * 5;
    const offset = circ * (1 - done / total);

    const bar = document.createElement('header');
    bar.className = 'enh-topbar';
    bar.innerHTML = `
      <div class="enh-topbar-inner">
        <a class="enh-brand" href="index.html">
          <span class="enh-brand-mark">A</span>
          <span class="enh-brand-name">Anthrop<em>\\</em>c</span>
          <span class="enh-brand-volume">Foundations · 2026</span>
        </a>
        <nav class="enh-nav" aria-label="Course sections">${navHtml}</nav>
        <span class="enh-spacer"></span>
        <div class="enh-tools">
          <span class="enh-progress-chip" title="Pages visited">
            <span class="enh-progress-chip-dot">
              <svg viewBox="0 0 14 14"><circle class="track" cx="7" cy="7" r="5"/><circle class="fill" cx="7" cy="7" r="5" stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/></svg>
            </span>
            <span>${done}/${total}</span>
          </span>
          <button class="enh-btn" data-action="search" aria-label="Search">
            ${ICON.search}<span class="enh-btn-label">Search</span><kbd>${keyHint}</kbd>
          </button>
          <button class="enh-btn enh-icon-btn" data-action="theme" aria-label="Toggle theme">
            <span data-theme-icon></span>
          </button>
        </div>
      </div>
    `;
    document.body.prepend(bar);

    // search modal
    const modal = document.createElement('div');
    modal.className = 'enh-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Search the course');
    modal.innerHTML = `
      <div class="enh-search">
        <input class="enh-search-input" type="search" role="combobox"
               aria-expanded="true" aria-controls="enh-search-list" aria-autocomplete="list"
               placeholder="Search across every domain, exercise, and question…"
               autocomplete="off" spellcheck="false">
        <div class="enh-search-results" id="enh-search-list" role="listbox"></div>
        <div class="enh-search-footer">
          <span class="group"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span class="group"><kbd>↵</kbd> open</span>
          <span class="group"><kbd>esc</kbd> close</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    refreshThemeIcon();
    wireEvents(modal);
    buildTocSidebar();
    wireProgress(prog);
    markVisited(currentPath);

    // Pre-warm search index in the background so first ⌘K is instant.
    const idle = window.requestIdleCallback || (cb => setTimeout(cb, 1200));
    idle(() => { ensureIndex().catch(() => {}); });
  }

  /* ─────────── theme icon ─────────── */
  function refreshThemeIcon() {
    const slot = document.querySelector('[data-theme-icon]');
    if (!slot) return;
    slot.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? ICON.sun : ICON.moon;
  }

  /* ─────────── events ─────────── */
  function wireEvents(modal) {
    // dropdown open/close
    document.querySelectorAll('[data-group]').forEach(g => {
      const trigger = g.querySelector('.enh-nav-trigger');
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = g.classList.contains('open');
        document.querySelectorAll('[data-group].open').forEach(o => {
          o.classList.remove('open');
          o.querySelector('.enh-nav-trigger').setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          g.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('[data-group].open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.enh-nav-trigger').setAttribute('aria-expanded', 'false');
      });
    });

    // theme toggle
    document.querySelector('[data-action="theme"]').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE.theme, next);
      applyTheme(next);
      refreshThemeIcon();
    });

    // search open / close with focus management
    let lastFocus = null;
    const openSearch = () => {
      lastFocus = document.activeElement;
      modal.classList.add('open');
      const input = modal.querySelector('.enh-search-input');
      input.focus();
      input.select();
      ensureIndex().then(() => renderResults(modal, input.value));
    };
    const closeSearch = () => {
      if (!modal.classList.contains('open')) return;
      modal.classList.remove('open');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    };
    document.querySelector('[data-action="search"]').addEventListener('click', openSearch);

    // keyboard shortcuts
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); openSearch();
      } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !modal.classList.contains('open')) {
        e.preventDefault(); openSearch();
      } else if (e.key === 'Escape' && modal.classList.contains('open')) {
        e.preventDefault(); closeSearch();
      }
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) closeSearch();
    });

    // focus trap: while modal is open, keep focus inside .enh-search
    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusables = modal.querySelectorAll('input, a, button, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    // search input
    const input = modal.querySelector('.enh-search-input');
    let activeIdx = 0;
    input.addEventListener('input', () => {
      activeIdx = 0;
      renderResults(modal, input.value);
    });
    input.addEventListener('keydown', e => {
      const results = modal.querySelectorAll('.enh-result');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, results.length - 1);
        highlight(results, activeIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        highlight(results, activeIdx);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[activeIdx]) location.href = results[activeIdx].getAttribute('href');
      }
    });
  }

  function highlight(nodes, i) {
    nodes.forEach((n, idx) => {
      const active = idx === i;
      n.setAttribute('data-active', active ? 'true' : 'false');
      if (active) n.scrollIntoView({ block: 'nearest' });
    });
  }

  /* ─────────── search index ─────────── */
  let INDEX = null;
  let indexPromise = null;

  function ensureIndex() {
    if (INDEX) return Promise.resolve(INDEX);
    if (indexPromise) return indexPromise;

    try {
      const cached = sessionStorage.getItem(STORAGE.index);
      if (cached) { INDEX = JSON.parse(cached); return Promise.resolve(INDEX); }
    } catch {}

    indexPromise = Promise.all(PAGES.map(p =>
      fetch(p.url).then(r => r.text()).then(html => indexPage(p, html)).catch(() => [])
    )).then(arr => {
      INDEX = arr.flat();
      try { sessionStorage.setItem(STORAGE.index, JSON.stringify(INDEX)); } catch {}
      return INDEX;
    });
    return indexPromise;
  }

  function indexPage(page, html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Remove scripts/styles
    doc.querySelectorAll('script, style, noscript').forEach(n => n.remove());

    const docs = [];
    // Page-level entry
    docs.push({
      url: page.url, hash: '',
      title: page.title, crumb: `${page.section} · ${page.tag}`,
      text: (doc.querySelector('.hero-lede')?.textContent || doc.querySelector('h1')?.textContent || '').trim()
    });

    // Section-level entries: any element with id and a heading
    doc.querySelectorAll('section[id], div[id]').forEach(sec => {
      const id = sec.getAttribute('id');
      if (!id) return;
      const h = sec.querySelector('h2, h3');
      const title = (h?.textContent || '').trim().replace(/\s+/g, ' ');
      if (!title) return;
      const text = (sec.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
      docs.push({
        url: page.url, hash: '#' + id,
        title, crumb: `${page.section} · ${page.title}`,
        text
      });
    });
    return docs;
  }

  function renderResults(modal, q) {
    const box = modal.querySelector('.enh-search-results');
    q = (q || '').trim();
    if (!INDEX) {
      box.innerHTML = '<div class="enh-search-empty loading">Building index</div>';
      return;
    }
    if (!q) {
      // show grouped page list
      const groups = {};
      INDEX.filter(d => !d.hash).forEach(d => { (groups[d.crumb.split(' · ')[0]] = groups[d.crumb.split(' · ')[0]] || []).push(d); });
      box.innerHTML = Object.keys(groups).slice(0, 8).map(g => groups[g].map(d => `
        <a class="enh-result" role="option" href="${d.url}${d.hash}">
          <div class="enh-result-crumb">${d.crumb}</div>
          <div class="enh-result-title">${escapeHtml(d.title)}</div>
          <div class="enh-result-snippet">${escapeHtml(d.text.slice(0, 160))}</div>
        </a>
      `).join('')).join('');
      const first = box.querySelector('.enh-result');
      if (first) first.setAttribute('data-active', 'true');
      return;
    }

    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = [];
    for (const d of INDEX) {
      const hay = (d.title + ' ' + d.text + ' ' + d.crumb).toLowerCase();
      let score = 0;
      for (const t of terms) {
        const inTitle = d.title.toLowerCase().includes(t);
        const inText = hay.includes(t);
        if (!inText) { score = -1; break; }
        score += inTitle ? 10 : 1;
      }
      if (score > 0) scored.push({ d, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 30);

    if (!top.length) {
      box.innerHTML = `<div class="enh-search-empty">No matches for "${escapeHtml(q)}"</div>`;
      return;
    }
    box.innerHTML = top.map(({ d }) => {
      const snippet = makeSnippet(d.text, terms);
      return `
        <a class="enh-result" role="option" href="${d.url}${d.hash}">
          <div class="enh-result-crumb">${d.crumb}</div>
          <div class="enh-result-title">${highlightTerms(d.title, terms)}</div>
          <div class="enh-result-snippet">${snippet}</div>
        </a>
      `;
    }).join('');
    const first = box.querySelector('.enh-result');
    if (first) first.setAttribute('data-active', 'true');
  }

  function makeSnippet(text, terms) {
    const lc = text.toLowerCase();
    let idx = -1;
    for (const t of terms) { idx = lc.indexOf(t); if (idx >= 0) break; }
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, start + 220);
    const slice = (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
    return highlightTerms(slice, terms);
  }
  function highlightTerms(str, terms) {
    let out = escapeHtml(str);
    for (const t of terms) {
      const re = new RegExp('(' + t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    }
    return out;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  /* ─────────── TOC sidebar ─────────── */
  function slugify(s) {
    return 'sec-' + (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  }
  function buildTocSidebar() {
    // Strategy: collect every h2 (and any explicit-id h3) on the page.
    // Ensure each has an id (use parent section's id if present, else slugify).
    // This works for study guides, practice, build exercises, anti-patterns, index.
    const entries = [];
    const seen = new Set();
    const usedIds = new Set();

    const h2s = Array.from(document.querySelectorAll('main h2, body h2'))
      .filter(h => !h.closest('.enh-topbar, .enh-modal, .enh-toc-side, .masthead, .module-nav, footer'));

    h2s.forEach((h2, i) => {
      let id = h2.id || h2.closest('section[id], article[id], div[id]')?.id;
      if (!id) {
        id = slugify(h2.textContent) || 'sec-' + (i + 1);
        let unique = id, n = 2;
        while (usedIds.has(unique) || document.getElementById(unique)) { unique = id + '-' + n++; }
        id = unique;
        h2.id = id;
      }
      usedIds.add(id);
      const label = h2.textContent.trim().replace(/\s+/g, ' ');
      if (!label || seen.has(id)) return;
      seen.add(id);
      entries.push({ id, level: 2, label });

      // sub-headings within the same logical block
      const block = h2.closest('section, article, div') || h2.parentElement;
      if (!block) return;
      const subs = block.querySelectorAll('h3.subhead, h3[id]');
      subs.forEach((h3, j) => {
        if (!h3.id) h3.id = id + '-sub-' + (j + 1);
        const sl = h3.textContent.trim().replace(/\s+/g, ' ');
        if (!sl || seen.has(h3.id)) return;
        seen.add(h3.id);
        entries.push({ id: h3.id, level: 3, label: sl });
      });
    });
    if (entries.length < 3) return;

    const aside = document.createElement('aside');
    aside.className = 'enh-toc-side';
    aside.setAttribute('aria-label', 'On this page');
    aside.innerHTML = `
      <div class="enh-toc-side-label">On this page</div>
      ${entries.map(e => `<a href="#${e.id}" data-level="${e.level}" data-id="${e.id}">${escapeHtml(e.label)}</a>`).join('')}
    `;
    document.body.appendChild(aside);

    const links = Array.from(aside.querySelectorAll('a'));
    const map = new Map(links.map(a => [a.dataset.id, a]));

    const io = new IntersectionObserver(ents => {
      ents.forEach(en => {
        const a = map.get(en.target.id);
        if (!a) return;
        if (en.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          a.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    entries.forEach(e => {
      const el = document.getElementById(e.id);
      if (el) io.observe(el);
    });
  }

  /* ─────────── reading progress ─────────── */
  function wireProgress(bar) {
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + '%';
    };
    document.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ─────────── boot ─────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
