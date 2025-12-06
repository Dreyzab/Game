/**
 * ASYMMETRY - Система асимметричной информации
 * 
 * Реализует фильтрацию данных на основе роли игрока:
 * - BODY: видит HP, броню, физические угрозы
 * - MIND: видит слабости, вероятности, магию
 * - SOCIAL: видит намерения, мораль, диалоги
 * 
 * Это ядро механики "Игры в Воздушном Зазоре" - игроки ДОЛЖНЫ
 * общаться голосом, чтобы собрать полную картину.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type AsymmetricRole = "BODY" | "MIND" | "SOCIAL";

// Что видит каждая роль
const ROLE_VISIBILITY: Record<AsymmetricRole, {
  enemyFields: string[];
  allyFields: string[];
  environmentFields: string[];
  hiddenFields: string[];
}> = {
  BODY: {
    // Физик видит конкретные цифры здоровья и брони
    enemyFields: [
      "id", "name", "rank",
      "hp", "maxHp",           // Точные значения HP
      "armor",                 // Броня
      "physicalEffects",       // Физические эффекты (bleeding, stunned)
      "staggerBar",            // Полоска сбивания (stagger)
    ],
    allyFields: [
      "playerId", "playerName", "role", "rank",
      "hp", "maxHp",           // Здоровье союзников
      "stamina", "maxStamina", // Выносливость
      "physicalEffects",
    ],
    environmentFields: [
      "environment",
      "coverPositions",        // Укрытия
      "hazardZones",           // Физические опасности
    ],
    hiddenFields: [
      "intention", "intentionTarget", // Скрыто - не знает куда враг ударит
      "weaknesses",                   // Скрыто - не знает магические слабости
      "morale", "maxMorale",          // Скрыто - не видит мораль
      "dialogueOptions",              // Скрыто - не видит возможности переговоров
    ],
  },
  
  MIND: {
    // Разум видит аналитику и слабости
    enemyFields: [
      "id", "name", "rank",
      "weaknesses",            // Элементальные слабости
      "resistances",           // Резисты
      "hitChance",             // Вероятность попадания
      "critChance",            // Вероятность крита
      "mentalEffects",         // Ментальные эффекты
      "technoVulnerabilities", // Техно-уязвимости
    ],
    allyFields: [
      "playerId", "playerName", "role", "rank",
      "morale", "maxMorale",   // Мораль
      "mentalEffects",
      "buffDurations",         // Сколько осталось баффов
    ],
    environmentFields: [
      "environment",
      "anomalyZones",          // Аномалии
      "hiddenLoot",            // Скрытые предметы
      "technoInteractables",   // Взламываемые объекты
    ],
    hiddenFields: [
      "hp", "maxHp",           // Скрыто - видит только "здоров/ранен/критично"
      "armor",                 // Скрыто - не знает точную броню
      "physicalEffects",       // Скрыто - не видит физические эффекты
      "dialogueOptions",       // Скрыто - не видит диалоги
      "aggroLines",            // Скрыто - не знает кого враг таргетит
    ],
  },
  
  SOCIAL: {
    // Лицо видит социальную динамику
    enemyFields: [
      "id", "name", "rank",
      "morale", "maxMorale",   // Мораль врага
      "intention",             // Намерение (кого атакует)
      "intentionTarget",       // Цель атаки
      "aggroLines",            // Линии агрессии (кто кого таргетит)
      "fearLevel",             // Уровень страха
      "negotiationChance",     // Шанс на переговоры
      "socialEffects",         // Социальные эффекты (feared, charmed)
    ],
    allyFields: [
      "playerId", "playerName", "role", "rank",
      "morale", "maxMorale",
      "socialEffects",
      "trustLevel",            // Уровень доверия
    ],
    environmentFields: [
      "environment",
      "dialogueHotspots",      // Точки диалогов
      "escapeRoutes",          // Пути отхода
      "socialZones",           // Зоны влияния фракций
    ],
    hiddenFields: [
      "hp", "maxHp",           // Скрыто - видит только "невредим/ранен/при смерти"
      "weaknesses",            // Скрыто - не знает элементальные слабости
      "armor",                 // Скрыто - не знает броню
      "technoVulnerabilities", // Скрыто - не видит техно-уязвимости
    ],
  },
};

// Текстовые описания вместо цифр
const HP_DESCRIPTIONS = {
  full: "В полном здравии",
  healthy: "Здоров",
  wounded: "Ранен",
  critical: "Критическое состояние",
  dying: "При смерти",
};

const MORALE_DESCRIPTIONS = {
  high: "Уверен в себе",
  normal: "Спокоен",
  shaken: "Неуверен",
  frightened: "Напуган",
  broken: "Сломлен",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Преобразует HP в текстовое описание
 */
