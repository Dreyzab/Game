import type { CoopQuestNode } from '../../shared/types/coop'

export const COOP_STAGE_RIFT_EXPEDITION_NODES: Record<string, CoopQuestNode> = {
    rift_entry: {
        id: 'rift_entry',
        title: 'The Rift: Entry',
        description: `
Вы входите в зону разлома. Здесь время работает против вас — каждая активность сдвигает таймер до следующей волны.
`,
        interactionType: 'sync',
        choices: [
            {
                id: 'rift_start_expedition',
                text: 'Войти',
                action: 'start_expedition',
                expedition: {
                    maxTurns: 3,
                    waveNodeId: 'rift_wave_1',
                    stagePoolId: 'rift',
                },
                nextNodeId: 'rift_clearing_hub',
            },
        ],
    },

    rift_clearing_hub: {
        id: 'rift_clearing_hub',
        title: 'Rift Clearing',
        description: `
Вы в условном “хабе” зоны. Команда выбирает, что делать до следующей волны.

- Explore: запускает сайд‑квест/исследование (стоит 1 ход)
- Camp: остаётесь, тратите 1 ход и можете зайти в меню лагеря
- Advance: двигаетесь дальше
`,
        interactionType: 'vote',
        choices: [
            {
                id: 'hub_explore',
                text: 'Explore: осмотреть поляну',
                nextNodeId: 'rift_clearing_hub',
            },
            {
                id: 'hub_flora',
                text: 'Explore: Alien flora (risky)',
                nextNodeId: 'rift_clearing_hub',
            },
            {
                id: 'hub_camp',
                text: 'Camp: поставить лагерь',
                cost: { time: 1 },
                nextNodeId: 'rift_clearing_hub',
            },
            {
                id: 'hub_next_stage',
                text: 'Advance: Move deeper (next stage)',
                action: 'advance_expedition_stage',
                nextNodeId: 'rift_stage_transition',
            },
            {
                id: 'hub_advance',
                text: 'Advance: продолжить путь',
                nextNodeId: 'rift_advance',
            },
        ],
    },

    rift_stage_transition: {
        id: 'rift_stage_transition',
        title: 'Advance',
        description: `
You move deeper into the Rift. The air grows heavier, and the threat level rises.
`,
        interactionType: 'sync',
        choices: [{ id: 'rift_stage_transition_continue', text: 'Continue', nextNodeId: 'rift_clearing_hub' }],
    },

    rift_psi_wave_1: {
        id: 'rift_psi_wave_1',
        title: 'Psi Wave',
        description: `
A sudden psionic wave rolls through the clearing. Everyone must resist it.
Failing the check may add a mental trait (paranoia/sarcasm/psychosis/aggression).
`,
        interactionType: 'contribute',
        choices: [
            {
                id: 'psi_resist',
                text: 'Resist the psi-wave',
                action: 'resolve_expedition_event',
                expeditionEvent: { id: 'psi_wave' },
                nextNodeId: 'rift_clearing_hub',
            },
        ],
    },

    rift_flora_cut: {
        id: 'rift_flora_cut',
        title: 'Alien Flora',
        description: `
You inspect the alien flora up close. Someone gets cut by a sharp leaf.
First: endurance check. If it fails, the team chooses who treats the wound.
`,
        interactionType: 'sync',
        choices: [
            {
                id: 'flora_check',
                text: 'Continue',
                action: 'resolve_expedition_event',
                expeditionEvent: {
                    id: 'injury_roll',
                    successNextNodeId: 'rift_clearing_hub',
                    failureNextNodeId: 'rift_injury_treat_select',
                },
                nextNodeId: 'rift_clearing_hub',
            },
        ],
    },

    rift_injury_treat_select: {
        id: 'rift_injury_treat_select',
        title: 'Treat The Wound',
        description: `
The bleeding won’t stop by itself. Decide who tries to treat the wound.
Valkyrie (Medic) has the best odds.
`,
        interactionType: 'vote',
        choices: [
            {
                id: 'treat_valkyrie',
                text: 'Valkyrie: first aid',
                action: 'resolve_expedition_event',
                expeditionEvent: { id: 'injury_treat', actorRole: 'valkyrie' },
                nextNodeId: 'rift_clearing_hub',
            },
            {
                id: 'treat_vorschlag',
                text: 'Vorschlag: improvised bandage',
                action: 'resolve_expedition_event',
                expeditionEvent: { id: 'injury_treat', actorRole: 'vorschlag' },
                nextNodeId: 'rift_clearing_hub',
            },
            {
                id: 'treat_ghost',
                text: 'Ghost: field kit',
                action: 'resolve_expedition_event',
                expeditionEvent: { id: 'injury_treat', actorRole: 'ghost' },
                nextNodeId: 'rift_clearing_hub',
            },
            {
                id: 'treat_shustrya',
                text: 'Shustrya: brute pressure',
                action: 'resolve_expedition_event',
                expeditionEvent: { id: 'injury_treat', actorRole: 'shustrya' },
                nextNodeId: 'rift_clearing_hub',
            },
        ],
    },

    rift_wave_1: {
        id: 'rift_wave_1',
        title: 'Enemy Wave',
        description: `
Волна врагов накрывает зону. Вы должны пережить атаку и вернуться к планированию.
`,
        interactionType: 'vote',
        choices: [
            {
                id: 'wave_hold',
                action: 'start_coop_battle',
                battle: { scenarioId: 'scorpion_nest', threatDelta: 0 },
                text: 'Удерживать позиции',
                reward: { rp: 5 },
                nextNodeId: 'rift_clearing_hub',
            },
            {
                id: 'wave_fallback',
                action: 'start_coop_battle',
                battle: { scenarioId: 'scorpion_nest', threatDelta: -1 },
                text: 'Отступить к укрытиям',
                nextNodeId: 'rift_clearing_hub',
            },
        ],
    },

    rift_advance: {
        id: 'rift_advance',
        title: 'Advance',
        description: `
Вы покидаете хаб и углубляетесь дальше.
`,
        interactionType: 'sync',
        choices: [{ id: 'rift_advance_continue', text: 'Далее', nextNodeId: 'coop_complete' }],
    },
};

