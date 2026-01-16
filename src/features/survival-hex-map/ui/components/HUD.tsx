import type { HexCell, HexCoordinate, SurvivalPlayer } from '../../types'
import { getHexDistance, hexToString } from '../../utils/hexMath'
import { InspectorPanel } from './InspectorPanel'

interface HUDProps {
  player: SurvivalPlayer
  turn: number
  selectedHex: HexCoordinate | null
  mapData: HexCell[]
  visibleHexes: Set<string>
  onMove: () => void | Promise<void>
  onEndTurn: () => void
  movementStatus?: {
    destination: HexCoordinate
    etaSeconds: number | null
  } | null
  movementPool?: {
    current: number
    max: number
    label: string
  }
  movementStats?: {
    distance: number
    moveCost: number
    isReachable: boolean
    moveCostUnit?: string
  } | null
}

function formatEta(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

export const HUD = ({
  player,
  turn,
  selectedHex,
  mapData,
  visibleHexes,
  onMove,
  onEndTurn,
  movementStatus,
  movementPool,
  movementStats,
}: HUDProps) => {
  const selectedCell = selectedHex ? mapData.find((h) => h.q === selectedHex.q && h.r === selectedHex.r) : null
  const dist = selectedHex ? getHexDistance(player.position, selectedHex) : 0
  const moveCost = dist
  const isVisible = selectedHex ? visibleHexes.has(hexToString(selectedHex)) : false
  const pool = movementPool ?? { current: player.ap, max: player.maxAp, label: 'ACTION_PTS' }
  const movementDistance = movementStats?.distance ?? dist
  const movementCost = movementStats?.moveCost ?? moveCost
  const movementReachable = movementStats?.isReachable ?? true
  const moveCostUnit = movementStats?.moveCostUnit ?? (pool.label === 'STAMINA' ? 'STAMINA' : 'AP')
  const poolPercent = pool.max > 0 ? Math.min(100, (pool.current / pool.max) * 100) : 0

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
        <div className="bg-terminal-black/80 border border-hex-border backdrop-blur-sm p-4 rounded text-terminal-green pointer-events-auto">
          <h1 className="text-xl font-bold tracking-widest mb-2">HEX_SURVIVAL_OS v0.9</h1>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">TURN_CYCLE</span>
              <span className="text-lg">{turn.toString().padStart(4, '0')}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">COORDINATES</span>
              <span className="text-lg">
                {player.position.q}, {player.position.r}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 w-64 pointer-events-auto">
        <div className="bg-terminal-black/90 border-l-4 border-terminal-green p-4 backdrop-blur-sm shadow-lg shadow-green-900/10">
          <h3 className="text-terminal-dim text-xs font-bold mb-3 uppercase tracking-wider">Operator Status</h3>

          {movementStatus && (
            <div className="mb-4 border border-cyan-500/30 bg-cyan-950/20 rounded p-2">
              <div className="text-[10px] text-cyan-300 uppercase tracking-widest">Movement</div>
              <div className="text-xs text-white">
                В пути → ({movementStatus.destination.q}, {movementStatus.destination.r})
              </div>
              <div className="text-[10px] text-cyan-200/80 font-mono">
                ETA: {movementStatus.etaSeconds === null ? '…' : formatEta(movementStatus.etaSeconds)}
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-terminal-green">{pool.label}</span>
              <span className="text-white">
                {pool.current} / {pool.max}
              </span>
            </div>
            <div className="h-2 bg-gray-800 w-full rounded-sm overflow-hidden">
              <div className="h-full bg-terminal-green transition-all duration-300" style={{ width: `${poolPercent}%` }} />
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-400">INTEGRITY</span>
              <span className="text-white">{player.health}%</span>
            </div>
            <div className="h-2 bg-gray-800 w-full rounded-sm overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${player.health}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 flex flex-col gap-4 items-end pointer-events-auto">
        {selectedCell && (
          <InspectorPanel
            cell={selectedCell}
            visible={isVisible}
            distance={movementDistance}
            moveCost={movementCost}
            playerAp={pool.current}
            isReachable={movementReachable}
            moveCostUnit={moveCostUnit}
            onMove={onMove}
          />
        )}

        <button
          onClick={onEndTurn}
          className="bg-gray-900 border border-gray-600 text-gray-300 hover:border-white hover:text-white py-3 px-6 text-sm font-bold tracking-wider transition-all"
        >
          END TURN CYCLE
        </button>
      </div>
    </>
  )
}
