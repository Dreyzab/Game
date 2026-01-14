import type { HexCell, HexCoordinate, ResourceType, SurvivalPlayer } from '../../types'
import { getHexDistance, hexToString } from '../../utils/hexMath'
import { getPossibleLoot } from '../../data/lootTables'

interface HUDProps {
  player: SurvivalPlayer
  turn: number
  selectedHex: HexCoordinate | null
  mapData: HexCell[]
  visibleHexes: Set<string>
  onMove: () => void
  onEndTurn: () => void
}

export const HUD = ({ player, turn, selectedHex, mapData, visibleHexes, onMove, onEndTurn }: HUDProps) => {
  const selectedCell = selectedHex ? mapData.find((h) => h.q === selectedHex.q && h.r === selectedHex.r) : null
  const dist = selectedHex ? getHexDistance(player.position, selectedHex) : 0
  const moveCost = dist

  const isVisible = selectedHex ? visibleHexes.has(hexToString(selectedHex)) : false

  const getResourceLabel = (type: ResourceType) => {
    switch (type) {
      case 'SCRAP':
        return <span className="text-gray-400">SCRAP HEAP</span>
      case 'FOOD':
        return <span className="text-green-400">GAME TRAIL</span>
      case 'WATER':
        return <span className="text-blue-400">WATER SOURCE</span>
      case 'FUEL':
        return <span className="text-orange-400">FUEL DEPOT</span>
      case 'TECH':
        return <span className="text-purple-400">TECH CACHE</span>
      default:
        return <span className="text-gray-600">NONE</span>
    }
  }

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

          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-terminal-green">ACTION_PTS</span>
              <span className="text-white">
                {player.ap} / {player.maxAp}
              </span>
            </div>
            <div className="h-2 bg-gray-800 w-full rounded-sm overflow-hidden">
              <div className="h-full bg-terminal-green transition-all duration-300" style={{ width: `${(player.ap / player.maxAp) * 100}%` }} />
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
          <div className="bg-terminal-black/90 border border-hex-border p-4 w-64 backdrop-blur-sm mb-2 text-right">
            <h4 className="text-white font-bold mb-1 uppercase tracking-wider">{selectedCell.biome}</h4>

            {isVisible ? (
              <>
                <div className="flex justify-end items-center gap-2 mb-2 text-sm font-mono border-b border-gray-800 pb-2">
                  <span className="text-gray-500 text-xs">DETECTED:</span>
                  {getResourceLabel(selectedCell.resource)}
                </div>

                <div className="mb-2">
                  <span className="text-gray-500 text-xs block mb-1">POSSIBLE FINDS:</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {getPossibleLoot(selectedCell.biome, selectedCell.resource).map((item) => (
                      <span key={item} className="text-[10px] bg-gray-800 text-gray-300 px-1 py-0.5 rounded border border-gray-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-2">
                  THREAT:{' '}
                  <span className={selectedCell.threatLevel === 'SAFE' ? 'text-green-400' : 'text-red-400'}>
                    {selectedCell.threatLevel}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-end gap-1 mb-3 border-b border-gray-800 pb-2">
                <div className="text-yellow-600 font-bold text-xs animate-pulse">SIGNAL LOST</div>
                <div className="text-gray-500 text-xs italic">Move closer to scan</div>
              </div>
            )}

            <div className="text-xs text-gray-500 mb-4">
              DISTANCE: {dist * 25}m | COST: {moveCost} AP
            </div>

            <button
              onClick={onMove}
              disabled={player.ap < moveCost}
              className={`w-full py-2 px-4 text-sm font-bold border transition-colors ${player.ap >= moveCost
                ? 'bg-terminal-green/10 border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black'
                : 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                }`}
            >
              {player.ap >= moveCost ? 'INITIATE MOVEMENT' : 'INSUFFICIENT AP'}
            </button>
          </div>
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
