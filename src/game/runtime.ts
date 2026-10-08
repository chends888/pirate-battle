import { Application } from 'pixi.js'
import { GAME_KEY_CODES, InputController } from './input/bindings'
import { ArenaView } from './pixi/arenaView'
import { loadMatchAssets } from './pixi/assets'
import { SIM_STEP_SECONDS, type WorldSnapshot } from './sim/types'
import { World } from './sim/world'
import type { GameConfig } from './config'

export type MatchHud = {
  score: number
  remainingSeconds: number
  elapsedSeconds: number
  playerHp: number
  playerMaxHp: number
  paused: boolean
  status: WorldSnapshot['status']
  endReason: WorldSnapshot['endReason']
}

export class MatchRuntime {
  readonly world: World
  private readonly app: Application
  private readonly view: ArenaView
  private readonly input = new InputController()
  private readonly host: HTMLElement
  private readonly onHud: (hud: MatchHud) => void
  private accumulator = 0
  private hudAge = 0
  private paused = false
  private autoPaused = false
  private destroyed = false
  private islandsDrawn = false

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (!GAME_KEY_CODES.has(event.code)) return
    event.preventDefault()
    if (event.code === 'Escape') {
      if (this.world.status === 'running') this.setPaused(true)
      return
    }
    this.input.keyDown(event.code)
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    if (!GAME_KEY_CODES.has(event.code)) return
    event.preventDefault()
    this.input.keyUp(event.code)
  }

  private readonly onVisibility = () => {
    if (document.hidden) {
      this.autoPaused = true
      this.setPaused(true)
    }
  }

  private readonly onResize = () => {
    this.view.layout(this.host.clientWidth, this.host.clientHeight)
  }

  private constructor(
    app: Application,
    host: HTMLElement,
    config: GameConfig,
    onHud: (hud: MatchHud) => void,
  ) {
    this.app = app
    this.host = host
    this.onHud = onHud
    this.world = new World(config)
    this.view = new ArenaView()
    app.stage.addChild(this.view.root)
    this.view.layout(host.clientWidth, host.clientHeight)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('resize', this.onResize)

    app.ticker.add(() => {
      if (this.destroyed) return
      const dt = Math.min(0.05, app.ticker.deltaMS / 1000)
      if (!this.paused && this.world.status === 'running') {
        this.accumulator += dt
        while (this.accumulator >= SIM_STEP_SECONDS) {
          this.world.setIntent(this.input.intent())
          this.world.step(SIM_STEP_SECONDS)
          this.accumulator -= SIM_STEP_SECONDS
        }
      } else {
        this.accumulator = 0
        this.world.setIntent(this.input.intent())
      }

      const snapshot = this.world.snapshot()
      if (!this.islandsDrawn) {
        this.view.drawIslands(snapshot)
        this.islandsDrawn = true
      }
      this.view.sync(snapshot)

      this.hudAge += dt
      if (this.hudAge >= 0.1 || snapshot.status === 'ended') {
        this.hudAge = 0
        this.emitHud()
      }
    })

    this.installTestApi()
    this.emitHud()
  }

  static async create(
    host: HTMLElement,
    config: GameConfig,
    onHud: (hud: MatchHud) => void,
  ): Promise<MatchRuntime> {
    await loadMatchAssets()
    const app = new Application()
    await app.init({
      background: '#0b4d73',
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
      resizeTo: host,
    })
    host.appendChild(app.canvas)
    return new MatchRuntime(app, host, config, onHud)
  }

  setTouch(partial: Parameters<InputController['setTouch']>[0]): void {
    this.input.setTouch(partial)
  }

  setPaused(paused: boolean): void {
    if (this.world.status !== 'running' && paused) {
      this.paused = true
      this.emitHud()
      return
    }
    if (!paused) {
      this.autoPaused = false
      this.input.clear()
      this.accumulator = 0
    }
    this.paused = paused
    this.emitHud()
  }

  get pausedState(): boolean {
    return this.paused
  }

  get wasAutoPaused(): boolean {
    return this.autoPaused
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('resize', this.onResize)
    this.input.clear()
    if (window.__game?.runtime === this) {
      delete window.__game
    }
    this.app.destroy(
      { removeView: true },
      { children: true, texture: false, textureSource: false },
    )
  }

  private emitHud(): void {
    const snapshot = this.world.snapshot()
    this.onHud({
      score: snapshot.score,
      remainingSeconds: snapshot.remainingSeconds,
      elapsedSeconds: snapshot.elapsedSeconds,
      playerHp: snapshot.player.hp,
      playerMaxHp: snapshot.player.maxHp,
      paused: this.paused,
      status: snapshot.status,
      endReason: snapshot.endReason,
    })
  }

  private installTestApi(): void {
    window.__game = {
      runtime: this,
      snapshot: () => this.world.snapshot(),
      setPaused: (paused) => this.setPaused(paused),
      step: (seconds) => {
        const steps = Math.round(seconds / SIM_STEP_SECONDS)
        for (let i = 0; i < steps; i += 1) {
          this.world.step(SIM_STEP_SECONDS)
        }
        this.emitHud()
      },
      endMatch: (reason) => {
        this.world.forceEnd(reason)
        this.emitHud()
      },
    }
  }
}

declare global {
  interface Window {
    __game?: {
      runtime: MatchRuntime
      snapshot: () => WorldSnapshot
      setPaused: (paused: boolean) => void
      step: (seconds: number) => void
      endMatch: (reason: 'time' | 'death') => void
    }
  }
}
