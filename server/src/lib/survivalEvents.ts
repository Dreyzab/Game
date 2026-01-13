/**
 * Survival Events Registry - The "Content Pack"
 * Static event definitions for all zones
 */

import type { SurvivalEvent, ZoneType, EventEffect } from '../shared/types/survival'

// ============================================================================
// KITCHEN (Торговый Ряд / The Strip) - Food, Trading, Social
// ============================================================================

const KITCHEN_EVENTS: SurvivalEvent[] = [
    {
        id: 'kitchen_trader_wandering',
        zone: 'kitchen',
        title: 'Бродячий Торговец',
        text: 'Из-за прилавка выходит человек в пыльном плаще. На поясе — связка банок и мешочков. Он оглядывается и делает знак "всё спокойно".',
        options: [
            {
                id: 'trade_food',
                text: '[КУПИТЬ] 2 Еды за 1 Топливо',
                cost: { fuel: 1 },
                effect: { resourceDelta: { food: 2 }, logMessage: 'обменял топливо на еду у торговца' },
            },
            {
                id: 'trade_medicine',
                text: '[КУПИТЬ] 1 Медикамент за 2 Еды',
                cost: { food: 2 },
                effect: { resourceDelta: { medicine: 1 }, logMessage: 'купил медикаменты' },
            },
            {
                id: 'rob_trader',
                text: '[ОГРАБИТЬ] (Нужен Пистолет)',
                requiredItem: 'pistol',
                effect: {
                    successChance: 50,
                    resourceDelta: { food: 3, fuel: 1 },
                    logMessage: 'ограбил торговца',
                    failureEffect: { woundPlayer: true, logMessage: 'получил пулю при попытке ограбления' },
                },
            },
            {
                id: 'leave_peaceful',
                text: '[УЙТИ]',
                effect: { logMessage: 'ушёл с рынка' },
            },
        ],
        tags: ['trader'],
        weight: 30,
    },
    {
        id: 'kitchen_fridge_stash',
        zone: 'kitchen',
        title: 'Продуктовый Склад',
        text: 'Старый холодильник стоит посреди разрушенного магазина. Дверца приоткрыта, внутри что-то поблескивает.',
        options: [
            {
                id: 'search_fridge',
                text: '[ОБЫСКАТЬ]',
                effect: {
                    successChance: 70,
                    resourceDelta: { food: 2 },
                    logMessage: 'нашёл еду в холодильнике',
                    failureEffect: { resourceDelta: { morale: -5 }, logMessage: 'нашёл только гниль в холодильнике' },
                },
            },
            {
                id: 'smell_warning',
                text: '[ПОНЮХАТЬ СНАЧАЛА] (Разведчик)',
                requiredRole: 'scout',
                effect: { resourceDelta: { food: 3 }, logMessage: 'определил свежую еду по запаху' },
            },
            {
                id: 'skip_fridge',
                text: '[ПРОЙТИ МИМО]',
                effect: { logMessage: 'прошёл мимо холодильника' },
            },
        ],
        tags: ['loot'],
        weight: 40,
    },
    {
        id: 'kitchen_rats',
        zone: 'kitchen',
        title: 'Крысиное Гнездо',
        text: 'За ящиками слышится писк. Много писка. Глаза блестят в темноте — крысы охраняют что-то ценное.',
        options: [
            {
                id: 'fight_rats',
                text: '[АТАКОВАТЬ]',
                effect: {
                    successChance: 60,
                    resourceDelta: { food: 1 },
                    grantItems: [{ templateId: 'rat_meat', quantity: 2 }],
                    logMessage: 'разогнал крыс и забрал мясо',
                    failureEffect: { woundPlayer: true, logMessage: 'был укушен крысами' },
                },
            },
            {
                id: 'lure_rats',
                text: '[ОТВЛЕЧЬ ЕДОЙ] (-1 Еда)',
                cost: { food: 1 },
                effect: { resourceDelta: { food: 3 }, logMessage: 'отвлёк крыс и забрал их запасы' },
            },
            {
                id: 'retreat_rats',
                text: '[ОТСТУПИТЬ]',
                effect: { logMessage: 'отступил от крысиного гнезда' },
            },
        ],
        tags: ['combat', 'loot'],
        weight: 25,
    },
]

// ============================================================================
// BATHROOM (Хим-Лаборатория / Bio-Labs) - Medicine, High Risk
// ============================================================================

