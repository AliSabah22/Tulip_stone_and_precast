# Video/Photo Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make videos a fully standalone collection on the portfolio page — no photo project ever carries video data again — and give videos their own dedicated lightbox, separate from the existing photo-project viewer.

**Architecture:** `portfolio.astro` gets a new top-level `siteVideos` array (replacing the current `videos` field nested in one project's data) and a new `VideoViewer.astro` component (independent from `ProjectViewer.astro`, not a shared/refactored base) handles browsing and playing them. `ProjectViewer.astro` and `ProjectCard.astro` revert to their pre-video-feature form, since photo projects will never carry `.videos` again.

**Tech Stack:** Astro (`.astro` files, frontmatter JS + scoped/global CSS), vanilla JS, no test runner in this repo — verification is via `curl`+`grep` against the dev server's rendered HTML and temporary Playwright scripts (installed via `npm install --no-save playwright`, removed after the final task).

## Global Constraints

- `VideoViewer.astro` must be a new, independent component — not a mode/branch added to `ProjectViewer.astro`, and not a shared base class refactored out of it (per the approved design's Approach 1).
- No deep-linking to a specific clip via URL query param.
- No grouping or reordering of videos by shoot date, location, or any secondary key — the thumbnail strip and prev/next use `siteVideos`' authored array order exactly as written.
- Any video-playback verification must use a **real mouse click** on the video's native controls, not a scripted `.play()` call — a scripted call does not detect the `[hidden]`-cascade class of bug that shipped and was fixed on `staging` (commit `da3119b8`) earlier in this feature area.
- The dev server for verification runs on `http://localhost:4321` (`npm run dev`).
- The site has a first-visit splash screen (`SplashScreen.astro`) gated by `sessionStorage.getItem('tulip_splash_shown')`. Any Playwright script must set that key via `page.addInitScript()` before `page.goto()`.
- This repo lives inside an iCloud-synced folder. `git commit` can hang for minutes on its working-tree refresh scan. If it hangs, kill it, remove any stale `.git/index.lock` (only after confirming via `ps aux` no git process is still running), and commit via plumbing instead:
  ```bash
  git add <files>
  TREE=$(git write-tree)
  PARENT=$(git rev-parse HEAD)
  COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "your message")
  git update-ref refs/heads/$(git branch --show-current) "$COMMIT"
  ```

---

### Task 1: Standalone `siteVideos` data and video-tile markup

**Files:**
- Modify: `src/pages/portfolio.astro`

**Interfaces:**
- Produces: `siteVideos: SiteVideo[]` — a top-level array of `{ src: string, poster: string, caption: string }`, no project reference. Task 2 consumes this as a prop to the new `VideoViewer` component.
- Produces: `.video-tile` buttons carrying `data-open-video={index}` (was `data-open-project`/`data-open-index`). Task 2's `VideoViewer` click-delegation listener consumes this attribute.

- [ ] **Step 1: Replace the `ProjectVideo` interface with a `SiteVideo` interface, and remove `videos` from `Project`**

In `src/pages/portfolio.astro`, find:
```astro
interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
  position?: string;
}

interface ProjectVideo {
  src: string;
  poster?: string;
  caption?: string;
}

interface Project {
  id: string;
  title: string;
  style: string;
  location: string;
  year: string;
  categories: string[];
  heroImage: ProjectImage;
  images: ProjectImage[];
  videos?: ProjectVideo[];
  materials: string[];
  description: string;
  featured?: boolean;
}
```

Replace with:
```astro
interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
  position?: string;
}

interface SiteVideo {
  src: string;
  poster: string;
  caption: string;
}

interface Project {
  id: string;
  title: string;
  style: string;
  location: string;
  year: string;
  categories: string[];
  heroImage: ProjectImage;
  images: ProjectImage[];
  materials: string[];
  description: string;
  featured?: boolean;
}
```

- [ ] **Step 2: Delete the `videos` array from the `french-chateau-estate` project object**

Find the `french-chateau-estate` project object. Its `images` array ends, and a `videos` array begins immediately after, ending right before `materials:`. The `videos` array starts with:
```astro
    videos: [
      {
        src: "/porfolio_directory/project_1/videos/clip-01.mp4",
        poster: "/porfolio_directory/project_1/videos/clip-01.jpg",
        caption: "Site video — clip 1"
      },
```
and ends with:
```astro
      {
        src: "/porfolio_directory/project_1/videos/clip-51.mp4",
        poster: "/porfolio_directory/project_1/videos/clip-51.jpg",
        caption: "Site video — clip 51"
      },
    ],
```
(51 entries total, clip-01 through clip-51, in that order.)

Delete the entire `videos: [ ... ],` block — every line from `videos: [` through the matching closing `],` right before `materials: [`. Do not retype the entries; cut them (you'll need them, unchanged, in Step 3). After this deletion, the project object's `images` array's closing `]` (no trailing comma, since it's the last item before this deletion) should be directly followed by `materials: [`.

- [ ] **Step 3: Replace the `allVideos` derivation with a standalone `siteVideos` array**

Find:
```astro
const allVideos = projects.flatMap(project =>
  (project.videos || []).map((video, i) => ({
    ...video,
    projectId: project.id,
    projectTitle: project.title,
    galleryIndex: project.images.length + i,
  }))
);
```

Replace with a `siteVideos` array containing the exact same 51 objects you deleted in Step 2 (same `src`/`poster`/`caption` values, same order, clip-01 through clip-51) — just relocated here as a standalone array, with no `projectId`/`projectTitle`/`galleryIndex` fields added (the `SiteVideo` interface from Step 1 only has `src`/`poster`/`caption`):

```astro
const siteVideos: SiteVideo[] = [
  {
    src: "/porfolio_directory/project_1/videos/clip-01.mp4",
    poster: "/porfolio_directory/project_1/videos/clip-01.jpg",
    caption: "Site video — clip 1"
  },
  // ... (paste the remaining 49 entries you cut in Step 2 here, unchanged,
  // in the same order, clip-02 through clip-50) ...
  {
    src: "/porfolio_directory/project_1/videos/clip-51.mp4",
    poster: "/porfolio_directory/project_1/videos/clip-51.jpg",
    caption: "Site video — clip 51"
  },
];
```

- [ ] **Step 4: Update the video-tile markup to use `siteVideos` and `data-open-video`**

Find:
```astro
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
```

Replace with:
```astro
      <!-- Video grid -->
      <div
        class="video-grid"
        id="portfolio-video-grid"
        role="list"
        aria-label="Site videos"
        hidden
      >
        {siteVideos.map((video, index) => (
          <button
            class="video-tile"
            type="button"
            role="listitem"
            data-open-video={index}
            aria-label={`Play video: ${video.caption}`}
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
            <span class="video-tile-caption">{video.caption}</span>
          </button>
        ))}
      </div>
```

- [ ] **Step 5: Verify via the dev server**

Start the dev server if not already running: `npm run dev` (check first with `lsof -iTCP -sTCP:LISTEN -P | grep node` — reuse an existing instance on port 4321 if present).

```bash
curl -s http://localhost:4321/portfolio > /tmp/portfolio-check.html
grep -c 'data-open-video=' /tmp/portfolio-check.html
grep -c 'data-open-project="french-chateau-estate"' /tmp/portfolio-check.html
python3 -c "print(open('/tmp/portfolio-check.html').read().count('Site video'))"
python3 -c "print(open('/tmp/portfolio-check.html').read().count('French Château Estate'))"
```

Expected:
- First command: `51` (one `data-open-video` per clip).
- Second command: `1` (only the project card itself uses `data-open-project="french-chateau-estate"` now — video tiles no longer do).
- Third command: `51` or more (each tile's caption is its own "Site video — clip N" text; the project's own hero/description text may also legitimately contain the phrase, so accept any number ≥ 51).
- Fourth command: some small number matching only the project card/lightbox references to the project's own title — not 51 (confirms tiles no longer repeat the project title 51 times).

- [ ] **Step 6: Commit**

```bash
git add src/pages/portfolio.astro
git commit -m "Make site videos a standalone collection, separate from project data"
```

(Use the plumbing fallback from Global Constraints if this hangs.)

---

### Task 2: New `VideoViewer.astro` component

**Files:**
- Create: `src/components/portfolio/VideoViewer.astro`
- Modify: `src/pages/portfolio.astro` (import + render the new component)

**Interfaces:**
- Consumes: `siteVideos: SiteVideo[]` from Task 1, and `.video-tile[data-open-video]` buttons from Task 1.
- Produces: no interface other tasks depend on — this is the final consumer in the chain for the video-browsing feature.

- [ ] **Step 1: Create `src/components/portfolio/VideoViewer.astro`**

```astro
---
interface SiteVideo {
  src: string;
  poster: string;
  caption: string;
}

interface Props {
  videos: SiteVideo[];
}

const { videos } = Astro.props;
---

<!-- Video data for JS (not rendered) -->
<script
  id="vv-data"
  type="application/json"
  set:html={JSON.stringify(videos)}
></script>

<div
  id="video-viewer"
  class="vv"
  role="dialog"
  aria-modal="true"
  aria-label="Video detail"
  aria-hidden="true"
  hidden
>

  <!-- Backdrop -->
  <div
    class="vv-backdrop"
    id="vv-backdrop"
    aria-hidden="true"
  ></div>

  <!-- Slide-in panel -->
  <div class="vv-panel" id="vv-panel">

    <!-- ── Header ────────────────────────────────────────────── -->
    <div class="vv-header">

      <div class="vv-header-left">
        <span class="vv-header-eyebrow">Video Detail</span>
        <span
          class="vv-counter"
          id="vv-counter"
          aria-live="polite"
          aria-atomic="true"
        ></span>
      </div>

      <div class="vv-header-right">

        <button
          class="vv-icon-btn"
          id="vv-prev"
          aria-label="Previous video"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16"
               fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
          </svg>
        </button>

        <button
          class="vv-icon-btn"
          id="vv-next"
          aria-label="Next video"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16"
               fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
          </svg>
        </button>

        <button
          class="vv-icon-btn vv-close"
          id="vv-close"
          aria-label="Close video detail"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16"
               fill="none" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"/>
          </svg>
        </button>

      </div>
    </div>

    <!-- ── Body ──────────────────────────────────────────────── -->
    <div class="vv-body">

      <!-- Left: Video -->
      <div class="vv-gallery">

        <!-- Primary video -->
        <div class="vv-primary-wrap">
          <video
            id="vv-primary-video"
            class="vv-primary-video"
            controls
            playsinline
            preload="metadata"
          ></video>
          <span
            class="vv-caption-overlay"
            id="vv-caption"
            aria-hidden="true"
          ></span>
        </div>

        <!-- Thumbnail strip -->
        <div
          class="vv-thumbs"
          id="vv-thumbs"
          role="list"
          aria-label="All videos"
        >
          <!-- Populated by JS -->
        </div>

      </div>

      <!-- Right: Info -->
      <div class="vv-info" id="vv-info">
        <div class="vv-info-scroll">

          <span class="vv-eyebrow">On-Site Video</span>

          <p class="vv-copy">
            See our craftsmanship in action — behind-the-scenes footage
            from active installations across our project sites.
          </p>

          <!-- Primary CTA -->
          <a
            href="/contact"
            class="btn btn-primary vv-cta"
          >
            Start a Similar Project →
          </a>

        </div>
      </div>

    </div>
  </div>
</div>

<style is:global>

  /* ── Viewer root ────────────────────────────────────────────── */

  .vv {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: stretch;
    justify-content: flex-end;
    pointer-events: none;
  }

  .vv[aria-hidden="false"] {
    pointer-events: all;
  }

  /* ── Backdrop ───────────────────────────────────────────────── */

  .vv-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(20, 18, 16, 0);
    cursor: pointer;
    transition: background 450ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .vv.is-open .vv-backdrop {
    background: rgba(20, 18, 16, 0.72);
  }

  /* ── Panel ──────────────────────────────────────────────────── */

  .vv-panel {
    position: relative;
    z-index: 1;
    width: min(1040px, 92vw);
    height: 100dvh;
    background: var(--limestone-cream, #FAF6EF);
    display: flex;
    flex-direction: column;
    transform: translateX(102%);
    transition: transform 560ms cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
    overflow: hidden;
  }

  .vv.is-open .vv-panel {
    transform: translateX(0);
  }

  /* ── Header ─────────────────────────────────────────────────── */

  .vv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    border-bottom: 1px solid var(--cream-dark, #F0E8D8);
    background: var(--white-warm, #FDFAF6);
    flex-shrink: 0;
    gap: 16px;
  }

  .vv-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  .vv-header-eyebrow {
    font-family: var(--font-sans, sans-serif);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--stone-light, #9C8880);
    white-space: nowrap;
  }

  .vv-counter {
    font-family: var(--font-sans, sans-serif);
    font-size: 10px;
    font-weight: 300;
    color: var(--stone-lighter, #C4B8B0);
    letter-spacing: 0.05em;
  }

  .vv-header-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .vv-icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--cream-dark, #F0E8D8);
    cursor: pointer;
    color: var(--stone-mid, #6B5E56);
    transition:
      border-color 200ms ease,
      color 200ms ease,
      background-color 200ms ease;
  }

  .vv-icon-btn:hover {
    border-color: var(--warm-sand, #C8A882);
    color: var(--stone-dark, #3D3530);
    background: var(--sand-pale, #F5EDE0);
  }

  .vv-icon-btn:disabled {
    opacity: 0.28;
    cursor: not-allowed;
    pointer-events: none;
  }

  .vv-icon-btn:focus-visible {
    outline: 2px solid var(--focus-ring, #C8A882);
    outline-offset: 2px;
  }

  /* ── Body grid ──────────────────────────────────────────────── */

  .vv-body {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  /* ── Gallery ────────────────────────────────────────────────── */

  .vv-gallery {
    display: flex;
    flex-direction: column;
    background: var(--quarry-stone, #3D3530);
    overflow: hidden;
    min-height: 0;
  }

  .vv-primary-wrap {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-height: 0;
  }

  .vv-primary-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #000;
  }

  .vv-caption-overlay {
    position: absolute;
    bottom: 14px;
    left: 14px;
    font-family: var(--font-sans, sans-serif);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(253, 250, 246, 0.6);
    background: rgba(20, 18, 16, 0.52);
    padding: 3px 8px;
    pointer-events: none;
  }

  /* ── Thumbnail strip ────────────────────────────────────────── */

  .vv-thumbs {
    display: flex;
    gap: 2px;
    background: var(--quarry-dark, #1e1a17);
    padding: 2px;
    flex-shrink: 0;
    min-height: 70px;
    max-height: 70px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .vv-thumbs::-webkit-scrollbar { display: none; }

  .vv-thumb {
    position: relative;
    flex-shrink: 0;
    width: 96px;
    height: 66px;
    overflow: hidden;
    cursor: pointer;
    background: none;
    border: 2px solid transparent;
    padding: 0;
    opacity: 0.5;
    transition:
      opacity 200ms ease,
      border-color 200ms ease;
  }

  .vv-thumb:hover {
    opacity: 0.82;
  }

  .vv-thumb.is-active {
    opacity: 1;
    border-color: var(--warm-sand, #C8A882);
  }

  .vv-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .vv-thumb-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background: rgba(20, 18, 16, 0.18);
  }

  .vv-thumb-play::after {
    content: '';
    width: 0;
    height: 0;
    margin-left: 2px;
    border-style: solid;
    border-width: 5px 0 5px 8px;
    border-color: transparent transparent transparent rgba(253, 250, 246, 0.92);
  }

  .vv-thumb:focus-visible {
    outline: 2px solid var(--focus-ring, #C8A882);
    outline-offset: 2px;
  }

  /* ── Info panel ─────────────────────────────────────────────── */

  .vv-info {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--sand-light, #E8D5BC) transparent;
  }

  .vv-info::-webkit-scrollbar { width: 3px; }
  .vv-info::-webkit-scrollbar-thumb {
    background: var(--sand-light, #E8D5BC);
  }

  .vv-info-scroll {
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .vv-eyebrow {
    font-family: var(--font-sans, sans-serif);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--sage-green, #7A9176);
  }

  .vv-copy {
    font-family: var(--font-sans, sans-serif);
    font-size: 15px;
    font-weight: 300;
    color: var(--stone-mid, #6B5E56);
    line-height: 1.7;
    max-width: none;
  }

  /* ── CTA ────────────────────────────────────────────────────── */

  .vv-cta {
    display: block;
    text-align: center;
    margin-top: 8px;
    text-decoration: none;
  }

  /* ── Mobile ─────────────────────────────────────────────────── */

  @media (max-width: 768px) {
    .vv {
      align-items: flex-end;
      justify-content: stretch;
    }

    .vv-panel {
      width: 100%;
      height: 94dvh;
      transform: translateY(104%);
      border-radius: 0;
    }

    .vv.is-open .vv-panel {
      transform: translateY(0);
    }

    .vv-body {
      grid-template-columns: 1fr;
      grid-template-rows: 52vw 1fr;
      overflow-y: auto;
    }

    .vv-gallery {
      height: 52vw;
      flex-shrink: 0;
    }

    .vv-info { overflow: visible; }

    .vv-info-scroll {
      padding: 24px 20px;
      padding-bottom: calc(36px + env(safe-area-inset-bottom));
    }

    .vv-thumbs {
      max-height: 58px;
      min-height: 58px;
    }

    .vv-thumb {
      width: 80px;
      height: 54px;
    }

    .vv-header {
      padding: 14px 20px;
    }
  }

  /* ── Reduced motion ─────────────────────────────────────────── */

  @media (prefers-reduced-motion: reduce) {
    .vv-panel { transition: none; }
    .vv-backdrop { transition: none; }
    .vv-thumb { transition: none; }
  }

</style>

<script>
(function () {
  'use strict';

  /* ── Parse video data ────────────────────────────────────── */

  const dataEl = document.getElementById('vv-data');
  if (!dataEl) return;

  let videos;
  try {
    videos = JSON.parse(dataEl.textContent || '[]');
  } catch {
    console.error('VideoViewer: failed to parse video data');
    return;
  }

  if (!videos.length) return;

  /* ── DOM references ──────────────────────────────────────── */

  const viewer     = document.getElementById('video-viewer');
  const backdrop   = document.getElementById('vv-backdrop');
  const panel      = document.getElementById('vv-panel');
  const closeBtn   = document.getElementById('vv-close');
  const prevBtn    = document.getElementById('vv-prev');
  const nextBtn    = document.getElementById('vv-next');
  const counterEl  = document.getElementById('vv-counter');
  const primaryVideo = document.getElementById('vv-primary-video');
  const captionEl  = document.getElementById('vv-caption');
  const thumbsEl   = document.getElementById('vv-thumbs');
  const infoEl     = document.getElementById('vv-info');

  if (!viewer || !primaryVideo || !thumbsEl) return;

  /* ── State ───────────────────────────────────────────────── */

  let currentIdx = 0;
  let isOpen     = false;
  let triggerEl  = null;

  /* ── Open ────────────────────────────────────────────────── */

  function openViewer(index) {
    if (index < 0 || index >= videos.length) return;
    currentIdx = index;

    viewer.removeAttribute('hidden');
    void viewer.getBoundingClientRect();

    viewer.setAttribute('aria-hidden', 'false');
    viewer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    isOpen = true;

    renderVideo();
    buildThumbs();

    setTimeout(() => closeBtn && closeBtn.focus(), 80);
  }

  /* ── Close ───────────────────────────────────────────────── */

  function closeViewer() {
    primaryVideo.pause();
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    isOpen = false;

    const onEnd = () => {
      viewer.setAttribute('hidden', '');
      viewer.removeEventListener('transitionend', onEnd);
    };
    viewer.addEventListener('transitionend', onEnd);

    if (triggerEl) triggerEl.focus();
    triggerEl = null;
  }

  /* ── Render current video ──────────────────────────────────── */

  function renderVideo() {
    const video = videos[currentIdx];
    if (!video) return;

    if (counterEl) {
      counterEl.textContent = `${currentIdx + 1} / ${videos.length}`;
    }

    if (prevBtn) prevBtn.disabled = currentIdx === 0;
    if (nextBtn) nextBtn.disabled = currentIdx === videos.length - 1;

    primaryVideo.pause();
    if (primaryVideo.getAttribute('src') !== video.src) {
      primaryVideo.setAttribute('src', video.src);
    }
    if (video.poster) primaryVideo.poster = video.poster;

    if (captionEl) captionEl.textContent = video.caption ?? '';

    if (infoEl) infoEl.scrollTop = 0;

    thumbsEl.querySelectorAll('.vv-thumb').forEach((t, i) => {
      const active = i === currentIdx;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const activeThumb = thumbsEl.querySelector('.vv-thumb.is-active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  /* ── Build thumbnail strip ───────────────────────────────── */

  function buildThumbs() {
    thumbsEl.innerHTML = '';

    videos.forEach((video, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vv-thumb' + (i === currentIdx ? ' is-active' : '');
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', video.caption || `Video ${i + 1}`);
      btn.setAttribute('aria-pressed', i === currentIdx ? 'true' : 'false');

      const image = document.createElement('img');
      image.src     = video.poster || '';
      image.alt     = '';
      image.setAttribute('aria-hidden', 'true');
      image.width   = 96;
      image.height  = 66;
      image.loading = 'lazy';

      const playBadge = document.createElement('span');
      playBadge.className = 'vv-thumb-play';
      playBadge.setAttribute('aria-hidden', 'true');

      btn.appendChild(image);
      btn.appendChild(playBadge);
      btn.addEventListener('click', () => goTo(i));
      thumbsEl.appendChild(btn);
    });
  }

  /* ── Navigation ──────────────────────────────────────────── */

  function goTo(index) {
    if (index < 0 || index >= videos.length) return;
    currentIdx = index;
    renderVideo();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIdx + 1));

  /* ── Close triggers ──────────────────────────────────────── */

  if (closeBtn) closeBtn.addEventListener('click', closeViewer);
  if (backdrop) backdrop.addEventListener('click', closeViewer);

  /* ── Keyboard ────────────────────────────────────────────── */

  document.addEventListener('keydown', e => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeViewer();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goTo(currentIdx - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        goTo(currentIdx + 1);
        break;
    }
  });

  /* ── Focus trap ──────────────────────────────────────────── */

  if (panel) {
    panel.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !isOpen) return;
      const focusable = Array.from(
        panel.querySelectorAll(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ── Tile click delegation ───────────────────────────────── */

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-open-video]');
    if (!btn) return;

    triggerEl = btn;
    const index = parseInt(btn.dataset.openVideo, 10);
    if (Number.isNaN(index)) return;

    openViewer(index);
  });

})();
</script>
```

- [ ] **Step 2: Import and render `VideoViewer` in `portfolio.astro`**

Find:
```astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import ProjectCard from '../components/portfolio/ProjectCard.astro';
import ProjectViewer from '../components/portfolio/ProjectViewer.astro';
```

Replace with:
```astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import ProjectCard from '../components/portfolio/ProjectCard.astro';
import ProjectViewer from '../components/portfolio/ProjectViewer.astro';
import VideoViewer from '../components/portfolio/VideoViewer.astro';
```

Find:
```astro
  <!-- Project viewer — renders all data, shown on demand -->
  <ProjectViewer projects={projects} />

</BaseLayout>
```

Replace with:
```astro
  <!-- Project viewer — renders all data, shown on demand -->
  <ProjectViewer projects={projects} />

  <!-- Video viewer — renders all video data, shown on demand -->
  <VideoViewer videos={siteVideos} />

</BaseLayout>
```

- [ ] **Step 3: Verify via a Playwright script**

Install Playwright temporarily if not already present (check first: `ls node_modules/playwright 2>/dev/null || npm install --no-save playwright && npx playwright install chromium`).

Write `/tmp/verify-video-viewer.mjs`:
```js
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem('tulip_splash_shown', '1'));
await page.goto('http://localhost:4321/portfolio', { waitUntil: 'networkidle' });
await page.waitForSelector('#portfolio-grid .pc', { timeout: 15000 });

await page.click('.portfolio-filter-btn[data-filter="videos"]');
await page.waitForTimeout(300);

await page.locator('.video-tile').first().click();
await page.waitForSelector('#video-viewer.is-open', { timeout: 5000 });
await page.waitForTimeout(500);

// Confirm it's the NEW VideoViewer that opened, not the old ProjectViewer
const projectViewerOpen = await page.locator('#project-viewer.is-open').count();
console.log('projectViewerOpen (should be 0):', projectViewerOpen);

const domState = await page.evaluate(() => {
  const v = document.getElementById('vv-primary-video');
  const rect = v.getBoundingClientRect();
  const centerEl = document.elementFromPoint(
    Math.floor(rect.left + rect.width / 2),
    Math.floor(rect.top + rect.height / 2)
  );
  return {
    videoSrc: v.currentSrc,
    videoReadyState: v.readyState,
    isCorrectlyPositioned: centerEl === v,
  };
});
console.log('DOM STATE:', JSON.stringify(domState, null, 2));

// REAL mouse click on the video's native controls (not a scripted .play()
// call — see Global Constraints: this is the only way to catch a
// [hidden]-cascade-style layout bug like the one fixed in this feature area).
const box = await page.locator('#vv-primary-video').boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(1000);

const afterClick = await page.evaluate(() => {
  const v = document.getElementById('vv-primary-video');
  return { paused: v.paused, error: v.error ? v.error.message : null };
});
console.log('AFTER REAL CLICK:', JSON.stringify(afterClick, null, 2));

// Prev/next navigation between videos
const counterBefore = await page.textContent('#vv-counter');
await page.click('#vv-next');
await page.waitForTimeout(300);
const counterAfter = await page.textContent('#vv-counter');
console.log('counterBefore:', counterBefore, 'counterAfter:', counterAfter);

// Close pauses playback
await page.click('#vv-close');
await page.waitForTimeout(300);
const afterClose = await page.evaluate(() => document.getElementById('vv-primary-video').paused);
console.log('paused after close (should be true):', afterClose);

await browser.close();
```

Run it:
```bash
node /tmp/verify-video-viewer.mjs
```

Expected: `projectViewerOpen (should be 0): 0`; `isCorrectlyPositioned: true`; after the real click, `paused: false` and `error: null`; `counterBefore`/`counterAfter` differ (e.g. `1 / 51` → `2 / 51`); `paused after close (should be true): true`.

- [ ] **Step 4: Commit**

```bash
git add src/components/portfolio/VideoViewer.astro src/pages/portfolio.astro
git commit -m "Add standalone VideoViewer component for browsing site videos"
```

(Use the plumbing fallback from Global Constraints if this hangs.)

---

### Task 3: Revert `ProjectViewer.astro` to its pre-video-feature form

**Files:**
- Modify: `src/components/portfolio/ProjectViewer.astro`

**Interfaces:**
- Consumes: nothing new — this task only removes code that Tasks 1 and 2 made obsolete (no photo project will ever have `.videos` again).
- Produces: `openViewer(projectId, currentFilter)` — two-argument form, matching how `ProjectCard.astro`'s trigger buttons and the click delegation already call it (they never sent a third argument for photo projects).

- [ ] **Step 1: Remove the `ProjectVideo` interface and `videos` field**

Find:
```astro
interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
  position?: string;
}

interface ProjectVideo {
  src: string;
  poster?: string;
  caption?: string;
}

interface Project {
  id: string;
  title: string;
  style: string;
  location: string;
  year: string;
  categories: string[];
  heroImage: ProjectImage;
  images: ProjectImage[];
  videos?: ProjectVideo[];
  materials: string[];
  description: string;
  featured?: boolean;
}
```

Replace with:
```astro
interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
  position?: string;
}

interface Project {
  id: string;
  title: string;
  style: string;
  location: string;
  year: string;
  categories: string[];
  heroImage: ProjectImage;
  images: ProjectImage[];
  materials: string[];
  description: string;
  featured?: boolean;
}
```

- [ ] **Step 2: Remove the `<video>` element from the markup**

Find:
```astro
        <!-- Primary image -->
        <div class="pv-primary-wrap">
          <img
            id="pv-primary-img"
            class="pv-primary-img"
            src=""
            alt=""
            width="1200"
            height="900"
          />
          <video
            id="pv-primary-video"
            class="pv-primary-video"
            controls
            playsinline
            preload="metadata"
            hidden
          ></video>
          <span
            class="pv-img-caption"
            id="pv-img-caption"
            aria-hidden="true"
          ></span>
        </div>
```

Replace with:
```astro
        <!-- Primary image -->
        <div class="pv-primary-wrap">
          <img
            id="pv-primary-img"
            class="pv-primary-img"
            src=""
            alt=""
            width="1200"
            height="900"
          />
          <span
            class="pv-img-caption"
            id="pv-img-caption"
            aria-hidden="true"
          ></span>
        </div>
```

- [ ] **Step 3: Remove the video-related CSS**

Find:
```astro
  .pv-primary-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: opacity 320ms ease;
    will-change: opacity;
  }

  .pv-primary-img[hidden] {
    display: none;
  }

  .pv-primary-img.is-fading {
    opacity: 0;
  }

  .pv-primary-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #000;
  }

  .pv-primary-video[hidden] {
    display: none;
  }

  .pv-img-caption {
```

Replace with:
```astro
  .pv-primary-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: opacity 320ms ease;
    will-change: opacity;
  }

  .pv-primary-img.is-fading {
    opacity: 0;
  }

  .pv-img-caption {
```

- [ ] **Step 4: Remove the `.pv-thumb-play` CSS**

Find:
```astro
  .pv-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .pv-thumb-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background: rgba(20, 18, 16, 0.18);
  }

  .pv-thumb-play::after {
    content: '';
    width: 0;
    height: 0;
    margin-left: 2px;
    border-style: solid;
    border-width: 5px 0 5px 8px;
    border-color: transparent transparent transparent rgba(253, 250, 246, 0.92);
  }

  .pv-thumb:focus-visible {
```

Replace with:
```astro
  .pv-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .pv-thumb:focus-visible {
```

- [ ] **Step 5: Remove the `primaryVideo` DOM reference**

Find:
```js
  const primaryImg  = document.getElementById('pv-primary-img');
  const primaryVideo = document.getElementById('pv-primary-video');
  const captionEl   = document.getElementById('pv-img-caption');
```

Replace with:
```js
  const primaryImg  = document.getElementById('pv-primary-img');
  const captionEl   = document.getElementById('pv-img-caption');
```

- [ ] **Step 6: Remove `getGallery()`**

Find:
```js
  /* ── Gallery helpers ─────────────────────────────────────── */

  function getGallery(project) {
    const images = (project.images || []).map(item => ({ ...item, type: 'image' }));
    const videos = (project.videos || []).map(item => ({ ...item, type: 'video' }));
    return [...images, ...videos];
  }

  /* ── State ───────────────────────────────────────────────── */
```

Replace with:
```js
  /* ── State ───────────────────────────────────────────────── */
```

- [ ] **Step 7: Simplify `openViewer()` back to two arguments**

Find:
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

Replace with:
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

- [ ] **Step 8: Remove the `primaryVideo.pause()` call from `closeViewer()`**

Find:
```js
  function closeViewer() {
    primaryVideo.pause();
    viewer.classList.remove('is-open');
```

Replace with:
```js
  function closeViewer() {
    viewer.classList.remove('is-open');
```

- [ ] **Step 9: Revert `setImage()` to image-only**

Find:
```js
  function setImage(imgIdx, instant) {
    const project = visibleProjects[currentProjIdx];
    if (!project) return;

    const gallery = getGallery(project);
    const item = gallery[imgIdx];
    if (!item) return;

    currentImgIdx = imgIdx;

    const applyItem = () => {
      if (item.type === 'video') {
        primaryImg.hidden = true;
        primaryVideo.hidden = false;
        primaryVideo.pause();
        if (primaryVideo.getAttribute('src') !== item.src) {
          primaryVideo.setAttribute('src', item.src);
        }
        if (item.poster) primaryVideo.poster = item.poster;
      } else {
        primaryVideo.pause();
        primaryVideo.removeAttribute('src');
        primaryVideo.hidden = true;
        primaryImg.hidden = false;
        primaryImg.src = item.src;
        primaryImg.alt = item.alt ?? '';
        primaryImg.style.objectPosition = item.position ?? 'center center';
      }
      if (captionEl) captionEl.textContent = item.caption ?? '';
    };

    if (instant) {
      applyItem();
    } else {
      primaryImg.classList.add('is-fading');
      setTimeout(() => {
        applyItem();
        primaryImg.classList.remove('is-fading');
      }, 160);
    }

    thumbsEl.querySelectorAll('.pv-thumb').forEach((t, i) => {
      const active = i === imgIdx;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const activeThumb = thumbsEl.querySelector('.pv-thumb.is-active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
```

Replace with:
```js
  function setImage(imgIdx, instant) {
    const project = visibleProjects[currentProjIdx];
    if (!project) return;

    const imgData = project.images[imgIdx];
    if (!imgData) return;

    currentImgIdx = imgIdx;

    if (instant) {
      primaryImg.src   = imgData.src;
      primaryImg.alt   = imgData.alt;
      primaryImg.style.objectPosition = imgData.position ?? 'center center';
      if (captionEl) captionEl.textContent = imgData.caption ?? '';
    } else {
      primaryImg.classList.add('is-fading');
      setTimeout(() => {
        primaryImg.src   = imgData.src;
        primaryImg.alt   = imgData.alt;
        primaryImg.style.objectPosition = imgData.position ?? 'center center';
        if (captionEl) captionEl.textContent = imgData.caption ?? '';
        primaryImg.classList.remove('is-fading');
      }, 160);
    }

    thumbsEl.querySelectorAll('.pv-thumb').forEach((t, i) => {
      const active = i === imgIdx;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const activeThumb = thumbsEl.querySelector('.pv-thumb.is-active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
```

- [ ] **Step 10: Revert `buildThumbs()` to image-only**

Find:
```js
  function buildThumbs(project) {
    thumbsEl.innerHTML = '';

    const gallery = getGallery(project);

    if (gallery.length <= 1) {
      thumbsEl.classList.add('pv-thumbs--solo');
      return;
    }

    thumbsEl.classList.remove('pv-thumbs--solo');

    gallery.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pv-thumb' + (i === 0 ? ' is-active' : '');
      btn.setAttribute('role', 'listitem');
      btn.setAttribute(
        'aria-label',
        item.caption ?? (item.type === 'video' ? `Video ${i + 1}` : `Photo ${i + 1}`)
      );
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');

      const image = document.createElement('img');
      image.src   = item.type === 'video' ? (item.poster ?? '') : item.src;
      image.alt   = '';
      image.setAttribute('aria-hidden', 'true');
      image.width  = 96;
      image.height = 66;
      image.loading = 'lazy';
      image.style.objectPosition = item.position ?? 'center center';

      btn.appendChild(image);

      if (item.type === 'video') {
        const playBadge = document.createElement('span');
        playBadge.className = 'pv-thumb-play';
        playBadge.setAttribute('aria-hidden', 'true');
        btn.appendChild(playBadge);
      }

      btn.addEventListener('click', () => setImage(i, false));
      thumbsEl.appendChild(btn);
    });
  }
```

Replace with:
```js
  function buildThumbs(project) {
    thumbsEl.innerHTML = '';

    if (project.images.length <= 1) {
      thumbsEl.classList.add('pv-thumbs--solo');
      return;
    }

    thumbsEl.classList.remove('pv-thumbs--solo');

    project.images.forEach((img, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pv-thumb' + (i === 0 ? ' is-active' : '');
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', img.caption ?? `Photo ${i + 1}`);
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');

      const image = document.createElement('img');
      image.src   = img.src;
      image.alt   = '';
      image.setAttribute('aria-hidden', 'true');
      image.width  = 96;
      image.height = 66;
      image.loading = 'lazy';
      image.style.objectPosition = img.position ?? 'center center';

      btn.appendChild(image);
      btn.addEventListener('click', () => setImage(i, false));
      thumbsEl.appendChild(btn);
    });
  }
```

- [ ] **Step 11: Revert the keyboard `ArrowDown` handler**

Find:
```js
      case 'ArrowDown':
        e.preventDefault();
        if (project && currentImgIdx < getGallery(project).length - 1) {
          setImage(currentImgIdx + 1, false);
        }
        break;
```

Replace with:
```js
      case 'ArrowDown':
        e.preventDefault();
        if (project && currentImgIdx < project.images.length - 1) {
          setImage(currentImgIdx + 1, false);
        }
        break;
```

- [ ] **Step 12: Revert the click delegation handler**

Find:
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

Replace with:
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

- [ ] **Step 13: Verify no video-related code remains, and photo browsing still works**

```bash
grep -c "video\|Video" src/components/portfolio/ProjectViewer.astro
```
Expected: `0` (case-sensitive `grep -c` without `-i` — confirms zero remaining references to video in any form, including comments, CSS, JS, and markup).

Write `/tmp/verify-photo-regression.mjs`:
```js
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem('tulip_splash_shown', '1'));
await page.goto('http://localhost:4321/portfolio', { waitUntil: 'networkidle' });
await page.waitForSelector('#portfolio-grid .pc', { timeout: 15000 });

await page.click('[data-open-project="french-chateau-estate"]');
await page.waitForSelector('#project-viewer.is-open', { timeout: 5000 });

const imageVisible = await page.locator('#pv-primary-img').isVisible();
const imageSrc = await page.getAttribute('#pv-primary-img', 'src');
const thumbCount = await page.locator('.pv-thumb').count();

console.log(JSON.stringify({ imageVisible, imageSrc, thumbCount }));

await browser.close();
```

Run it:
```bash
node /tmp/verify-photo-regression.mjs
```

Expected: `imageVisible: true`, `imageSrc` ends in `.jpg`, `thumbCount: 10` (the project's 10 photos only — no video thumbnails mixed in).

- [ ] **Step 14: Commit**

```bash
git add src/components/portfolio/ProjectViewer.astro
git commit -m "Revert ProjectViewer to photo-only, now that videos are fully separate"
```

(Use the plumbing fallback from Global Constraints if this hangs.)

---

### Task 4: Revert `ProjectCard.astro` to remove the video badge

**Files:**
- Modify: `src/components/portfolio/ProjectCard.astro`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing other tasks depend on — this is the final cleanup task.

- [ ] **Step 1: Remove the `ProjectVideo` interface and `videos` field**

Find:
```astro
interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
  position?: string;
}

interface ProjectVideo {
  src: string;
  poster?: string;
  caption?: string;
}

interface Project {
  id: string;
  title: string;
  style: string;
  location: string;
  year: string;
  categories: string[];
  heroImage: ProjectImage;
  images: ProjectImage[];
  videos?: ProjectVideo[];
  materials: string[];
  description: string;
  featured?: boolean;
}
```

Replace with:
```astro
interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
  position?: string;
}

interface Project {
  id: string;
  title: string;
  style: string;
  location: string;
  year: string;
  categories: string[];
  heroImage: ProjectImage;
  images: ProjectImage[];
  materials: string[];
  description: string;
  featured?: boolean;
}
```

- [ ] **Step 2: Remove the video badge markup**

Find:
```astro
      <!-- Video badge -->
      {project.videos && project.videos.length > 0 && (
        <span
          class="pc-video-badge"
          aria-label={`Includes ${project.videos.length} videos`}
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
            aria-hidden="true"
          >
            <polygon points="1,0.5 8.5,4.5 1,8.5" fill="currentColor" />
          </svg>
          Video
        </span>
      )}

      <!-- Multi-image badge -->
```

Replace with:
```astro
      <!-- Multi-image badge -->
```

- [ ] **Step 3: Remove the video badge CSS**

Find:
```astro
  .pc-trigger:hover .pc-image {
    transform: scale(1.03);
  }

  /* ── Video badge ────────────────────────────────────────────── */

  .pc-video-badge {
    position: absolute;
    top: var(--space-sm, 16px);
    left: var(--space-sm, 16px);
    background: rgba(200, 168, 130, 0.88);
    color: var(--white-warm, #FDFAF6);
    font-family: var(--font-sans, sans-serif);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 4px 8px 4px 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    z-index: 2;
    pointer-events: none;
  }

  /* ── Count badge ────────────────────────────────────────────── */
```

Replace with:
```astro
  .pc-trigger:hover .pc-image {
    transform: scale(1.03);
  }

  /* ── Count badge ────────────────────────────────────────────── */
```

- [ ] **Step 4: Verify no video-related code remains, and cards still render correctly**

```bash
grep -c "video\|Video" src/components/portfolio/ProjectCard.astro
```
Expected: `0`.

```bash
curl -s http://localhost:4321/portfolio | grep -c 'pc-video-badge'
```
Expected: `0` (badge doesn't render anywhere on the page).

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/portfolio
```
Expected: `200` (page still renders without errors).

- [ ] **Step 5: Clean up temporary Playwright install and verification scripts**

```bash
npm uninstall playwright
rm -f /tmp/verify-video-viewer.mjs /tmp/verify-photo-regression.mjs /tmp/portfolio-check.html
```

- [ ] **Step 6: Commit**

```bash
git add src/components/portfolio/ProjectCard.astro
git commit -m "Remove video badge from ProjectCard, now that videos are fully separate"
```

(Use the plumbing fallback from Global Constraints if this hangs.)

---

## After all tasks

Push the branch:
```bash
git push origin staging
```

This plan does not touch `main` — it stays on `staging` per the existing branch workflow.
