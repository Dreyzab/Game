export type ResetResult = {
    truncatedTables: string[];
    deletedBots: number;
    mode: 'all' | 'multiplayer';
};
export declare function resetDatabaseAll(): Promise<ResetResult>;
export declare function resetDatabaseMultiplayer(): Promise<ResetResult>;
