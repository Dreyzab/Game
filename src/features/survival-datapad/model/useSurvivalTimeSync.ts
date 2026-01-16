/**
 * useSurvivalTimeSync - NTP-style time synchronization hook for Survival mode
 *
 * Calculates server-client time offset using ping-pong protocol:
 * - Sends 5 ping requests on mount
 * - Calculates offset: (T1 - T0 + T2 - T3) / 2
 * - Discards outliers (>1σ from median RTT)
 * - Re-syncs every 60 seconds
 */

import { useEffect, useState, useCallback, useRef } from 'react'

interface TimeSyncState {
    /** Offset in ms: serverTime = clientTime + offset */
    offset: number
    /** Latest world time in lore ms (from last sync) */
    worldTimeMs: number
    /** Current day number */
    worldDay: number
    /** Minutes since midnight (0-1439) */
    worldTimeMinutes: number
    /** Current phase */
    phase: 'start' | 'day' | 'monsters'
    /** Whether sync is complete */
    isSynced: boolean
    /** Number of samples collected */
    sampleCount: number
}

interface TimePongData {
    clientT0: number
    serverT1: number
    serverT2: number
    worldTimeMs: number
    worldDay: number
    worldTimeMinutes: number
    phase: 'start' | 'day' | 'monsters'
}

const SYNC_SAMPLES = 5
const RESYNC_INTERVAL_MS = 60 * 1000

export function useSurvivalTimeSync(
    ws: WebSocket | null,
    sessionId: string | null
): TimeSyncState & { resync: () => void } {
    const [state, setState] = useState<TimeSyncState>({
        offset: 0,
        worldTimeMs: 0,
        worldDay: 1,
        worldTimeMinutes: 360,
        phase: 'start',
        isSynced: false,
        sampleCount: 0,
    })

    const samplesRef = useRef<Array<{ offset: number; rtt: number }>>([])
    const pendingPingsRef = useRef<number>(0)

    const sendPing = useCallback(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN || !sessionId) return

        const clientT0 = Date.now()
        ws.send(JSON.stringify({
            type: 'survival:time_ping',
            payload: { sessionId, clientT0 }
        }))
        pendingPingsRef.current++
    }, [ws, sessionId])

    const handlePong = useCallback((data: TimePongData) => {
        const clientT3 = Date.now()
        const { clientT0, serverT1, serverT2 } = data

        // RTT = (T3 - T0) - (T2 - T1)  (excludes server processing time)
        const rtt = (clientT3 - clientT0) - (serverT2 - serverT1)

        // Offset = ((T1 - T0) + (T2 - T3)) / 2
        const offset = ((serverT1 - clientT0) + (serverT2 - clientT3)) / 2

        samplesRef.current.push({ offset, rtt })

        // After collecting all samples, compute final offset
        if (samplesRef.current.length >= SYNC_SAMPLES) {
            const samples = samplesRef.current.slice(-SYNC_SAMPLES)

            // Calculate median RTT
            const rtts = samples.map(s => s.rtt).sort((a, b) => a - b)
            const medianRtt = rtts[Math.floor(rtts.length / 2)]

            // Calculate standard deviation
            const mean = rtts.reduce((a, b) => a + b, 0) / rtts.length
            const variance = rtts.reduce((a, b) => a + (b - mean) ** 2, 0) / rtts.length
            const stdDev = Math.sqrt(variance)

            // Filter out outliers (>1σ from median)
            const filteredSamples = samples.filter(s =>
                Math.abs(s.rtt - medianRtt) <= stdDev
            )

            // Average the remaining offsets
            const avgOffset = filteredSamples.length > 0
                ? filteredSamples.reduce((a, b) => a + b.offset, 0) / filteredSamples.length
                : offset

            setState({
                offset: avgOffset,
                worldTimeMs: data.worldTimeMs,
                worldDay: data.worldDay,
                worldTimeMinutes: data.worldTimeMinutes,
                phase: data.phase,
                isSynced: true,
                sampleCount: samplesRef.current.length,
            })

            samplesRef.current = []
            pendingPingsRef.current = 0
        } else {
            // Update with latest data while collecting samples
            setState(prev => ({
                ...prev,
                worldTimeMs: data.worldTimeMs,
                worldDay: data.worldDay,
                worldTimeMinutes: data.worldTimeMinutes,
                phase: data.phase,
                sampleCount: samplesRef.current.length,
            }))

            // Send next ping
            setTimeout(sendPing, 100)
        }
    }, [sendPing])

    const resync = useCallback(() => {
        samplesRef.current = []
        setState(prev => ({ ...prev, isSynced: false, sampleCount: 0 }))
        sendPing()
    }, [sendPing])

    // Listen for pong messages
    useEffect(() => {
        if (!ws) return

        const handleMessage = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data)
                if (message.type === 'survival:time_pong') {
                    handlePong(message.data)
                }
            } catch {
                // Ignore non-JSON messages
            }
        }

        ws.addEventListener('message', handleMessage)
        return () => ws.removeEventListener('message', handleMessage)
    }, [ws, handlePong])

    // Initial sync on mount
    useEffect(() => {
        if (ws && ws.readyState === WebSocket.OPEN && sessionId && !state.isSynced) {
            sendPing()
        }
    }, [ws, sessionId, state.isSynced, sendPing])

    // Periodic resync
    useEffect(() => {
        if (!state.isSynced) return

        const interval = setInterval(resync, RESYNC_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [state.isSynced, resync])

    return { ...state, resync }
}
