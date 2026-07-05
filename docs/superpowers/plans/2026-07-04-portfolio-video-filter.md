# Portfolio Video Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Videos" filter tab to the portfolio page that shows every video clip as a clickable, playable tile, instead of videos being reachable only by scrolling deep into one project's photo gallery.

**Architecture:** `portfolio.astro` derives a flat `allVideos` list from the existing per-project `videos` arrays and renders it as a new grid (sibling to the existing project-card grid), plus one new "Videos" entry in the filter bar. `portfolio-filter.js` gets one new branch in its existing `applyFilter()` function to toggle which grid is visible. `ProjectViewer.astro`'s existing click-delegation and `openViewer()` are extended to accept an optional starting gallery index, so clicking a video tile opens the same, already-working lightbox jumped straight to that clip instead of the project's first photo.

**Tech Stack:** Astro (`.astro` files, frontmatter JS + scoped CSS), vanilla JS (`portfolio-filter.js`), no test runner in this repo — verification is via `curl`+`grep` against the dev server's rendered HTML and Playwright browser scripts (temporarily installed, not added to `package.json`).

## Global Constraints

- No new files/components — every change lands in the three existing files named above (per the approved design doc, `docs/superpowers/specs/2026-07-04-portfolio-video-filter-design.md`).
- No deep-linking to a specific clip via URL query param (out of scope per spec).
- No inline autoplay-on-hover in the video grid (out of scope per spec).
- Existing project-card click behavior (opening at gallery index 0) must remain unchanged — triggers without `data-open-index` must behave exactly as before.
- The dev server for manual/Playwright verification runs on `http://localhost:4321` (`npm run dev` from the repo root).
- The site has a first-visit splash screen (`SplashScreen.astro`) gated by `sessionStorage.getItem('tulip_splash_shown')`. Any Playwright script must set that key via `page.addInitScript()` before `page.goto()`, or it will block the page for the first several seconds.

---

### Task 1: Add video data, "Videos" filter option, and video grid markup/styles

**Files:**
- Modify: `src/pages/portfolio.astro:681-690` (frontmatter — add `allVideos`, extend `filterOptions`)
- Modify: `src/pages/portfolio.astro:761-763` (template — insert video grid markup between the project grid and the empty state)
- Modify: `src/pages/portfolio.astro:889-894` and `:940-955` (styles — grid + tile CSS, responsive breakpoints)

**Interfaces:**
- Produces: `allVideos` — an array of `{ src, poster, caption, projectId, projectTitle, galleryIndex }` objects, one per video across all projects. `galleryIndex` is the video's position in that project's combined image+video gallery (i.e. `project.images.length + i`), which Task 3 will consume to jump the lightbox to the right item.
- Produces: DOM elements `#portfolio-video-grid` (container, starts `hidden`) and `.video-tile` buttons within it, each carrying `data-open-project` and `data-open-index` attributes. Task 2 and Task 3 consume these.
- Produces: a `filterOptions` entry `{ value: 'videos', label: 'Videos' }`, which — because the template already does `{filterOptions.map(...)}` — automatically renders a "Videos" button in the filter bar with `data-filter="videos"`. No template change needed for the button itself.

- [ ] **Step 1: Add the `allVideos` derived list to the frontmatter**

