import { useState } from 'react'
import {
  SPAWN_INTERVAL_MAX_SECONDS,
  SPAWN_INTERVAL_MIN_SECONDS,
  SESSION_TIME_MAX_SECONDS,
  SESSION_TIME_MIN_SECONDS,
} from '../game/config'
import {
  loadPlayerOptions,
  savePlayerOptions,
  type PlayerOptions,
} from '../persist/playerOptions'

type Props = {
  onBack: () => void
}

export function OptionsScreen({ onBack }: Props) {
  const [options, setOptions] = useState<PlayerOptions>(loadPlayerOptions)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (
      options.sessionTimeSeconds < SESSION_TIME_MIN_SECONDS ||
      options.sessionTimeSeconds > SESSION_TIME_MAX_SECONDS
    ) {
      setError(
        `Game session time must be between ${SESSION_TIME_MIN_SECONDS} and ${SESSION_TIME_MAX_SECONDS} seconds.`,
      )
      return
    }

    if (
      options.enemySpawnIntervalSeconds < SPAWN_INTERVAL_MIN_SECONDS ||
      options.enemySpawnIntervalSeconds > SPAWN_INTERVAL_MAX_SECONDS
    ) {
      setError(
        `Enemy spawn time must be between ${SPAWN_INTERVAL_MIN_SECONDS} and ${SPAWN_INTERVAL_MAX_SECONDS} seconds.`,
      )
      return
    }

    savePlayerOptions(options)
    setError(null)
    setSaved(true)
  }

  return (
    <main className="screen">
      <h1>Options</h1>
      <form
        className="panel"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
      >
        <label>
          Game session time (seconds)
          <input
            name="sessionTimeSeconds"
            type="number"
            min={SESSION_TIME_MIN_SECONDS}
            max={SESSION_TIME_MAX_SECONDS}
            value={options.sessionTimeSeconds}
            onChange={(event) => {
              setSaved(false)
              setOptions((current) => ({
                ...current,
                sessionTimeSeconds: Number(event.target.value),
              }))
            }}
          />
        </label>
        <label>
          Enemy spawn time (seconds)
          <input
            name="enemySpawnIntervalSeconds"
            type="number"
            min={SPAWN_INTERVAL_MIN_SECONDS}
            max={SPAWN_INTERVAL_MAX_SECONDS}
            step={0.5}
            value={options.enemySpawnIntervalSeconds}
            onChange={(event) => {
              setSaved(false)
              setOptions((current) => ({
                ...current,
                enemySpawnIntervalSeconds: Number(event.target.value),
              }))
            }}
          />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        {saved ? <p role="status">Options saved. They apply to new matches.</p> : null}
        <div className="actions">
          <button type="submit" className="primary">
            Save
          </button>
          <button type="button" onClick={onBack}>
            Main Menu
          </button>
        </div>
      </form>
    </main>
  )
}
