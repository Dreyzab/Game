/**
 * Survival TV Page - Passive Dashboard for Main Screen
 * Displays timer, resources, crisis status, and activity log
 */

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { cn } from '@/shared/lib/utils/cn'
import { API_BASE_URL } from '@/shared/api/client'
import type { SurvivalState, LogEntry, BaseResources } from '@/shared/types/survival'

// Resource display configuration
const RESOURCE_CONFIG: Array<{
    key: keyof BaseResources
    label: string
    icon: string
    color: string
    max: number
}> = [
        { key: 'food', label: 'Еда', icon: '🍖', color: 'bg-amber-500', max: 20 },
        { key: 'fuel', label: 'Топливо', icon: '⛽', color: 'bg-orange-500', max: 15 },
        { key: 'medicine', label: 'Медикаменты', icon: '💊', color: 'bg-emerald-500', max: 10 },
        { key: 'defense', label: 'Защита', icon: '🛡️', color: 'bg-blue-500', max: 10 },
        { key: 'morale', label: 'Мораль', icon: '💪', color: 'bg-purple-500', max: 100 },
    ]

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatWorldTimeMinutes(minutes: number): string {
    const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60)
    const hh = Math.floor(normalized / 60)
    const mm = normalized % 60
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
}

function formatPhaseLabel(phase: SurvivalState['phase']): string {
    if (phase === 'start') return 'НАЧАЛО ДНЯ'
    if (phase === 'day') return 'ДЕНЬ'
    if (phase === 'monsters') return 'НОЧЬ (МОНСТРЫ)'
    return String(phase)
}

