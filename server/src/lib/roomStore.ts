type Role = 'body' | 'mind' | 'social' | 'assault' | 'support' | 'scout';

/**
 * Cooperative Quest — lightweight state machine for the shared LCSD quest.
 * 
 * The narrative text itself lives on the client side; the server only
 * tracks which node the room is currently on, who made which choice,
 * and enforces simple role-based restrictions for some options.
 */
export type CoopQuestNodeId =
    | 'forest_boundary'   // Граница леса и магического барьера
    | 'golem_engagement'  // Столкновение с големами
    | 'dwarf_encounter'   // Появление дворфов и остановка големов
    | 'amulet_reveal'     // Срабатывание амулетов
    | 'quest_complete';   // Завершение сцены

export type CoopQuestChoice = {
    id: string;
    text: string;
    nextNodeId: CoopQuestNodeId;
    requiredRole?: Role;
};

export type CoopQuestNode = {
    id: CoopQuestNodeId;
    title: string;
    description: string;
    choices: CoopQuestChoice[];
};

export type CoopQuestState = {
    nodeId: CoopQuestNodeId;
    history: {
        nodeId: CoopQuestNodeId;
        choiceId?: string;
        actorId?: string;
        at: number;
    }[];
    startedAt: number;
    finishedAt?: number;
};

// Minimal quest graph that follows the "Гром среди Ясного Леса" flow.
export const COOP_QUEST_NODES: Record<CoopQuestNodeId, CoopQuestNode> = {
    forest_boundary: {
        id: 'forest_boundary',
        title: 'Граница миров',
        description:
            'Отряд выходит к аномальной границе леса: по одну сторону — дикий хаос, по другую — ровные ряды деревьев, как в парке. Нуль предупреждает о магическом барьере, но один из кристаллов уже начинает светиться.',
        choices: [
            {
                id: 'shoot_crystal',
                text: 'Прайс: «Контакт. Огонь по кристаллу!»',
                nextNodeId: 'golem_engagement',
                requiredRole: 'body',
            },
            {
                id: 'analyze_barrier',
                text: 'Нуль: попытаться проанализировать барьер перед выстрелом.',
                nextNodeId: 'golem_engagement',
                requiredRole: 'mind',
            },
            {
                id: 'hold_position',
                text: 'Социал: удержать людей от паники и скоординировать действия.',
                nextNodeId: 'golem_engagement',
                requiredRole: 'social',
            },
        ],
    },
    golem_engagement: {
        id: 'golem_engagement',
        title: 'Пробуждение стражей',
        description:
            'Кристалл раскалывается от выстрелов, но земля начинает дрожать. Каменные груды по склону собираются в силуэты големов, которые идут на отряд. Один выстрел панцерфауста разносит ближайшего, но остальные приближаются.',
        choices: [
            {
                id: 'rpg_nearest',
                text: 'Сделать второй выстрел по ближайшему голему.',
                nextNodeId: 'dwarf_encounter',
                requiredRole: 'body',
            },
            {
                id: 'focus_fire_center',
                text: 'Сконцентрировать огонь по центральному голему.',
                nextNodeId: 'dwarf_encounter',
                requiredRole: 'mind',
            },
            {
                id: 'cover_team',
                text: 'Организовать прикрытие и оттянуть огонь на себя.',
                nextNodeId: 'dwarf_encounter',
                requiredRole: 'social',
            },
        ],
    },
    dwarf_encounter: {
        id: 'dwarf_encounter',
        title: 'Неожиданные союзники',
        description:
            'Когда каменный кулак уже почти обрушивается на Прайса, раздаётся крик «Stari!», и големы замирают. Из-за деревьев выходит отряд дворфов в тяжёлой рунической броне. Лидер требует: «Kiu vi estas? Ĵetu la armilojn!».',
        choices: [
            {
                id: 'lower_weapons',
                text: 'Прайс медленно опускает оружие и поднимает руки.',
                nextNodeId: 'amulet_reveal',
            },
            {
                id: 'shout_about_gnome',
                text: 'Крикнуть, что гном ранен и ему нужна помощь.',
                nextNodeId: 'amulet_reveal',
                requiredRole: 'social',
            },
            {
                id: 'stay_on_trigger',
                text: 'Не опускать оружие, но не стрелять.',
                nextNodeId: 'amulet_reveal',
                requiredRole: 'body',
            },
        ],
    },
    amulet_reveal: {
        id: 'amulet_reveal',
        title: 'Знак Древнего Союза',
        description:
            'Прайс достаёт амулет Аурелии. Амулет лидера дворфов откликается тем же золотым светом. Обе подвески пульсируют в унисон, и на лицах дворфов сменяется выражение от враждебности к шоку и недоверию.',
        choices: [
            {
                id: 'answer_origin',
                text: 'Пояснить, откуда у людей амулет.',
                nextNodeId: 'quest_complete',
            },
            {
                id: 'invoke_alliance',
                text: 'Сослаться на «знак Древнего Союза» и просить диалога.',
                nextNodeId: 'quest_complete',
                requiredRole: 'social',
            },
            {
                id: 'stay_silent',
                text: 'Молчать и дать дворфу заговорить первым.',
                nextNodeId: 'quest_complete',
            },
        ],
    },
    quest_complete: {
        id: 'quest_complete',
        title: 'Гром среди ясного леса',
        description:
            'Големы стоят неподвижно, дворфы держат людей под прицелом, а два светящихся амулета висят в воздухе между ними. Бой остановлен, но исход встречи зависит от следующих слов. Сцена совместного квеста завершается.',
        choices: [],
    },
};

