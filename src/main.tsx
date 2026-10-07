import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function bootstrap() {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    quiet: true,
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
