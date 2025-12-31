/**
 * Панель прогресса персонажа
 * Отображает уровень, опыт и позволяет распределять очки
 */
import React, { useState } from 'react'
import { cn } from '@/shared/lib/utils/cn'
import {
    ATTRIBUTE_GROUPS,
    PARLIAMENT_VOICES,
    type VoiceId,
    type AttributeGroup
} from '@/shared/types/parliament'
import {
    type CharacterProgression,
    getLevelFromXP,
    getLevelProgress,
    getTotalXPForLevel,
    MAX_LEVEL,
    spendVoicePoint,
    spendGroupPoint,
} from '@/shared/types/experience'

interface ProgressionPanelProps {
    /** Текущий прогресс персонажа */
    progression: CharacterProgression
    /** Callback при изменении прогресса */
    onProgressionChange: (newProgression: CharacterProgression) => void
    /** Имя персонажа */
    characterName?: string
    /** Компактный режим */
    compact?: boolean
    className?: string
}

export const ProgressionPanel: React.FC<ProgressionPanelProps> = ({
    progression,
    onProgressionChange,
    characterName,
    compact = false,
    className,
}) => {
    const [expandedGroup, setExpandedGroup] = useState<AttributeGroup | null>(null)

    const level = getLevelFromXP(progression.totalXP)
    const progress = getLevelProgress(progression.totalXP)
    const currentLevelXP = getTotalXPForLevel(level)
    const nextLevelXP = level < MAX_LEVEL ? getTotalXPForLevel(level + 1) : currentLevelXP
    const xpInCurrentLevel = progression.totalXP - currentLevelXP
    const xpNeededForNext = nextLevelXP - currentLevelXP

    const hasAvailablePoints = progression.availableVoicePoints > 0 || progression.availableGroupPoints > 0

    // Обработка распределения очков
    const handleSpendVoicePoint = (voiceId: VoiceId) => {
        const newProgression = spendVoicePoint(progression, voiceId)
        if (newProgression) {
            onProgressionChange(newProgression)
        }
    }

    const handleSpendGroupPoint = (groupId: AttributeGroup) => {
        const newProgression = spendGroupPoint(progression, groupId)
        if (newProgression) {
            onProgressionChange(newProgression)
        }
    }

    if (compact) {
        return (
            <div className={cn('flex items-center gap-3', className)}>
                {/* Level Badge */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Ур.</span>
                    <span className="text-lg font-bold text-cyan-400">{level}</span>
                </div>

                {/* XP Bar */}
                <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>
                </div>

                {/* Available Points */}
                {hasAvailablePoints && (
                    <div className="flex items-center gap-1 text-xs">
                        {progression.availableVoicePoints > 0 && (
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                +{progression.availableVoicePoints} 🎯
                            </span>
                        )}
                        {progression.availableGroupPoints > 0 && (
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                +{progression.availableGroupPoints} 📊
                            </span>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={cn('bg-slate-900 rounded-xl border border-slate-700 overflow-hidden', className)}>
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        {characterName && (
                            <div className="text-sm text-slate-400">{characterName}</div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-cyan-400">Уровень {level}</span>
                            {level >= MAX_LEVEL && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">MAX</span>
                            )}
                        </div>
                    </div>

                    {/* Available Points Summary */}
                    {hasAvailablePoints && (
                        <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase">Доступно</div>
                            <div className="flex gap-2 mt-1">
                                {progression.availableVoicePoints > 0 && (
                                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-bold">
                                        {progression.availableVoicePoints} очков навыков
                                    </span>
                                )}
                                {progression.availableGroupPoints > 0 && (
                                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm font-bold">
                                        {progression.availableGroupPoints} очков групп
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* XP Progress Bar */}
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{xpInCurrentLevel} XP</span>
                        <span>{xpNeededForNext} XP</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Attribute Groups */}
            <div className="divide-y divide-slate-700/50">
                {(Object.keys(ATTRIBUTE_GROUPS) as AttributeGroup[]).map(groupId => {
                    const group = ATTRIBUTE_GROUPS[groupId]
                    const isExpanded = expandedGroup === groupId
                    const groupPointsSpent = progression.spentGroupPoints[groupId] ?? 0

                    return (
                        <div key={groupId}>
                            {/* Group Header */}
                            <button
                                onClick={() => setExpandedGroup(isExpanded ? null : groupId)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{group.icon}</span>
                                    <div className="text-left">
                                        <div className="font-medium text-white">{group.nameRu}</div>
                                        <div className="text-xs text-slate-500">{group.name}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Group Points Indicator */}
                                    {groupPointsSpent > 0 && (
                                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                            +{groupPointsSpent}
                                        </span>
                                    )}

                                    {/* Spend Group Point Button */}
                                    {progression.availableGroupPoints > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleSpendGroupPoint(groupId)
                                            }}
                                            className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded hover:bg-purple-500/30 transition-colors"
                                        >
                                            +1 группе
                                        </button>
                                    )}

                                    {/* Expand Icon */}
                                    <span className={cn(
                                        'text-slate-500 transition-transform',
                                        isExpanded && 'rotate-180'
                                    )}>
                                        ▼
                                    </span>
                                </div>
                            </button>

                            {/* Expanded Voices */}
                            {isExpanded && (
                                <div className="px-4 pb-3 space-y-2">
                                    {group.voices.map(voiceId => {
                                        const voice = PARLIAMENT_VOICES[voiceId]
                                        const pointsSpent = progression.spentVoicePoints[voiceId] ?? 0
                                        const groupBonus = Math.floor(groupPointsSpent * 0.5)
                                        const totalBonus = pointsSpent + groupBonus

                                        return (
                                            <div
                                                key={voiceId}
                                                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{voice.icon}</span>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{voice.nameRu}</div>
                                                        <div className="text-xs text-slate-500">{voice.alias}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Bonus Display */}
                                                    {totalBonus > 0 && (
                                                        <span className="text-sm text-green-400 font-bold">
                                                            +{totalBonus}
                                                            {groupBonus > 0 && (
                                                                <span className="text-purple-400 text-xs ml-1">({groupBonus} от группы)</span>
                                                            )}
                                                        </span>
                                                    )}

                                                    {/* Spend Voice Point Button */}
                                                    {progression.availableVoicePoints > 0 && (
                                                        <button
                                                            onClick={() => handleSpendVoicePoint(voiceId)}
                                                            className="w-7 h-7 flex items-center justify-center text-xs bg-green-500/20 text-green-400 border border-green-500/50 rounded-full hover:bg-green-500/30 transition-colors"
                                                        >
                                                            +1
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Total Stats Footer */}
            <div className="bg-slate-800/50 px-4 py-3 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Всего опыта:</span>
                    <span className="text-cyan-400 font-bold">{progression.totalXP.toLocaleString()} XP</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Очков потрачено:</span>
                    <span className="text-slate-300">
                        {Object.values(progression.spentVoicePoints).reduce((a, b) => a + (b ?? 0), 0)} навыков,
                        {' '}{Object.values(progression.spentGroupPoints).reduce((a, b) => a + (b ?? 0), 0)} групп
                    </span>
                </div>
            </div>
        </div>
    )
}
