/**
 * COOP ROOMS - Система комнат для локального кооператива
 * Паттерн Jackbox: 4-буквенные коды для быстрого подключения
 * 
 * Реализует:
 * - Генерацию уникальных кодов комнат
 * - Создание/присоединение к комнате
 * - Асимметричное распределение ролей (BODY/MIND/SOCIAL)
 * - QR-код генерацию для Deep Link
 */

import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// CONSTANTS
// ============================================================================

// Алфавит без неоднозначных символов (I, 1, 0, O исключены)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;

// Таймауты (в миллисекундах)
const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 часа неактивности
const HEARTBEAT_TIMEOUT_MS = 15 * 1000; // 15 секунд без пульса = disconnected

// Роли и их свойства
const ROLES = {
  BODY: {
    name: "Физик",
    nameEn: "The Body",
    voiceGroups: ["ТЕЛО", "МОТОРИКА"], // СИЛА, СТОЙКОСТЬ, РЕАКЦИЯ, КООРДИНАЦИЯ
    visibleData: ["enemyHp", "enemyArmor", "physicalThreat", "staggerBar"],
    hiddenData: ["enemyIntention", "mentalWeaknesses", "dialogueOptions"],
    description: "Видит точное здоровье врагов и физические угрозы"
  },
  MIND: {
    name: "Разум", 
    nameEn: "The Mind",
    voiceGroups: ["РАЗУМ", "ПСИХИКА"], // ЛОГИКА, АНАЛИЗ, ТВОРЧЕСТВО, ИНТУИЦИЯ
    visibleData: ["elementalWeaknesses", "hitChance", "hiddenLoot", "technoTraps"],
    hiddenData: ["aggroLines", "physicalThreat", "dialogueOptions"],
    description: "Анализирует слабости и вероятности успеха"
  },
  SOCIAL: {
    name: "Лицо",
    nameEn: "The Face", 
    voiceGroups: ["СОЦИУМ", "СОЗНАНИЕ"], // ЭМПАТИЯ, ХАРИЗМА, АВТОРИТЕТ, ВОЛЯ
    visibleData: ["aggroLines", "enemyMorale", "dialogueOptions", "negotiationChance"],
    hiddenData: ["enemyHp", "elementalWeaknesses", "technoTraps"],
    description: "Видит намерения врагов и возможности переговоров"
  }
} as const;