Open `src/pages/portfolio.astro`. Find the line `];` that closes the `projects` array (currently line 681 — search for `description: "A grand Beaux-Arts residential estate clad entirely in Indiana Limestone` to confirm you're at the end of the last project entry, followed by `];`). Insert immediately after that `];`:

```js
const allVideos = projects.flatMap(project =>
  (project.videos || []).map((video, i) => ({
    ...video,
    projectId: project.id,
    projectTitle: project.title,
    galleryIndex: project.images.length + i,
  }))
);
```

- [ ] **Step 2: Add the "Videos" filter option**

Find:
```js
const filterOptions = [
  { value: 'all',         label: 'All Projects'  },
  { value: 'residential', label: 'Residential'   },
  { value: 'commercial',  label: 'Commercial'    },
  { value: 'limestone',   label: 'Limestone'     },
  { value: 'precast',     label: 'Precast'       },
  { value: 'custom',      label: 'Custom'        },
];
```

Replace with:
```js
const filterOptions = [
  { value: 'all',         label: 'All Projects'  },
  { value: 'residential', label: 'Residential'   },
  { value: 'commercial',  label: 'Commercial'    },
  { value: 'limestone',   label: 'Limestone'     },
  { value: 'precast',     label: 'Precast'       },
  { value: 'custom',      label: 'Custom'        },
  { value: 'videos',      label: 'Videos'        },
];
```

- [ ] **Step 3: Insert the video grid markup**

Find the end of the project grid and the start of the empty state:
```astro
      <div
        class="port-grid"
        id="portfolio-grid"
      >
        {projects.map((project, index) => (
          <ProjectCard
            project={project}
            index={index}
            size={project.featured ? 'featured' : 'normal'}
          />
        ))}
      </div>

      <!-- Empty state -->
```

Replace with (adds a new block between the closing `</div>` and the `<!-- Empty state -->` comment, everything else unchanged):
```astro
      <div
        class="port-grid"
        id="portfolio-grid"
      >
        {projects.map((project, index) => (
          <ProjectCard
            project={project}
            index={index}
            size={project.featured ? 'featured' : 'normal'}
          />
        ))}
      </div>

      <!-- Video grid -->
      <div
        class="video-grid"
        id="portfolio-video-grid"
        role="list"
        aria-label="Project videos"
        hidden
      >
        {allVideos.map(video => (
          <button
            class="video-tile"
            type="button"
            role="listitem"
            data-open-project={video.projectId}
            data-open-index={video.galleryIndex}
            aria-label={`Play video from ${video.projectTitle}`}
          >
            <img
              src={video.poster}
              alt=""
              loading="lazy"
              width="400"
              height="300"
              class="video-tile-image"
            />
            <span class="video-tile-play" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <polygon points="2,1 14,8 2,15" fill="currentColor" />
              </svg>
            </span>
            <span class="video-tile-caption">{video.projectTitle}</span>
          </button>
        ))}
      </div>

      <!-- Empty state -->
```

- [ ] **Step 4: Add video grid CSS**

Find:
```css
  /* ── Portfolio grid — 4 cols on desktop, stepping down ──────── */

  .port-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    align-items: start;
  }

  /* ── Empty state — hidden by default, flex when visible ─────── */
```

Replace with:
```css
  /* ── Portfolio grid — 4 cols on desktop, stepping down ──────── */

  .port-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    align-items: start;
  }

  .port-grid[hidden] {
    display: none;
  }

  /* ── Video grid ─────────────────────────────────────────────── */
  /* NOTE: the [hidden] attribute alone does not hide a grid — an
     author `display: grid` rule beats the user-agent `[hidden]`
     rule in the cascade regardless of specificity, because origin
     precedence (author > user-agent) is checked before specificity.
     Both grids above/below must explicitly redeclare `display: none`
     as their own base state, matching the existing `.port-empty`
     pattern in this same file. */

  .video-grid {
    display: none;
  }

  .video-grid:not([hidden]) {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    align-items: start;
  }

  .video-tile {
    position: relative;
    display: block;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }

  .video-tile:focus-visible {
    outline: 2px solid var(--focus-ring, #C8A882);
    outline-offset: 3px;
  }

  .video-tile-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    display: block;
    background: var(--cream-dark, #F0E8D8);
  }

  .video-tile-play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(20, 18, 16, 0.62);
    color: var(--white-warm, #FDFAF6);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition:
      background-color 200ms ease,
      transform 200ms ease;
  }

  .video-tile:hover .video-tile-play {
    background: rgba(200, 168, 130, 0.88);
    transform: translate(-50%, -50%) scale(1.08);
  }

  .video-tile-caption {
    display: block;
    margin-top: 8px;
    font-family: var(--font-sans, sans-serif);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--stone-light, #9C8880);
  }

  /* ── Empty state — hidden by default, flex when visible ─────── */
```

- [ ] **Step 5: Add responsive breakpoints for the video grid**

Find:
```css
  @media (max-width: 1200px) {
    .port-grid { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 768px) {
    .port-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 480px) {
    .port-grid { grid-template-columns: 1fr; }
```

Replace with:
```css
  @media (max-width: 1200px) {
    .port-grid { grid-template-columns: repeat(3, 1fr); }
    .video-grid:not([hidden]) { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 768px) {
    .port-grid { grid-template-columns: repeat(2, 1fr); }
    .video-grid:not([hidden]) { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 480px) {
    .port-grid { grid-template-columns: 1fr; }
    .video-grid:not([hidden]) { grid-template-columns: 1fr; }
```

- [ ] **Step 6: Verify via the dev server**

Start the dev server if it isn't already running:
```bash
npm run dev
```

In another terminal:
```bash
curl -s http://localhost:4321/portfolio > /tmp/portfolio-check.html
grep -o 'data-filter="videos"[^>]*>Videos' /tmp/portfolio-check.html
grep -o 'id="portfolio-video-grid"[^>]*hidden' /tmp/portfolio-check.html
grep -c 'class="video-tile"' /tmp/portfolio-check.html
```

Expected:
- First command prints a match (the "Videos" button exists).
- Second command prints a match (`hidden` is present on the container — the grid is not visible by default).
- Third command prints `51` (one tile per clip currently in `french-chateau-estate`'s `videos` array — this number should always equal the total video count across all projects' data).

- [ ] **Step 7: Commit**

```bash
git add src/pages/portfolio.astro
git commit -m "Add video grid data, filter option, and markup to portfolio page"
```

If `git commit` hangs (this repo lives inside an iCloud-synced folder and `git commit`'s working-tree refresh scan can stall on it — see prior commits in `git log` for the same issue), use plumbing instead:
```bash
TREE=$(git write-tree)
PARENT=$(git rev-parse HEAD)
COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "Add video grid data, filter option, and markup to portfolio page")
git update-ref refs/heads/$(git branch --show-current) "$COMMIT"
```

---

### Task 2: Wire the "Videos" filter to swap grids in `portfolio-filter.js`

**Files:**
- Modify: `src/scripts/portfolio-filter.js` (full file — small enough to replace wholesale)

**Interfaces:**
- Consumes: `#portfolio-grid` and `#portfolio-video-grid` DOM elements and `.video-tile` elements from Task 1.
- Produces: no new interface — this task changes runtime behavior only. `ProjectViewer.astro` (Task 3) does not depend on anything from this task; it reads the currently-active filter button directly from the DOM, which this task keeps working exactly as before.

- [ ] **Step 1: Replace `portfolio-filter.js` with the extended version**

Current full file content:
```js
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
```

Replace the entire file with:
```js
(function () {
  'use strict';

  const filterBtns  = document.querySelectorAll(
    '.portfolio-filter-btn[data-filter]'
  );
  const cards       = document.querySelectorAll('.pc[data-categories]');
  const countEl     = document.getElementById('portfolio-count');
  const emptyEl     = document.getElementById('portfolio-empty');
  const projectGrid = document.getElementById('portfolio-grid');
  const videoGrid   = document.getElementById('portfolio-video-grid');

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

    if (filter === 'videos') {
      if (projectGrid) projectGrid.hidden = true;
      if (videoGrid) videoGrid.hidden = false;
      if (emptyEl) emptyEl.hidden = true;

      const videoCount = videoGrid
        ? videoGrid.querySelectorAll('.video-tile').length
        : 0;

      if (countEl) {
        countEl.textContent = videoCount === 1
          ? '1 video'
          : `${videoCount} videos`;
      }

      const url = new URL(window.location.href);
      url.searchParams.set('filter', filter);
      history.replaceState({}, '', url.toString());
      return;
    }

    if (projectGrid) projectGrid.hidden = false;
    if (videoGrid) videoGrid.hidden = true;

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
```

- [ ] **Step 2: Verify with a Playwright script**

Install Playwright temporarily (does not modify `package.json`):
```bash
npm install --no-save playwright
npx playwright install chromium
```

Write `/tmp/verify-filter.mjs`:
```js
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => sessionStorage.setItem('tulip_splash_shown', '1'));
await page.goto('http://localhost:4321/portfolio', { waitUntil: 'networkidle' });
await page.waitForSelector('#portfolio-grid .pc', { timeout: 15000 });

// Click the Videos filter
await page.click('.portfolio-filter-btn[data-filter="videos"]');
await page.waitForTimeout(200);

const projectGridHidden = await page.getAttribute('#portfolio-grid', 'hidden');
const videoGridHidden = await page.getAttribute('#portfolio-video-grid', 'hidden');
const countText = await page.textContent('#portfolio-count');
const tileCount = await page.locator('.video-tile').count();

console.log(JSON.stringify({ projectGridHidden, videoGridHidden, countText, tileCount }));

// Click back to All Projects
await page.click('.portfolio-filter-btn[data-filter="all"]');
await page.waitForTimeout(200);

const projectGridHiddenAfter = await page.getAttribute('#portfolio-grid', 'hidden');
const videoGridHiddenAfter = await page.getAttribute('#portfolio-video-grid', 'hidden');

console.log(JSON.stringify({ projectGridHiddenAfter, videoGridHiddenAfter }));

await browser.close();
```

Run it:
```bash
node /tmp/verify-filter.mjs
```

Expected output — first line: `projectGridHidden` is `""` (empty string, meaning the attribute is present with no value — Playwright's `getAttribute` returns `""` for a boolean attribute present without a value, not `null`), `videoGridHidden` is `null` (attribute absent — grid is shown), `countText` matches the tile count (e.g. `"51 videos"`), `tileCount` equals the number from Task 1's Step 6 check. Second line: `projectGridHiddenAfter` is `null`, `videoGridHiddenAfter` is `""` — confirms switching back to "All Projects" restores the original grid and hides the video grid again.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/portfolio-filter.js
git commit -m "Toggle project/video grids when the Videos filter is selected"
```

(Use the plumbing fallback from Task 1 Step 7 if this hangs.)

---

### Task 3: Open the lightbox at the clicked video's index

**Files:**
- Modify: `src/components/portfolio/ProjectViewer.astro:819-845` (the `openViewer` function)
- Modify: `src/components/portfolio/ProjectViewer.astro:1088-1099` (the click delegation handler)

**Interfaces:**
- Consumes: `data-open-project` and `data-open-index` attributes on `.video-tile` buttons (Task 1), and the active filter value read from `.portfolio-filter-btn.is-active` (Task 2 keeps this element's `is-active` class current for the `videos` button same as any other).
- Produces: no new interface — this is the final consumer in the chain.

- [ ] **Step 1: Extend `openViewer` to accept a starting index and to scope video-filter navigation**

Find:
```js
  function openViewer(projectId, currentFilter) {
    visibleProjects = currentFilter && currentFilter !== 'all'
      ? allProjects.filter(p => p.categories.includes(currentFilter))
      : [...allProjects];

    const idx = visibleProjects.findIndex(p => p.id === projectId);
    if (idx === -1) return;

    currentProjIdx = idx;
    currentImgIdx  = 0;

    viewer.removeAttribute('hidden');
    void viewer.getBoundingClientRect();

    viewer.setAttribute('aria-hidden', 'false');
    viewer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    isOpen = true;

    renderProject();

    setTimeout(() => closeBtn && closeBtn.focus(), 80);

    const url = new URL(window.location.href);
    url.searchParams.set('project', projectId);
    history.replaceState({}, '', url.toString());
  }
```

Replace with:
```js
  function openViewer(projectId, currentFilter, startIndex) {
    if (currentFilter === 'videos') {
      visibleProjects = allProjects.filter(p => (p.videos || []).length > 0);
    } else {
      visibleProjects = currentFilter && currentFilter !== 'all'
        ? allProjects.filter(p => p.categories.includes(currentFilter))
        : [...allProjects];
    }

    const idx = visibleProjects.findIndex(p => p.id === projectId);
    if (idx === -1) return;

    currentProjIdx = idx;
    currentImgIdx  = 0;

    viewer.removeAttribute('hidden');
    void viewer.getBoundingClientRect();

    viewer.setAttribute('aria-hidden', 'false');
    viewer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    isOpen = true;

    renderProject();

    if (typeof startIndex === 'number' && startIndex > 0) {
      setImage(startIndex, true);
    }

    setTimeout(() => closeBtn && closeBtn.focus(), 80);

    const url = new URL(window.location.href);
    url.searchParams.set('project', projectId);
    history.replaceState({}, '', url.toString());
  }
```

- [ ] **Step 2: Read `data-open-index` in the click handler**

Find:
```js
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-open-project]');
    if (!btn) return;

    triggerEl = btn;
    const projectId = btn.dataset.openProject;

    const activeFilterBtn = document.querySelector('.portfolio-filter-btn.is-active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';

    openViewer(projectId, activeFilter || 'all');
  });
```

Replace with:
```js
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-open-project]');
    if (!btn) return;

    triggerEl = btn;
    const projectId = btn.dataset.openProject;
    const startIndex = btn.dataset.openIndex !== undefined
      ? parseInt(btn.dataset.openIndex, 10)
      : undefined;

    const activeFilterBtn = document.querySelector('.portfolio-filter-btn.is-active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';

    openViewer(projectId, activeFilter || 'all', startIndex);
  });
