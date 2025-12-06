import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// ============================================================================
// LCSD (Local Co-op on Separate Devices) Types
// ============================================================================

// Asymmetric Role Types for Internal Parliament
const AsymmetricRoleSchema = v.union(
  v.literal("BODY"),   // Тело + Моторика: видит HP, броню, физ. угрозы
  v.literal("MIND"),   // Разум + Психика: видит слабости, вероятности, магию
  v.literal("SOCIAL")  // Социум + Сознание: видит намерения, мораль, диалоги
);

// Room Status for Coop Sessions
const RoomStatusSchema = v.union(
  v.literal("lobby"),
  v.literal("planning"),    // WeGo: фаза планирования
  v.literal("executing"),   // WeGo: фаза исполнения
  v.literal("resolution"),  // Подсчет результатов
  v.literal("finished")
);

// Session Player Status
const SessionPlayerStatusSchema = v.union(
  v.literal("thinking"),
  v.literal("ready"),
  v.literal("disconnected")
);

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
    squadId: v.optional(v.id("squads")), // Current squad
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
    experience: v.optional(v.number()), // Total Experience (alias/duplicate for now to match pvp.ts usage or unify)
    gold: v.optional(v.number()),      // Currency
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
    attempt: v.optional(v.number()),
    subclasses: v.optional(v.array(v.string()))
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

  // PvP Battles (Rank-Based Co-op)
  battles: defineTable({
    hostId: v.id("players"),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("finished"),
      v.literal("cancelled")
    ),
    currentTurnPlayerId: v.optional(v.string()),
    winnerId: v.optional(v.string()), // "players" or "ai"

    // Participants list for lobby management
    participants: v.array(v.object({
      playerId: v.id("players"),
      rank: v.number(), // 1-4
      classId: v.string(),
      joinedAt: v.number()
    })),

    // Turn Management
    turnOrder: v.optional(v.array(v.string())), // Array of playerIds/enemyIds
    round: v.optional(v.number()), // Current round number
    rewards: v.optional(v.array(v.object({
      playerId: v.string(),
      xp: v.number(),
      gold: v.number(),
      items: v.optional(v.array(v.string())) // Item Template IDs
    }))),

    // State snapshot
    state: v.object({
      // Players Formation (Ranks 1-4)
      // Key is Rank number as string "1", "2", "3", "4"
      formation: v.record(v.string(), v.object({
        playerId: v.id("players"),
        health: v.number(),
        maxHealth: v.number(),
        energy: v.number(),
        maxEnergy: v.number(),
        hand: v.array(v.any()), // Card objects
        deck: v.array(v.any()),
        discard: v.array(v.any()),
        effects: v.array(v.string()), // Buffs/Debuffs
      })),

      // Enemies (Abstracted for now, maybe just 1 boss or array)
      enemies: v.array(v.object({
        id: v.string(),
        name: v.string(),
        health: v.number(),
        maxHealth: v.number(),
        rank: v.number(), // Enemy ranks?
      })),
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
    .index("by_host", ["hostId", "status"]),

  // Squads (Persistent Teams)
  squads: defineTable({
    leaderId: v.id("players"),
    name: v.string(),
    members: v.array(v.id("players")),
    formation: v.record(
      v.string(),
      v.union(v.id("players"), v.null())
    ),
    inventory: v.optional(v.array(v.id("items"))), // Shared stash
    status: v.union(
      v.literal("idle"),
      v.literal("in_battle"),
      v.literal("in_event")
    ),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_leader", ["leaderId"]),

  // Zones (Faction Territory)
  zones: defineTable({
    name: v.string(),
    center: v.object({ lat: v.number(), lng: v.number() }),
    radius: v.number(), // meters
    ownerFactionId: v.optional(v.string()),
    status: v.union(
      v.literal("peace"),
      v.literal("contested"),
      v.literal("locked")
    ),
    health: v.number(), // 0-100
    lastCapturedAt: v.number(),
  })
    .index("by_status", ["status"]),

  // ============================================================================
  // LCSD COOP TABLES (Local Co-op on Separate Devices)
  // Реализация асимметричного локального кооператива
  // ============================================================================

  // COOP ROOMS: Эфемерные сессии с 4-буквенными кодами (паттерн Jackbox)
  coop_rooms: defineTable({
    roomCode: v.string(), // 4-символьный код (напр. "XJ9Z")
    hostId: v.id("players"),
    status: RoomStatusSchema,
    currentRound: v.number(),
    maxPlayers: v.number(), // Обычно 3 для Тело/Разум/Социум
    
    // Привязка к геолокации (опционально)
    locationId: v.optional(v.string()),
    zoneModifierId: v.optional(v.string()),
    
    // Глобальное состояние мира (реальные значения, фильтруются по ролям)
    globalState: v.object({
      enemyHp: v.number(),
      enemyMaxHp: v.number(),
      enemyMorale: v.number(),
      enemyMaxMorale: v.number(),
      enemyIntention: v.optional(v.string()), // Скрыто от BODY
      enemyWeaknesses: v.optional(v.array(v.string())), // Скрыто от SOCIAL
      enemyPhysicalThreat: v.optional(v.string()), // Скрыто от MIND
      environment: v.string(),
      turnTimer: v.optional(v.number()), // Секунды на ход
    }),
    
    // Враги с полными данными
    enemies: v.array(v.object({
      id: v.string(),
      templateId: v.string(),
      name: v.string(),
      rank: v.number(), // 1-4
      hp: v.number(),
      maxHp: v.number(),
      morale: v.number(),
      maxMorale: v.number(),
      armor: v.number(),
      intention: v.optional(v.string()), // "attack_rank_1", "buff_self", etc.
      intentionTarget: v.optional(v.string()),
      weaknesses: v.array(v.string()), // ["fire", "techno"]
      resistances: v.array(v.string()),
      activeEffects: v.array(v.object({
        type: v.string(),
        value: v.number(),
        remainingTurns: v.number(),
        source: v.string()
      }))
    })),
    
    // Shared Card Pool (Protocol Trinity)
    cardPool: v.array(v.object({
      cardId: v.string(),
      contributorId: v.string(), // Кто положил карту
      timestamp: v.number()
    })),
    
    // Combat Log
    log: v.array(v.object({
      round: v.number(),
      tick: v.number(),
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
    
    // Timing
    roundStartedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number()) // Для автоочистки неактивных комнат
  })
    .index("by_code", ["roomCode"])
    .index("by_status", ["status"])
    .index("by_host", ["hostId"])
    .index("by_expires", ["expiresAt"]),

  // COOP SESSION PLAYERS: Связка Игрок-Комната с асимметричными ролями
  coop_session_players: defineTable({
    roomId: v.id("coop_rooms"),
    playerId: v.id("players"),
    deviceId: v.string(),
    
    // Asymmetric Role (определяет что видит игрок)
    role: AsymmetricRoleSchema,
    roleName: v.string(), // "Физик", "Лицо", "Разум"
    
    // Position in formation
    rank: v.number(), // 1-4
    
    // Player State in Session
    status: SessionPlayerStatusSchema,
    hp: v.number(),
    maxHp: v.number(),
    stamina: v.number(),
    maxStamina: v.number(),
    morale: v.number(),
    maxMorale: v.number(),
    
    // Hand & Deck (Protocol Trinity)
    hand: v.array(v.any()),
    deck: v.array(v.any()),
    discard: v.array(v.any()),
    
    // Active Effects
    activeEffects: v.array(v.object({
      type: v.string(),
      value: v.number(),
      remainingTurns: v.number(),
      source: v.string()
    })),
    
    // Voice Skills Snapshot (для расчетов)
    voiceSkills: v.any(), // Record<VoiceId, number>
    
    joinedAt: v.number(),
    lastActionAt: v.optional(v.number())
  })
    .index("by_room", ["roomId"])
    .index("by_player", ["playerId"])
    .index("by_player_room", ["playerId", "roomId"])
    .index("by_device", ["deviceId"]),

  // COOP ACTIONS: Commit-Reveal система для WeGo
  coop_actions: defineTable({
    roomId: v.id("coop_rooms"),
    round: v.number(),
    playerId: v.id("players"),
    
    // Action Data
    cardId: v.string(),
    targetId: v.string(), // Enemy ID или Player ID
    targetType: v.union(v.literal("enemy"), v.literal("ally"), v.literal("self")),
    
    // Модификаторы от Protocol Trinity
    weaponModifier: v.optional(v.string()),
    artifactModifier: v.optional(v.string()),
    voiceModifier: v.optional(v.string()),
    
    // Commit-Reveal
    revealed: v.boolean(), // false во время planning, true после executing
    
    // Calculated at Reveal
    damage: v.optional(v.number()),
    effects: v.optional(v.array(v.string())),
    success: v.optional(v.boolean()),
    
    timestamp: v.number()
  })
    .index("by_room_round", ["roomId", "round"])
    .index("by_player", ["playerId"])
    .index("by_revealed", ["revealed"]),

  // COOP PRESENCE: Heartbeat система для обработки дисконнектов
  coop_presence: defineTable({
    roomId: v.id("coop_rooms"),
    playerId: v.id("players"),
    deviceId: v.string(),
    
    // Connection State
    isConnected: v.boolean(),
    lastHeartbeat: v.number(),
    
    // Cursor/Intent State (для показа "куда смотрит игрок")
    currentTarget: v.optional(v.string()), // Enemy/Ally ID
    hoveredCardIndex: v.optional(v.number()),
    
    // Device Info
    userAgent: v.optional(v.string()),
    connectionQuality: v.optional(v.union(
      v.literal("excellent"),
      v.literal("good"),
      v.literal("poor"),
      v.literal("disconnected")
    )),
    
    updatedAt: v.number()
  })
    .index("by_room", ["roomId"])
    .index("by_player", ["playerId"])
    .index("by_room_heartbeat", ["roomId", "lastHeartbeat"]),

  // COOP CARD CONTRIBUTIONS: Для Protocol Trinity "передачи карт"
  coop_card_contributions: defineTable({
    roomId: v.id("coop_rooms"),
    round: v.number(),
    
    // Кто предложил
    contributorId: v.id("players"),
    contributorRole: AsymmetricRoleSchema,
    
    // Что предложил
    cardId: v.string(),
    cardType: v.string(), // "weapon", "artifact", "voice"
    
    // Состояние вклада
    status: v.union(
      v.literal("offered"),    // Предложено
      v.literal("accepted"),   // Принято другим игроком
      v.literal("combined"),   // Скомбинировано в Protocol Trinity
      v.literal("expired")     // Истекло
    ),
    
    // Кто принял
    acceptedBy: v.optional(v.id("players")),
    combinedIntoActionId: v.optional(v.id("coop_actions")),
    
    timestamp: v.number()
  })
    .index("by_room_round", ["roomId", "round"])
    .index("by_contributor", ["contributorId"])
    .index("by_status", ["status"]),

  // ============================================================================
  // POLYPHONIC NARRATIVE ENGINE (Shared vs Private Reality)
  // Система полифонического нарратива — «Внутренний Парламент»
  // ============================================================================

  // SCENARIOS: Полифонические сценарии с privateInjections
  scenarios: defineTable({
    questId: v.optional(v.string()),  // Привязка к квесту (если есть)
    stepId: v.string(),               // ID шага/сцены
    chapterId: v.string(),            // chapter3, chapter4, etc.
    
    // Shared Reality — текст, видимый всем игрокам
    sharedContent: v.object({
      text: v.string(),
      speaker: v.string(),
      emotion: v.optional(v.string()),
      background: v.optional(v.string()),
    }),
    
    // Private Reality — инъекции внутренних голосов
    privateInjections: v.array(v.object({
      id: v.string(),                    // Уникальный ID инъекции
      voice: v.string(),                 // ID голоса: logic, empathy, perception, etc.
      voiceGroup: v.string(),            // Группа: body, motorics, mind, consciousness, psyche, sociality
      threshold: v.number(),             // Порог срабатывания (0-100)
      text: v.string(),                  // Текст внутренней мысли
      effect: v.optional(v.string()),    // Визуальный эффект: glitch, pulse, glow, terminal
      priority: v.number(),              // Приоритет при конфликте (выше = важнее)
      
      // Дополнительные условия
      requiredFlags: v.optional(v.array(v.string())),
      excludedFlags: v.optional(v.array(v.string())),
      
      // Эффекты от просмотра инъекции
      onView: v.optional(v.object({
        addFlags: v.optional(v.array(v.string())),
        xpBonus: v.optional(v.number()),
        unlockHint: v.optional(v.string()),
      })),
    })),
    
    // Варианты ответа
    options: v.array(v.object({
      id: v.string(),
      text: v.string(),
      nextStep: v.string(),
      requiredStat: v.optional(v.object({
        stat: v.string(),
        value: v.number()
      })),
      requiredFlag: v.optional(v.string()),
      effects: v.optional(v.object({
        addFlags: v.optional(v.array(v.string())),
        removeFlags: v.optional(v.array(v.string())),
        xp: v.optional(v.number()),
        reputation: v.optional(v.record(v.string(), v.number())),
      })),
    })),
    
    // Метаданные
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_quest_step", ["questId", "stepId"])
    .index("by_chapter", ["chapterId"])
    .index("by_step", ["stepId"])
    .index("by_active", ["isActive"]),

  // ============================================================================
  // RIFT SYSTEM (Разлом / The Pale)
  // Механика перехода через зону энтропии
  // ============================================================================

  // RIFT_EVENTS: Шаблоны испытаний в Разломе
  rift_events: defineTable({
    id: v.string(),
    zoneId: v.optional(v.string()),      // Привязка к зоне (если специфично)
    
    // Тип события
    eventType: v.union(
      v.literal("spatial_loop"),          // Пространственная Петля
      v.literal("siren_song"),            // Песня Сирен
      v.literal("gravity_well"),          // Гравитационный Колодец
      v.literal("echo_mimic"),            // Эхо-Мимик
      v.literal("time_dilation"),         // Временная Дилатация
      v.literal("perception_shift")       // Сдвиг Восприятия
    ),
    
    // Сложность и требования
    difficulty: v.number(),               // DC (Difficulty Class) для проверки
    statTested: v.string(),               // Атрибут для проверки: coordination, willpower, etc.
    secondaryStat: v.optional(v.string()), // Дополнительный атрибут
    
    // Тип проверки
    checkType: v.union(
      v.literal("red"),                   // Мгновенный штраф при провале
      v.literal("white"),                 // Можно перебросить
      v.literal("passive")                // Автоматическая проверка
    ),
    
    // Нарратив
    narrativeVoice: v.string(),           // Какой голос комментирует событие
    narrativeText: v.string(),            // Описание события
    counterVoice: v.optional(v.string()), // Противодействующий голос (если есть)
    counterText: v.optional(v.string()),  // Текст противодействия
    
    // Последствия провала
    failurePenalty: v.object({
      hp: v.number(),                     // Урон HP
      morale: v.number(),                 // Урон Морали
      stamina: v.number(),                // Потеря Стамины
      entropy: v.number(),                // Прибавка к глобальной энтропии
      debuff: v.optional(v.string()),     // Дебафф: exhausted, shaken, disoriented
    }),
    
    // Награда за успех
    successReward: v.object({
      xp: v.number(),
      morale: v.optional(v.number()),
      hint: v.optional(v.string()),       // Подсказка для отряда
    }),
    
    // Кооперативная механика
    canBeAssistedBy: v.optional(v.array(v.string())), // Роли, которые могут помочь
    assistBonus: v.optional(v.number()),  // Бонус к броску от помощи союзника
    
    // Весовой коэффициент для спавна
    spawnWeight: v.number(),              // Чем выше, тем чаще появляется
    minEntropyToSpawn: v.optional(v.number()), // Минимальная энтропия для появления
    
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_event_id", ["id"])
    .index("by_zone", ["zoneId"])
    .index("by_type", ["eventType"])
    .index("by_active", ["isActive"]),

  // ACTIVE_RIFTS: Активные сессии перехода через Разлом
  active_rifts: defineTable({
    squadId: v.id("squads"),
    
    // Состояние энтропии
    entropyLevel: v.number(),             // 0-100, глобальный счётчик нестабильности
    maxEntropy: v.number(),               // Порог критической энтропии (обычно 100)
    
    // Таймеры
    startTime: v.number(),                // Время входа в Разлом
    estimatedDuration: v.number(),        // Ожидаемое время перехода (мс)
    realWindowMs: v.optional(v.number()), // Реальное окно стабильности (скрытое)
    
    // Текущие дебаффы игроков
    playerDebuffs: v.array(v.object({
      playerId: v.id("players"),
      debuffId: v.string(),               // exhausted, shaken, disoriented, charmed
      appliedAt: v.number(),
      expiresAt: v.optional(v.number()),
      source: v.string(),                 // ID события, вызвавшего дебафф
    })),
    
    // Активные события
    activeEvents: v.array(v.object({
      eventId: v.string(),
      targetPlayerId: v.id("players"),
      triggeredAt: v.number(),
      status: v.union(
        v.literal("pending"),             // Ожидает реакции игрока
        v.literal("in_progress"),         // Игрок реагирует
        v.literal("success"),             // Пройдено
        v.literal("failed")               // Провалено
      ),
      assistedBy: v.optional(v.id("players")), // Кто помог
    })),
    
    // Лог событий Разлома
    eventLog: v.array(v.object({
      timestamp: v.number(),
      eventType: v.string(),
      playerId: v.string(),
      playerName: v.string(),
      result: v.string(),                 // success, failure, assisted
      entropyChange: v.number(),
      message: v.string(),
    })),
    
    // Геолокация (для GPS-проверок)
    startCoords: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    targetCoords: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    
    // Визуальные эффекты для клиента
    visualIntensity: v.number(),          // 0-100, интенсивность визуальных искажений
    
    // Статус сессии
    status: v.union(
      v.literal("active"),                // Переход в процессе
      v.literal("completed"),             // Успешно завершён
      v.literal("failed"),                // Критическая энтропия — провал
      v.literal("aborted")                // Отменён (отступление)
    ),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_squad", ["squadId"])
    .index("by_status", ["status"]),
})
