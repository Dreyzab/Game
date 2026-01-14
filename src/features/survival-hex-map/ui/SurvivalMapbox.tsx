import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { generateMap } from '../services/mapGenerator'
import { getHexDistance, getPath, hexToString } from '../utils/hexMath'
import { DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS, getMapBounds, hexToGeo, mapToGeoJSON } from '../utils/geoMath'
import { HUD } from './components/HUD'
import type { BiomeType, GameState, HexCell, HexCoordinate } from '../types'

// Mapbox access token - should be set in environment
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const MAP_RADIUS = 14 // ~1km diameter at 25m hex size
const BASE_ZOOM = 16
const BUNKER_ICON_MAX_DIMENSION = 926
const INITIAL_AP = 5
const VIEW_RADIUS = 2

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

interface SurvivalMapboxProps {
    initialMap?: HexCell[]
}

export const SurvivalMapbox = ({ initialMap: providedMap }: SurvivalMapboxProps = {}) => {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [containerReady, setContainerReady] = useState(false)

    const [gameState, setGameState] = useState<GameState | null>(null)
    const [selectedHex, setSelectedHex] = useState<HexCoordinate | null>(null)
    const [isMoving, setIsMoving] = useState(false)

    // Callback ref to detect when container is mounted
    const setMapContainerRef = (node: HTMLDivElement | null) => {
        mapContainer.current = node
        if (node && !containerReady) {
            console.log('[SurvivalMapbox] Container ref set!')
            setContainerReady(true)
        }
    }

    // Initialize game state
    useEffect(() => {
        let initialMap = providedMap

        if (!initialMap) {
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

        const revealed: string[] = []
        initialMap.forEach((hex) => {
            if (getHexDistance({ q: 0, r: 0 }, hex) <= VIEW_RADIUS) {
                revealed.push(`${hex.q},${hex.r}`)
            }
        })

        setGameState({
            map: initialMap,
            player: {
                position: { q: 0, r: 0 },
                ap: INITIAL_AP,
                maxAp: 10,
                health: 100,
                maxHealth: 100,
                inventory: [],
            },
            revealedHexes: new Set(revealed),
            turn: 1,
        })
    }, [providedMap])

    // Initialize Mapbox - only once when container is ready
    useEffect(() => {
        // Skip if no container or map already exists
        if (!mapContainer.current || map.current) return

        console.log('[SurvivalMapbox] Initializing Mapbox...')
        console.log('[SurvivalMapbox] Token present:', !!mapboxgl.accessToken)
        console.log('[SurvivalMapbox] Container:', mapContainer.current)

        try {
            const newMap = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: DEFAULT_MAP_CENTER,
                zoom: BASE_ZOOM,
                pitch: 0,
                bearing: 0,
            })

            newMap.on('load', () => {
                console.log('[SurvivalMapbox] Map loaded successfully!')
                setMapLoaded(true)
            })

            newMap.on('error', (e) => {
                console.error('[SurvivalMapbox] Map error:', e)
            })

            map.current = newMap
        } catch (error) {
            console.error('[SurvivalMapbox] Failed to initialize map:', error)
        }

        return () => {
            if (map.current) {
                map.current.remove()
                map.current = null
                setMapLoaded(false)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerReady])

    // GeoJSON data for the hex grid
    const hexGeoJSON = useMemo(() => {
        if (!gameState) return null
        return mapToGeoJSON(gameState.map, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
    }, [gameState?.map])

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
    }, [gameState?.player.position, gameState?.map])

    // Path from player to selected hex
    const currentPath = useMemo(() => {
        if (!gameState || !selectedHex) return []
        return getPath(gameState.player.position, selectedHex, gameState.map)
    }, [gameState, selectedHex])

    const pathSet = useMemo(() => new Set(currentPath.map(hexToString)), [currentPath])

    // Add hex grid source and layers - only once when map and data are ready
    const layersInitialized = useRef(false)

    useEffect(() => {
        if (!map.current || !mapLoaded || !hexGeoJSON || !gameState) return
        if (layersInitialized.current) return // Already initialized

        const m = map.current

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

        // Fill layer for biomes
        m.addLayer({
            id: 'hex-fill',
            type: 'fill',
            source: 'hexgrid',
            paint: {
                'fill-color': biomeColorExpr,
                'fill-opacity': 0.5,
            },
        })

        // Border layer
        m.addLayer({
            id: 'hex-border',
            type: 'line',
            source: 'hexgrid',
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
        m.addLayer({
            id: 'hex-path',
            type: 'line',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'], // Initially matches nothing
            paint: {
                'line-color': '#00ffff',
                'line-width': 3,
            },
        })

        // Selected hex highlight layer (initially empty filter)
        m.addLayer({
            id: 'hex-selected',
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

        // Fog of war layers (unexplored + explored but not visible) - MUST be added BEFORE player/bunker markers
        m.addLayer({
            id: 'hex-fog-unexplored',
            type: 'fill',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'],
            paint: {
                'fill-color': '#000000',
                'fill-opacity': 0.7, // Dark overlay for unexplored
            },
        })

        m.addLayer({
            id: 'hex-fog-explored',
            type: 'fill',
            source: 'hexgrid',
            filter: ['==', ['get', 'hexId'], '__none__'],
            paint: {
                'fill-color': '#6b7280', // Gray overlay for explored but not visible
                'fill-opacity': 0.35,
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
        m.addLayer({
            id: 'bunker-glow-outer',
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
        m.addLayer({
            id: 'bunker-glow-inner',
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
        m.addLayer({
            id: 'bunker-marker',
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

        // Player pulsing glow (outer)
        m.addLayer({
            id: 'player-glow',
            type: 'circle',
            source: 'player',
            paint: {
                'circle-radius': 16,
                'circle-color': '#00ff41',
                'circle-opacity': 0.4,
                'circle-blur': 1,
            },
        })

        m.addLayer({
            id: 'player-marker',
            type: 'circle',
            source: 'player',
            paint: {
                'circle-radius': 10,
                'circle-color': '#00ff41',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 3,
            },
        })

        const bunkerIconId = 'bunker-icon'
        const bunkerIconUrl = '/images/hexagon/biome_bunker.png'
        const metersPerPixelAtBase =
            (156543.03392 * Math.cos((DEFAULT_MAP_CENTER[1] * Math.PI) / 180)) / Math.pow(2, BASE_ZOOM)
        const bunkerIconPixelSize = (GEO_HEX_SIZE_METERS * 2) / metersPerPixelAtBase
        const bunkerIconBaseSize = Math.min(1, Math.max(0.01, bunkerIconPixelSize / BUNKER_ICON_MAX_DIMENSION))
        const bunkerIconSizeExpr: mapboxgl.Expression = [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            BASE_ZOOM - 2,
            bunkerIconBaseSize / 4,
            BASE_ZOOM - 1,
            bunkerIconBaseSize / 2,
            BASE_ZOOM,
            bunkerIconBaseSize,
            BASE_ZOOM + 1,
            bunkerIconBaseSize * 2,
            BASE_ZOOM + 2,
            bunkerIconBaseSize * 4,
        ]
        const addBunkerIconLayer = () => {
            if (m.getLayer('bunker-icon')) return
            m.addLayer(
                {
                    id: 'bunker-icon',
                    type: 'symbol',
                    source: 'bunker',
                    layout: {
                        'icon-image': bunkerIconId,
                        'icon-size': bunkerIconSizeExpr,
                        'icon-anchor': 'center',
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                    },
                },
                'player-glow'
            )
        }

        if (m.hasImage(bunkerIconId)) {
            addBunkerIconLayer()
        } else {
            m.loadImage(bunkerIconUrl, (error, image) => {
                if (error || !image) {
                    console.error('[SurvivalMapbox] Failed to load bunker icon:', error)
                    return
                }
                if (!m.hasImage(bunkerIconId)) {
                    m.addImage(bunkerIconId, image)
                }
                addBunkerIconLayer()
            })
        }

        // Fit bounds to hex grid on first load
        const bounds = getMapBounds(gameState.map, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
        m.fitBounds(bounds, { padding: 50, maxZoom: 17 })

        layersInitialized.current = true
    }, [mapLoaded, hexGeoJSON, gameState])

    // Update layers dynamically when selection/path/player changes
    useEffect(() => {
        if (!map.current || !mapLoaded || !layersInitialized.current || !gameState || !hexGeoJSON) return

        const m = map.current

        // Update path filter
        const pathIds = Array.from(pathSet)
        if (pathIds.length > 0) {
            m.setFilter('hex-path', ['in', ['get', 'hexId'], ['literal', pathIds]])
        } else {
            m.setFilter('hex-path', ['==', ['get', 'hexId'], '__none__']) // Matches nothing
        }

        // Update selected hex filter
        if (selectedHex) {
            m.setFilter('hex-selected', ['==', ['get', 'hexId'], hexToString(selectedHex)])
        } else {
            m.setFilter('hex-selected', ['==', ['get', 'hexId'], '__none__']) // Matches nothing
        }

        // Update player marker position
        const playerHex = gameState.player.position
        const playerCenter = hexToGeo(playerHex.q, playerHex.r, DEFAULT_MAP_CENTER, GEO_HEX_SIZE_METERS)
        const source = m.getSource('player') as mapboxgl.GeoJSONSource | undefined
        source?.setData({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'Point', coordinates: playerCenter },
                },
            ],
        })

        // Update fog of war filter based on revealed hexes
        const unrevealedIds: string[] = []
        const exploredNotVisibleIds: string[] = []
        gameState.map.forEach((hex) => {
            const hexId = hexToString(hex)
            if (!gameState.revealedHexes.has(hexId)) {
                unrevealedIds.push(hexId)
            } else if (!visibleHexes.has(hexId)) {
                exploredNotVisibleIds.push(hexId)
            }
        })

        if (unrevealedIds.length > 0) {
            m.setFilter('hex-fog-unexplored', ['in', ['get', 'hexId'], ['literal', unrevealedIds]])
        } else {
            m.setFilter('hex-fog-unexplored', ['==', ['get', 'hexId'], '__none__']) // Matches nothing
        }
        
        if (exploredNotVisibleIds.length > 0) {
            m.setFilter('hex-fog-explored', ['in', ['get', 'hexId'], ['literal', exploredNotVisibleIds]])
        } else {
            m.setFilter('hex-fog-explored', ['==', ['get', 'hexId'], '__none__']) // Matches nothing
        }
    }, [mapLoaded, selectedHex, pathSet, gameState?.player.position, gameState?.revealedHexes, gameState?.map, hexGeoJSON, visibleHexes])

    // Hover interaction
    useEffect(() => {
        if (!map.current || !mapLoaded) return

        const m = map.current
        let hoveredId: number | null = null

        const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
            if (e.features && e.features.length > 0) {
                if (hoveredId !== null) {
                    m.setFeatureState({ source: 'hexgrid', id: hoveredId }, { hover: false })
                }
                hoveredId = e.features[0].id as number
                m.setFeatureState({ source: 'hexgrid', id: hoveredId }, { hover: true })
                m.getCanvas().style.cursor = 'pointer'
            }
        }

        const onMouseLeave = () => {
            if (hoveredId !== null) {
                m.setFeatureState({ source: 'hexgrid', id: hoveredId }, { hover: false })
            }
            hoveredId = null
            m.getCanvas().style.cursor = ''
        }

        m.on('mousemove', 'hex-fill', onMouseMove)
        m.on('mouseleave', 'hex-fill', onMouseLeave)

        return () => {
            m.off('mousemove', 'hex-fill', onMouseMove)
            m.off('mouseleave', 'hex-fill', onMouseLeave)
        }
    }, [mapLoaded])

    // Click interaction
    useEffect(() => {
        if (!map.current || !mapLoaded || !gameState) return

        const m = map.current

        const onClick = (e: mapboxgl.MapMouseEvent) => {
            if (isMoving) return

            const features = m.queryRenderedFeatures(e.point, { layers: ['hex-fill'] })
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

        m.on('click', 'hex-fill', onClick)

        return () => {
            m.off('click', 'hex-fill', onClick)
        }
    }, [mapLoaded, gameState, selectedHex, isMoving])

    // Movement handler
    const handleMove = useCallback(() => {
        if (!gameState || !selectedHex) return

        const path = getPath(gameState.player.position, selectedHex, gameState.map)
        const cost = Math.max(0, path.length - 1)

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
    }, [gameState, selectedHex])

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
    }, [])

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
        <div className="fixed inset-0 w-full h-screen bg-terminal-black overflow-hidden font-mono text-sm">
            {/* Map container - needs explicit dimensions */}
            <div ref={setMapContainerRef} className="absolute inset-0 w-full h-full" />

            {/* HUD overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <HUD
                        player={gameState.player}
                        turn={gameState.turn}
                        selectedHex={selectedHex}
                        mapData={gameState.map}
                        visibleHexes={visibleHexes}
                        onMove={handleMove}
                        onEndTurn={handleEndTurn}
                    />
                </div>
            </div>

            {/* Scanline overlay for terminal effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]" />
        </div>
    )
}