const BATHROOM_EVENTS: SurvivalEvent[] = [
    {
        id: 'bathroom_medicine_cabinet',
        zone: 'bathroom',
        title: 'Аптечка Первой Помощи',
        text: 'На стене висит медицинский шкафчик с треснувшим стеклом. Внутри видны упаковки.',
        options: [
            {
                id: 'take_medicine',
                text: '[ЗАБРАТЬ ВСЁ]',
                effect: { resourceDelta: { medicine: 2 }, logMessage: 'нашёл медикаменты в аптечке' },
            },
            {
                id: 'check_mirror',
                text: '[ПОСМОТРЕТЬ В ЗЕРКАЛО]',
                effect: {
                    successChance: 70,
                    resourceDelta: { morale: 5 },
                    logMessage: 'собрался с мыслями',
                    failureEffect: { resourceDelta: { morale: -10 }, logMessage: 'увидел что-то пугающее в отражении' },
                },
            },
        ],
        tags: ['loot'],
        weight: 40,
    },
    {
        id: 'bathroom_gas_leak',
        zone: 'bathroom',
        title: 'Утечка Газа',
        text: 'Едкий запах бьёт в нос. Трубы рядом с душем повреждены, из них сочится зеленоватый дым.',
        options: [
            {
                id: 'repair_leak',
                text: '[ПОЧИНИТЬ] (Техник)',
                requiredRole: 'techie',
                effect: {
                    resourceDelta: { medicine: 1 },
                    grantItems: [{ templateId: 'chemical_canister', quantity: 1 }],
                    logMessage: 'перекрыл утечку и собрал химикаты',
                },
            },
            {
                id: 'risk_grab',
                text: '[БЫСТРО СХВАТИТЬ ЧТО-ТО]',
                effect: {
                    successChance: 40,
                    resourceDelta: { medicine: 2 },
                    logMessage: 'успел схватить медикаменты',
                    failureEffect: { woundPlayer: true, resourceDelta: { morale: -10 }, logMessage: 'надышался газом' },
                },
            },
            {
                id: 'flee_gas',
                text: '[УЙТИ НЕМЕДЛЕННО]',
                effect: { logMessage: 'отступил из-за утечки газа' },
            },
        ],
        tags: ['hazard'],
        weight: 30,
    },
    {
        id: 'bathroom_infected',
        zone: 'bathroom',
        title: 'Заражённый',
        text: 'В углу скорчилась фигура. Дыхание хриплое, кожа покрыта язвами. Он ещё не заметил вас.',
        options: [
            {
                id: 'sneak_past',
                text: '[ПРОКРАСТЬСЯ]',
                effect: {
                    successChance: 60,
                    logMessage: 'прокрался мимо заражённого',
                    failureEffect: { woundPlayer: true, logMessage: 'был замечен заражённым' },
                },
            },
            {
                id: 'mercy_kill',
                text: '[ДОБИТЬ] (Нужен Нож или Пистолет)',
                requiredItem: 'knife',
                effect: { resourceDelta: { medicine: 1 }, logMessage: 'устранил заражённого' },
            },
            {
                id: 'talk_infected',
                text: '[ПОПРОБОВАТЬ ПОГОВОРИТЬ] (Дипломат)',
                requiredRole: 'face',
                effect: {
                    resourceDelta: { medicine: 2 },
                    logMessage: 'узнал о тайнике от умирающего',
                },
            },
        ],
        tags: ['combat', 'hazard'],
        weight: 25,
    },
]

// ============================================================================
// BEDROOM (Жилой Сектор / Residential) - Scrap, Gear, NPCs
// ============================================================================

