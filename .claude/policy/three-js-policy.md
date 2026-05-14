# Three.js Policy — Paper Grain Overlay

## Decision

A single full-screen WebGL canvas renders a procedural noise field as a **paper grain overlay**. On page load it fades from an opening intensity to a steady low alpha and remains there with a slow temporal drift. It is fixed at `z-index: 1` with `mix-blend-mode: multiply`, capped at `devicePixelRatio = 1.5`, fully disabled under `prefers-reduced-motion: reduce` (drift) and on WebGL-unavailable contexts (entire canvas omitted), and runs at reduced fidelity on mobile.

## Rationale

The aesthetic mandate is gallery-wall calm. A grain overlay does the work that paper texture does for printed photographs — it removes the antiseptic flatness of CSS pixels and unifies images of very different tonal ranges under one shared surface. The values below were chosen to be **felt, not seen**: a viewer should not be able to point at the grain and name it; they should only notice the page reads warmer than a default white screen. The opening fade exists because the steady-state grain is so faint that without an initial higher-intensity reveal, first-time visitors don't register the effect at all and miss the curatorial intent. After ~1.2 s the grain settles to a level low enough that text remains crisp and photographs are not visibly textured at 1:1 viewing distance.

`mix-blend-mode: multiply` against a `#fff` background darkens; against a black photograph it has nearly zero effect — this is the right asymmetry, since the empty wall (white) is where we want texture and the photograph (the subject) is where we want clarity. `z-index: 1` keeps it above the body background but below `#app` content (which sits at `z-index: 2+` per existing conventions) — wait, that's wrong: with `multiply` the canvas must be **above** the photographs to blend over them, so `z-index: 1` here assumes the photographs and chrome are at `z-index: 0` (default) and any interactive overlay (modals, future) sits at `z-index ≥ 2`. The canvas is also `pointer-events: none` so it never intercepts clicks.

