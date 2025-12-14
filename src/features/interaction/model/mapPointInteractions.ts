import type { MapPoint } from '@/shared/types/map'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import { calculateVendorSellPrice } from '@/shared/lib/itemPricing'
import type { InteractionKey } from './useMapPointInteraction'

export interface TradeItem {
  id: string
  templateId: string
  name: string
  price: number
  quantity: number
  description?: string
}

export interface UpgradeOption {
  id: string
  itemId: string
  title: string
  cost: number
  description?: string
}

export interface TrainingSkill {
  id: string
  name: string
  cost: number
  description?: string
}

export interface QuestBoardEntry {
  id: string
  title: string
  description?: string
  recommendedLevel?: number
}

interface BaseInteraction {
  id: string
  key: InteractionKey
  type: 'trade' | 'upgrade' | 'training' | 'dialogue' | 'quests'
  title: string
  subtitle?: string
  pointId: string
  summary?: string
}

export interface TradeInteraction extends BaseInteraction {
  type: 'trade'
  key: 'trade'
  npcId?: string
  currency: string
  inventory: TradeItem[]
}

export interface UpgradeInteraction extends BaseInteraction {
  type: 'upgrade'
  key: 'upgrade'
  npcId?: string
  options: UpgradeOption[]
}

export interface TrainingInteraction extends BaseInteraction {
  type: 'training'
  key: 'training'
  trainerId?: string
  skills: TrainingSkill[]
}

export interface DialogueInteraction extends BaseInteraction {
  type: 'dialogue'
  key: 'dialog'
  sceneId: string
  preview?: string
}

export interface QuestBoardInteraction extends BaseInteraction {
  type: 'quests'
  key: 'quests'
  entries: QuestBoardEntry[]
}

export type MapPointInteraction =
  | TradeInteraction
  | UpgradeInteraction
  | TrainingInteraction
  | DialogueInteraction
  | QuestBoardInteraction

const normalizeServices = (services: unknown): InteractionKey[] => {
  if (!Array.isArray(services)) return []
  const normalized = services
    .map((service) => String(service).toLowerCase().trim())
    .filter(Boolean)
    .map((service) => {
      if (service === 'quest') return 'quests'
      if (service === 'dialogue' || service === 'dialogues' || service === 'talk') return 'dialog'
      return service as InteractionKey
    })
  return normalized.filter((service, index) => normalized.indexOf(service) === index)
}

const buildTradeInteraction = (point: MapPoint): TradeInteraction => ({
  id: `${point.id}-trade`,
  pointId: point.id,
  type: 'trade',
  key: 'trade',
  title: point.metadata?.characterName ?? 'Торговец',
  subtitle: 'Обмен предметов и снаряжения',
  npcId: point.metadata?.characterName ?? point.id,
  currency: 'кр.',
  summary: 'Закупитесь припасами и продайте лишнее снаряжение.',
  inventory: buildVendorInventory(point.metadata?.characterName ?? point.id),
})

type VendorType = 'medic' | 'black_market' | 'general'

const resolveVendorType = (npcId?: string): VendorType => {
  const id = (npcId || '').toLowerCase()
  if (id.includes('sintez') || id.includes('synthesis') || id.includes('synth') || id.includes('med')) return 'medic'
  if (id.includes('black') || id.includes('black_market') || id.includes('контраб')) return 'black_market'
  return 'general'
}

const buildVendorInventory = (npcId?: string): TradeItem[] => {
  const type = resolveVendorType(npcId)

  const pick = (templateId: string, quantity = 5, priceMultiplier = 1): TradeItem | null => {
    const tpl = ITEM_TEMPLATES[templateId]
    if (!tpl) return null
    const basePrice = calculateVendorSellPrice(tpl)
    return {
      id: `${templateId}-${npcId ?? 'vendor'}`,
      templateId,
      name: tpl.name,
      price: Math.floor(basePrice * priceMultiplier),
      quantity,
      description: tpl.description,
    }
  }

  const medicItems = [
    pick('field_medkit', 4, 0.9),
    pick('medkit', 6, 0.95),
    pick('bandage', 12, 0.9),
    pick('pills', 10, 1),
    pick('ration_pack', 6, 1),
    pick('canned_food', 8, 1),
  ]

  const blackMarketItems = [
    pick('glock_19', 2, 1.8),
    pick('pistol_pm', 3, 1.6),
    pick('sawed_off_shotgun', 2, 2.0),
    pick('rifle_ak74', 1, 2.2),
    pick('knife', 5, 1.4),
    pick('wrench', 4, 1.2),
    pick('scrap', 8, 1.3),
    pick('mica_shard', 1, 3.0),
  ]

  const generalItems = [
    pick('bandage', 10, 1.1),
    pick('medkit', 4, 1.15),
    pick('ration_pack', 8, 1.1),
    pick('canned_food', 10, 1.05),
    pick('pills', 8, 1.1),
    pick('knife', 3, 1.3),
    pick('rusty_pipe', 3, 1.25),
    pick('backpack_medic', 2, 1.4),
    pick('belt_tool', 3, 1.25),
    pick('scrap', 12, 1.2),
  ]

  switch (type) {
    case 'medic':
      return medicItems.filter(Boolean) as TradeItem[]
    case 'black_market':
      return blackMarketItems.filter(Boolean) as TradeItem[]
    default:
      return generalItems.filter(Boolean) as TradeItem[]
  }
}

