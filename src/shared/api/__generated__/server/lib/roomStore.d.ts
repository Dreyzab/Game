export type PvpMatch = {
    id: string;
    status: 'matching' | 'active' | 'finished';
    players: string[];
    startedAt: number;
    updatedAt: number;
};
export declare function createPvpMatch(userId: string): PvpMatch;
export declare function joinPvpMatch(matchId: string, userId: string): PvpMatch | null;
export declare function getPvpMatch(matchId: string): PvpMatch | undefined;
export declare function resetPvpRuntime(): void;