```

- [ ] **Step 3: Verify with a Playwright script**

Write `/tmp/verify-video-jump.mjs`:
```js
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem('tulip_splash_shown', '1'));
await page.goto('http://localhost:4321/portfolio', { waitUntil: 'networkidle' });
await page.waitForSelector('#portfolio-grid .pc', { timeout: 15000 });

await page.click('.portfolio-filter-btn[data-filter="videos"]');
await page.waitForTimeout(200);

// Click the 5th video tile (index 4) and read what src/index it declared
const tile = page.locator('.video-tile').nth(4);
const expectedIndex = await tile.getAttribute('data-open-index');
await tile.click();

await page.waitForSelector('#project-viewer.is-open', { timeout: 5000 });
await page.waitForFunction(() => {
  const v = document.getElementById('pv-primary-video');
  return v && v.readyState >= 1;
}, { timeout: 8000 });

const videoVisible = await page.locator('#pv-primary-video').isVisible();
const duration = await page.evaluate(() => document.getElementById('pv-primary-video').duration);

await page.evaluate(() => document.getElementById('pv-primary-video').play());
await page.waitForTimeout(500);
const playState = await page.evaluate(() => {
  const v = document.getElementById('pv-primary-video');
  return { paused: v.paused, error: v.error ? v.error.message : null };
});