export type CoopPlayer = {
    id: string;
    role?: Role;
    ready: boolean;
};

export type CoopRoom = {
    code: string;
    hostId: string;
    status: 'lobby' | 'in_progress' | 'finished';
    players: CoopPlayer[];
    quest?: CoopQuestState;
    updatedAt: number;
};

export type PvpMatch = {
    id: string;
    status: 'matching' | 'active' | 'finished';
    players: string[];
    startedAt: number;
    updatedAt: number;
};

const coopRooms = new Map<string, CoopRoom>();
const pvpMatches = new Map<string, PvpMatch>();

function generateCode(length = 4) {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
}

export function createCoopRoom(userId: string, role?: Role): CoopRoom {
    let code = generateCode();
    while (coopRooms.has(code)) {
        code = generateCode();
    }
    const now = Date.now();
    const room: CoopRoom = {
        code,
        hostId: userId,
        status: 'lobby',
        players: [{ id: userId, role, ready: false }],
        updatedAt: now,
    };
    coopRooms.set(code, room);
    return room;
}

export function getCoopRoom(code: string): CoopRoom | undefined {
    return coopRooms.get(code);
}

export function joinCoopRoom(code: string, userId: string, role?: Role): CoopRoom | null {
    const room = coopRooms.get(code);
    if (!room) return null;
    const existing = room.players.find((p) => p.id === userId);
    if (existing) {
        existing.role = role ?? existing.role;
    } else {
        room.players.push({ id: userId, role, ready: false });
    }
    room.updatedAt = Date.now();
    return room;
}

export function leaveCoopRoom(code: string, userId: string): CoopRoom | null {
    const room = coopRooms.get(code);
    if (!room) return null;
    room.players = room.players.filter((p) => p.id !== userId);
    room.updatedAt = Date.now();
    if (room.players.length === 0) {
        coopRooms.delete(code);
        return null;
    }
    return room;
}

export function setCoopReady(code: string, userId: string, ready: boolean): CoopRoom | null {
    const room = coopRooms.get(code);
    if (!room) return null;
    const player = room.players.find((p) => p.id === userId);
    if (!player) return null;
    player.ready = ready;
    room.updatedAt = Date.now();
    return room;
}

export function startCoop(code: string, userId: string): CoopRoom | null {
    const room = coopRooms.get(code);
    if (!room) return null;
    if (room.hostId !== userId) return room;
    const everyoneReady = room.players.length > 0 && room.players.every((p) => p.ready);
    if (!everyoneReady) return room;
    room.status = 'in_progress';
    // Инициализируем состояние совместного квеста при старте коопа, если его ещё нет
    if (!room.quest) {
        const now = Date.now();
        room.quest = {
            nodeId: 'forest_boundary',
            history: [
                {
                    nodeId: 'forest_boundary',
                    at: now,
                },
            ],
            startedAt: now,
        };
    }
    room.updatedAt = Date.now();
    return room;
}

/**
 * Получить состояние кооперативного квеста для комнаты.
 */
export function getCoopQuest(code: string): CoopQuestState | null {
    const room = coopRooms.get(code);
    if (!room || !room.quest) return null;
    return room.quest;
}

/**
 * Применить выбор в кооперативном квесте с простыми проверками ролей.
 */
export function applyCoopQuestChoice(code: string, userId: string, choiceId: string): {
    quest: CoopQuestState | null;
    error?: string;
} {
    const room = coopRooms.get(code);
    if (!room) return { quest: null, error: 'Room not found' };
    if (!room.quest) return { quest: null, error: 'Quest not initialized' };

    const currentNode = COOP_QUEST_NODES[room.quest.nodeId];
    if (!currentNode) return { quest: room.quest, error: 'Invalid quest node' };

    const choice = currentNode.choices.find((c) => c.id === choiceId);
    if (!choice) return { quest: room.quest, error: 'Choice not available in current node' };

    if (choice.requiredRole) {
        const player = room.players.find((p) => p.id === userId);
        if (!player || player.role !== choice.requiredRole) {
            return { quest: room.quest, error: 'Choice not allowed for this role' };
        }
    }

    const now = Date.now();
    room.quest.nodeId = choice.nextNodeId;
    room.quest.history.push({
        nodeId: currentNode.id,
        choiceId: choice.id,
        actorId: userId,
        at: now,
    });

    if (choice.nextNodeId === 'quest_complete' && !room.quest.finishedAt) {
        room.quest.finishedAt = now;
        room.status = 'finished';
    }

    room.updatedAt = now;

    return { quest: room.quest };
}

export function createPvpMatch(userId: string): PvpMatch {
    const now = Date.now();
    const match: PvpMatch = {
        id: `match_${now}_${Math.random().toString(16).slice(2, 6)}`,
        status: 'matching',
        players: [userId],
        startedAt: now,
        updatedAt: now,
    };
    pvpMatches.set(match.id, match);
    return match;
}

export function joinPvpMatch(matchId: string, userId: string): PvpMatch | null {
    const match = pvpMatches.get(matchId);
    if (!match) return null;
    if (!match.players.includes(userId)) {
        match.players.push(userId);
    }
    match.updatedAt = Date.now();
    if (match.players.length >= 2) {
        match.status = 'active';
    }
    return match;
}

export function getPvpMatch(matchId: string): PvpMatch | undefined {
    return pvpMatches.get(matchId);
}








