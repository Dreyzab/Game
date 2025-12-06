/**
 * COOP PRESENCE - Система присутствия и heartbeat
 * 
 * Реализует:
 * - Heartbeat для отслеживания подключенных игроков
 * - Обнаружение дисконнектов
 * - Передачу intent (куда смотрит игрок) для социальной информации
 * - Auto-defense при отключении
 */

import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// CONSTANTS
// ============================================================================

const HEARTBEAT_INTERVAL_MS = 5 * 1000; // 5 секунд
const DISCONNECT_THRESHOLD_MS = 15 * 1000; // 15 секунд без пульса = disconnected
const RECONNECT_GRACE_PERIOD_MS = 60 * 1000; // 1 минута на переподключение

// Качество соединения по латентности heartbeat
const CONNECTION_QUALITY_THRESHOLDS = {
  excellent: 2000, // < 2 секунды между heartbeat
  good: 5000,      // < 5 секунд
  poor: 10000,     // < 10 секунд
  // > 10 секунд = disconnected
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Отправить heartbeat (клиент вызывает каждые 5 секунд)
 */
export const sendHeartbeat = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
    // Опциональные данные о намерении (intent)
    currentTarget: v.optional(v.string()),
    hoveredCardIndex: v.optional(v.number()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    const now = Date.now();
    
    // Найти или создать presence запись
    let presence = await ctx.db
      .query("coop_presence")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .first();
    
    if (!presence || presence.roomId !== args.roomId) {
      // Создать новую запись
      await ctx.db.insert("coop_presence", {
        roomId: args.roomId,
        playerId: player._id,
        deviceId: args.deviceId,
        isConnected: true,
        lastHeartbeat: now,
        currentTarget: args.currentTarget,
        hoveredCardIndex: args.hoveredCardIndex,
        userAgent: args.userAgent,
        connectionQuality: "excellent",
        updatedAt: now,
      });
    } else {
      // Рассчитать качество соединения
      const timeSinceLastHeartbeat = now - presence.lastHeartbeat;
      let connectionQuality: "excellent" | "good" | "poor" | "disconnected" = "excellent";
      
      if (timeSinceLastHeartbeat > CONNECTION_QUALITY_THRESHOLDS.poor) {
        connectionQuality = "poor";
      } else if (timeSinceLastHeartbeat > CONNECTION_QUALITY_THRESHOLDS.good) {
        connectionQuality = "good";
      }
      
      await ctx.db.patch(presence._id, {
        isConnected: true,
        lastHeartbeat: now,
        currentTarget: args.currentTarget,
        hoveredCardIndex: args.hoveredCardIndex,
        userAgent: args.userAgent || presence.userAgent,
        connectionQuality,
        updatedAt: now,
      });
    }
    
    return { success: true, timestamp: now };
  },
});

/**
 * Обновить intent (куда смотрит/что выбирает игрок)
 * Вызывается при наведении на цель или карту
 */
export const updateIntent = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
    currentTarget: v.optional(v.string()),
    hoveredCardIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    const presence = await ctx.db
      .query("coop_presence")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .first();
    
    if (presence && presence.roomId === args.roomId) {
      await ctx.db.patch(presence._id, {
        currentTarget: args.currentTarget,
        hoveredCardIndex: args.hoveredCardIndex,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Явно отключиться от комнаты
 */
export const disconnect = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) return { success: true };
    
    const presence = await ctx.db
      .query("coop_presence")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .first();
    
    if (presence && presence.roomId === args.roomId) {
      await ctx.db.patch(presence._id, {
        isConnected: false,
        connectionQuality: "disconnected",
        updatedAt: Date.now(),
      });
    }
    
    // Обновить статус в сессии
    const session = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
    
    if (session) {
      await ctx.db.patch(session._id, {
        status: "disconnected",
      });
    }
    
    return { success: true };
  },
});

/**
 * "Пнуть" отключившегося игрока (отправить уведомление)
 */
export const nudgePlayer = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    
    const targetPlayer = await ctx.db.get(args.targetPlayerId);
    if (!targetPlayer) throw new Error("Target player not found");
    
    // В реальном приложении здесь отправляется push-уведомление
    // Для MVP просто добавляем лог
    await ctx.db.patch(args.roomId, {
      log: [...room.log, {
        round: room.currentRound,
        tick: 0,
        actorId: player._id,
        actorName: player.name,
        action: "nudge",
        targets: [args.targetPlayerId],
        effects: [`${player.name} толкает ${targetPlayer.name}`],
        timestamp: Date.now(),
      }],
      updatedAt: Date.now(),
    });
    
    return { success: true, message: `Nudge sent to ${targetPlayer.name}` };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Получить presence всех игроков в комнате
 */
