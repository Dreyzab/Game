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
  // 🏕️ ВРЕМЕННЫЙ ЛАГЕРЬ
  {
    id: 'synthesis_camp_storage',
    title: 'Склад "Синтеза"',
    description: 'Временный лагерь с товаром и ящиками. Здесь можно найти припасы и обменять ресурсы',
    coordinates: { lat: 47.9945, lng: 7.853 },
    type: 'poi',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'storage',
      faction: 'synthesis',
      services: ['trade', 'storage'],
      npcs: ['trader_ivan'],
      atmosphere: 'Временные палатки, запах костра и готовящейся еды'
    },
    createdAt: Date.now()
  },

  // 🔧 МАСТЕРСКИЕ
  {
    id: 'workshop_center',
    title: 'Мастерская Дитера',
    description: 'Центральная мастерская. Запах машинного масла и металла наполняет воздух',
    coordinates: { lat: 48.0015, lng: 7.855 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'workshop',
      npcId: 'dieter_craftsman',
      characterName: 'Дитер "Молот"',
      services: ['repair', 'crafting', 'upgrade'],
      dialogues: ['craftsman_meeting_dialog', 'weapon_repair_dialog'],
      questBindings: ['craftsman_quest_chain'],
      atmosphere: 'Грохот молота, искры от сварки, запах машинного масла',
      relationship: {
        initialLevel: 0,
        maxLevel: 100,
        reputationRequired: 10
      }
    },
    createdAt: Date.now()
  },

  {
    id: 'carl_private_workshop',
    title: 'Мастерская Карла "Шестерёнки"',
    description: 'Личная мастерская изобретателя. Стол завален чертежами и механизмами',
    coordinates: { lat: 47.994097368864146, lng: 7.850222931413185 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'workshop',
      npcId: 'carl_gears',
      characterName: 'Карл "Шестерёнки"',
      services: ['crafting', 'upgrade'],
      dialogues: ['carl_introduction', 'invention_discussion'],
      atmosphere: 'Уютная мастерская, чертежи на стенах, запах смазки',
      relationship: {
        initialLevel: 0,
        maxLevel: 100
      }
    },
    createdAt: Date.now()
  },

  // 🏥 МЕДИЦИНСКИЕ ТОЧКИ
  {
    id: 'synthesis_medical_center',
    title: 'Медпункт "Синтеза"',
    description: 'Медицинский центр для лечения и помощи нуждающимся. Чистота и порядок среди хаоса',
    coordinates: { lat: 47.99350491104801, lng: 7.845726036754058 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'medical',
      npcId: 'doctor_elena',
      characterName: 'Доктор Елена',
      faction: 'synthesis',
      services: ['healing', 'medicine_trade', 'first_aid_training'],
      dialogues: ['field_medicine_quest', 'medical_assistance'],
      questBindings: ['field_medicine_quest', 'medical_supplies_quest'],
      atmosphere: 'Запах антисептика, белые палатки с красным крестом'
    },
    createdAt: Date.now()
  },

  // ⚔️ ВОЕННЫЕ СТРУКТУРЫ (FJR)
  {
    id: 'fjr_board',
    title: 'Доска объявлений FJR',
    description: 'Официальные объявления и набор добровольцев. Плакаты с призывами к порядку',
    coordinates: { lat: 47.9969, lng: 7.8513 },
    type: 'board',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'bulletin_board',
      faction: 'fjr',
      services: ['quests', 'recruitment', 'news'],
      dialogues: ['fjr_bulletin_board_dialog'],
      questBindings: ['fjr_recruitment', 'patrol_duty', 'security_contract'],
      atmosphere: 'Деревянная доска с бумажными объявлениями, военная символика'
    },
    createdAt: Date.now()
  },

  {
    id: 'fjr_briefing_point',
    title: 'Брифинг FJR',
    description: 'Сбор перед патрулём Stadtgarten. Точка сбора добровольцев',
    coordinates: { lat: 47.996967960860246, lng: 7.855025931272138 },
    type: 'anomaly',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'briefing_point',
      faction: 'fjr',
      services: ['quests'],
      atmosphere: 'Военные палатки, карты на столах, запах оружейного масла',
      requiresFaction: 'fjr',
      minReputation: 20
    },
    createdAt: Date.now()
  },

  // 🏛️ РЕЛИГИОЗНЫЕ ТОЧКИ
  {
    id: 'old_believers_square',
    title: 'Центральная площадь (Отец Иоанн)',
    description: 'Пожилый настоятель Катедраля — Отец Иоанн просит о помощи',
    coordinates: { lat: 47.99554815122133, lng: 7.851961457760126 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'religious',
      npcId: 'father_ioann',
      characterName: 'Отец Иоанн',
      faction: 'old_believers',
      services: ['blessing', 'confession', 'shelter'],
      dialogues: ['father_ioann_plea', 'cathedral_help'],
      questBindings: ['help_cathedral', 'protect_believers'],
      atmosphere: 'Старинная площадь, звон колоколов, запах ладана',
      relationship: {
        initialLevel: 0,
        maxLevel: 100
      }
    },
    createdAt: Date.now()
  },

  // 🏴‍☠️ АНАРХИСТСКИЕ ТОЧКИ
  {
    id: 'anarchist_hole',
    title: '«Дыра» (Анархисты)',
    description: 'Свободная зона под управлением анархистов. Царство хаоса и свободы',
    coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
    type: 'settlement',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'anarchist_zone',
      faction: 'anarchists',
      services: ['black_market', 'underground_intel', 'refuge'],
      npcs: ['rivet_leader', 'dealers', 'informants'],
      atmosphere: 'Граффити на стенах, костры, музыка и смех. Свобода без правил',
      danger_level: 'medium',
      lawless: true,
      tradeOptions: {
        blackMarket: true,
        stolenGoods: true,
        contraband: true
      }
    },
    createdAt: Date.now()
  },

  {
    id: 'anarchist_arena_basement',
    title: 'Подвал Арены',
    description: 'Место, где скрывается Заклёпка и его люди. Секретный штаб анархистов',
    coordinates: { lat: 47.9936, lng: 7.8526 },
    type: 'npc',
    phase: 2,
    isActive: true,
    metadata: {
      category: 'hideout',
      npcId: 'rivet_anarchist',
      characterName: 'Заклёпка',
      faction: 'anarchists',
      services: ['quests'],
      dialogues: ['rivet_meeting', 'anarchist_ideology'],
      questBindings: ['anarchist_questline', 'revolution_plot'],
      atmosphere: 'Тёмный подвал, запах пороха, карты города на стенах',
      hidden: true,
      unlockRequirements: { flags: ['anarchist_reputation_30', 'found_entrance'] },
      danger_level: 'low'
    },
    createdAt: Date.now()
  },

  // 🎭 РАЗВЛЕКАТЕЛЬНЫЕ ТОЧКИ
  {
    id: 'quiet_cove_bar',
    title: 'Бар "Тихая Заводь"',
    description: 'Уютное место где можно встретить Люду и узнать новости',
    coordinates: { lat: 47.99286477134066, lng: 7.854099265544107 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'bar',
      npcId: 'lyuda_bartender',
      characterName: 'Люда',
      services: ['information', 'rumors', 'rest', 'drinks'],
      dialogues: ['whisper_in_quiet_cove_quest', 'bar_gossip', 'news_exchange'],
      questBindings: ['whisper_in_quiet_cove_quest', 'information_network'],
      atmosphere: 'Тёплый свет, тихая музыка, запах пива и жареного мяса',
      socialHub: true,
      informationQuality: 'high',
      priceRange: 'medium'
    },
    createdAt: Date.now()
  },

  // ⚗️ АНОМАЛЬНЫЕ ЗОНЫ
  {
    id: 'northern_anomaly',
    title: 'Северная Аномальная Зона',
    description: 'Искажения воздуха, странные звуки и синее свечение. Опасная территория',
    coordinates: { lat: 48.0205, lng: 7.87 },
    type: 'anomaly',
    phase: 2,
    isActive: true,
    metadata: {
      category: 'anomaly',
      danger_level: 'high',
      services: ['exploration', 'artifact_hunting'],
      dialogues: ['anomaly_exploration_dialog', 'scientist_warning'],
      questBindings: ['anomaly_investigation', 'artifact_retrieval'],
      atmosphere: 'Искажённое пространство, синее свечение, электрические разряды',
      hazards: {
        radiation: 'low',
        temporal_distortion: 'medium',
        hostile_entities: 'high'
      },
      rewards: {
        artifacts: true,
        rareResources: true,
        scientificData: true
      },
      requiresEquipment: ['geiger_counter', 'protective_suit'],
      recommendedLevel: 10
    },
    createdAt: Date.now()
  },

  // Станция: Информационное бюро
  {
    id: 'info_bureau',
    title: 'Информационное бюро',
    description: 'Окно в систему “Фрайбург”. Здесь выдают первые сведения и регистрируют прибывших.',
    coordinates: { lat: 47.99805434969426, lng: 7.841994665633422 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'information',
      npcId: 'old_lady_registrar',
      characterName: 'Старушка-регистратор',
      services: ['information', 'registration'],
      atmosphere: 'Старинный стол с бумагами, тихо и упорядоченно.',
      questBindings: ['first_steps_in_freiburg'],
      unlockRequirements: {
        flags: ['arrived_at_freiburg']
      },
      sceneBindings: [
        {
          sceneId: 'info_bureau_meeting',
          triggerType: 'click',
          conditions: {
            flags: ['arrived_at_freiburg']
          },
          priority: 1
        }
      ],
      danger_level: 'low'
    },
    createdAt: Date.now()
  },

  // Рынок: Торговец
  {
    id: 'trader_market',
    title: 'Торговец',
    description: 'Рынок под открытым небом. Здесь можно обменять ресурсы и разузнать слухи.',
    coordinates: { lat: 47.994429768036866, lng: 7.846396544822056 },
    type: 'npc',
    phase: 1,
    isActive: true,
    metadata: {
      category: 'trader',
      npcId: 'market_trader',
      characterName: 'Рыночный торговец',
      services: ['trade', 'information', 'rumors'],
      atmosphere: 'Шумный рынок, запах специй, оживлённые разговоры.',
      questBindings: ['first_delivery_quest'],
      unlockRequirements: {
        flags: ['met_hans', 'got_communicator']
      },
      sceneBindings: [
        {
          sceneId: 'trader_first_meeting',
          triggerType: 'click',
          conditions: { flags: ['met_hans'] },
          priority: 1,
          interactionMenu: {
            enabled: true,
            options: [
              { id: 'trade', label: 'К товарам', sceneId: 'trader_goods_overview' },
              { id: 'talk', label: 'Поговорить', sceneId: 'trader_rumors' },
              { id: 'quest', label: 'Есть задание?', sceneId: 'trader_quest_delivery', condition: { flags: ['hans_gave_first_quest'] } }
            ]
          }
        }
      ],
      danger_level: 'low'
    },
    createdAt: Date.now()
  }
]

// Factory that returns seed points with fresh timestamps
export function getSeedMapPoints(): SeedMapPoint[] {
  const now = Date.now()
  return SEED_MAP_POINTS.map((p) => ({ ...p, createdAt: now }))
}
