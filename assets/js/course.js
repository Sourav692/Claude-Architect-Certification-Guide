/* Auto-wire TOC items to their corresponding section blocks.
   Intended for modules whose markup is `.toc-grid > .toc-item` and
   sibling `.section` blocks at `.container > .section`. */
(function () {
  function init() {
    var items = document.querySelectorAll('.toc-grid .toc-item');
    if (!items.length) return;

    var sections = document.querySelectorAll('.container > .section');
    if (!sections.length) return;

    var n = Math.min(items.length, sections.length);

    for (var i = 0; i < n; i++) {
      var section = sections[i];
      var item = items[i];

      if (!section.id) section.id = 's' + (i + 1);

      // overlay anchor — fills the toc-item, leaves underlying text intact
      var a = document.createElement('a');
      a.href = '#' + section.id;
      a.className = 'toc-item-overlay';
      a.setAttribute('aria-label', (item.textContent || '').trim());

      // ensure parent is a positioning context
      var pos = window.getComputedStyle(item).position;
      if (pos === 'static') item.style.position = 'relative';

      item.appendChild(a);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
