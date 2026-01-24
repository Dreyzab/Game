import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'
import CombatantSprite from './CombatantSprite'
import FloatingText from './FloatingText'
import type { FloatingTextEvent } from './FloatingText'

interface Props {
    combatant?: Combatant
    isTargeted?: boolean
    isActive?: boolean
    onTarget?: () => void
    events?: FloatingTextEvent[]
    activationPulse?: { id: string; color: string }
}

const RankLane = ({ combatant, isTargeted, isActive, onTarget, events = [], activationPulse }: Props) => {
    return (
        <div
            className={`
                relative h-full flex flex-col transition-all duration-300
                ${isTargeted ? 'ring-1 md:ring-2 ring-inset ring-red-500/40' : ''}
                ${isActive
                    ? combatant?.side === Side.PLAYER
                        ? 'ring-1 md:ring-2 ring-inset ring-blue-500/20'
                        : 'ring-1 md:ring-2 ring-inset ring-amber-500/20'
                    : ''
                }
            `}
        >
            <AnimatePresence>
                {activationPulse ? (
                    <motion.div
                        key={activationPulse.id}
                        className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="absolute inset-4 rounded-2xl"
                            style={{
                                border: `2px solid ${activationPulse.color}`,
                                boxShadow: `0 0 22px ${activationPulse.color}`,
                            }}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 0.8, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.15 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        />
                        <motion.div
                            className="absolute w-24 h-24 md:w-36 md:h-36 rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${activationPulse.color} 0%, transparent 70%)`,
                                mixBlendMode: 'screen',
                            }}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 0.9, scale: 1.35 }}
                            exit={{ opacity: 0, scale: 1.75 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        />
                    </motion.div>
                ) : null}
            </AnimatePresence>
            {/* Main Sprite Area */}
            <div className="flex-1 flex items-end justify-center relative dreyzab-lane-sprite-area">
                <FloatingText events={events} />
                {combatant && (
                    <CombatantSprite
                        combatant={combatant}
                        isTargeted={isTargeted}
                        onClick={onTarget}
                    />
                )}
            </div>

        </div>
    )
}

export default memo(RankLane)
