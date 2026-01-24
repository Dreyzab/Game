import type { Combatant } from '@/entities/dreyzab-combat-simulator/model/types'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'

type AssetMode = 'portrait' | 'sprite'

const resolveCommonAsset = (unit: Combatant, id: string, name: string): string | null => {
    if (unit.side === Side.PLAYER && (id === 'p1' || name === 'player')) return '/images/characters/Player.png'
    if (unit.side === Side.PLAYER && (id === 'npc_cond' || name.includes('conductor') || name.includes('Ñ¨¥?ÑóÑýÑóÑïÑ«Ñ÷Ñ§'))) return '/images/npcs/Provodnik.png'

    if (id.includes('bruno') || name.includes('bruno')) return '/images/characters/Bruno.png'
    if (id.includes('lena') || name.includes('lena')) return '/images/characters/Lena.png'
    if (id.includes('otto') || name.includes('otto')) return '/images/characters/Otto.png'
    if (id.includes('adel') || id.includes('adele') || name.includes('adel')) return '/images/characters/Adel.png'

    if (unit.side === Side.ENEMY && name.includes('mutant marauder')) return '/images/enemy/melkiyShuk.png'
    if (unit.side === Side.ENEMY && name.includes('biomorph scout')) return '/images/enemy/biomorph_scout.png'
    if (unit.side === Side.ENEMY && (id === 'boss' || name.includes('executioner'))) return '/images/enemy/BossPalach.png'

    return null
}

const resolvePortraitAsset = (unit: Combatant, id: string, name: string): string | null => {
    const common = resolveCommonAsset(unit, id, name)
    if (common) return common

    if (unit.side === Side.ENEMY && name.includes('rail scorpion')) return "/images/enemy/Ñ'ÑóÑ¯Ñ­Ñ§Ñó¥?.png"
    if (unit.side === Side.ENEMY && name.includes("Ñ¬ÑøÑ¯") && name.includes("¥?Ñ§Ñó¥?")) return "/images/enemy/ÑoÑøÑ¯Ñ­Ñ§Ñó¥?.png"
    if (unit.side === Side.ENEMY && name.includes("¥?¥?ÑæÑï") && name.includes("¥?Ñ§Ñó¥?")) return "/images/enemy/Ñ­¥?ÑæÑïÑ­Ñ§Ñó¥?.png"

    return null
}

const resolveSpriteAsset = (unit: Combatant, id: string, name: string): string | null => {
    return resolveCommonAsset(unit, id, name)
}

export const resolveUnitAsset = (unit: Combatant, mode: AssetMode): string => {
    const id = unit.id.toLowerCase()
    const name = unit.name.toLowerCase()

    const localAsset = mode === 'portrait'
        ? resolvePortraitAsset(unit, id, name)
        : resolveSpriteAsset(unit, id, name)

    if (localAsset) return localAsset

    return unit.side === Side.PLAYER
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=operator${unit.id}&backgroundColor=transparent&style=straight`
        : `https://api.dicebear.com/7.x/bottts/svg?seed=enemy${unit.id}&backgroundColor=transparent`
}