DPR is capped at 1.5 (rather than the device's native 2 or 3) because grain at 3× retina is invisible — the eye cannot resolve a single noise pixel at that density — but fragment-shader cost scales with `dpr²`. Capping at 1.5 keeps the effect visible while cutting GPU load by ~75% versus uncapped on a 3× display.

## Specification

### Intensity

- **Initial alpha at page load: `0.10`** (uniform `uIntensity = 0.10`).
- **Steady-state alpha after fade-in: `0.04`**.
- **Fade duration: `1200 ms`**, easing `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out-style). Applied via uniform interpolation in the RAF loop, not CSS — the canvas itself stays at `opacity: 1`.
- **Fade trigger: `window.load` event** (after images begin rendering), not `DOMContentLoaded` — the grain reveal should land after the first photograph has painted, so it reads as "settling onto" the gallery wall rather than appearing before content.

### Drift behavior

- **`uTime` evolution speed: `0.05` time units per second.** The noise field shifts so slowly that two screenshots 5 s apart look identical at a glance but differ when alpha-diffed — this is the desired "barely alive" quality.
- **Drift function**: standard 2D simplex / value noise sampled with `vec2(uv * grainScale + uTime * driftVec)`, where `grainScale = 800.0` (≈ 1 noise cell per CSS pixel at 1× DPR — fine grain, not blobs) and `driftVec = vec2(0.013, 0.021)` (irrational ratio to avoid periodicity).
- **Drift paused under `prefers-reduced-motion: reduce`**: `uTime` is locked to a fixed value (e.g., `uTime = 7.3`, an arbitrary seed picked for a visually pleasing static field). The grain still renders, but it does not animate.

### Mobile behavior

- **Mobile = `matchMedia('(max-width: 639px)').matches` at init time.**
- **On mobile: REDUCED fidelity, not disabled.**
  - `uIntensity` steady-state: **`0.03`** (slightly fainter — small screens are viewed closer, so the same alpha reads louder).
  - DPR cap: **`1.0`** (further GPU savings on phone GPUs; grain is still visible).
  - `grainScale`: **`500.0`** (slightly coarser cells compensate for the lower DPR so the noise doesn't get crushed below visibility).
  - Drift speed unchanged (`0.05`).
- Rationale for not disabling: the grain is part of the gallery's identity. A mobile visitor seeing a flat-white site doesn't get the same artwork. The performance cost at DPR 1.0 with a 1-instruction fragment shader is negligible (< 1% frame budget on a 2020-era phone).

### DPR cap

- **Desktop / tablet: `Math.min(window.devicePixelRatio, 1.5)`.**
- **Mobile: `Math.min(window.devicePixelRatio, 1.0)`.**
- Applied via `renderer.setPixelRatio(cappedDpr)`.

### Z-index and blend mode

- **`z-index: 1`** on the `.grain-canvas` element.
- **`mix-blend-mode: multiply`**.
- **`position: fixed`**, `inset: 0`, `width: 100vw`, `height: 100vh`, `pointer-events: none`.
- **Photographs and chrome** sit at default stacking (effectively `z-index: 0`); any modal / focus overlay added later must use `z-index ≥ 2` so the grain blends *under* it, not over it.

### Resize handling

- On `window` resize, recompute renderer size via `renderer.setSize(window.innerWidth, window.innerHeight, false)` and update the orthographic camera / fullscreen quad uniforms. Debounce: **150 ms trailing**.
- DPR cap is re-evaluated on resize (a user dragging a window between displays of different scaling will get the appropriate cap).

### WebGL unavailable fallback

- On init, attempt `canvas.getContext('webgl2') || canvas.getContext('webgl')`. If both return `null`:
  - **Abort silently.** Do not create the `.grain-canvas` element in the DOM.
  - **Do not** substitute a CSS-image grain or SVG noise — those would either be too heavy (large data URI) or inconsistent with the WebGL version's blend behavior.
  - The site continues to function exactly as if the overlay module had never loaded. No console error; an optional `console.info('[grain] WebGL unavailable — overlay skipped')` is acceptable for debugging.

### Performance budget

- **Desktop / tablet target: 60 fps sustained** with `< 0.5 ms` per frame spent in the grain fragment shader on a 2020-era integrated GPU (Intel Iris Xe class).
- **Mobile target: 30 fps acceptable, 60 fps preferred.** The grain must never be the cause of dropped frames during scroll.
- **Bundle cost**: the grain module + Three.js subset must add **< 80 KB gzipped** to the initial JS bundle (Three.js core + `WebGLRenderer` + `OrthographicCamera` + `ShaderMaterial`; no GLTF, lights, or scene graph helpers needed).
- **Idle behavior**: when `document.hidden === true` (tab backgrounded), pause the RAF loop. Resume on `visibilitychange` → visible.

### `prefers-reduced-motion: reduce` handling — full spec

- **Listen via `matchMedia('(prefers-reduced-motion: reduce)')`** and respect changes during the session (the media query change event re-locks or re-unlocks the drift).
- **Effect when reduced**: drift `uTime` is frozen (does not advance), but the **fade-in still plays** — it is a one-shot opacity-like transition, not a continuous animation, and it serves as accessible feedback that the page has loaded. If the user explicitly objects to even the fade-in in user testing, the fallback is to skip the fade and render at steady-state `uIntensity` immediately; this is a follow-up policy revision, not v1.

## Implementation Owner

- **`rmaria-core-logic`** — `src/effects/grain.js` module. Owns: Three.js setup, shader, RAF loop, resize listener, `visibilitychange` listener, `prefers-reduced-motion` listener, WebGL availability check, mobile detection, fade-in interpolation. Module exports a single `initGrain()` function called once from `main.js`.
- **`rmaria-aesthetic-engineer`** — `.grain-canvas` CSS rule in `src/style.css`. Owns: `position: fixed`, `inset: 0`, `z-index: 1`, `mix-blend-mode: multiply`, `pointer-events: none`. Confirms no other stylesheet sets `mix-blend-mode` or higher `z-index` on body chrome that would interfere.

## Verification

1. **Initial intensity**: in DevTools, set a breakpoint at the first frame after `window.load`. Inspect the `uIntensity` uniform — must equal `0.10` (±0.001) at `t = 0` of the fade.
2. **Steady-state intensity**: at `t = 1200 ms` post-load, `uIntensity` must equal `0.04` desktop / `0.03` mobile (±0.001).
3. **Fade duration**: from `window.load` to steady state, elapsed time must be `1200 ms` (±50 ms tolerance for RAF jitter).
4. **Drift speed**: between two captured frames 1000 ms apart, `uTime` must have advanced by `0.05` (±0.005).
5. **Reduced motion**: enable `prefers-reduced-motion: reduce` in DevTools rendering panel; reload. Capture two screenshots 5 s apart — must be byte-identical (drift frozen).
6. **DPR cap**: on a 2× display, `renderer.getPixelRatio()` must return `1.5` desktop / `1.0` mobile.
7. **Z-index and blend**: `getComputedStyle(document.querySelector('.grain-canvas'))` must report `z-index: 1`, `mix-blend-mode: multiply`, `pointer-events: none`, `position: fixed`.
8. **WebGL unavailable**: in a browser with WebGL disabled (e.g., Chrome with `chrome://flags` → Disable WebGL), reload — no `.grain-canvas` element in the DOM, no console errors, all 31 thumbnails still render normally.
9. **Performance**: in DevTools Performance panel, record 5 s of scrolling at the index view on a mid-range laptop — must sustain ≥ 58 fps mean, with grain-shader cost < 0.5 ms per frame in the GPU track.
10. **Tab hidden**: switch tabs for 10 s, return — captured `uTime` advancement during the hidden period must be `0` (RAF was paused).
11. **Bundle size**: `npm run build` output for the grain-related chunk must be ≤ 80 KB gzipped.
12. **No interaction interference**: clicks anywhere on the grid must hit the underlying `<a>` / `<img>`, never the canvas (verify by inspecting `document.elementFromPoint(x, y)` returns the grid card, not the canvas).
