import type { Combatant, CombatCard } from './types'
import { generateWeaponCardsForWeaponId } from './weaponCards'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'

export function generateDeckForCombatant(combatant: Combatant): CombatCard[] {
  const hand: CombatCard[] = []

  // 1. Base Movement Cards (Always available if not immobilized - logic can be refined later)
  hand.push(
    {
      id: `${combatant.id}_move_adv`,
      ownerId: combatant.id,
      name: 'Advance',
      type: 'movement', // Cast string to CardType if needed, but strings usually work if types match
      apCost: 1,
      staminaCost: 5,
      damage: 0,
      effects: [],
      optimalRange: [],
      description: 'Move forward',
      jamChance: 0,
    } as CombatCard,
    {
      id: `${combatant.id}_move_ret`,
      ownerId: combatant.id,
      name: 'Retreat',
      type: 'movement',
      apCost: 1,
      staminaCost: 5,
      damage: 0,
      effects: [],
      optimalRange: [],
      description: 'Move backward',
      jamChance: 0,
    } as CombatCard
  )

  // 2. Equipment Cards
  const equipment = combatant.equipment ?? []

  equipment.forEach((itemId) => {
    const template = ITEM_TEMPLATES[itemId]
    if (!template) return // Skip invalid items

    // Use base stats from template or default to 10
    const baseDmg = template.baseStats?.damage ?? 10

    // Generate cards
    // generated IDs are unique enough, but we can ensure owner binding
    const cards = generateWeaponCardsForWeaponId(itemId, {
      baseDamage: baseDmg,
      idPrefix: `${combatant.id}_${itemId}`
    })

    cards.forEach((c) => {
      hand.push({
        id: c.id,
        ownerId: combatant.id,
        name: c.name,
        type: c.type,
        apCost: c.apCost,
        staminaCost: c.staminaCost,
        damage: c.damage,
        damageType: c.damageType,
        optimalRange: c.optimalRange,
        effects: c.effects,
        description: c.description,
        jamChance: c.jamChance,
      })
    })
  })

  // 3. Fallback (Fist) if no Attack cards
  // Check if we have any card with type 'attack'
  const hasAttack = hand.some(c => c.type === 'attack')
  if (!hasAttack) {
    hand.push({
      id: `${combatant.id}_fist`,
      ownerId: combatant.id,
      name: 'Fist',
      type: 'attack', // explicit cast or string
      apCost: 1,
      staminaCost: 5,
      damage: 2,
      optimalRange: [1],
      description: 'Punch.',
      jamChance: 0,
      effects: []
    } as CombatCard)
  }

  return hand
}
