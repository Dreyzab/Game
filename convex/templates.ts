export const ITEM_TEMPLATES: Record<string, {
    width: number;
    height: number;
    kind: string;
    baseStats?: any;
}> = {
    rusty_sword: {
        width: 1,
        height: 3,
        kind: 'weapon'
    },
    rusty_pipe: {
        width: 1,
        height: 3,
        kind: 'weapon'
    },
    scout_jacket: {
        width: 2,
        height: 2,
        kind: 'clothing'
    },
    field_medkit: {
        width: 2,
        height: 2,
        kind: 'consumable'
    },
    bandage: {
        width: 1,
        height: 1,
        kind: 'consumable'
    },
    ration_pack: {
        width: 1,
        height: 1,
        kind: 'consumable'
    },
    canned_food: {
        width: 1,
        height: 1,
        kind: 'consumable'
    },
    mica_shard: {
        width: 1,
        height: 1,
        kind: 'artifact'
    }
};
