import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { submitMatch } from '../api/client'
import type { CompletedMatch } from '../match/completed'
import {
  removePendingMatch,
  upsertPendingMatch,
} from '../persist/pendingMatches'
import { saveLastMatchResult } from '../persist/playerOptions'
import { queryClient } from '../queryClient'

type Props = {
  match: CompletedMatch
  onPlayAgain: () => void
  onMenu: () => void
}

type SubmissionStatus = 'pending' | 'recorded' | 'failed'

export function ResultScreen({ match, onPlayAgain, onMenu }: Props) {
  const [status, setStatus] = useState<SubmissionStatus>('pending')

  const mutation = useMutation({
    mutationFn: submitMatch,
    onMutate: (payload) => {
      upsertPendingMatch(payload)
      setStatus('pending')
    },
    onSuccess: async (record) => {
      removePendingMatch(record.matchId)
      saveLastMatchResult({
        score: record.score,
        durationSeconds: record.durationSeconds,
        reason: record.reason,
        finishedAt: record.finishedAt,
        submitted: true,
      })
      setStatus('recorded')
      await queryClient.invalidateQueries({ queryKey: ['ranking'] })
      await queryClient.invalidateQueries({ queryKey: ['history'] })
    },
    onError: () => {
      saveLastMatchResult({
        score: match.score,
        durationSeconds: match.durationSeconds,
        reason: match.reason,
        finishedAt: match.finishedAt,
        submitted: false,
      })
      setStatus('failed')
    },
  })

  const mutateRef = useRef(mutation.mutate)
  mutateRef.current = mutation.mutate
  const submittedId = useRef<string | null>(null)
  useEffect(() => {
    if (submittedId.current === match.matchId) return
    submittedId.current = match.matchId
    mutateRef.current(match)
  }, [match])

  const reasonLabel = match.reason === 'time' ? 'Time expired' : 'Ship destroyed'
  const minutes = Math.floor(match.durationSeconds / 60)
  const seconds = Math.round(match.durationSeconds % 60)

  return (
    <main className="screen">
      <h1>Match result</h1>
      <section className="panel">
        <p>Score {match.score}</p>
        <p>
          Time played {String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </p>
        <p>Ended by {reasonLabel}</p>
        <p data-testid="submission-status" role="status">
          {status === 'pending' ? 'Recording match…' : null}
          {status === 'recorded' ? 'Match recorded in ranking and history.' : null}
          {status === 'failed'
            ? 'Could not record the match. You can retry without playing again.'
            : null}
        </p>
      </section>
      <div className="actions">
        {status === 'failed' ? (
          <button
            type="button"
            className="primary"
            onClick={() => mutation.mutate(match)}
          >
            Retry recording
          </button>
        ) : null}
        <button type="button" className="primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button type="button" onClick={onMenu}>
          Main Menu
        </button>
      </div>
    </main>
  )
}
