import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import './shared/lib/i18n'
import App from './App.tsx'
import { ClerkAuthBridge, GuestAuthProvider, clerkPublishableKey, isClerkEnabled } from '@/shared/auth'

const queryClient = new QueryClient()

console.log('[App] Initialization starting...')
console.log('[App] VITE_DISABLE_AUTH:', import.meta.env.VITE_DISABLE_AUTH)
console.log('[App] Clerk Key present:', !!clerkPublishableKey)

// #region agent log (debug)
fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main.tsx:startup',message:'frontend_startup',data:{href:typeof window!=='undefined'?window.location.href:null,isClerkEnabled:Boolean(isClerkEnabled),hasClerkKey:Boolean(clerkPublishableKey)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'L0'})}).catch(()=>{});
// #endregion agent log (debug)

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
      {isClerkEnabled ? (
        <ClerkProvider publishableKey={clerkPublishableKey!} afterSignOutUrl="/">
          <ClerkAuthBridge>
            <App />
          </ClerkAuthBridge>
        </ClerkProvider>
      ) : (
        /* Guest/Dev mode: provide stable auth stubs so app code doesn't call Clerk hooks */
        <GuestAuthProvider>
          <App />
        </GuestAuthProvider>
      )}
    </BrowserRouter>
  </QueryClientProvider>
)

const strictModeFlag = (import.meta.env.VITE_ENABLE_STRICT_MODE ?? '').toLowerCase()
const shouldUseStrictMode = strictModeFlag === 'true'

const app = shouldUseStrictMode ? <StrictMode>{appTree}</StrictMode> : appTree

createRoot(document.getElementById('root')!).render(app)

