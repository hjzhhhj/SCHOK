import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SetupPage from './pages/SetUpPage'
import Timetable from './pages/TimeTable'
import Meal from './pages/Meal'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Meal />
  </StrictMode>,
)
