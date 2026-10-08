# Architecture

## Split of responsibilities

- **React** owns menus, options, ranking/history, pause/result dialogs, and semantic HUD copy.
- **PixiJS** owns the arena, ships, projectiles, HP bars, and combat VFX.
- **Simulation** (pure TypeScript, next) owns movement, collisions, AI, spawn, scoring, and the match clock. It steps on a fixed timestep so tests can inject time.
- **Input** maps keyboard/touch to intents. The sim consumes intents; Pixi does not.

Combat state stays in the simulation. React subscribes to discrete events (pause, score, match end), not every frame.

## Simulation cycle

`MatchRuntime` uses a fixed 1/60s step. Pixi ticker delta is accumulated; pause resets the accumulator so a hidden tab cannot dump movement. Tests drive `window.__game.endMatch` / `step` instead of waiting on the real clock.

## Collisions

Ships and projectiles are circles. Islands are static circles. Ships are pushed out of islands and clamped to the arena. Player shots damage enemies once; enemy shots damage the player once. A Chaser ram damages the player and destroys the Chaser without scoring.

## Data

Ranking and match history are REST resources mocked with MSW, called with Axios, cached with TanStack Query. A completed match is posted once, keyed by `matchId`. Pending posts survive refresh in `localStorage`. API failures never block Play or Options. The result screen is the only place a match is recorded.

## Resource lifecycle

The Pixi application, ticker, and input listeners are created when entering combat and destroyed when leaving or restarting, including under React Strict Mode.

## Persistence

- Player options
- Last completed result
- Confirmed MSW records
- Pending match submissions

Abandoned matches (leave combat or refresh mid-fight) are not recorded.
