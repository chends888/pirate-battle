# Performance notes

**Reference environment:** Linux desktop, Chromium (Playwright 1.63 / Chrome for Testing 153), 1280×720 arena letterboxed in the browser, default match config (120s, spawn every 5s).

**Target:** 60 FPS during combat (`SIM_STEP_SECONDS = 1/60`). The simulation is fixed-step; Pixi only mirrors the snapshot, and React HUD updates at ~10 Hz so the UI tree is not rebuilt every frame.

## Combat (3-minute match)

On this machine the arena stayed visually smooth at 60 FPS with typical entity counts well under 40 (1 player, a handful of ships, short-lived projectiles, one island). A 3-minute default match does not accumulate projectiles: they expire by lifetime, arena exit, or impact.

To reproduce:

1. `npm run build && npm run preview`
2. Open Chromium Performance panel, start recording, Play, wait 3 minutes, stop.
3. Note FPS, frame-time p95, and a count from `window.__game.snapshot()` (enemies + projectiles).

## Memory (five enter / play / leave cycles)

Pixi is created on match enter and `destroy()`’d on leave (view removed, textures kept in the Assets cache). Five Play → Abandon/Result → Main Menu cycles should not grow listeners or canvases. If heap climbs, check that `window.__game` is cleared and that only one `<canvas>` exists in the match host.

## Limits

- No GPU capture is checked into the repo from this window.
- Visual load is modest (tiling water, one island sprite, ~24×24 ships). Bottlenecks, if any, would be JS sim at very high spawn rates, not fill rate.
- `timeout-on-submit` is an MSW scenario and is unrelated to frame time.
