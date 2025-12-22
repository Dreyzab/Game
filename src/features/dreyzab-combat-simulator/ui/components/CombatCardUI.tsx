
import type { CSSProperties } from 'react'
import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Crosshair, Move, ShieldAlert, Zap, ChevronsUp, Activity } from 'lucide-react'
import type { CombatCard } from '../../model/types'
import { CardType } from '../../model/types'

interface Props extends Omit<HTMLMotionProps<'div'>, 'onClick'> {
    card: CombatCard
    disabled?: boolean
    onClick: () => void
    style?: CSSProperties
    className?: string
    isHighlighted?: boolean
}

const CombatCardUI = forwardRef<HTMLDivElement, Props>(({ card, disabled, onClick, style, className = '', isHighlighted, ...rest }, ref) => {
    const isAttack = card.type === CardType.ATTACK
    const isMove = card.type === CardType.MOVEMENT
    const isDefense = card.type === CardType.DEFENSE
    const isVoice = card.type === CardType.VOICE

    const borderColor = isAttack ? 'border-red-500' : isMove ? 'border-blue-500' : isDefense ? 'border-emerald-500' : 'border-amber-500'
    const shadowColor = isAttack ? 'shadow-red-900/40' : isMove ? 'shadow-blue-900/40' : isDefense ? 'shadow-emerald-900/40' : 'shadow-amber-900/40'
    const gradient = isAttack
        ? 'bg-gradient-to-b from-red-950/80 to-black'
        : isMove
            ? 'bg-gradient-to-b from-blue-950/80 to-black'
            : isDefense
                ? 'bg-gradient-to-b from-emerald-950/80 to-black'
                : 'bg-gradient-to-b from-amber-950/80 to-black'

    return (
        <motion.div
            ref={ref}
            {...rest}
            onClick={disabled ? undefined : onClick}
            data-card-id={card.id}
            style={style}
            animate={isHighlighted && !disabled ? { y: -60, scale: 1.2, zIndex: 100 } : {}}
            whileHover={!disabled ? { y: -20, scale: 1.1, zIndex: 100 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
                w-20 h-28 md:w-24 md:h-36 rounded-xl border-2 ${disabled ? 'border-zinc-800 grayscale opacity-40' : borderColor}
                ${gradient} backdrop-blur-md flex flex-col relative overflow-hidden shadow-2xl ${shadowColor}
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}
                ${isHighlighted && !disabled ? 'ring-4 ring-white/30 z-[100]' : ''}
            `}
        >
            {/* AP Cost Indicator (Original Style) */}
            <div className="absolute -top-1 -left-1 w-5 h-5 md:w-7 md:h-7 bg-amber-500 border-2 border-amber-300 rounded-full flex items-center justify-center z-20 shadow-lg">
                <span className="text-[9px] md:text-xs font-black text-black">{card.apCost}</span>
            </div>

            {/* WP Cost Indicator (Top Right - Requested) */}
            {card.staminaCost > 0 && (
                <div className="absolute top-1.5 right-1.5 z-20">
                    <span className="text-[7px] md:text-[9px] font-black text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                        WP {card.staminaCost}
                    </span>
                </div>
            )}

            {/* Illustration Area (Original Screen Style) */}
            <div className="h-12 md:h-20 bg-zinc-950/60 m-1 md:m-1.5 rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-inner">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-white/80 transition-transform duration-500 ${!disabled && 'group-hover:scale-110'}`}
                >
                    {isAttack && <Crosshair className="w-6 h-6 md:w-8 md:h-8 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
                    {isMove && <Move className="w-6 h-6 md:w-8 md:h-8 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                    {isDefense && <ShieldAlert className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />}
                    {isVoice && <Activity className="w-6 h-6 md:w-8 md:h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />}
                </motion.div>
            </div>

            {/* Content Footer */}
            <div className="px-1.5 pb-1.5 md:px-2 md:pb-2 flex-1 flex flex-col justify-between relative">
                <div>
                    <h4 className="text-[7px] md:text-[10px] font-black uppercase tracking-tight leading-none mb-1 text-zinc-100 truncate">
                        {card.name}
                    </h4>
                </div>

                <div className="flex items-end justify-between">
                    {card.damage > 0 && (
                        <div className="flex items-center gap-1 text-red-400">
                            <Zap size={10} className="md:w-3 md:h-3" />
                            <span className="text-[10px] md:text-xs font-black">{card.damage}</span>
                        </div>
                    )}

                    {card.optimalRange.length > 0 && (
                        <div className="text-[7px] md:text-[9px] text-zinc-500 font-mono">
                            RNG: {card.optimalRange.join(',')}
                        </div>
                    )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-1 opacity-10">
                    <ChevronsUp size={10} />
                </div>
            </div>

            {/* Glitch Overlay for disabled state */}
            {disabled && <div className="absolute inset-0 bg-zinc-950/20 z-20 pointer-events-none" />}
        </motion.div>
    )
})

export default CombatCardUI