const BEDROOM_EVENTS: SurvivalEvent[] = [
    {
        id: 'bedroom_under_bed',
        zone: 'bedroom',
        title: 'Тайник Под Кроватью',
        text: 'Старая кровать, матрас изъеден молью. Но под ним виднеется что-то блестящее.',
        options: [
            {
                id: 'reach_under',
                text: '[ЗАЛЕЗТЬ ПОД КРОВАТЬ]',
                effect: {
                    successChance: 70,
                    grantItems: [{ templateId: 'pistol', quantity: 1 }],
                    logMessage: 'нашёл пистолет под кроватью',
                    failureEffect: {
                        grantItems: [{ templateId: 'scrap', quantity: 2 }],
                        logMessage: 'нашёл только хлам под кроватью',
                    },
                },
            },
            {
                id: 'check_sleeper',
                text: '[ПРОВЕРИТЬ КРОВАТЬ] (Разведчик)',
                requiredRole: 'scout',
                effect: {
                    grantItems: [{ templateId: 'pistol', quantity: 1 }, { templateId: 'ammo', quantity: 5 }],
                    logMessage: 'обнаружил и разоружил "спящего"',
                },
            },
        ],
        tags: ['loot'],
        weight: 35,
    },
    {
        id: 'bedroom_survivor',
        zone: 'bedroom',
        title: 'Выживший',
        text: 'В углу комнаты сидит мужчина средних лет. Он не нападает, но смотрит настороженно. "Я механик... был механиком."',
        options: [
            {
                id: 'recruit_mechanic',
                text: '[ПРИГЛАСИТЬ НА БАЗУ] (-1 Еда)',
                cost: { food: 1 },
                effect: {
                    recruitNpc: {
                        id: 'mechanic_npc',
                        name: 'Механик',
                        dailyCost: 1,
                        passiveBonus: { fuel: 1 },
                    },
                    logMessage: 'привёл Механика на базу',
                },
            },
            {
                id: 'trade_survivor',
                text: '[ОБМЕНЯТЬСЯ]',
                effect: {
                    grantItems: [{ templateId: 'toolkit', quantity: 1 }],
                    logMessage: 'обменялся с выжившим',
                },
            },
            {
                id: 'leave_survivor',
                text: '[ОСТАВИТЬ]',
                effect: { resourceDelta: { morale: -5 }, logMessage: 'оставил выжившего' },
            },
        ],
        tags: ['npc'],
        weight: 20,
    },
    {
        id: 'bedroom_wardrobe',
        zone: 'bedroom',
        title: 'Гардероб',
        text: 'Большой шкаф, дверцы заклинило. Может быть, внутри что-то полезное.',
        options: [
            {
                id: 'force_open',
                text: '[ВЗЛОМАТЬ]',
                effect: {
                    successChance: 80,
                    grantItems: [{ templateId: 'jacket', quantity: 1 }],
                    logMessage: 'нашёл куртку в шкафу',
                    failureEffect: { logMessage: 'шкаф оказался пуст' },
                },
            },
            {
                id: 'techie_open',
                text: '[АККУРАТНО ОТКРЫТЬ] (Техник)',
                requiredRole: 'techie',
                effect: {
                    grantItems: [{ templateId: 'gas_mask', quantity: 1 }],
                    logMessage: 'нашёл противогаз в тайнике шкафа',
                },
            },
        ],
        tags: ['loot'],
        weight: 30,
    },
]

// ============================================================================
// CORRIDOR (Промзона / Industrial) - Fuel, Scrap, Danger
// ============================================================================

const CORRIDOR_EVENTS: SurvivalEvent[] = [
    {
        id: 'corridor_toolbox',
        zone: 'corridor',
        title: 'Ящик с Инструментами',
        text: 'Ржавый инструментальный ящик валяется у стены. Замок сломан.',
        options: [
            {
                id: 'loot_toolbox',
                text: '[ОБЫСКАТЬ]',
                effect: {
                    grantItems: [{ templateId: 'scrap', quantity: 3 }],
                    logMessage: 'нашёл детали в ящике',
                },
            },
            {
                id: 'techie_repair',
                text: '[ПОЧИНИТЬ ИНСТРУМЕНТЫ] (Техник)',
                requiredRole: 'techie',
                effect: {
                    grantItems: [{ templateId: 'toolkit', quantity: 1 }],
                    resourceDelta: { defense: 1 },
                    logMessage: 'восстановил инструменты',
                },
            },
        ],
        tags: ['loot'],
        weight: 40,
    },
    {
        id: 'corridor_generator',
        zone: 'corridor',
        title: 'Сломанный Генератор',
        text: 'Старый дизельный генератор. Явно не работает, но бензобак может еще содержать топливо.',
        options: [
            {
                id: 'drain_fuel',
                text: '[СЛИТЬ ТОПЛИВО]',
                effect: { resourceDelta: { fuel: 2 }, logMessage: 'слил топливо из генератора' },
            },
            {
                id: 'repair_generator',
                text: '[ПОЧИНИТЬ] (Техник)',
                requiredRole: 'techie',
                effect: {
                    grantItems: [{ templateId: 'portable_generator', quantity: 1 }],
                    logMessage: 'починил и забрал генератор',
                },
            },
            {
                id: 'strip_parts',
                text: '[РАЗОБРАТЬ НА ДЕТАЛИ]',
                effect: {
                    grantItems: [{ templateId: 'scrap', quantity: 4 }],
                    logMessage: 'разобрал генератор на детали',
                },
            },
        ],
        tags: ['loot'],
        weight: 30,
    },
    {
        id: 'corridor_bandits',
        zone: 'corridor',
        title: 'Засада Бандитов',
        text: 'Голоса впереди. Двое вооружённых мужчин блокируют проход. "Плати или не проходишь."',
        options: [
            {
                id: 'pay_toll',
                text: '[ЗАПЛАТИТЬ] (-2 Еда)',
                cost: { food: 2 },
                effect: { logMessage: 'заплатил дань бандитам' },
            },
            {
                id: 'fight_bandits',
                text: '[АТАКОВАТЬ] (Нужен Пистолет)',
                requiredItem: 'pistol',
                effect: {
                    successChance: 60,
                    grantItems: [{ templateId: 'ammo', quantity: 10 }],
                    logMessage: 'победил бандитов',
                    failureEffect: { woundPlayer: true, logMessage: 'был ранен в перестрелке' },
                },
            },
            {
                id: 'intimidate_bandits',
                text: '[ЗАПУГАТЬ] (Силовик)',
                requiredRole: 'enforcer',
                effect: { logMessage: 'запугал бандитов — они отступили' },
            },
            {
                id: 'negotiate_bandits',
                text: '[ДОГОВОРИТЬСЯ] (Дипломат)',
                requiredRole: 'face',
                cost: { food: 1 },
                effect: {
                    resourceDelta: { fuel: 1 },
                    logMessage: 'договорился о взаимовыгодном обмене',
                },
            },
        ],
        tags: ['combat'],
        weight: 25,
    },
]

