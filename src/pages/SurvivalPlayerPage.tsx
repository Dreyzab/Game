/**
 * Survival Player Page - Mobile Controller Interface
 * Flow: Join/Create -> Character Select -> Base (see players) -> Zones (QR)
 */

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/utils/cn'
import { useAppAuth } from '@/shared/auth'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { API_BASE_URL } from '@/shared/api/client'
import { SurvivalBunkerDashboard } from '@/features/survival-bunker'
import { SurvivalDatapad } from '@/features/survival-datapad'
import { ModeSwitcher, SurvivalMapEditor, SurvivalMapbox, generateMap, type SurvivalMode } from '@/features/survival-hex-map'
import type {
    SurvivalEvent,
    SurvivalPlayer,
    SurvivalState,
    PlayerRole,
    ZoneType,
} from '@/shared/types/survival'
import { SURVIVOR_TEMPLATES, PLAYER_ROLES, ZONE_DEFINITIONS } from '@/shared/types/survival'

type PagePhase = 'lobby' | 'character_select' | 'base' | 'editor'

// ============================================================================
// ROLE & CHARACTER CONFIG
// ============================================================================

const ROLE_CONFIG: Record<PlayerRole, { icon: string; color: string; nameRu: string }> = {
    scout: { icon: '🔭', color: 'text-green-400', nameRu: 'Разведчик' },
    enforcer: { icon: '💪', color: 'text-red-400', nameRu: 'Силовик' },
    techie: { icon: '🔧', color: 'text-blue-400', nameRu: 'Техник' },
    face: { icon: '🎭', color: 'text-purple-400', nameRu: 'Дипломат' },
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Lobby: Create or Join a session */
function LobbyView({
    mode,
    onCreateSession,
    onJoinSession,
    onOpenEditor,
    isLoading,
    error,
}: {
    mode: 'create' | 'join' | null
    onCreateSession: () => void
    onJoinSession: (code: string) => void
    onOpenEditor: () => void
    isLoading: boolean
    error: string | null
}) {
    const [joinCode, setJoinCode] = useState('')

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">☢️</div>
            <h1 className="text-3xl font-bold mb-2">Режим Выживания</h1>
            <p className="text-gray-400 mb-8 text-center max-w-xs">
                Локальный кооп с QR-кодами. Исследуй квартиру, собирай ресурсы, выживай.
            </p>

            {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg px-4 py-3 mb-6 text-red-200 max-w-xs text-center">
                    {error}
                </div>
            )}

            {mode === 'create' ? (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-gray-300 text-sm">Ты будешь Мастером Игры (GM)</p>
                    <button
                        onClick={onCreateSession}
                        disabled={isLoading}
                        className="px-8 py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl font-bold text-lg"
                    >
                        {isLoading ? 'Создание...' : 'Создать Комнату'}
                    </button>
                    <button onClick={onOpenEditor} className="text-amber-500 hover:text-amber-400 text-sm underline">
                        🛠️ Редактор Карты (NEW)
                    </button>
                </div>
            ) : mode === 'join' ? (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-gray-300 text-sm">Введите код комнаты:</p>
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        className="w-48 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-center text-xl uppercase tracking-widest"
                        maxLength={6}
                    />
                    <button
                        onClick={() => onJoinSession(joinCode)}
                        disabled={isLoading || joinCode.length < 4}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl font-bold"
                    >
                        {isLoading ? 'Подключение...' : 'Войти'}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <button
                        onClick={onCreateSession}
                        disabled={isLoading}
                        className="px-6 py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl font-bold"
                    >
                        Создать Комнату
                    </button>
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-full h-px bg-gray-700" />
                        <span className="relative px-3 bg-gray-950 text-gray-500 text-sm">или</span>
                    </div>
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Код комнаты"
                        className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-center text-xl uppercase tracking-widest"
                        maxLength={6}
                    />
                    <button
                        onClick={() => onJoinSession(joinCode)}
                        disabled={isLoading || joinCode.length < 4}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl font-bold"
                    >
                        Присоединиться
                    </button>

                    <button onClick={onOpenEditor} className="mt-4 text-gray-500 hover:text-gray-300 text-sm flex items-center justify-center gap-2">
                        🛠️ Редактор Карты
                    </button>
                </div>
            )}
        </div>
    )
}

