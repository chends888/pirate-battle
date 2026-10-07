import type { GameConfig } from '../config'

export const ARENA_WIDTH = 1280
export const ARENA_HEIGHT = 720
export const SIM_STEP_SECONDS = 1 / 60

export type Intent = {
  forward: boolean
  rotateLeft: boolean
  rotateRight: boolean
  fireFront: boolean
  fireLeft: boolean
  fireRight: boolean
}

export const EMPTY_INTENT: Intent = {
  forward: false,
  rotateLeft: false,
  rotateRight: false,
  fireFront: false,
  fireLeft: false,
  fireRight: false,
}

export type Island = {
  x: number
  y: number
  radius: number
}

export type Projectile = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  damage: number
  life: number
  owner: 'player' | 'enemy'
  spent: boolean
}

export type Ship = {
  id: string
  kind: 'player' | 'chaser' | 'shooter'
  x: number
  y: number
  rotation: number
  radius: number
  hp: number
  maxHp: number
  alive: boolean
  frontalCooldown: number
  leftCooldown: number
  rightCooldown: number
}

export type Effect = {
  id: number
  kind: 'explosion'
  x: number
  y: number
  age: number
  life: number
}

export type MatchStatus = 'running' | 'ended'

export type WorldSnapshot = {
  status: MatchStatus
  endReason: 'time' | 'death' | null
  elapsedSeconds: number
  remainingSeconds: number
  score: number
  player: Ship
  enemies: Ship[]
  projectiles: Projectile[]
  effects: Effect[]
  islands: Island[]
  config: GameConfig
}
