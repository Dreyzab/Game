import type { Combatant, CombatCard } from './types'
import { generateWeaponCardsForWeaponId } from '@/shared/data/weaponCards'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import { getScalingBonus } from '@/shared/lib/scaling'

export function generateDeckForCombatant(combatant: Combatant): CombatCard[] {
  const hand: CombatCard[] = []
  const { voices } = combatant

  // 1. Base Movement Cards
  hand.push(
    {
      id: `${combatant.id}_move_adv`,
      ownerId: combatant.id,
      name: 'Advance',
      type: 'movement',
      apCost: 1,
      staminaCost: 5,
      damage: 0,
      impact: 0,
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
      impact: 0,
      effects: [],
      optimalRange: [],
      description: 'Move backward',
      jamChance: 0,
    } as CombatCard
  )

  // 2. Equipment Cards
  // Support both legacy string[] and new weaponInstances (if we add that field later fully)
  // For now, iterate equipment strings and assume default instance state
  const equipment = combatant.equipment ?? []

  equipment.forEach((itemId) => {
    const template = ITEM_TEMPLATES[itemId]
    if (!template) return

    // Identify Weapon Type for Scaling
    const isMelee = template.tags?.includes('melee')
    const isRanged = template.tags?.includes('ranged') || template.tags?.includes('ballistic')
    const isTech = template.tags?.includes('tech') || template.tags?.includes('artifact')

    // Select Scaling Voice
    // Melee -> Force
    // Ranged -> Coordination
    // Tech/Artifact -> Knowledge
    let scalingValue = 0
    let scalingFactor = 0

    if (isMelee) {
      scalingValue = voices.force
      scalingFactor = 0.02 // +2% per point
    } else if (isRanged) {
      scalingValue = voices.coordination
      scalingFactor = 0.01 // +1% per point
    } else if (isTech) {
      scalingValue = voices.knowledge
      scalingFactor = 0.015 // +1.5% per point
    }

    // Base stats
    const baseDmg = template.baseStats?.damage ?? 10

    // Generate base cards
    const cards = generateWeaponCardsForWeaponId(itemId, {
      baseDamage: baseDmg,
      idPrefix: `${combatant.id}_${itemId}`
    })

    cards.forEach((c) => {
      // Apply Scaling to Damage
      // Formula: Base * (1 + Bonus)
      let finalDamage = c.damage
      if (c.type === 'attack') {
        const bonusMult = getScalingBonus(scalingValue, scalingFactor)
        // bonusMult is e.g. 0.4 for 20 Force * 0.02
        finalDamage = Math.floor(c.damage * (1 + bonusMult))
      }

      // Ammo Logic (Quick Shot Fix)
      // If card has explicit ammo cost logic, we might need a custom handler, 
      // but for now we apply standard rules or keep template cost.
      // V3 Design: Quick Shot costs ceil(mag/2). 
      // This requires knowing current mag size. 
      // Since we don't have full instance state here yet, we'll stick to template defaults 
      // OR primitive logic. To implement V3 fully, we need the WeaponInstance in the loop.
      // For this step, we'll just respect the template ammoCost or default to 1 for ranged.
      const isExplosive = template.tags?.includes('explosive')
      const defaultAmmoCost = (isRanged || isExplosive) ? 1 : 0
      const finalAmmoCost = c.ammoCost ?? defaultAmmoCost

      // Impact Logic
      const calculatedImpact = c.type === 'attack' ? (c.impact || 10) + Math.floor(finalDamage * 0.5) : 0

      // Crit Chance Addition
      // Coordination * 0.3
      // We rely on the Battle Reducer (Action Resolution) to calculate crit
      // using the actor's Coordination + card base stats.
      // So no need to modify card object here for crit chance.

      hand.push({
        id: c.id,
        ownerId: combatant.id,
        sourceWeapon: c.weaponId,
        name: c.name,
        type: c.type,
        apCost: c.apCost,
        staminaCost: c.staminaCost,
        ammoCost: finalAmmoCost,
        damage: finalDamage,
        impact: calculatedImpact,
        damageType: c.damageType,
        optimalRange: c.optimalRange,
        effects: c.effects,
        imageUrl: c.imageUrl,
        description: c.description, // We could append scaling info here
        jamChance: c.jamChance,
      })
    })
  })

  // 3. Fallback Fist
  const hasAttack = hand.some(c => c.type === 'attack')
  if (!hasAttack) {
    // Fist scales with Force too
    const forceBonus = getScalingBonus(voices.force, 0.02)
    const fistDmg = Math.floor(2 * (1 + forceBonus))

    hand.push({
      id: `${combatant.id}_fist`,
      ownerId: combatant.id,
      name: 'Fist',
      type: 'attack',
      apCost: 1,
      staminaCost: 5,
      ammoCost: 0,
      damage: fistDmg,
      impact: 5 + Math.floor(fistDmg * 0.5),
      optimalRange: [1],
      description: 'Punch.',
      jamChance: 0,
      effects: []
    } as CombatCard)
  }

  return hand
}