function getHpDescription(hp: number, maxHp: number): string {
  const ratio = hp / maxHp;
  if (ratio >= 1) return HP_DESCRIPTIONS.full;
  if (ratio >= 0.75) return HP_DESCRIPTIONS.healthy;
  if (ratio >= 0.5) return HP_DESCRIPTIONS.wounded;
  if (ratio >= 0.25) return HP_DESCRIPTIONS.critical;
  return HP_DESCRIPTIONS.dying;
}

/**
 * Преобразует мораль в текстовое описание
 */
function getMoraleDescription(morale: number, maxMorale: number): string {
  const ratio = morale / maxMorale;
  if (ratio >= 0.8) return MORALE_DESCRIPTIONS.high;
  if (ratio >= 0.6) return MORALE_DESCRIPTIONS.normal;
  if (ratio >= 0.4) return MORALE_DESCRIPTIONS.shaken;
  if (ratio >= 0.2) return MORALE_DESCRIPTIONS.frightened;
  return MORALE_DESCRIPTIONS.broken;
}

/**
 * Фильтрует данные врага на основе роли
 */
function filterEnemyData(enemy: any, role: AsymmetricRole): any {
  const visibility = ROLE_VISIBILITY[role];
  const filtered: any = {};
  
  for (const field of visibility.enemyFields) {
    if (enemy[field] !== undefined) {
      filtered[field] = enemy[field];
    }
  }
  
  // Специальная обработка скрытых полей
  if (visibility.hiddenFields.includes("hp")) {
    // Заменяем HP на описание
    filtered.hpDescription = getHpDescription(enemy.hp, enemy.maxHp);
    delete filtered.hp;
    delete filtered.maxHp;
  }
  
  if (visibility.hiddenFields.includes("morale") && !filtered.morale) {
    // Не показываем мораль, если скрыта
  } else if (filtered.morale !== undefined) {
    // MIND и BODY не видят точную мораль
    if (role !== "SOCIAL") {
      filtered.moraleDescription = getMoraleDescription(enemy.morale, enemy.maxMorale);
      delete filtered.morale;
      delete filtered.maxMorale;
    }
  }
  
  return filtered;
}

/**
 * Фильтрует данные союзника на основе роли
 */
function filterAllyData(ally: any, role: AsymmetricRole, isMe: boolean): any {
  // Свои данные видим полностью
  if (isMe) {
    return ally;
  }
  
  const visibility = ROLE_VISIBILITY[role];
  const filtered: any = {};
  
  for (const field of visibility.allyFields) {
    if (ally[field] !== undefined) {
      filtered[field] = ally[field];
    }
  }
  
  return filtered;
}

/**
 * Добавляет подсказки для роли
 */
function addRoleHints(data: any, role: AsymmetricRole): any {
  const hints: string[] = [];
  
  switch (role) {
    case "BODY":
      if (data.armor && data.armor > 10) {
        hints.push("Тяжёлая броня - нужен пробивной урон");
      }
      if (data.staggerBar && data.staggerBar > 80) {
        hints.push("Почти сбит с ног - ещё один удар!");
      }
      break;
      
    case "MIND":
      if (data.weaknesses && data.weaknesses.length > 0) {
        hints.push(`Слабости: ${data.weaknesses.join(", ")}`);
      }
      if (data.hitChance && data.hitChance < 50) {
        hints.push("Низкий шанс попадания - нужна точность");
      }
      break;
      
    case "SOCIAL":
      if (data.negotiationChance && data.negotiationChance > 30) {
        hints.push("Можно попробовать договориться");
      }
      if (data.intention) {
        hints.push(`Собирается: ${translateIntention(data.intention)}`);
      }
      break;
  }
  
  return {
    ...data,
    roleHints: hints,
  };
}

/**
 * Переводит intention в читаемый текст
 */
