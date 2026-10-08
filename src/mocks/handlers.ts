import { http, HttpResponse, delay } from 'msw'
import { LOCAL_PLAYER_NAME } from './fixtures'
import { loadNetworkScenario } from './scenarios'
import {
  listHistoryRecords,
  listRankingRecords,
  upsertMatch,
} from './store'
import type { CreateMatchPayload, MatchRecord, Paginated } from '../api/types'

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
  }
}

async function applyScenario(kind: 'query' | 'submit') {
  const scenario = loadNetworkScenario()

  if (scenario === 'slow') {
    await delay(1200)
  }

  if (scenario === 'error' && kind === 'query') {
    return HttpResponse.json({ message: 'Ranking unavailable' }, { status: 503 })
  }

  if (scenario === 'timeout-on-submit' && kind === 'submit') {
    await delay(9000)
  }

  return null
}

export const handlers = [
  http.get('/api/ranking', async ({ request }) => {
    const failure = await applyScenario('query')
    if (failure) return failure

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 5)
    const sessionTimeSeconds = Number(url.searchParams.get('sessionTimeSeconds'))
    const enemySpawnIntervalSeconds = Number(
      url.searchParams.get('enemySpawnIntervalSeconds'),
    )
    const config =
      Number.isFinite(sessionTimeSeconds) &&
      Number.isFinite(enemySpawnIntervalSeconds)
        ? { sessionTimeSeconds, enemySpawnIntervalSeconds }
        : undefined
    const scenario = loadNetworkScenario()
    const items = scenario === 'empty' ? [] : listRankingRecords(config)
    return HttpResponse.json(paginate(items, page, pageSize))
  }),

  http.get('/api/history', async ({ request }) => {
    const failure = await applyScenario('query')
    if (failure) return failure

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 5)
    const scenario = loadNetworkScenario()
    const items = scenario === 'empty' ? [] : listHistoryRecords()
    return HttpResponse.json(paginate(items, page, pageSize))
  }),

  http.post('/api/history', async ({ request }) => {
    const failure = await applyScenario('submit')
    if (failure) return failure

    const payload = (await request.json()) as CreateMatchPayload
    const record: MatchRecord = {
      ...payload,
      playerName: LOCAL_PLAYER_NAME,
    }
    return HttpResponse.json(upsertMatch(record), { status: 201 })
  }),
]
