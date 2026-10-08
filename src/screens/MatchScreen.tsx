import { useEffect, useRef, useState } from 'react'
import { DEFAULT_GAME_CONFIG } from '../game/config'
import {
  MatchRuntime,
  type MatchHud,
} from '../game/runtime'
import type { CompletedMatch } from '../match/completed'
import { LOCAL_PLAYER_ID } from '../mocks/fixtures'
import { applyOptionsToConfig, loadPlayerOptions } from '../persist/playerOptions'

type Props = {
  onLeave: () => void
  onFinished: (match: CompletedMatch) => void
}

type LoadState = 'loading' | 'ready' | 'error'

export function MatchScreen({ onLeave, onFinished }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const runtimeRef = useRef<MatchRuntime | null>(null)
  const finishedRef = useRef(false)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [hud, setHud] = useState<MatchHud | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let runtime: MatchRuntime | null = null
    finishedRef.current = false
    setLoadState('loading')
    setError(null)

    const config = applyOptionsToConfig(DEFAULT_GAME_CONFIG, loadPlayerOptions())
    const matchId = crypto.randomUUID()

    void (async () => {
      try {
        runtime = await MatchRuntime.create(host, config, (next) => {
          if (cancelled) return
          setHud(next)
          if (
            next.status === 'ended' &&
            (next.endReason === 'time' || next.endReason === 'death') &&
            !finishedRef.current
          ) {
            finishedRef.current = true
            onFinished({
              matchId,
              playerId: LOCAL_PLAYER_ID,
              score: next.score,
              durationSeconds: next.elapsedSeconds,
              reason: next.endReason,
              finishedAt: new Date().toISOString(),
              config: {
                sessionTimeSeconds: config.sessionTimeSeconds,
                enemySpawnIntervalSeconds: config.enemySpawnIntervalSeconds,
              },
            })
          }
        })
        if (cancelled) {
          runtime.destroy()
          return
        }
        runtimeRef.current = runtime
        setLoadState('ready')
      } catch (cause) {
        if (cancelled) return
        setLoadState('error')
        setError(cause instanceof Error ? cause.message : 'Could not load match assets.')
      }
    })()

    return () => {
      cancelled = true
      runtime?.destroy()
      runtimeRef.current = null
      if (window.__game) delete window.__game
    }
  }, [onFinished, reloadKey])

  function touch(partial: Parameters<MatchRuntime['setTouch']>[0], active: boolean) {
    const next = Object.fromEntries(
      Object.entries(partial).map(([key, value]) => [key, active ? value : false]),
    )
    runtimeRef.current?.setTouch(next)
  }

  const remaining = hud ? Math.ceil(hud.remainingSeconds) : 0

  return (
    <div className="match-root">
      <div className="match-hud" aria-live="polite">
        <p>
          HP {hud ? `${Math.round(hud.playerHp)} / ${hud.playerMaxHp}` : '—'}
        </p>
        <p>Score {hud?.score ?? 0}</p>
        <p>
          Time {String(Math.floor(remaining / 60)).padStart(2, '0')}:
          {String(remaining % 60).padStart(2, '0')}
        </p>
        <button type="button" onClick={() => runtimeRef.current?.setPaused(true)}>
          Pause
        </button>
        <button type="button" onClick={onLeave}>
          Abandon
        </button>
      </div>

      <div ref={hostRef} className="match-canvas" />

      {loadState === 'loading' ? (
        <div className="match-overlay" role="status">
          Loading arena assets…
        </div>
      ) : null}

      {loadState === 'error' ? (
        <div className="match-overlay" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="primary"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Retry
          </button>
          <button type="button" onClick={onLeave}>
            Main Menu
          </button>
        </div>
      ) : null}

      {hud?.paused && hud.status === 'running' ? (
        <div className="match-overlay">
          <h1>Paused</h1>
          <p>Simulation and the timer are frozen. Resume does not dump stored movement.</p>
          <button
            type="button"
            className="primary"
            onClick={() => runtimeRef.current?.setPaused(false)}
          >
            Resume
          </button>
          <button type="button" onClick={onLeave}>
            Abandon match
          </button>
        </div>
      ) : null}

      <div className="touch-controls" aria-label="Touch controls">
        <button
          type="button"
          onPointerDown={() => touch({ rotateLeft: true }, true)}
          onPointerUp={() => touch({ rotateLeft: true }, false)}
          onPointerLeave={() => touch({ rotateLeft: true }, false)}
        >
          ⟲
        </button>
        <button
          type="button"
          onPointerDown={() => touch({ forward: true }, true)}
          onPointerUp={() => touch({ forward: true }, false)}
          onPointerLeave={() => touch({ forward: true }, false)}
        >
          ↑
        </button>
        <button
          type="button"
          onPointerDown={() => touch({ rotateRight: true }, true)}
          onPointerUp={() => touch({ rotateRight: true }, false)}
          onPointerLeave={() => touch({ rotateRight: true }, false)}
        >
          ⟳
        </button>
        <button
          type="button"
          onPointerDown={() => touch({ fireLeft: true }, true)}
          onPointerUp={() => touch({ fireLeft: true }, false)}
          onPointerLeave={() => touch({ fireLeft: true }, false)}
        >
          Q
        </button>
        <button
          type="button"
          onPointerDown={() => touch({ fireFront: true }, true)}
          onPointerUp={() => touch({ fireFront: true }, false)}
          onPointerLeave={() => touch({ fireFront: true }, false)}
        >
          Fire
        </button>
        <button
          type="button"
          onPointerDown={() => touch({ fireRight: true }, true)}
          onPointerUp={() => touch({ fireRight: true }, false)}
          onPointerLeave={() => touch({ fireRight: true }, false)}
        >
          E
        </button>
      </div>
    </div>
  )
}
