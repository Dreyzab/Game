import type { CoopRoleId } from '@/shared/types/coop'
import type { VoiceId } from '@/shared/types/parliament'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'

type LoadoutItem = {
  itemId: string
  qty?: number
  /** If true, item is inside backpack (weight reduced) */
  inBackpack?: boolean
}

export type CoopCharacterTemplate = {
  id: CoopRoleId
  title: string
  subtitle: string
  portraitUrl: string
  accentClass: string
  loadout: LoadoutItem[]
  backstory: string
  voiceModifiers: Partial<Record<VoiceId, number>>
}

/**
 * Weight thresholds for encumbrance system
 */
export const WEIGHT_THRESHOLDS = {
  LIGHT: 12,      // < 12kg - Green, no penalty
  MEDIUM: 18,     // 12-18kg - Yellow, small penalty
  HEAVY: 25,      // 18-25kg - Red, significant penalty  
  CRITICAL: 32,   // > 25kg - Critical, severe penalties
}

/**
 * Get backpack weight reduction percentage from tags
 */
function getBackpackWeightReduction(itemId: string): number {
  const item = ITEM_TEMPLATES[itemId]
  if (!item?.tags) return 0

  for (const tag of item.tags) {
    if (tag.startsWith('weight_reduction_')) {
      return parseInt(tag.replace('weight_reduction_', ''), 10) || 0
    }
  }
  return 0
}

/**
 * Calculate total weight of a loadout with backpack reduction
 */
export function calculateLoadoutWeight(loadout: LoadoutItem[]): {
  totalWeight: number
  backpackReduction: number
  effectiveWeight: number
} {
  let backpackReduction = 0
  let itemsInBackpackWeight = 0
  let itemsOutsideBackpackWeight = 0
  let backpackWeight = 0

  // First pass: find backpack and its reduction
  for (const entry of loadout) {
    const item = ITEM_TEMPLATES[entry.itemId]
    if (!item) continue

    if (item.kind === 'backpack') {
      backpackReduction = getBackpackWeightReduction(entry.itemId)
      backpackWeight = item.baseStats?.weight ?? 0
    }
  }

  // Second pass: calculate weights
  for (const entry of loadout) {
    const item = ITEM_TEMPLATES[entry.itemId]
    if (!item) continue

    const qty = entry.qty ?? 1
    const itemWeight = (item.baseStats?.weight ?? 0) * qty

    if (item.kind === 'backpack') {
      // Backpack weight is always full
      continue
    } else if (entry.inBackpack) {
      itemsInBackpackWeight += itemWeight
    } else {
      itemsOutsideBackpackWeight += itemWeight
    }
  }

  // Apply backpack reduction to items inside it
  const reducedBackpackWeight = itemsInBackpackWeight * (1 - backpackReduction / 100)
  const totalWeight = backpackWeight + itemsInBackpackWeight + itemsOutsideBackpackWeight
  const effectiveWeight = backpackWeight + reducedBackpackWeight + itemsOutsideBackpackWeight

  return {
    totalWeight,
    backpackReduction,
    effectiveWeight: Math.round(effectiveWeight * 10) / 10
  }
}

/**
 * Get weight category and penalties
 */
export function getWeightCategory(effectiveWeight: number): {
  category: 'light' | 'medium' | 'heavy' | 'critical'
  color: string
  label: string
  apPenalty: number
  initiativePenalty: number
  dodgePenalty: number
} {
  if (effectiveWeight < WEIGHT_THRESHOLDS.LIGHT) {
    return { category: 'light', color: 'text-green-400', label: 'Лёгкая', apPenalty: 0, initiativePenalty: 0, dodgePenalty: 0 }
  } else if (effectiveWeight < WEIGHT_THRESHOLDS.MEDIUM) {
    return { category: 'medium', color: 'text-yellow-400', label: 'Средняя', apPenalty: 0, initiativePenalty: -2, dodgePenalty: -5 }
  } else if (effectiveWeight < WEIGHT_THRESHOLDS.HEAVY) {
    return { category: 'heavy', color: 'text-orange-500', label: 'Тяжёлая', apPenalty: -1, initiativePenalty: -5, dodgePenalty: -15 }
  } else if (effectiveWeight < WEIGHT_THRESHOLDS.CRITICAL) {
    return { category: 'critical', color: 'text-red-500', label: 'ПЕРЕГРУЗ', apPenalty: -2, initiativePenalty: -10, dodgePenalty: -30 }
  } else {
    // Beyond critical - severe penalties
    return { category: 'critical', color: 'text-red-600 animate-pulse', label: 'КРИТИЧЕСКИЙ ПЕРЕГРУЗ', apPenalty: -3, initiativePenalty: -15, dodgePenalty: -50 }
  }
}

