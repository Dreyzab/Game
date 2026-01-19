import { memo } from 'react'
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
}

const RankLane = ({ combatant, isTargeted, isActive, onTarget, events = [] }: Props) => {
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
