import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  type Effect,
  type Ship,
  type WorldSnapshot,
} from '../sim/types'
import { matchTexture } from './assets'

type SpriteEntry = {
  id: string | number
  sprite: Sprite
}

export class ArenaView {
  readonly root = new Container()
  private readonly shipLayer = new Container()
  private readonly projectileLayer = new Container()
  private readonly effectLayer = new Container()
  private readonly hpBar = new Graphics()
  private readonly playerSprite: Sprite
  private readonly enemySprites: SpriteEntry[] = []
  private readonly projectileSprites: SpriteEntry[] = []
  private readonly effectSprites: SpriteEntry[] = []
  private readonly _sand = matchTexture('sand')

  constructor() {
    const water = new TilingSprite({
      texture: matchTexture('water'),
      width: ARENA_WIDTH,
      height: ARENA_HEIGHT,
    })
    this.playerSprite = new Sprite(matchTexture('playerShip'))
    this.playerSprite.anchor.set(0.5)
    this.shipLayer.addChild(this.playerSprite)

    this.root.addChild(
      water,
      this.shipLayer,
      this.projectileLayer,
      this.effectLayer,
      this.hpBar,
    )
  }

  drawIslands(snapshot: WorldSnapshot): void {
    for (const island of snapshot.islands) {
      const holder = new Container()
      holder.x = island.x
      holder.y = island.y
      const sprite = new Sprite(this._sand)
      sprite.anchor.set(0.5)
      const size = island.radius * 2
      sprite.width = size
      sprite.height = size
      const mask = new Graphics()
      mask.circle(0, 0, island.radius)
      mask.fill({ color: 0xffffff })
      holder.addChild(sprite, mask)
      holder.mask = mask
      this.root.addChildAt(holder, 1)
    }
  }

  layout(viewWidth: number, viewHeight: number): void {
    const scale = Math.min(viewWidth / ARENA_WIDTH, viewHeight / ARENA_HEIGHT)
    this.root.scale.set(scale)
    this.root.x = (viewWidth - ARENA_WIDTH * scale) / 2
    this.root.y = (viewHeight - ARENA_HEIGHT * scale) / 2
  }

  sync(snapshot: WorldSnapshot): void {
    this.syncShipSprite(this.playerSprite, snapshot.player)
    this.playerSprite.visible = snapshot.player.alive

    this.syncKeyedSprites(
      this.enemySprites,
      snapshot.enemies,
      this.shipLayer,
      (enemy) =>
        new Sprite(
          matchTexture(enemy.kind === 'chaser' ? 'chaserShip' : 'shooterShip'),
        ),
      (sprite, enemy) => this.syncShipSprite(sprite, enemy),
    )

    this.syncKeyedSprites(
      this.projectileSprites,
      snapshot.projectiles,
      this.projectileLayer,
      () => new Sprite(matchTexture('cannonBall')),
      (sprite, projectile) => {
        sprite.x = projectile.x
        sprite.y = projectile.y
      },
    )

    this.syncKeyedSprites(
      this.effectSprites,
      snapshot.effects,
      this.effectLayer,
      () => new Sprite(matchTexture('explosion1')),
      (sprite, effect) => this.syncExplosion(sprite, effect),
    )

    this.drawHpBars(snapshot)
  }

  private syncShipSprite(sprite: Sprite, ship: Ship): void {
    const targetHeight = ship.radius * 2.4
    sprite.anchor.set(0.5)
    sprite.scale.set(targetHeight / sprite.texture.height)
    sprite.x = ship.x
    sprite.y = ship.y
    sprite.rotation = ship.rotation
    const damage = 1 - ship.hp / ship.maxHp
    sprite.tint = damage <= 0 ? 0xffffff : mixTint(0xffffff, 0x5a1d12, damage)
  }

  private syncExplosion(sprite: Sprite, effect: Effect): void {
    const t = effect.age / effect.life
    const alias =
      t < 0.33 ? 'explosion1' : t < 0.66 ? 'explosion2' : 'explosion3'
    sprite.texture = matchTexture(alias)
    sprite.anchor.set(0.5)
    sprite.x = effect.x
    sprite.y = effect.y
    sprite.scale.set(0.7 + t * 0.5)
    sprite.alpha = 1 - t
  }

  private drawHpBars(snapshot: WorldSnapshot): void {
    this.hpBar.clear()
    const ships = snapshot.player.alive
      ? [snapshot.player, ...snapshot.enemies]
      : snapshot.enemies
    for (const ship of ships) {
      const width = 42
      const height = 6
      const x = ship.x - width / 2
      const y = ship.y - ship.radius - 16
      const ratio = Math.max(0, ship.hp / ship.maxHp)
      this.hpBar.rect(x, y, width, height)
      this.hpBar.fill({ color: 0x1a1006, alpha: 0.7 })
      this.hpBar.rect(x, y, width * ratio, height)
      this.hpBar.fill({ color: ship.kind === 'player' ? 0x3dcf6a : 0xd94a3a })
    }
  }

  private syncKeyedSprites<T extends { id: string | number }>(
    entries: SpriteEntry[],
    items: T[],
    layer: Container,
    create: (item: T) => Sprite,
    update: (sprite: Sprite, item: T) => void,
  ): void {
    const live = new Set(items.map((item) => item.id))
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const entry = entries[i]!
      if (!live.has(entry.id)) {
        entry.sprite.destroy()
        entries.splice(i, 1)
      }
    }

    for (const item of items) {
      let entry = entries.find((candidate) => candidate.id === item.id)
      if (!entry) {
        const sprite = create(item)
        sprite.anchor.set(0.5)
        layer.addChild(sprite)
        entry = { id: item.id, sprite }
        entries.push(entry)
      }
      update(entry.sprite, item)
    }
  }
}

function mixTint(from: number, to: number, amount: number): number {
  const mix = (shift: number) => {
    const a = (from >> shift) & 0xff
    const b = (to >> shift) & 0xff
    return Math.round(a + (b - a) * amount)
  }
  return (mix(16) << 16) | (mix(8) << 8) | mix(0)
}
