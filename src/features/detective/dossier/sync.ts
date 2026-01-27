/**
 * Detective Dossier Cloud Sync
 * 
 * Synchronizes detective dossier state with server for cross-device support.
 */

import { useDossierStore } from './store'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface SyncResult {
    success: boolean
    conflict?: boolean
    serverState?: any
    serverTimestamp?: number
}

/**
 * Fetch detective state from server
 * 
 * Called on login to restore progress across devices.
 */
export async function fetchDetectiveState(): Promise<SyncResult> {
    try {
        const response = await fetch(`${API_BASE_URL}/detective/state`, {
            method: 'GET',
            credentials: 'include', // Auth cookies
        })

        const data = await response.json()

        if (!data.success) {
            console.warn('Failed to fetch detective state:', data.error)
            return { success: false }
        }

        // Merge server state into Zustand
        const { state } = data
        useDossierStore.setState({
            entries: state.entries || [],
            evidence: state.evidence || [],
            pointStates: state.pointStates || {},
            flags: state.flags || {},
            detectiveName: state.detectiveName || null,
        })

        console.log('[Sync] Fetched detective state from server')
        return { success: true }
    } catch (error) {
        console.error('[Sync] Failed to fetch detective state:', error)
        return { success: false }
    }
}

/**
 * Upload detective state to server
 * 
 * Called on state changes (debounced) and before page unload.
 */
export async function syncDetectiveState(): Promise<SyncResult> {
    try {
        const currentState = useDossierStore.getState()

        // Build payload (exclude UI state like isOpen)
        const payload = {
            entries: currentState.entries,
            evidence: currentState.evidence,
            pointStates: currentState.pointStates,
            flags: currentState.flags,
            detectiveName: currentState.detectiveName,
        }

        const clientTimestamp = Date.now()

        const response = await fetch(`${API_BASE_URL}/detective/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                state: payload,
                clientTimestamp,
            }),
        })

        const data = await response.json()

        if (data.code === 'CONFLICT') {
            // Server state is newer → return for user decision
            console.warn('[Sync] Conflict detected. Server state is newer.')
            return {
                success: false,
                conflict: true,
                serverState: data.serverState,
                serverTimestamp: data.serverTimestamp,
            }
        }

        if (!data.success) {
            console.warn('[Sync] Failed to sync detective state:', data.error)
            return { success: false }
        }

        console.log('[Sync] Synced detective state to server')
        return { success: true }
    } catch (error) {
        console.error('[Sync] Failed to sync detective state:', error)
        return { success: false }
    }
}

/**
 * Resolve conflict between local and server state
 * 
 * Strategies:
 * - 'server-wins': Overwrite local with server
 * - 'local-wins': Keep local, discard server (force sync)
 * - 'merge': Smart merge (union of evidence/entries, latest flags)
 */
export function resolveConflict(
    localState: any,
    serverState: any,
    strategy: 'server-wins' | 'local-wins' | 'merge'
): any {
    switch (strategy) {
        case 'server-wins':
            return serverState

        case 'local-wins':
            return localState

        case 'merge': {
            // Smart merge: union of evidence/entries, latest flags
            const mergeById = <T extends { id: string }>(arr1: T[], arr2: T[]): T[] => {
                const map = new Map<string, T>()
                arr1.forEach(item => map.set(item.id, item))
                arr2.forEach(item => map.set(item.id, item)) // Later items override
                return Array.from(map.values())
            }

            return {
                entries: mergeById(serverState.entries || [], localState.entries || []),
                evidence: mergeById(serverState.evidence || [], localState.evidence || []),
                pointStates: { ...serverState.pointStates, ...localState.pointStates },
                flags: { ...serverState.flags, ...localState.flags },
                detectiveName: localState.detectiveName || serverState.detectiveName,
            }
        }

        default:
            return serverState
    }
}

/**
 * Apply conflict resolution
 * 
 * Updates Zustand store with resolved state and re-syncs to server.
 */
export async function applyConflictResolution(
    serverState: any,
    strategy: 'server-wins' | 'local-wins' | 'merge'
): Promise<void> {
    const localState = useDossierStore.getState()
    const resolved = resolveConflict(localState, serverState, strategy)

    // Update Zustand
    useDossierStore.setState({
        entries: resolved.entries,
        evidence: resolved.evidence,
        pointStates: resolved.pointStates,
        flags: resolved.flags,
        detectiveName: resolved.detectiveName,
    })

    // Re-sync to server
    await syncDetectiveState()
}
