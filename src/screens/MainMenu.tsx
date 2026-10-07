import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchMatchHistory, fetchRanking } from '../api/client'
import { LOCAL_PLAYER_NAME } from '../mocks/fixtures'
import {
  loadNetworkScenario,
  NETWORK_SCENARIOS,
  saveNetworkScenario,
  type NetworkScenario,
} from '../mocks/scenarios'
import { resetMockStore } from '../mocks/store'

const queryClient = new QueryClient()

type MainTab = 'ranking' | 'history'

type Props = {
  onPlay: () => void
  onOptions: () => void
}

export function MainMenu({ onPlay, onOptions }: Props) {
  const [tab, setTab] = useState<MainTab>('ranking')
  const [scenario, setScenario] = useState<NetworkScenario>(loadNetworkScenario)

  return (
    <QueryClientProvider client={queryClient}>
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
          {tab === 'ranking' ? <RankingPanel /> : <HistoryPanel />}
        </section>

        <section className="panel" aria-labelledby="network-heading">
          <h2 id="network-heading">Network scenarios</h2>
          <label>
            Scenario
            <select
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
    </QueryClientProvider>
  )
}

function RankingPanel() {
  const query = useQuery({
    queryKey: ['ranking', 1],
    queryFn: () => fetchRanking(1, 5),
  })

  return <RecordList title="Ranking" query={query} empty="No ranking entries yet." />
}

function HistoryPanel() {
  const query = useQuery({
    queryKey: ['history', 1],
    queryFn: () => fetchMatchHistory(1, 5),
  })

  return (
    <RecordList
      title="Match History"
      query={query}
      empty="No completed matches yet."
    />
  )
}

function RecordList({
  title,
  query,
  empty,
}: {
  title: string
  empty: string
  query: {
    isPending: boolean
    isError: boolean
    data?: { items: Array<{ matchId: string; playerName: string; score: number }>; total: number }
  }
}) {
  if (query.isPending) return <p role="status">Loading {title.toLowerCase()}…</p>
  if (query.isError) {
    return (
      <p role="alert">
        Could not load {title.toLowerCase()}. The game is still available.
      </p>
    )
  }
  if (!query.data?.items.length) return <p>{empty}</p>

  return (
    <ol>
      {query.data.items.map((item) => (
        <li key={item.matchId}>
          {item.playerName} — {item.score} pts
        </li>
      ))}
    </ol>
  )
}