export const COOP_CHARACTERS: CoopCharacterTemplate[] = [
  {
    id: 'valkyrie',
    title: 'Ева',
    subtitle: 'Валькирия · медик',
    portraitUrl: '/images/characters/Lena.png',
    accentClass: 'from-cyan-400/30 to-blue-700/10',
    loadout: [
      // Armor
      { itemId: 'vest_class2' },
      { itemId: 'helmet_class2' },
      // Backpack (medical specialty)
      { itemId: 'backpack_medic_large' },
      // Weapons
      { itemId: 'pistol_pm' },
      { itemId: 'ammo_pistol_mag', qty: 2, inBackpack: true },
      // Tech
      { itemId: 'field_scanner' },
      { itemId: 'bio_analyzer', inBackpack: true },
      // Medical (in backpack - reduced weight)
      { itemId: 'field_medkit', inBackpack: true },
      { itemId: 'medkit', inBackpack: true },
      { itemId: 'tourniquet', qty: 2, inBackpack: true },
      { itemId: 'gel_healing', qty: 2, inBackpack: true },
      { itemId: 'bandage', qty: 4, inBackpack: true },
      // Field gear
      { itemId: 'radio' },
      { itemId: 'canteen', inBackpack: true },
    ],
    backstory: `Бывший полевой хирург 7-го медицинского батальона FJR. Покинула службу после «Инцидента в Бергхайме», о котором никто не говорит. Спокойна под давлением. Её руки не дрожат, даже когда мир вокруг горит.

Говорят, она может вытащить человека с того света — но никогда не обещает, что вытащит его в здравом уме.`,
    voiceModifiers: {
      knowledge: 15,
      empathy: 20,
      coordination: 10,
      logic: 5,
    },
  },
  {
    id: 'vorschlag',
    title: 'Йоханн',
    subtitle: 'Vorschlag · техник',
    portraitUrl: '/images/characters/Bruno.png',
    accentClass: 'from-amber-400/30 to-orange-700/10',
    loadout: [
      // Armor (class 3 - heavy protection)
      { itemId: 'vest_class3' },
      { itemId: 'helmet_class3' },
      // Backpack (large for all his gear)
      { itemId: 'backpack_tactical_large' },
      // Weapons
      { itemId: 'smg_mp_class1' },
      { itemId: 'pistol_pm' },
      { itemId: 'ammo_pistol_mag', qty: 2, inBackpack: true },
      // Drones (his specialty)
      { itemId: 'drone_recon' },
      { itemId: 'drone_manipulator', inBackpack: true },
      // Tech
      { itemId: 'repair_kit_large', inBackpack: true },
      { itemId: 'repair_kit_small', qty: 2, inBackpack: true },
      { itemId: 'energy_cells', qty: 3, inBackpack: true },
      { itemId: 'emp_charge', inBackpack: true },
      // Field gear
      { itemId: 'nvg' },
      { itemId: 'radio' },
      { itemId: 'ration_pack', qty: 2, inBackpack: true },
    ],
    backstory: `Инженер-самоучка из промышленного Рурского кластера. Его рюкзак весит больше, чем он сам. Говорит мало, делает много.

Предпочитает компанию машин людям — они, по его словам, «логичнее». Его дрон «Глаз» — единственный, кому он доверяет безоговорочно.`,
    voiceModifiers: {
      logic: 20,
      knowledge: 15,
      creativity: 10,
      endurance: 15, // Can carry heavy loads
    },
  },
  {
    id: 'ghost',
    title: 'Дитрих',
    subtitle: 'Ghost · снайпер',
    portraitUrl: '/images/characters/Otto.png',
    accentClass: 'from-fuchsia-400/30 to-purple-700/10',
    loadout: [
      // Armor (class 1 - light for mobility)
      { itemId: 'vest_class1' },
      { itemId: 'helmet_class1' },
      // Backpack (medium - he travels light)
      { itemId: 'backpack_tactical_medium' },
      // Weapons
      { itemId: 'sniper_rifle' },
      { itemId: 'knife' },
      { itemId: 'ammo_sniper_mag', qty: 4, inBackpack: true },
      // Tech
      { itemId: 'visor_tactical' },
      { itemId: 'nvg' },
      // Field gear (minimal)
      { itemId: 'scout_jacket' },
      { itemId: 'bandage', qty: 2, inBackpack: true },
      { itemId: 'canteen', inBackpack: true },
      { itemId: 'map_tactical', inBackpack: true },
      // Stealth
      { itemId: 'radio' },
    ],
    backstory: `Бывший снайпер элитного подразделения «Ночной Дозор» FJR. Ушёл после миссии, детали которой засекречены. Не разговорчив.

Его взгляд может заморозить воздух. Говорят, он не спит — просто закрывает глаза и продолжает наблюдать.`,
    voiceModifiers: {
      coordination: 25,
      perception: 20,
      reaction: 10,
      resilience: 5,
    },
  },
  {
    id: 'shustrya',
    title: 'Агата',
    subtitle: 'Шустрая · подрывник',
    portraitUrl: '/images/characters/Adel.png',
    accentClass: 'from-emerald-400/30 to-teal-700/10',
    loadout: [
      // Armor (class 2)
      { itemId: 'vest_class2' },
      { itemId: 'helmet_class2' },
      // Backpack (hiking - for explosives)
      { itemId: 'backpack_hiking_medium' },
      // Weapons
      { itemId: 'pistol_pm' },
      { itemId: 'ammo_pistol_mag', qty: 3, inBackpack: true },
      // Explosives (her specialty)
      { itemId: 'grenade', qty: 4, inBackpack: true },
      { itemId: 'emp_charge', qty: 2, inBackpack: true },
      { itemId: 'drone_bomber' }, // Attack drone
      // Gear
      { itemId: 'jacket_hidden' },
      { itemId: 'chest_rig' },
      { itemId: 'flashlight' },
      // Field
      { itemId: 'radio' },
      { itemId: 'pills', qty: 2, inBackpack: true },
      { itemId: 'bandage', qty: 2, inBackpack: true },
    ],
    backstory: `Бывшая активистка подпольного движения «Алый Рассвет». Её досье в полиции толще словаря. Любит взрывы. Очень.

Не признаёт авторитетов, но уважает тех, кто рискует вместе с ней. Её смех звучит особенно громко за секунду до детонации.`,
    voiceModifiers: {
      gambling: 25,
      courage: 15,
      drama: 15,
      reaction: 10,
    },
  },
]

export function formatLoadoutItem(itemId: string, qty?: number): string {
  const name = ITEM_TEMPLATES[itemId]?.name ?? itemId
  const count = typeof qty === 'number' && Number.isFinite(qty) && qty > 1 ? ` ×${Math.trunc(qty)}` : ''
  return `${name}${count}`
}
