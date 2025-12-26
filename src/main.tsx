import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const isAuthDisabled = import.meta.env.VITE_DISABLE_AUTH === 'true'
const queryClient = new QueryClient()

export const MissingClerkConfig = () => (
  <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 text-center">
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Аутентификация отключена</h1>
      <p className="text-slate-300 text-sm">
        Приложение запущено в режиме гостя (VITE_DISABLE_AUTH=true).
      </p>
    </div>
  </div>
)

const appTree = (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {clerkPublishableKey && !isAuthDisabled ? (
        <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      ) : (
        /* Clerk is disabled or missing key - Render App directly for Guest/Dev mode */
        <App />
      )}
    </BrowserRouter>
  </QueryClientProvider>
)

const strictModeFlag = (import.meta.env.VITE_ENABLE_STRICT_MODE ?? '').toLowerCase()
const shouldUseStrictMode = strictModeFlag === 'true'

const app = shouldUseStrictMode ? <StrictMode>{appTree}</StrictMode> : appTree

createRoot(document.getElementById('root')!).render(app)

