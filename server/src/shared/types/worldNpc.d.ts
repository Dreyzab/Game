export interface WorldNpcDefinition {
    id: string;
    name: string;
    characterName: string;
    description: string;
    archetype: string;
    faction: string;
    philosophy?: string;
    ethel_affinity?: string;
    defaultLocationId: string;
    services?: string[];
    dialogues?: string[];
    questBindings?: string[];
    perk?: string;
    atmosphere?: string;
    image?: string;
    sceneBindings?: any[];
    unlockRequirements?: any;
    danger_level?: any;
}
export interface WorldNpcState {
    currentLocationId: string;
    isAlive: boolean;
    relationship: number;
    services?: string[];
    dialogues?: string[];
}
