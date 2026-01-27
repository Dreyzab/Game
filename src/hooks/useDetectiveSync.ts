import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { fetchDetectiveState, syncDetectiveState } from '@/features/detective/dossier/sync'

/**
 * Detective Sync Hook
 * 
 * Auto-syncs detective dossier state on login/logout and page unload.
 * 
 * Usage: Add to App component
 * ```tsx
 * function App() {
 *   useDetectiveSync()
 *   // ...
 * }
 * ```
 */
export function useDetectiveSync() {
    const { isSignedIn } = useAuth()

    useEffect(() => {
        if (!isSignedIn) return

        // Fetch state on login
        console.log('[Sync] User signed in, fetching detective state...')
        fetchDetectiveState()

        // Sync on window unload (before page closes)
        const handleUnload = () => {
            // Note: fetch with keepalive to ensure request completes
            syncDetectiveState()
        }

        window.addEventListener('beforeunload', handleUnload)

        return () => {
            window.removeEventListener('beforeunload', handleUnload)

            // Sync on component unmount (logout/navigation)
            syncDetectiveState()
        }
    }, [isSignedIn])
}
