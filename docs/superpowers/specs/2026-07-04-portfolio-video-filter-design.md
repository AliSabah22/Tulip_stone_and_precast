# Portfolio Video Filter — Design

## Problem

The portfolio page added an on-site video gallery to the French Château
Estate project (51 clips), but videos are only reachable by opening that
project's lightbox and scrolling the thumbnail strip past 10 photos.
Customers have no way to browse and play videos directly from the
portfolio page.

## Goal

Add a "Videos" filter to the existing portfolio filter bar. Selecting it
shows a dedicated grid of video tiles (poster + play icon) that customers
can click to play immediately, instead of hunting through a project's
photo gallery.

## Approach

Reuse the existing, already-verified `ProjectViewer` lightbox for
playback rather than building a new video-only modal. The video grid is
a new browsing surface; clicking a tile opens the same lightbox already
used for projects, jumped straight to that clip's position in the
gallery instead of index 0.

Two other approaches were considered and rejected:

- A brand-new, video-only lightbox (prev/next through videos, no project
  info panel) — duplicates working code (`ProjectViewer` already plays
  video correctly) for no real benefit.
- Treating "Videos" as just another category tag that filters the
  existing project-card grid — doesn't solve the actual problem, since
  customers would still land on a project card and have to scroll 51
  thumbnails deep to find playable video.

## Architecture

```
portfolio.astro
  ├─ projects[]            (existing data, includes .videos[] per project)
  ├─ allVideos             (NEW: derived flat list, computed at build time)
  ├─ filterOptions[]        (existing, gets one new entry: "videos")
  ├─ #portfolio-grid        (existing project-card grid)
  └─ #portfolio-video-grid  (NEW: video tile grid, sibling to the above)

portfolio-filter.js (existing, extended)
  └─ applyFilter(filter)
       - filter === 'videos'  → hide project grid, show video grid
       - otherwise            → show project grid (category-filtered as
                                 today), hide video grid

ProjectViewer.astro (existing, extended)
  ├─ click delegation reads data-open-index off the trigger,
  │  jumps setImage() there after opening (defaults to 0, unchanged
  │  behavior for project-card triggers which don't set this attribute)
  └─ openViewer(): when currentFilter === 'videos', visibleProjects is
     projects with videos (for prev/next), instead of the category-match
     logic (which wouldn't match "videos" as a category anyway)
```

## Data flow

1. At build time, `portfolio.astro` computes:
   ```js
   const allVideos = projects.flatMap(p =>
     (p.videos || []).map((v, i) => ({
       ...v,
       projectId: p.id,
       projectTitle: p.title,
       galleryIndex: p.images.length + i,
     }))
   );
   ```
   No new data files — this is derived entirely from the existing
   `projects` array, so adding videos to another project in the future
   automatically includes them in the video grid with zero code changes.

2. Each video tile renders as a button:
   ```html
   <button class="pv-tile" data-open-project={projectId} data-open-index={galleryIndex}>
     <img src={poster} loading="lazy" />
     <span class="pv-tile-play">...</span>
     <span class="pv-tile-caption">{projectTitle}</span>
   </button>
   ```

3. Click delegation in `ProjectViewer.astro` already listens for
   `[data-open-project]` clicks; it additionally reads
   `data-open-index` (if present) and calls `setImage(index, true)`
   right after `renderProject()` sets index 0.

## Components

- **Video grid markup**: added inline in `portfolio.astro` (same file
  that already defines `projects` and the filter bar), styled to match
  the existing `.pc` card visual language (poster image, play badge
  reusing the `.pv-thumb-play` triangle already built for the lightbox
  thumbnail strip). Not a separate `.astro` component — it's a single
  render loop over `allVideos`, no internal state or props of its own,
  so a component boundary would add indirection without benefit.
- **`portfolio-filter.js`**: existing file, one new branch in
  `applyFilter()`. No new files.
- **`ProjectViewer.astro`**: existing file, extends the existing click
  handler and `openViewer()`. No new files.

## Error handling

- If a project's `videos` array is empty or missing, `allVideos` simply
  excludes it — no special-casing needed since `flatMap` over an empty
  array produces nothing.
- If `data-open-index` is out of bounds for some reason (shouldn't
  happen since it's computed from the same data as the gallery), the
  existing `setImage()` guard (`if (!item) return;`) already no-ops
  safely — no new error handling required.

## Testing

- Server-rendered HTML check: confirm the "Videos" filter button and
  video tiles (with correct `data-open-index` values) appear in the
  `curl`'d page output.
- Browser check (Playwright, splash screen skipped via the existing
  `sessionStorage` guard): click "Videos" filter → project grid hides,
  video grid shows with the expected tile count → click a tile → lightbox
  opens with that exact clip already loaded and playing (`paused: false`,
  `currentTime` advancing), not the project's first photo.
- Confirm clicking "All Projects" (or any other existing filter) after
  "Videos" correctly hides the video grid and restores normal card
  filtering — regression check on existing behavior.

## Out of scope

- Deep-linking to a specific clip via URL query param (today's
  deep-link support only opens a project at index 0).
- Inline autoplay-on-hover in the video grid.

Both are straightforward follow-ups if wanted later, but aren't needed
to solve the stated problem.
