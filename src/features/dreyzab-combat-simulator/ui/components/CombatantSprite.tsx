import { useMemo } from 'react'
import type { Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'
import { resolveUnitAsset } from '../../lib/resolveUnitAsset'
import { toClampedPercent } from './combatUiMath'

interface Props {
    combatant: Combatant
    isTargeted?: boolean
    onClick?: () => void
}

const CombatantSprite = ({ combatant, isTargeted, onClick }: Props) => {
    const fallbackSrc = useMemo(() => {
        return combatant.side === Side.PLAYER
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=operator${combatant.id}&backgroundColor=transparent&style=straight`
            : `https://api.dicebear.com/7.x/bottts/svg?seed=enemy${combatant.id}&backgroundColor=transparent`
    }, [combatant.id, combatant.side])

    const preferredSrc = useMemo(() => {
        return resolveUnitAsset(combatant, 'sprite')
    }, [combatant])

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
                <div className="absolute top-1 md:top-2 left-1/2 -translate-x-1/2 animate-pulse z-30">
                    <div className="w-4 h-4 md:w-6 md:h-6 border md:border-2 border-red-500 rounded-full flex items-center justify-center">
                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-red-500 rounded-full" />
                    </div>
                </div>
            )}

            {/* Status Indicators (Moved Above Sprite) */}
            {!combatant.isDead && (
                <div className="absolute top-10 md:top-12 left-1/2 -translate-x-1/2 w-24 md:w-28 bg-black/60 p-0.5 rounded border border-white/5 flex flex-col gap-0.5 z-20 shadow-xl">
                    {/* HP Bar */}
                    <div className="h-0.5 w-full bg-zinc-950 rounded-px overflow-hidden">
                        <div
                            className="h-full bg-red-600 transition-all duration-500"
                            style={{ width: `${toClampedPercent(combatant.resources.hp, combatant.resources.maxHp)}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center px-0.5 font-mono text-[8px] md:text-[9px] leading-none">
                        <span className="text-red-400 font-bold">H{combatant.resources.hp}</span>

                    </div>
                </div>
            )}

            <div className="w-[12.25rem] h-[21rem] md:w-[17.5rem] md:h-[31.5rem] relative overflow-hidden flex items-end justify-center">
                <img
                    src={preferredSrc}
                    alt={combatant.name}
                    className={['h-full object-contain', combatant.side === Side.ENEMY ? 'scale-x-[-1]' : ''].join(' ')}
                    onError={(e) => {
                        // If local sprite fails (case mismatch/missing file), fall back to Dicebear.
                        const img = e.currentTarget
                        if (img.src !== fallbackSrc) {
                            img.src = fallbackSrc
                        }
                    }}
                />
            </div>

            <div className="w-[6.125rem] h-[1.3125rem] md:w-[8.75rem] md:h-[1.75rem] bg-black/40 rounded-[100%] blur-sm -mt-4 md:-mt-6" />

            <span className="text-[10px] md:text-[12px] mt-2 md:mt-3 font-bold text-zinc-500 uppercase tracking-tighter bg-black/40 px-2 md:px-3 rounded truncate max-w-[190px] md:max-w-none">
                {combatant.name}
            </span>
        </div>
    )
}

export default CombatantSprite