// ============================================================================
// LIVING ROOM (Терминал Базы / Base Terminal) - Special actions
// ============================================================================

const LIVING_ROOM_EVENTS: SurvivalEvent[] = [
    {
        id: 'living_room_terminal',
        zone: 'living_room',
        title: 'Терминал Базы',
        text: 'Главный пульт управления. Отсюда можно распределить ресурсы и проверить состояние укрытия.',
        options: [
            {
                id: 'check_status',
                text: '[ПРОВЕРИТЬ СТАТУС]',
                effect: { resourceDelta: { morale: 5 }, logMessage: 'проверил статус базы' },
            },
            {
                id: 'boost_defense',
                text: '[УКРЕПИТЬ ОБОРОНУ] (-1 Топливо)',
                cost: { fuel: 1 },
                effect: { resourceDelta: { defense: 2 }, logMessage: 'укрепил оборону базы' },
            },
            {
                id: 'call_meeting',
                text: '[СОБРАТЬ ВСЕХ]',
                effect: { resourceDelta: { morale: 10 }, logMessage: 'провёл собрание' },
            },
        ],
        tags: ['story'],
        weight: 50,
    },
]

// ============================================================================
// EVENT REGISTRY & HELPERS
// ============================================================================

/** All events indexed by ID */
const EVENT_REGISTRY: Map<string, SurvivalEvent> = new Map()

/** Events grouped by zone */
const EVENTS_BY_ZONE: Record<ZoneType, SurvivalEvent[]> = {
    kitchen: KITCHEN_EVENTS,
    bathroom: BATHROOM_EVENTS,
    bedroom: BEDROOM_EVENTS,
    corridor: CORRIDOR_EVENTS,
    living_room: LIVING_ROOM_EVENTS,
}

// Populate registry
for (const events of Object.values(EVENTS_BY_ZONE)) {
    for (const event of events) {
        EVENT_REGISTRY.set(event.id, event)
    }
}

/**
 * Get an event by its ID
 */
export function getEventById(eventId: string): SurvivalEvent | undefined {
    return EVENT_REGISTRY.get(eventId)
}

/**
 * Get all events for a specific zone
 */
export function getEventsForZone(zone: ZoneType): SurvivalEvent[] {
    return EVENTS_BY_ZONE[zone] ?? []
}

/**
 * Roll a random event for a zone (weighted)
 * @param zone - The zone to roll for
 * @param flags - Session flags for condition checking
 * @param visitCount - How many times this zone has been visited
 */
export function rollRandomEvent(
    zone: ZoneType,
    flags: Record<string, unknown> = {},
    visitCount: number = 0
): SurvivalEvent | null {
    const candidates = getEventsForZone(zone).filter((event) => {
        if (!event.condition) return true

        // Check required flags
        if (event.condition.requiredFlags) {
            for (const flag of event.condition.requiredFlags) {
                if (!flags[flag]) return false
            }
        }

        // Check excluded flags
        if (event.condition.excludeFlags) {
            for (const flag of event.condition.excludeFlags) {
                if (flags[flag]) return false
            }
        }

        // Check max visits
        if (event.condition.maxVisits !== undefined && visitCount >= event.condition.maxVisits) {
            return false
        }

        return true
    })

    if (candidates.length === 0) return null

    // Weighted random selection
    const totalWeight = candidates.reduce((sum, e) => sum + (e.weight ?? 10), 0)
    let roll = Math.random() * totalWeight

    for (const event of candidates) {
        roll -= event.weight ?? 10
        if (roll <= 0) return event
    }

    return candidates[candidates.length - 1]
}

/**
 * Get all events with a specific tag
 */
export function getEventsByTag(tag: string): SurvivalEvent[] {
    const results: SurvivalEvent[] = []
    for (const event of EVENT_REGISTRY.values()) {
        if (event.tags?.includes(tag as any)) {
            results.push(event)
        }
    }
    return results
}

/**
 * Get all registered events
 */
export function getAllEvents(): SurvivalEvent[] {
    return Array.from(EVENT_REGISTRY.values())
}

export { EVENTS_BY_ZONE }
