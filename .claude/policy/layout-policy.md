# Layout Policy — Justified Rows for the r.maria Grid

## Decision

The index grid uses a **Flickr-style justified-rows algorithm** above 640 px and falls back to a single column at original aspect below 640 px. Target row heights, gaps, break logic, and outlier caps are fixed numerically below; the last row never stretches; no image is ever cropped, distorted, or non-uniformly scaled.

## Rationale

The collection is 71% landscape / 29% portrait with aspect ratios spanning **2:1** (widest: `lemon-tree`, `lemon-tree-riyadh`, `melbourne-bay-beach`) to **1:1.37** (tallest: `qatar-mugwort-2`). A fixed CSS grid forces uniform cell heights, which either crops (violates the no-crop invariant) or leaves harsh whitespace gutters around portraits. A justified-rows packer preserves each photograph's exact aspect ratio while producing a calm, gallery-wall-style top edge per row. The target heights below were chosen so the **median landscape (~3:2)** sits at a comfortable mid-range — large enough to be the subject of attention, small enough that 2–3 works share a row on desktop — and so the **tallest portraits never exceed the viewport**, keeping the photograph fully present without forcing scroll-to-see.

Last-row stretching is forbidden because a half-filled row stretched to container width would force the final 1–2 images to display larger than their peers — that asymmetry reads as a layout bug on a gallery wall and would visually privilege whichever works happened to land at the tail of the collection (currently the `emotive` series). The single-image-in-row protection exists for the same reason: a lone tall portrait that the packer could not pair with anything must render at its natural target height, not balloon to fill the viewport.

## Specification

### Breakpoints and target row heights

| Viewport | Mode | Target row height | Tolerance band |
|---|---|---|---|
| `≥ 1024 px` (desktop) | Justified rows | **320 px** | 260–400 px |
| `640–1023 px` (tablet) | Justified rows | **240 px** | 200–300 px |
| `< 640 px` (mobile) | Single column | n/a — natural aspect | n/a |

- "Target row height" is the height the packer aims for when scaling a candidate row of images to fill the container width.
- "Tolerance band" is the **min / max allowed actual height** after the packer scales the row to fit; rows that would fall outside the band trigger row-break decisions (see below).

### Gap

- **Row gap and column gap: `--space-3` (16 px)**, both axes, both breakpoints (desktop and tablet justified modes).
- Mobile single-column row gap: **`--space-5` (32 px)** to give portraits breathing room when they stack vertically.
- Container outer padding: unchanged from `plan.md` (`clamp(24px, 5vw, 80px)`).

### Row-break threshold logic

The packer walks works in array order and accumulates them into a candidate row. For each new candidate work:

1. Compute the **row's natural width** as `Σ(targetHeight × aspectRatio_i) + gap × (n − 1)`.
2. Compute the **scale factor** `s = containerWidth / naturalWidth`.
3. Compute the **resulting actual row height** `h = targetHeight × s`.
4. **Commit-or-extend decision:**
   - If `h` is **within the tolerance band**, commit the current row (including the new candidate) and start a fresh row with the next work.
   - If `h` is **above the band's max** (row is too sparse — too few images), do **not** commit; pull in the next work as a new candidate and re-evaluate.
   - If `h` is **below the band's min** (row would be crushed — too many images), commit the row **without** the new candidate; the new candidate becomes the first member of the next row.

This guarantees every committed row's actual height lies in the tolerance band, except the last row and any single-image-in-row case.

### Last-row behavior

- The final row is **never stretched** to container width.
- It renders at the desktop target height **320 px** (or tablet target **240 px**) regardless of how many works it contains.
- The row is **left-aligned**; remaining horizontal space stays empty (whitespace is a feature, not a bug, on a gallery wall).

### Single-image-in-row protection

When a row contains exactly one work (either by tolerance-band logic or as the last row):

- The image renders at its **natural target row height** (320 px desktop / 240 px tablet).
- **Maximum stretch factor versus target height: 1.0.** A single image never scales *up* beyond target height to fill the row.
- A single tall portrait at 320 px × (1/1.37) renders ~234 px wide and sits left-aligned in its row.

### Maximum displayed height cap

- **Desktop cap: 540 px.** No image — committed via packing, last-row, or single-image — may display taller than 540 px.
- **Tablet cap: 420 px.**
- This caps `qatar-mugwort-2` (1:1.37 → would be 438 px tall at full-width row), `qatar-mugwort-1`, and `cactus-3` from dominating a sparse row. When the packer would produce `h > cap`, the row is forcibly committed at `h = cap` and the next work begins a new row.

### Mobile fallback (< 640 px)

- **Single column** layout — justified rows fully disabled below 640 px.
- Each work renders at `width: 100%` of the content column, height computed from `aspect-ratio` only.
- Row gap: `--space-5` (32 px).
- Caption block stacked directly beneath each image (existing markup, unchanged).
- Rationale: on phones the photograph already occupies viewport width; justified-rows arithmetic at 360–420 px container width produces unreadable thumbnails. Single column is the gallery-wall posture at small viewports.

### Aesthetic invariants (restated for the implementer)

- No `border-radius` on grid cells.
- No `box-shadow` on grid cells.
- No `transform` on hover; no `scale` or `translate` on the image element ever.
- `object-fit: contain` or natural sizing only — never `cover`.
- The cell's `<img>` reflects the exact source aspect ratio via `width`/`height` attributes (computed by the packer) or `aspect-ratio` CSS — never both with conflicting values.

## Implementation Owner

- **`rmaria-core-logic`** — JavaScript packer module (consumes `works.js` + each work's aspect ratio, emits per-row geometry on resize). Owns the algorithm, breakpoint detection, ResizeObserver wiring, and DOM mutation.
- **`rmaria-aesthetic-engineer`** — CSS for `.grid`, `.grid__row`, `.grid__cell`, gap tokens, mobile single-column rules, and the `.is-loaded` fade-in (unchanged from `plan.md`).

## Verification

1. **Target heights**: at viewport widths 1280 / 1024 / 800 / 640 / 375 px, inspect any committed (non-last) row — actual height must fall in the tolerance band for its breakpoint, or equal the cap.
2. **Gap**: computed style of `.grid__row` must report `gap: 16px` at ≥ 640 px and the column wrapper must report `row-gap: 32px` at < 640 px.
3. **Last row**: scroll to the end of `#/`; measure the final row's height. It must equal **320 px** (desktop) or **240 px** (tablet), and the row must be left-aligned (right-side whitespace present).
4. **Single-image-in-row**: temporarily filter the work list to one tall portrait (e.g., `qatar-mugwort-2`) in dev — it must render at 320 px tall × ~234 px wide, left-aligned, not full-container-width.
5. **Outlier cap**: at desktop widths where the packer would stretch `qatar-mugwort-2` above 540 px, measure its rendered height — must be ≤ 540 px.
6. **Mobile**: at 375 px viewport, DOM inspection must show no `.grid__row` element (or the rows must collapse to flex-direction: column); each `<img>` must report `width: 100%` and natural `aspect-ratio`.
7. **Invariants**: `getComputedStyle` on any `.grid__cell img` must report `border-radius: 0px`, `box-shadow: none`; hovering must not change `transform`.
8. **No crop**: for every image, `naturalWidth / naturalHeight` must equal `offsetWidth / offsetHeight` within ±0.5%.
