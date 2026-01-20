
import type { CSSProperties } from 'react'
import { forwardRef } from 'react'
import { motion, type HTMLMotionProps, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Crosshair, Move, ShieldAlert, Zap, Activity, Skull, Eye } from 'lucide-react'
import type { CombatCard } from '@/entities/dreyzab-combat-simulator/model/types'
import { CardType } from '@/entities/dreyzab-combat-simulator/model/types'

interface Props extends Omit<HTMLMotionProps<'div'>, 'onClick'> {
    card: CombatCard
    disabled?: boolean
    onClick: () => void
    style?: CSSProperties
    className?: string
    isHighlighted?: boolean
}

const CombatCardUI = forwardRef<HTMLDivElement, Props>(({ card, disabled, onClick, style, className = '', isHighlighted, ...rest }, ref) => {
    // --- 3D Tilt Logic ---
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15])
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15])
    const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100])
    const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return
        const rect = e.currentTarget.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        const mouseXFromCenter = e.clientX - rect.left - width / 2
        const mouseYFromCenter = e.clientY - rect.top - height / 2
        x.set(mouseXFromCenter / width)
        y.set(mouseYFromCenter / height)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    // --- Visual Identity ---
    const isAttack = card.type === CardType.ATTACK
    const isMove = card.type === CardType.MOVEMENT
    const isDefense = card.type === CardType.DEFENSE
    const isVoice = card.type === CardType.VOICE
    const isAnalysis = card.type === CardType.ANALYSIS

    // Base Colors (Premium Gradients)
    let containerClass = ''
    let borderClass = ''
    let iconColor = ''
    let glowColor = ''
    const highlightClass = isHighlighted ? 'ring-2 ring-amber-400/70' : ''

    if (isAttack) {
        containerClass = 'bg-gradient-to-br from-red-950/90 via-black/80 to-red-950/90'
        borderClass = 'border-red-500/50'
        iconColor = 'text-red-500'
        glowColor = 'shadow-red-500/20'
    } else if (isMove) {
        containerClass = 'bg-gradient-to-br from-blue-950/90 via-black/80 to-blue-950/90'
        borderClass = 'border-blue-500/50'
        iconColor = 'text-blue-500'
        glowColor = 'shadow-blue-500/20'
    } else if (isDefense) {
        containerClass = 'bg-gradient-to-br from-emerald-950/90 via-black/80 to-emerald-950/90'
        borderClass = 'border-emerald-500/50'
        iconColor = 'text-emerald-500'
        glowColor = 'shadow-emerald-500/20'
    } else if (isVoice) {
        containerClass = 'bg-gradient-to-br from-amber-950/90 via-black/80 to-amber-950/90'
        borderClass = 'border-amber-500/50'
        iconColor = 'text-amber-500'
        glowColor = 'shadow-amber-500/20'
    } else if (isAnalysis) {
        containerClass = 'bg-gradient-to-br from-purple-950/90 via-black/80 to-purple-950/90'
        borderClass = 'border-purple-500/50'
        iconColor = 'text-purple-500'
        glowColor = 'shadow-purple-500/20'
    } else {
        containerClass = 'bg-zinc-900/90'
        borderClass = 'border-zinc-700/50'
        iconColor = 'text-zinc-500'
        glowColor = 'shadow-zinc-500/20'
    }

    return (
        <motion.div
            ref={ref}
            {...rest}
            onClick={disabled ? undefined : onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                rotateX: disabled ? 0 : rotateX,
                rotateY: disabled ? 0 : rotateY,
                transformStyle: 'preserve-3d',
                perspective: 1000
            }}
            whileHover={!disabled ? { scale: 1.05, zIndex: 50 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`
                relative w-32 h-48 rounded-xl border-2 backdrop-blur-md flex flex-col overflow-hidden shadow-2xl
                ${disabled ? 'grayscale opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-950' : `${borderClass} ${containerClass} ${glowColor} cursor-pointer`}
                ${highlightClass}
                ${className}
                group
            `}
        >
            {/* Dynamic Glare Effect */}
            {!disabled && (
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 80%)',
                        x: glareX, // Parallax the glare slightly
                        y: glareY,
                        opacity: 0.6,
                        pointerEvents: 'none',
                        zIndex: 10
                    }}
                />
            )}

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0 mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />

            {/* Header: AP Cost & Name */}
            <div className="relative z-20 flex justify-between items-start p-2 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-amber-500/90 text-black font-black flex items-center justify-center text-xs shadow-lg shadow-amber-500/40 border border-amber-300">
                        {card.apCost}
                        {/* Tiny 'AP' label */}
                        <span className="absolute -bottom-1 -right-1 text-[6px] text-amber-500 bg-black px-0.5 rounded border border-amber-900">AP</span>
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-xs font-bold leading-none uppercase tracking-wide text-zinc-100 font-mono">
                        {card.name.split(' ').map((word, i) => (
                            <span key={i} className="block">{word}</span>
                        ))}
                    </h3>
                </div>
            </div>

            {/* Illustration Area (Icon + Effects) */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10`} />

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    {/* Horizontal Scanlines */}
                    <div className="w-full h-full bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
                </div>

                <motion.div
                    className={`${iconColor} drop-shadow-[0_0_15px_currentColor] z-10`}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
                >
                    {isAttack && <Crosshair size={48} strokeWidth={1.5} />}
                    {isMove && <Move size={48} strokeWidth={1.5} />}
                    {isDefense && <ShieldAlert size={48} strokeWidth={1.5} />}
                    {isVoice && <Activity size={48} strokeWidth={1.5} />}
                    {isAnalysis && <Eye size={48} strokeWidth={1.5} />}
                </motion.div>

                {/* Floating particles or decorative elements could go here */}
            </div>

            {/* Body: Stats & Info */}
            <div className="relative z-20 bg-black/40 backdrop-blur-sm p-2 border-t border-white/5 flex flex-col gap-1">
                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex flex-col">
                        <span className="text-[7px] text-zinc-500 uppercase">Stamina</span>
                        <span className="text-blue-400 font-bold">{card.staminaCost}</span>
                    </div>

                    {card.damage > 0 && (
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-zinc-500 uppercase">Damage</span>
                            <div className="flex items-center gap-0.5 text-red-500 font-bold">
                                {card.damage} <Zap size={10} fill="currentColor" />
                            </div>
                        </div>
                    )}

                    {card.impact > 0 && (
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-zinc-500 uppercase">Impact</span>
                            <div className="flex items-center gap-0.5 text-yellow-500 font-bold">
                                {card.impact} <Skull size={10} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Range Indication */}
                {card.optimalRange.length > 0 && (
                    <div className="flex gap-0.5 mt-1 justify-center opacity-80">
                        {[1, 2, 3, 4].map(r => (
                            <div
                                key={r}
                                className={`w-full h-1 rounded-full ${card.optimalRange.includes(r) ? (isAttack ? 'bg-red-500 shadow-[0_0_4px_red]' : 'bg-zinc-500') : 'bg-zinc-800'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-30" />
        </motion.div>
    )
})

export default CombatCardUI