// Предпочтения рангов по ролям
const ROLE_RANK_PREFERENCES: Record<string, number[]> = {
  BODY: [1, 2],   // Фронтлайн
  SOCIAL: [2, 3], // Средний ряд
  MIND: [3, 4]    // Бэклайн
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Генерирует 4-буквенный код комнаты
 */
function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

/**
 * Автоматически выбирает роль на основе доступных
 */
function selectRole(takenRoles: string[]): "BODY" | "MIND" | "SOCIAL" | null {
  const allRoles = ["BODY", "MIND", "SOCIAL"] as const;
  for (const role of allRoles) {
    if (!takenRoles.includes(role)) {
      return role;
    }
  }
  return null;
}

/**
 * Выбирает ранг на основе роли и занятых позиций
 */
function selectRank(role: string, takenRanks: number[]): number {
  const preferences = ROLE_RANK_PREFERENCES[role] || [2, 3];
  
  for (const rank of preferences) {
    if (!takenRanks.includes(rank)) {
      return rank;
    }
  }
  
  // Если предпочтительные заняты, найти любой свободный
  for (let r = 1; r <= 4; r++) {
    if (!takenRanks.includes(r)) {
      return r;
    }
  }
  
  return 1; // Fallback
}

/**
 * Создает начальную колоду для роли
 */
function createInitialDeck(role: string): any[] {
  // Базовые карты для всех
  const baseDeck = [
    { id: "basic_attack", name: "Удар", cost: 2, damage: 10, type: "attack", range: [1, 2] },
    { id: "basic_defend", name: "Защита", cost: 1, defense: 5, type: "defense", range: [1, 2, 3, 4] },
  ];
  
  // Специфичные карты по ролям
  const roleDeck: Record<string, any[]> = {
    BODY: [
      { id: "heavy_strike", name: "Тяжёлый удар", cost: 3, damage: 18, type: "attack", range: [1], voiceScaling: "СИЛА" },
      { id: "shield_bash", name: "Удар щитом", cost: 2, damage: 8, type: "attack", effects: ["push_1"], range: [1], voiceScaling: "СТОЙКОСТЬ" },
      { id: "taunt", name: "Провокация", cost: 1, type: "utility", effects: ["aggro_self"], range: [1, 2, 3, 4] },
    ],
    MIND: [
      { id: "analyze", name: "Анализ", cost: 1, type: "utility", effects: ["reveal_weakness"], range: [1, 2, 3, 4], voiceScaling: "ЛОГИКА" },
      { id: "electro_shot", name: "Электро-разряд", cost: 3, damage: 12, damageType: "techno", type: "attack", effects: ["stun_chance"], range: [2, 3, 4], voiceScaling: "АНАЛИЗ" },
      { id: "predict", name: "Предвидение", cost: 2, type: "utility", effects: ["reveal_intention"], range: [1, 2, 3, 4], voiceScaling: "ИНТУИЦИЯ" },
    ],
    SOCIAL: [
      { id: "intimidate", name: "Запугивание", cost: 2, type: "utility", effects: ["fear", "morale_damage"], range: [1, 2, 3], voiceScaling: "АВТОРИТЕТ" },
      { id: "negotiate", name: "Переговоры", cost: 3, type: "utility", effects: ["skip_turn_chance", "morale_damage"], range: [1, 2, 3, 4], voiceScaling: "ХАРИЗМА" },
      { id: "rally", name: "Воодушевление", cost: 2, type: "support", effects: ["ally_morale_restore"], range: [1, 2, 3, 4], voiceScaling: "ЭМПАТИЯ" },
    ]
  };
  
  const deck = [...baseDeck, ...baseDeck, ...(roleDeck[role] || [])];
  
  // Перемешиваем
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

/**
 * Берем карты из колоды в руку
 */
function drawCards(deck: any[], hand: any[], count: number): { newDeck: any[], newHand: any[] } {
  const newDeck = [...deck];
  const newHand = [...hand];
  
  for (let i = 0; i < count && newDeck.length > 0; i++) {
    const card = newDeck.pop();
    if (card) newHand.push(card);
  }
  
  return { newDeck, newHand };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Создать новую комнату кооператива
 */
export const createRoom = mutation({
  args: {
    deviceId: v.string(),
    locationId: v.optional(v.string()),
    maxPlayers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Найти игрока
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    // Генерировать уникальный код
    let code = generateRoomCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existing = await ctx.db
        .query("coop_rooms")
        .withIndex("by_code", (q) => q.eq("roomCode", code))
        .first();
      
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique room code");
    }
    
    const now = Date.now();
    
    // Создать комнату
    const roomId = await ctx.db.insert("coop_rooms", {
      roomCode: code,
      hostId: player._id,
      status: "lobby",
      currentRound: 0,
      maxPlayers: args.maxPlayers || 3,
      locationId: args.locationId,
      
      globalState: {
        enemyHp: 0,
        enemyMaxHp: 0,
        enemyMorale: 100,
        enemyMaxMorale: 100,
        environment: "neutral",
      },
      
      enemies: [],
      cardPool: [],
      log: [{
        round: 0,
        tick: 0,
        actorId: player._id,
        actorName: player.name,
        action: "room_created",
        timestamp: now
      }],
      
      createdAt: now,
      updatedAt: now,
      expiresAt: now + ROOM_EXPIRY_MS,
    });
    
    // Получить навыки игрока из game_progress
    const progress = await ctx.db
      .query("game_progress")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    // Хост автоматически присоединяется как BODY (главная роль)
    const hostRole = "BODY";
    const hostRank = 1;
    const deck = createInitialDeck(hostRole);
    const { newDeck, newHand } = drawCards(deck, [], 5);
    
    await ctx.db.insert("coop_session_players", {
      roomId,
      playerId: player._id,
      deviceId: args.deviceId,
      role: hostRole,
      roleName: ROLES[hostRole].name,
      rank: hostRank,
      status: "thinking",
      hp: progress?.hp || 100,
      maxHp: progress?.maxHp || 100,
      stamina: progress?.stamina || 10,
      maxStamina: progress?.maxStamina || 10,
      morale: progress?.morale || 100,
      maxMorale: progress?.maxMorale || 100,
      hand: newHand,
      deck: newDeck,
      discard: [],
      activeEffects: [],
      voiceSkills: progress?.skills || {},
      joinedAt: now,
    });
    
    // Инициализировать presence
    await ctx.db.insert("coop_presence", {
      roomId,
      playerId: player._id,
      deviceId: args.deviceId,
      isConnected: true,
      lastHeartbeat: now,
      connectionQuality: "excellent",
      updatedAt: now,
    });
    
    return { roomId, roomCode: code };
  },
});

/**
 * Присоединиться к комнате по коду
 */
export const joinRoom = mutation({
  args: {
    deviceId: v.string(),
    roomCode: v.string(),
    preferredRole: v.optional(v.union(
      v.literal("BODY"),
      v.literal("MIND"),
      v.literal("SOCIAL")
    )),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    // Найти комнату по коду (case-insensitive)
    const room = await ctx.db
      .query("coop_rooms")
      .withIndex("by_code", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();
    
    if (!room) throw new Error("Room not found");
    if (room.status !== "lobby") throw new Error("Room is not accepting players");
    
    // Проверить, не присоединен ли уже
    const existingSession = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", room._id)
      )
      .first();
    
    if (existingSession) {
      return { success: true, message: "Already joined", role: existingSession.role, rank: existingSession.rank };
    }
    
    // Получить всех участников
    const participants = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    
    if (participants.length >= room.maxPlayers) {
      throw new Error("Room is full");
    }
    
    // Определить роль
    const takenRoles = participants.map(p => p.role);
    let assignedRole: "BODY" | "MIND" | "SOCIAL";
    
    if (args.preferredRole && !takenRoles.includes(args.preferredRole)) {
      assignedRole = args.preferredRole;
    } else {
      const autoRole = selectRole(takenRoles);
      if (!autoRole) throw new Error("No available roles");
      assignedRole = autoRole;
    }
    
    // Определить ранг
    const takenRanks = participants.map(p => p.rank);
    const assignedRank = selectRank(assignedRole, takenRanks);
    
    const now = Date.now();
    
    // Получить навыки
    const progress = await ctx.db
      .query("game_progress")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    // Создать колоду
    const deck = createInitialDeck(assignedRole);
    const { newDeck, newHand } = drawCards(deck, [], 5);
    
    // Добавить игрока в сессию
    await ctx.db.insert("coop_session_players", {
      roomId: room._id,
      playerId: player._id,
      deviceId: args.deviceId,
      role: assignedRole,
      roleName: ROLES[assignedRole].name,
      rank: assignedRank,
      status: "thinking",
      hp: progress?.hp || 100,
      maxHp: progress?.maxHp || 100,
      stamina: progress?.stamina || 10,
      maxStamina: progress?.maxStamina || 10,
      morale: progress?.morale || 100,
      maxMorale: progress?.maxMorale || 100,
      hand: newHand,
      deck: newDeck,
      discard: [],
      activeEffects: [],
      voiceSkills: progress?.skills || {},
      joinedAt: now,
    });
    
    // Добавить presence
    await ctx.db.insert("coop_presence", {
      roomId: room._id,
      playerId: player._id,
      deviceId: args.deviceId,
      isConnected: true,
      lastHeartbeat: now,
      connectionQuality: "excellent",
      updatedAt: now,
    });
    
    // Обновить лог комнаты
    await ctx.db.patch(room._id, {
      log: [...room.log, {
        round: room.currentRound,
        tick: 0,
        actorId: player._id,
        actorName: player.name,
        action: `joined_as_${assignedRole}`,
        timestamp: now
      }],
      updatedAt: now,
    });
    
    return { 
      success: true, 
      role: assignedRole, 
      roleName: ROLES[assignedRole].name,
      rank: assignedRank 
    };
  },
});

/**
 * Покинуть комнату
 */
export const leaveRoom = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    
    // Удалить из сессии
    const sessionPlayer = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
    
    if (sessionPlayer) {
      await ctx.db.delete(sessionPlayer._id);
    }
    
    // Удалить presence
    const presence = await ctx.db
      .query("coop_presence")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .first();
    
    if (presence && presence.roomId === args.roomId) {
      await ctx.db.delete(presence._id);
    }
    
    // Проверить, остались ли игроки
    const remainingPlayers = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    if (remainingPlayers.length === 0) {
      // Удалить пустую комнату
      await ctx.db.delete(args.roomId);
    } else if (room.hostId === player._id) {
      // Передать хост следующему игроку
      await ctx.db.patch(args.roomId, {
        hostId: remainingPlayers[0].playerId,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Начать бой (только хост)
 */
export const startBattle = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
    enemyTemplateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== player._id) throw new Error("Only host can start battle");
    if (room.status !== "lobby") throw new Error("Battle already started");
    
    // Получить участников
    const participants = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    if (participants.length < 1) {
      throw new Error("Need at least 1 player to start");
    }
    
    const now = Date.now();
    
    // Создать врагов (упрощенная версия, позже будет из enemy_templates)
    const enemies = [
      {
        id: `enemy_${now}_1`,
        templateId: args.enemyTemplateId || "cyber_wolf",
        name: "Кибер-Волк",
        rank: 1,
        hp: 150 + (participants.length * 50), // Масштабирование по игрокам
        maxHp: 150 + (participants.length * 50),
        morale: 100,
        maxMorale: 100,
        armor: 5,
        intention: "attack_rank_1",
        weaknesses: ["techno", "fire"],
        resistances: ["physical"],
        activeEffects: [],
      }
    ];
    
    // Обновить комнату
    await ctx.db.patch(args.roomId, {
      status: "planning",
      currentRound: 1,
      globalState: {
        ...room.globalState,
        enemyHp: enemies[0].hp,
        enemyMaxHp: enemies[0].maxHp,
        enemyMorale: enemies[0].morale,
        enemyMaxMorale: enemies[0].maxMorale,
        enemyIntention: enemies[0].intention,
        enemyWeaknesses: enemies[0].weaknesses,
        enemyPhysicalThreat: "attack_rank_1",
        turnTimer: 60, // 60 секунд на ход
      },
      enemies,
      roundStartedAt: now,
      log: [...room.log, {
        round: 1,
        tick: 0,
        actorId: "system",
        actorName: "Система",
        action: "battle_started",
        timestamp: now
      }],
      updatedAt: now,
    });
    
    // Обновить статус всех игроков
    for (const p of participants) {
      await ctx.db.patch(p._id, {
        status: "thinking",
      });
    }
    
    return { success: true };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Получить комнату по коду
 */
export const getRoomByCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coop_rooms")
      .withIndex("by_code", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();
  },
});

/**
 * Получить комнату по ID
 */
export const getRoom = query({
  args: { roomId: v.id("coop_rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

/**
 * Получить участников комнаты
 */
export const getRoomParticipants = query({
  args: { roomId: v.id("coop_rooms") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    // Обогатить данными игроков
    const enriched = await Promise.all(participants.map(async (p) => {
      const player = await ctx.db.get(p.playerId);
      const presence = await ctx.db
        .query("coop_presence")
        .withIndex("by_player", (q) => q.eq("playerId", p.playerId))
        .first();
      
      return {
        ...p,
        playerName: player?.name || "Unknown",
        isConnected: presence?.isConnected || false,
        lastHeartbeat: presence?.lastHeartbeat,
      };
    }));
    
    return enriched;
  },
});

/**
 * Получить Deep Link / QR URL для комнаты
 */
export const getRoomJoinUrl = query({
  args: { roomId: v.id("coop_rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;
    
    // Deep Link формат для мобильного приложения
    const deepLink = `grezwanderer://coop/join?code=${room.roomCode}`;
    
    // Web fallback URL
    const webUrl = `https://grezwanderer.app/coop/${room.roomCode}`;
    
    return {
      roomCode: room.roomCode,
      deepLink,
      webUrl,
      // QR генерируется на клиенте через внешний API
      qrApiUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deepLink)}`,
    };
  },
});

/**
 * Получить мою сессию в комнате
 */
export const getMySession = query({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) return null;
    
    return await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
  },
});

/**
 * Получить информацию о ролях
 */
export const getRoleInfo = query({
  args: { role: v.union(v.literal("BODY"), v.literal("MIND"), v.literal("SOCIAL")) },
  handler: async (_ctx, args) => {
    return ROLES[args.role];
  },
});

/**
 * Получить все доступные комнаты (для лобби)
 */
export const getOpenRooms = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("coop_rooms")
      .withIndex("by_status", (q) => q.eq("status", "lobby"))
      .order("desc")
      .take(20);
    
    // Обогатить количеством игроков
    const enriched = await Promise.all(rooms.map(async (room) => {
      const participants = await ctx.db
        .query("coop_session_players")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();
      
      const host = await ctx.db.get(room.hostId);
      
      return {
        ...room,
        playerCount: participants.length,
        hostName: host?.name || "Unknown",
      };
    }));
    
    return enriched;
  },
});

// ============================================================================
// INTERNAL MUTATIONS (для cron jobs)
// ============================================================================

/**
 * Очистка неактивных комнат (вызывается cron job)
 */
export const cleanupExpiredRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Найти истекшие комнаты
    const expiredRooms = await ctx.db
      .query("coop_rooms")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .collect();
    
    let deletedCount = 0;
    
    for (const room of expiredRooms) {
      // Удалить участников
      const participants = await ctx.db
        .query("coop_session_players")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();
      
      for (const p of participants) {
        await ctx.db.delete(p._id);
      }
      
      // Удалить presence
      const presences = await ctx.db
        .query("coop_presence")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();
      
      for (const pr of presences) {
        await ctx.db.delete(pr._id);
      }
      
      // Удалить actions
      const actions = await ctx.db
        .query("coop_actions")
        .withIndex("by_room_round", (q) => q.eq("roomId", room._id))
        .collect();
      
      for (const a of actions) {
        await ctx.db.delete(a._id);
      }
      
      // Удалить комнату
      await ctx.db.delete(room._id);
      deletedCount++;
    }
    
    return { deletedCount };
  },
});