const buildUpgradeInteraction = (point: MapPoint): UpgradeInteraction => ({
  id: `${point.id}-upgrade`,
  pointId: point.id,
  type: 'upgrade',
  key: 'upgrade',
  title: point.metadata?.characterName ?? 'Мастерская',
  subtitle: 'Модификация и обслуживание снаряжения',
  npcId: point.metadata?.characterName ?? point.id,
  summary: 'Улучшите оружие, броню и оснастку у местного мастера.',
  options: [
    {
      id: 'upgrade_blade_sharp',
      itemId: 'melee_blade',
      title: 'Заточка клинка',
      cost: 90,
      description: '+10% к урону холодным оружием',
    },
    {
      id: 'upgrade_armor_plate',
      itemId: 'armor_vest',
      title: 'Композитные пластины',
      cost: 180,
      description: '+1 уровень брони, -5% к мобильности',
    },
    {
      id: 'upgrade_rifle_scope',
      itemId: 'rifle_mod',
      title: 'Оптический прицел',
      cost: 160,
      description: '+15% к точности на дистанции',
    },
  ],
})

const buildTrainingInteraction = (point: MapPoint): TrainingInteraction => ({
  id: `${point.id}-training`,
  pointId: point.id,
  type: 'training',
  key: 'training',
  title: point.metadata?.characterName ?? 'Тренировочная площадка',
  subtitle: 'Повышение навыков и характеристик',
  trainerId: point.metadata?.characterName ?? point.id,
  summary: 'Получите развитие ключевых навыков за счёт тренировок.',
  skills: [
    { id: 'force', name: 'Физическая подготовка', cost: 150, description: '+1 к силе' },
    { id: 'shooting', name: 'Стрельба', cost: 130, description: '+1 к меткости' },
    { id: 'endurance', name: 'Выносливость', cost: 110, description: '+1 к выносливости' },
  ],
})

const buildQuestBoardInteraction = (point: MapPoint): QuestBoardInteraction => ({
  id: `${point.id}-quests`,
  pointId: point.id,
  type: 'quests',
  key: 'quests',
  title: point.title,
  subtitle: 'Доступные задания в регионе',
  summary: 'Выбирайте задания для заработка опыта, ресурсов и влияния.',
  entries: [
    {
      id: `${point.id}-quest-1`,
      title: 'Разведка периметра',
      description: 'Осмотрите окрестности и отметьте подозрительные активности.',
      recommendedLevel: 1,
    },
    {
      id: `${point.id}-quest-2`,
      title: 'Снабжение фронта',
      description: 'Доставьте ящик медикаментов в лагерь союзников.',
      recommendedLevel: 2,
    },
  ],
})

const buildDialogueInteractions = (point: MapPoint): DialogueInteraction[] => {
  if (!Array.isArray(point.metadata?.sceneBindings)) {
    return []
  }
  return point.metadata.sceneBindings
    .filter((binding) => binding.sceneId)
    .map((binding, index) => ({
      id: `${point.id}-dialog-${binding.sceneId ?? index}`,
      pointId: point.id,
      type: 'dialogue',
      key: 'dialog',
      title: point.metadata?.characterName ?? point.title,
      subtitle: 'Диалоговое взаимодействие',
      summary: 'Общение с ключевым персонажем локации.',
      sceneId: binding.sceneId!,
      preview: 'Начните диалог, чтобы углубиться в сюжетную ветку.',
    }))
}

export const buildInteractionsForPoint = (point: MapPoint): MapPointInteraction[] => {
  const interactions: MapPointInteraction[] = []
  const services = normalizeServices(point.metadata?.services)

  services.forEach((service) => {
    switch (service) {
      case 'trade':
        interactions.push(buildTradeInteraction(point))
        break
      case 'upgrade':
        interactions.push(buildUpgradeInteraction(point))
        break
      case 'training':
        interactions.push(buildTrainingInteraction(point))
        break
      case 'quests':
        interactions.push(buildQuestBoardInteraction(point))
        break
      case 'dialog':
        interactions.push(...buildDialogueInteractions(point))
        break
      default:
        break
    }
  })

  if (!services.includes('dialog')) {
    interactions.push(...buildDialogueInteractions(point))
  }

  return interactions
}

export const findInteractionByKey = (
  interactions: MapPointInteraction[],
  key: InteractionKey
): MapPointInteraction | undefined => interactions.find((interaction) => interaction.key === key)
