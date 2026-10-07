# Pirate Battle

Top-down naval shooter for the Jungle Gaming game-developer challenge.

**Estimate sent mentally for a 2-day window:** complete playable match + required stack + deploy by Thursday midday. Visual polish and exhaustive Playwright coverage are trimmed first if time slips.

## Setup

```bash
npm install
npx playwright install chromium
npm run dev
```

Challenge assets live in `public/assets/` (copied from the official challenge repo).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript project build |
| `npm run lint` | Oxlint |
| `npm run test:e2e` | Playwright (Chromium desktop + mobile) |

MSW runs in development and in the published build so ranking/history work without a backend.

## Controls (planned)

- W / Up: move forward
- A/D or arrows: rotate
- Space: frontal shot
- Q / E: left / right broadside
- Esc: pause
- Touch buttons on mobile (landscape)

## Options

- Game session time: 60–180 seconds
- Enemy spawn time: 2–15 seconds (must be positive)
- Saved in `localStorage` and snapshotted when a match starts

## Network scenarios

On the main menu, pick a scenario (`success`, `empty`, `slow`, `error`, `timeout-on-submit`) and reset mock records. Confirmed submissions persist after refresh.
