import type { ItemAward } from "./itemAward";

export type QrAction =
    | { type: "notice"; message: string }
    | { type: "unlock_point"; pointId: string }
    | { type: "start_vn"; sceneId: string }
    | { type: "start_tutorial_battle"; returnScene?: string; defeatScene?: string }
    | { type: "grant_items"; items: ItemAward[] }
    | { type: "grant_gold"; amount: number }
    | { type: "grant_xp"; amount: number }
    | { type: "add_flags"; flags: string[] }
    | { type: "remove_flags"; flags: string[] }
    | { type: "grant_reputation"; reputation: Record<string, number> };

export interface BonusQrOutcome {
    weight?: number;
    actions: QrAction[];
}

export interface BonusQrDefinition {
    id: string;
    title: string;
    description?: string;
    oneTime?: boolean;
    outcomes: BonusQrOutcome[];
}

export const QR_BONUSES: Record<string, BonusQrDefinition> = {
    cache_medical_01: {
        id: "cache_medical_01",
        title: "Медицинский тайник",
        description: "Небольшой набор расходников, спрятанный кем-то на чёрный день.",
        oneTime: true,
        outcomes: [
            {
                actions: [
                    { type: "notice", message: "Вы находите тайник с медикаментами." },
                    { type: "grant_items", items: [{ itemId: "bandage", quantity: 2 }, { itemId: "medkit", quantity: 1 }] },
                    { type: "grant_xp", amount: 25 },
                ],
            },
        ],
    },
    cache_scrap_01: {
        id: "cache_scrap_01",
        title: "Контейнер со скрапом",
        description: "Металлолом и немного кредитов — достаточно, чтобы почувствовать удачу.",
        oneTime: true,
        outcomes: [
            {
                actions: [
                    { type: "notice", message: "Вы вскрываете контейнер: внутри скрап и немного денег." },
                    { type: "grant_items", items: [{ itemId: "scrap", quantity: 10 }] },
                    { type: "grant_gold", amount: 15 },
                ],
            },
        ],
    },
    story_echo_01: {
        id: "story_echo_01",
        title: "Эхо-метка",
        description: "Короткий сюжетный фрагмент (VN).",
        oneTime: true,
        outcomes: [
            {
                actions: [
                    { type: "notice", message: "Эхо активируется. Кажется, это важно..." },
                    { type: "start_vn", sceneId: "station_hub" },
                ],
            },
        ],
    },
    combat_trial_01: {
        id: "combat_trial_01",
        title: "Испытание",
        description: "Бой (пока через TutorialBattle).",
        oneTime: false,
        outcomes: [
            {
                actions: [
                    { type: "notice", message: "Вы чувствуете угрозу — готовьтесь к бою." },
                    { type: "start_tutorial_battle", returnScene: "combat_tutorial_victory", defeatScene: "combat_tutorial_defeat" },
                ],
            },
        ],
    },
};

export function getQrBonus(bonusId: string): BonusQrDefinition | undefined {
    return QR_BONUSES[bonusId];
}

export function pickBonusOutcome(def: BonusQrDefinition): BonusQrOutcome {
    const outcomes = def.outcomes?.length ? def.outcomes : [{ actions: [] }];
    if (outcomes.length === 1) return outcomes[0];

    const weights = outcomes.map((o) => (typeof o.weight === "number" && o.weight > 0 ? o.weight : 1));
    const total = weights.reduce((sum, w) => sum + w, 0);
    const r = Math.random() * total;
    let acc = 0;
    for (let i = 0; i < outcomes.length; i += 1) {
        acc += weights[i];
        if (r <= acc) return outcomes[i];
    }
    return outcomes[outcomes.length - 1];
}

