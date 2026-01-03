// Shared seed data for map points used by db:seed and client fallbacks.
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
  // Стартовая точка (Drop Zone)
  {
    id: 'sdg_drop_zone',
    title: 'Зона Высадки (SDG)',
    description: 'Место вашего появления во Фрайбурге. Свежий воздух и неизвестность.',
    coordinates: { lat: 47.9940, lng: 7.8480 }, // TBD: Adjust to real drop location
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'start_point',
      visibility: {
        initiallyHidden: false
      },
      sceneBindings: [
        {
          sceneId: 'onboarding_sdg_arrival',
          triggerType: 'click',
          conditions: {
            notFlags: ['arrived_at_freiburg']
          },
          priority: 100
        }
      ]
    },
    createdAt: Date.now(),
  },
  // Цех Артисанов «Шестеренка» (бывший "Опора")
  {
    id: 'workshop_center',
    title: 'Цех Артисанов «Шестеренка»',
    description:
      'Сердце городской инфраструктуры в бывшем депо. Здесь Мастер Дитер и артисаны чинят всё: от кофеварок до БТРов. Шум, пар и запах масла.',
    coordinates: { lat: 47.993, lng: 7.849 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'workshop',
      faction: 'artisans',
      philosophy: 'pragmatism',
      magic_level: 'low',
      atmosphere:
        'Огромный цех, заполненный паром и лязгом металла. Артисаны работают слаженно, как единый механизм.',
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
          sceneId: 'dieter_schlossberg_return',
          triggerType: 'click',
          conditions: {
            flags: ['schlossberg_crystal_obtained', 'met_dieter'],
            notFlags: ['schlossberg_crystal_delivered'],
          },
          priority: 95,
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

  // Кампус "Синтез"
  {
    id: 'synthesis_campus',
    title: 'Кампус "Синтез" (Здание "Солнечный Корабль")',
    description:
      'Центр исследований Разломов и база трансгуманистов. Здесь пытаются совместить магию и технологию.',
    coordinates: { lat: 47.9942, lng: 7.8465 }, // Мерцхаузерштрассе
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'synthesis_campus',
      faction: 'synthesis',
      philosophy: 'transhumanism',
      magic_level: 'medium',
      questBindings: ['delivery_for_professor'],
      isGlobalObjective: true,
      atmosphere: 'Стерильный хай-тек, гудение серверов и мягкий свет лабораторных ламп.',
      npcId: 'prof_steinbach',
      sceneBindings: [
        {
          sceneId: 'university_wait_evening',
          triggerType: 'click',
          conditions: {
            flags: ['waiting_for_kruger'],
          },
          priority: 100,
        },
        {
          sceneId: 'university_gate_denial',
          triggerType: 'click',
          conditions: {
            notFlags: ['visited_synthesis_campus'],
          },
          priority: 90,
        },
      ],
    },
    createdAt: Date.now(),
  },



  // Медцентр Синтеза (Location)
  {
    id: 'synthesis_medical_center',
    title: 'Медцентр "Гиппократ"',
    description:
      'Клиника фракции Синтез. Здесь лечат раненых и продают медикаменты.',
    coordinates: { lat: 47.99350491104801, lng: 7.845726036754058 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'medical',
      faction: 'synthesis',
      atmosphere:
        'Стерильный, но не лишённый человеческого тепла медицинский блок. Запах антисептика и приглушённые голоса персонала.',
    },
    createdAt: Date.now(),
  },



  // Инфо-бюро (Location)
  {
    id: 'info_bureau',
    title: 'Инфо-бюро на сортировочной станции',
    description:
      'Небольшое окошко регистрации и справок.',
    coordinates: { lat: 47.99805434969426, lng: 7.841994665633422 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'information',
      atmosphere:
        'Тёплый уголок с замусоленными бумажками и старым терминалом.',
      unlockRequirements: {
        flags: ['arrived_at_freiburg'],
      },
      sceneBindings: [
        {
          sceneId: 'info_bureau_meeting',
          triggerType: 'click',
          conditions: {
            flags: ['arrived_at_freiburg'],
            notFlags: ['visited_info_bureau'],
          },
          priority: 10,
        },
        {
          sceneId: 'info_bureau_return',
          triggerType: 'click',
          conditions: {
            flags: ['arrived_at_freiburg', 'visited_info_bureau'],
          },
          priority: 1,
        },
      ],
      danger_level: 'low',
    },
    createdAt: Date.now(),
  },

  // Лавка Элиаса "Ржавый Якорь" — цель квеста "Шанс для новичка"
  // Лавка "Ржавый Якорь" (Location)
  {
    id: 'market_square_elias_stall',
    title: 'Лавка "Ржавый Якорь"',
    description:
      'Небольшая лавка с запчастями и снаряжением.',
    coordinates: { lat: 47.994429768036866, lng: 7.846396544822056 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'trader',
      atmosphere:
        'Тесный прилавок, заваленный коробками и ящиками.',
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



  // Фрайбургский Мюнстер (База Староверов)
  {
    id: 'cathedral',
    title: 'Фрайбургский Мюнстер',
    description:
      'Духовный щит города. Зона, свободная от монстров и Скверны благодаря молитвам Староверов.',
    coordinates: { lat: 47.9955, lng: 7.8529 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'religious',
      faction: 'old_believers',
      philosophy: 'traditionalism',
      magic_level: 'holy', // Очищение
      atmosphere: 'Тишина, запах ладана и ощущение абсолютной безопасности. Здесь дышится легче.',
      services: ['healing', 'sanctuary', 'cleansing'],
      questBindings: ['sanctuary_blessing'],
      npcId: 'father_johann', // Отец Иоанн (Keep just for reference if needed or remove entirely)
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

  // Ворота Швабентор — КПП на выход к Шлосбергу
  {
    id: 'schwabentor_gate',
    title: 'Ворота Швабентор',
    description:
      'КПП у восточных ворот. Через Швабентор начинается старая тропа к Шлосбергу.',
    coordinates: { lat: 47.9939, lng: 7.8562 },
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'checkpoint',
      faction: 'fjr',
      atmosphere:
        'Массивная арка, баррикады и шлагбаум. Патрульные FJR проверяют бумаги и держат палец на спуске.',
      questBindings: ['whispers_of_rift'],
      danger_level: 'medium',
      sceneBindings: [
        {
          sceneId: 'schwabentor_morning_denial',
          triggerType: 'click',
          conditions: {
            flags: ['need_visit_schwabentor'],
            notFlags: ['schwabentor_blocked'],
          },
          priority: 100,
        },
        {
          sceneId: 'schwabentor_morning_open',
          triggerType: 'click',
          conditions: {
            flags: ['schwabentor_blocked', 'whispers_delayed_until_morning', 'rested_at_cathedral'],
            notFlags: ['schlossberg_access_granted'],
          },
          priority: 90,
        },
        {
          sceneId: 'schwabentor_departure_ready',
          triggerType: 'click',
          conditions: {
            flags: ['schlossberg_access_granted'],
            notFlags: ['schlossberg_crystal_obtained'],
          },
          priority: 80,
        },
        {
          sceneId: 'schwabentor_closed_repeat',
          triggerType: 'click',
          conditions: {
            flags: ['schwabentor_blocked'],
          },
          priority: 10,
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
    qrCode: 'gw3:point:old_terminal',
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


  // КПП Станции
  {
    id: 'sgt_hans_station',
    title: 'КПП Станции',
    description:
      'Укрепленный блокпост FJR у входа на вокзал.',
    coordinates: { lat: 47.9979, lng: 7.8422 }, // Рядом с инфо-бюро
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      faction: 'fjr',
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
      services: ['rumors', 'drinks', 'rest'],
      atmosphere: 'Тусклый свет, запах дешёвого пива и табака. Люда протирает стаканы за стойкой.',
      questBindings: ['shopkeeper_truant'],
      sceneBindings: [
        {
          sceneId: 'luda_introduction',
          triggerType: 'click',
          conditions: {
            flags: ['arrived_at_freiburg'],
          },
          priority: 1,
        },
      ],
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

  // Клуб "Дыра"
  {
    id: 'the_hole_club',
    title: 'Клуб "Дыра" (The Hole)',
    description:
      'Штаб Анархистов в подвалах сквота в Вобане. Место обмена информацией без цензуры.',
    coordinates: { lat: 47.975, lng: 7.825 }, // Vauban approx
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'underground',
      faction: 'anarchists',
      philosophy: 'nihilism',
      magic_level: 'low',
      npcId: 'scar_boss',
      characterName: 'Шрам', // keep simple ref or remove
      atmosphere: 'Громкая музыка, дым, неоновые граффити. Свобода граничит с хаосом.',
      services: ['rumors', 'black_market_info'],
      questBindings: ['shopkeeper_truant'],
      danger_level: 'high',
      unlockRequirements: {
        flags: ['tenement_evidence_found'],
      },
      sceneBindings: [
        {
          sceneId: 'hole_club_entry',
          triggerType: 'click',
          conditions: {
            flags: ['tenement_evidence_found'],
            notFlags: ['shopkeeper_truant_completed'],
          },
          priority: 1,
        },
      ],
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
    isActive: true,
    metadata: {
      category: 'dungeon',
      atmosphere: 'Эхо капающей воды, запах плесени. В углу виднеется свет.',
      questBindings: ['shopkeeper_truant'],
      danger_level: 'high',
      unlockRequirements: {
        flags: ['collector_entrance_found'],
      },
      sceneBindings: [
        {
          sceneId: 'collectors_techroom_rescue',
          triggerType: 'click',
          conditions: {
            flags: ['collector_entrance_found'],
            notFlags: ['shopkeeper_truant_completed'],
          },
          priority: 1,
        },
      ],
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
      archetype: 'lone_wolf',
      ethel_affinity: 'unstable_crystals',
      services: ['explosives', 'crafting'],
      atmosphere: 'Запах пороха и масла. Везде провода, детонаторы и схемы. "Бум — это дипломатия."',
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







  // Ратушная площадь — регистрация новоприбывших
  {
    id: 'rathaus_square',
    title: 'Ратушная площадь',
    description:
      'Площадь перед сердцем старого города и его мэрией. Здесь новоприбывшие проходят первичную регистрацию.',
    coordinates: { lat: 47.996131438492796, lng: 7.8495038381611835 },
    type: 'location',
    phase: 1,
    isActive: true,
    qrCode: 'gw3:point:rathaus_square',
    metadata: {
      category: 'townhall',
      faction: 'neutral',
      questBindings: ['city_registration'],
      qrRequired: true,
      qrHint: 'QR-код закреплён у входа на Ратушную площадь.',
      atmosphere:
        'Площадь перед сердцем старого города. Каменная мэрия XVI–XVII веков со временем стала частью административного квартала.',
      sceneBindings: [
        {
          sceneId: 'onboarding_townhall_registration',
          triggerType: 'qr',
          conditions: { notFlags: ['city_registered'] },
          priority: 100,
        },
        {
          sceneId: 'onboarding_townhall_registration',
          triggerType: 'click',
          conditions: { notFlags: ['city_registered'] },
          priority: 90,
        },
      ],
    },
    createdAt: Date.now(),
  },





  // =====================================
  // НОВЫЕ ТОЧКИ (ФРАЙБУРГ 2040+ В2.0)
  // =====================================

  // Штаб ОРДНУНГА (Бывшая Библиотека UB)
  {
    id: 'ordnung_hq',
    title: 'Штаб ОРДНУНГА',
    description: 'Цитадель бюрократии и внутренней полиции. Здесь держат задержанных и хранят архивы.',
    coordinates: { lat: 47.9948, lng: 7.8485 }, // Platz der Alten Synagoge
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'government_hub',
      faction: 'ordnung',
      philosophy: 'order_legalism',
      magic_level: 'zero', // Стерильность
      services: ['permits', 'archives', 'detention'],
      atmosphere: 'Стерильные коридоры, сканеры сетчатки, бесконечные очереди просителей.',
    },
    createdAt: Date.now(),
  },

  // База FJR «Бертольд»
  {
    id: 'fjr_base_berthold',
    title: 'База FJR «Бертольд»',
    description: 'Военный форт и грузовая база. Здесь стоят БТРы «Boxer» и царит дисциплина.',
    coordinates: { lat: 48.0125, lng: 7.8465 }, // Промзона Север
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'military_base',
      faction: 'fjr',
      philosophy: 'stoicism',
      magic_level: 'low',
      npcId: 'col_fjr_commandant',
      services: ['repair_heavy', 'equipment_fjr', 'recruitment'],
      questBindings: ['fjr_recruitment', 'patrol_duty', 'security_contract', 'baptism_by_fire'],
      atmosphere: 'Запах солярки, лязг гусениц, строгие команды.',
    },
    createdAt: Date.now(),
  },

  // Торговый Пост «Караван-Сарай»
  {
    id: 'trade_post_caravanserai',
    title: 'Торговый Пост «Караван-Сарай»',
    description: 'Вотчина Торговцев. Склады с довоенными чипами и консервами.',
    coordinates: { lat: 47.9975, lng: 7.8405 }, // Старые пакгаузы
    type: 'location',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'trade_hub',
      faction: 'merchants',
      philosophy: 'objectivism',
      magic_level: 'low',
      services: ['trade', 'auction', 'black_market'],
      atmosphere: 'Горы контейнеров, шум аукциона, блеск кредитов.',
    },
    createdAt: Date.now(),
  },

  // Община «Белый Ручей»
  {
    id: 'settlement_white_creek',
    title: 'Община «Белый Ручей»',
    description: 'Аграрный оплот Фрайбурга. Здесь выращивают еду на грани зон отчуждения.',
    coordinates: { lat: 47.985, lng: 7.900 },
    type: 'settlement',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'agrarian',
      faction: 'farmers',
      philosophy: 'agrarianism',
      archetype: 'devoted_comrade',
      magic_level: 'low',
      services: ['food_trade', 'rest', 'herbalism'],
      npcId: 'elder_martha', // Староста Марта
      characterName: 'Староста Марта',
      questBindings: ['harvest_of_corruption', 'protect_livestock'],
      atmosphere: 'Запах мокрой земли, мычание мутировавших коров, ощущение тяжелого труда.',
    },
    createdAt: Date.now(),
  },

  // Теплый Разлом (Warm Rift)
  {
    id: 'warm_rift',
    title: 'Теплый Разлом (Оранжерея)',
    description: 'Магическая аномалия посреди парка. Источник тепла и странных растений.',
    coordinates: { lat: 47.975, lng: 7.810 }, // Park Schoenberg approx
    type: 'anomaly',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'rift',
      faction: 'contested',
      danger_level: 'high',
      magic_level: 'critical',
      resources: ['ether_moss'],
      atmosphere: 'Фиолетовое свечение, тепло среди зимы, инопланетная флора.',
    },
    createdAt: Date.now(),
  },











  // Штольни Шлоссберга
  {
    id: 'schlossberg_tunnels',
    title: 'Штольни Шлоссберга',
    description: 'Старые бункеры и штольни, заселенные мутантами. Где-то в глубине есть Серверная.',
    coordinates: { lat: 47.9945, lng: 7.8605 },
    type: 'location',
    phase: 1,
    isActive: false, // Hidden strictly initially? Or visible but locked?
    metadata: {
      category: 'dungeon',
      faction: 'neutral',
      danger_level: 'extreme',
      magic_level: 'high',
      atmosphere: 'Темнота, эхо капающей воды, пси-давление.',
    },
    createdAt: Date.now(),
  }
]

// Factory that returns seed points with fresh timestamps
export function getSeedMapPoints(): SeedMapPoint[] {
  const now = Date.now()
  return SEED_MAP_POINTS.map((p) => ({ ...p, createdAt: now }))
}