// prevBtn/nextBtn should both be disabled: only one project (French
// Château Estate) currently has videos, so the video-filtered
// visibleProjects list has length 1.
const prevDisabled = await page.locator('#pv-prev').isDisabled();
const nextDisabled = await page.locator('#pv-next').isDisabled();

console.log(JSON.stringify({
  expectedIndex, videoVisible, duration, playState, prevDisabled, nextDisabled
}));

await browser.close();
```

Run it:
```bash
node /tmp/verify-video-jump.mjs
```

Expected: `videoVisible: true`, `duration` a positive number (not 0 or NaN — confirms it opened a real clip, not a blank state), `playState.paused: false` and `playState.error: null` (confirms actual playback, not just a loaded-but-broken element), `prevDisabled: true` and `nextDisabled: true` (confirms video-filter project scoping — there's only one video-containing project today, so navigation between projects is correctly disabled rather than cycling through non-video projects).

- [ ] **Step 4: Regression check — existing project-card flow is unchanged**

Write `/tmp/verify-card-regression.mjs`:
```js
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem('tulip_splash_shown', '1'));
await page.goto('http://localhost:4321/portfolio', { waitUntil: 'networkidle' });
await page.waitForSelector('#portfolio-grid .pc', { timeout: 15000 });

// Default filter is "all" — click the French Château Estate project card
await page.click('[data-open-project="french-chateau-estate"]');
await page.waitForSelector('#project-viewer.is-open', { timeout: 5000 });

