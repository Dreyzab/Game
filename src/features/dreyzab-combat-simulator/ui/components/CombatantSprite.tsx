import type { Combatant } from '../../model/types'
import { Side } from '../../model/types'

interface Props {
    combatant: Combatant
    isTargeted?: boolean
    onClick?: () => void
}

const CombatantSprite = ({ combatant, isTargeted, onClick }: Props) => {
    return (
        <div
            onClick={onClick}
            className={[
                'relative flex flex-col items-center transition-all duration-300 cursor-pointer',
                combatant.isDead ? 'opacity-30 grayscale blur-[1px]' : 'hover:scale-105',
                isTargeted ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : '',
            ].join(' ')}
        >
            {isTargeted && !combatant.isDead && (
                <div className="absolute -top-12 md:-top-16 animate-pulse z-30">
                    <div className="w-4 h-4 md:w-6 md:h-6 border md:border-2 border-red-500 rounded-full flex items-center justify-center">
                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-red-500 rounded-full" />
                    </div>
                </div>
            )}

            {/* Status Indicators (Moved Above Sprite) */}
            {!combatant.isDead && (
                <div className="absolute -top-8 md:-top-10 w-16 md:w-20 bg-black/60 p-0.5 rounded border border-white/5 flex flex-col gap-0.5 z-20 shadow-xl">
                    {/* HP Bar */}
                    <div className="h-1 w-full bg-zinc-950 rounded-px overflow-hidden">
                        <div
                            className="h-full bg-red-600 transition-all duration-500"
                            style={{ width: `${(combatant.resources.hp / combatant.resources.maxHp) * 100}%` }}
                        />
                    </div>
                    {/* WP Bar */}
                    <div className="h-1 w-full bg-zinc-950 rounded-px overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${(combatant.resources.wp / combatant.resources.maxWp) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center px-0.5 font-mono text-[5px] md:text-[6px] leading-none">
                        <span className="text-red-400 font-bold">H{combatant.resources.hp}</span>
                        <span className="text-blue-300 font-bold">W{Math.floor(combatant.resources.wp)}</span>
                    </div>
                </div>
            )}

            <div className="w-14 h-24 md:w-20 md:h-36 relative overflow-hidden flex items-end justify-center">
                <img
                    src={
                        combatant.side === Side.PLAYER
                            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=operator${combatant.id}&backgroundColor=transparent&style=straight`
                            : `https://api.dicebear.com/7.x/bottts/svg?seed=enemy${combatant.id}&backgroundColor=transparent`
                    }
                    alt={combatant.name}
                    className={['h-full object-contain', combatant.side === Side.ENEMY ? 'scale-x-[-1]' : ''].join(' ')}
                />
            </div>

            <div className="w-8 h-2 md:w-12 md:h-3 bg-black/40 rounded-[100%] blur-sm -mt-1 md:-mt-2" />

            <span className="text-[6px] md:text-[8px] mt-0.5 md:mt-1 font-bold text-zinc-500 uppercase tracking-tighter bg-black/40 px-1 md:px-1.5 rounded truncate max-w-[50px] md:max-w-none">
                {combatant.name}
            </span>
        </div>
    )
}

export default CombatantSprite

