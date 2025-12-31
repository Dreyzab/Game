import type { CoopRoleId } from '@/shared/types/coop'
import type { VoiceId } from '@/shared/types/parliament'
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
  backstory: string
  voiceModifiers: Partial<Record<VoiceId, number>>
}

export const COOP_CHARACTERS: CoopCharacterTemplate[] = [
  {
    id: 'valkyrie',
    title: 'Ева',
    subtitle: 'Валькирия · медик',
    portraitUrl: '/images/characters/Lena.png',
    accentClass: 'from-cyan-400/30 to-blue-700/10',
    loadout: [
      { itemId: 'field_scanner' },
      { itemId: 'pistol_pm' },
      { itemId: 'field_medkit' },
      { itemId: 'medkit' },
      { itemId: 'bandage', qty: 3 },
    ],
    backstory: `Бывший полевой хирург 7-го медицинского батальона FJR. Покинула службу после «Инцидента в Бергхайме», о котором никто не говорит. Спокойна под давлением. Её руки не дрожат, даже когда мир вокруг горит.

Говорят, она может вытащить человека с того света — но никогда не обещает, что вытащит его в здравом уме.`,
    voiceModifiers: {
      analysis: 15,
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
      { itemId: 'tactical_drone' },
      { itemId: 'wrench' },
      { itemId: 'pistol_pm' },
      { itemId: 'emp_charge' },
      { itemId: 'ration_pack' },
    ],
    backstory: `Инженер-самоучка из промышленного Рурского кластера. Его рюкзак весит больше, чем он сам. Говорит мало, делает много.

Предпочитает компанию машин людям — они, по его словам, «логичнее». Его дрон «Глаз» — единственный, кому он доверяет безоговорочно.`,
    voiceModifiers: {
      logic: 20,
      analysis: 15,
      creativity: 10,
      endurance: 5,
    },
  },
  {
    id: 'ghost',
    title: 'Дитрих',
    subtitle: 'Ghost · снайпер',
    portraitUrl: '/images/characters/Otto.png',
    accentClass: 'from-fuchsia-400/30 to-purple-700/10',
    loadout: [
      { itemId: 'sniper_rifle' },
      { itemId: 'knife' },
      { itemId: 'scout_jacket' },
      { itemId: 'bandage', qty: 2 },
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
      { itemId: 'grenade', qty: 3 },
      { itemId: 'pistol_pm' },
      { itemId: 'jacket_hidden' },
      { itemId: 'emp_charge' },
      { itemId: 'pills' },
    ],
    backstory: `Бывшая активистка подпольного движения «Алый Рассвет». Её досье в полиции толще словаря. Любит взрывы. Очень.

Не признаёт авторитетов, но уважает тех, кто рискует вместе с ней. Её смех звучит особенно громко за секунду до детонации.`,
    voiceModifiers: {
      gambling: 25,
      courage: 15,
      drama: 15,
      reaction: 5,
    },
  },
]

export function formatLoadoutItem(itemId: string, qty?: number): string {
  const name = ITEM_TEMPLATES[itemId]?.name ?? itemId
  const count = typeof qty === 'number' && Number.isFinite(qty) && qty > 1 ? ` ×${Math.trunc(qty)}` : ''
  return `${name}${count}`
}
