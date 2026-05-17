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
    { url: 'mock_exam.html',            title: 'Mock Exam',                  section: 'Reference', tag: 'EXAM' },
    { url: 'flashcards.html',           title: 'Flashcards',                 section: 'Reference', tag: 'CARDS' },
    { url: 'report.html',               title: 'Readiness Report',           section: 'Reference', tag: 'REPORT' }
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

  /* ═══════════ Phase 3 ═══════════ */

  /* ─── PWA: manifest link + service worker ─── */
  function installPwa() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link');
      l.rel = 'manifest';
      l.href = 'assets/manifest.webmanifest';
      document.head.appendChild(l);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.content = '#C72D1A';
      document.head.appendChild(m);
    }
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', () => {
        // Registered at site root so the SW's default scope covers every page.
        navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
      });
    }
  }

  /* ─── Keyboard shortcuts + help overlay ─── */
  const SHORTCUTS = [
    { keys: '?',     desc: 'Show this help' },
    { keys: '/',     desc: 'Focus search' },
    { keys: 'g h',   desc: 'Go to home' },
    { keys: 'g 1\u20135', desc: 'Go to a domain study guide' },
    { keys: 'g m',   desc: 'Go to mock exam' },
    { keys: 'g f',   desc: 'Go to flashcards' },
    { keys: 'g r',   desc: 'Go to readiness report' },
    { keys: 'g a',   desc: 'Go to anti-patterns' },
    { keys: 't',     desc: 'Toggle light / dark theme' },
    { keys: 'N',     desc: 'Save current selection as a note (study pages)' },
    { keys: 'b',     desc: 'Open the notes panel (study pages)' },
    { keys: 'Esc',   desc: 'Close any open overlay' }
  ];
  const SHORTCUTS_EXAM = [
    { keys: '1\u20134', desc: 'Pick answer A\u2013D' },
    { keys: 'F',     desc: 'Flag question for review' },
    { keys: 'N / J', desc: 'Next question' },
    { keys: 'P / K', desc: 'Previous question' },
    { keys: 'S',     desc: 'Submit / review' }
  ];

  let lastKeyTs = 0, lastKey = '';
  function wireKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || tag === 'select' ||
                        (e.target && e.target.isContentEditable);
      if (isEditing) return;

      // Help overlay toggle
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault(); toggleHelpOverlay(); return;
      }
      if (e.key === 'Escape') {
        if (document.getElementById('enhHelpOverlay')) { closeHelpOverlay(); return; }
        if (document.getElementById('enhNotesPanel'))  { closeNotesPanel();  return; }
      }
      if (e.key === '/') {
        e.preventDefault();
        const btn = document.querySelector('.enh-btn[data-action="search"]');
        if (btn) btn.click();
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE.theme, next);
        return;
      }

      // Notes shortcuts (study guide pages only)
      if (/_study_guide\.html$/.test(currentPath)) {
        if (e.key === 'N') {
          const sel = window.getSelection();
          const text = sel && sel.toString().trim();
          if (text && text.length >= 6 && text.length <= 400) {
            e.preventDefault();
            const anchor = findAnchor(sel.anchorNode);
            const notes = getNotes();
            notes.unshift({ id: 'n-' + Date.now(), page: currentPath, anchor, body: text, ts: Date.now() });
            saveNotes(notes);
            refreshNotesCount();
            renderNotesPanel();
            flashToast('Note saved');
            return;
          }
        }
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault(); toggleNotesPanel(); return;
        }
      }

      // Mock-exam quiz takes priority over global nav sequences
      const onMockQuiz = currentPath === 'mock_exam.html' &&
        document.getElementById('quizCard')?.classList.contains('show');

      // Two-key sequences starting with "g" (suppressed while taking the quiz
      // so answer keys 1-4 can't be preempted by a "g 1" navigation race).
      const now = Date.now();
      if (!onMockQuiz) {
        if (lastKey === 'g' && (now - lastKeyTs) < 1200) {
          lastKey = ''; lastKeyTs = 0;
          const dest = ({
            h: 'index.html',
            m: 'mock_exam.html',
            f: 'flashcards.html',
            r: 'report.html',
            a: 'anti_patterns.html',
            '1': 'domain1_study_guide.html',
            '2': 'domain2_study_guide.html',
            '3': 'domain3_study_guide.html',
            '4': 'domain4_study_guide.html',
            '5': 'domain5_study_guide.html'
          })[e.key];
          if (dest) { e.preventDefault(); location.href = dest; }
          return;
        }
        if (e.key === 'g') { lastKey = 'g'; lastKeyTs = now; return; }
      }

      // Mock-exam-specific shortcuts
      if (currentPath === 'mock_exam.html') {
        const inQuiz = onMockQuiz;
        if (!inQuiz) return;
        if (/^[1-4]$/.test(e.key)) {
          const letter = 'ABCD'[parseInt(e.key, 10) - 1];
          const li = document.querySelector(`#qOptions .option-item[data-letter="${letter}"]`);
          if (li && !li.classList.contains('disabled')) { e.preventDefault(); li.click(); }
        } else if (e.key === 'f' || e.key === 'F') {
          document.getElementById('flagBtn')?.click();
        } else if (e.key === 'n' || e.key === 'N' || e.key === 'j' || e.key === 'J') {
          (document.getElementById('qnavNext') || document.getElementById('nextBtn'))?.click();
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'k' || e.key === 'K') {
          document.getElementById('qnavPrev')?.click();
        } else if (e.key === 's' || e.key === 'S') {
          document.getElementById('qnavSubmit')?.click();
        }
      }
    });
  }

  let helpReturnFocus = null;
  function openHelpOverlay() {
    if (document.getElementById('enhHelpOverlay')) return;
    helpReturnFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.id = 'enhHelpOverlay';
    overlay.className = 'enh-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'enhHelpTitle');
    const onMock = currentPath === 'mock_exam.html';
    const rows = (list) => list.map(s => `
      <div class="enh-help-row">
        <kbd>${s.keys.split(' ').map(k => `<span>${k}</span>`).join(' ')}</kbd>
        <span class="enh-help-desc">${s.desc}</span>
      </div>
    `).join('');
    overlay.innerHTML = `
      <div class="enh-overlay-card">
        <button class="enh-overlay-close" aria-label="Close" type="button">×</button>
        <div class="enh-overlay-eyebrow">Keyboard shortcuts</div>
        <h2 id="enhHelpTitle">Move <em>faster.</em></h2>
        <div class="enh-help-grid">
          <div>
            <h3>Global</h3>
            ${rows(SHORTCUTS)}
          </div>
          <div>
            <h3>${onMock ? 'Mock exam' : 'Mock exam (while taking)'}</h3>
            ${rows(SHORTCUTS_EXAM)}
          </div>
        </div>
      </div>
    `;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeHelpOverlay(); });
    overlay.querySelector('.enh-overlay-close').addEventListener('click', closeHelpOverlay);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add('show');
      overlay.querySelector('.enh-overlay-close').focus();
    });
  }
  function closeHelpOverlay() {
    const o = document.getElementById('enhHelpOverlay');
    if (!o) return;
    o.classList.remove('show');
    setTimeout(() => {
      o.remove();
      if (helpReturnFocus && helpReturnFocus.focus) {
        try { helpReturnFocus.focus(); } catch {}
      }
      helpReturnFocus = null;
    }, 180);
  }
  function toggleHelpOverlay() {
    if (document.getElementById('enhHelpOverlay')) closeHelpOverlay();
    else openHelpOverlay();
  }

  /* ─── Practice-page self-mark tracking ─── */
  const PRACTICE_KEY_PREFIX = 'enh:practice:';
  function getPracticeMarks(page) {
    try { return JSON.parse(localStorage.getItem(PRACTICE_KEY_PREFIX + page) || '{}'); } catch { return {}; }
  }
  function setPracticeMark(page, qid, mark) {
    const m = getPracticeMarks(page);
    if (mark === null) delete m[qid];
    else m[qid] = { mark, ts: Date.now() };
    localStorage.setItem(PRACTICE_KEY_PREFIX + page, JSON.stringify(m));
  }
  function wirePracticeTracking() {
    if (!/_practice\.html$/.test(currentPath)) return;
    const marks = getPracticeMarks(currentPath);

    function injectSelfMark(card) {
      if (card.querySelector('.enh-selfmark')) return;
      const qid = card.id || ('q' + Array.from(document.querySelectorAll('.qcard')).indexOf(card));
      const existing = marks[qid]?.mark;
      const row = document.createElement('div');
      row.className = 'enh-selfmark';
      row.innerHTML = `
        <span class="enh-selfmark-lbl">How did you do?</span>
        <button data-m="got"  class="${existing === 'got'  ? 'on' : ''}" type="button">✓ Got it</button>
        <button data-m="miss" class="${existing === 'miss' ? 'on' : ''}" type="button">✗ Missed it</button>
      `;
      card.appendChild(row);
      row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        const m = b.dataset.m;
        const cur = getPracticeMarks(currentPath)[qid]?.mark;
        const next = cur === m ? null : m;
        setPracticeMark(currentPath, qid, next);
        row.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b && next !== null));
      }));
    }

    function scan() {
      document.querySelectorAll('.qcard.revealed').forEach(injectSelfMark);
    }
    scan();
    // Watch for reveal-state changes
    const mo = new MutationObserver(scan);
    document.querySelectorAll('.qcard').forEach(c => mo.observe(c, { attributes: true, attributeFilter: ['class'] }));
  }

  /* ─── Notes & highlights (study guide pages only) ─── */
  const NOTES_KEY = 'enh:notes';
  function getNotes() { try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch { return []; } }
  function saveNotes(n) { localStorage.setItem(NOTES_KEY, JSON.stringify(n)); }

  function wireNotes() {
    if (!/_study_guide\.html$/.test(currentPath)) return;

    // Selection popover
    let popover = null;
    function hidePopover() { popover && popover.remove(); popover = null; }

    document.addEventListener('mouseup', () => {
      const sel = window.getSelection();
      const text = sel && sel.toString().trim();
      hidePopover();
      if (!text || text.length < 6 || text.length > 400) return;
      const r = sel.getRangeAt(0).getBoundingClientRect();
      if (!r.width) return;
      popover = document.createElement('div');
      popover.className = 'enh-sel-popover';
      popover.innerHTML = `<button type="button">＋ Save note</button>`;
      popover.style.top  = (window.scrollY + r.top - 42) + 'px';
      popover.style.left = (window.scrollX + r.left + r.width / 2 - 60) + 'px';
      document.body.appendChild(popover);
      popover.querySelector('button').addEventListener('mousedown', e => {
        e.preventDefault();
        const anchor = findAnchor(sel.anchorNode);
        const notes = getNotes();
        notes.unshift({
          id: 'n-' + Date.now(),
          page: currentPath,
          anchor,
          body: text,
          ts: Date.now()
        });
        saveNotes(notes);
        hidePopover();
        renderNotesPanel();
        flashToast('Note saved');
      });
    });
    document.addEventListener('mousedown', e => {
      if (popover && !popover.contains(e.target)) hidePopover();
    });

    // Notes panel toggle button (top-right floating)
    const fab = document.createElement('button');
    fab.className = 'enh-fab enh-notes-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Open notes');
    fab.innerHTML = '<span>Notes</span><span class="enh-fab-count" id="enhNotesCount">0</span>';
    fab.addEventListener('click', toggleNotesPanel);
    document.body.appendChild(fab);
    refreshNotesCount();
  }

  function findAnchor(node) {
    // Walk up to find a heading or section id we can link back to
    let el = node && node.nodeType === 3 ? node.parentElement : node;
    while (el && el !== document.body) {
      if (el.id) return el.id;
      const sib = el.previousElementSibling;
      if (sib && /^H[1-6]$/.test(sib.tagName) && sib.id) return sib.id;
      el = el.parentElement;
    }
    return null;
  }

  function refreshNotesCount() {
    const all = getNotes();
    const onPage = all.filter(n => n.page === currentPath).length;
    const el = document.getElementById('enhNotesCount');
    if (el) {
      el.textContent = onPage;
      el.classList.toggle('zero', onPage === 0);
    }
  }

  function toggleNotesPanel() {
    if (document.getElementById('enhNotesPanel')) closeNotesPanel();
    else openNotesPanel();
  }
  function openNotesPanel() {
    const panel = document.createElement('aside');
    panel.id = 'enhNotesPanel';
    panel.className = 'enh-notes-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Notes');
    renderNotesPanelInner(panel);
    document.body.appendChild(panel);
    requestAnimationFrame(() => panel.classList.add('show'));
  }
  function closeNotesPanel() {
    const p = document.getElementById('enhNotesPanel');
    if (!p) return;
    p.classList.remove('show');
    setTimeout(() => p.remove(), 180);
  }
  function renderNotesPanel() {
    const p = document.getElementById('enhNotesPanel');
    if (p) renderNotesPanelInner(p);
    refreshNotesCount();
  }
  function renderNotesPanelInner(panel) {
    const all = getNotes();
    const onPage = all.filter(n => n.page === currentPath);
    const other  = all.filter(n => n.page !== currentPath);
    panel.innerHTML = `
      <div class="enh-notes-head">
        <div>
          <div class="enh-notes-eyebrow">Notes</div>
          <h3>Highlights &amp; <em>thoughts.</em></h3>
        </div>
        <button class="enh-notes-close" aria-label="Close" type="button">×</button>
      </div>
      <div class="enh-notes-actions">
        <button class="enh-notes-export" type="button">Export as Markdown</button>
        ${all.length ? '<button class="enh-notes-clear" type="button">Clear all</button>' : ''}
      </div>
      ${all.length === 0 ? `
        <div class="enh-notes-empty">
          <p>Highlight any passage on this page and click <strong>Save note</strong>.</p>
        </div>` : ''}
      ${onPage.length ? `
        <div class="enh-notes-section-label">On this page · ${onPage.length}</div>
        ${onPage.map(renderNote).join('')}` : ''}
      ${other.length ? `
        <div class="enh-notes-section-label">Other pages · ${other.length}</div>
        ${other.map(renderNote).join('')}` : ''}
    `;
    panel.querySelector('.enh-notes-close').addEventListener('click', closeNotesPanel);
    panel.querySelector('.enh-notes-export')?.addEventListener('click', exportNotesMd);
    panel.querySelector('.enh-notes-clear')?.addEventListener('click', () => {
      if (!confirm('Delete all notes? This can\'t be undone.')) return;
      saveNotes([]); renderNotesPanel();
    });
    panel.querySelectorAll('.enh-note .del').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id;
      saveNotes(getNotes().filter(n => n.id !== id));
      renderNotesPanel();
    }));
  }
  function renderNote(n) {
    const pageTitle = (PAGES.find(p => p.url === n.page) || {}).title || n.page;
    const date = new Date(n.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const link = n.anchor ? n.page + '#' + n.anchor : n.page;
    return `
      <div class="enh-note">
        <div class="enh-note-meta">
          <a href="${link}">${escapeHtml(pageTitle)}</a>
          <span>${date}</span>
          <button class="del" data-id="${n.id}" type="button" aria-label="Delete">×</button>
        </div>
        <blockquote>${escapeHtml(n.body)}</blockquote>
      </div>
    `;
  }
  function exportNotesMd() {
    const all = getNotes();
    if (!all.length) return;
    const byPage = {};
    all.forEach(n => { (byPage[n.page] = byPage[n.page] || []).push(n); });
    let md = '# Notes — Claude Architect Foundations\n\n';
    md += `Exported ${new Date().toLocaleString()}\n\n`;
    Object.keys(byPage).sort().forEach(page => {
      const title = (PAGES.find(p => p.url === page) || {}).title || page;
      md += `## ${title}\n\n`;
      byPage[page].forEach(n => {
        const d = new Date(n.ts).toLocaleDateString();
        md += `- *(${d})* "${n.body.replace(/\n/g, ' ')}"\n`;
      });
      md += '\n';
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cca-foundations-notes.md';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function flashToast(msg) {
    let t = document.getElementById('enhToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'enhToast'; t.className = 'enh-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(flashToast._t);
    flashToast._t = setTimeout(() => t.classList.remove('show'), 1600);
  }

  /* ─── Phase 3 boot hook ─── */
  function bootPhase3() {
    installPwa();
    wireKeyboard();
    wirePracticeTracking();
    wireNotes();
  }

  /* ─────────── boot ─────────── */
  function bootAll() { build(); bootPhase3(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
})();
