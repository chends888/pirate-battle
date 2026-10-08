import type { GameConfig } from '../config'
import {
  clampToArena,
  circleHits,
  pushCircleOutOfCircle,
} from './collisions'
import {
  angleTo,
  createRng,
  facingVector,
  rotateToward,
} from './steering'
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  EMPTY_INTENT,
  type Effect,
  type Intent,
  type Island,
  type Projectile,
  type Ship,
  type WorldSnapshot,
} from './types'

export class World {
  readonly config: GameConfig
  readonly islands: Island[]
  readonly player: Ship
  readonly enemies: Ship[] = []
  readonly projectiles: Projectile[] = []
  readonly effects: Effect[] = []
  score = 0
  elapsedSeconds = 0
  status: WorldSnapshot['status'] = 'running'
  endReason: WorldSnapshot['endReason'] = null

  private nextProjectileId = 1
  private nextEnemyId = 1
  private nextEffectId = 1
  private spawnElapsed: number
  private intent: Intent = { ...EMPTY_INTENT }
  private readonly random: () => number

  constructor(config: GameConfig, seed = 1) {
    this.config = config
    this.random = createRng(seed)
    this.spawnElapsed = config.enemySpawnIntervalSeconds
    this.islands = [
      { x: ARENA_WIDTH * 0.52, y: ARENA_HEIGHT * 0.42, radius: 118 },
    ]
    this.player = {
      id: 'player',
      kind: 'player',
      x: ARENA_WIDTH * 0.22,
      y: ARENA_HEIGHT * 0.72,
      rotation: 0,
      radius: config.player.radius,
      hp: config.player.maxHp,
      maxHp: config.player.maxHp,
      alive: true,
      frontalCooldown: 0,
      leftCooldown: 0,
      rightCooldown: 0,
    }
  }

  setIntent(intent: Intent): void {
    this.intent = intent
  }

  forceEnd(reason: 'time' | 'death'): void {
    if (this.status !== 'running') return
    this.status = 'ended'
    this.endReason = reason
    if (reason === 'time') {
      this.elapsedSeconds = this.config.sessionTimeSeconds
    } else {
      this.player.hp = 0
      this.player.alive = false
    }
  }

  step(dt: number): void {
    if (this.status !== 'running') return

    this.elapsedSeconds += dt
    if (this.elapsedSeconds >= this.config.sessionTimeSeconds) {
      this.elapsedSeconds = this.config.sessionTimeSeconds
      this.status = 'ended'
      this.endReason = 'time'
      return
    }

    this.tickCooldowns(dt)
    this.spawnEnemies(dt)
    this.movePlayer(dt)
    this.moveEnemies(dt)
    this.resolveChaserImpacts()
    this.tryFire()
    this.shooterFire()
    this.moveProjectiles(dt)
    this.collideProjectiles()
    this.ageEffects(dt)
    this.compactEnemies()
    this.checkPlayerDeath()
  }

  snapshot(): WorldSnapshot {
    return {
      status: this.status,
      endReason: this.endReason,
      elapsedSeconds: this.elapsedSeconds,
      remainingSeconds: Math.max(
        0,
        this.config.sessionTimeSeconds - this.elapsedSeconds,
      ),
      score: this.score,
      player: { ...this.player },
      enemies: this.enemies.map((enemy) => ({ ...enemy })),
      projectiles: this.projectiles.map((projectile) => ({ ...projectile })),
      effects: this.effects.map((effect) => ({ ...effect })),
      islands: this.islands.map((island) => ({ ...island })),
      config: this.config,
    }
  }

  private tickCooldowns(dt: number): void {
    this.player.frontalCooldown = Math.max(0, this.player.frontalCooldown - dt)
    this.player.leftCooldown = Math.max(0, this.player.leftCooldown - dt)
    this.player.rightCooldown = Math.max(0, this.player.rightCooldown - dt)
    for (const enemy of this.enemies) {
      enemy.frontalCooldown = Math.max(0, enemy.frontalCooldown - dt)
    }
  }

  private spawnEnemies(dt: number): void {
    this.spawnElapsed += dt
    const interval = this.config.enemySpawnIntervalSeconds
    while (this.spawnElapsed >= interval) {
      this.spawnElapsed -= interval
      const point = this.findSpawnPoint()
      if (!point) continue
      const kind = this.pickEnemyKind()
      const spec = kind === 'chaser' ? this.config.chaser : this.config.shooter
      this.enemies.push({
        id: `${kind}-${this.nextEnemyId}`,
        kind,
        x: point.x,
        y: point.y,
        rotation: angleTo(point.x, point.y, this.player.x, this.player.y),
        radius: spec.radius,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        alive: true,
        frontalCooldown: 0.35,
        leftCooldown: 0,
        rightCooldown: 0,
      })
      this.nextEnemyId += 1
    }
  }

