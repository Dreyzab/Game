import React, { useMemo } from 'react'
import { cn } from '@/shared/lib/utils/cn'
import { ATTRIBUTE_GROUPS, PARLIAMENT_VOICES, type AttributeGroup, type VoiceId } from '@/shared/types/parliament'
import { STARTING_SKILLS } from '@/shared/lib/stats'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import { type CoopCharacterTemplate, calculateLoadoutWeight, getWeightCategory, WEIGHT_THRESHOLDS } from '../model/characters'

// Image paths for items - comprehensive list
const ITEM_IMAGES: Record<string, string> = {
    // Weapons
    'pistol_pm': '/images/weapons/makarov.png',
    'glock_19': '/images/weapons/glock_19.png',
    'sniper_rifle': '/images/weapons/патронвинтовка.png',
    'grenade': '/images/weapons/бомба.png',
    'emp_charge': '/images/weapons/бомба2.png',
    'smg_mp_class1': '/images/weapons/MP1класса.png',
    'rifle_ak74': '/images/weapons/Калашников.png',
    // Armor - Vests
    'vest_class1': '/images/Защита/Бронижилет1Класса.png',
    'vest_class2': '/images/Защита/Бронежилет2класса.png',
    'vest_class3': '/images/Защита/Бронежилет3класса.png',
    'vest_class4': '/images/Защита/Бронежилет4класса.png',
    // Armor - Helmets
    'helmet_class1': '/images/Защита/Шлем1класса.png',
    'helmet_class2': '/images/Защита/Шлем2Класса.png',
    'helmet_class3': '/images/Защита/Шлем3касса.png',
    'helmet_class4': '/images/Защита/Шлем4класса.png',
    // Backpacks
    'backpack_tactical_medium': '/images/Рюкзаки/ТактическийРюкзак(средний).png',
    'backpack_tactical_large': '/images/Рюкзаки/ТактическийРюкзак(большой).png',
    'backpack_hiking_medium': '/images/Рюкзаки/ТуристическийРюкзак(большесредний).png',
    'backpack_hiking_large': '/images/Рюкзаки/ТуристическийРюкзак(большой).png',
    'backpack_expedition': '/images/Рюкзаки/ПоходныйРюкзак(очбольшой).png',
    'backpack_medic_large': '/images/Рюкзаки/МедРюкзак.png',
    // Drones
    'drone_recon': '/images/Дроны/разведДрон.png',
    'drone_bomber': '/images/Дроны/ДронБомбомёт.png',
    'drone_gunner': '/images/Дроны/ДронПулемёт.png',
    'drone_manipulator': '/images/Дроны/ДронМанипулятор.png',
    'drone_rocket': '/images/Дроны/Ракетныйдрон.png',
    'tactical_drone': '/images/Дроны/разведДрон.png',
    // Gear
    'field_medkit': '/images/снаряга/Аптечка.png',
    'medkit': '/images/снаряга/Аптечка.png',
    'field_scanner': '/images/снаряга/рация.jpg',
    'scout_jacket': '/images/снаряга/маскировка.jpg',
    'jacket_hidden': '/images/снаряга/маскировка2Класса.jpg',
    'nvg': '/images/снаряга/ПНВ.jpg',
    'visor_tactical': '/images/снаряга/Визор.png',
    'bio_analyzer': '/images/снаряга/БиоАнализатор.png',
    'tourniquet': '/images/снаряга/Турникет.png',
    'gel_healing': '/images/снаряга/АптечныйГель.png',
    'repair_kit_small': '/images/снаряга/ремонтныйнабор(малый).png',
    'repair_kit_medium': '/images/снаряга/ремонтныйнабор(средний).png',
    'repair_kit_large': '/images/снаряга/ремонтныйнабор(Большой).png',
    'energy_cells': '/images/снаряга/ЭнергоЯчейки.png',
    'radio': '/images/снаряга/рация.jpg',
    'flashlight': '/images/снаряга/фонарик.png',
    'chest_rig': '/images/снаряга/Разгрузка.jpg',
    'canteen': '/images/снаряга/Фляга.jpg',
    'map_tactical': '/images/снаряга/карта.jpg',
    'ammo_pistol_mag': '/images/снаряга/патроныпистолет.png',
    'ammo_rifle_mag': '/images/снаряга/патроныАвтомат.png',
    'ammo_sniper_mag': '/images/снаряга/патронвинтовка.png',
    'ammo_shotgun': '/images/снаряга/патроныружьё.png',
}

