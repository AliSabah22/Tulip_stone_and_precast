# Video/Photo Separation — Design

## Supersedes

This design supersedes the "videos embedded in a project's combined
image+video gallery" approach from
`docs/superpowers/specs/2026-07-04-portfolio-video-filter-design.md`. That
design's "Videos" filter tab and video-tile grid concept are unchanged and
remain in place; what changes is where video data lives and what opens
when a video tile is clicked.

## Problem

Two issues surfaced after the video filter shipped:

1. **Bug (already fixed on `staging`, commit `da3119b8`):** clicking a
   video tile opened the lightbox, but the video was invisible and
   unplayable. Root cause: `.pv-primary-img` had no `[hidden]` CSS
   override, so the "hidden" photo never actually disappeared, pushed the
   video element below the clipped viewing area. Not part of this design
   — mentioned only because it happened in the same feature area.

2. **Structural ask:** videos are currently stored as a `.videos` array
   nested inside the `french-chateau-estate` project's data, alongside
   its photos. Clicking a video tile opens the *same* lightbox used for
   that project's photos, jumped to the video's position in a combined
   gallery. The user wants videos and photos fully separated — a video
   is not part of any photo project's data at all.

## Goal

Make videos a standalone, independent collection with no reference to
any project's title, materials, or description. Photo projects go back
to being photos-only, exactly as they were before the video feature
existed. A new, separate lightbox handles video browsing.

## Architecture

```
portfolio.astro
  ├─ projects[]        (existing, reverted — videos field removed)
  ├─ siteVideos[]       (NEW: standalone, flat, no project reference)
  ├─ #portfolio-grid    (existing project-card grid, unchanged)
  └─ #portfolio-video-grid
       └─ .video-tile buttons, data-open-video={index} (was
          data-open-project + data-open-index)

ProjectViewer.astro (reverted to pre-video-feature form)
  ├─ Project interface loses `videos?: ProjectVideo[]`
  ├─ getGallery() removed — back to reading project.images directly
  ├─ setImage()'s image/video branch removed — image-only again
  ├─ openViewer(projectId, currentFilter) — startIndex param and the
  │  currentFilter === 'videos' project-scoping branch both removed
  ├─ <video id="pv-primary-video"> element and its CSS removed
  └─ click delegation: data-open-index reading removed

VideoViewer.astro (NEW component)
  ├─ Receives siteVideos[] as an Astro prop, same pattern as
  │  ProjectViewer receiving projects[]
  ├─ Own modal shell: backdrop, slide-in panel, close/prev/next,
  │  counter — visually consistent with ProjectViewer but a separate,
  │  independent implementation (not a shared/refactored base)
  ├─ Single <video> element (no image/video toggle — this component
  │  never shows anything but video, so it cannot hit the
  │  [hidden]-cascade bug that ProjectViewer just had)
  ├─ Right info panel: fixed "On-Site Video" heading + short copy +
  │  "Start a Similar Project" CTA — no per-video title/materials
  ├─ Thumbnail strip: all siteVideos posters, click jumps directly
  ├─ Prev/next: cycles through siteVideos in array order, buttons
  │  disabled (not wrapping) at the first/last video — same convention
  │  ProjectViewer already uses for its own prev/next
  └─ Own click-delegation listener for [data-open-video], entirely
     separate from ProjectViewer's [data-open-project] listener

ProjectCard.astro (reverted)
  ├─ Project interface loses `videos?: ProjectVideo[]`
  └─ .pc-video-badge block and its CSS removed (dead code — no photo
     project will ever have .videos again under this design)

portfolio-filter.js — NO CHANGES. It only toggles which grid
(#portfolio-grid vs #portfolio-video-grid) is visible; it has no
knowledge of which lightbox a tile opens.
```

## Data flow

`portfolio.astro` frontmatter defines:

```js
interface SiteVideo {
  src: string;
  poster: string;
  caption: string;
}

const siteVideos: SiteVideo[] = [
  {
    src: "/porfolio_directory/project_1/videos/clip-01.mp4",
    poster: "/porfolio_directory/project_1/videos/clip-01.jpg",
    caption: "Site video — clip 1",
  },
  // ... one entry per clip, no project reference
];
```

This replaces the current `allVideos = projects.flatMap(...)` derivation
entirely — `siteVideos` is authored directly, the same way `projects` is
authored directly, not derived from another array.

Each video tile becomes:

```astro
<button
  class="video-tile"
  type="button"
  role="listitem"
  data-open-video={index}
  aria-label={`Play video: ${video.caption}`}
>
  <img src={video.poster} alt="" loading="lazy" width="400" height="300" class="video-tile-image" />
  <span class="video-tile-play" aria-hidden="true">...</span>
  <span class="video-tile-caption">{video.caption}</span>
</button>
```

The caption now shows each clip's own `caption` field ("Site video — clip
5") instead of the project title ("French Château Estate") repeated 51
times — a side effect of removing the project tie-in, and something the
final whole-branch review of the prior feature had flagged as a Minor
finding.

## Components

- **`VideoViewer.astro`** (new file, `src/components/portfolio/`,
  alongside `ProjectViewer.astro` and `ProjectCard.astro`): single
  responsibility — browse and play `siteVideos`. Takes `videos:
  SiteVideo[]` as its only prop. Does not know about `Project`, `images`,
  `materials`, or any project concept at all.
- **`ProjectViewer.astro`**: reverts to single responsibility — browse
  photos within a project, and browse between projects. No longer needs
  to know anything about videos.
- **`ProjectCard.astro`**: reverts to single responsibility — display a
  project's hero photo and photo count. No longer shows a video
  indicator, since a photo-project card can never represent video
  content under this design.

## Error handling

- If `siteVideos` is empty, the video grid renders zero tiles and the
  "Videos" filter shows "0 videos" — same graceful-empty behavior the
  existing `portfolio-filter.js` count logic already provides, no new
  handling needed.
- `VideoViewer`'s prev/next buttons use the same `.disabled` pattern
  `ProjectViewer` already uses at list boundaries — no wrap-around, no
  new edge case beyond what's already proven working.

## Testing

- Server-rendered HTML check: confirm `french-chateau-estate`'s project
  entry in the rendered page has no `videos` field artifacts, video
  tiles carry `data-open-video` (not `data-open-project`/`data-open-index`),
  and tile captions read per-clip text ("Site video — clip N") rather
  than the project title repeated on every tile.
- Confirm `ProjectCard.astro`'s video badge no longer renders anywhere
  on the page (grep rendered HTML for `pc-video-badge` — should be
  absent).
- Browser check (Playwright, splash screen skipped via the existing
  `sessionStorage` guard): click "Videos" filter → click a tile → confirm
  `VideoViewer`'s markup (not `ProjectViewer`'s) is what opened, video
  loads and plays via a **real mouse click** on its native controls (not
  a scripted `.play()` call — the prior bug was invisible to a scripted
  play call, so this check must simulate an actual user click to be
  trustworthy), prev/next moves between videos, closing pauses playback.
- Regression check: open a photo project card, confirm `ProjectViewer`
  still works exactly as it did before the video feature ever existed —
  photos only, no video-related DOM elements or JS branches involved.

## Out of scope

- Deep-linking to a specific clip via URL query param (already out of
  scope per the prior design; unchanged).
- Grouping or reordering videos by shoot date, location, or any
  secondary key — prev/next and the thumbnail strip use `siteVideos`'
  authored array order, nothing more.
