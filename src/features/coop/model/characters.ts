import type { CoopRoleId } from '@/shared/types/coop'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'

type LoadoutItem = {
  itemId: string
  qty?: number
}

export type CoopCharacterTemplate = {
  id: CoopRoleId
  title: string
  subtitle: string
  portraitUrl: string
  accentClass: string
  loadout: LoadoutItem[]
}

export const COOP_CHARACTERS: CoopCharacterTemplate[] = [
  {
    id: 'valkyrie',
    title: 'Адель',
    subtitle: 'Валькирия · разведка',
    portraitUrl: '/images/characters/Adel.png',
    accentClass: 'from-cyan-400/30 to-blue-700/10',
    loadout: [
      { itemId: 'vest_police' },
      { itemId: 'pistol_pm' },
      { itemId: 'medkit' },
      { itemId: 'bandage', qty: 2 },
    ],
  },
  {
    id: 'vorschlag',
    title: 'Бруно',
    subtitle: 'Vorschlag · тактик',
    portraitUrl: '/images/characters/Bruno.png',
    accentClass: 'from-amber-400/30 to-orange-700/10',
    loadout: [
      { itemId: 'wrench' },
      { itemId: 'helmet_police' },
      { itemId: 'ration_pack' },
      { itemId: 'pills' },
    ],
  },
  {
    id: 'ghost',
    title: 'Отто',
    subtitle: 'Ghost · штурм',
    portraitUrl: '/images/characters/Otto.png',
    accentClass: 'from-fuchsia-400/30 to-purple-700/10',
    loadout: [
      { itemId: 'knife' },
      { itemId: 'scout_jacket' },
      { itemId: 'glock_19' },
      { itemId: 'bandage' },
    ],
  },
  {
    id: 'shustrya',
    title: 'Лена',
    subtitle: 'Шустрая · поддержка',
    portraitUrl: '/images/characters/Lena.png',
    accentClass: 'from-emerald-400/30 to-teal-700/10',
    loadout: [
      { itemId: 'jacket_hidden' },
      { itemId: 'pistol_pm' },
      { itemId: 'field_medkit' },
      { itemId: 'canned_food' },
    ],
  },
]

export function formatLoadoutItem(itemId: string, qty?: number): string {
  const name = ITEM_TEMPLATES[itemId]?.name ?? itemId
  const count = typeof qty === 'number' && Number.isFinite(qty) && qty > 1 ? ` ×${Math.trunc(qty)}` : ''
  return `${name}${count}`
}