interface CharacterDossierProps {
    character: CoopCharacterTemplate
    className?: string
}

export const CharacterDossier: React.FC<CharacterDossierProps> = ({ character, className }) => {
    // Calculate character's voice levels with modifiers
    const getVoiceLevel = (voiceId: VoiceId): number => {
        const base = (STARTING_SKILLS as any)[voiceId]
        const modifier = character.voiceModifiers[voiceId] ?? 0
        return base + modifier
    }

    // Calculate weight and category
    const weightInfo = useMemo(() => calculateLoadoutWeight(character.loadout), [character.loadout])
    const weightCategory = useMemo(() => getWeightCategory(weightInfo.effectiveWeight), [weightInfo.effectiveWeight])

    // Calculate resource values based on voice levels AND weight penalty
    const calculateResource = (group: AttributeGroup): number => {
        const voices = ATTRIBUTE_GROUPS[group].voices
        const sum = voices.reduce((acc, v) => acc + getVoiceLevel(v), 0)

        switch (group) {
            case 'body': return Math.floor(70 + sum * 0.4) // HP
            case 'motorics': {
                // Base AP calculation with weight penalty
                const baseAP = 3 + Math.floor(sum * 0.01)
                const enduranceBonus = Math.floor((character.voiceModifiers.endurance ?? 0) / 5)
                return Math.max(1, baseAP + weightCategory.apPenalty + enduranceBonus)
            }
            case 'mind': return Math.floor(30 + sum * 0.3) // MP
            case 'consciousness': return Math.floor(30 + sum * 0.3) // WP
            case 'psyche': return Math.floor(50 + sum * 0.5) // PP
            case 'sociality': return Math.floor(sum * 0.1) // SP
            default: return 0
        }
    }

    // Separate items by location
    const itemsOnBody = character.loadout.filter(e => !e.inBackpack)
    const itemsInBackpack = character.loadout.filter(e => e.inBackpack)
    const backpackItem = character.loadout.find(e => ITEM_TEMPLATES[e.itemId]?.kind === 'backpack')

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

            {/* Resources Grid with penalties */}
            <div className="grid grid-cols-3 gap-2">
                {(['body', 'motorics', 'consciousness'] as const).map(groupId => {
                    const group = ATTRIBUTE_GROUPS[groupId]
                    const value = calculateResource(groupId)
                    const hasPenalty = groupId === 'motorics' && weightCategory.apPenalty < 0
                    return (
                        <div key={groupId} className={cn(
                            "bg-slate-800/50 rounded-lg p-2 border",
                            hasPenalty ? "border-red-500/50" : "border-slate-700/50"
                        )}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-bold" style={{ color: group.resourceMetadata.color }}>
                                    {group.resourceMetadata.acronym}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase">{group.nameRu}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-lg font-bold text-white">{value}</span>
                                {hasPenalty && (
                                    <span className="text-[10px] text-red-400">({weightCategory.apPenalty})</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Weight indicator with full details */}
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">⚖️ Нагрузка</span>
                    <span className={cn('font-bold text-sm', weightCategory.color)}>
                        {weightInfo.effectiveWeight} кг — {weightCategory.label}
                    </span>
                </div>

                {/* Weight bar */}
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden mb-2">
                    <div
                        className={cn(
                            "h-full transition-all duration-300",
                            weightCategory.category === 'light' ? 'bg-green-500' :
                                weightCategory.category === 'medium' ? 'bg-yellow-500' :
                                    weightCategory.category === 'heavy' ? 'bg-orange-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(100, (weightInfo.effectiveWeight / WEIGHT_THRESHOLDS.CRITICAL) * 100)}%` }}
                    />
                </div>

                {/* Thresholds */}
                <div className="flex justify-between text-[9px] text-slate-600 mb-2">
                    <span className="text-green-600">{WEIGHT_THRESHOLDS.LIGHT}кг</span>
                    <span className="text-yellow-600">{WEIGHT_THRESHOLDS.MEDIUM}кг</span>
                    <span className="text-orange-600">{WEIGHT_THRESHOLDS.HEAVY}кг</span>
                    <span className="text-red-600">{WEIGHT_THRESHOLDS.CRITICAL}кг</span>
                </div>

                {/* Backpack reduction info */}
                {weightInfo.backpackReduction > 0 && (
                    <div className="text-[10px] text-cyan-400 flex items-center gap-1">
                        🎒 Рюкзак снижает вес на {weightInfo.backpackReduction}%
                        <span className="text-slate-500">
                            (исходный вес: {weightInfo.totalWeight.toFixed(1)} кг)
                        </span>
                    </div>
                )}

                {/* Penalties */}
                {weightCategory.category !== 'light' && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1">
                        <div className="text-[10px] text-slate-400">Штрафы:</div>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                            {weightCategory.apPenalty !== 0 && (
                                <span className="text-red-400">AP {weightCategory.apPenalty}</span>
                            )}
                            {weightCategory.initiativePenalty !== 0 && (
                                <span className="text-orange-400">Инициатива {weightCategory.initiativePenalty}</span>
                            )}
                            {weightCategory.dodgePenalty !== 0 && (
                                <span className="text-yellow-400">Уклонение {weightCategory.dodgePenalty}%</span>
                            )}
                        </div>
                    </div>
                )}
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

            {/* Equipment on body */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Экипировка ({itemsOnBody.length} предметов)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {itemsOnBody.map((entry, idx) => {
                        const item = ITEM_TEMPLATES[entry.itemId]
                        if (!item) return null
                        const imagePath = ITEM_IMAGES[entry.itemId] || item.imageUrl

                        return (
                            <div
                                key={`body-${entry.itemId}-${idx}`}
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
                                    {item.baseStats?.defense && (
                                        <div className="text-[10px] text-blue-400">🛡 {item.baseStats.defense}</div>
                                    )}
                                    {item.baseStats?.damage && (
                                        <div className="text-[10px] text-red-400">⚔ {item.baseStats.damage}</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Backpack contents */}
            {backpackItem && itemsInBackpack.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span>🎒 В рюкзаке ({itemsInBackpack.length})</span>
                        <span className="text-cyan-400 font-normal">-{weightInfo.backpackReduction}% веса</span>
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 bg-slate-900/50 p-2 rounded-lg border border-slate-700/30">
                        {itemsInBackpack.map((entry, idx) => {
                            const item = ITEM_TEMPLATES[entry.itemId]
                            if (!item) return null
                            const imagePath = ITEM_IMAGES[entry.itemId] || item.imageUrl

                            return (
                                <div
                                    key={`backpack-${entry.itemId}-${idx}`}
                                    className="flex flex-col items-center gap-1 p-1.5 rounded border border-slate-700/30 bg-slate-800/20 hover:bg-slate-700/20 transition-colors"
                                    title={item.name}
                                >
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        {imagePath ? (
                                            <img src={imagePath} alt={item.name} className="max-h-full max-w-full object-contain opacity-80" />
                                        ) : (
                                            <span className="text-lg opacity-80">{item.icon}</span>
                                        )}
                                    </div>
                                    <div className="text-[9px] text-slate-400 text-center truncate w-full">
                                        {entry.qty && entry.qty > 1 ? `×${entry.qty}` : item.name.split(' ')[0]}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
