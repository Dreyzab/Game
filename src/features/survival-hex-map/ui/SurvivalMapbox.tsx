import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { generateMap } from '../services/mapGenerator'
import { getHexDistance, getPath, hexToString } from '../utils/hexMath'
import { DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS, getMapBounds, hexToGeo, mapToGeoJSON } from '../utils/geoMath'
import { HUD } from './components/HUD'
import { STAMINA_COST_PER_HEX } from '@/shared/data/survivalConfig.ts'
import { createLayerManager } from '@/shared/lib/mapbox'
import { HexTooltip } from './components/HexTooltip'
import { BiomeLegend } from './components/BiomeLegend'
import { ScreenReaderAnnouncer } from '@/shared/ui/components/ScreenReaderAnnouncer'
import type { BiomeType, GameState, HexCell, HexCoordinate } from '../types'

// Mapbox access token - should be set in environment
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const MAP_RADIUS = 14 // ~1km diameter at 25m hex size
const BASE_ZOOM = 16
const INITIAL_AP = 5
const VIEW_RADIUS = 2
const BIOME_IMAGE_SIZE = 926
const BIOME_IMAGE_SCALE = 1.89
const BIOME_ICON_SIZE_SCALE = 1.68

// Biome color mapping
const BIOME_COLORS: Record<BiomeType, string> = {
    BUNKER: '#4a4a4a',
    WASTELAND: '#8b7355',
    FOREST: '#228b22',
    URBAN: '#696969',
    INDUSTRIAL: '#708090',
    WATER: '#4169e1',
    HOSPITAL: '#ff6b6b',
    POLICE: '#4682b4',
    RIVER: '#1e90ff',
    FACTORY: '#a0522d',
    CITY_HIGH: '#2f4f4f',
    ADMIN: '#daa520',
    SKYSCRAPER: '#1c1c1c',
    FIRE_STATION: '#dc143c',
    MALL: '#ff69b4',
    RAILWAY_DEPOT: '#8b4513',
    BUILDING_LOW: '#808080',
    PARKING_LOW: '#a9a9a9',
    WAREHOUSE: '#d2691e',
    GAS_STATION: '#ffa500',
    SCAVENGER_CAMP: '#556b2f',
    ARMY_BASE: '#006400',
    AIRPORT: '#c0c0c0',
    ROAD_HIGH: '#3c3c3c',
    ROAD_LOW: '#5a5a5a',
    ROAD_CITY: '#2e2e2e',
    ROAD_FOREST: '#3d5c3d',
}

// Key biomes that display pattern images (special locations)
const KEY_BIOMES_WITH_ICONS: string[] = [
    'BUNKER',
    'HOSPITAL',
    'POLICE',
    'FACTORY',
    'CITY_HIGH',
    'ADMIN',
    'SKYSCRAPER',
    'FIRE_STATION',
    'MALL',
    'RAILWAY_DEPOT',
    'BUILDING_LOW',
    'PARKING_LOW',
    'WAREHOUSE',
    'GAS_STATION',
    'SCAVENGER_CAMP',
    'ARMY_BASE',
    'AIRPORT',
]

const createHexMaskedImage = (image: HTMLImageElement | ImageBitmap | ImageData, size: number, scale: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    const center = size / 2
    const radius = size / 2

    ctx.save()
    ctx.beginPath()
    for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 180) * (60 * i - 90)
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.clip()

    const targetSize = size * scale
    let source: CanvasImageSource
    let imageWidth = 0
    let imageHeight = 0

    if (image instanceof ImageData) {
        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = image.width
        sourceCanvas.height = image.height
        const sourceCtx = sourceCanvas.getContext('2d')
        sourceCtx?.putImageData(image, 0, 0)
        source = sourceCanvas
        imageWidth = image.width
        imageHeight = image.height
    } else if (image instanceof HTMLImageElement) {
        source = image
        imageWidth = image.naturalWidth || image.width
        imageHeight = image.naturalHeight || image.height
    } else {
        source = image
        imageWidth = image.width
        imageHeight = image.height
    }
    const imageAspect = imageWidth / imageHeight

    let drawWidth = targetSize
    let drawHeight = targetSize

    if (imageAspect > 1) {
        drawWidth = targetSize * imageAspect
    } else {
        drawHeight = targetSize / imageAspect
    }

    const dx = (size - drawWidth) / 2
    const dy = (size - drawHeight) / 2

    ctx.drawImage(source, dx, dy, drawWidth, drawHeight)
    ctx.restore()

    return ctx.getImageData(0, 0, size, size)
}

