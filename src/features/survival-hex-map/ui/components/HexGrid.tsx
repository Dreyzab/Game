import { useMemo, useState, useEffect } from 'react'
import { motion, useSpring } from 'framer-motion'
import type { BiomeType, GameState, HexCell, HexCoordinate, ResourceType, ThreatLevel } from '../../types'
import { getPath, HEX_SIZE, hexToPixel, hexToString } from '../../utils/hexMath'

interface HexGridProps {
  gameState: GameState
  selectedHex: HexCoordinate | null
  hoveredHex: HexCoordinate | null
  visibleHexes: Set<string>
  setHoveredHex: (hex: HexCoordinate | null) => void
  onHexClick: (hex: HexCell) => void
}

const getResourceIcon = (type: ResourceType) => {
  switch (type) {
    case 'SCRAP':
      return (
        <g fill="#94a3b8" stroke="none">
          <path d="M-4 -4 L4 -4 L4 4 L-4 4 Z" opacity="0.5" />
          <circle r="2" fill="#e2e8f0" />
        </g>
      )
    case 'FOOD':
      return (
        <g fill="#4ade80" stroke="none">
          <path d="M0 -5 Q5 -5 5 0 Q5 5 0 5 Q-5 5 -5 0 Q-5 -5 0 -5" opacity="0.8" />
          <path d="M0 -5 L0 5" stroke="#166534" strokeWidth="1" />
        </g>
      )
    case 'WATER':
      return (
        <g fill="#60a5fa" stroke="none">
          <path d="M0 -5 Q-4 0 0 5 Q4 0 0 -5" />
        </g>
      )
    case 'FUEL':
      return (
        <g fill="#f97316" stroke="none">
          <rect x="-3" y="-5" width="6" height="8" rx="1" />
          <rect x="-1" y="-6" width="2" height="1" />
        </g>
      )
    case 'TECH':
      return (
        <g fill="#a855f7" stroke="none">
          <path d="M-1 -5 L3 -1 L0 0 L1 5 L-3 1 L0 0 Z" />
        </g>
      )
    default:
      return null
  }
}

const getBiomeImage = (biome: BiomeType) => {
  switch (biome) {
    case 'FOREST':
      return '/images/hexagon/biome_forest.png'
    case 'WASTELAND':
      return '/images/hexagon/biome_wasteland.png'
    case 'URBAN':
      return '/images/hexagon/biome_urban.png'
    case 'INDUSTRIAL':
      return '/images/hexagon/biome_industrial.png'
    case 'WATER':
      return '/images/hexagon/biome_water.png'
    case 'BUNKER':
      return '/images/hexagon/biome_bunker.png'
    case 'HOSPITAL':
      return '/images/hexagon/biome_hospital.png'
    case 'POLICE':
      return '/images/hexagon/biome_police.png'
    case 'FACTORY':
      return '/images/hexagon/biome_factory.png'
    case 'RIVER':
      return '/images/hexagon/biome_river.png'
    case 'CITY_HIGH':
      return '/images/hexagon/biome_city_high.png'
    case 'ADMIN':
      return '/images/hexagon/biome_admin.png'
    case 'SKYSCRAPER':
      return '/images/hexagon/biome_skyscraper.png'
    case 'FIRE_STATION':
      return '/images/hexagon/biome_fire_station.png'
    case 'MALL':
      return '/images/hexagon/biome_mall.png'
    case 'RAILWAY_DEPOT':
      return '/images/hexagon/biome_railway_depot.png'
    case 'BUILDING_LOW':
      return '/images/hexagon/biome_building_low.png'
    case 'PARKING_LOW':
      return '/images/hexagon/biome_parking_low.png'
    case 'WAREHOUSE':
      return '/images/hexagon/biome_warehouse.png'
    case 'GAS_STATION':
      return '/images/hexagon/biome_gas_station.png'
    case 'SCAVENGER_CAMP':
      return '/images/hexagon/biome_scavenger_camp.png'
    case 'ARMY_BASE':
      return '/images/hexagon/biome_army_base.png'
    case 'AIRPORT':
      return '/images/hexagon/biome_airport.png'
    case 'ROAD_HIGH':
      return '/images/hexagon/biome_road_high.png'
    case 'ROAD_LOW':
      return '/images/hexagon/biome_road_low.png'
    case 'ROAD_CITY':
      return '/images/hexagon/biome_road_city.png'
    case 'ROAD_FOREST':
      return '/images/hexagon/biome_road_forest.png'
    default:
      return '/images/hexagon/biome_wasteland.png'
  }
}

