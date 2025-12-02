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
      items: ['medical_kit_basic'],
      flags: ['synthesis_contact'],
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

  // =====================================
  // АКТ 1: РАСШИРЕННЫЕ КВЕСТЫ
  // =====================================

  // Квест Староверов
  {
    id: 'sanctuary_blessing',
    title: 'Благословение Святилища',
    description: 'Отец Иоанн просит помочь с подготовкой к церемонии благословения для новоприбывших.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 6,
      flags: ['old_believers_contact', 'blessed_by_johann'],
    },
    steps: [
      {
        id: 'meet_father_johann',
        description: 'Познакомиться с отцом Иоанном в кафедральном соборе.',
        type: 'dialogue',
      },
      {
        id: 'gather_candles',
        description: 'Собрать свечи у торговцев на рынке.',
        type: 'item',
        requirements: { itemId: 'candles', amount: 5 },
      },
      {
        id: 'return_for_blessing',
        description: 'Вернуться к отцу Иоанну и получить благословение.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },

  // Квест Артисанов - начальный
  {
    id: 'artisan_repair_job',
    title: 'Ремонтные работы',
    description: 'Взять первый заказ с доски Артисанов — починить генератор на окраине промзоны.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 5,
      flags: ['artisan_contact'],
    },
    steps: [
      {
        id: 'take_job_from_board',
        description: 'Взять заказ с доски объявлений Артисанов.',
        type: 'location',
      },
      {
        id: 'find_generator',
        description: 'Найти сломанный генератор в указанном месте.',
        type: 'location',
      },
      {
        id: 'repair_generator',
        description: 'Починить генератор (требуется ТЕХНОФИЛ).',
        type: 'item',
        requirements: { skillCheck: { skill: 'technophile', difficulty: 6 } },
      },
      {
        id: 'report_to_board',
        description: 'Отметить выполнение заказа на доске.',
        type: 'location',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },

  // Квест Анархистов - первый контакт
  {
    id: 'anarchist_test',
    title: 'Испытание огнём',
    description: 'Чтобы попасть к Анархистам, нужно доказать свою ценность. Асуа предлагает небольшое задание.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 8,
      flags: ['anarchist_contact'],
    },
    steps: [
      {
        id: 'find_asua',
        description: 'Найти Асуа на границе анархистской территории.',
        type: 'dialogue',
      },
      {
        id: 'sabotage_camera',
        description: 'Отключить камеру наблюдения FJR.',
        type: 'location',
        requirements: { skillCheck: { skill: 'technophile', difficulty: 8 } },
      },
      {
        id: 'return_to_asua',
        description: 'Вернуться к Асуа с доказательствами.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },

  // Квест "Шёпот Разлома" - продолжение после Дитера
  {
    id: 'whispers_of_rift',
    title: 'Шёпот Разлома',
    description: 'Дитер просит исследовать аномалию на Шлосберге и собрать образцы.',
    phase: 1,
    prerequisites: ['delivery_for_dieter'],
    rewards: {
      fame: 15,
      items: ['rift_sample'],
      flags: ['schlossberg_explored'],
    },
    steps: [
      {
        id: 'get_equipment_from_rico',
        description: 'Заглянуть к Рико в "Цех 4" за снаряжением.',
        type: 'dialogue',
      },
      {
        id: 'reach_schlossberg',
        description: 'Добраться до кристаллических колодцев на Шлосберге.',
        type: 'location',
      },
      {
        id: 'collect_samples',
        description: 'Собрать образцы аномальной энергии.',
        type: 'item',
        requirements: { itemId: 'rift_sample', amount: 3 },
      },
      {
        id: 'survive_encounter',
        description: 'Выжить при встрече с обитателями Разлома.',
        type: 'combat',
      },
      {
        id: 'return_to_dieter',
        description: 'Доставить образцы Дитеру.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },

  // Расследование исчезновения профессора
  {
    id: 'professor_mystery',
    title: 'Тайна профессора',
    description: 'Профессор Шмидт исчез. Нужно выяснить, что с ним случилось.',
    phase: 1,
    prerequisites: ['delivery_for_professor'],
    rewards: {
      fame: 20,
      flags: ['professor_found'],
    },
    steps: [
      {
        id: 'investigate_office',
        description: 'Осмотреть кабинет профессора в университете.',
        type: 'location',
      },
      {
        id: 'talk_to_colleagues',
        description: 'Расспросить коллег профессора.',
        type: 'dialogue',
      },
      {
        id: 'follow_clues',
        description: 'Следовать найденным уликам.',
        type: 'location',
      },
      {
        id: 'confront_truth',
        description: 'Узнать правду о судьбе профессора.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },

  // Динамическое событие - находка сталкера
  {
    id: 'stalker_remains',
    title: 'Последний путь',
    description: 'В переулке найдено тело сталкера. Его жетон нужно кому-то отнести.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 3,
    },
    steps: [
      {
        id: 'discover_body',
        description: 'Обнаружить тело в переулке.',
        type: 'location',
      },
      {
        id: 'take_badge',
        description: 'Забрать жетон погибшего.',
        type: 'item',
      },
      {
        id: 'deliver_badge',
        description: 'Отнести жетон в штаб FJR или к Староверам.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    repeatable: false,
    templateVersion: 1,
  },

  // Тренировка с FJR
  {
    id: 'fjr_training',
    title: 'Тренировка рекрута',
    description: 'Пройти базовую военную подготовку под руководством сержанта Крюгера.',
    phase: 1,
    prerequisites: ['baptism_by_fire'],
    rewards: {
      fame: 8,
      flags: ['fjr_trained'],
    },
    steps: [
      {
        id: 'report_to_kruger',
        description: 'Явиться к сержанту Крюгеру на тренировочную площадку.',
        type: 'dialogue',
      },
      {
        id: 'combat_training',
        description: 'Пройти боевую тренировку.',
        type: 'combat',
      },
      {
        id: 'tactical_test',
        description: 'Сдать тактический тест.',
        type: 'dialogue',
        requirements: { skillCheck: { skill: 'logic', difficulty: 7 } },
      },
      {
        id: 'receive_gear',
        description: 'Получить снаряжение рекрута.',
        type: 'item',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },

  // Работа на чёрном рынке
  {
    id: 'shadow_delivery',
    title: 'Теневая доставка',
    description: 'Элиас предлагает доставить подозрительный груз. Вопросов лучше не задавать.',
    phase: 1,
    prerequisites: [],
    rewards: {
      fame: 4,
      flags: ['shadow_market_contact'],
    },
    steps: [
      {
        id: 'accept_job_from_elias',
        description: 'Принять работу от Элиаса.',
        type: 'dialogue',
      },
      {
        id: 'pick_up_package',
        description: 'Забрать груз в условленном месте.',
        type: 'location',
      },
      {
        id: 'avoid_patrol',
        description: 'Избежать патруля FJR по пути.',
        type: 'location',
        requirements: { skillCheck: { skill: 'reflexes', difficulty: 6 } },
      },
      {
        id: 'deliver_to_contact',
        description: 'Доставить груз получателю.',
        type: 'dialogue',
      },
    ],
    isActive: true,
    templateVersion: 1,
  },

  // Помощь Лене с раненым
  {
    id: 'emergency_patient',
    title: 'Экстренный пациент',
    description: 'Лена срочно нуждается в помощи — раненый сталкер при смерти.',
    phase: 1,
    prerequisites: ['field_medicine'],
    rewards: {
      fame: 10,
      flags: ['lena_trusted'],
    },
    steps: [
      {
        id: 'rush_to_medcenter',
        description: 'Срочно прибыть в медпункт по вызову Лены.',
        type: 'location',
      },
      {
        id: 'assist_surgery',
        description: 'Помочь Лене во время операции.',
        type: 'dialogue',
        requirements: { skillCheck: { skill: 'perception', difficulty: 8 } },
      },
      {
        id: 'find_rare_medicine',
        description: 'Найти редкое лекарство у торговцев.',
        type: 'item',
        requirements: { itemId: 'rare_antibiotic', amount: 1 },
      },
      {
        id: 'save_patient',
        description: 'Спасти пациента.',
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
      templateVersion: seed.templateVersion ?? (existing as unknown as { templateVersion?: number }).templateVersion ?? 1,
      createdAt: (existing as unknown as { createdAt?: number }).createdAt ?? now,
    })
    return { id: existing._id, updated: true, created: false }
  }

  const id = await ctx.db.insert('quests', {
    ...seed,
    repeatable: seed.repeatable ?? false,
    templateVersion: seed.templateVersion ?? 1,
    createdAt: now,
  })
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