const createFogPatternImage = (size: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) return null

    // Fully opaque base so Mapbox stays hidden underneath
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, size, size)

    // Cloudy blobs
    for (let i = 0; i < 80; i += 1) {
        const x = Math.random() * size
        const y = Math.random() * size
        const r = (size * 0.08) + Math.random() * (size * 0.18)
        const a = 0.05 + Math.random() * 0.12
        ctx.fillStyle = `rgba(40, 40, 40, ${a})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
    }

    // Soft blur pass
    ctx.globalAlpha = 0.9
    ctx.filter = 'blur(6px)'
    ctx.drawImage(canvas, 0, 0)
    ctx.filter = 'none'
    ctx.globalAlpha = 1

    // Subtle grain (still opaque)
    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
        const n = Math.floor(Math.random() * 14) // 0..13
        data[i] = Math.min(255, data[i] + n)
        data[i + 1] = Math.min(255, data[i + 1] + n)
        data[i + 2] = Math.min(255, data[i + 2] + n)
        data[i + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)

    return ctx.getImageData(0, 0, size, size)
}

interface SurvivalMapboxProps {
    initialMap?: HexCell[]
    persistenceKey?: string
    /** Server-authoritative player hex position (overrides local position) */
    serverPlayerHexPos?: { q: number; r: number } | null
    /** Server-authoritative stamina (movement resource) */
    serverStamina?: number | null
    /** Server-authoritative max stamina */
    serverMaxStamina?: number | null
    /** Callback when player clicks to move (sends to server instead of local) */
    onMoveRequest?: (targetHex: { q: number; r: number }) => Promise<boolean> | boolean
    /** If true, movement is in progress on server */
    serverIsMoving?: boolean
    /** Server movement state (path + ETA in lore ms) */
    serverMovementState?: {
        path: Array<{ q: number; r: number }>
        startedAtWorldTimeMs?: number
        msPerHex?: number
        arriveAtWorldTimeMs: number
    } | null
    /** Server-authoritative world time (lore ms) */
    serverWorldTimeMs?: number
    /** Server time scale (lore_ms per real_ms) for smooth ETA between WS ticks */
    serverTimeScale?: number
    /** Custom map center [lng, lat] from session config (defaults to Freiburg) */
    mapCenter?: [number, number]
}

export interface SurvivalMapboxRef {
    flyTo: (options: any) => void
    fitBounds: (bounds: any, options?: any) => void
}

type PersistedGameStateV1 = {
    version: 1
    map: HexCell[]
    player: GameState['player']
    revealedHexes: string[]
    turn: number
}

const PERSISTENCE_VERSION = 1

function loadPersistedGameState(persistenceKey: string): GameState | null {
    try {
        const raw = localStorage.getItem(persistenceKey)
        if (!raw) return null

        const parsed: unknown = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return null

        const data = parsed as Partial<PersistedGameStateV1>

        if (data.version !== PERSISTENCE_VERSION) return null
        if (!Array.isArray(data.map) || !data.player || typeof data.turn !== 'number' || !Array.isArray(data.revealedHexes)) {
            return null
        }

        const revealedHexes = new Set(data.revealedHexes.filter((v): v is string => typeof v === 'string'))

        return {
            map: data.map,
            player: data.player,
            revealedHexes,
            turn: data.turn,
        }
    } catch (e) {
        console.warn('[SurvivalMapbox] Failed to load persisted state', e)
        return null
    }
}

function persistGameState(persistenceKey: string, state: GameState): void {
    try {
        const payload: PersistedGameStateV1 = {
            version: PERSISTENCE_VERSION,
            map: state.map,
            player: state.player,
            revealedHexes: Array.from(state.revealedHexes),
            turn: state.turn,
        }
        localStorage.setItem(persistenceKey, JSON.stringify(payload))
    } catch (e) {
        console.warn('[SurvivalMapbox] Failed to persist state', e)
    }
}

export const SurvivalMapbox = forwardRef<SurvivalMapboxRef, SurvivalMapboxProps>(({
    initialMap: providedMap,
    persistenceKey,
    serverPlayerHexPos,
    serverStamina,
    serverMaxStamina,
    onMoveRequest,
    serverIsMoving,
    serverMovementState,
    serverWorldTimeMs,
    serverTimeScale,
    mapCenter,
}: SurvivalMapboxProps = {}, ref) => {
    // Effective center: use prop or default
    const effectiveCenter = mapCenter ?? DEFAULT_MAP_CENTER
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [containerReady, setContainerReady] = useState(false)

    const [gameState, setGameState] = useState<GameState | null>(null)
    const [selectedHex, setSelectedHex] = useState<HexCoordinate | null>(null)
    const [isMoving, setIsMoving] = useState(false)
    const [mapError, setMapError] = useState<string | null>(null)
    const [hoveredHex, setHoveredHex] = useState<{ hex: HexCell; pos: { x: number; y: number } } | null>(null)
    const [announcement, setAnnouncement] = useState<string | null>(null)
    const useServerMovement = Boolean(onMoveRequest)

    // Animation refs
    const playerVisualPos = useRef<[number, number] | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const serverWalkFrameRef = useRef<number | null>(null)
    const routePulseFrameRef = useRef<number | null>(null)
    const serverTimeSyncRef = useRef<{ worldTimeMs: number; perfMs: number; timeScale: number } | null>(null)
    const [serverEtaSeconds, setServerEtaSeconds] = useState<number | null>(null)

    useImperativeHandle(ref, () => ({
        flyTo: (options: any) => {
            if (map.current) {
                map.current.flyTo(options)
            }
        },
        fitBounds: (bounds: any, options?: any) => {
            if (map.current) {
                map.current.fitBounds(bounds, options)
            }
        }
    }))

    const debugRef = useRef<{
        mapInitRuns: number
        mapRemovedRuns: number
        walkEffectRuns: number
        walkEffectLastAt: number
        layersEffectRuns: number
        layersEffectLastAt: number
        nonFatalMapErrors: number
        nonFatalLastAt: number
    }>({
        mapInitRuns: 0,
        mapRemovedRuns: 0,
        walkEffectRuns: 0,
        walkEffectLastAt: 0,
        layersEffectRuns: 0,
        layersEffectLastAt: 0,
        nonFatalMapErrors: 0,
        nonFatalLastAt: 0,
    })

    // Callback ref to detect when container is mounted
    const setMapContainerRef = (node: HTMLDivElement | null) => {
        mapContainer.current = node
        if (node && !containerReady) {
            console.log('[SurvivalMapbox] Container ref set!')
            setContainerReady(true)
        }
    }

    // Initialize game state
    // IMPORTANT: do NOT depend on `onMoveRequest` function identity or server position,
    // otherwise the map state can be reset on every WS update (visible as "flicker").
    useEffect(() => {
        if (gameState) return

        const serverMode = useServerMovement || Boolean(serverPlayerHexPos)

        if (!serverMode && persistenceKey) {
            const persisted = loadPersistedGameState(persistenceKey)
            if (persisted) {
                setGameState(persisted)
                return
            }
        }

        let initialMap = providedMap

        if (!serverMode && !initialMap) {
            try {
                const savedCustomMap = localStorage.getItem('survival_custom_map')
                if (savedCustomMap) {
                    initialMap = JSON.parse(savedCustomMap)
                }
            } catch (e) {
                console.warn('Failed to load custom map', e)
            }
        }

        if (!initialMap) {
            initialMap = generateMap(MAP_RADIUS)
        }

        const origin = serverPlayerHexPos ?? { q: 0, r: 0 }
        const revealed: string[] = []
        initialMap.forEach((hex) => {
            if (getHexDistance(origin, hex) <= VIEW_RADIUS) {
                revealed.push(`${hex.q},${hex.r}`)
            }
        })

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'flicker-post-fix', hypothesisId: 'F1', location: 'SurvivalMapbox.tsx:initGameState(useEffect)', message: 'Initialized gameState once', data: { serverMode, origin, revealedCount: revealed.length }, timestamp: Date.now() }) }).catch(() => { });
        // #endregion

        setGameState({
            map: initialMap,
            player: {
                position: origin,
                ap: INITIAL_AP,
                maxAp: 10,
                health: 100,
                maxHealth: 100,
                inventory: [],
            },
            revealedHexes: new Set(revealed),
            turn: 1,
        })
    }, [gameState, providedMap, persistenceKey, useServerMovement, serverPlayerHexPos])

    // Persist game state (per-session/per-player) when enabled
    useEffect(() => {
        const serverMode = Boolean(serverPlayerHexPos || onMoveRequest)
        if (serverMode) return
        if (!persistenceKey || !gameState) return
        persistGameState(persistenceKey, gameState)
    }, [persistenceKey, gameState, serverPlayerHexPos, onMoveRequest])

    // Sync local player position from server state (when server-authoritative)
    useEffect(() => {
        if (!serverPlayerHexPos || !gameState) return

        const currentPos = gameState.player.position
        if (currentPos.q === serverPlayerHexPos.q && currentPos.r === serverPlayerHexPos.r) {
            return // Already in sync
        }

        setGameState(prev => {
            if (!prev) return prev
            const newRevealed = new Set(prev.revealedHexes)
            prev.map.forEach((h) => {
                if (getHexDistance(serverPlayerHexPos, h) <= VIEW_RADIUS) {
                    newRevealed.add(`${h.q},${h.r}`)
                }
            })
            return {
                ...prev,
                player: {
                    ...prev.player,
                    position: { q: serverPlayerHexPos.q, r: serverPlayerHexPos.r }
                },
                revealedHexes: newRevealed,
            }
        })
    }, [serverPlayerHexPos, gameState])

    // Sync movement state from server
    useEffect(() => {
        if (serverIsMoving !== undefined) {
            setIsMoving(serverIsMoving)
        }
    }, [serverIsMoving])

    // Keep a sync point to estimate server world time between WS updates
    useEffect(() => {
        if (typeof serverWorldTimeMs !== 'number') return
        const timeScale = (typeof serverTimeScale === 'number' && Number.isFinite(serverTimeScale)) ? serverTimeScale : 120
        serverTimeSyncRef.current = { worldTimeMs: serverWorldTimeMs, perfMs: performance.now(), timeScale }
    }, [serverWorldTimeMs, serverTimeScale])

    const estimateServerWorldTimeMs = useCallback((): number | null => {
        const sync = serverTimeSyncRef.current
        if (!sync) return typeof serverWorldTimeMs === 'number' ? serverWorldTimeMs : null
        const elapsedRealMs = Math.max(0, performance.now() - sync.perfMs)
        return sync.worldTimeMs + elapsedRealMs * sync.timeScale
    }, [serverWorldTimeMs])

    // Initialize Mapbox - only once when container is ready
    useEffect(() => {
        // Skip if no container or map already exists
        if (!mapContainer.current || map.current) return
        const dbg = debugRef.current
        dbg.mapInitRuns += 1
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'flicker-pre-fix', hypothesisId: 'F1', location: 'SurvivalMapbox.tsx:initMapbox(useEffect)', message: 'Mapbox init useEffect entered', data: { containerReady, alreadyHasMap: Boolean(map.current), mapInitRuns: dbg.mapInitRuns }, timestamp: Date.now() }) }).catch(() => { });
        // #endregion

        console.log('[SurvivalMapbox] Initializing Mapbox...')
        console.log('[SurvivalMapbox] Token present:', !!mapboxgl.accessToken)
        console.log('[SurvivalMapbox] Container:', mapContainer.current)

        try {
            const newMap = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: effectiveCenter,
                zoom: BASE_ZOOM,
                pitch: 0,
                bearing: 0,
            })

            newMap.on('load', () => {
                console.log('[SurvivalMapbox] Map loaded successfully!')
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: 'debug-session',
                        runId: 'mapbox-pre-fix',
                        hypothesisId: 'M1',
                        location: 'SurvivalMapbox.tsx:newMap.on(load)',
                        message: 'Mapbox load; registering styleimagemissing handler',
                        data: {},
                        timestamp: Date.now(),
                    }),
                }).catch(() => { })
                // #endregion

                // Provide placeholder images synchronously when Mapbox requests missing biome icons
                newMap.on('styleimagemissing', (e: any) => {
                    const id = String(e?.id ?? '')
                    if (!id.startsWith('biome_')) return
                    if (newMap.hasImage(id)) return

                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: 'debug-session',
                            runId: 'mapbox-pre-fix',
                            hypothesisId: 'M1',
                            location: 'SurvivalMapbox.tsx:styleimagemissing',
                            message: 'styleimagemissing for biome icon; adding placeholder',
                            data: { id },
                            timestamp: Date.now(),
                        }),
                    }).catch(() => { })
                    // #endregion

                    const c = document.createElement('canvas')
                    c.width = 1
                    c.height = 1
                    const ctx = c.getContext('2d')
                    if (ctx) ctx.clearRect(0, 0, 1, 1)
                    try {
                        newMap.addImage(id, c as any)
                    } catch {
                        // ignore
                    }
                })

                setMapLoaded(true)
            })

            newMap.on('error', (e) => {
                // Filter for fatal errors only (style/auth issues)
                const status = (e.error as { status?: number })?.status
                const message = e.error?.message || ''
                if (status === 401 || status === 403 || message.includes('style')) {
                    setMapError(message || 'Map loading error')
                } else {
                    console.warn('[SurvivalMapbox] Non-fatal error:', e.error)
                    const now = Date.now()
                    const last = debugRef.current.nonFatalLastAt
                    debugRef.current.nonFatalMapErrors += 1
                    debugRef.current.nonFatalLastAt = now
                    // Log only if errors are frequent (potential flicker cause)
                    if (now - last < 1000 || debugRef.current.nonFatalMapErrors <= 3) {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'flicker-pre-fix', hypothesisId: 'F3', location: 'SurvivalMapbox.tsx:newMap.on(error)', message: 'Mapbox non-fatal error event', data: { status: status ?? null, message: message || null, nonFatalCount: debugRef.current.nonFatalMapErrors, deltaMs: now - last }, timestamp: Date.now() }) }).catch(() => { });
                        // #endregion
                    }
                }
            })

            map.current = newMap
        } catch (error) {
            console.error('[SurvivalMapbox] Failed to initialize map:', error)
        }

        return () => {
            if (map.current) {
                dbg.mapRemovedRuns += 1
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'flicker-pre-fix', hypothesisId: 'F1', location: 'SurvivalMapbox.tsx:initMapbox(cleanup)', message: 'Mapbox cleanup removing map', data: { mapRemovedRuns: dbg.mapRemovedRuns }, timestamp: Date.now() }) }).catch(() => { });
                // #endregion
                map.current.remove()
                map.current = null
                setMapLoaded(false)
            }
        }
    }, [containerReady])

    // GeoJSON data for the hex grid
    const hexGeoJSON = useMemo(() => {
        if (!gameState) return null
        return mapToGeoJSON(gameState.map, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
    }, [gameState])

    // GeoJSON for hex centers (biome icons)
    const hexCentersGeoJSON = useMemo(() => {
        if (!gameState) return null

        const centerFeatures: GeoJSON.Feature<GeoJSON.Point>[] = gameState.map
            .filter(cell => KEY_BIOMES_WITH_ICONS.includes(cell.biome))
            .map(cell => ({
                type: 'Feature',
                properties: {
                    biome: cell.biome,
                    hexId: `${cell.q},${cell.r}`
                },
                geometry: {
                    type: 'Point',
                    coordinates: hexToGeo(cell.q, cell.r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
                }
            }))

        return { type: 'FeatureCollection', features: centerFeatures } as const
    }, [gameState])

    // Memoize Map for O(1) lookup and pathfinding
    const hexMap = useMemo(() => {
        if (!gameState) return new Map<string, HexCell>()
        return new Map(gameState.map.map(h => [hexToString(h), h]))
    }, [gameState])

    // Visible hexes set
    const visibleHexes = useMemo(() => {
        if (!gameState) return new Set<string>()
        const visible = new Set<string>()
        gameState.map.forEach((hex) => {
            if (getHexDistance(gameState.player.position, hex) <= VIEW_RADIUS) {
                visible.add(hexToString(hex))
            }
        })
        return visible
    }, [gameState])

    // Path from player to selected hex
    const currentPath = useMemo(() => {
        if (!gameState || !selectedHex) return []
        return getPath(gameState.player.position, selectedHex, hexMap)
    }, [gameState, selectedHex, hexMap])

    const pathSet = useMemo(() => new Set(currentPath.map(hexToString)), [currentPath])

    const movementStats = useMemo(() => {
        if (!gameState || !selectedHex) return null
        const distance = getHexDistance(gameState.player.position, selectedHex)
        const isSameHex = distance === 0
        const hasPath = currentPath.length > 0
        const costPerHex = useServerMovement ? STAMINA_COST_PER_HEX : 1
        const moveCost = hasPath ? Math.max(0, currentPath.length - 1) * costPerHex : 0
        return {
            distance,
            moveCost,
            isReachable: hasPath && !isSameHex,
            moveCostUnit: useServerMovement ? 'STAMINA' : 'AP',
        }
    }, [gameState, selectedHex, currentPath, useServerMovement])

    const movementPool = useMemo(() => {
        if (!gameState) return undefined
        if (useServerMovement) {
            const current = typeof serverStamina === 'number' ? serverStamina : 0
            const max = typeof serverMaxStamina === 'number' ? serverMaxStamina : 0
            return { current, max, label: 'STAMINA' }
        }
        return { current: gameState.player.ap, max: gameState.player.maxAp, label: 'ACTION_PTS' }
    }, [gameState, useServerMovement, serverStamina, serverMaxStamina])

    // Add hex grid source and layers - only once when map and data are ready
    const layersInitialized = useRef(false)

    useEffect(() => {
        if (!map.current || !mapLoaded || !hexGeoJSON || !gameState) return
        if (layersInitialized.current) return // Already initialized

        const m = map.current

        // Create LayerManager for automatic z-ordering
        const layers = createLayerManager(m)

        // Add GeoJSON source
        m.addSource('hexgrid', {
            type: 'geojson',
            data: hexGeoJSON,
            generateId: true,
        })

        // Build biome color expression
        const biomeColorExpr: mapboxgl.Expression = [
            'match',
            ['get', 'biome'],
            ...Object.entries(BIOME_COLORS).flatMap(([biome, color]) => [biome, color]),
            '#555555', // default
        ]

        // Invisible fill layer for hover/click hit-testing (filter is set dynamically)
        layers.add('HEX_INTERACTION', {
            type: 'fill',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'], // Initially matches nothing; updated dynamically
            paint: {
                'fill-color': '#000000',
                'fill-opacity': 0.001,
            },
        })

        // Biome fill layer (shown only for explored-but-not-visible hexes via dynamic filter)
        layers.add('HEX_FILL', {
            type: 'fill',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'], // Initially matches nothing; updated dynamically
            paint: {
                'fill-color': biomeColorExpr,
                'fill-opacity': 0.5,
            },
        })

        // Load key biome images for symbol layer
        const biomeImageExpr: (string | string[])[] = [
            'match',
            ['get', 'biome'],
        ]
        for (const biome of KEY_BIOMES_WITH_ICONS) {
            const imgId = `biome_${biome}`
            const imgUrl = `/images/hexagon/biome_${biome.toLowerCase()}.png`
            biomeImageExpr.push(biome, imgId)
            if (!m.hasImage(imgId)) {
                m.loadImage(imgUrl, (error, image) => {
                    if (error || !image) {
                        // Avoid Mapbox "styleimagemissing" spam by registering a transparent placeholder
                        console.warn(`[SurvivalMapbox] Failed to load biome image: ${biome} -> using placeholder`, error)
                        if (!m.hasImage(imgId)) {
                            const c = document.createElement('canvas')
                            c.width = 1
                            c.height = 1
                            const ctx = c.getContext('2d')
                            if (ctx) ctx.clearRect(0, 0, 1, 1)
                            try {
                                m.addImage(imgId, c as any)
                            } catch {
                                // ignore duplicate add or map disposal
                            }
                        }
                        return
                    }
                    if (!m.hasImage(imgId)) {
                        const masked = createHexMaskedImage(image, BIOME_IMAGE_SIZE, BIOME_IMAGE_SCALE)
                        m.addImage(imgId, masked || image)
                    }
                })
            }
        }
        biomeImageExpr.push('') // default: no image

        // Create hex-centers Point source for biome icons
        m.addSource('hex-centers', {
            type: 'geojson',
            data: hexCentersGeoJSON ?? { type: 'FeatureCollection', features: [] }
        })

        // Calculate icon size to fit hex diameter at base zoom
        // hexDiameter in meters = GEO_HEX_SIZE_METERS * 2 (point-to-point)
        // metersPerPixel at zoom Z = 156543.03392 * cos(lat) / 2^Z
        const metersPerPixelAtBase = (156543.03392 * Math.cos((DEFAULT_MAP_CENTER[1] * Math.PI) / 180)) / Math.pow(2, BASE_ZOOM)
        const hexDiameterMeters = GEO_HEX_SIZE_METERS * 2
        const hexDiameterPixels = hexDiameterMeters / metersPerPixelAtBase
        const iconBaseSize = Math.min(1, Math.max(0.01, hexDiameterPixels / BIOME_IMAGE_SIZE))
        const iconSize = iconBaseSize * BIOME_ICON_SIZE_SCALE
        const iconSizeExpr: mapboxgl.Expression = [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            BASE_ZOOM - 2, iconSize / 4,
            BASE_ZOOM - 1, iconSize / 2,
            BASE_ZOOM, iconSize,
            BASE_ZOOM + 1, iconSize * 2,
            BASE_ZOOM + 2, iconSize * 4,
        ]

        // Symbol layer for biome icons - LayerManager handles z-order automatically
        layers.add('HEX_BIOME_ICONS', {
            type: 'symbol',
            source: 'hex-centers',
            filter: ['==', ['get', 'hexId'], '__none__'], // Initially empty; updated dynamically
            layout: {
                'icon-image': biomeImageExpr as mapboxgl.Expression,
                'icon-size': iconSizeExpr,
                'icon-anchor': 'center',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-rotation-alignment': 'map',
                'icon-pitch-alignment': 'map',
            },
            paint: {
                'icon-opacity': 1,
            }
        })

        // Border layer
        layers.add('HEX_BORDER', {
            type: 'line',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'], // Initially matches nothing; updated dynamically
            paint: {
                'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    '#ffffff',
                    '#00ff41',
                ],
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    2,
                    1,
                ],
                'line-opacity': 0.7,
            },
        })

        // Path highlight layer (initially empty filter)
        layers.add('HEX_PATH', {
            type: 'line',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'], // Initially matches nothing
            paint: {
                'line-color': '#00ffff',
                'line-width': 3,
            },
        })

        // Selected hex highlight layer (initially empty filter)
        layers.add('HEX_SELECTED', {
            type: 'line',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'], // Initially matches nothing
            paint: {
                'line-color': '#ffff00',
                'line-width': 3,
            },
        })

        // Add player marker source and layer
        const playerHex = gameState.player.position
        const playerCenter = hexToGeo(playerHex.q, playerHex.r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
        const playerInitData: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'Point', coordinates: playerCenter },
                },
            ],
        }

        // Fog of war layers - LayerManager handles z-order automatically
        const fogPatternId = 'fog_unexplored_pattern'
        let hasFogPattern = m.hasImage(fogPatternId)
        if (!hasFogPattern) {
            const fogImg = createFogPatternImage(128)
            if (fogImg) {
                m.addImage(fogPatternId, fogImg)
                hasFogPattern = true
            }
        }

        layers.add('FOG_EXPLORED', {
            type: 'fill',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'],
            paint: {
                'fill-color': '#000000', // Dark overlay for explored but not visible
                'fill-opacity': 0.15,
            },
        })

        layers.add('FOG_UNEXPLORED', {
            type: 'fill',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'],
            paint: {
                ...(hasFogPattern
                    ? { 'fill-pattern': fogPatternId, 'fill-opacity': 1 }
                    : { 'fill-color': '#000000', 'fill-opacity': 0.95 }),
            },
        })

        // Bunker marker - add pulsing glow effect at center hex (0,0)
        const bunkerCenter = hexToGeo(0, 0, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
        m.addSource('bunker', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: { type: 'Point', coordinates: bunkerCenter },
                    },
                ],
            },
        })

        // Outer glow layer (purple)
        layers.add('BUNKER_GLOW_OUTER', {
            type: 'circle',
            source: 'bunker',
            paint: {
                'circle-radius': 30,
                'circle-color': '#8b5cf6', // purple
                'circle-opacity': 0.3,
                'circle-blur': 1,
            },
        })

        // Inner glow layer (green)
        layers.add('BUNKER_GLOW_INNER', {
            type: 'circle',
            source: 'bunker',
            paint: {
                'circle-radius': 18,
                'circle-color': '#22c55e', // green
                'circle-opacity': 0.5,
                'circle-blur': 0.5,
            },
        })

        // Core marker
        layers.add('BUNKER_MARKER', {
            type: 'circle',
            source: 'bunker',
            paint: {
                'circle-radius': 10,
                'circle-color': '#00ff41',
                'circle-stroke-color': '#a855f7', // purple border
                'circle-stroke-width': 3,
            },
        })

        // Player marker source and layer (on top of everything)
        m.addSource('player', {
            type: 'geojson',
            data: playerInitData,
        })

        // Movement path sources (server-authoritative walk visualization)
        const emptyLineCollection: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
        // lineMetrics is required for line-gradient animation via ['line-progress'].
        m.addSource('movement-path', { type: 'geojson', data: emptyLineCollection, lineMetrics: true } as any)
        m.addSource('movement-segment', { type: 'geojson', data: emptyLineCollection })

        // Player pulsing glow (outer)
        layers.add('PLAYER_GLOW', {
            type: 'circle',
            source: 'player',
            paint: {
                'circle-radius': 16,
                'circle-color': '#00ff41',
                'circle-opacity': 0.4,
                'circle-blur': 1,
            },
        })

        layers.add('PLAYER_MARKER', {
            type: 'circle',
            source: 'player',
            paint: {
                'circle-radius': 10,
                'circle-color': '#00ff41',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 3,
            },
        })

            // Full movement route (subtle) + active segment (bright)
            ; (layers as any).add('PLAYER_ROUTE_GLOW', {
                type: 'line',
                source: 'movement-path',
                paint: {
                    'line-color': '#00ffff',
                    'line-width': 8,
                    'line-opacity': 0.10,
                    'line-blur': 2,
                },
            })

            ; (layers as any).add('PLAYER_ROUTE', {
                type: 'line',
                source: 'movement-path',
                paint: {
                    'line-color': '#00ffff',
                    'line-width': 2,
                    'line-opacity': 0.25,
                },
            })

            ; (layers as any).add('PLAYER_ROUTE_ACTIVE_GLOW', {
                type: 'line',
                source: 'movement-segment',
                paint: {
                    'line-color': '#00ffff',
                    'line-width': 12,
                    'line-opacity': 0.18,
                    'line-blur': 3,
                },
            })

            ; (layers as any).add('PLAYER_ROUTE_ACTIVE', {
                type: 'line',
                source: 'movement-segment',
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 4,
                    'line-opacity': 0.9,
                },
            })

        // Fit bounds to hex grid on first load
        const bounds = getMapBounds(gameState.map, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
        m.fitBounds(bounds, { padding: 50, maxZoom: 17 })

        layersInitialized.current = true
    }, [mapLoaded, hexGeoJSON, hexCentersGeoJSON, gameState])

    // Update GeoJSON sources if map changes after initial mount
    useEffect(() => {
        if (!map.current || !mapLoaded || !layersInitialized.current || !hexGeoJSON) return
        const m = map.current
        const source = m.getSource('hexgrid') as mapboxgl.GeoJSONSource | undefined
        source?.setData(hexGeoJSON)
    }, [mapLoaded, hexGeoJSON])

    useEffect(() => {
        if (!map.current || !mapLoaded || !layersInitialized.current || !hexCentersGeoJSON) return
        const m = map.current
        const source = m.getSource('hex-centers') as mapboxgl.GeoJSONSource | undefined
        source?.setData(hexCentersGeoJSON)
    }, [mapLoaded, hexCentersGeoJSON])

    // Player Animation Effect
    useEffect(() => {
        if (!map.current || !mapLoaded || !gameState) return
        // If server movement animation is active, don't run local position tween.
        if (serverMovementState && serverMovementState.path?.length) return
        const m = map.current

        const { q, r } = gameState.player.position
        const targetGeo = hexToGeo(q, r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)

        // Initialize visual position if missing
        if (!playerVisualPos.current) {
            playerVisualPos.current = targetGeo
        }

        const startPos = playerVisualPos.current
        const startTime = performance.now()
        const DURATION = 300 // ms

        // If distance is very small (initial load), skip animation
        const dist = Math.sqrt(
            Math.pow(targetGeo[0] - startPos[0], 2) +
            Math.pow(targetGeo[1] - startPos[1], 2)
        )

        if (dist < 0.000001) {
            const source = m.getSource('player') as mapboxgl.GeoJSONSource | undefined
            source?.setData({
                type: 'FeatureCollection',
                features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: targetGeo } }]
            })
            return
        }

        // Animation loop
        const animate = (time: number) => {
            const elapsed = time - startTime
            const progress = Math.min(elapsed / DURATION, 1)

            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3)

            const currentLng = startPos[0] + (targetGeo[0] - startPos[0]) * ease
            const currentLat = startPos[1] + (targetGeo[1] - startPos[1]) * ease
            const currentPos: [number, number] = [currentLng, currentLat]

            playerVisualPos.current = currentPos

            const source = m.getSource('player') as mapboxgl.GeoJSONSource | undefined
            source?.setData({
                type: 'FeatureCollection',
                features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: currentPos } }]
            })

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate)
            } else {
                playerVisualPos.current = targetGeo
            }
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [mapLoaded, gameState, serverMovementState])

    // Server-authoritative walking animation (step-by-step between hex centers)
    useEffect(() => {
        if (!map.current || !mapLoaded || !gameState) return
        const m = map.current

        const msPerHex = (serverMovementState?.msPerHex && Number.isFinite(serverMovementState.msPerHex))
            ? serverMovementState.msPerHex
            : 30 * 60 * 1000

        const path = serverMovementState?.path ?? null
        {
            const now = Date.now()
            const prev = debugRef.current.walkEffectLastAt
            debugRef.current.walkEffectRuns += 1
            debugRef.current.walkEffectLastAt = now
            // Log if this effect is thrashing (runs too often)
            if (prev && now - prev < 500) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'flicker-pre-fix', hypothesisId: 'F2', location: 'SurvivalMapbox.tsx:serverWalkEffect(entry)', message: 'Server-walk effect reran quickly (possible flicker)', data: { deltaMs: now - prev, walkEffectRuns: debugRef.current.walkEffectRuns, hasPath: Boolean(path && path.length >= 2), mapLoaded }, timestamp: Date.now() }) }).catch(() => { });
                // #endregion
            }
        }
        if (!path || path.length < 2) {
            // No active movement; keep ETA cleared and stop animation loop.
            if (serverWalkFrameRef.current) cancelAnimationFrame(serverWalkFrameRef.current)
            serverWalkFrameRef.current = null
            setServerEtaSeconds(null)

            const routeSource = m.getSource('movement-path') as mapboxgl.GeoJSONSource | undefined
            const segSource = m.getSource('movement-segment') as mapboxgl.GeoJSONSource | undefined
            routeSource?.setData({ type: 'FeatureCollection', features: [] })
            segSource?.setData({ type: 'FeatureCollection', features: [] })

            // Stop route pulse
            if (routePulseFrameRef.current) cancelAnimationFrame(routePulseFrameRef.current)
            routePulseFrameRef.current = null
            try {
                // Reset gradient to default color when idle
                m.setPaintProperty('PLAYER_ROUTE', 'line-gradient', undefined as any)
            } catch {
                // ignore if style not ready / layer missing
            }
            return
        }

        const startedAt =
            (typeof serverMovementState?.startedAtWorldTimeMs === 'number' && Number.isFinite(serverMovementState.startedAtWorldTimeMs))
                ? serverMovementState.startedAtWorldTimeMs
                : Math.max(0, serverMovementState!.arriveAtWorldTimeMs - (path.length - 1) * msPerHex)

        const dest = path[path.length - 1]

        // Set full route polyline once when movement starts/changes
        const routeCoords = path.map(h => hexToGeo(h.q, h.r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS))
        const routeSource = m.getSource('movement-path') as mapboxgl.GeoJSONSource | undefined
        routeSource?.setData({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: routeCoords },
            }],
        })

        // Start/refresh the pulsing gradient along the full route
        if (routePulseFrameRef.current) cancelAnimationFrame(routePulseFrameRef.current)
        const PULSE_PERIOD_MS = 1400
        const PULSE_WIDTH = 0.10
        const base = 'rgba(0,255,255,0.00)'
        const mid = 'rgba(255,255,255,0.85)'
        const edge = 'rgba(0,255,255,0.20)'

        const buildGradient = (t01: number): mapboxgl.Expression => {
            // Single forward-moving pulse from 0->1 (start->destination).
            // IMPORTANT: Mapbox requires STRICTLY increasing stop inputs for interpolate().
            // When we clamp to [0,1], stops can become equal near the edges (e.g. 0,0,...), which throws.
            const feather = 0.05
            const eps = 1e-4
            const margin = (PULSE_WIDTH / 2) + feather + eps
            if (margin * 2 >= 1) {
                return ['interpolate', ['linear'], ['line-progress'], 0, base, 1, base] as unknown as mapboxgl.Expression
            }

            // Keep the pulse away from 0 and 1 so all stop inputs remain strictly ascending.
            const center = margin + Math.min(1, Math.max(0, t01)) * (1 - 2 * margin)
            const left = center - PULSE_WIDTH / 2
            const right = center + PULSE_WIDTH / 2
            const leftFeather = left - feather
            const rightFeather = right + feather

            // #region agent log
            // Log only if something goes wrong (avoid per-frame spam).
            // #endregion

            return [
                'interpolate',
                ['linear'],
                ['line-progress'],
                0, base,
                leftFeather, base,
                left, edge,
                center, mid,
                right, edge,
                rightFeather, base,
                1, base,
            ] as unknown as mapboxgl.Expression
        }

        let loggedGradientIssue = false
        const pulse = () => {
            const t = (performance.now() % PULSE_PERIOD_MS) / PULSE_PERIOD_MS
            try {
                const expr = buildGradient(t) as any
                // Validate stop order once (Mapbox throws if not strictly increasing).
                if (!loggedGradientIssue && Array.isArray(expr) && expr[0] === 'interpolate') {
                    const stops: number[] = []
                    for (let i = 3; i < expr.length; i += 2) {
                        if (typeof expr[i] === 'number') stops.push(expr[i])
                    }
                    let badAt: number | null = null
                    for (let i = 1; i < stops.length; i += 1) {
                        if (!(stops[i] > stops[i - 1])) { badAt = i; break }
                    }
                    if (badAt !== null) {
                        loggedGradientIssue = true
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'M2', location: 'SurvivalMapbox.tsx:pulse(validateGradient)', message: 'Non-ascending interpolate stops detected', data: { t, stops, badAt }, timestamp: Date.now() }) }).catch(() => { });
                        // #endregion
                    }
                }
                m.setPaintProperty('PLAYER_ROUTE', 'line-gradient', expr)
                // Keep glow constant; gradient only on the thin route line for readability.
            } catch (e) {
                if (!loggedGradientIssue) {
                    loggedGradientIssue = true
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'M2', location: 'SurvivalMapbox.tsx:pulse(setPaintProperty)', message: 'setPaintProperty line-gradient threw', data: { t, errorMessage: (e as any)?.message ?? String(e) }, timestamp: Date.now() }) }).catch(() => { });
                    // #endregion
                }
                // ignore if layer missing (style reload) or transient errors
            }
            routePulseFrameRef.current = requestAnimationFrame(pulse)
        }
        routePulseFrameRef.current = requestAnimationFrame(pulse)

        let lastEtaUpdateMs = 0
        const animate = () => {
            const worldNow = estimateServerWorldTimeMs()
            if (worldNow === null) {
                serverWalkFrameRef.current = requestAnimationFrame(animate)
                return
            }

            // Update ETA roughly at 4Hz (UI use)
            const nowPerf = performance.now()
            if (nowPerf - lastEtaUpdateMs > 250) {
                lastEtaUpdateMs = nowPerf
                const timeScale = serverTimeSyncRef.current?.timeScale ?? 120
                const remainingLoreMs = Math.max(0, serverMovementState!.arriveAtWorldTimeMs - worldNow)
                const remainingRealSeconds = Math.ceil((remainingLoreMs / timeScale) / 1000)
                setServerEtaSeconds(Number.isFinite(remainingRealSeconds) ? remainingRealSeconds : null)
            }

            const totalSteps = path.length - 1
            const progressedLoreMs = Math.max(0, worldNow - startedAt)
            const rawStep = progressedLoreMs / msPerHex
            const stepIndex = Math.min(totalSteps - 1, Math.max(0, Math.floor(rawStep)))
            const t = Math.min(1, Math.max(0, rawStep - stepIndex))
            // Smoothstep easing
            const ease = t * t * (3 - 2 * t)

            const a = path[stepIndex]
            const b = path[stepIndex + 1]
            const aGeo = hexToGeo(a.q, a.r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
            const bGeo = hexToGeo(b.q, b.r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
            const cur: [number, number] = [
                aGeo[0] + (bGeo[0] - aGeo[0]) * ease,
                aGeo[1] + (bGeo[1] - aGeo[1]) * ease,
            ]

            const segSource = m.getSource('movement-segment') as mapboxgl.GeoJSONSource | undefined
            segSource?.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates: [aGeo, bGeo] },
                }],
            })

            playerVisualPos.current = cur
            const source = m.getSource('player') as mapboxgl.GeoJSONSource | undefined
            source?.setData({
                type: 'FeatureCollection',
                features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: cur } }],
            })

            // Auto-stop once we should have arrived; server will clear movementState shortly after.
            if (worldNow >= serverMovementState!.arriveAtWorldTimeMs) {
                const destGeo = hexToGeo(dest.q, dest.r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
                playerVisualPos.current = destGeo
                source?.setData({
                    type: 'FeatureCollection',
                    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: destGeo } }],
                })

                // Clear active segment at finish (route stays until server clears state)
                segSource?.setData({ type: 'FeatureCollection', features: [] })
            } else {
                serverWalkFrameRef.current = requestAnimationFrame(animate)
            }
        }

        if (serverWalkFrameRef.current) cancelAnimationFrame(serverWalkFrameRef.current)
        serverWalkFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (serverWalkFrameRef.current) cancelAnimationFrame(serverWalkFrameRef.current)
            serverWalkFrameRef.current = null

            if (routePulseFrameRef.current) cancelAnimationFrame(routePulseFrameRef.current)
            routePulseFrameRef.current = null
        }
    }, [mapLoaded, gameState, serverMovementState, estimateServerWorldTimeMs])

    // Update layers dynamically when selection/path/player changes
    useEffect(() => {
        if (!map.current || !mapLoaded || !layersInitialized.current || !gameState || !hexGeoJSON) return

        const m = map.current
        {
            const now = Date.now()
            const prev = debugRef.current.layersEffectLastAt
            debugRef.current.layersEffectRuns += 1
            debugRef.current.layersEffectLastAt = now
            // Only log if this effect is running very frequently (can cause visible blinking due to filter churn).
            if (prev && now - prev < 200) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'flicker-pre-fix', hypothesisId: 'F4', location: 'SurvivalMapbox.tsx:layersDynamicEffect(entry)', message: 'Layers dynamic effect running very frequently', data: { deltaMs: now - prev, layersEffectRuns: debugRef.current.layersEffectRuns, mapLoaded, selectedHex: Boolean(selectedHex), pathSetSize: pathSet.size, revealedCount: gameState.revealedHexes.size, visibleCount: visibleHexes.size }, timestamp: Date.now() }) }).catch(() => { });
                // #endregion
            }
        }

        // Update path filter
        const pathIds = Array.from(pathSet)
        if (pathIds.length > 0) {
            m.setFilter('HEX_PATH', ['in', ['get', 'hexId'], ['literal', pathIds]])
        } else {
            m.setFilter('HEX_PATH', ['==', ['get', 'hexId'], '__none__']) // Matches nothing
        }

        // Update selected hex filter
        if (selectedHex) {
            m.setFilter('HEX_SELECTED', ['==', ['get', 'hexId'], hexToString(selectedHex)])
        } else {
            m.setFilter('HEX_SELECTED', ['==', ['get', 'hexId'], '__none__']) // Matches nothing
        }

        // REMOVED PLAYER UPDATE TO SEPARATE EFFECT

        // Update fog of war filter based on revealed hexes
        const unrevealedIds: string[] = []
        const exploredNotVisibleIds: string[] = []
        const revealedIds: string[] = []
        const iconHexIds: string[] = []
        gameState.map.forEach((hex) => {
            const hexId = hexToString(hex)
            const isRevealed = gameState.revealedHexes.has(hexId)
            const isVisible = visibleHexes.has(hexId)

            if (!isRevealed) {
                unrevealedIds.push(hexId)
                return
            }

            revealedIds.push(hexId)

            if (KEY_BIOMES_WITH_ICONS.includes(hex.biome)) {
                iconHexIds.push(hexId)
            }

            if (!isVisible) {
                exploredNotVisibleIds.push(hexId)
            }
        })

        // Reveal interactions, borders, and fog fill only for discovered hexes
        if (revealedIds.length > 0) {
            m.setFilter('HEX_INTERACTION', ['in', ['get', 'hexId'], ['literal', revealedIds]])
            m.setFilter('HEX_BORDER', ['in', ['get', 'hexId'], ['literal', revealedIds]])
        } else {
            m.setFilter('HEX_INTERACTION', ['==', ['get', 'hexId'], '__none__'])
            m.setFilter('HEX_BORDER', ['==', ['get', 'hexId'], '__none__'])
        }

        // Show biome fill only when a hex is explored but out of visibility
        if (exploredNotVisibleIds.length > 0) {
            m.setFilter('HEX_FILL', ['in', ['get', 'hexId'], ['literal', exploredNotVisibleIds]])
        } else {
            m.setFilter('HEX_FILL', ['==', ['get', 'hexId'], '__none__'])
        }

        if (unrevealedIds.length > 0) {
            m.setFilter('FOG_UNEXPLORED', ['in', ['get', 'hexId'], ['literal', unrevealedIds]])
        } else {
            m.setFilter('FOG_UNEXPLORED', ['==', ['get', 'hexId'], '__none__']) // Matches nothing
        }

        if (exploredNotVisibleIds.length > 0) {
            m.setFilter('FOG_EXPLORED', ['in', ['get', 'hexId'], ['literal', exploredNotVisibleIds]])
        } else {
            m.setFilter('FOG_EXPLORED', ['==', ['get', 'hexId'], '__none__']) // Matches nothing
        }

        // Update HEX_BIOME_ICONS filter: keep discovered unique locations visible
        if (iconHexIds.length > 0) {
            m.setFilter('HEX_BIOME_ICONS', ['in', ['get', 'hexId'], ['literal', iconHexIds]])
        } else {
            m.setFilter('HEX_BIOME_ICONS', ['==', ['get', 'hexId'], '__none__'])
        }

        // Keep bunker marker visible once discovered
        const bunkerIsRevealed = gameState.revealedHexes.has('0,0')
        m.setPaintProperty('BUNKER_GLOW_OUTER', 'circle-opacity', bunkerIsRevealed ? 0.3 : 0)
        m.setPaintProperty('BUNKER_GLOW_INNER', 'circle-opacity', bunkerIsRevealed ? 0.5 : 0)
        m.setPaintProperty('BUNKER_MARKER', 'circle-opacity', bunkerIsRevealed ? 1 : 0)
        m.setPaintProperty('BUNKER_MARKER', 'circle-stroke-opacity', bunkerIsRevealed ? 1 : 0)
    }, [mapLoaded, selectedHex, pathSet, gameState, hexGeoJSON, visibleHexes])

    // Hover interaction (throttled for performance)
    useEffect(() => {
        if (!map.current || !mapLoaded || !gameState) return

        const m = map.current
        let hoveredId: number | null = null
        let lastMoveTime = 0
        const THROTTLE_MS = 16 // ~60fps

        const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
            const now = Date.now()
            if (now - lastMoveTime < THROTTLE_MS) return
            lastMoveTime = now

            if (e.features && e.features.length > 0) {
                if (hoveredId !== null) {
                    m.setFeatureState({ source: 'hexgrid', id: hoveredId }, { hover: false })
                }
                hoveredId = e.features[0].id as number
                m.setFeatureState({ source: 'hexgrid', id: hoveredId }, { hover: true })
                m.getCanvas().style.cursor = 'pointer'

                // Update tooltip
                const props = e.features[0].properties
                if (props) {
                    const hexCell = gameState.map.find(h => h.q === props.q && h.r === props.r)
                    if (hexCell) {
                        setHoveredHex({
                            hex: hexCell,
                            pos: { x: e.point.x, y: e.point.y }
                        })
                    }
                }
            }
        }

        const onMouseLeave = () => {
            if (hoveredId !== null) {
                m.setFeatureState({ source: 'hexgrid', id: hoveredId }, { hover: false })
            }
            hoveredId = null
            m.getCanvas().style.cursor = ''
            setHoveredHex(null)
        }

        m.on('mousemove', 'HEX_INTERACTION', onMouseMove)
        m.on('mouseleave', 'HEX_INTERACTION', onMouseLeave)

        return () => {
            m.off('mousemove', 'HEX_INTERACTION', onMouseMove)
            m.off('mouseleave', 'HEX_INTERACTION', onMouseLeave)
        }
    }, [mapLoaded, gameState])

    // Click interaction
    useEffect(() => {
        if (!map.current || !mapLoaded || !gameState) return

        const m = map.current

        const onClick = (e: mapboxgl.MapMouseEvent) => {
            if (isMoving) return

            const features = m.queryRenderedFeatures(e.point, { layers: ['HEX_INTERACTION'] })
            if (features.length > 0) {
                const props = features[0].properties
                if (props) {
                    const hexKey = `${props.q},${props.r}`
                    const isExplored = gameState.revealedHexes.has(hexKey)

                    if (isExplored) {
                        if (selectedHex?.q === props.q && selectedHex?.r === props.r) {
                            setSelectedHex(null)
                        } else {
                            setSelectedHex({ q: props.q, r: props.r })
                        }
                    }
                }
            }
        }

        m.on('click', 'HEX_INTERACTION', onClick)

        return () => {
            m.off('click', 'HEX_INTERACTION', onClick)
        }
    }, [mapLoaded, gameState, selectedHex, isMoving])

    // Keyboard shortcuts
    useEffect(() => {
        if (!map.current || !mapLoaded || !gameState) return

        const m = map.current
        const { q, r } = gameState.player.position
        const playerGeo = hexToGeo(q, r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            switch (e.key.toLowerCase()) {
                case 'c':
                    // Center on player
                    m.flyTo({ center: playerGeo, duration: 500 })
                    break
                case '+':
                case '=':
                    // Zoom in
                    m.zoomIn({ duration: 300 })
                    break
                case '-':
                    // Zoom out
                    m.zoomOut({ duration: 300 })
                    break
                case 'escape':
                    // Deselect hex
                    setSelectedHex(null)
                    break
                case 'arrowleft':
                case 'arrowright':
                case 'arrowup':
                case 'arrowdown': {
                    const currentBasis = selectedHex || gameState.player.position
                    let dq = 0
                    let dr = 0

                    if (e.key === 'ArrowLeft') dq = -1
                    if (e.key === 'ArrowRight') dq = 1
                    if (e.key === 'ArrowUp') {
                        if (e.shiftKey) { dq = 1; dr = -1 } // NE
                        else dr = -1 // NW
                    }
                    if (e.key === 'ArrowDown') {
                        if (e.shiftKey) { dq = -1; dr = 1 } // SW
                        else dr = 1 // SE
                    }

                    const newHex = { q: currentBasis.q + dq, r: currentBasis.r + dr }

                    // Verify hex exists and is revealed
                    const hexKey = `${newHex.q},${newHex.r}`
                    const isRevealed = gameState.revealedHexes.has(hexKey)
                    const exists = gameState.map.some(h => h.q === newHex.q && h.r === newHex.r)

                    if (exists && isRevealed) {
                        setSelectedHex(newHex)

                        // Optional: pan to keep in view
                        const hexGeo = hexToGeo(newHex.q, newHex.r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
                        m.easeTo({ center: hexGeo, duration: 200 })
                    }
                    e.preventDefault()
                    break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mapLoaded, gameState, selectedHex])

    // Movement handler
    const handleMove = useCallback(async () => {
        if (!gameState || !selectedHex) return
        if (isMoving) return

        const path = currentPath
        if (path.length < 2) return

        const targetCell = hexMap.get(hexToString(selectedHex))
        if (targetCell?.isObstacle) {
            console.warn('Attempted to move to obstacle')
            return
        }

        const costPerHex = useServerMovement ? STAMINA_COST_PER_HEX : 1
        const cost = Math.max(0, path.length - 1) * costPerHex

        // Server-authoritative mode: delegate move request to caller
        if (onMoveRequest) {
            setIsMoving(true)
            try {
                const accepted = await Promise.resolve(onMoveRequest({ q: selectedHex.q, r: selectedHex.r }))
                if (!accepted) {
                    setIsMoving(false)
                    return
                }
                setSelectedHex(null)
            } catch (error) {
                console.error('[SurvivalMapbox] Move request failed', error)
                setIsMoving(false)
            }
            return
        }

        if (cost > gameState.player.ap) {
            window.alert('Not enough AP!')
            return
        }

        setIsMoving(true)

        setTimeout(() => {
            setGameState((prev) => {
                if (!prev) return null

                const newRevealed = new Set(prev.revealedHexes)
                prev.map.forEach((h) => {
                    if (getHexDistance(selectedHex, h) <= VIEW_RADIUS) {
                        newRevealed.add(`${h.q},${h.r}`)
                    }
                })

                return {
                    ...prev,
                    player: {
                        ...prev.player,
                        position: selectedHex,
                        ap: prev.player.ap - cost,
                    },
                    revealedHexes: newRevealed,
                }
            })
            setSelectedHex(null)
            setIsMoving(false)
        }, 500)
    }, [gameState, selectedHex, isMoving, currentPath, hexMap, onMoveRequest, useServerMovement])

    // End turn handler
    const handleEndTurn = useCallback(() => {
        setGameState((prev) => {
            if (!prev) return null
            return {
                ...prev,
                turn: prev.turn + 1,
                player: {
                    ...prev.player,
                    ap: Math.min(prev.player.maxAp, prev.player.ap + 4),
                },
            }
        })
        setAnnouncement(`Ход ${gameState?.turn ? gameState.turn + 1 : 1}. Очки действия восстановлены.`)
    }, [gameState?.turn])

    if (!gameState) {
        return (
            <div className="flex items-center justify-center h-screen bg-terminal-black text-terminal-green animate-pulse">
                BOOTING TACTICAL INTERFACE...
            </div>
        )
    }

    if (!mapboxgl.accessToken) {
        return (
            <div className="flex items-center justify-center h-screen bg-terminal-black text-red-500">
                <div className="text-center">
                    <p className="text-xl mb-2">MAPBOX TOKEN NOT CONFIGURED</p>
                    <p className="text-sm opacity-70">Set VITE_MAPBOX_TOKEN in your .env file</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 w-full h-screen-safe bg-terminal-black overflow-hidden font-mono text-sm">
            {/* Screen reader announcements */}
            <ScreenReaderAnnouncer message={announcement} />

            {/* Map container - needs explicit dimensions */}
            <div ref={setMapContainerRef} className="absolute inset-0 w-full h-full" />

            {/* Map loading indicator */}
            {!mapLoaded && !mapError && (
                <div className="absolute inset-0 bg-terminal-black flex items-center justify-center z-overlay">
                    <div className="text-center">
                        <div className="w-12 h-12 border-2 border-terminal-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-terminal-green text-sm font-mono">INITIALIZING MAP...</p>
                    </div>
                </div>
            )}

            {/* Map error overlay */}
            {mapError && (
                <div className="absolute inset-0 bg-red-950/90 flex items-center justify-center z-overlay">
                    <div className="text-center">
                        <p className="text-red-400 text-xl mb-2">⚠️ Map Error</p>
                        <p className="text-red-300 text-sm">{mapError}</p>
                    </div>
                </div>
            )}

            {/* HUD overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Biome legend */}
                <div className="pointer-events-auto">
                    <BiomeLegend />
                </div>

                <div className="pointer-events-auto">
                    <HUD
                        player={gameState.player}
                        turn={gameState.turn}
                        selectedHex={selectedHex}
                        mapData={gameState.map}
                        visibleHexes={visibleHexes}
                        onMove={handleMove}
                        onEndTurn={handleEndTurn}
                        movementPool={movementPool}
                        movementStats={movementStats}
                        movementStatus={
                            serverMovementState?.path?.length
                                ? {
                                    destination: serverMovementState.path[serverMovementState.path.length - 1],
                                    etaSeconds: serverEtaSeconds,
                                }
                                : null
                        }
                    />
                </div>
            </div>

            {/* Hex tooltip */}
            {hoveredHex && gameState && (
                <HexTooltip
                    hex={hoveredHex.hex}
                    position={hoveredHex.pos}
                    isRevealed={gameState.revealedHexes.has(hexToString(hoveredHex.hex))}
                />
            )}

            {/* Scanline overlay for terminal effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]" />
        </div>
    )
})
SurvivalMapbox.displayName = 'SurvivalMapbox'
