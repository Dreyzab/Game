import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.tsx'

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim()
const convex = convexUrl ? new ConvexReactClient(convexUrl) : undefined

const appTree = convex ? (
  <ConvexProvider client={convex}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConvexProvider>
) : (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

const strictModeFlag = (import.meta.env.VITE_ENABLE_STRICT_MODE ?? '').toLowerCase()
const shouldUseStrictMode = strictModeFlag === 'true'

const app = shouldUseStrictMode ? <StrictMode>{appTree}</StrictMode> : appTree

createRoot(document.getElementById('root')!).render(app)
