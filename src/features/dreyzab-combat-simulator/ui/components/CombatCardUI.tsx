import type { CSSProperties } from 'react'
import { Crosshair, Move, Radio, ShieldAlert, Zap } from 'lucide-react'
import type { CombatCard } from '../../model/types'
import { CardType } from '../../model/types'

interface Props {
    card: CombatCard
    disabled?: boolean
    onClick: () => void
    style?: CSSProperties
    className?: string
}

const CombatCardUI = ({ card, disabled, onClick, style, className = '' }: Props) => {
    const getIcon = () => {
        const size = window.innerWidth < 768 ? 18 : 24
        switch (card.type) {
            case CardType.ATTACK:
                return <Crosshair size={size} className="text-red-500" />
            case CardType.MOVEMENT:
                return <Move size={size} className="text-blue-500" />
            case CardType.DEFENSE:
                return <ShieldAlert size={size} className="text-green-500" />
            default:
                return <Zap size={size} className="text-yellow-500" />
        }
    }

    return (
        <div
            onClick={disabled ? undefined : onClick}
            style={style}
            className={[
                'w-24 h-32 md:w-28 md:h-40 bg-[#2a2a24] border-2 border-[#3d3d35] rounded-lg flex flex-col p-1.5 shadow-2xl transition-all relative',
                disabled ? 'opacity-40 grayscale pointer-events-none' : 'cursor-pointer hover:border-amber-600 hover:z-50',
                className,
            ].join(' ')}
        >
            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 md:w-7 md:h-7 bg-amber-600 border border-amber-300 rounded-full flex items-center justify-center z-20 shadow-lg">
                <span className="text-[9px] md:text-[12px] font-black text-black">{card.apCost}</span>
            </div>

            <div className="h-12 md:h-20 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center mb-1 overflow-hidden relative">
                <div className="absolute top-0.5 right-0.5 opacity-20">
                    <Radio size={8} />
                </div>
                {getIcon()}
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <h4 className="text-[8px] md:text-[11px] font-bold leading-tight uppercase tracking-tighter truncate text-zinc-300">
                    {card.name}
                </h4>
                <div className="flex justify-between items-end mt-1">
                    <div className="flex flex-col">
                        <span className="text-[7px] md:text-[9px] text-blue-400 font-bold">W{card.staminaCost}</span>
                        {card.damage > 0 && (
                            <span className="text-[7px] md:text-[9px] text-red-500 font-bold">D{card.damage}</span>
                        )}
                    </div>
                    <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[7px] md:text-[9px] border border-zinc-700">
                        {card.type[0].toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-0.5 mt-1 opacity-20">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-0.5 bg-zinc-500 rounded-px" />
                ))}
            </div>
        </div>
    )
}

export default CombatCardUI

