import type { CoopRoleId } from '../shared/types/coop';
export type CoopExpeditionEventId = 'psi_wave' | 'injury_roll' | 'injury_treat';
export interface CoopExpeditionPlayerSnapshot {
    playerId: number;
    role: CoopRoleId | null;
    hp?: number | null;
    maxHp?: number | null;
    morale?: number | null;
    maxMorale?: number | null;
    stamina?: number | null;
    maxStamina?: number | null;
    skills?: Record<string, number> | null;
}
export interface CoopExpeditionInjuryState {
    targetPlayerId: number;
    needsTreatment: boolean;
}
export interface CoopExpeditionEventPerPlayerResult {
    pass: boolean;
    traitsAdded: string[];
}
export interface CoopExpeditionEventResolution {
    id: CoopExpeditionEventId;
    success: boolean;
    summary: string;
    perPlayer: Record<string, CoopExpeditionEventPerPlayerResult>;
    injury?: CoopExpeditionInjuryState;
    targetPlayerId?: number;
    actorPlayerId?: number;
}
export declare function resolveExpeditionEvent(params: {
    id: CoopExpeditionEventId;
    players: CoopExpeditionPlayerSnapshot[];
    actorRole?: CoopRoleId;
    injury?: CoopExpeditionInjuryState;
}): CoopExpeditionEventResolution;
