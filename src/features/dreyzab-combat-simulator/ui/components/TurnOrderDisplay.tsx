import type { Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'
import { toClampedPercent } from './combatUiMath'

type TurnOrderDisplayProps = {
    turnQueue: string[]
    players: Combatant[]
    enemies: Combatant[]
    activeUnitId: string | null
    resolvePortrait: (unit: Combatant) => string
}

const TurnOrderDisplay = ({ turnQueue, players, enemies, activeUnitId, resolvePortrait }: TurnOrderDisplayProps) => {
    const allUnits = [...players, ...enemies]

    return (
        <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none flex flex-col items-center">
            <div className="flex items-start gap-1 p-1 bg-black/60 backdrop-blur-md border-x border-b border-white/10 rounded-b-2xl shadow-2xl pointer-events-auto overflow-x-auto max-w-[calc(100%-120px)] no-scrollbar">
                {turnQueue.map((id) => {
                    const unit = allUnits.find((u) => u.id === id)
                    if (!unit || unit.isDead) return null
                    const isActive = activeUnitId === id
                    const isPlayer = unit.side === Side.PLAYER
                    return (
                        <div key={id} className={`flex flex-col transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-40 grayscale scale-90'}`}>
                            <div className={`relative w-9 h-9 md:w-14 md:h-14 bg-zinc-950 border-2 overflow-hidden rounded-lg shadow-xl ${isActive ? (isPlayer ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-red-600 ring-1 ring-red-600/30') : 'border-zinc-800'}`}>
                                <img
                                    src={resolvePortrait(unit)}
                                    className="w-full h-full object-cover"
                                    alt="portrait"
                                />
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-zinc-900">
                                    <div className="h-full bg-red-600" style={{ width: `${toClampedPercent(unit.resources.hp, unit.resources.maxHp)}%` }} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default TurnOrderDisplay