const getBiomeColor = (biome: BiomeType) => {
  switch (biome) {
    case 'BUNKER':
      return '#475569'
    case 'FOREST':
      return '#065f46'
    case 'WATER':
    case 'RIVER':
      return '#1e40af'
    case 'INDUSTRIAL':
    case 'FACTORY':
      return '#78350f'
    case 'URBAN':
    case 'CITY_HIGH':
    case 'HOSPITAL':
    case 'POLICE':
    case 'ADMIN':
    case 'SKYSCRAPER':
    case 'FIRE_STATION':
    case 'MALL':
    case 'RAILWAY_DEPOT':
    case 'BUILDING_LOW':
    case 'PARKING_LOW':
    case 'WAREHOUSE':
    case 'GAS_STATION':
    case 'SCAVENGER_CAMP':
    case 'ARMY_BASE':
    case 'AIRPORT':
    case 'ROAD_HIGH':
    case 'ROAD_LOW':
    case 'ROAD_CITY':
    case 'ROAD_FOREST':
      return '#374151'
    case 'WASTELAND':
      return '#3f3f46'
    default:
      return '#18181b'
  }
}

const getThreatColor = (level: ThreatLevel) => {
  switch (level) {
    case 'SAFE':
      return '#00ff41'
    case 'LOW':
      return '#3b82f6'
    case 'MEDIUM':
      return '#eab308'
    case 'HIGH':
      return '#f97316'
    case 'EXTREME':
      return '#ef4444'
    default:
      return '#333'
  }
}

const getStrokeColor = (
  cell: HexCell,
  isExplored: boolean,
  isVisible: boolean,
  isSelected: boolean,
  isPath: boolean
) => {
  if (isSelected) return '#00ff41'
  if (isPath) return '#00ff41'
  if (!isExplored) return '#333'

  if (isVisible) {
    if (cell.threatLevel === 'EXTREME') return '#ef4444'
    if (cell.threatLevel === 'HIGH') return '#f97316'
  }

  return '#1a1a1a'
}

