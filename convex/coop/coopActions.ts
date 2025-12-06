/**
 * COOP ACTIONS - Commit-Reveal WeGo система
 * 
 * Реализует механику одновременных ходов:
 * 1. PLANNING: Все игроки выбирают действия (commit), не видя выборы других
 * 2. EXECUTING: Когда все готовы, действия раскрываются (reveal)
 * 3. RESOLUTION: Сервер рассчитывает результаты
 * 
 * Protocol Trinity: Оружие + Артефакт + Голос = Комбинированная карта
 */

import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// CONSTANTS
// ============================================================================

const PLANNING_TIMEOUT_MS = 60 * 1000; // 60 секунд на планирование
const HAND_SIZE = 5;

// Типы урона
type DamageType = "physical" | "techno" | "bio" | "ritual";

// Эффективность типов урона против типов брони
const DAMAGE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  physical: { light: 1.5, heavy: 0.5, none: 1.0, organic: 1.0 },
  techno: { drone: 2.0, human: 0.8, organic: 0.5, shielded: 0.3 },
  bio: { human: 1.5, organic: 1.2, drone: 0.2, ritual: 0.5 },
  ritual: { ghost: 2.0, anomaly: 1.5, scientist: 0.3, organic: 0.8 },
};

// Voice Scaling (множители урона от голосов)
const VOICE_SCALING: Record<string, { stat: string; multiplier: number }> = {
  "СИЛА": { stat: "strength", multiplier: 0.1 },
  "СТОЙКОСТЬ": { stat: "endurance", multiplier: 0.08 },
  "РЕАКЦИЯ": { stat: "reflexes", multiplier: 0.12 },
  "ЛОГИКА": { stat: "logic", multiplier: 0.1 },
  "АНАЛИЗ": { stat: "perception", multiplier: 0.1 },
  "ИНТУИЦИЯ": { stat: "intuition", multiplier: 0.15 },
  "АВТОРИТЕТ": { stat: "authority", multiplier: 0.12 },
  "ХАРИЗМА": { stat: "charisma", multiplier: 0.1 },
  "ЭМПАТИЯ": { stat: "empathy", multiplier: 0.08 },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Рассчитать урон с учетом всех модификаторов
 */
function calculateDamage(
  baseDamage: number,
  card: any,
  playerSkills: Record<string, number>,
  targetArmor: number,
  targetResistances: string[],
  targetWeaknesses: string[]
): { damage: number; effects: string[] } {
  let damage = baseDamage;
  const effects: string[] = [];
  
  // Voice Scaling
  if (card.voiceScaling && VOICE_SCALING[card.voiceScaling]) {
    const scaling = VOICE_SCALING[card.voiceScaling];
    const skillValue = playerSkills[scaling.stat] || 1;
    damage *= (1 + skillValue * scaling.multiplier);
  }
  
  // Элементальные бонусы/штрафы
  const damageType = card.damageType || "physical";
  
  if (targetWeaknesses.includes(damageType)) {
    damage *= 1.5;
    effects.push("weakness_exploited");
  }
  
  if (targetResistances.includes(damageType)) {
    damage *= 0.5;
    effects.push("resisted");
  }
  
  // Броня (flat reduction)
  damage = Math.max(1, damage - targetArmor);
  
  return { damage: Math.round(damage), effects };
}

/**
 * Обработать эффекты карты
 */
function processCardEffects(
  effects: string[],
  target: any,
  caster: any
): { targetUpdates: any; casterUpdates: any; logEffects: string[] } {
  const targetUpdates: any = {};
  const casterUpdates: any = {};
  const logEffects: string[] = [];
  
  for (const effect of effects) {
    switch (effect) {
      case "push_1":
        if (target.rank < 4) {
          targetUpdates.rank = target.rank + 1;
          logEffects.push("отброшен назад");
        }
        break;
        
      case "pull_1":
        if (target.rank > 1) {
          targetUpdates.rank = target.rank - 1;
          logEffects.push("притянут вперёд");
        }
        break;
        
      case "stun_chance":
        if (Math.random() < 0.3) {
          targetUpdates.activeEffects = [
            ...(target.activeEffects || []),
            { type: "stunned", value: 1, remainingTurns: 1, source: caster.id }
          ];
          logEffects.push("оглушён");
        }
        break;
        
      case "aggro_self":
        targetUpdates.intention = `attack_rank_${caster.rank}`;
        targetUpdates.intentionTarget = caster.id;
        logEffects.push("внимание переключено");
        break;
        
      case "fear":
        if (Math.random() < 0.4) {
          targetUpdates.activeEffects = [
            ...(target.activeEffects || []),
            { type: "feared", value: 1, remainingTurns: 2, source: caster.id }
          ];
          logEffects.push("напуган");
        }
        break;
        
      case "morale_damage":
        targetUpdates.morale = Math.max(0, (target.morale || 100) - 20);
        logEffects.push("-20 морали");
        break;
        
      case "reveal_weakness":
        // Отправить всем игрокам информацию о слабостях
        logEffects.push("слабости раскрыты");
        break;
        
      case "reveal_intention":
        logEffects.push("намерение раскрыто");
        break;
        
      case "ally_morale_restore":
        casterUpdates.morale = Math.min(
          caster.maxMorale || 100, 
          (caster.morale || 100) + 15
        );
        logEffects.push("+15 морали союзникам");
        break;
        
      case "skip_turn_chance":
        if (Math.random() < 0.3) {
          targetUpdates.activeEffects = [
            ...(target.activeEffects || []),
            { type: "skip_turn", value: 1, remainingTurns: 1, source: caster.id }
          ];
          logEffects.push("враг пропускает ход");
        }
        break;
    }
  }
  
  return { targetUpdates, casterUpdates, logEffects };
}

/**
 * Берём карты из колоды
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
// MUTATIONS - COMMIT PHASE
// ============================================================================

/**
 * Закоммитить действие (скрыто от других игроков)
 */
export const commitAction = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
    cardIndex: v.number(),
    targetId: v.string(),
    targetType: v.union(v.literal("enemy"), v.literal("ally"), v.literal("self")),
    // Protocol Trinity модификаторы
    weaponModifier: v.optional(v.string()),
    artifactModifier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "planning") throw new Error("Not in planning phase");
    
    // Получить сессию игрока
    const session = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
    
    if (!session) throw new Error("Not in this room");
    if (session.status === "ready") throw new Error("Already committed action");
    
    // Валидировать карту
    if (args.cardIndex < 0 || args.cardIndex >= session.hand.length) {
      throw new Error("Invalid card index");
    }
    
    const card = session.hand[args.cardIndex];
    
    // Проверить стоимость
    if ((card.cost || 0) > session.stamina) {
      throw new Error("Not enough stamina");
    }
    
    // Проверить range
    if (card.range && !card.range.includes(session.rank)) {
      // Не ошибка, но применяется штраф эффективности (клиент должен показывать)
    }
    
    const now = Date.now();
    
    // Проверить, нет ли уже действия за этот раунд
    const existingAction = await ctx.db
      .query("coop_actions")
      .withIndex("by_room_round", (q) => 
        q.eq("roomId", args.roomId).eq("round", room.currentRound)
      )
      .filter((q) => q.eq(q.field("playerId"), player._id))
      .first();
    
    if (existingAction) {
      // Обновить существующее действие
      await ctx.db.patch(existingAction._id, {
        cardId: card.id,
        targetId: args.targetId,
        targetType: args.targetType,
        weaponModifier: args.weaponModifier,
        artifactModifier: args.artifactModifier,
        timestamp: now,
      });
    } else {
      // Создать новое действие
      await ctx.db.insert("coop_actions", {
        roomId: args.roomId,
        round: room.currentRound,
        playerId: player._id,
        cardId: card.id,
        targetId: args.targetId,
        targetType: args.targetType,
        weaponModifier: args.weaponModifier,
        artifactModifier: args.artifactModifier,
        voiceModifier: card.voiceScaling,
        revealed: false,
        timestamp: now,
      });
    }
    
    // Обновить статус игрока
    await ctx.db.patch(session._id, {
      status: "ready",
      lastActionAt: now,
    });
    
    // Проверить, все ли игроки готовы
    const allSessions = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const allReady = allSessions.every(s => s.status === "ready");
    
    if (allReady) {
      // Переход к фазе исполнения
      await ctx.db.patch(args.roomId, {
        status: "executing",
        updatedAt: now,
      });
      
      // Запустить резолюцию (через scheduler для асинхронности)
      // В реальном проекте используется ctx.scheduler.runAfter
      // Для MVP делаем синхронно
    }
    
    return { 
      success: true, 
      allReady,
      status: allReady ? "executing" : "waiting_for_others"
    };
  },
});

