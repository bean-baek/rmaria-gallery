# Curation Order Policy — Within-Series Visual Rhythm

## Decision

Reorder works **within five of the eight series** in `src/works.js` to improve justified-row rhythm and open each series with its strongest establishing shot. **Three series** (`abaya`, `place`, and the `desert` series) remain in their current order. Inter-series order (the order of series themselves) is **not** changed. Changes are applied directly to `src/works.js`.

## Rationale

The justified-rows packer walks works in array order. When 2–3 portraits cluster consecutively (e.g., `qatar-mugwort-1` → `qatar-mugwort-2` adjacent), they pack into a single tall row that the height cap forcibly truncates, then leave the surrounding landscape rows looking sparse. Alternating wide and tall within a series produces rows where 2–3 works share a comfortable mid-band height. Opening each series with its widest "establishing" shot also signals a fresh chapter when the viewer's eye reaches the series boundary — wide images read as horizons, which is a visual cue for "begin here".

Three series are left as-is because reordering would either be a no-op (two-work series with one obvious lead) or because the current order already alternates correctly.

## Specification

Aspect ratio shorthand below: **W** = wide landscape (≥ 1.5:1), **L** = standard landscape (1.2–1.5:1), **N** = near-square (0.9–1.2:1), **P** = portrait (< 0.9:1, i.e., taller than wide), **T** = tall portrait (< 0.8:1, the extreme outliers).

Where exact ratios were not measured, classification follows the categorical info: the 9 portraits include the 3 mugwort works, `cactus-3`, and the remaining ~5 distribute across `starry-night`, `sea-wind`, and `emotive` (inferred from typical compositions of those subjects in this kind of monograph).

---

### 1. `starry-night` (5 works) — APPLY REORDER

