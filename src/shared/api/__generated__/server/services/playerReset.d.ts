type AuthedUser = {
    id: string;
    type: 'clerk' | 'guest';
};
export type ResetSelfResult = {
    playerId: number;
    coopRoomsLeft: number;
    deleted: Record<string, number>;
    recreatedProgress: boolean;
};
export declare function resetSelf(user: AuthedUser, playerId: number): Promise<ResetSelfResult>;
export {};
