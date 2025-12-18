import type { Combatant } from '../../model/types'
import CombatantSprite from './CombatantSprite'

interface Props {
    combatant?: Combatant
    isTargeted?: boolean
    onTarget?: () => void
}

const RankLane = ({ combatant, isTargeted, onTarget }: Props) => {
    return (
        <div
            className={[
                'relative h-full flex flex-col transition-all duration-300',
                isTargeted ? 'ring-1 md:ring-2 ring-inset ring-red-500/40' : '',
            ].join(' ')}
        >
            <div className="flex-1 flex items-end justify-center pb-2 md:pb-4 relative">
                {combatant && <CombatantSprite combatant={combatant} isTargeted={isTargeted} onClick={onTarget} />}
            </div>

            <div className="h-10 md:h-14 bg-black/40 p-0.5 md:p-1 flex flex-col justify-end gap-0.5 md:gap-1">
                {combatant && !combatant.isDead ? (
                    <>
                        <div className="h-1 md:h-1.5 w-full bg-zinc-950 rounded-sm overflow-hidden border border-zinc-900">
                            <div
                                className="h-full bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.5)] transition-all duration-500"
                                style={{ width: `${(combatant.hp / combatant.maxHp) * 100}%` }}
                            />
                        </div>
                        <div className="h-1 md:h-1.5 w-full bg-zinc-950 rounded-sm overflow-hidden border border-zinc-900">
                            <div
                                className="h-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)] transition-all duration-500"
                                style={{ width: `${(combatant.stamina / combatant.maxStamina) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center px-0.5 font-mono scale-90 md:scale-100">
                            <span className="text-[6px] md:text-[7px] text-red-500/80 font-bold">H{combatant.hp}</span>
                            <span className="text-[6px] md:text-[7px] text-blue-400/80 font-bold">
                                W{Math.floor(combatant.stamina)}
                            </span>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    )
}

export default RankLane

