import type { HexCell, ResourceType } from '../../types'
import { getPossibleLoot } from '../../data/lootTables'
import { cn } from '@/shared/lib/utils/cn'

interface InspectorPanelProps {
    cell: HexCell
    visible: boolean
    distance: number
    moveCost: number
    playerAp: number
    onMove: () => void | Promise<void>
    isReachable?: boolean
    moveCostUnit?: string
}

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

export function InspectorPanel({
    cell,
    visible,
    distance,
    moveCost,
    playerAp,
    onMove,
    isReachable,
    moveCostUnit,
}: InspectorPanelProps) {
    const reachable = isReachable !== undefined ? isReachable : true
    const alreadyHere = distance === 0
    const hasPath = reachable && !alreadyHere && !cell.isObstacle
    const canAfford = playerAp >= moveCost
    const canMove = hasPath && canAfford
    const unitLabel = moveCostUnit ?? 'AP'
    const costLabel = hasPath ? `${moveCost} ${unitLabel}` : '--'
    const moveLabel = cell.isObstacle
        ? 'PATH BLOCKED'
        : alreadyHere
            ? 'ALREADY HERE'
            : !reachable
                ? 'NO PATH'
                : canAfford
                    ? 'INITIATE MOVEMENT'
                    : (unitLabel === 'STAMINA' ? 'INSUFFICIENT STAMINA' : 'INSUFFICIENT AP')

    return (
        <div className="bg-terminal-black/95 border border-terminal-green/30 backdrop-blur-md p-4 w-72 rounded-lg shadow-xl shadow-black/50 transition-all animate-in slide-in-from-right-4 duration-300">
            {/* Header with Coords and Biome */}
            <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
                <div>
                    <h4 className="text-white font-bold uppercase tracking-wider text-sm">{cell.biome}</h4>
                    <div className="text-terminal-dim text-xs font-mono mt-0.5">
                        [{cell.q}, {cell.r}]
                    </div>
                </div>
                <div className="text-right">
                    {cell.isObstacle ? (
                        <span className="text-red-500 text-[10px] font-bold border border-red-500/50 px-1 py-0.5 rounded">BLOCKED</span>
                    ) : (
                        <span className="text-terminal-green text-[10px] border border-terminal-green/50 px-1 py-0.5 rounded">
                            ELEV: {cell.elevation}
                        </span>
                    )}
                </div>
            </div>

            {visible ? (
                <>
                    {/* Resources */}
                    <div className="flex justify-between items-center gap-2 mb-3 text-sm font-mono bg-white/5 p-2 rounded">
                        <span className="text-gray-500 text-xs">DETECTED:</span>
                        {getResourceLabel(cell.resource)}
                    </div>

                    {/* Threat & Loot */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white/5 p-2 rounded">
                            <span className="text-gray-500 text-[10px] block mb-1">THREAT LEVEL</span>
                            <span className={cn(
                                "text-xs font-bold",
                                cell.threatLevel === 'SAFE' ? 'text-green-400' :
                                    cell.threatLevel === 'EXTREME' ? 'text-red-500 animate-pulse' : 'text-orange-400'
                            )}>
                                {cell.threatLevel}
                            </span>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                            <span className="text-gray-500 text-[10px] block mb-1">POSSIBLE LOOT</span>
                            <div className="flex flex-wrap gap-1">
                                {getPossibleLoot(cell.biome, cell.resource).slice(0, 3).map((item) => (
                                    <span key={item} className="text-[10px] text-gray-300 truncate max-w-full">
                                        • {item}
                                    </span>
                                ))}
                                {getPossibleLoot(cell.biome, cell.resource).length > 3 && (
                                    <span className="text-[10px] text-gray-500">+ more</span>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center gap-2 mb-4 py-4 border-b border-dashed border-gray-700 bg-yellow-900/10 rounded">
                    <div className="text-yellow-500 font-bold text-xs animate-pulse">⚠ SIGNAL LOST</div>
                    <div className="text-gray-500 text-xs italic">Move closer to scan sector</div>
                </div>
            )}

            {/* Movement Control */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 px-1">
                    <span>DISTANCE: {(distance * 25).toFixed(0)}m</span>
                    <span className={cn(canMove ? "text-terminal-green" : "text-red-400")}>
                        COST: {costLabel}
                    </span>
                </div>

                <button
                    onClick={onMove}
                    disabled={!canMove}
                    className={cn(
                        "w-full py-2.5 px-4 text-xs font-bold border rounded transition-all active:scale-95",
                        canMove
                            ? "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                            : "bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed"
                    )}
                >
                    {moveLabel}
                </button>
            </div>
        </div>
    )
}
