import { useState } from 'react'
import { MainMenu } from './screens/MainMenu'
import { MatchScreen } from './screens/MatchScreen'
import { OptionsScreen } from './screens/OptionsScreen'

type Screen = 'menu' | 'options' | 'match'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')

  if (screen === 'options') {
    return <OptionsScreen onBack={() => setScreen('menu')} />
  }

  if (screen === 'match') {
    return <MatchScreen onLeave={() => setScreen('menu')} />
  }

  return (
    <MainMenu
      onPlay={() => setScreen('match')}
      onOptions={() => setScreen('options')}
    />
  )
}