function translateIntention(intention: string): string {
  if (intention.startsWith("attack_rank_")) {
    const rank = intention.replace("attack_rank_", "");
    return `атаковать позицию ${rank}`;
  }
  
  const translations: Record<string, string> = {
    "buff_self": "усилить себя",
    "heal": "лечиться",
    "flee": "бежать",
    "summon": "призвать подкрепление",
    "special_attack": "особая атака",
  };
  
  return translations[intention] || intention;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Получить игровое состояние с фильтрацией по роли
 * Это ГЛАВНЫЙ запрос для боевого UI
 */
export const getFilteredGameState = query({
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
    
    // Получить сессию игрока для определения роли
    const mySession = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
    
    if (!mySession) throw new Error("Not in this room");
    
    const role = mySession.role as AsymmetricRole;
    
    // Получить всех игроков
    const allSessions = await ctx.db
      .query("coop_session_players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    // Фильтровать данные врагов
    const filteredEnemies = room.enemies.map(enemy => {
      const filtered = filterEnemyData(enemy, role);
      return addRoleHints(filtered, role);
    });
    
    // Фильтровать данные союзников
    const filteredAllies = await Promise.all(allSessions.map(async (session) => {
      const sessionPlayer = await ctx.db.get(session.playerId);
      const allyData = {
        ...session,
        playerName: sessionPlayer?.name || "Unknown",
      };
      const isMe = session.playerId === player._id;
      return filterAllyData(allyData, role, isMe);
    }));
    
    // Фильтровать глобальное состояние
    const filteredGlobalState: any = {
      environment: room.globalState.environment,
      currentRound: room.currentRound,
      status: room.status,
    };
    
    // Добавляем данные в зависимости от роли
    const visibility = ROLE_VISIBILITY[role];
    
    if (!visibility.hiddenFields.includes("enemyHp")) {
      filteredGlobalState.enemyHp = room.globalState.enemyHp;
      filteredGlobalState.enemyMaxHp = room.globalState.enemyMaxHp;
    } else {
      filteredGlobalState.enemyHpDescription = getHpDescription(
        room.globalState.enemyHp,
        room.globalState.enemyMaxHp
      );
    }
    
    if (!visibility.hiddenFields.includes("enemyMorale")) {
      filteredGlobalState.enemyMorale = room.globalState.enemyMorale;
      filteredGlobalState.enemyMaxMorale = room.globalState.enemyMaxMorale;
    }
    
    if (!visibility.hiddenFields.includes("intention")) {
      filteredGlobalState.enemyIntention = room.globalState.enemyIntention;
      filteredGlobalState.enemyIntentionText = translateIntention(
        room.globalState.enemyIntention || "unknown"
      );
    }
    
    if (!visibility.hiddenFields.includes("weaknesses")) {
      filteredGlobalState.enemyWeaknesses = room.globalState.enemyWeaknesses;
    }
    
    return {
      // Метаданные
      roomCode: room.roomCode,
      myRole: role,
      myRoleName: mySession.roleName,
      myRank: mySession.rank,
      myPlayerId: player._id,
      
      // Моё состояние (полное)
      myState: {
        hp: mySession.hp,
        maxHp: mySession.maxHp,
        stamina: mySession.stamina,
        maxStamina: mySession.maxStamina,
        morale: mySession.morale,
        maxMorale: mySession.maxMorale,
        hand: mySession.hand,
        activeEffects: mySession.activeEffects,
      },
      
      // Фильтрованные данные
      globalState: filteredGlobalState,
      enemies: filteredEnemies,
      allies: filteredAllies,
      
      // Лог боя (полный для всех)
      log: room.log,
      
      // Подсказки для роли
      roleDescription: getRoleDescription(role),
      whatYouCanSee: visibility.enemyFields,
      whatYouCantSee: visibility.hiddenFields,
    };
  },
});

/**
 * Получить описание роли
 */
function getRoleDescription(role: AsymmetricRole): string {
  const descriptions: Record<AsymmetricRole, string> = {
    BODY: "Вы — Физик. Вы видите точное здоровье врагов, их броню и физические угрозы. Но вы НЕ видите, кого враг собирается атаковать — спросите у Лица!",
    MIND: "Вы — Разум. Вы видите слабости врагов, вероятности успеха атак и скрытые предметы. Но вы НЕ видите точное здоровье — спросите у Физика!",
    SOCIAL: "Вы — Лицо. Вы видите намерения врагов, их мораль и возможности для переговоров. Но вы НЕ видите их слабости — спросите у Разума!",
  };
  
  return descriptions[role];
}

/**
 * Получить "что спросить у союзника" подсказки
 */
export const getWhatToAsk = query({
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
    
    const mySession = await ctx.db
      .query("coop_session_players")
      .withIndex("by_player_room", (q) => 
        q.eq("playerId", player._id).eq("roomId", args.roomId)
      )
      .first();
    
    if (!mySession) return [];
    
    const role = mySession.role as AsymmetricRole;
    
    // Подсказки, что спросить у других ролей
    const questions: Record<AsymmetricRole, { askRole: string; questions: string[] }[]> = {
      BODY: [
        {
          askRole: "MIND",
          questions: [
            "Какие у врага слабости?",
            "Какой шанс попасть по нему?",
            "Есть скрытые предметы поблизости?",
          ],
        },
        {
          askRole: "SOCIAL",
          questions: [
            "Кого враг собирается атаковать?",
            "Можно ли с ним договориться?",
            "Какая у него мораль?",
          ],
        },
      ],
      MIND: [
        {
          askRole: "BODY",
          questions: [
            "Сколько у врага здоровья?",
            "Какая у него броня?",
            "Он близок к нокдауну?",
          ],
        },
        {
          askRole: "SOCIAL",
          questions: [
            "Кого он таргетит?",
            "Он напуган?",
            "Есть путь отступления?",
          ],
        },
      ],
      SOCIAL: [
        {
          askRole: "BODY",
          questions: [
            "Сколько HP осталось?",
            "Какая броня?",
            "Нужно укрытие?",
          ],
        },
        {
          askRole: "MIND",
          questions: [
            "Чем его бить эффективнее?",
            "Какой шанс крита?",
            "Есть ловушки?",
          ],
        },
      ],
    };
    
    return questions[role];
  },
});

