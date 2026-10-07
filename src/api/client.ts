import axios from 'axios'
import type { CreateMatchPayload, MatchRecord, Paginated } from './types'

export const http = axios.create({
  baseURL: '/api',
  timeout: 8000,
})

export async function fetchRanking(page = 1, pageSize = 5) {
  const { data } = await http.get<Paginated<MatchRecord>>('/ranking', {
    params: { page, pageSize },
  })
  return data
}

export async function fetchMatchHistory(page = 1, pageSize = 5) {
  const { data } = await http.get<Paginated<MatchRecord>>('/history', {
    params: { page, pageSize },
  })
  return data
}

export async function submitMatch(payload: CreateMatchPayload) {
  const { data } = await http.post<MatchRecord>('/history', payload)
  return data
}
