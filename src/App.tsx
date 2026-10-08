import { QueryClientProvider } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { CompletedMatch } from './match/completed'
import { queryClient } from './queryClient'
import { MainMenu } from './screens/MainMenu'
import { MatchScreen } from './screens/MatchScreen'
import { OptionsScreen } from './screens/OptionsScreen'
import { ResultScreen } from './screens/ResultScreen'

type Screen = 'menu' | 'options' | 'match' | 'result'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [result, setResult] = useState<CompletedMatch | null>(null)
  const handleFinished = useCallback((match: CompletedMatch) => {
    setResult(match)
    setScreen('result')
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {screen === 'options' ? (
        <OptionsScreen onBack={() => setScreen('menu')} />
      ) : null}
      {screen === 'match' ? (
        <MatchScreen
          onLeave={() => setScreen('menu')}
          onFinished={handleFinished}
        />
      ) : null}
      {screen === 'result' && result ? (
        <ResultScreen
          match={result}
          onPlayAgain={() => setScreen('match')}
          onMenu={() => setScreen('menu')}
        />
      ) : null}
      {screen === 'menu' ? (
        <MainMenu
          onPlay={() => setScreen('match')}
          onOptions={() => setScreen('options')}
        />
      ) : null}
    </QueryClientProvider>
  )
}
