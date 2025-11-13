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
    templateVersion: v.optional(v.number())
  })
    .index('by_userId', ['userId'])
    .index('by_deviceId', ['deviceId'])
    .index('by_userId_deviceId', ['userId', 'deviceId']),

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
    // Progression fields (authoritative state shared with UI; players table should not duplicate these)
    phase: v.optional(v.number()),
    skills: v.optional(v.any()),       // Record<string, number>
    level: v.optional(v.number()),     // Player level
    xp: v.optional(v.number()),        // Experience towards next level
    skillPoints: v.optional(v.number()), // Unspent skill points
    reputation: v.optional(v.any()),
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
    .index("by_device", ["deviceId"])
})
