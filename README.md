# Pirate Battle

Top-down naval shooter for the Jungle Gaming game-developer challenge.

Live demo: [https://pirate-battle-silk.vercel.app](https://pirate-battle-silk.vercel.app)

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

## Ranking and history

Ranking is paginated (5 per page) and only includes matches with the same session time and spawn interval as the current options. History lists the local player's matches with date, score, duration, and end reason. A failed recording stays pending after refresh; retry it from the main menu without playing again.

## Network scenarios

On the main menu, pick a scenario (`success`, `empty`, `slow`, `error`, `timeout-on-submit`) and reset mock records. Confirmed submissions persist after refresh.

To reproduce a submit timeout without duplicates: set **timeout-on-submit**, finish a match, wait for the result error, then **Retry recording**. The first POST is delayed past the Axios 8s timeout; the retry uses the same `matchId` and does not create a second history row.

## Last result

The last completed match is stored in `localStorage` and shown on the main menu after refresh.

There are no environment variables. See `PERFORMANCE.md` for how to capture FPS and leak checks.
