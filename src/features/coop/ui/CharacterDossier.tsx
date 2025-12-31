import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import { ATTRIBUTE_GROUPS, PARLIAMENT_VOICES, STARTING_VOICE_LEVELS, type AttributeGroup, type VoiceId } from '@/shared/types/parliament'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import type { CoopCharacterTemplate } from '../model/characters'

// Image paths for items
const ITEM_IMAGES: Record<string, string> = {
    'pistol_pm': '/images/weapons/makarov.png',
    'glock_19': '/images/weapons/glock_19.png',
    'sniper_rifle': '/images/weapons/патронвинтовка.png',
    'grenade': '/images/weapons/бомба.png',
    'emp_charge': '/images/weapons/бомба2.png',
    'field_medkit': '/images/снаряга/Аптечка.png',
    'medkit': '/images/снаряга/Аптечка.png',
    'tactical_drone': '/images/снаряга/ПНВ.jpg',
    'field_scanner': '/images/снаряга/рация.jpg',
    'scout_jacket': '/images/снаряга/маскировка.jpg',
    'jacket_hidden': '/images/снаряга/маскировка2Класса.jpg',
}

interface CharacterDossierProps {
    character: CoopCharacterTemplate
    className?: string
}

export const CharacterDossier: React.FC<CharacterDossierProps> = ({ character, className }) => {
    // Calculate character's voice levels with modifiers
    const getVoiceLevel = (voiceId: VoiceId): number => {
        const base = STARTING_VOICE_LEVELS[voiceId]
        const modifier = character.voiceModifiers[voiceId] ?? 0
        return base + modifier
    }

    // Calculate resource values based on voice levels
    const calculateResource = (group: AttributeGroup): number => {
        const voices = ATTRIBUTE_GROUPS[group].voices
        const sum = voices.reduce((acc, v) => acc + getVoiceLevel(v), 0)

        switch (group) {
            case 'body': return Math.floor(70 + sum * 0.4) // HP
            case 'motorics': return Math.floor(2 + sum * 0.01) // AP
            case 'mind': return Math.floor(30 + sum * 0.3) // MP
            case 'consciousness': return Math.floor(30 + sum * 0.3) // WP
            case 'psyche': return Math.floor(50 + sum * 0.5) // PP
            case 'sociality': return Math.floor(sum * 0.1) // SP
            default: return 0
        }
    }

    return (
        <div className={cn('space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500', className)}>
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className={cn(
                    'w-20 h-20 rounded-xl border-2 overflow-hidden shrink-0 bg-gradient-to-br',
                    character.accentClass
                )}>
                    <img
                        src={character.portraitUrl}
                        alt={character.title}
                        className="w-full h-full object-cover object-top"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white">{character.title}</h2>
                    <div className="text-sm text-cyan-400">{character.subtitle}</div>
                    <div className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {character.backstory.split('\n')[0]}
                    </div>
                </div>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-3 gap-2">
                {(['body', 'motorics', 'consciousness'] as const).map(groupId => {
                    const group = ATTRIBUTE_GROUPS[groupId]
                    const value = calculateResource(groupId)
                    return (
                        <div key={groupId} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-bold" style={{ color: group.resourceMetadata.color }}>
                                    {group.resourceMetadata.acronym}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase">{group.nameRu}</span>
                            </div>
                            <div className="text-lg font-bold text-white">{value}</div>
                        </div>
                    )
                })}
            </div>

            {/* Key Attributes */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ключевые навыки</h3>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(character.voiceModifiers)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([voiceId, modifier]) => {
                            const voice = PARLIAMENT_VOICES[voiceId as VoiceId]
                            const level = getVoiceLevel(voiceId as VoiceId)
                            return (
                                <div
                                    key={voiceId}
                                    className="flex items-center justify-between p-2 rounded-md bg-slate-800/50 border border-slate-700/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{voice.icon}</span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-white">{voice.nameRu}</span>
                                            <span className="text-[9px] text-slate-500">{voice.alias}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-cyan-400">{level}</span>
                                        <span className="text-[9px] text-green-400">+{modifier}</span>
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>

            {/* Backstory */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Досье</h3>
                <div className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 whitespace-pre-line">
                    {character.backstory}
                </div>
            </div>

            {/* Loadout */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Снаряжение</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {character.loadout.map((entry, idx) => {
                        const item = ITEM_TEMPLATES[entry.itemId]
                        if (!item) return null
                        const imagePath = ITEM_IMAGES[entry.itemId]

                        return (
                            <div
                                key={`${entry.itemId}-${idx}`}
                                className="group relative flex items-center gap-2 p-2 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/30 transition-colors"
                            >
                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                    {imagePath ? (
                                        <img src={imagePath} alt={item.name} className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <span className="text-2xl">{item.icon}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-200 truncate">
                                        {item.name}
                                        {entry.qty && entry.qty > 1 && <span className="text-slate-500"> ×{entry.qty}</span>}
                                    </div>
                                    {item.baseStats?.damage && (
                                        <div className="text-[10px] text-red-400">Урон: {item.baseStats.damage}</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
