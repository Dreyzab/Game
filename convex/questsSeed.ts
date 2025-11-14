import { mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'

type QuestStep = {
  id: string
  description: string
  type: 'location' | 'dialogue' | 'combat' | 'item'
  requirements?: unknown
}

type QuestSeed = {
  id: string
  title: string
  description: string
  phase: number
  prerequisites: string[]
  rewards: {
    fame: number
    items?: string[]
    flags?: string[]
  }
  steps: QuestStep[]
  isActive: boolean
  repeatable?: boolean
  templateVersion?: number
}

const QUEST_SEEDS: QuestSeed[] = [
  {
    id: 'first_steps_in_freiburg',
    title: 'Первые шаги во Фрайбурге',
    description: 'Пролог: найти информационное бюро и получить первые ориентиры в городе.',
    phase: 0,
    prerequisites: [],
    rewards: {
      fame: 2,
    },
    steps: [
      {
        id: 'arrive_to_freiburg',
        description: 'Прибыть на сортировочную станцию и осмотреться.',
        type: 'dialogue',
      },
      {
        id: 'find_info_bureau',
        description: 'Найти окно информационного бюро на станции.',
        type: 'location',
      },
      {
        id: 'register_at_info_bureau',
        description: 'Поговорить со старушкой-регистратором и зарегистрироваться.',
        type: 'dialogue',
      },
      {
        id: 'meet_hans',
        description: 'Встретить Ганса у информационного бюро и получить КПК.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },
  {
    id: 'delivery_for_dieter',
    title: 'Шанс для новичка',
    description: 'Доставить ящик с запчастями мастеру Дитеру.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 5,
    },
    steps: [
      {
        id: 'talk_to_elias',
        description: 'Поговорить с Элиасом на рынке и получить груз.',
        type: 'dialogue',
      },
      {
        id: 'deliver_to_dieter',
        description: 'Отнести ящик в мастерскую Дитера.',
        type: 'location',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },
  {
    id: 'delivery_for_professor',
    title: 'Письмо для профессора',
    description: 'Передать документы профессору и продвинуть основную сюжетную линию.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 8,
    },
    steps: [
      {
        id: 'receive_documents',
        description: 'Получить пакет документов в поезде.',
        type: 'dialogue',
      },
      {
        id: 'find_professor_contact',
        description: 'Узнать у горожан, где можно найти профессора.',
        type: 'dialogue',
      },
      {
        id: 'deliver_documents',
        description: 'Встретить профессора и передать документы.',
        type: 'location',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },
  {
    id: 'shopkeeper_truant',
    title: 'Лавочник-прогульщик',
    description: 'Разобраться с лавочником, который исчез с товаром и долгами.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 10,
    },
    steps: [
      {
        id: 'get_job_from_karapuz',
        description: 'Поговорить с Карапузом на Швабской площади и получить задание.',
        type: 'dialogue',
      },
      {
        id: 'talk_to_flens',
        description: 'Выяснить детали у Фленса на Главном рынке.',
        type: 'dialogue',
      },
      {
        id: 'visit_ludas_bar',
        description: 'Собрать слухи в баре Люды.',
        type: 'location',
      },
      {
        id: 'search_tenement_3b',
        description: 'Найти улики в комнате 3Б доходного дома.',
        type: 'location',
      },
      {
        id: 'confront_in_the_hole',
        description: 'Обсудить судьбу лавочника с Шрамом в клубе «Дыра».',
        type: 'dialogue',
      },
      {
        id: 'resolve_in_collectors',
        description: 'Пройти в техкомнату коллекторов и завершить разборки.',
        type: 'location',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },
  {
    id: 'baptism_by_fire',
    title: 'Боевое крещение',
    description: 'Пройти первое боевое задание вместе с FJR.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 12,
    },
    steps: [
      {
        id: 'accept_from_board',
        description: 'Найти задание на доске объявлений FJR.',
        type: 'location',
      },
      {
        id: 'briefing_with_kruger',
        description: 'Получить инструктаж у сержанта Крюгера.',
        type: 'dialogue',
      },
      {
        id: 'patrol_stadtgarten',
        description: 'Пройти патрульный маршрут в Штадтгартене.',
        type: 'location',
      },
      {
        id: 'debriefing_with_kruger',
        description: 'Вернуться к Крюгеру и получить разбор полётов.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },
  {
    id: 'field_medicine',
    title: 'Полевая медицина',
    description: 'Помочь Лене Рихтер собрать материалы для полевого медицинского протокола.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 7,
    },
    steps: [
      {
        id: 'talk_to_lena',
        description: 'Поговорить с Леной Рихтер в медпункте «Синтеза».',
        type: 'dialogue',
      },
      {
        id: 'explore_greenhouse',
        description: 'Исследовать теплицу в Штадтгартене и собрать образцы.',
        type: 'location',
      },
      {
        id: 'return_to_lena',
        description: 'Вернуться в медпункт и передать собранные материалы.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },
]

async function upsertQuest(ctx: MutationCtx, seed: QuestSeed) {
  const existing = await ctx.db
    .query('quests')
    .withIndex('byQuestId', (q) => q.eq('id', seed.id))
    .first()

  const now = Date.now()
  if (existing) {
    await ctx.db.patch(existing._id, {
      title: seed.title,
      description: seed.description,
      phase: seed.phase,
      prerequisites: seed.prerequisites,
      rewards: seed.rewards,
      steps: seed.steps,
      isActive: seed.isActive,
      repeatable: seed.repeatable ?? false,
      templateVersion: seed.templateVersion ?? (existing as any).templateVersion ?? 1,
      createdAt: (existing as any).createdAt ?? now,
    } as any)
    return { id: existing._id, updated: true, created: false }
  }

  const id = await ctx.db.insert('quests', {
    ...seed,
    repeatable: seed.repeatable ?? false,
    templateVersion: seed.templateVersion ?? 1,
    createdAt: now,
  } as any)
  return { id, updated: false, created: true }
}

export const seedQuests = mutation({
  handler: async (ctx) => {
    const results = []
    for (const seed of QUEST_SEEDS) {
      const res = await upsertQuest(ctx, seed)
      results.push({ questId: seed.id, ...res })
    }

    return {
      success: true,
      count: QUEST_SEEDS.length,
      details: results,
    }
  },
})
