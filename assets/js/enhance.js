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

    // Dashboard on the home page only.
    if (currentPath === 'index.html' || currentPath === '') {
      buildDashboard();
    }
  }

  /* ─────────── dashboard ─────────── */
  const DOMAINS = [
    { d: 1, name: 'Architecture & Orchestration', study: 'domain1_study_guide.html' },
    { d: 2, name: 'Workflow & Orchestration',     study: 'domain2_study_guide.html' },
    { d: 3, name: 'Tools & Permissions',          study: 'domain3_study_guide.html' },
    { d: 4, name: 'Automation',                   study: 'domain4_study_guide.html' },
    { d: 5, name: 'Reliability & Production',     study: 'domain5_study_guide.html' }
  ];
  function pagesForDomain(d) {
    return PAGES.filter(p => p.section === 'Domain ' + d);
  }

  function computeReadiness(attempts, visited) {
    // Weighted: 60% recent mock attempts (last 3), 40% page coverage
    let mockScore = null;
    if (attempts.length) {
      const recent = attempts.slice(0, 3);
      mockScore = recent.reduce((a, b) => a + b.pct, 0) / recent.length;
    }
    const total = PAGES.length;
    const seen = Object.keys(visited).filter(u => PAGES.some(p => p.url === u)).length;
    const coverage = (seen / total) * 100;
    if (mockScore === null) return Math.round(coverage * 0.6); // discount until they take an exam
    return Math.round(mockScore * 0.6 + coverage * 0.4);
  }

  function fmtRel(ts) {
    const diff = Date.now() - ts;
    const day = 86400000;
    if (diff < day)         return 'Today';
    if (diff < 2 * day)     return 'Yesterday';
    if (diff < 7 * day)     return Math.floor(diff / day) + 'd ago';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function buildDashboard() {
    const visited = getVisited();
    let attempts = [];
    try { attempts = JSON.parse(localStorage.getItem('enh:attempts:mock') || '[]'); } catch {}

    // Find continue-target: last visited page that isn't index.html itself
    let continueTarget = null, continueTs = 0;
    Object.entries(visited).forEach(([url, ts]) => {
      if (url === 'index.html' || url === '') return;
      if (ts > continueTs) { continueTs = ts; continueTarget = url; }
    });
    const cPage = continueTarget && PAGES.find(p => p.url === continueTarget);

    const readiness = computeReadiness(attempts, visited);
    const passRead = readiness >= 72;
    const circ = 2 * Math.PI * 28;
    const offset = circ * (1 - readiness / 100);

    // Per-domain rows
    const domainHtml = DOMAINS.map(D => {
      const pages = pagesForDomain(D.d);
      const seen = pages.filter(p => visited[p.url]).length;
      const coverPct = pages.length ? (seen / pages.length) * 100 : 0;

      // Most-recent mock score for this domain (if any)
      let mockPct = null;
      for (const a of attempts) {
        if (a.perDomain && a.perDomain[D.d]) {
          const pd = a.perDomain[D.d];
          mockPct = Math.round((pd.correct / pd.total) * 100);
          break;
        }
      }
      const shownPct = mockPct !== null ? mockPct : Math.round(coverPct);
      const cls = shownPct >= 80 ? 'pass' : shownPct >= 50 ? 'warn' : '';
      const sub = mockPct !== null ? `${mockPct}% mock` : `${seen}/${pages.length} read`;
      return `
        <div class="enh-dash-domain">
          <span><a href="${D.study}">Domain ${D.d}</a></span>
          <div class="dom-bar"><div class="dom-bar-fill ${cls}" style="width:${shownPct}%"></div></div>
          <span class="dom-pct"><strong>${shownPct}%</strong> · ${sub}</span>
        </div>
      `;
    }).join('');

    const continueHtml = cPage ? `
      <a class="enh-dash-continue" href="${cPage.url}">
        <div class="label">Continue where you left off</div>
        <div class="title">${escapeHtml(cPage.title)}</div>
        <div class="meta">${cPage.section} · ${cPage.tag} · last opened ${fmtRel(continueTs)}</div>
      </a>
    ` : '';

    const attemptsHtml = attempts.length ? `
      <div class="enh-dash-attempts-label">Recent mock attempts</div>
      ${attempts.slice(0, 3).map(a => `
        <div class="enh-dash-attempt">
          <span class="d">${fmtRel(a.ts)}</span>
          <span class="s">${a.correct}/${a.total} · ${(a.mode||'study')}</span>
          <span class="p ${a.pct >= 72 ? 'pass' : 'fail'}">${a.pct}%</span>
        </div>
      `).join('')}
    ` : `
      <div class="enh-dash-attempts-label">Recent mock attempts</div>
      <div class="enh-dash-empty">No exam attempts yet — try the timed mock exam.</div>
    `;

    const readinessLabel = attempts.length ? 'based on recent mocks + coverage' : 'based on page coverage';

    const section = document.createElement('section');
    section.className = 'enh-dash';
    section.innerHTML = `
      <div class="enh-dash-card">
        <div class="enh-dash-head">
          <div>
            <div class="enh-dash-eyebrow">Your progress · Edition 2026</div>
            <div class="enh-dash-title">Readiness <em>at a glance.</em></div>
          </div>
          <div class="enh-dash-readiness">
            <div class="enh-dash-readiness-dial ${passRead ? 'pass' : ''}">
              <svg viewBox="0 0 64 64">
                <circle class="track" cx="32" cy="32" r="28"/>
                <circle class="fill" cx="32" cy="32" r="28"
                        stroke-dasharray="${circ.toFixed(2)}"
                        stroke-dashoffset="${circ.toFixed(2)}"
                        data-offset="${offset.toFixed(2)}"/>
              </svg>
              <div class="enh-dash-readiness-num">${readiness}</div>
            </div>
            <div class="enh-dash-readiness-meta">
              <span class="label">Readiness</span>
              <span class="val">${readinessLabel}</span>
            </div>
          </div>
        </div>
        <div class="enh-dash-body">
          <div>
            <div class="enh-dash-domains-label">Per-domain progress</div>
            ${domainHtml}
          </div>
          <div>
            ${continueHtml || ''}
            ${attemptsHtml}
            <div class="enh-dash-actions">
              <a class="primary" href="mock_exam.html">Take mock exam</a>
              <a href="anti_patterns.html">Anti-patterns</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert after the hero, before the existing stats strip — fall back to body prepend.
    const hero = document.querySelector('.hero');
    if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(section, hero.nextSibling);
    } else {
      document.body.insertBefore(section, document.body.firstChild.nextSibling);
    }

    // animate dial
    requestAnimationFrame(() => {
      const fill = section.querySelector('.enh-dash-readiness-dial .fill');
      if (fill) fill.style.strokeDashoffset = fill.dataset.offset;
    });
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
