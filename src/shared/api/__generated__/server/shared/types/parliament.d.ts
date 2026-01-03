/**
 * =====================================================
 * СИСТЕМА АТРИБУТОВ "ВНУТРЕННИЙ ПАРЛАМЕНТ"
 * (The Internal Parliament)
 * 6 Групп × 3 Голоса = 18 Голосов
 * =====================================================
 */
/**
 * 6 Атрибутных Групп согласно MSDD v0.4
 */
export type AttributeGroup = 'body' | 'motorics' | 'mind' | 'consciousness' | 'psyche' | 'sociality';
/**
 * Все 18 голосов Внутреннего Парламента
 */
export type VoiceId = 'force' | 'resilience' | 'endurance' | 'perception' | 'reaction' | 'coordination' | 'logic' | 'rhetoric' | 'analysis' | 'authority' | 'suggestion' | 'courage' | 'gambling' | 'drama' | 'creativity' | 'empathy' | 'solidarity' | 'honor';
export interface AttributeGroupDefinition {
    id: AttributeGroup;
    name: string;
    nameRu: string;
    description: string;
    icon: string;
    color: string;
    voices: VoiceId[];
    resourceMetadata: {
        id: 'hp' | 'ap' | 'mp' | 'wp' | 'pp' | 'sp';
        name: string;
        acronym: string;
        color: string;
    };
}
export declare const ATTRIBUTE_GROUPS: Record<AttributeGroup, AttributeGroupDefinition>;
export interface VoiceDefinition {
    id: VoiceId;
    name: string;
    nameRu: string;
    alias: string;
    group: AttributeGroup;
    icon: string;
    motto: string;
    description: string;
    combatEffects: VoiceCombatEffect[];
    comments: {
        onSuccess: string[];
        onFailure: string[];
        onCritical: string[];
        onExhaustion: string[];
    };
}
export interface VoiceCombatEffect {
    type: 'passive' | 'scaling' | 'trigger';
    stat?: string;
    modifier?: number;
    condition?: string;
    description: string;
}
export declare const PARLIAMENT_VOICES: Record<VoiceId, VoiceDefinition>;
/**
 * Получить группу по ID голоса
 */
export declare function getVoiceGroup(voiceId: VoiceId): AttributeGroup;
/**
 * Получить все голоса группы
 */
export declare function getVoicesByGroup(group: AttributeGroup): VoiceDefinition[];
/**
 * Начальные значения голосов для нового персонажа
 */
export declare const STARTING_VOICE_LEVELS: Record<VoiceId, number>;
/**
 * Получить случайный комментарий голоса
 */
export declare function getVoiceComment(voiceId: VoiceId, situation: 'onSuccess' | 'onFailure' | 'onCritical' | 'onExhaustion'): string;