const imageVisible = await page.locator('#pv-primary-img').isVisible();
const imageSrc = await page.getAttribute('#pv-primary-img', 'src');

console.log(JSON.stringify({ imageVisible, imageSrc }));

await browser.close();
```

Run it:
```bash
node /tmp/verify-card-regression.mjs
```

Expected: `imageVisible: true`, `imageSrc` ends in `.jpg` (a photo, not a video) — confirms clicking a project card (which has no `data-open-index`) still opens at index 0 exactly as before Task 3's changes.

- [ ] **Step 5: Clean up temporary Playwright install and verification scripts**

```bash
npm uninstall playwright
rm -f /tmp/verify-filter.mjs /tmp/verify-video-jump.mjs /tmp/verify-card-regression.mjs /tmp/portfolio-check.html
```

- [ ] **Step 6: Commit**

```bash
git add src/components/portfolio/ProjectViewer.astro
git commit -m "Open lightbox at the clicked video's gallery index"
```

(Use the plumbing fallback from Task 1 Step 7 if this hangs.)

---

## After all tasks

Push the branch and let the user know it's ready for review:
```bash
git push origin staging
```

This plan does not touch `main` — it stays on `staging` per the existing branch workflow (see `docs/superpowers/specs/2026-07-04-portfolio-video-filter-design.md` and the repo's git history for context on why).
