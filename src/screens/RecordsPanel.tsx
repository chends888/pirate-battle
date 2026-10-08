import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  PAGE_SIZE,
  fetchMatchHistory,
  fetchRanking,
} from '../api/client'
import type { MatchRecord } from '../api/types'
import {
  formatDate,
  formatDuration,
  formatReason,
  pageCount,
} from '../format'
import { loadPlayerOptions } from '../persist/playerOptions'

type Kind = 'ranking' | 'history'

export function RecordsPanel({ kind }: { kind: Kind }) {
  const [page, setPage] = useState(1)
  const options = loadPlayerOptions()
  const query = useQuery({
    queryKey:
      kind === 'ranking'
        ? ['ranking', page, options.sessionTimeSeconds, options.enemySpawnIntervalSeconds]
        : ['history', page],
    queryFn: () =>
      kind === 'ranking'
        ? fetchRanking(page, PAGE_SIZE, {
            sessionTimeSeconds: options.sessionTimeSeconds,
            enemySpawnIntervalSeconds: options.enemySpawnIntervalSeconds,
          })
        : fetchMatchHistory(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })

  const title = kind === 'ranking' ? 'Ranking' : 'Match History'
  const empty =
    kind === 'ranking' ? 'No ranking entries for this configuration yet.' : 'No completed matches yet.'

  if (query.isPending && !query.data) {
    return <p role="status">Loading {title.toLowerCase()}…</p>
  }
  if (query.isError) {
    return (
      <div>
        <p role="alert">
          Could not load {title.toLowerCase()}. The game is still available.
        </p>
        <button type="button" onClick={() => void query.refetch()}>
          Retry
        </button>
      </div>
    )
  }

  const data = query.data
  if (!data?.items.length) return <p>{empty}</p>

  const pages = pageCount(data.total, data.pageSize)

  return (
    <div>
      {kind === 'ranking' ? (
        <p>
          Showing matches with {options.sessionTimeSeconds}s sessions and{' '}
          {options.enemySpawnIntervalSeconds}s spawns.
        </p>
      ) : null}
      {kind === 'ranking' ? (
        <ol start={(data.page - 1) * data.pageSize + 1}>
          {data.items.map((item) => (
            <li key={item.matchId}>
              {item.playerName} — {item.score} pts
            </li>
          ))}
        </ol>
      ) : (
        <HistoryList items={data.items} />
      )}
      <Pagination
        page={data.page}
        pages={pages}
        total={data.total}
        fetching={query.isFetching}
        onPage={setPage}
      />
    </div>
  )
}

function HistoryList({ items }: { items: MatchRecord[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.matchId}>
          {formatDate(item.finishedAt)} — {item.score} pts —{' '}
          {formatDuration(item.durationSeconds)} — {formatReason(item.reason)}
        </li>
      ))}
    </ul>
  )
}

function Pagination({
  page,
  pages,
  total,
  fetching,
  onPage,
}: {
  page: number
  pages: number
  total: number
  fetching: boolean
  onPage: (page: number) => void
}) {
  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <p>
        Page {page} of {pages} ({total} records)
        {fetching ? ' …' : ''}
      </p>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  )
}
