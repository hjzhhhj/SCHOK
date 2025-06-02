import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SetupPage from './SetUpPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SetupPage />
  </StrictMode>,
)