/**
 * Сгенерировать "голос" комментарий для действия
 * Комментарий зависит от роли и ситуации
 */
export const generateVoiceComment = query({
  args: {
    role: v.union(v.literal("BODY"), v.literal("MIND"), v.literal("SOCIAL")),
    action: v.string(),
    context: v.object({
      enemyHp: v.optional(v.number()),
      enemyMorale: v.optional(v.number()),
      targetRank: v.optional(v.number()),
      isLowHp: v.optional(v.boolean()),
    }),
  },
  handler: async (_ctx, args) => {
    const { role, action, context } = args;
    
    const comments: Record<AsymmetricRole, Record<string, string[]>> = {
      BODY: {
        attack: [
          "Бей сильнее!",
          "Ещё один удар — и он упадёт!",
          "Не давай ему опомниться!",
        ],
        defend: [
          "Укройся!",
          "Держи строй!",
          "Не высовывайся!",
        ],
        lowHp: [
          "Я ранен, нужна помощь!",
          "Не могу долго держаться!",
          "Отступаем!",
        ],
      },
      MIND: {
        attack: [
          "Бей по слабому месту!",
          "Вероятность успеха высокая!",
          "Анализ завершён — атакуй!",
        ],
        analyze: [
          "Сканирую...",
          "Обнаружена уязвимость!",
          "Данные получены!",
        ],
        warning: [
          "Осторожно, ловушка!",
          "Не туда, там опасно!",
          "Вижу аномалию!",
        ],
      },
      SOCIAL: {
        attack: [
          "Он напуган, добей!",
          "Мораль врага падает!",
          "Ещё немного давления!",
        ],
        negotiate: [
          "Подожди, можно договориться!",
          "Он готов сдаться!",
          "Не стреляй — это выгоднее!",
        ],
        warning: [
          "Он собирается атаковать тебя!",
          "Берегись, идёт на тебя!",
          "Смена цели — прикройся!",
        ],
      },
    };
    
    const actionType = action.includes("attack") ? "attack" : 
                       action.includes("defend") ? "defend" :
                       action.includes("analyze") ? "analyze" :
                       action.includes("negotiate") ? "negotiate" :
                       context.isLowHp ? "lowHp" :
                       "warning";
    
    const roleComments = comments[role][actionType] || comments[role].attack;
    const randomComment = roleComments[Math.floor(Math.random() * roleComments.length)];
    
    return {
      voiceId: role,
      voiceName: role === "BODY" ? "Физик" : role === "MIND" ? "Разум" : "Лицо",
      comment: randomComment,
    };
  },
});


