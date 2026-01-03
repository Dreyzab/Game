export interface CoopBaseUpgrade {
    id: string;
    name: string;
    description: string;
    maxLevel: number;
    baseCost: number;
    costMultiplier: number;
    effects: string[];
}
export declare const BASE_UPGRADES: CoopBaseUpgrade[];
export declare const ITEM_CONTRIBUTION_VALUES: Record<string, number>;
