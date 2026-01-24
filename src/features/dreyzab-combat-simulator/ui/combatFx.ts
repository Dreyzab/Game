import { CardType } from '@/entities/dreyzab-combat-simulator/model/types'

export type CardFxColors = {
    accent: string
    glow: string
    ring: string
}

const rgba = (r: number, g: number, b: number, a: number) => `rgba(${r}, ${g}, ${b}, ${a})`

export const getCardFxColors = (cardType: CardType): CardFxColors => {
    switch (cardType) {
        case CardType.ATTACK:
            return {
                accent: rgba(239, 68, 68, 0.9),
                glow: rgba(239, 68, 68, 0.6),
                ring: rgba(239, 68, 68, 0.35),
            }
        case CardType.MOVEMENT:
            return {
                accent: rgba(59, 130, 246, 0.9),
                glow: rgba(59, 130, 246, 0.6),
                ring: rgba(59, 130, 246, 0.35),
            }
        case CardType.DEFENSE:
            return {
                accent: rgba(16, 185, 129, 0.9),
                glow: rgba(16, 185, 129, 0.6),
                ring: rgba(16, 185, 129, 0.35),
            }
        case CardType.VOICE:
            return {
                accent: rgba(245, 158, 11, 0.9),
                glow: rgba(245, 158, 11, 0.6),
                ring: rgba(245, 158, 11, 0.35),
            }
        case CardType.ANALYSIS:
            return {
                accent: rgba(139, 92, 246, 0.9),
                glow: rgba(139, 92, 246, 0.6),
                ring: rgba(139, 92, 246, 0.35),
            }
        default:
            return {
                accent: rgba(148, 163, 184, 0.9),
                glow: rgba(148, 163, 184, 0.5),
                ring: rgba(148, 163, 184, 0.3),
            }
    }
}