/** Character Selection */
function CharacterSelectView({
    onSelectCharacter,
    isLoading,
    error,
}: {
    onSelectCharacter: (characterId: string, role: PlayerRole) => void
    isLoading: boolean
    error: string | null
}) {
    const [selected, setSelected] = useState<string | null>(null)

    const handleConfirm = () => {
        const char = SURVIVOR_TEMPLATES.find(c => c.id === selected)
        if (char) {
            onSelectCharacter(char.id, char.role)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4">
            {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg px-4 py-3 mb-6 text-red-200 text-center">
                    {error}
                </div>
            )}
            <h1 className="text-2xl font-bold text-center mb-2">Выбери Выжившего</h1>
            <p className="text-gray-400 text-center text-sm mb-6">Каждый имеет уникальную способность</p>

            <div className="space-y-4 mb-6">
                {SURVIVOR_TEMPLATES.map((char) => {
                    const roleInfo = PLAYER_ROLES[char.role]
                    const roleConfig = ROLE_CONFIG[char.role]
                    const isSelected = selected === char.id

                    return (
                        <button
                            key={char.id}
                            onClick={() => setSelected(char.id)}
                            className={cn(
                                'w-full text-left p-4 rounded-xl border-2 transition-all',
                                isSelected
                                    ? 'border-amber-500 bg-amber-900/20'
                                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn('text-4xl', roleConfig.color)}>
                                    {roleConfig.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{char.name}</span>
                                        <span className={cn('text-xs px-2 py-0.5 rounded', roleConfig.color, 'bg-gray-800')}>
                                            {roleInfo.nameRu}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">{char.backstory}</p>
                                    <p className="text-amber-400 text-xs mt-2">
                                        ✨ {roleInfo.passiveAbility}
                                    </p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            <button
                onClick={handleConfirm}
                disabled={!selected || isLoading}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg"
            >
                {isLoading ? 'Подтверждение...' : 'Выбрать'}
            </button>
        </div>
    )
}

/** Base View - shows other players, inventory, QR prompt */
function BaseView({
    session,
    player,
    onEnterZone,
    onTransfer,
    isLoading,
}: {
    session: SurvivalState
    player: SurvivalPlayer
    onEnterZone: (zone: ZoneType) => void
    onTransfer: (templateId: string, quantity: number) => void
    isLoading: boolean
}) {
    const navigate = useNavigate()
    const otherPlayers = Object.values(session.players).filter(p => p.playerId !== player.playerId)
    const roleConfig = player.role ? ROLE_CONFIG[player.role] : null

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4">
            {/* Header */}
            <header className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    {roleConfig && (
                        <div className={cn('text-2xl', roleConfig.color)}>{roleConfig.icon}</div>
                    )}
                    <div>
                        <div className="font-bold">{player.playerName}</div>
                        <div className="text-xs text-gray-400">
                            {roleConfig?.nameRu || 'Без роли'} • {player.isWounded ? '🩹 Ранен' : '✓ Здоров'}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">Комната</div>
                    <div className="font-mono text-amber-400">{session.sessionId}</div>
                </div>
            </header>

            {/* Other Players */}
            <section className="bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 mb-3">👥 На базе ({otherPlayers.length + 1})</h3>
                <div className="flex flex-wrap gap-2">
                    {/* Current player */}
                    <div className="px-3 py-2 bg-amber-900/30 border border-amber-500/50 rounded-lg text-sm">
                        {roleConfig?.icon || '👤'} {player.playerName} (ты)
                    </div>
                    {/* Others */}
                    {otherPlayers.map((p) => {
                        const pRole = p.role ? ROLE_CONFIG[p.role] : null
                        const isInZone = p.currentZone !== null
                        return (
                            <div
                                key={p.playerId}
                                className={cn(
                                    'px-3 py-2 rounded-lg text-sm',
                                    isInZone ? 'bg-blue-900/30 border border-blue-500/50' : 'bg-gray-800/50 border border-gray-700'
                                )}
                            >
                                {pRole?.icon || '👤'} {p.playerName}
                                {isInZone && <span className="text-blue-400 ml-1">→ {p.currentZone}</span>}
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Inventory */}
            <section className="bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 mb-3">🎒 Инвентарь</h3>
                {player.inventory.items.length === 0 ? (
                    <p className="text-gray-500 text-sm">Пусто</p>
                ) : (
                    <div className="space-y-2">
                        {player.inventory.items.map((item) => (
                            <div key={item.templateId} className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                                <span>{item.templateId} x{item.quantity}</span>
                                <button
                                    onClick={() => onTransfer(item.templateId, 1)}
                                    disabled={isLoading}
                                    className="px-2 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-xs"
                                >
                                    Сдать
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* QR Scan Prompt */}
            <section className="bg-linear-to-br from-amber-900/20 to-transparent rounded-xl p-6 text-center border border-amber-500/30">
                <div className="text-5xl mb-3">📷</div>
                <p className="text-gray-300 mb-4">Отсканируй QR-код зоны для разведки</p>
                <button
                    onClick={() => navigate('/qr-scanner')}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold"
                >
                    Открыть Сканер
                </button>
            </section>

            {/* Debug zones */}
            <section className="mt-4 bg-gray-900/30 rounded-lg p-3 border border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Debug: войти в зону</p>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(ZONE_DEFINITIONS) as ZoneType[]).map((zone) => (
                        <button
                            key={zone}
                            onClick={() => onEnterZone(zone)}
                            disabled={isLoading}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                        >
                            {ZONE_DEFINITIONS[zone].nameRu}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    )
}

/** Event Card */
function EventCard({
    event,
    playerRole,
    playerInventory,
    onSelectOption,
    isLoading,
}: {
    event: SurvivalEvent
    playerRole: PlayerRole | null
    playerInventory: Array<{ templateId: string; quantity: number }>
    onSelectOption: (optionId: string) => void
    isLoading: boolean
}) {
    const hasItem = (templateId: string) =>
        playerInventory.some((i) => i.templateId === templateId && i.quantity > 0)

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                {event.imageUrl && (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                    <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
                    <p className="text-gray-300 mb-6 leading-relaxed">{event.text}</p>

                    <div className="space-y-3">
                        {event.options.map((option) => {
                            const needsRole = option.requiredRole && option.requiredRole !== playerRole
                            const needsItem = option.requiredItem && !hasItem(option.requiredItem)
                            const isDisabled = needsRole || needsItem || isLoading

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => !isDisabled && onSelectOption(option.id)}
                                    disabled={isDisabled}
                                    className={cn(
                                        'w-full text-left px-4 py-3 rounded-lg border transition-all',
                                        isDisabled
                                            ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-cyan-500'
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <span>{option.text}</span>
                                        {option.cost && (
                                            <span className="text-amber-400 text-sm ml-2">
                                                {Object.entries(option.cost)
                                                    .map(([k, v]) => `${v}${k === 'food' ? '🍖' : k === 'fuel' ? '⛽' : ''}`)
                                                    .join(' ')}
                                            </span>
                                        )}
                                    </div>
                                    {needsRole && (
                                        <div className="text-xs text-yellow-500 mt-1">
                                            Требуется роль: {ROLE_CONFIG[option.requiredRole!]?.nameRu}
                                        </div>
                                    )}
                                    {needsItem && (
                                        <div className="text-xs text-red-400 mt-1">
                                            Нужен предмет: {option.requiredItem}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SurvivalPlayerPage() {
    const [searchParams] = useSearchParams()
    const { getToken } = useAppAuth()
    const { deviceId } = useDeviceId()

    // URL params
    const modeParam = searchParams.get('mode') as 'create' | 'join' | null
    const sessionParam = searchParams.get('session')
    const zoneParam = searchParams.get('zone') as ZoneType | null

    // State
    const [phase, setPhase] = useState<PagePhase>(sessionParam ? 'character_select' : 'lobby')
    const [sessionId, setSessionId] = useState<string | null>(sessionParam)
    const [session, setSession] = useState<SurvivalState | null>(null)
    const [player, setPlayer] = useState<SurvivalPlayer | null>(null)
    const [activeEvent, setActiveEvent] = useState<SurvivalEvent | null>(null)
    const [baseMode, setBaseMode] = useState<SurvivalMode>('datapad')
    const baseModeRef = useRef(baseMode)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        baseModeRef.current = baseMode
    }, [baseMode])

    const hexMapConfig = useMemo(() => {
        const flags = session?.flags
        const seedRaw = flags ? (flags['hexMapSeed'] as unknown) : undefined
        const radiusRaw = flags ? (flags['hexMapRadius'] as unknown) : undefined
        const seed = (typeof seedRaw === 'number' && Number.isFinite(seedRaw)) ? Math.floor(seedRaw) : 1337
        const radius = (typeof radiusRaw === 'number' && Number.isFinite(radiusRaw)) ? Math.max(1, Math.floor(radiusRaw)) : 14
        return { seed, radius }
    }, [session?.flags])

    const hexInitialMap = useMemo(() => {
        return generateMap(hexMapConfig.radius, hexMapConfig.seed)
    }, [hexMapConfig.radius, hexMapConfig.seed])

    // Auth headers
    const getAuthHeaders = useCallback(async () => {
        const token = await getToken()
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (deviceId) headers['X-Device-Id'] = deviceId
        return headers
    }, [getToken, deviceId])

    // WebSocket connection for real-time session updates (timer, phases, wounds, etc.)
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
            ws.send(JSON.stringify({ type: 'survival:join', payload: { sessionId } }))
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                if (msg.type === 'survival:state_update') {
                    setSession(msg.data)
                    setPlayer((prev) => {
                        const playerId = prev?.playerId
                        if (!playerId) return prev
                        const updated = msg.data?.players?.[playerId]
                        if (updated) {
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'src/pages/SurvivalPlayerPage.tsx:ws.onmessage(state_update)',message:'WS state_update for player',data:{playerId,updatedActiveEventId:updated.activeEventId ?? null,updatedActiveEventPresent:Boolean(updated.activeEvent),updatedActiveEventIdObj:(updated.activeEvent as any)?.id ?? null,updatedMovementStatePresent:Boolean((updated as any).movementState),baseMode: baseModeRef.current},timestamp:Date.now()})}).catch(()=>{});
                            // #endregion
                            // Sync active encounter from server state (zone events + hex encounters)
                            if (updated.activeEventId) {
                                if (updated.activeEvent) setActiveEvent(updated.activeEvent)
                            } else {
                                setActiveEvent(null)
                            }
                        }
                        return updated ?? prev
                    })
                } else if (msg.type === 'survival:timer_sync') {
                    setSession((prev) => {
                        if (!prev) return prev
                        const next = { ...prev, timerSeconds: msg.data.timerSeconds }
                        if (typeof msg.data.worldDay === 'number') next.worldDay = msg.data.worldDay
                        if (typeof msg.data.worldTimeMinutes === 'number') next.worldTimeMinutes = msg.data.worldTimeMinutes
                        if (typeof msg.data.phase === 'string') next.phase = msg.data.phase
                        return next
                    })
                } else if (msg.type === 'survival:log_entry') {
                    setSession((prev) => prev ? { ...prev, log: [...prev.log, msg.data] } : prev)
                }
            } catch (e) {
                console.error('WS parse error', e)
            }
        }

        return () => ws.close()
    }, [sessionId])

    // Create session
    const handleCreateSession = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`${API_BASE_URL}/survival/sessions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ hostName: 'Host' }),
            })
            const data = await res.json()
            if (data.session) {
                setSessionId(data.session.sessionId)
                setSession(data.session)
                setPhase('character_select')
                // Update URL
                window.history.replaceState({}, '', `/survival/player?session=${data.session.sessionId}`)
            } else {
                setError(data.error || 'Не удалось создать комнату')
            }
        } catch {
            setError('Ошибка подключения к серверу')
        } finally {
            setIsLoading(false)
        }
    }, [getAuthHeaders])

    // Join session
    const handleJoinSession = useCallback(async (code: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            // First check if session exists
            const res = await fetch(`${API_BASE_URL}/survival/sessions/${code}`, { headers })
            const data = await res.json()
            if (data.session) {
                setSessionId(code)
                setSession(data.session)
                setPhase('character_select')
                window.history.replaceState({}, '', `/survival/player?session=${code}`)
            } else {
                setError(data.error || 'Комната не найдена')
            }
        } catch {
            setError('Ошибка подключения')
        } finally {
            setIsLoading(false)
        }
    }, [getAuthHeaders])

    // Select character and join
    const handleSelectCharacter = useCallback(async (characterId: string, role: PlayerRole) => {
        console.log('[Survival] Selecting character:', { characterId, role, sessionId })

        if (!sessionId) {
            console.error('[Survival] Session ID is missing during character select!')
            setError('Ошибка: ID сессии отсутствует')
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const char = SURVIVOR_TEMPLATES.find(c => c.id === characterId)
            console.log('[Survival] Found template:', char)

            const headers = await getAuthHeaders()
            const url = `${API_BASE_URL}/survival/sessions/${sessionId}/join`
            console.log('[Survival] Joining session:', url)

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    role,
                    playerName: char?.name || 'Player',
                }),
            })

            console.log('[Survival] Response status:', res.status)
            const data = await res.json()
            console.log('[Survival] Response data:', data)

            if (data.session && data.player) {
                setSession(data.session)
                setPlayer(data.player)
                setPhase('base')
                setBaseMode('datapad')
            } else {
                console.error('[Survival] Join failed:', data.error)
                setError(data.error || 'Не удалось присоединиться')
            }
        } catch (err) {
            console.error('[Survival] Join exception:', err)
            setError('Ошибка подключения')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, getAuthHeaders])

    // Enter zone
    const handleEnterZone = useCallback(async (zoneId: ZoneType) => {
        if (!sessionId) return
        setIsLoading(true)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}/enter`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ zoneId }),
            })
            const data = await res.json()
            if (data.event) {
                setActiveEvent(data.event)
                setPhase('base')
            } else if (data.error) {
                setError(data.error)
            } else {
                setMessage('Ничего не найдено в этой зоне')
            }
        } catch {
            setError('Ошибка при входе в зону')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, getAuthHeaders])

    // Resolve event
    const handleResolveOption = useCallback(async (optionId: string) => {
        if (!sessionId || !activeEvent) return
        setIsLoading(true)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}/resolve`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ eventId: activeEvent.id, optionId }),
            })
            const data = await res.json()
            if (data.success !== undefined) {
                setMessage(data.message || (data.success ? 'Успех!' : 'Неудача...'))
                setActiveEvent(null)
                setPhase('base')
                // Refresh session
                const sessionRes = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}`, { headers })
                const sessionData = await sessionRes.json()
                if (sessionData.session) {
                    setSession(sessionData.session)
                    // Update player
                    const updatedPlayer = sessionData.session.players[player?.playerId ?? 0]
                    if (updatedPlayer) setPlayer(updatedPlayer)
                }
            } else if (data.error) {
                setError(data.error)
            }
        } catch {
            setError('Ошибка при выполнении действия')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, activeEvent, player?.playerId, getAuthHeaders])

    // Start session (host only)
    const handleStartSession = useCallback(async () => {
        if (!sessionId) return
        setIsLoading(true)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}/start`, {
                method: 'POST',
                headers,
            })
            const data = await res.json()
            if (data.session) {
                setSession(data.session)
                const updatedPlayer = data.session.players[player?.playerId ?? 0]
                if (updatedPlayer) setPlayer(updatedPlayer)
                setMessage('Session started')
            } else if (data.error) {
                setError(data.error)
            } else {
                setError('Failed to start session')
            }
        } catch {
            setError('Failed to start session')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, player?.playerId, getAuthHeaders])

    const handleCloseEvent = useCallback(() => {
        setActiveEvent(null)
        setPhase('base')
    }, [])

    // Resolve event (datapad UX: return result and keep screen until user closes)
    const handleResolveOptionDatapad = useCallback(async (optionId: string) => {
        if (!sessionId || !activeEvent) return null
        setIsLoading(true)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}/resolve`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ eventId: activeEvent.id, optionId }),
            })
            const data = await res.json()
            if (data.success !== undefined) {
                const result = {
                    success: Boolean(data.success),
                    message: String(data.message || (data.success ? 'Success!' : 'Failed...')),
                }

                setMessage(result.message)

                // Refresh session
                const sessionRes = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}`, { headers })
                const sessionData = await sessionRes.json()
                if (sessionData.session) {
                    setSession(sessionData.session)
                    const updatedPlayer = sessionData.session.players[player?.playerId ?? 0]
                    if (updatedPlayer) setPlayer(updatedPlayer)
                }

                return result
            }
            if (data.error) setError(data.error)
            return null
        } catch {
            setError('Failed to resolve event')
            return null
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, activeEvent, player?.playerId, getAuthHeaders])

    // Transfer to base
    const handleTransfer = useCallback(async (templateId: string, quantity: number) => {
        if (!sessionId) return
        setIsLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}/transfer`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ items: [{ templateId, quantity }] }),
            })
            const data = await res.json()
            if (data.session) {
                setSession(data.session)
                const updatedPlayer = data.session.players[player?.playerId ?? 0]
                if (updatedPlayer) setPlayer(updatedPlayer)
                setMessage(`Сдано ${quantity}x ${templateId}`)
            }
        } catch {
            setError('Ошибка при передаче')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, player?.playerId, getAuthHeaders])

    const handleMoveOnHexMap = useCallback(async (targetHex: { q: number; r: number }) => {
        if (!sessionId) return false
        if (session && session.status !== 'active') {
            setError('Сессия не запущена: попроси хоста нажать START')
            return false
        }
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'src/pages/SurvivalPlayerPage.tsx:handleMoveOnHexMap(pre)',message:'User requested move',data:{sessionId,targetHex,baseMode,clientActiveEventId:activeEvent?.id ?? null,clientHasActiveEvent:Boolean(activeEvent),playerId:player?.playerId ?? null,playerActiveEventId:player?.activeEventId ?? null,playerHasMovementState:Boolean(player?.movementState)},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            const headers = await getAuthHeaders()
            const res = await fetch(`${API_BASE_URL}/survival/sessions/${sessionId}/move`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ targetHex }),
            })
            const data = await res.json()
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'src/pages/SurvivalPlayerPage.tsx:handleMoveOnHexMap(post)',message:'Move response received',data:{sessionId,targetHex,httpStatus:res.status,success:(data as any)?.success ?? null,message:(data as any)?.message ?? null,error:(data as any)?.error ?? null},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            if (data?.success === false) {
                setError(String(data.message || 'Не удалось начать движение'))
                return false
            } else if (data?.success === true) {
                setMessage(String(data.message || 'Движение начато'))
                return true
            } else if (data?.error) {
                setError(String(data.error))
                return false
            }
        } catch {
            setError('Ошибка при движении по карте')
            return false
        }
        return false
    }, [
        activeEvent,
        baseMode,
        getAuthHeaders,
        player?.activeEventId,
        player?.movementState,
        player?.playerId,
        session,
        sessionId,
    ])

    // Handle zone from URL
    useEffect(() => {
        if (zoneParam && sessionId && phase === 'base') {
            handleEnterZone(zoneParam)
        }
    }, [zoneParam, sessionId, phase, handleEnterZone])

    // Clear message after timeout
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 3000)
            return () => clearTimeout(t)
        }
    }, [message])

    // Render based on phase
    if (phase === 'lobby') {
        return (
            <LobbyView
                mode={modeParam}
                onCreateSession={handleCreateSession}
                onJoinSession={handleJoinSession}
                onOpenEditor={() => setPhase('editor')}
                isLoading={isLoading}
                error={error}
            />
        )
    }

    if (phase === 'character_select') {
        return (
            <CharacterSelectView
                onSelectCharacter={handleSelectCharacter}
                isLoading={isLoading}
                error={error}
            />
        )
    }

    if (phase === 'base' && session && player) {
        return (
            <>
                {/* Skip to content link for accessibility */}
                <a
                    href="#main-content"
                    className="fixed top-2 left-2 z-100 -translate-y-[150%] focus:translate-y-0 bg-terminal-green text-black font-bold px-4 py-2 rounded shadow-lg transition-transform"
                >
                    Перейти к контенту
                </a>
                <ModeSwitcher
                    mode={baseMode}
                    onChange={setBaseMode}
                    showStart={session.status === 'lobby'}
                    canStart={player.playerId === session.hostPlayerId && !isLoading}
                    onStart={handleStartSession}
                />
                {error && (
                    <div className="fixed top-4 left-4 right-4 bg-red-900/60 border border-red-500 rounded-lg p-3 text-red-100 text-center z-50">
                        {error}
                    </div>
                )}
                {baseMode !== 'datapad' && message && (
                    <div className="fixed top-4 left-4 right-4 bg-emerald-900/90 border border-emerald-500 rounded-lg p-3 text-emerald-200 text-center z-50">
                        {message}
                    </div>
                )}
                <main id="main-content" tabIndex={-1} className="outline-none">
                    {baseMode === 'bunker' ? (
                        <SurvivalBunkerDashboard session={session} />
                    ) : baseMode === 'map' ? (
                        <div className="min-h-screen bg-black text-white flex items-center justify-center">SCHEMATIC VIEW PLACEHOLDER</div>
                    ) : baseMode === 'hexmap' ? (
                        <div className="relative">
                            <SurvivalMapbox
                                initialMap={hexInitialMap}
                                serverPlayerHexPos={player.hexPos ?? { q: 0, r: 0 }}
                                serverStamina={player.stamina ?? null}
                                serverMaxStamina={player.maxStamina ?? null}
                                serverIsMoving={Boolean(player.movementState)}
                                serverMovementState={player.movementState ?? null}
                                serverWorldTimeMs={session.worldTimeMs}
                                serverTimeScale={session.timeConfig?.timeScale}
                                onMoveRequest={handleMoveOnHexMap}
                            />

                            {/* Important: hex movement can create a blocking activeEvent on arrival.
                               In hexmap mode we must still show a way to resolve it, otherwise player is stuck. */}
                            {activeEvent ? (
                                <div className="fixed inset-0 z-60">
                                    <EventCard
                                        event={activeEvent}
                                        playerRole={player.role}
                                        playerInventory={player.inventory.items}
                                        onSelectOption={handleResolveOption}
                                        isLoading={isLoading}
                                    />
                                </div>
                            ) : null}
                        </div>
                    ) : baseMode === 'datapad' ? (
                        <SurvivalDatapad
                            session={session}
                            player={player}
                            activeEvent={activeEvent}
                            isLoading={isLoading}
                            error={error}
                            message={message}
                            onEnterZone={handleEnterZone}
                            onResolveOption={handleResolveOptionDatapad}
                            onTransferToBase={handleTransfer}
                            onStartSession={handleStartSession}
                            onCloseEvent={handleCloseEvent}
                        />
                    ) : activeEvent ? (
                        <EventCard
                            event={activeEvent}
                            playerRole={player.role}
                            playerInventory={player.inventory.items}
                            onSelectOption={handleResolveOption}
                            isLoading={isLoading}
                        />
                    ) : (
                        <BaseView
                            session={session}
                            player={player}
                            onEnterZone={handleEnterZone}
                            onTransfer={handleTransfer}
                            isLoading={isLoading}
                        />
                    )}
                </main>
            </>
        )
    }

    // Editor Phase
    if (phase === 'editor') {
        return <SurvivalMapEditor onExit={() => setPhase('lobby')} />
    }

    // Fallback
    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Загрузка...</p>
            </div>
        </div>
    )
}
