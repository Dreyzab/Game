import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.tsx'

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim()
const convex = convexUrl ? new ConvexReactClient(convexUrl) : undefined

const app = (
  <StrictMode>
    {convex ? (
      <ConvexProvider client={convex}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProvider>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(app)
