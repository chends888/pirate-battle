import type { MatchRecord } from '../api/types'

export const LOCAL_PLAYER_ID = 'player-local'
export const LOCAL_PLAYER_NAME = 'Captain'

function record(
  partial: Pick<MatchRecord, 'matchId' | 'playerId' | 'playerName' | 'score'> &
    Partial<MatchRecord>,
): MatchRecord {
  return {
    durationSeconds: 90,
    reason: 'time',
    finishedAt: '2026-09-01T12:00:00.000Z',
    config: { sessionTimeSeconds: 120, enemySpawnIntervalSeconds: 5 },
    ...partial,
  }
}

export const rankingFixtures: MatchRecord[] = [
  record({
    matchId: 'npc-1',
    playerId: 'npc-black-flag',
    playerName: 'Black Flag',
    score: 18,
  }),
  record({
    matchId: 'npc-2',
    playerId: 'npc-red-sail',
    playerName: 'Red Sail',
    score: 14,
    durationSeconds: 110,
  }),
  record({
    matchId: 'npc-3',
    playerId: 'npc-old-map',
    playerName: 'Old Map',
    score: 11,
    reason: 'death',
    durationSeconds: 64,
  }),
  record({
    matchId: 'npc-4',
    playerId: 'npc-storm',
    playerName: 'Storm',
    score: 9,
  }),
  record({
    matchId: 'npc-5',
    playerId: 'npc-cannon',
    playerName: 'Cannon',
    score: 7,
    reason: 'death',
  }),
  record({
    matchId: 'npc-6',
    playerId: 'npc-tide',
    playerName: 'Tide',
    score: 4,
  }),
]
