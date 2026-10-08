import type { CreateMatchPayload } from '../api/types'

const PENDING_KEY = 'pirate-battle:pending-matches'

export function loadPendingMatches(): CreateMatchPayload[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as CreateMatchPayload[]) : []
  } catch {
    return []
  }
}

export function upsertPendingMatch(payload: CreateMatchPayload): void {
  const next = loadPendingMatches().filter((item) => item.matchId !== payload.matchId)
  next.push(payload)
  localStorage.setItem(PENDING_KEY, JSON.stringify(next))
}

export function removePendingMatch(matchId: string): void {
  const next = loadPendingMatches().filter((item) => item.matchId !== matchId)
  localStorage.setItem(PENDING_KEY, JSON.stringify(next))
}