/**
 * Отменить закоммиченное действие
 */
export const cancelAction = mutation({
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
    if (room.status !== "planning") throw new Error("Cannot cancel in this phase");
    
    // Удалить действие
    const action = await ctx.db
      .query("coop_actions")
      .withIndex("by_room_round", (q) => 
        q.eq("roomId", args.roomId).eq("round", room.currentRound)
      )
      .filter((q) => q.eq(q.field("playerId"), player._id))
      .first();
    
    if (action) {
      await ctx.db.delete(action._id);
    }
    
    // Вернуть статус игрока
    const session = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
    
    if (session) {
      await ctx.db.patch(session._id, {
        status: "thinking",
      });
    }
    
    return { success: true };
  },
});

// ============================================================================
// MUTATIONS - REVEAL & RESOLUTION PHASE
// ============================================================================

/**
 * Разрешить раунд (вызывается когда все готовы или таймер истёк)
 */
export const resolveRound = mutation({
  args: {
    roomId: v.id("coop_rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "executing") throw new Error("Not in executing phase");
    
    const now = Date.now();
    
    // Получить все действия раунда
    const actions = await ctx.db
      .query("coop_actions")
      .withIndex("by_room_round", (q) => 
        q.eq("roomId", args.roomId).eq("round", room.currentRound)
      )
      .collect();
    
    // Получить всех игроков
    const sessions = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    // Reveal все действия
    for (const action of actions) {
      await ctx.db.patch(action._id, { revealed: true });
    }
    
    // Сортировать по инициативе (упрощенно - по rank)
    const sortedActions = [...actions].sort((a, b) => {
      const sessionA = sessions.find(s => s.playerId === a.playerId);
      const sessionB = sessions.find(s => s.playerId === b.playerId);
      return (sessionA?.rank || 4) - (sessionB?.rank || 4);
    });
    
    const newLogs: any[] = [...room.log];
    let enemies = [...room.enemies];
    const sessionUpdates: Map<string, any> = new Map();
    
    // Обработать каждое действие
    for (const action of sortedActions) {
      const session = sessions.find(s => s.playerId === action.playerId);
      if (!session) continue;
      
      const player = await ctx.db.get(action.playerId);
      const card = session.hand.find((c: any) => c.id === action.cardId);
      if (!card) continue;
      
      // Получить цель
      let target: any = null;
      if (action.targetType === "enemy") {
        target = enemies.find(e => e.id === action.targetId);
      } else if (action.targetType === "ally") {
        target = sessions.find(s => s.playerId.toString() === action.targetId);
      } else {
        target = session;
      }
      
      if (!target) continue;
      
      // Рассчитать эффект
      let logEntry: any = {
        round: room.currentRound,
        tick: sortedActions.indexOf(action),
        actorId: action.playerId,
        actorName: player?.name || "Unknown",
        action: card.name,
        targets: [action.targetId],
        timestamp: now,
      };
      
      if (card.type === "attack" && card.damage) {
        const { damage, effects } = calculateDamage(
          card.damage,
          card,
          session.voiceSkills || {},
          target.armor || 0,
          target.resistances || [],
          target.weaknesses || []
        );
        
        // Применить урон
        if (action.targetType === "enemy") {
          const enemyIndex = enemies.findIndex(e => e.id === action.targetId);
          if (enemyIndex !== -1) {
            enemies[enemyIndex] = {
              ...enemies[enemyIndex],
              hp: Math.max(0, enemies[enemyIndex].hp - damage),
            };
          }
        }
        
        logEntry.damage = damage;
        logEntry.effects = effects;
      }
      
      if (card.type === "defense" && card.defense) {
        // Добавить эффект защиты
        const updates = sessionUpdates.get(session._id.toString()) || {};
        updates.activeEffects = [
          ...(session.activeEffects || []),
          { type: "defense", value: card.defense, remainingTurns: 1, source: "self" }
        ];
        sessionUpdates.set(session._id.toString(), updates);
        logEntry.effects = ["защита активирована"];
      }
      
      if (card.type === "utility" && card.effects) {
        const { targetUpdates, casterUpdates, logEffects } = processCardEffects(
          card.effects,
          target,
          { id: session.playerId, rank: session.rank }
        );
        
        // Применить изменения к цели
        if (action.targetType === "enemy" && Object.keys(targetUpdates).length > 0) {
          const enemyIndex = enemies.findIndex(e => e.id === action.targetId);
          if (enemyIndex !== -1) {
            enemies[enemyIndex] = { ...enemies[enemyIndex], ...targetUpdates };
          }
        }
        
        // Применить изменения к кастеру
        if (Object.keys(casterUpdates).length > 0) {
          const updates = sessionUpdates.get(session._id.toString()) || {};
          Object.assign(updates, casterUpdates);
          sessionUpdates.set(session._id.toString(), updates);
        }
        
        logEntry.effects = logEffects;
      }
      
      if (card.type === "support" && card.effects) {
        const { targetUpdates, casterUpdates, logEffects } = processCardEffects(
          card.effects,
          target,
          { id: session.playerId, rank: session.rank }
        );
        
        // Применить изменения
        if (action.targetType === "ally" || action.targetType === "self") {
          const targetSession = sessions.find(s => s.playerId.toString() === action.targetId) || session;
          const updates = sessionUpdates.get(targetSession._id.toString()) || {};
          Object.assign(updates, targetUpdates);
          sessionUpdates.set(targetSession._id.toString(), updates);
        }
        
        logEntry.effects = logEffects;
      }
      
      // Потратить стамину
      const staminaCost = card.cost || 0;
      const sessionUpdate = sessionUpdates.get(session._id.toString()) || {};
      sessionUpdate.stamina = (sessionUpdate.stamina ?? session.stamina) - staminaCost;
      sessionUpdates.set(session._id.toString(), sessionUpdate);
      
      // Переместить карту в сброс
      const newHand = session.hand.filter((c: any) => c.id !== card.id);
      const newDiscard = [...session.discard, card];
      sessionUpdate.hand = newHand;
      sessionUpdate.discard = newDiscard;
      sessionUpdates.set(session._id.toString(), sessionUpdate);
      
      newLogs.push(logEntry);
    }
    
    // Применить все обновления сессий
    for (const [sessionId, updates] of sessionUpdates) {
      const session = sessions.find(s => s._id.toString() === sessionId);
      if (session) {
        await ctx.db.patch(session._id, updates);
      }
    }
    
    // Проверить условия победы/поражения
    const allEnemiesDead = enemies.every(e => e.hp <= 0);
    const allPlayersDead = sessions.every(s => (s.hp || 0) <= 0);
    
    let newStatus: "planning" | "finished" = "planning";
    
    if (allEnemiesDead) {
      newStatus = "finished";
      newLogs.push({
        round: room.currentRound,
        tick: 999,
        actorId: "system",
        actorName: "Система",
        action: "victory",
        effects: ["Победа! Все враги повержены."],
        timestamp: now,
      });
    } else if (allPlayersDead) {
      newStatus = "finished";
      newLogs.push({
        round: room.currentRound,
        tick: 999,
        actorId: "system",
        actorName: "Система",
        action: "defeat",
        effects: ["Поражение. Отряд уничтожен."],
        timestamp: now,
      });
    }
    
    // AI ход врагов (упрощенно)
    if (newStatus === "planning") {
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        
        // Простой AI: атаковать по intention
        const targetRank = parseInt(enemy.intention?.replace("attack_rank_", "") || "1");
        const targetSession = sessions.find(s => s.rank === targetRank);
        
        if (targetSession) {
          const baseDamage = 15;
          const defenseEffect = (targetSession.activeEffects || [])
            .find((e: any) => e.type === "defense");
          const defense = defenseEffect?.value || 0;
          const actualDamage = Math.max(1, baseDamage - defense);
          
          // Обновить HP игрока
          await ctx.db.patch(targetSession._id, {
            hp: Math.max(0, (targetSession.hp || 100) - actualDamage),
          });
          
          newLogs.push({
            round: room.currentRound,
            tick: 100 + enemies.indexOf(enemy),
            actorId: enemy.id,
            actorName: enemy.name,
            action: "атака",
            targets: [targetSession.playerId],
            damage: actualDamage,
            timestamp: now,
          });
        }
        
        // Сменить intention на следующий раунд
        const newTargetRank = Math.floor(Math.random() * 4) + 1;
        enemy.intention = `attack_rank_${newTargetRank}`;
      }
    }
    
    // Следующий раунд
    const nextRound = room.currentRound + 1;
    
    // Добор карт для всех игроков
    if (newStatus === "planning") {
      for (const session of sessions) {
        const currentUpdates = sessionUpdates.get(session._id.toString()) || {};
        const currentHand = currentUpdates.hand || session.hand;
        const currentDeck = currentUpdates.deck || session.deck;
        
        if (currentHand.length < HAND_SIZE) {
          const { newDeck, newHand } = drawCards(currentDeck, currentHand, HAND_SIZE - currentHand.length);
          await ctx.db.patch(session._id, {
            hand: newHand,
            deck: newDeck,
            status: "thinking",
            stamina: Math.min(session.maxStamina, (session.stamina || 0) + 3), // Регенерация стамины
          });
        } else {
          await ctx.db.patch(session._id, {
            status: "thinking",
            stamina: Math.min(session.maxStamina, (session.stamina || 0) + 3),
          });
        }
      }
    }
    
    // Обновить комнату
    await ctx.db.patch(args.roomId, {
      status: newStatus,
      currentRound: newStatus === "planning" ? nextRound : room.currentRound,
      enemies,
      globalState: {
        ...room.globalState,
        enemyHp: enemies[0]?.hp || 0,
        enemyMorale: enemies[0]?.morale || 0,
        enemyIntention: enemies[0]?.intention,
      },
      log: newLogs,
      roundStartedAt: now,
      updatedAt: now,
    });
    
    return { 
      success: true, 
      status: newStatus,
      round: newStatus === "planning" ? nextRound : room.currentRound,
    };
  },
});