function ResourceBar({ label, icon, value, max, color }: {
    label: string
    icon: string
    value: number
    max: number
    color: string
}) {
    const percentage = Math.min(100, (value / max) * 100)

    return (
        <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-mono">{value}</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={cn('h-full transition-all duration-500', color)}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

function LogTicker({ entries }: { entries: LogEntry[] }) {
    return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
            {entries.slice(-10).reverse().map((entry) => (
                <div
                    key={entry.id}
                    className={cn(
                        'px-3 py-2 rounded text-sm border-l-4',
                        entry.type === 'crisis' && 'bg-red-900/30 border-red-500',
                        entry.type === 'system' && 'bg-blue-900/30 border-blue-500',
                        entry.type === 'action' && 'bg-gray-800/50 border-gray-600',
                        entry.type === 'loot' && 'bg-amber-900/30 border-amber-500',
                        entry.type === 'combat' && 'bg-orange-900/30 border-orange-500'
                    )}
                >
                    <span className="text-gray-400 text-xs font-mono mr-2">
                        {new Date(entry.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {entry.playerName && (
                        <span className="text-cyan-400 font-medium mr-1">{entry.playerName}</span>
                    )}
                    <span className="text-gray-200">{entry.message}</span>
                </div>
            ))}
        </div>
    )
}

export default function SurvivalTVPage() {
    const { sessionId } = useParams<{ sessionId: string }>()
    const [state, setState] = useState<SurvivalState | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [connected, setConnected] = useState(false)

    // Fetch initial state
    useEffect(() => {
        if (!sessionId) return

        const fetchState = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}`)
                const data = await res.json()
                if (data.session) {
                    setState(data.session)
                } else {
                    setError(data.error || 'Session not found')
                }
            } catch {
                setError('Failed to load session')
            }
        }

        fetchState()
    }, [sessionId])

    // WebSocket connection for real-time updates
    useEffect(() => {
        if (!sessionId) return

        const apiWsUrl = (() => {
            try {
                const apiUrl = new URL(API_BASE_URL)
                apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
                apiUrl.pathname = '/ws'
                apiUrl.search = ''
                apiUrl.hash = ''
                return apiUrl.toString()
            } catch {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
                return `${protocol}//${window.location.host}/ws`
            }
        })()

        const ws = new WebSocket(apiWsUrl)

        ws.onopen = () => {
            setConnected(true)
            ws.send(JSON.stringify({ type: 'survival:join', payload: { sessionId } }))
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                if (msg.type === 'survival:state_update') {
                    setState(msg.data)
                } else if (msg.type === 'survival:timer_sync') {
                    setState((prev) => {
                        if (!prev) return prev
                        const next = { ...prev, timerSeconds: msg.data.timerSeconds }
                        if (typeof msg.data.worldDay === 'number') next.worldDay = msg.data.worldDay
                        if (typeof msg.data.worldTimeMinutes === 'number') next.worldTimeMinutes = msg.data.worldTimeMinutes
                        if (typeof msg.data.phase === 'string') next.phase = msg.data.phase
                        return next
                    })
                } else if (msg.type === 'survival:log_entry') {
                    setState((prev) => prev ? { ...prev, log: [...prev.log, msg.data] } : prev)
                }
            } catch (e) {
                console.error('WS parse error', e)
            }
        }

        ws.onclose = () => setConnected(false)
        ws.onerror = () => setConnected(false)

        return () => ws.close()
    }, [sessionId])

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">Ошибка</h1>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        )
    }

    if (!state) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Загрузка сессии...</p>
                </div>
            </div>
        )
    }

    const isCrisis = state.crisisLevel === 'crisis'
    const isWarning = state.crisisLevel === 'warning'

    return (
        <div
            className={cn(
                'min-h-screen text-white p-6 transition-colors duration-500',
                isCrisis && 'bg-red-950 animate-pulse',
                isWarning && 'bg-yellow-950',
                !isCrisis && !isWarning && 'bg-gray-950'
            )}
        >
            {/* Header: Timer and Status */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'text-6xl font-mono font-bold',
                            isCrisis && 'text-red-500',
                            isWarning && 'text-yellow-500',
                            !isCrisis && !isWarning && 'text-cyan-400'
                        )}
                    >
                        {formatTime(state.timerSeconds)}
                    </div>
                    <div className="text-sm text-gray-400">
                        <div className="text-xs text-gray-500 font-mono">
                            DAY {state.worldDay} • {formatWorldTimeMinutes(state.worldTimeMinutes)} • {formatPhaseLabel(state.phase)}
                        </div>
                        {state.status === 'lobby' && 'Ожидание игроков...'}
                        {state.status === 'active' && 'Игра идёт'}
                        {state.status === 'paused' && 'Пауза'}
                        {state.status === 'ended' && 'Игра окончена'}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'px-4 py-2 rounded-full font-bold uppercase text-sm',
                            isCrisis && 'bg-red-600 text-white animate-pulse',
                            isWarning && 'bg-yellow-600 text-black',
                            !isCrisis && !isWarning && 'bg-emerald-600 text-white'
                        )}
                    >
                        {isCrisis ? '⚠️ КРИЗИС' : isWarning ? '⚡ ВНИМАНИЕ' : '✓ СПОКОЙНО'}
                    </div>
                    <div
                        className={cn(
                            'w-3 h-3 rounded-full',
                            connected ? 'bg-green-500' : 'bg-red-500'
                        )}
                        title={connected ? 'Connected' : 'Disconnected'}
                    />
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* Left: Resources */}
                <section className="col-span-4 bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                    <h2 className="text-xl font-bold mb-4 text-gray-300">📦 Ресурсы Базы</h2>
                    <div className="space-y-4">
                        {RESOURCE_CONFIG.map((r) => (
                            <ResourceBar
                                key={r.key}
                                label={r.label}
                                icon={r.icon}
                                value={state.resources[r.key]}
                                max={r.max}
                                color={r.color}
                            />
                        ))}
                    </div>
                </section>

                {/* Center: Players and NPCs */}
                <section className="col-span-4 bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                    <h2 className="text-xl font-bold mb-4 text-gray-300">👥 Жители</h2>
                    <div className="space-y-3">
                        {Object.values(state.players).map((player) => (
                            <div
                                key={player.playerId}
                                className={cn(
                                    'flex items-center justify-between p-3 rounded-lg',
                                    player.isWounded ? 'bg-red-900/30' : 'bg-gray-800/50'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">
                                        {player.role === 'scout' && '🔭'}
                                        {player.role === 'enforcer' && '💪'}
                                        {player.role === 'techie' && '🔧'}
                                        {player.role === 'face' && '🎭'}
                                        {!player.role && '👤'}
                                    </div>
                                    <div>
                                        <div className="font-medium">{player.playerName}</div>
                                        <div className="text-xs text-gray-400">
                                            {player.currentZone ? `В ${player.currentZone}` : 'На базе'}
                                        </div>
                                    </div>
                                </div>
                                {player.isWounded && (
                                    <span className="text-red-400 text-sm">🩹 Ранен</span>
                                )}
                            </div>
                        ))}

                        {state.npcs.length > 0 && (
                            <>
                                <div className="border-t border-gray-700 my-3" />
                                <div className="text-sm text-gray-400 mb-2">NPC на базе:</div>
                                {state.npcs.map((npc) => (
                                    <div key={npc.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                                        <span>{npc.name}</span>
                                        <span className="text-xs text-gray-500">-{npc.dailyCost}🍖/день</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </section>

                {/* Right: Activity Log */}
                <section className="col-span-4 bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                    <h2 className="text-xl font-bold mb-4 text-gray-300">📜 Журнал</h2>
                    <LogTicker entries={state.log} />
                </section>
            </div>

            {/* Session Info Footer */}
            <footer className="mt-8 text-center text-gray-600 text-sm">
                Сессия: <span className="font-mono text-gray-400">{state.sessionId}</span>
            </footer>
        </div>
    )
}
