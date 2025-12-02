import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Таблица игроков с поддержкой deviceId
  // Progression (phase/skills/xp) хранится в game_progress, здесь только идентификаторы и метаданные
  players: defineTable({
    userId: v.optional(v.string()), // Clerk user ID (может быть пустым для анонимных игроков)
    deviceId: v.string(), // Уникальный идентификатор устройства
    name: v.string(),
    fame: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    abandonedAt: v.optional(v.number()),
    attempt: v.optional(v.number()),
    templateVersion: v.optional(v.number()),

    // Multiplayer fields
    factionId: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    lastSeen: v.optional(v.number()), // Timestamp для удаления оффлайн-игроков с карты
    status: v.optional(v.string()),   // 'idle', 'in_combat', 'trading'
  })
    .index('by_userId', ['userId'])
    .index('by_deviceId', ['deviceId'])
    .index('by_userId_deviceId', ['userId', 'deviceId'])
    .index('by_location', ['location.lat', 'location.lng'])
    .index('by_lastSeen', ['lastSeen']),

  // Каталог квестов (шаблоны)
  quests: defineTable({
    id: v.string(), // Внутренний ID квеста
    title: v.string(),
    description: v.string(),
    phase: v.number(), // Фаза, на которой доступен квест
    prerequisites: v.array(v.string()), // ID квестов, которые должны быть выполнены
    rewards: v.object({
      fame: v.number(),
      items: v.optional(v.array(v.string())),
      flags: v.optional(v.array(v.string()))
    }),
    steps: v.array(v.object({
      id: v.string(),
      description: v.string(),
      type: v.union(
        v.literal('location'),
        v.literal('dialogue'),
        v.literal('combat'),
        v.literal('item')
      ),
      requirements: v.optional(v.any()) // Гибкие требования для каждого типа
    })),
    isActive: v.boolean(),
    repeatable: v.optional(v.boolean()),
    templateVersion: v.optional(v.number()),
    createdAt: v.number()
  })
    .index('by_phase', ['phase'])
    .index('by_active', ['isActive'])
    .index('byQuestId', ['id']),

  // Прогресс игроков по квестам
  quest_progress: defineTable({
    playerId: v.id('players'),
    questId: v.string(),
    currentStep: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    // Прогресс может быть числом (для простых квестов), объектом (для сложных с несколькими параметрами)
    // или массивом (для квестов с несколькими шагами). Используем union вместо v.any() для типобезопасности.
    progress: v.optional(v.union(
      v.number(),
      v.object({}),
      v.array(v.any())
    )),
    abandonedAt: v.optional(v.number()),
    attempt: v.optional(v.number()),
    templateVersion: v.optional(v.number()),
    updatedAt: v.number()
  })
    .index('by_player', ['playerId'])
    .index('by_quest', ['questId'])
    .index('by_player_quest', ['playerId', 'questId'])
    .index('by_completed', ['completedAt'])
    .index('by_player_completed', ['playerId', 'completedAt'])
    .index('by_player_abandoned', ['playerId', 'abandonedAt']),

  // Пространственные точки карты
  map_points: defineTable({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number()
    }),
    qrCode: v.optional(v.string()),
    type: v.union(
      v.literal('poi'),
      v.literal('quest'),
      v.literal('npc'),
      v.literal('location'),
      v.literal('board'),      // Доски объявлений
      v.literal('settlement'), // Поселения
      v.literal('anomaly')     // Аномальные зоны
    ),
    phase: v.optional(v.number()),
    isActive: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number()
  })
    .index('by_point_id', ['id'])
    .index('by_coordinates', ['coordinates.lat', 'coordinates.lng'])
    .index('by_qr_code', ['qrCode'])
    .index('by_type', ['type'])
    .index('by_phase', ['phase'])
    .index('by_active', ['isActive']),

  // Привязки точек к квестам
  mappoint_bindings: defineTable({
    mapPointId: v.id('map_points'),
    questId: v.string(),
    stepId: v.optional(v.string()), // Конкретный шаг квеста
    bindingType: v.union(
      v.literal('start'), // Точка начинает квест
      v.literal('progress'), // Точка продвигает квест
      v.literal('complete') // Точка завершает квест
    ),
    requirements: v.optional(v.any()),
    createdAt: v.number()
  })
    .index('by_mapPoint', ['mapPointId'])
    .index('by_quest', ['questId'])
    .index('by_quest_step', ['questId', 'stepId']),

  // Состояние мира (глобальные флаги и события)
  world_state: defineTable({
    key: v.string(),
    value: v.any(),
    phase: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    updatedAt: v.number()
  })
    .index('by_key', ['key'])
    .index('by_phase', ['phase'])
    .index('by_expires', ['expiresAt'])

  ,

  // Per-player discovery state for map points
  point_discoveries: defineTable({
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    pointKey: v.string(),
    discoveredAt: v.optional(v.number()),
    researchedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('by_deviceId', ['deviceId'])
    .index('by_userId', ['userId'])
    .index('by_pointKey', ['pointKey'])
    .index('by_device_point', ['deviceId', 'pointKey'])
    .index('by_user_point', ['userId', 'pointKey']),

  // Прогресс визуальной новеллы и игровые флаги
  game_progress: defineTable({
    deviceId: v.optional(v.string()), // Устройство игрока (для оффлайн)
    userId: v.optional(v.string()),   // Пользователь (если авторизован)
    currentScene: v.string(),          // Текущая сцена визуальной новеллы
    visitedScenes: v.array(v.string()), // Посещённые сцены
    flags: v.any(),                    // Игровые флаги (Record<string, unknown>)

    // --- Progression fields ---
    phase: v.optional(v.number()),
    skills: v.optional(v.any()),       // Record<string, number> - уровни голосов
    level: v.optional(v.number()),     // Player level
    xp: v.optional(v.number()),        // Experience towards next level
    skillPoints: v.optional(v.number()), // Unspent skill points
    reputation: v.optional(v.any()),

    // --- Combat & Survival Stats (from inveAndCombs.md) ---
    hp: v.optional(v.number()),        // Health Points (Физическое)
    maxHp: v.optional(v.number()),
    morale: v.optional(v.number()),    // Willpower/Morale (Психическое)
    maxMorale: v.optional(v.number()),
    stamina: v.optional(v.number()),   // Action Points/Stamina (Выносливость)
    maxStamina: v.optional(v.number()),

    lastAppliedSeq: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    abandonedAt: v.optional(v.number()),
    attempt: v.optional(v.number())
  })
    .index('by_deviceId', ['deviceId'])
    .index('by_userId', ['userId'])
    .index('by_updatedAt', ['updatedAt']),

  scene_logs: defineTable({
    deviceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    sceneId: v.string(),
    choices: v.optional(
      v.array(
        v.object({
          sceneId: v.string(),
          lineId: v.string(),
          choiceId: v.string(),
          effects: v.optional(v.any()),
        })
      )
    ),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    payload: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_device', ['deviceId'])
    .index('by_scene', ['sceneId']),


  // Зоны опасности (где спаунятся враги)
  danger_zones: defineTable({
    id: v.string(),
    name: v.string(),
    polygon: v.array(v.object({ lat: v.number(), lng: v.number() })),
    dangerLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    enemyTypes: v.array(v.string()),
    spawnPoints: v.array(v.object({ lat: v.number(), lng: v.number() })),
    maxEnemies: v.number(),
    isActive: v.boolean(),
    createdAt: v.number()
  })
    .index("by_zone_id", ["id"])
    .index("by_active", ["isActive"]),

  // Безопасные зоны (полигоны, где враги не спаунятся)
  safe_zones: defineTable({
    id: v.string(),
    name: v.string(),
    faction: v.optional(v.string()),
    polygon: v.array(v.object({ lat: v.number(), lng: v.number() })),
    isActive: v.boolean(),
    createdAt: v.number()
  })
    .index("by_zone_id", ["id"])
    .index("by_active", ["isActive"]),

  // Состояние врагов (активные экземпляры)
  enemy_instances: defineTable({
    id: v.string(),
    type: v.string(),
    position: v.object({ lat: v.number(), lng: v.number() }),
    state: v.union(v.literal("patrol"), v.literal("chase"), v.literal("attack")),
    targetPlayerId: v.optional(v.string()),
    speed: v.number(), // км/ч
    detectionRadius: v.number(), // метры
    attackRadius: v.number(), // метры
    health: v.number(),
    maxHealth: v.number(),
    zoneId: v.string(),
    spawnedAt: v.number(),
    lastUpdate: v.number()
  })
    .index("by_instance_id", ["id"])
    .index("by_zone", ["zoneId"])
    .index("by_state", ["state"]),

  // Уровень шума игрока
  player_noise: defineTable({
    playerId: v.optional(v.string()),
    deviceId: v.string(),
    noiseLevel: v.number(), // 0-10
    position: v.object({ lat: v.number(), lng: v.number() }),
    lastCombat: v.optional(v.number()),
    decayRate: v.number(), // единиц в минуту
    updatedAt: v.number()
  })
    .index("by_player", ["playerId"])
    .index("by_device", ["deviceId"]),

  // --- Combat Sessions (Active Fights) - Kinetic Layer v0.4 ---
  combat_sessions: defineTable({
    playerId: v.id('players'),
    deviceId: v.string(),
    enemyIds: v.array(v.string()), // Enemy instance IDs
    isActive: v.boolean(),
    mode: v.optional(v.string()), // 'standard' | 'arena'

    // Turn management
    turn: v.number(),
    phase: v.union(
      v.literal('initiative'),
      v.literal('player_turn'),
      v.literal('enemy_turn'),
      v.literal('resolution'),
      v.literal('victory'),
      v.literal('defeat'),
      v.literal('flee')
    ),
    turnOrder: v.array(v.string()), // Combatant IDs in initiative order
    currentActorIndex: v.number(),
    turnTimeRemaining: v.optional(v.number()), // seconds

    // Arena - Side-View Rank System
    playerRank: v.number(), // 1-4
    zoneModifierId: v.optional(v.string()), // Geo-narrative zone
    environment: v.optional(v.string()),

    // Player State in Combat
    playerState: v.object({
      hp: v.number(),
      maxHp: v.number(),
      morale: v.number(),
      maxMorale: v.number(),
      stamina: v.number(),
      maxStamina: v.number(),
      exhaustionLevel: v.union(
        v.literal('none'),
        v.literal('winded'),
        v.literal('exhausted'),
        v.literal('collapsed')
      ),
      currentWeaponId: v.optional(v.string()),
      currentAmmo: v.number(),
      weaponCondition: v.number(),
      weaponHeat: v.number(),
      activeEffects: v.array(v.object({
        type: v.string(),
        value: v.number(),
        remainingTurns: v.number(),
        source: v.string()
      })),
      posture: v.optional(v.string()),
      jamState: v.optional(v.object({
        isJammed: v.boolean(),
        jamChance: v.number(),
        accumulatedHeat: v.number()
      }))
    }),

    // Enemy States
    enemyStates: v.array(v.object({
      id: v.string(),
      templateId: v.string(),
      name: v.string(),
      rank: v.number(),
      hp: v.number(),
      maxHp: v.number(),
      morale: v.number(),
      armor: v.number(),
      activeEffects: v.array(v.object({
        type: v.string(),
        value: v.number(),
        remainingTurns: v.number(),
        source: v.string()
      }))
    })),

    // Deck State (Card-based combat)
    hand: v.array(v.any()),
    deck: v.array(v.any()),
    discard: v.array(v.any()),
    exhaustPile: v.array(v.any()),

    // Click Moment tracking
    lastClickMoment: v.optional(v.object({
      turn: v.number(),
      weaponId: v.string(),
      consequence: v.string()
    })),

    // Combat Log
    log: v.array(v.object({
      turn: v.number(),
      phase: v.string(),
      actorId: v.string(),
      actorName: v.string(),
      action: v.string(),
      targets: v.optional(v.array(v.string())),
      damage: v.optional(v.number()),
      effects: v.optional(v.array(v.string())),
      voiceComment: v.optional(v.object({
        voiceId: v.string(),
        voiceName: v.string(),
        comment: v.string()
      })),
      timestamp: v.number()
    })),

    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_player", ["playerId"])
    .index("by_device", ["deviceId"])
    .index("by_active", ["isActive"]),

  // --- Combat Zones (Geo-Narrative Modifiers) ---
  combat_zones: defineTable({
    id: v.string(),
    zoneType: v.string(), // sanctuary, chaos_zone, forge, canals, neutral
    name: v.string(),
    nameRu: v.string(),

    // Effects
    voiceBuffs: v.any(), // Record<VoiceId, number>
    voiceDebuffs: v.any(),
    cardCostModifiers: v.any(),
    damageModifiers: v.any(),
    specialEffects: v.array(v.any()),

    // Lore
    historicalContext: v.string(),
    geniusLociDescription: v.string(),

    // Geo
    polygon: v.optional(v.array(v.object({ lat: v.number(), lng: v.number() }))),

    isActive: v.boolean(),
    createdAt: v.number()
  })
    .index("by_zone_id", ["id"])
    .index("by_type", ["zoneType"])
    .index("by_active", ["isActive"]),

  // --- Weapon Templates ---
  weapon_templates: defineTable({
    id: v.string(),
    name: v.string(),
    nameRu: v.string(),
    type: v.string(), // pistol, shotgun, rifle, etc.
    isRanged: v.boolean(),

    // Stats
    magazineSize: v.optional(v.number()),
    damage: v.optional(v.string()), // dice notation
    damageType: v.string(),
    accuracy: v.number(),
    range: v.array(v.number()), // valid ranks

    // Cold Steel Protocol
    coldSteelAction: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      nameRu: v.string(),
      damage: v.string(),
      damageType: v.string(),
      staminaCost: v.number(),
      effects: v.array(v.any()),
      requiredVoice: v.string(),
      validRanks: v.array(v.number())
    })),

    // Degradation
    maxCondition: v.number(),
    jamBaseChance: v.number(),
    rankPenalties: v.any(), // Record<CombatRank, number>

    createdAt: v.number()
  })
    .index("by_weapon_id", ["id"])
    .index("by_type", ["type"]),

  // --- Enemy Templates ---
  enemy_templates: defineTable({
    id: v.string(),
    name: v.string(),
    nameRu: v.string(),
    threatLevel: v.union(v.literal('T1'), v.literal('T2'), v.literal('T3'), v.literal('T4')),
    aiType: v.string(), // scavenger, enforcer, feral_drone, boss

    // Stats
    hp: v.number(),
    morale: v.number(),
    armor: v.number(),

    // Behavior
    preferredRanks: v.array(v.number()),
    retreatThreshold: v.number(),
    immunities: v.array(v.string()),
    availableActions: v.array(v.string()),

    // AI
    aggroRadius: v.optional(v.number()),
    fleeConditions: v.optional(v.array(v.string())),

    // Rewards
    xpReward: v.number(),
    lootTable: v.optional(v.string()),

    createdAt: v.number()
  })
    .index("by_enemy_id", ["id"])
    .index("by_threat", ["threatLevel"]),

  // --- Card Templates ---
  card_templates: defineTable({
    id: v.string(),
    name: v.string(),
    nameRu: v.string(),
    type: v.string(), // attack, defense, movement, voice, item, reaction, cold_steel
    rarity: v.string(),

    // Costs
    staminaCost: v.number(),
    ammoCost: v.optional(v.number()),

    // Requirements
    requiredRanks: v.optional(v.array(v.number())),
    targetRanks: v.optional(v.array(v.number())),

    // Effects
    baseDamage: v.optional(v.string()),
    damageType: v.optional(v.string()),
    effects: v.array(v.any()),

    // Trinity Protocol
    sourceWeapon: v.optional(v.string()),
    sourceArtifact: v.optional(v.string()),
    scalingVoice: v.optional(v.string()),
    scalingFormula: v.optional(v.string()),

    // Visual
    icon: v.string(),
    animation: v.optional(v.string()),

    createdAt: v.number()
  })
    .index("by_card_id", ["id"])
    .index("by_type", ["type"]),

  // --- Inventory System ---

  // Items (Instances)
  // Items (Instances)
  // Items (Instances)
  items: defineTable({
    ownerId: v.string(), // userId or deviceId
    templateId: v.string(), // Reference to static item data (e.g., "rusty_pipe")
    instanceId: v.string(), // Unique ID for this specific item instance

    // Core Data (copied from template for independence)
    kind: v.string(), // ItemKind
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    rarity: v.string(), // Rarity

    // Stats
    stats: v.object({
      damage: v.optional(v.number()),
      defense: v.optional(v.number()),
      weight: v.number(),
      width: v.number(),
      height: v.number(),
      maxDurability: v.optional(v.number()),
      capacity: v.optional(v.number()),
      containerConfig: v.optional(v.object({
        width: v.number(),
        height: v.number(),
        name: v.string()
      })),
      specialEffects: v.optional(v.array(v.object({
        name: v.string(),
        type: v.union(v.literal('buff'), v.literal('debuff'), v.literal('passive')),
        value: v.number(),
        description: v.string()
      })))
    }),

    // Location
    containerId: v.optional(v.string()), // If inside a container
    slot: v.optional(v.string()), // If equipped (e.g., "primary", "backpack")
    gridPosition: v.optional(v.object({ x: v.number(), y: v.number(), rotation: v.optional(v.number()) })), // If in a grid

    // State
    quantity: v.number(), // Stack size
    condition: v.optional(v.number()), // Current durability
    ammo: v.optional(v.number()),

    // Metadata
    tags: v.optional(v.array(v.string())),
    lore: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_owner", ["ownerId"])
    .index("by_container", ["containerId"])
    .index("by_instance", ["instanceId"]),

  // Trades (New)
  trades: defineTable({
    senderId: v.string(),
    receiverId: v.string(),
    itemInstanceId: v.string(),
    status: v.union(v.literal('pending'), v.literal('completed'), v.literal('rejected')),
    createdAt: v.number(),
    completedAt: v.optional(v.number())
  })
    .index("by_receiver", ["receiverId", "status"])
    .index("by_sender", ["senderId"]),

  // Containers (Storage)
  containers: defineTable({
    ownerId: v.string(),
    kind: v.string(), // "backpack", "rig", "pocket", "stash"
    name: v.optional(v.string()),
    width: v.number(),
    height: v.number(),
    isLocked: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_owner", ["ownerId"]),

  // Equipment State (Slots mapping)
  equipment: defineTable({
    ownerId: v.string(),
    slots: v.object({
      primary: v.optional(v.id("items")),
      secondary: v.optional(v.id("items")),
      melee: v.optional(v.id("items")),
      helmet: v.optional(v.id("items")),
      armor: v.optional(v.id("items")),
      clothing_top: v.optional(v.id("items")),
      clothing_bottom: v.optional(v.id("items")),
      backpack: v.optional(v.id("items")),
      rig: v.optional(v.id("items")),
      artifacts: v.array(v.id("items")),
      quick: v.array(v.union(v.id("items"), v.null()))
    }),
    updatedAt: v.number()
  })
    .index("by_owner", ["ownerId"]),

  // PvP Battles
  battles: defineTable({
    player1Id: v.id("players"),
    player2Id: v.optional(v.id("players")), // Optional for open lobbies
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("finished"),
      v.literal("cancelled")
    ),
    currentTurnPlayerId: v.optional(v.id("players")),
    winnerId: v.optional(v.id("players")),

    // State snapshot
    state: v.object({
      p1Health: v.number(),
      p2Health: v.number(),
      p1MaxHealth: v.number(),
      p2MaxHealth: v.number(),
      p1Energy: v.number(),
      p2Energy: v.number(),
      p1Hand: v.array(v.any()), // Array of Card objects
      p2Hand: v.array(v.any()),
      p1Deck: v.array(v.any()),
      p2Deck: v.array(v.any()),
      p1Discard: v.array(v.any()),
      p2Discard: v.array(v.any()),
    }),

    logs: v.array(v.object({
      message: v.string(),
      timestamp: v.number(),
      actorId: v.optional(v.string())
    })),

    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_status", ["status"])
    .index("by_player1", ["player1Id", "status"])
    .index("by_player2", ["player2Id", "status"])
})
