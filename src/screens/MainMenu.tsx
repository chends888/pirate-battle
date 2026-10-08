import { useState } from 'react'
import type { CompletedMatch } from '../match/completed'
import { LOCAL_PLAYER_NAME } from '../mocks/fixtures'
import { queryClient } from '../queryClient'
import {
  loadNetworkScenario,
  NETWORK_SCENARIOS,
  saveNetworkScenario,
  type NetworkScenario,
} from '../mocks/scenarios'
import { resetMockStore } from '../mocks/store'
import { loadPendingMatches } from '../persist/pendingMatches'
import { RecordsPanel } from './RecordsPanel'

type MainTab = 'ranking' | 'history'

type Props = {
  onPlay: () => void
  onOptions: () => void
  onRetryPending: (match: CompletedMatch) => void
}

export function MainMenu({ onPlay, onOptions, onRetryPending }: Props) {
  const [tab, setTab] = useState<MainTab>('ranking')
  const [scenario, setScenario] = useState<NetworkScenario>(loadNetworkScenario)
  const pending = loadPendingMatches()[0] ?? null

  return (
    <main className="screen">
      <header className="hero-header">
        <p className="eyebrow">Jungle Gaming challenge</p>
        <h1>Pirate Battle</h1>
        <p>Navigate the islands, sink enemy ships, and hold until the timer ends.</p>
      </header>

      <div className="actions">
        <button type="button" className="primary" onClick={onPlay}>
          Play
        </button>
        <button type="button" onClick={onOptions}>
          Options
        </button>
      </div>

      {pending ? (
        <section className="panel" aria-labelledby="pending-heading">
          <h2 id="pending-heading">Unrecorded match</h2>
          <p>
            Score {pending.score} is waiting to be sent. You can play another match
            or retry this recording.
          </p>
          <button
            type="button"
            className="primary"
            onClick={() => onRetryPending(pending)}
          >
            Retry recording
          </button>
        </section>
      ) : null}

      <section className="panel" aria-labelledby="controls-heading">
        <h2 id="controls-heading">Controls</h2>
        <ul>
          <li>W / Up — move forward</li>
          <li>A / D or Left / Right — rotate</li>
          <li>Space — frontal shot</li>
          <li>Q — left broadside (3 shots)</li>
          <li>E — right broadside (3 shots)</li>
          <li>Esc — pause</li>
        </ul>
        <p>Keyboard and on-screen touch controls can be used at the same time.</p>
      </section>

      <section className="panel">
        <div className="tabs" role="tablist" aria-label="Records">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'ranking'}
            onClick={() => setTab('ranking')}
          >
            Ranking
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'history'}
            onClick={() => setTab('history')}
          >
            Match History
          </button>
        </div>
        <RecordsPanel kind={tab} />
      </section>

      <section className="panel" aria-labelledby="network-heading">
        <h2 id="network-heading">Network scenarios</h2>
        <label>
          Scenario
          <select
            name="networkScenario"
            value={scenario}
            onChange={(event) => {
              const next = event.target.value as NetworkScenario
              saveNetworkScenario(next)
              setScenario(next)
              void queryClient.invalidateQueries()
            }}
          >
            {NETWORK_SCENARIOS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            resetMockStore()
            void queryClient.invalidateQueries()
          }}
        >
          Reset mock records
        </button>
        <p>Playing as {LOCAL_PLAYER_NAME}. Confirmed records survive refresh.</p>
      </section>
    </main>
  )
}