// ============================================================================
// PROTOCOL TRINITY - Card Contribution System
// ============================================================================

/**
 * Предложить карту в общий пул (Protocol Trinity)
 */
export const contributeCard = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
    cardIndex: v.number(),
    cardType: v.union(v.literal("weapon"), v.literal("artifact"), v.literal("voice")),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "planning") throw new Error("Not in planning phase");
    
    const session = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
    
    if (!session) throw new Error("Not in this room");
    
    const card = session.hand[args.cardIndex];
    if (!card) throw new Error("Invalid card");
    
    const now = Date.now();
    
    // Создать вклад
    await ctx.db.insert("coop_card_contributions", {
      roomId: args.roomId,
      round: room.currentRound,
      contributorId: player._id,
      contributorRole: session.role,
      cardId: card.id,
      cardType: args.cardType,
      status: "offered",
      timestamp: now,
    });
    
    // Добавить в cardPool комнаты
    await ctx.db.patch(args.roomId, {
      cardPool: [...room.cardPool, {
        cardId: card.id,
        contributorId: player._id,
        timestamp: now,
      }],
      updatedAt: now,
    });
    
    return { success: true, cardId: card.id };
  },
});

/**
 * Принять предложенную карту для комбинации
 */
export const acceptContribution = mutation({
  args: {
    deviceId: v.string(),
    roomId: v.id("coop_rooms"),
    contributionId: v.id("coop_card_contributions"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    const contribution = await ctx.db.get(args.contributionId);
    if (!contribution) throw new Error("Contribution not found");
    if (contribution.status !== "offered") throw new Error("Contribution not available");
    if (contribution.contributorId === player._id) throw new Error("Cannot accept own contribution");
    
    await ctx.db.patch(args.contributionId, {
      status: "accepted",
      acceptedBy: player._id,
    });
    
    return { success: true };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Получить действия раунда (только revealed или свои)
 */
export const getRoundActions = query({
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
    
    const room = await ctx.db.get(args.roomId);
    if (!room) return [];
    
    const actions = await ctx.db
      .query("coop_actions")
      .withIndex("by_room_round", (q) => 
        q.eq("roomId", args.roomId).eq("round", room.currentRound)
      )
      .collect();
    
    // Фильтрация: показать только revealed или свои
    return actions.filter(a => a.revealed || a.playerId === player._id);
  },
});

/**
 * Получить статус готовности игроков
 */
export const getReadyStatus = query({
  args: { roomId: v.id("coop_rooms") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const statuses = await Promise.all(sessions.map(async (s) => {
      const player = await ctx.db.get(s.playerId);
      return {
        playerId: s.playerId,
        playerName: player?.name || "Unknown",
        role: s.role,
        status: s.status,
        isReady: s.status === "ready",
      };
    }));
    
    const allReady = statuses.every(s => s.isReady);
    const readyCount = statuses.filter(s => s.isReady).length;
    
    return {
      statuses,
      allReady,
      readyCount,
      totalCount: statuses.length,
    };
  },
});

/**
 * Получить вклады в общий пул (Protocol Trinity)
 */
export const getCardPoolContributions = query({
  args: { roomId: v.id("coop_rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return [];
    
    const contributions = await ctx.db
      .query("coop_card_contributions")
      .withIndex("by_room_round", (q) => 
        q.eq("roomId", args.roomId).eq("round", room.currentRound)
      )
      .filter((q) => q.eq(q.field("status"), "offered"))
      .collect();
    
    return Promise.all(contributions.map(async (c) => {
      const contributor = await ctx.db.get(c.contributorId);
      return {
        ...c,
        contributorName: contributor?.name || "Unknown",
      };
    }));
  },
});


