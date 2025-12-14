import type { ItemAward } from "./itemAward";
export type QrAction = {
    type: "notice";
    message: string;
} | {
    type: "unlock_point";
    pointId: string;
} | {
    type: "start_vn";
    sceneId: string;
} | {
    type: "start_tutorial_battle";
    returnScene?: string;
    defeatScene?: string;
} | {
    type: "grant_items";
    items: ItemAward[];
} | {
    type: "grant_gold";
    amount: number;
} | {
    type: "grant_xp";
    amount: number;
} | {
    type: "add_flags";
    flags: string[];
} | {
    type: "remove_flags";
    flags: string[];
} | {
    type: "grant_reputation";
    reputation: Record<string, number>;
};
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
export declare const QR_BONUSES: Record<string, BonusQrDefinition>;
export declare function getQrBonus(bonusId: string): BonusQrDefinition | undefined;
export declare function pickBonusOutcome(def: BonusQrDefinition): BonusQrOutcome;
