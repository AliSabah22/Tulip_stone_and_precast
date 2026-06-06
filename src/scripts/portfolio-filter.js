(function () {
  'use strict';

  const filterBtns = document.querySelectorAll(
    '.portfolio-filter-btn[data-filter]'
  );
  const cards   = document.querySelectorAll('.pc[data-categories]');
  const countEl = document.getElementById('portfolio-count');
  const emptyEl = document.getElementById('portfolio-empty');

  if (!filterBtns.length) return;

  let currentFilter = 'all';

  function applyFilter(filter) {
    currentFilter = filter;

    /* Update buttons */
    filterBtns.forEach(btn => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    /* Show / hide cards */
    let visible = 0;
    cards.forEach(card => {
      const cats = (card.dataset.categories || '').split(' ');
      const show = filter === 'all' || cats.includes(filter);
      card.classList.toggle('is-hidden', !show);
      card.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (show) visible++;
    });

    /* Count */
    if (countEl) {
      countEl.textContent = visible === 1
        ? '1 project'
        : `${visible} projects`;
    }

    /* Empty state */
    if (emptyEl) emptyEl.hidden = visible > 0;

    /* URL */
    const url = new URL(window.location.href);
    filter === 'all'
      ? url.searchParams.delete('filter')
      : url.searchParams.set('filter', filter);
    history.replaceState({}, '', url.toString());
  }

  /* Button clicks */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  /* Empty state "View All" button */
  const emptyViewAll = emptyEl && emptyEl.querySelector('[data-filter="all"]');
  if (emptyViewAll) {
    emptyViewAll.addEventListener('click', () => applyFilter('all'));
  }

  /* Browser back/forward */
  window.addEventListener('popstate', () => {
    const f = new URLSearchParams(window.location.search).get('filter') ?? 'all';
    applyFilter(f);
  });

  /* Initialise from URL on page load */
  const init = new URLSearchParams(window.location.search).get('filter') ?? 'all';
  applyFilter(init);

})();