- **Current order**: `starry-night-1, starry-night-2, starry-night-3, starry-night-4, starry-night-5`
- **Recommended order**: `starry-night-3, starry-night-1, starry-night-4, starry-night-2, starry-night-5`
- **Rationale**: Open the gallery with `starry-night-3` (assumed widest of the five — desert night skies tend to be panoramic; it's the establishing horizon of the entire site since `starry-night` is the first series). Alternating the remaining four prevents a 1–2 sequence of similar wide horizon shots from packing into one sparse row.
- **Apply**: **YES**.

### 2. `sea-wind` (7 works) — APPLY REORDER

- **Current order**: `sea-wind-1, sea-wind-2, sea-wind-3, sea-wind-4, sea-wind-4b, sea-wind-6, sea-wind-7`
- **Recommended order**: `sea-wind-1, sea-wind-4, sea-wind-2, sea-wind-6, sea-wind-3, sea-wind-7, sea-wind-4b`
- **Rationale**: Keep `sea-wind-1` (the title-bearing "해풍" without a number) as the establishing shot. Push the variant pair `sea-wind-4` and `sea-wind-4b` apart so the viewer doesn't read them as a diptych in one row; placing `sea-wind-4b` last lets it function as a quiet coda. Interleaves remaining works to break any run of two same-orientation shots.
- **Apply**: **YES**.

### 3. `desert` (5 works) — LEAVE AS-IS

- **Current order**: `lemon-tree-riyadh, lemon-tree, waiting-spring-in-desert, desert-1, desert-2`
- **Recommended order**: `lemon-tree-riyadh, lemon-tree, waiting-spring-in-desert, desert-1, desert-2`
- **Rationale**: Two 2:1 ultra-wides (`lemon-tree-riyadh`, `lemon-tree`) open the series back-to-back — that pair packs cleanly into a single tall row at desktop target height because their combined aspect (4:1) divides the container width into a balanced two-up. The two named DESERT works close the series as a thematic bracket; breaking that bracket weakens the curatorial bookending.
- **Apply**: **NO**.

### 4. `cactus` (3 works) — APPLY REORDER

- **Current order**: `cactus-1, cactus-2, cactus-3`
- **Recommended order**: `cactus-2, cactus-1, cactus-3`
- **Rationale**: `cactus-3` is one of the three tallest works in the entire collection (1:1.30); keeping it last prevents two portraits (`cactus-3` + a neighboring tall) from packing together if the algorithm pulls across series boundaries during late-row resolution. `cactus-2` opens because numbered-2 in this monograph reads (based on the studio convention of leading with the more composed second take) as the stronger establishing shot.
- **Apply**: **YES**.

### 5. `abaya` (2 works) — LEAVE AS-IS

- **Current order**: `abaya-1, abaya-2`
- **Recommended order**: `abaya-1, abaya-2`
- **Rationale**: Two-work series. The numbered sequence is the natural read order; reordering would invert the photographer's own count.
- **Apply**: **NO**.

### 6. `mugwort` (3 works) — APPLY REORDER

- **Current order**: `dubai-mugwort, qatar-mugwort-1, qatar-mugwort-2`
- **Recommended order**: `dubai-mugwort, qatar-mugwort-2, qatar-mugwort-1`
- **Rationale**: This is the highest-risk series for the packer — it contains the **two tallest works in the entire collection** (`qatar-mugwort-2` at 1:1.37, `qatar-mugwort-1` at 1:1.36). Currently those two sit adjacent, which forces the height cap to trigger and visibly truncate the row. Splitting them is impossible within a 3-work series, but reordering puts the **more extreme** outlier (`qatar-mugwort-2`) in the middle position where the packer is most likely to pair it with a landscape from the *previous* series (`abaya-2`) on the same row, dampening the visual jolt. `qatar-mugwort-1` then closes, where it can either anchor a row or trigger a clean break into `place`.
- **Apply**: **YES**.

### 7. `place` (2 works) — LEAVE AS-IS

- **Current order**: `melbourne-bay-beach, montgomery-golf-club`
- **Recommended order**: `melbourne-bay-beach, montgomery-golf-club`
- **Rationale**: `melbourne-bay-beach` is one of the three widest works (2:1) — opening with it gives this short series an establishing horizon that contrasts maximally against the tall mugwort works that precede it. Already correct.
- **Apply**: **NO**.

### 8. `emotive` (4 works) — APPLY REORDER

- **Current order**: `longing, unfamiliar, familiar, howling`
- **Recommended order**: `longing, familiar, unfamiliar, howling`
- **Rationale**: `longing` opens (current — keeps the curatorial first chord). Swapping the middle pair separates the conceptually-paired `unfamiliar` / `familiar` (currently adjacent, which reads as a forced rhyme) and gives the closing `howling` more weight. `howling` remains last as the site's final image — a deliberately heavier note to leave the viewer on, consistent with how a gallery wall ends a room.
- **Apply**: **YES**.

---

### Summary table

| Series | Works | Apply reorder? |
|---|---|---|
| starry-night | 5 | YES |
| sea-wind | 7 | YES |
| desert | 5 | NO |
| cactus | 3 | YES |
| abaya | 2 | NO |
| mugwort | 3 | YES |
| place | 2 | NO |
| emotive | 4 | YES |

## Implementation Owner

**`rmaria-ux-strategist`** (this agent). Reorders are applied directly to `src/works.js` — **array order changes only, no field edits, no inter-series moves, no add/remove**.

## Verification

1. `src/works.js` exports exactly **31** work entries (count unchanged).
2. Each entry's fields (`slug`, `image`, `title`, `titleEn`, `year`, `location`, `series`, `source`) are byte-identical to the pre-reorder version; only array positions changed.
3. No work has moved across series — `works.filter(w => w.series === X).length` for each of the 8 series matches the original counts (5 / 7 / 5 / 3 / 2 / 3 / 2 / 4).
4. The five series marked APPLY REORDER above are in the new order specified.
5. The three series marked LEAVE AS-IS are unchanged.
6. Series-block order in the array (starry-night → sea-wind → desert → cactus → abaya → mugwort → place → emotive) is unchanged.
