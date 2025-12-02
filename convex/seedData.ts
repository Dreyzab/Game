// Shared seed data for map points used by Convex seed and client fallbacks.
// Keep this file UTF-8 encoded. Cyrillic text must remain intact here.

export type SeedMapPoint = {
  id: string
  title: string
  description: string
  coordinates: { lat: number; lng: number }
  type: 'poi' | 'quest' | 'npc' | 'location' | 'board' | 'settlement' | 'anomaly'
  phase?: number
  isActive: boolean
  // Metadata can optionally include a QR code on seeds
  metadata?: { qrCode?: string } & Record<string, unknown>
  // Optional: when omitted we will set it at insertion time
  qrCode?: string
  createdAt?: number
}

export const SEED_MAP_POINTS: SeedMapPoint[] = [
  // Центральная мастерская Дитера
  {
    id: 'workshop_center',
    title: 'Центральная мастерская "Опора"',
    description:
      'Главная точка ремесленной сети. Здесь Диетер чинит, улучшает и собирает снаряжение. Знакомство с ним открывает путь в ремесленное сообщество.',
    coordinates: { lat: 47.993, lng: 7.849 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'workshop',
      npcId: 'dieter_craftsman_artisan',
      characterName: 'Мастер Дитер',
      services: ['repair', 'crafting', 'upgrade'],
      dialogues: ['craftsman_meeting_dialog', 'weapon_repair_dialog'],
      questBindings: ['chance_for_a_newbie', 'whispers_of_rift'],
      atmosphere:
        'Тёплая, шумная мастерская, пахнущая маслом и горячим металлом. Инструменты и заготовки аккуратно разложены по стенам.',
      relationship: {
        initialLevel: 0,
        maxLevel: 100,
        reputationRequired: 10,
      },
      sceneBindings: [
        {
          sceneId: 'dieter_hans_mention',
          triggerType: 'click',
          conditions: {
            flags: ['has_dieter_parts'],
            notFlags: ['delivered_parts_to_dieter'],
          },
          priority: 100,
        },
        {
          sceneId: 'dieter_workshop_approach',
          triggerType: 'click',
          conditions: {
            notFlags: ['met_dieter'],
          },
          priority: 50,
        },
        {
          sceneId: 'dieter_schlossberg_quest',
          triggerType: 'click',
          conditions: {
            flags: ['met_dieter', 'whispers_quest_active'],
            notFlags: ['talked_schlossberg_with_dieter'],
          },
          priority: 80,
        },
        {
          sceneId: 'dieter_farewell',
          triggerType: 'click',
          conditions: {
            flags: ['met_dieter'],
          },
          priority: 10,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Кампус "Синтез" — глобальная цель профессора
  {
    id: 'synthesis_campus',
    title: 'Кампус "Синтез"',
    description:
      'Основной кампус исследовательской фракции "Синтез". Здесь, по слухам, можно найти профессора, которому нужно доставить посылку.',
    coordinates: { lat: 47.9942, lng: 7.8465 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'synthesis_campus',
      faction: 'synthesis',
      questBindings: ['delivery_for_professor'],
      isGlobalObjective: true,
      atmosphere: 'Спокойный технический квартал с лабораториями, аудиториями и пристыкованными научными модулями.',
      sceneBindings: [
        {
          sceneId: 'synthesis_campus_arrival',
          triggerType: 'click',
          conditions: {
            notFlags: ['visited_synthesis_campus'],
          },
          priority: 50,
        },
        {
          sceneId: 'synthesis_ask_about_professor',
          triggerType: 'click',
          conditions: {
            flags: ['visited_synthesis_campus'],
            notFlags: ['know_professor_location'],
          },
          priority: 40,
        },
      ],
    },
    createdAt: Date.now(),
  },

  {
    id: 'carl_private_workshop',
    title: 'Частная мастерская "Шестерёнка"',
    description:
      'Небольшая частная мастерская с экспериментальными механизмами. Карл работает по настроению и любит необычные заказы.',
    coordinates: { lat: 47.994097368864146, lng: 7.850222931413185 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'workshop',
      npcId: 'carl_gears',
      characterName: 'Карл "Шестерёнка"',
      services: ['crafting', 'upgrade'],
      dialogues: ['carl_introduction', 'invention_discussion'],
      atmosphere:
        'Тесное, заваленное деталями помещение. Среди хаоса виден порядок, понятный только самому Карлу.',
      relationship: {
        initialLevel: 0,
        maxLevel: 100,
      },
    },
    createdAt: Date.now(),
  },

  // Медцентр Синтеза
  {
    id: 'synthesis_medical_center',
    title: 'Медцентр "Гиппократ"',
    description:
      'Клиника фракции Синтез. Здесь лечат раненых, продают медикаменты и иногда выдают задания, связанные с полевой медициной.',
    coordinates: { lat: 47.99350491104801, lng: 7.845726036754058 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'medical',
      npcId: 'npc_lena_richter',
      characterName: 'Лена Рихтер',
      faction: 'synthesis',
      services: ['healing', 'medicine_trade', 'first_aid_training'],
      dialogues: ['field_medicine_quest', 'medical_assistance'],
      questBindings: ['field_medicine', 'medical_supplies_quest'],
      atmosphere:
        'Стерильный, но не лишённый человеческого тепла медицинский блок. Запах антисептика и приглушённые голоса персонала.',
    },
    createdAt: Date.now(),
  },

  // Доска объявлений FJR
  {
    id: 'fjr_board',
    title: 'Доска объявлений FJR',
    description:
      'Официальная доска объявлений Фрайбургского Жилищного Резерва. Здесь висят контракты, наряды и объявления для рекрутов.',
    coordinates: { lat: 47.9969, lng: 7.8513 },
    type: 'board',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'bulletin_board',
      faction: 'fjr',
      services: ['quests', 'recruitment', 'news'],
      dialogues: ['fjr_bulletin_board_dialog'],
      questBindings: ['fjr_recruitment', 'patrol_duty', 'security_contract', 'baptism_by_fire'],
      atmosphere:
        'Строгий стенд с аккуратно развешенными листами. Края многих объявлений затёрты от частых прикосновений.',
    },
    createdAt: Date.now(),
  },

  {
    id: 'fjr_briefing_point',
    title: 'Брифинг-точка FJR',
    description:
      'Место, где сержант FJR коротко инструктирует рекрутов перед вылазками. Здесь можно получить вводный брифинг.',
    coordinates: { lat: 47.996967960860246, lng: 7.855025931272138 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'briefing_point',
      faction: 'fjr',
      services: ['quests'],
      npcId: 'npc_sgt_kruger',
      questBindings: ['baptism_by_fire'],
      atmosphere:
        'Небольшой пятачок с полевой картой и ящиком амуниции. Здесь коротко и по делу объясняют, во что ты ввязываешься.',
      requiresFaction: 'fjr',
      minReputation: 20,
    },
    createdAt: Date.now(),
  },

  // Инфо-бюро на станции
  {
    id: 'info_bureau',
    title: 'Инфо-бюро на сортировочной станции',
    description:
      'Небольшое окошко регистрации и справок. Здесь старушка-регистратор помогает новичкам с первыми ориентирами.',
    coordinates: { lat: 47.99805434969426, lng: 7.841994665633422 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'information',
      npcId: 'old_lady_registrar',
      characterName: 'Старушка-регистратор',
      services: ['information', 'registration'],
      atmosphere:
        'Тёплый уголок с замусоленными бумажками и старым терминалом. Старушка приветливо кивает каждому новому лицу.',
      questBindings: ['first_steps_in_freiburg'],
      unlockRequirements: {
        flags: ['arrived_at_freiburg'],
      },
      sceneBindings: [
        {
          sceneId: 'info_bureau_meeting',
          triggerType: 'click',
          conditions: {
            flags: ['arrived_at_freiburg'],
          },
          priority: 1,
        },
      ],
      danger_level: 'low',
    },
    createdAt: Date.now(),
  },

  // Лавка Элиаса "Ржавый Якорь" — цель квеста "Шанс для новичка"
  {
    id: 'market_square_elias_stall',
    title: 'Лавка "Ржавый Якорь"',
    description:
      'Небольшая лавка с запчастями и снаряжением. Здесь торгует Элиас, у которого нужно забрать ящик для мастера Дитера.',
    coordinates: { lat: 47.994429768036866, lng: 7.846396544822056 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'trader',
      npcId: 'npc_elias_trader',
      characterName: 'Элиас, лавочник',
      services: ['trade', 'information', 'rumors'],
      atmosphere:
        'Тесный прилавок, заваленный коробками и ящиками. Элиас зорко следит за каждым болтом и гайкой.',
      questBindings: ['chance_for_a_newbie', 'sanctuary_blessing'],
      danger_level: 'low',
      sceneBindings: [
        {
          sceneId: 'trader_meeting_dialog',
          triggerType: 'click',
          conditions: {
            flags: ['chance_for_newbie_active'],
            notFlags: ['has_dieter_parts'],
          },
          priority: 100,
        },
        {
          sceneId: 'elias_candles_purchase',
          triggerType: 'click',
          conditions: {
            flags: ['need_candles_for_johann'],
          },
          priority: 80,
        },
        {
          sceneId: 'elias_shop',
          triggerType: 'click',
          priority: 10,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Промзона Артисанов (Инфо-точка)
  {
    id: 'artisan_industrial_zone',
    title: 'Промзона Артисанов',
    description:
      'Промышленный район, контролируемый фракцией Артисанов. Здесь можно поискать работу или встретить ремесленников.',
    coordinates: { lat: 47.992, lng: 7.850 }, // Примерные координаты
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'industrial_zone',
      faction: 'artisans',
      atmosphere: 'Шум работающих станков, запах гари и металла. Здесь кипит работа.',
      services: ['work', 'crafting'],
      sceneBindings: [
        {
          sceneId: 'artisan_zone_arrival',
          triggerType: 'click',
          conditions: {
            notFlags: ['visited_artisan_zone'],
          },
          priority: 50,
        },
        {
          sceneId: 'artisan_bulletin_board',
          triggerType: 'click',
          conditions: {
            flags: ['visited_artisan_zone'],
          },
          priority: 10,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Кафедральный собор (Инфо-точка)
  {
    id: 'cathedral',
    title: 'Кафедральный собор',
    description:
      'Величественный собор, ставший убежищем для многих. Настоятель может нуждаться в помощи.',
    coordinates: { lat: 47.9955, lng: 7.8529 }, // Примерные координаты
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'religious',
      faction: 'old_believers',
      atmosphere: 'Тишина и полумрак, нарушаемые лишь тихими молитвами. Запах ладана.',
      services: ['healing', 'sanctuary'],
      questBindings: ['sanctuary_blessing'],
      sceneBindings: [
        {
          sceneId: 'father_johann_meeting',
          triggerType: 'click',
          conditions: {
            notFlags: ['met_father_johann'],
          },
          priority: 50,
        },
        {
          sceneId: 'johann_candles_return',
          triggerType: 'click',
          conditions: {
            flags: ['sanctuary_blessing_active', 'has_candles_for_johann'],
          },
          priority: 80,
        },
        {
          sceneId: 'johann_return_visit',
          triggerType: 'click',
          conditions: {
            flags: ['met_father_johann'],
          },
          priority: 10,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Штаб FJR (Инфо-точка)
  {
    id: 'fjr_hq',
    title: 'Штаб FJR',
    description:
      'Укрепленная база Фрайбургского Жилищного Резерва. Здесь принимают рекрутов и выдают военные контракты.',
    coordinates: { lat: 47.9975, lng: 7.854 }, // Примерные координаты
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'military_base',
      faction: 'fjr',
      atmosphere: 'Строгий порядок, патрули и укрепления. Чувствуется военная дисциплина.',
      services: ['recruitment', 'quests'],
      questBindings: ['fjr_recruitment_quest', 'baptism_by_fire'],
      sceneBindings: [
        {
          sceneId: 'fjr_recruitment_dialog',
          triggerType: 'click',
          conditions: {
            notFlags: ['met_fjr', 'fjr_recruitment_accepted'],
          },
          priority: 50,
        },
        {
          sceneId: 'fjr_briefing_point_dialog',
          triggerType: 'click',
          conditions: {
            flags: ['fjr_recruitment_accepted'],
          },
          priority: 40,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Августинерплац (Опасная зона, Анархисты)
  {
    id: 'augustinerplatz',
    title: 'Августинерплац',
    description:
      'Район, контролируемый анархистами. Опасное место, куда новичкам лучше не соваться без подготовки.',
    coordinates: { lat: 47.9935, lng: 7.8525 }, // Примерные координаты
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'danger_zone',
      faction: 'anarchists',
      danger_level: 'high',
      atmosphere: 'Разрисованные стены, баррикады и подозрительные личности. Воздух пропитан напряжением.',
      questBindings: ['anarchist_test'],
      sceneBindings: [
        {
          sceneId: 'augustinerplatz_warning',
          triggerType: 'click',
          conditions: {
            notFlags: ['anarchist_territory_entered'],
          },
          priority: 50,
        },
        {
          sceneId: 'asua_stargazer',
          triggerType: 'click',
          conditions: {
            flags: ['need_find_asua'],
            notFlags: ['met_asua'],
          },
          priority: 40,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Старый терминал (Закрытая точка, QR)
  {
    id: 'old_terminal',
    title: 'Старый терминал',
    description:
      'Старый заблокированный терминал. Требуется сканирование для доступа.',
    coordinates: { lat: 47.9982, lng: 7.8425 }, // Рядом со станцией
    type: 'poi',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'terminal',
      qrRequired: true,
      qrHint: 'Осмотрите старый электрощит – там нарисован символ шестерёнки.',
      isUnlocked: false,
      atmosphere: 'Ржавый терминал, покрытый пылью. Экран мигает, требуя авторизации.',
      danger_level: 'low',
    },
    createdAt: Date.now(),
  },

  // Ганс (Временный NPC у станции)
  {
    id: 'hans_at_station',
    title: 'Ганс',
    description:
      'Твой проводник в этот мир. Он ждет, пока ты освоишься, но скоро уйдет по своим делам.',
    coordinates: { lat: 47.9979, lng: 7.8422 }, // Рядом с инфо-бюро
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      characterName: 'Ганс',
      npcId: 'hans_guide',
      faction: 'fjr',
      dialogues: ['hans_post_prologue_dialog'],
      atmosphere: 'Ганс проверяет снаряжение, готовый выдвинуться в любой момент.',
      sceneBindings: [
        {
          sceneId: 'hans_reminder_dialog',
          triggerType: 'click',
          conditions: {
            flags: ['met_hans', 'hans_gave_first_quest'],
            notFlags: ['completed_dieter_delivery'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // =====================================
  // АКТ 1: РАСШИРЕННЫЕ ТОЧКИ ИНТЕРЕСА
  // =====================================

  // Бар Люды - важная точка для квеста "Лавочник-прогульщик"
  {
    id: 'ludas_bar',
    title: 'Бар "У Люды"',
    description:
      'Маленький бар на окраине торгового квартала. Здесь собираются слухи со всего города.',
    coordinates: { lat: 47.9948, lng: 7.8488 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'social',
      npcId: 'luda_bartender',
      characterName: 'Люда',
      services: ['rumors', 'drinks', 'rest'],
      atmosphere: 'Тусклый свет, запах дешёвого пива и табака. Люда протирает стаканы за стойкой.',
      dialogues: ['luda_gossip_dialog', 'luda_shopkeeper_info'],
      questBindings: ['shopkeeper_truant'],
      interactionMenu: [
        { id: 'talk_luda', label: 'Поговорить с Людой', sceneId: 'luda_introduction' },
        { id: 'buy_drink', label: 'Купить напиток', sceneId: 'luda_drink_scene', cost: 5 },
        { id: 'ask_rumors', label: 'Спросить о слухах', sceneId: 'luda_rumors_scene' },
      ],
      danger_level: 'low',
    },
    createdAt: Date.now(),
  },

  // Швабская площадь - встреча с Карапузом
  {
    id: 'schwabian_square',
    title: 'Швабская площадь',
    description:
      'Оживлённая площадь, где собираются торговцы и посредники. Здесь можно найти Карапуза.',
    coordinates: { lat: 47.9952, lng: 7.8505 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'public_square',
      atmosphere: 'Шум торговли, крики разносчиков, запах жареных колбасок.',
      npcId: 'karapuz',
      characterName: 'Карапуз',
      dialogues: ['karapuz_introduction', 'karapuz_quest_shopkeeper'],
      questBindings: ['shopkeeper_truant'],
      sceneBindings: [
        {
          sceneId: 'karapuz_meeting',
          triggerType: 'click',
          conditions: {
            flags: ['arrived_at_freiburg'],
            notFlags: ['met_karapuz'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Главный рынок - Фленс
  {
    id: 'main_market_flens',
    title: 'Главный рынок - Лавка Фленса',
    description:
      'Крупная торговая точка на главном рынке. Фленс знает всё о местных торговцах.',
    coordinates: { lat: 47.9945, lng: 7.8462 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'trader',
      npcId: 'flens_merchant',
      characterName: 'Фленс',
      services: ['trade', 'information'],
      atmosphere: 'Аккуратная лавка с разнообразным товаром. Фленс щурится на каждого покупателя.',
      dialogues: ['flens_introduction', 'flens_shopkeeper_details'],
      questBindings: ['shopkeeper_truant'],
    },
    createdAt: Date.now(),
  },

  // Доходный дом - комната 3Б
  {
    id: 'tenement_3b',
    title: 'Доходный дом - комната 3Б',
    description:
      'Обшарпанный доходный дом. Комната 3Б пустует, но внутри могут быть улики.',
    coordinates: { lat: 47.9938, lng: 7.8512 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'investigation',
      qrRequired: true,
      qrHint: 'Найдите замок на двери 3Б. Код выцарапан на дверном косяке.',
      atmosphere: 'Скрипучие половицы, запах сырости. Дверь комнаты 3Б приоткрыта.',
      questBindings: ['shopkeeper_truant'],
      danger_level: 'medium',
      sceneBindings: [
        {
          sceneId: 'tenement_3b_investigation',
          triggerType: 'click',
          conditions: {
            flags: ['know_shopkeeper_location'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Клуб "Дыра" - встреча со Шрамом
  {
    id: 'the_hole_club',
    title: 'Клуб "Дыра"',
    description:
      'Подпольный клуб на границе анархистской территории. Здесь правит Шрам.',
    coordinates: { lat: 47.9932, lng: 7.8535 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'underground',
      faction: 'anarchists',
      npcId: 'scar_boss',
      characterName: 'Шрам',
      atmosphere: 'Темнота, пульсирующий бас, тени движутся в дыму. Шрам сидит в углу.',
      dialogues: ['scar_introduction', 'scar_shopkeeper_deal'],
      questBindings: ['shopkeeper_truant'],
      danger_level: 'high',
      unlockRequirements: {
        flags: ['tenement_evidence_found'],
      },
    },
    createdAt: Date.now(),
  },

  // Коллекторы - финал квеста лавочника
  {
    id: 'collectors_techroom',
    title: 'Техническая комната коллекторов',
    description:
      'Заброшенная техническая комната в канализационных тоннелях. Здесь прячется беглец.',
    coordinates: { lat: 47.9928, lng: 7.8520 },
    type: 'location',
    phase: 1,
    isActive: false,
    metadata: {
      category: 'dungeon',
      qrRequired: true,
      qrHint: 'Люк коллектора отмечен символом волны.',
      atmosphere: 'Эхо капающей воды, запах плесени. В углу виднеется свет.',
      questBindings: ['shopkeeper_truant'],
      danger_level: 'high',
      unlockRequirements: {
        flags: ['scar_gave_location'],
      },
    },
    createdAt: Date.now(),
  },

  // Штадтгартен - патрульная зона FJR
  {
    id: 'stadtgarten_patrol',
    title: 'Штадтгартен',
    description:
      'Городской парк, превращённый в патрульную зону FJR. Здесь проводят боевое крещение.',
    coordinates: { lat: 47.9962, lng: 7.8478 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'patrol_zone',
      faction: 'fjr',
      atmosphere: 'Заросшие аллеи, разрушенные беседки. Патрульные FJR держат периметр.',
      questBindings: ['baptism_by_fire'],
      danger_level: 'medium',
      combatZone: true,
      enemyTypes: ['scavenger', 'wild_dog'],
      maxEnemies: 3,
    },
    createdAt: Date.now(),
  },

  // Теплица Штадтгартена - для квеста Синтеза
  {
    id: 'stadtgarten_greenhouse',
    title: 'Теплица Штадтгартена',
    description:
      'Полуразрушенная теплица с редкими растениями. Лена Рихтер просила собрать образцы.',
    coordinates: { lat: 47.9958, lng: 7.8472 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'exploration',
      faction: 'synthesis',
      atmosphere: 'Буйная зелень пробивается сквозь разбитые стёкла. Воздух влажный и тёплый.',
      questBindings: ['field_medicine'],
      danger_level: 'medium',
      collectibles: ['medicinal_herb', 'fungal_sample', 'mutated_plant'],
      sceneBindings: [
        {
          sceneId: 'greenhouse_exploration',
          triggerType: 'click',
          conditions: {
            flags: ['field_medicine_active'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Отец Иоанн в Кафедрале
  {
    id: 'cathedral_father_johann',
    title: 'Кафедральный собор - Отец Иоанн',
    description:
      'Величественный собор, где служит отец Иоанн. Он предлагает убежище и мудрые советы.',
    coordinates: { lat: 47.9957, lng: 7.8531 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'religious',
      faction: 'old_believers',
      npcId: 'father_johann',
      characterName: 'Отец Иоанн',
      services: ['healing', 'blessing', 'sanctuary', 'quests'],
      atmosphere: 'Свет свечей играет на древних витражах. Тихая молитва эхом разносится по нефу.',
      dialogues: ['father_johann_welcome', 'father_johann_blessing', 'father_johann_quest'],
      sceneBindings: [
        {
          sceneId: 'father_johann_meeting',
          triggerType: 'click',
          conditions: {
            flags: ['arrived_at_freiburg'],
            notFlags: ['met_father_johann'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Доска объявлений Артисанов
  {
    id: 'artisan_bulletin_board',
    title: 'Доска объявлений Артисанов',
    description:
      'Большая доска с заказами на ремонт и изготовление. Здесь Артисаны ищут помощников.',
    coordinates: { lat: 47.9922, lng: 7.8502 },
    type: 'board',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'bulletin_board',
      faction: 'artisans',
      services: ['quests', 'crafting_orders'],
      atmosphere: 'Листки с заказами прикреплены в несколько слоёв. Некоторые уже пожелтели.',
      questBindings: ['artisan_repair_job', 'salvage_mission'],
      interactionMenu: [
        { id: 'view_orders', label: 'Просмотреть заказы', sceneId: 'artisan_board_view' },
        { id: 'take_job', label: 'Взять работу', sceneId: 'artisan_board_job' },
      ],
    },
    createdAt: Date.now(),
  },

  // Вальдемар - лидер Анархистов (осторожно!)
  {
    id: 'augustinerplatz_waldemar',
    title: 'Августинерплац - Штаб Вальдемара',
    description:
      'Центр анархистского квартала. Здесь царит хаос, но есть и свои правила.',
    coordinates: { lat: 47.9933, lng: 7.8528 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'faction_leader',
      faction: 'anarchists',
      npcId: 'waldemar_one',
      characterName: 'Вальдемар "Один"',
      danger_level: 'high',
      atmosphere: 'Граффити, баррикады, костры. Люди смотрят на чужаков с подозрением.',
      dialogues: ['waldemar_introduction', 'waldemar_ideology'],
      unlockRequirements: {
        flags: ['anarchist_contact'],
        minReputation: { faction: 'anarchists', value: 10 },
      },
      sceneBindings: [
        {
          sceneId: 'augustinerplatz_warning',
          triggerType: 'click',
          conditions: {
            notFlags: ['anarchist_contact'],
          },
          priority: 1,
        },
        {
          sceneId: 'waldemar_audience',
          triggerType: 'click',
          conditions: {
            flags: ['anarchist_contact'],
          },
          priority: 2,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Асуа - разведчица Анархистов
  {
    id: 'asua_lookout',
    title: 'Наблюдательный пост - Асуа',
    description:
      'Тайный наблюдательный пост на крыше. Здесь дежурит Асуа, мечтательница среди анархистов.',
    coordinates: { lat: 47.9936, lng: 7.8522 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'scout',
      faction: 'anarchists',
      npcId: 'asua_scout',
      characterName: 'Асуа',
      atmosphere: 'Ветер треплет флаги. Асуа смотрит в бинокль, но её мысли где-то далеко.',
      dialogues: ['asua_dreams', 'asua_synthesis_interest'],
      unlockRequirements: {
        flags: ['anarchist_territory_entered'],
      },
      sceneBindings: [
        {
          sceneId: 'asua_stargazer',
          triggerType: 'click',
          conditions: {
            flags: ['anarchist_territory_entered'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Профессор Шмидт - основная цель посылки
  {
    id: 'professor_schmidt_office',
    title: 'Кабинет профессора Шмидта',
    description:
      'Кабинет в университетском корпусе. Профессор исчез, но здесь могут быть следы.',
    coordinates: { lat: 47.9944, lng: 7.8460 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'investigation',
      faction: 'synthesis',
      atmosphere: 'Пыльные книги, разбросанные бумаги. Кабинет выглядит покинутым в спешке.',
      questBindings: ['delivery_for_professor', 'professor_mystery'],
      unlockRequirements: {
        flags: ['know_professor_location'],
      },
      sceneBindings: [
        {
          sceneId: 'professor_office_investigation',
          triggerType: 'click',
          conditions: {
            flags: ['know_professor_location'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Скрытая точка - тело сталкера (динамическое событие)
  {
    id: 'stalker_body_alley',
    title: 'Тёмный переулок',
    description:
      'Узкий переулок между зданиями. Что-то здесь не так...',
    coordinates: { lat: 47.9946, lng: 7.8435 },
    type: 'poi',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'dynamic_event',
      eventType: 'search_zone',
      atmosphere: 'Холодный ветер, запах железа. На земле что-то блестит.',
      danger_level: 'medium',
      rewards: {
        xp: 25,
        items: ['stalker_badge', 'mysterious_note'],
      },
      combatTrigger: {
        enemyTypes: ['mutant_rat'],
        count: 2,
        chance: 0.7,
      },
      sceneBindings: [
        {
          sceneId: 'alley_discovery',
          triggerType: 'proximity',
          conditions: {
            notFlags: ['alley_discovered'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Мастерская Рико
  {
    id: 'rico_workshop_ceh4',
    title: 'Цех 4 - Мастерская Рико',
    description:
      'Подвальная мастерская, где Рико создаёт свои "игрушки". Гранаты и взрывчатка.',
    coordinates: { lat: 47.9918, lng: 7.8498 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'workshop',
      npcId: 'rico_demolitionist',
      characterName: 'Рико',
      services: ['explosives', 'crafting'],
      atmosphere: 'Запах пороха и масла. Везде провода, детонаторы и схемы.',
      dialogues: ['rico_greeting', 'rico_trade'],
      unlockRequirements: {
        flags: ['rico_hideout_marker'],
      },
      sceneBindings: [
        {
          sceneId: 'rico_shop',
          triggerType: 'click',
          conditions: {
            flags: ['rico_hideout_marker'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Командант Мартен Хольц - FJR
  {
    id: 'fjr_commandant_office',
    title: 'Штаб FJR - Кабинет Команданта',
    description:
      'Кабинет Мартена Хольца, команданта FJR. Сюда пускают только по делу.',
    coordinates: { lat: 47.9978, lng: 7.8545 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'faction_leader',
      faction: 'fjr',
      npcId: 'commandant_holtz',
      characterName: 'Мартен Хольц',
      atmosphere: 'Строгий порядок, карты на стенах, запах табака. Хольц сидит за столом.',
      dialogues: ['holtz_audience', 'holtz_mission_briefing'],
      unlockRequirements: {
        flags: ['fjr_trusted'],
        minReputation: { faction: 'fjr', value: 30 },
      },
    },
    createdAt: Date.now(),
  },

  // Сержант Крюгер - инструктор FJR
  {
    id: 'fjr_sergeant_kruger',
    title: 'Сержант Крюгер',
    description:
      'Суровый инструктор FJR. Проводит боевое крещение для новобранцев.',
    coordinates: { lat: 47.9970, lng: 7.8548 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'instructor',
      faction: 'fjr',
      npcId: 'sgt_kruger',
      characterName: 'Сержант Крюгер',
      services: ['training', 'quests'],
      atmosphere: 'Крюгер кричит на новобранцев. Его шрамы говорят о многом.',
      dialogues: ['kruger_briefing', 'kruger_debriefing'],
      questBindings: ['baptism_by_fire'],
      sceneBindings: [
        {
          sceneId: 'kruger_first_meeting',
          triggerType: 'click',
          conditions: {
            flags: ['fjr_board_quest_taken'],
            notFlags: ['met_kruger'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Карл "Шестерёнка" - лидер Артисанов
  {
    id: 'carl_gears_hq',
    title: 'Штаб Артисанов - Карл "Шестерёнка"',
    description:
      'Центр управления Артисанами. Карл следит за работой всего района.',
    coordinates: { lat: 47.9920, lng: 7.8505 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'faction_leader',
      faction: 'artisans',
      npcId: 'carl_gears',
      characterName: 'Карл "Шестерёнка"',
      atmosphere: 'Грохот станков, искры сварки. Карл с прожжёнными руками командует работниками.',
      dialogues: ['carl_introduction', 'carl_work_offer'],
      unlockRequirements: {
        flags: ['artisan_contact'],
      },
      sceneBindings: [
        {
          sceneId: 'carl_audience',
          triggerType: 'click',
          conditions: {
            flags: ['artisan_contact'],
          },
          priority: 1,
        },
      ],
    },
    createdAt: Date.now(),
  },

  // Мэр Аурелия Фокс
  {
    id: 'mayor_aurelia_fox',
    title: 'Ратуша - Кабинет мэра',
    description:
      'Кабинет Аурелии Фокс, "железной леди" Фрайбурга. Попасть сюда почти невозможно.',
    coordinates: { lat: 47.9968, lng: 7.8495 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'city_leader',
      faction: 'neutral',
      npcId: 'mayor_fox',
      characterName: 'Аурелия Фокс',
      atmosphere: 'Холодная роскошь, идеальный порядок. Фокс смотрит на город из окна.',
      dialogues: ['fox_audience'],
      unlockRequirements: {
        flags: ['mayor_summons'],
        minReputation: { faction: 'fjr', value: 50 },
      },
    },
    createdAt: Date.now(),
  },

  // Элиас/Траверс - серый кардинал
  {
    id: 'traverse_office',
    title: 'Тайный кабинет Траверса',
    description:
      'Скрытый офис серого кардинала чёрного рынка. Сюда попадают только избранные.',
    coordinates: { lat: 47.9943, lng: 7.8470 },
    type: 'npc',
    phase: 1,
    isActive: false,
    metadata: {
      category: 'black_market',
      npcId: 'traverse_broker',
      characterName: 'Траверс',
      atmosphere: 'Полумрак, дым сигар, шёпот. Траверс знает всё о каждом.',
      dialogues: ['traverse_deal', 'traverse_information'],
      unlockRequirements: {
        flags: ['traverse_invitation'],
      },
    },
    createdAt: Date.now(),
  },
]

// Factory that returns seed points with fresh timestamps
export function getSeedMapPoints(): SeedMapPoint[] {
  const now = Date.now()
  return SEED_MAP_POINTS.map((p) => ({ ...p, createdAt: now }))
}

