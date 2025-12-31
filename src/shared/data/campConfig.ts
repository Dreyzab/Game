
export interface CoopBaseUpgrade {
    id: string;
    name: string;
    description: string;
    maxLevel: number;
    baseCost: number; // in Camp Credits
    costMultiplier: number; // Cost = baseCost * (multiplier ^ currentLevel)
    effects: string[]; // Descriptions of effects at each level
}

export const BASE_UPGRADES: CoopBaseUpgrade[] = [
    {
        id: 'medbay',
        name: 'Медицинский Отсек',
        description: 'Улучшает лечение и скорость восстановления оперативников.',
        maxLevel: 3,
        baseCost: 500,
        costMultiplier: 1.5,
        effects: [
            'Базовое лечение доступно.',
            'Скорость лечения +50%.',
            'Автоматическая стабилизация критических состояний.'
        ]
    },
    {
        id: 'comms',
        name: 'Узел Связи',
        description: 'Открывает доступ к новым миссиям и разведданным.',
        maxLevel: 3,
        baseCost: 300,
        costMultiplier: 1.5,
        effects: [
            'Базовые миссии доступны.',
            'Открыт доступ к сложным операциям.',
            'Разведка показывает угрозы на карте.'
        ]
    },
    {
        id: 'engineering',
        name: 'Инженерный Цех',
        description: 'Позволяет производить снаряжение и обслуживать дронов.',
        maxLevel: 3,
        baseCost: 400,
        costMultiplier: 1.5,
        effects: [
            'Ремонт снаряжения.',
            'Крафт расходников.',
            'Производство улучшенных модулей.'
        ]
    },
    {
        id: 'drone_bay',
        name: 'Станция Дронов',
        description: 'Увеличивает лимит активных дронов и их эффективность.',
        maxLevel: 3,
        baseCost: 600,
        costMultiplier: 1.8,
        effects: [
            'Лимит дронов: 1.',
            'Лимит дронов: 2. Дальность +20%.',
            'Лимит дронов: 3. Автономный режим.'
        ]
    }
];

export const ITEM_CONTRIBUTION_VALUES: Record<string, number> = {
    'scrap': 10,
    'tech_parts': 50,
    'anomaly_sample': 100,
    'old_data_drive': 75,
    'medkit': 20,
    'ammo_box': 15,
};