  private pickEnemyKind(): 'chaser' | 'shooter' {
    const { chaserWeight, shooterWeight } = this.config.spawn
    const total = chaserWeight + shooterWeight
    return this.random() * total < chaserWeight ? 'chaser' : 'shooter'
  }

  private findSpawnPoint(): { x: number; y: number } | null {
    const minDistance = this.config.spawn.minDistanceFromPlayer
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const x = 40 + this.random() * (ARENA_WIDTH - 80)
      const y = 40 + this.random() * (ARENA_HEIGHT - 80)
      const farFromPlayer =
        Math.hypot(x - this.player.x, y - this.player.y) >= minDistance
      const clearOfIslands = this.islands.every(
        (island) => !circleHits(x, y, 30, island.x, island.y, island.radius + 12),
      )
      if (farFromPlayer && clearOfIslands) return { x, y }
    }
    return null
  }

  private movePlayer(dt: number): void {
    const { player, config } = this
    if (!player.alive) return
    if (this.intent.rotateLeft) player.rotation -= config.player.rotationSpeed * dt
    if (this.intent.rotateRight) player.rotation += config.player.rotationSpeed * dt

    if (this.intent.forward) {
      const facing = facingVector(player.rotation)
      player.x += facing.x * config.player.forwardSpeed * dt
      player.y += facing.y * config.player.forwardSpeed * dt
    }

    this.constrainShip(player)
  }

  private moveEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue
      const spec = enemy.kind === 'chaser' ? this.config.chaser : this.config.shooter
      const target = angleTo(enemy.x, enemy.y, this.player.x, this.player.y)
      enemy.rotation = rotateToward(enemy.rotation, target, spec.rotationSpeed * dt)

      const distance = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y)
      const shouldAdvance =
        enemy.kind === 'chaser' || distance > this.config.shooter.attackRange * 0.72

      if (shouldAdvance) {
        const facing = facingVector(enemy.rotation)
        enemy.x += facing.x * spec.forwardSpeed * dt
        enemy.y += facing.y * spec.forwardSpeed * dt
      }

      this.constrainShip(enemy)
    }
  }

  private constrainShip(ship: Ship): void {
    const clamped = clampToArena(
      ship.x,
      ship.y,
      ship.radius,
      ARENA_WIDTH,
      ARENA_HEIGHT,
    )
    ship.x = clamped.x
    ship.y = clamped.y

    for (const island of this.islands) {
      const pushed = pushCircleOutOfCircle(
        ship.x,
        ship.y,
        ship.radius,
        island.x,
        island.y,
        island.radius,
      )
      ship.x = pushed.x
      ship.y = pushed.y
    }

    const reclamped = clampToArena(
      ship.x,
      ship.y,
      ship.radius,
      ARENA_WIDTH,
      ARENA_HEIGHT,
    )
    ship.x = reclamped.x
    ship.y = reclamped.y
  }

  private resolveChaserImpacts(): void {
    if (!this.player.alive) return
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.kind !== 'chaser') continue
      if (
        !circleHits(
          enemy.x,
          enemy.y,
          enemy.radius,
          this.player.x,
          this.player.y,
          this.player.radius,
        )
      ) {
        continue
      }
      this.player.hp -= this.config.chaser.collisionDamage
      this.killEnemy(enemy, false)
    }
  }

  private tryFire(): void {
    if (!this.player.alive) return
    const { player, config } = this
    const facing = facingVector(player.rotation)
    const leftX = -facing.y
    const leftY = facing.x

    if (this.intent.fireFront && player.frontalCooldown <= 0) {
      this.spawnPlayerShots(facing.x, facing.y, 0, 0, 1, 0)
      player.frontalCooldown = config.weapons.frontal.cooldownSeconds
    }

    if (this.intent.fireLeft && player.leftCooldown <= 0) {
      this.spawnBroadside(-leftX, -leftY, facing.x, facing.y)
      player.leftCooldown = config.weapons.broadside.cooldownSeconds
    }

    if (this.intent.fireRight && player.rightCooldown <= 0) {
      this.spawnBroadside(leftX, leftY, facing.x, facing.y)
      player.rightCooldown = config.weapons.broadside.cooldownSeconds
    }
  }

  private shooterFire(): void {
    const spec = this.config.projectiles.enemy
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.kind !== 'shooter') continue
      const distance = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y)
      if (distance > this.config.shooter.attackRange) continue
      if (enemy.frontalCooldown > 0) continue
      const facing = facingVector(enemy.rotation)
      this.projectiles.push({
        id: this.nextProjectileId,
        x: enemy.x + facing.x * (enemy.radius + 10),
        y: enemy.y + facing.y * (enemy.radius + 10),
        vx: facing.x * spec.speed,
        vy: facing.y * spec.speed,
        radius: spec.radius,
        damage: spec.damage,
        life: spec.lifetimeSeconds,
        owner: 'enemy',
        spent: false,
      })
      this.nextProjectileId += 1
      enemy.frontalCooldown = this.config.shooter.fireCooldownSeconds
    }
  }

  private spawnBroadside(
    dirX: number,
    dirY: number,
    alongX: number,
    alongY: number,
  ): void {
    const count = this.config.weapons.broadside.projectileCount
    const spacing = 18
    const start = -((count - 1) * spacing) / 2
    for (let i = 0; i < count; i += 1) {
      const offset = start + i * spacing
      this.spawnPlayerShots(dirX, dirY, alongX * offset, alongY * offset, 1, 14)
    }
  }

  private spawnPlayerShots(
    dirX: number,
    dirY: number,
    offsetX: number,
    offsetY: number,
    count: number,
    muzzle: number,
  ): void {
    const { player, config } = this
    const spec = config.projectiles.player
    for (let i = 0; i < count; i += 1) {
      this.projectiles.push({
        id: this.nextProjectileId,
        x: player.x + offsetX + dirX * (player.radius + muzzle),
        y: player.y + offsetY + dirY * (player.radius + muzzle),
        vx: dirX * spec.speed,
        vy: dirY * spec.speed,
        radius: spec.radius,
        damage: spec.damage,
        life: spec.lifetimeSeconds,
        owner: 'player',
        spent: false,
      })
      this.nextProjectileId += 1
    }
  }

  private moveProjectiles(dt: number): void {
    for (const projectile of this.projectiles) {
      projectile.x += projectile.vx * dt
      projectile.y += projectile.vy * dt
      projectile.life -= dt
      if (
        projectile.life <= 0 ||
        projectile.x < 0 ||
        projectile.y < 0 ||
        projectile.x > ARENA_WIDTH ||
        projectile.y > ARENA_HEIGHT
      ) {
        projectile.spent = true
      }
    }
  }

  private collideProjectiles(): void {
    for (const projectile of this.projectiles) {
      if (projectile.spent) continue
      for (const island of this.islands) {
        if (
          circleHits(
            projectile.x,
            projectile.y,
            projectile.radius,
            island.x,
            island.y,
            island.radius,
          )
        ) {
          projectile.spent = true
          break
        }
      }
      if (projectile.spent) continue

      if (projectile.owner === 'player') {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue
          if (
            !circleHits(
              projectile.x,
              projectile.y,
              projectile.radius,
              enemy.x,
              enemy.y,
              enemy.radius,
            )
          ) {
            continue
          }
          projectile.spent = true
          enemy.hp -= projectile.damage
          if (enemy.hp <= 0) this.killEnemy(enemy, true)
          break
        }
        continue
      }

      if (
        this.player.alive &&
        circleHits(
          projectile.x,
          projectile.y,
          projectile.radius,
          this.player.x,
          this.player.y,
          this.player.radius,
        )
      ) {
        projectile.spent = true
        this.player.hp -= projectile.damage
      }
    }

    this.compact(this.projectiles, (projectile) => !projectile.spent)
  }

  private killEnemy(enemy: Ship, awardsScore: boolean): void {
    if (!enemy.alive) return
    enemy.alive = false
    enemy.hp = 0
    if (awardsScore) this.score += 1
    this.spawnExplosion(enemy.x, enemy.y)
  }

  private spawnExplosion(x: number, y: number): void {
    this.effects.push({
      id: this.nextEffectId,
      kind: 'explosion',
      x,
      y,
      age: 0,
      life: 0.4,
    })
    this.nextEffectId += 1
  }

  private ageEffects(dt: number): void {
    for (const effect of this.effects) effect.age += dt
    this.compact(this.effects, (effect) => effect.age < effect.life)
  }

  private compactEnemies(): void {
    this.compact(this.enemies, (enemy) => enemy.alive)
  }

  private checkPlayerDeath(): void {
    if (this.player.hp > 0) return
    this.player.hp = 0
    if (this.player.alive) {
      this.player.alive = false
      this.spawnExplosion(this.player.x, this.player.y)
    }
    this.status = 'ended'
    this.endReason = 'death'
  }

  private compact<T>(items: T[], keep: (item: T) => boolean): void {
    let write = 0
    for (let read = 0; read < items.length; read += 1) {
      const item = items[read]!
      if (keep(item)) {
        items[write] = item
        write += 1
      }
    }
    items.length = write
  }
}
