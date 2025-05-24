import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Geubsik from './Geubsik'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Geubsik />
  </StrictMode>,
)
