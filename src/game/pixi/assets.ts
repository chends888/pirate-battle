import { Assets, type Texture } from 'pixi.js'

export const MATCH_ASSET_ALIASES = {
  water: 'water',
  sand: 'sand',
  playerShip: 'playerShip',
  chaserShip: 'chaserShip',
  shooterShip: 'shooterShip',
  cannonBall: 'cannonBall',
  explosion1: 'explosion1',
  explosion2: 'explosion2',
  explosion3: 'explosion3',
} as const

const MATCH_ASSET_SRCS: Record<keyof typeof MATCH_ASSET_ALIASES, string> = {
  water: '/assets/png/default/tiles/tile_73.png',
  sand: '/assets/png/default/tiles/tile_18.png',
  playerShip: '/assets/png/default/ships/ship_6.png',
  chaserShip: '/assets/png/default/ships/ship_2.png',
  shooterShip: '/assets/png/default/ships/ship_4.png',
  cannonBall: '/assets/png/default/ship_parts/cannon_ball.png',
  explosion1: '/assets/png/default/effects/explosion_1.png',
  explosion2: '/assets/png/default/effects/explosion_2.png',
  explosion3: '/assets/png/default/effects/explosion_3.png',
}

export async function loadMatchAssets(): Promise<void> {
  const bundle = Object.entries(MATCH_ASSET_SRCS).map(([alias, src]) => ({
    alias,
    src,
  }))
  await Assets.load(bundle)
}

export function matchTexture(alias: keyof typeof MATCH_ASSET_ALIASES): Texture {
  return Assets.get(alias)
}
