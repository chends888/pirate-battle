export const SESSION_TIME_MIN_SECONDS = 60
export const SESSION_TIME_MAX_SECONDS = 180
export const SPAWN_INTERVAL_MIN_SECONDS = 2
export const SPAWN_INTERVAL_MAX_SECONDS = 15

export type GameConfig = {
  sessionTimeSeconds: number
  enemySpawnIntervalSeconds: number
  player: {
    maxHp: number
    forwardSpeed: number
    rotationSpeed: number
    radius: number
  }
  weapons: {
    frontal: WeaponConfig
    broadside: WeaponConfig
  }
  projectiles: {
    player: ProjectileConfig
    enemy: ProjectileConfig
  }
  chaser: EnemyShipConfig & { collisionDamage: number }
  shooter: EnemyShipConfig & { attackRange: number; fireCooldownSeconds: number }
  spawn: {
    minDistanceFromPlayer: number
    chaserWeight: number
    shooterWeight: number
  }
}

export type WeaponConfig = {
  cooldownSeconds: number
  projectileCount: number
  spread: number
}

export type ProjectileConfig = {
  speed: number
  damage: number
  lifetimeSeconds: number
  radius: number
}

export type EnemyShipConfig = {
  maxHp: number
  forwardSpeed: number
  rotationSpeed: number
  radius: number
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  sessionTimeSeconds: 120,
  enemySpawnIntervalSeconds: 5,
  player: {
    maxHp: 100,
    forwardSpeed: 180,
    rotationSpeed: 2.4,
    radius: 28,
  },
  weapons: {
    frontal: { cooldownSeconds: 0.45, projectileCount: 1, spread: 0 },
    broadside: { cooldownSeconds: 0.9, projectileCount: 3, spread: 18 },
  },
  projectiles: {
    player: { speed: 420, damage: 25, lifetimeSeconds: 1.4, radius: 6 },
    enemy: { speed: 320, damage: 12, lifetimeSeconds: 1.6, radius: 6 },
  },
  chaser: {
    maxHp: 40,
    forwardSpeed: 150,
    rotationSpeed: 2.1,
    radius: 26,
    collisionDamage: 30,
  },
  shooter: {
    maxHp: 50,
    forwardSpeed: 110,
    rotationSpeed: 1.8,
    radius: 26,
    attackRange: 280,
    fireCooldownSeconds: 1.15,
  },
  spawn: {
    minDistanceFromPlayer: 220,
    chaserWeight: 1,
    shooterWeight: 1,
  },
}

export function snapshotConfig(config: GameConfig): GameConfig {
  return structuredClone(config)
}

export function clampSessionTime(value: number): number {
  return Math.min(
    SESSION_TIME_MAX_SECONDS,
    Math.max(SESSION_TIME_MIN_SECONDS, Math.round(value)),
  )
}

export function clampSpawnInterval(value: number): number {
  return Math.min(
    SPAWN_INTERVAL_MAX_SECONDS,
    Math.max(SPAWN_INTERVAL_MIN_SECONDS, Number(value.toFixed(1))),
  )
}