export const getRoomPresence = query({
  args: { roomId: v.id("coop_rooms") },
  handler: async (ctx, args) => {
    const presences = await ctx.db
      .query("coop_presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const now = Date.now();
    
    // Обогатить данными и проверить актуальность
    return Promise.all(presences.map(async (p) => {
      const player = await ctx.db.get(p.playerId);
      const session = await ctx.db
        .query("coop_session_players")
        .withIndex("by_player_room", (q) => 
          q.eq("playerId", p.playerId).eq("roomId", args.roomId)
        )
        .first();
      
      // Определить фактический статус подключения
      const timeSinceHeartbeat = now - p.lastHeartbeat;
      const isActuallyConnected = timeSinceHeartbeat < DISCONNECT_THRESHOLD_MS;
      
      let connectionQuality = p.connectionQuality;
      if (!isActuallyConnected) {
        connectionQuality = "disconnected";
      }
      
      return {
        playerId: p.playerId,
        playerName: player?.name || "Unknown",
        role: session?.role || "BODY",
        roleName: session?.roleName || "Физик",
        rank: session?.rank || 1,
        isConnected: isActuallyConnected,
        connectionQuality,
        lastHeartbeat: p.lastHeartbeat,
        timeSinceHeartbeat,
        currentTarget: p.currentTarget,
        hoveredCardIndex: p.hoveredCardIndex,
      };
    }));
  },
});

/**
 * Получить intent союзников (для отображения "глазок")
 */
export const getTeammateIntents = query({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) return [];
    
    const presences = await ctx.db
      .query("coop_presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    // Исключить себя и вернуть intent других игроков
    const teammateIntents = await Promise.all(
      presences
        .filter(p => p.playerId !== player._id && p.isConnected)
        .map(async (p) => {
          const teammate = await ctx.db.get(p.playerId);
          const session = await ctx.db
            .query("coop_session_players")
            .withIndex("by_player_room", (q) => 
              q.eq("playerId", p.playerId).eq("roomId", args.roomId)
            )
            .first();
          
          return {
            playerId: p.playerId,
            playerName: teammate?.name || "Unknown",
            role: session?.role || "BODY",
            currentTarget: p.currentTarget,
            hoveredCardIndex: p.hoveredCardIndex,
          };
        })
    );
    
    return teammateIntents;
  },
});

/**
 * Проверить, все ли игроки подключены
 */
export const checkAllConnected = query({
  args: { roomId: v.id("coop_rooms") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const presences = await ctx.db
      .query("coop_presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const now = Date.now();
    
    let connectedCount = 0;
    let disconnectedPlayers: string[] = [];
    
    for (const session of sessions) {
      const presence = presences.find(p => p.playerId === session.playerId);
      const timeSinceHeartbeat = presence ? now - presence.lastHeartbeat : Infinity;
      
      if (timeSinceHeartbeat < DISCONNECT_THRESHOLD_MS) {
        connectedCount++;
      } else {
        const player = await ctx.db.get(session.playerId);
        disconnectedPlayers.push(player?.name || "Unknown");
      }
    }
    
    return {
      allConnected: connectedCount === sessions.length,
      connectedCount,
      totalCount: sessions.length,
      disconnectedPlayers,
    };
  },
});

// ============================================================================
// INTERNAL MUTATIONS (для scheduled jobs)
// ============================================================================

/**
 * Проверить и обработать дисконнекты
 * Вызывается периодически (каждые 10 секунд)
 */
export const checkDisconnects = internalMutation({
  args: { roomId: v.id("coop_rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status === "finished" || room.status === "lobby") {
      return { processed: false };
    }
    
    const now = Date.now();
    
    const presences = await ctx.db
      .query("coop_presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const sessions = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    let disconnectedCount = 0;
    
    for (const presence of presences) {
      const timeSinceHeartbeat = now - presence.lastHeartbeat;
      
      if (timeSinceHeartbeat > DISCONNECT_THRESHOLD_MS && presence.isConnected) {
        // Помечаем как отключенного
        await ctx.db.patch(presence._id, {
          isConnected: false,
          connectionQuality: "disconnected",
          updatedAt: now,
        });
        
        // Обновляем сессию игрока
        const session = sessions.find(s => s.playerId === presence.playerId);
        if (session) {
          await ctx.db.patch(session._id, {
            status: "disconnected",
            // Добавляем защитный эффект (Auto-Defense)
            activeEffects: [
              ...(session.activeEffects || []),
              {
                type: "auto_defense",
                value: 5,
                remainingTurns: 3,
                source: "system_disconnect"
              }
            ],
          });
        }
        
        // Добавляем в лог
        const player = await ctx.db.get(presence.playerId);
        await ctx.db.patch(args.roomId, {
          log: [...room.log, {
            round: room.currentRound,
            tick: 0,
            actorId: "system",
            actorName: "Система",
            action: "disconnect",
            targets: [presence.playerId],
            effects: [`${player?.name || "Игрок"} потерял связь. Автозащита активирована.`],
            timestamp: now,
          }],
          updatedAt: now,
        });
        
        disconnectedCount++;
      }
    }
    
    // Если все отключились, ставим бой на паузу
    const connectedSessions = sessions.filter(s => {
      const presence = presences.find(p => p.playerId === s.playerId);
      return presence && now - presence.lastHeartbeat < DISCONNECT_THRESHOLD_MS;
    });
    
    if (connectedSessions.length === 0 && sessions.length > 0) {
      // Все отключились - пауза
      await ctx.db.patch(args.roomId, {
        status: "lobby", // Возврат в лобби для ожидания переподключения
        updatedAt: now,
      });
    }
    
    return { processed: true, disconnectedCount };
  },
});

/**
 * Обработать переподключение игрока
 */
export const handleReconnect = mutation({
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
    
    const now = Date.now();
    
    // Обновить presence
    const presence = await ctx.db
      .query("coop_presence")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .first();
    
    if (presence && presence.roomId === args.roomId) {
      await ctx.db.patch(presence._id, {
        isConnected: true,
        lastHeartbeat: now,
        connectionQuality: "good",
        updatedAt: now,
      });
    }
    
    // Обновить статус сессии
    const session = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
    
    if (session) {
      // Убрать auto_defense эффект
      const newEffects = (session.activeEffects || [])
        .filter((e: any) => e.source !== "system_disconnect");
      
      await ctx.db.patch(session._id, {
        status: "thinking",
        activeEffects: newEffects,
      });
    }
    
    // Добавить в лог
    await ctx.db.patch(args.roomId, {
      log: [...room.log, {
        round: room.currentRound,
        tick: 0,
        actorId: player._id,
        actorName: player.name,
        action: "reconnect",
        effects: [`${player.name} восстановил связь`],
        timestamp: now,
      }],
      updatedAt: now,
    });
    
    return { success: true };
  },
});