export const HexGrid = ({ gameState, selectedHex, hoveredHex, visibleHexes, setHoveredHex, onHexClick }: HexGridProps) => {
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Framer Motion values for smoothness
  const springConfig = { damping: 25, stiffness: 200, restDelta: 0.001 }
  const smoothX = useSpring(viewState.x, springConfig)
  const smoothY = useSpring(viewState.y, springConfig)
  const smoothScale = useSpring(viewState.scale, springConfig)

  useEffect(() => {
    smoothX.set(viewState.x)
    smoothY.set(viewState.y)
    smoothScale.set(viewState.scale)
  }, [viewState.x, viewState.y, viewState.scale, smoothX, smoothY, smoothScale])

  const hexPoints = useMemo(() => {
    const angles = [30, 90, 150, 210, 270, 330]
    return angles
      .map((deg) => {
        const rad = (Math.PI / 180) * deg
        return `${HEX_SIZE * Math.cos(rad)},${HEX_SIZE * Math.sin(rad)}`
      })
      .join(' ')
  }, [])

  const movementPath = useMemo(() => {
    if (!selectedHex) return []
    return getPath(gameState.player.position, selectedHex, gameState.map)
  }, [gameState.player.position, selectedHex, gameState.map])

  const movementPathSet = useMemo(() => new Set(movementPath.map(hexToString)), [movementPath])

  const patterns = useMemo(() => {
    return gameState.map.map((cell) => {
      const cellKey = hexToString(cell)
      if (!gameState.revealedHexes.has(cellKey)) return null

      const isSpecialBiome = [
        'ADMIN', 'SKYSCRAPER', 'FIRE_STATION', 'MALL',
        'HOSPITAL', 'POLICE', 'CITY_HIGH', 'FACTORY',
        'RAILWAY_DEPOT', 'BUILDING_LOW', 'PARKING_LOW', 'WAREHOUSE',
        'GAS_STATION', 'SCAVENGER_CAMP', 'ARMY_BASE', 'AIRPORT'
      ].includes(cell.biome)

      return (
        <pattern key={`pat-${cellKey}`} id={`pat-${cellKey}`} patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">
          <image
            href={getBiomeImage(cell.biome)}
            x={isSpecialBiome ? '0' : '-0.25'}
            y={isSpecialBiome ? '0' : '-0.25'}
            width={isSpecialBiome ? '1' : '1.5'}
            height={isSpecialBiome ? '1' : '1.5'}
            preserveAspectRatio={isSpecialBiome ? 'xMidYMid meet' : 'xMidYMid slice'}
          />
          <rect width="1" height="1" fill={getBiomeColor(cell.biome)} opacity="0.1" />
          <path d="M0 0.5 L1 0.5 M0.5 0 L0.5 1" stroke="rgba(0,0,0,0.1)" strokeWidth="0.01" />
          <rect width="1" height="1" fill="url(#grid)" opacity="0.1" />
        </pattern>
      )
    })
  }, [gameState.map, gameState.revealedHexes])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setViewState((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStart.x
      const dy = e.touches[0].clientY - dragStart.y
      setViewState((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }
  }

  const handleTouchEnd = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    const scaleAmount = -e.deltaY * 0.001
    setViewState((prev) => ({ ...prev, scale: Math.min(Math.max(0.5, prev.scale + scaleAmount), 3) }))
  }

  return (
    <svg
      className="w-full h-full cursor-crosshair touch-none select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onWheel={handleWheel}
      viewBox={`${-window.innerWidth / 2} ${-window.innerHeight / 2} ${window.innerWidth} ${window.innerHeight}`}
    >
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 255, 65, 0.2)" strokeWidth="0.5" />
        </pattern>
        {patterns}
      </defs>

      <motion.g
        style={{
          x: smoothX,
          y: smoothY,
          scale: smoothScale,
          willChange: 'transform'
        }}
      >
        {gameState.map.map((cell) => {
          const { x, y } = hexToPixel(cell.q, cell.r)
          const cellKey = hexToString(cell)
          const isExplored = gameState.revealedHexes.has(cellKey)
          const isVisible = visibleHexes.has(cellKey)

          const isSelected = selectedHex?.q === cell.q && selectedHex?.r === cell.r
          const isPath = movementPathSet.has(cellKey)
          const isHovered = hoveredHex?.q === cell.q && hoveredHex?.r === cell.r

          return (
            <g
              key={cellKey}
              transform={`translate(${x},${y})`}
              onClick={() => onHexClick(cell)}
              onMouseEnter={() => setHoveredHex(cell)}
              onMouseLeave={() => setHoveredHex(null)}
              className="transition-opacity duration-300"
              style={{
                opacity: isVisible ? 1 : isExplored ? 0.3 : 1,
              }}
            >
              <polygon
                points={hexPoints}
                fill={isExplored ? `url(#pat-${cellKey})` : '#050505'}
                stroke={getStrokeColor(cell, isExplored, isVisible, isSelected, isPath)}
                strokeWidth={isSelected || isPath ? 3 : 1}
                className="transition-all duration-200"
              />

              {!isExplored && (
                <text x="0" y="0" fontSize="10" fill="#222" textAnchor="middle" dy=".3em" className="pointer-events-none font-mono">
                  ?
                </text>
              )}

              {isVisible && (
                <g className="pointer-events-none">
                  {cell.resource !== 'NONE' && (
                    <g transform={`translate(${-HEX_SIZE / 2.5}, ${HEX_SIZE / 3})`}>
                      <circle r="6" fill="#000" fillOpacity="0.6" stroke="#555" strokeWidth="0.5" />
                      {getResourceIcon(cell.resource)}
                    </g>
                  )}

                  {cell.threatLevel === 'EXTREME' && (
                    <path
                      d={`M-${HEX_SIZE / 2} 0 L${HEX_SIZE / 2} 0`}
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      opacity="0.5"
                    />
                  )}

                  {cell.threatLevel !== 'SAFE' && (
                    <g transform={`translate(0, ${HEX_SIZE * 0.65})`}>
                      <rect
                        x="-6"
                        y="-2"
                        width="12"
                        height="3"
                        rx="1"
                        fill={getThreatColor(cell.threatLevel)}
                        className={cell.threatLevel === 'EXTREME' ? 'animate-pulse' : ''}
                      />
                    </g>
                  )}

                  {(cell.threatLevel === 'HIGH' || cell.threatLevel === 'EXTREME') && (
                    <text x={HEX_SIZE * 0.5} y={-HEX_SIZE * 0.5} fill={getThreatColor(cell.threatLevel)} fontSize="8" fontWeight="bold">
                      !
                    </text>
                  )}
                </g>
              )}

              {isExplored && viewState.scale > 1.2 && (
                <text
                  x="0"
                  y="-8"
                  fontSize="6"
                  fill="rgba(255,255,255,0.8)"
                  textAnchor="middle"
                  dy=".3em"
                  className="pointer-events-none font-mono font-bold drop-shadow-md select-none"
                >
                  {cell.q},{cell.r}
                </text>
              )}

              {(isHovered || isSelected) && isExplored && (
                <polygon
                  points={hexPoints}
                  fill="none"
                  stroke={isSelected ? '#00ff41' : 'white'}
                  strokeWidth="2"
                  opacity={isSelected ? 1 : 0.5}
                  className="pointer-events-none"
                />
              )}
            </g>
          )
        })}

        {(() => {
          const { x, y } = hexToPixel(gameState.player.position.q, gameState.player.position.r)
          return (
            <g transform={`translate(${x},${y})`} className="pointer-events-none filter drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]">
              <circle
                r={HEX_SIZE * 0.4}
                fill="none"
                stroke="#00ff41"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                className="animate-[spin_12s_linear_infinite]"
              />
              <circle r={HEX_SIZE * 0.25} fill="#0a0a0a" stroke="#00ff41" strokeWidth="2" />
              <text y="3" fill="#00ff41" fontSize="8" textAnchor="middle" className="font-mono font-bold">
                OP
              </text>
              <rect x="-12" y="-22" width="24" height="8" fill="#000" opacity="0.8" rx="2" />
              <text y="-16" fill="#00ff41" fontSize="6" textAnchor="middle" className="font-mono tracking-tighter">
                UNIT-1
              </text>
            </g>
          )
        })()}
      </motion.g>
    </svg>
  )
}
