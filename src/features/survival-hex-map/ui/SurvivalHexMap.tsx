import { useCallback, useEffect, useMemo, useState } from 'react'
import { HexGrid } from './components/HexGrid'
import { HUD } from './components/HUD'
import { generateMap } from '../services/mapGenerator'
import { getHexDistance, getPath, hexToString } from '../utils/hexMath'
import type { GameState, HexCell, HexCoordinate } from '../types'

const MAP_RADIUS = 8
const INITIAL_AP = 5
const VIEW_RADIUS = 2

interface SurvivalHexMapProps {
  initialMap?: HexCell[]
}

export const SurvivalHexMap = ({ initialMap: providedMap }: SurvivalHexMapProps = {}) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedHex, setSelectedHex] = useState<HexCoordinate | null>(null)
  const [hoveredHex, setHoveredHex] = useState<HexCoordinate | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    // Use provided map or try to load from localStorage, otherwise generate random
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
  }, [])

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

  const handleHexClick = useCallback(
    (hex: HexCell) => {
      if (!gameState || isMoving) return

      if (selectedHex?.q === hex.q && selectedHex?.r === hex.r) {
        setSelectedHex(null)
        return
      }

      const isExplored = gameState.revealedHexes.has(`${hex.q},${hex.r}`)

      if (isExplored) {
        setSelectedHex(hex)
      }
    },
    [gameState, isMoving, selectedHex]
  )

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

  return (
    <div className="relative w-full h-full bg-terminal-black overflow-hidden font-mono text-sm">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#00ff41 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <HUD
        player={gameState.player}
        turn={gameState.turn}
        selectedHex={selectedHex}
        mapData={gameState.map}
        visibleHexes={visibleHexes}
        onMove={handleMove}
        onEndTurn={handleEndTurn}
      />

      <HexGrid
        gameState={gameState}
        selectedHex={selectedHex}
        hoveredHex={hoveredHex}
        visibleHexes={visibleHexes}
        setHoveredHex={setHoveredHex}
        onHexClick={handleHexClick}
      />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  )
}
