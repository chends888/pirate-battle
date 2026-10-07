import {
  clampSessionTime,
  clampSpawnInterval,
  DEFAULT_GAME_CONFIG,
  type GameConfig,
} from '../game/config'

const OPTIONS_KEY = 'pirate-battle:options'
const LAST_RESULT_KEY = 'pirate-battle:last-result'

export type PlayerOptions = {
  sessionTimeSeconds: number
  enemySpawnIntervalSeconds: number
}

export type MatchEndReason = 'time' | 'death' | 'abandoned'

export type LastMatchResult = {
  score: number
  durationSeconds: number
  reason: Exclude<MatchEndReason, 'abandoned'>
  finishedAt: string
  submitted: boolean
}

export function loadPlayerOptions(): PlayerOptions {
  const fallback: PlayerOptions = {
    sessionTimeSeconds: DEFAULT_GAME_CONFIG.sessionTimeSeconds,
    enemySpawnIntervalSeconds: DEFAULT_GAME_CONFIG.enemySpawnIntervalSeconds,
  }

  try {
    const raw = localStorage.getItem(OPTIONS_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<PlayerOptions>
    return {
      sessionTimeSeconds: clampSessionTime(
        Number(parsed.sessionTimeSeconds ?? fallback.sessionTimeSeconds),
      ),
      enemySpawnIntervalSeconds: clampSpawnInterval(
        Number(
          parsed.enemySpawnIntervalSeconds ?? fallback.enemySpawnIntervalSeconds,
        ),
      ),
    }
  } catch {
    return fallback
  }
}

export function savePlayerOptions(options: PlayerOptions): void {
  localStorage.setItem(
    OPTIONS_KEY,
    JSON.stringify({
      sessionTimeSeconds: clampSessionTime(options.sessionTimeSeconds),
      enemySpawnIntervalSeconds: clampSpawnInterval(
        options.enemySpawnIntervalSeconds,
      ),
    }),
  )
}

export function applyOptionsToConfig(
  base: GameConfig,
  options: PlayerOptions,
): GameConfig {
  return {
    ...base,
    sessionTimeSeconds: clampSessionTime(options.sessionTimeSeconds),
    enemySpawnIntervalSeconds: clampSpawnInterval(
      options.enemySpawnIntervalSeconds,
    ),
  }
}

export function loadLastMatchResult(): LastMatchResult | null {
  try {
    const raw = localStorage.getItem(LAST_RESULT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LastMatchResult
  } catch {
    return null
  }
}

export function saveLastMatchResult(result: LastMatchResult): void {
  localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result))
}

export function clearLastMatchResult(): void {
  localStorage.removeItem(LAST_RESULT_KEY)
}
