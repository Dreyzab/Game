/**
 * UI компонент для кооперативных проверок навыков
 */
import React, { useMemo, useState } from 'react'
import { cn } from '@/shared/lib/utils/cn'
import { PARLIAMENT_VOICES, type VoiceId } from '@/shared/types/parliament'
import {
    type CheckParticipant,
    type SkillCheckResult,
    type DifficultyLevel,
    DIFFICULTY_DC,
    DIFFICULTY_NAMES_RU,
    DIFFICULTY_COLORS,
    calculateSuccessChance,
    performSkillCheck,
    COOP_CHECK_CONFIG,
} from '@/shared/lib/skillChecks'

interface CoopSkillCheckProps {
    /** Название проверки */
    checkName: string
    /** Описание проверки */
    description?: string
    /** Проверяемый голос */
    voiceId: VoiceId
    /** Сложность */
    difficulty: DifficultyLevel | number
    /** Все доступные участники */
    participants: CheckParticipant[]
    /** ID текущего игрока (лидер по умолчанию) */
    currentPlayerId: string
    /** Callback при выполнении проверки */
    onComplete: (result: SkillCheckResult, participants: { leader: CheckParticipant; helpers: CheckParticipant[] }) => void
    /** Callback при отмене */
    onCancel?: () => void
    className?: string
}

export const CoopSkillCheck: React.FC<CoopSkillCheckProps> = ({
    checkName,
    description,
    voiceId,
    difficulty,
    participants,
    currentPlayerId,
    onComplete,
    onCancel,
    className,
}) => {
    const voice = PARLIAMENT_VOICES[voiceId]
    const baseDC = typeof difficulty === 'number' ? difficulty : DIFFICULTY_DC[difficulty]
    const difficultyLevel = typeof difficulty === 'string' ? difficulty : getDifficultyFromDC(baseDC)

    // Состояние выбора
    const [selectedLeaderId, setSelectedLeaderId] = useState(currentPlayerId)
    const [selectedHelperIds, setSelectedHelperIds] = useState<string[]>([])
    const [isRolling, setIsRolling] = useState(false)
    const [result, setResult] = useState<SkillCheckResult | null>(null)

    // Получить участников
    const leader = participants.find(p => p.id === selectedLeaderId)!
    const helpers = participants.filter(p => selectedHelperIds.includes(p.id))
    const availableHelpers = participants.filter(p => p.id !== selectedLeaderId)

    // Расчёт шанса успеха
    const successChance = useMemo(() => {
        if (!leader) return 0
        return calculateSuccessChance(leader, helpers, voiceId, baseDC)
    }, [leader, helpers, voiceId, baseDC])

    // Переключение помощника
    const toggleHelper = (helperId: string) => {
        setSelectedHelperIds(prev => {
            if (prev.includes(helperId)) {
                return prev.filter(id => id !== helperId)
            }
            if (prev.length >= COOP_CHECK_CONFIG.MAX_HELPERS) {
                return prev
            }
            return [...prev, helperId]
        })
    }

    // Выполнить проверку
    const executeCheck = async () => {
        setIsRolling(true)

        // Анимация броска
        await new Promise(resolve => setTimeout(resolve, 1500))

        const checkResult = performSkillCheck(leader, helpers, voiceId, baseDC)
        setResult(checkResult)
        setIsRolling(false)

        onComplete(checkResult, { leader, helpers })
    }

    // Если есть результат - показать его
    if (result) {
        return (
            <div className={cn('bg-slate-900 rounded-xl border border-slate-700 p-6', className)}>
                <ResultDisplay
                    result={result}
                    voiceId={voiceId}
                    helpers={helpers}
                />
            </div>
        )
    }

    return (
        <div className={cn('bg-slate-900 rounded-xl border border-slate-700 overflow-hidden', className)}>
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{voice.icon}</span>
                        <div>
                            <h3 className="text-lg font-bold text-white">{checkName}</h3>
                            <div className="text-sm text-slate-400">
                                Проверка: <span className="text-cyan-400">{voice.nameRu}</span>
                            </div>
                        </div>
                    </div>
                    <div className={cn('text-right', DIFFICULTY_COLORS[difficultyLevel])}>
                        <div className="text-sm font-bold">{DIFFICULTY_NAMES_RU[difficultyLevel]}</div>
                        <div className="text-xs opacity-70">DC {baseDC}</div>
                    </div>
                </div>
                {description && (
                    <p className="mt-2 text-sm text-slate-400">{description}</p>
                )}
            </div>

            {/* Leader Selection */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    👤 Лидер проверки
                </div>
                <div className="flex gap-2 flex-wrap">
                    {participants.map(p => {
                        const skill = getVoiceLevel(p, voiceId)
                        const isSelected = p.id === selectedLeaderId
                        return (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setSelectedLeaderId(p.id)
                                    setSelectedHelperIds(prev => prev.filter(id => id !== p.id))
                                }}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                                    isSelected
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                )}
                            >
                                <span className="font-medium">{p.name}</span>
                                <span className={cn(
                                    'text-xs px-1.5 py-0.5 rounded',
                                    isSelected ? 'bg-cyan-500/30' : 'bg-slate-700'
                                )}>
                                    {skill}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Helper Selection */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        🤝 Помощники ({selectedHelperIds.length}/{COOP_CHECK_CONFIG.MAX_HELPERS})
                    </div>
                    <div className="text-xs text-slate-500">
                        Каждый снижает сложность
                    </div>
                </div>

                {availableHelpers.length === 0 ? (
                    <div className="text-sm text-slate-500 italic">Нет доступных помощников</div>
                ) : (
                    <div className="flex gap-2 flex-wrap">
                        {availableHelpers.map(p => {
                            const skill = getVoiceLevel(p, voiceId)
                            const isSelected = selectedHelperIds.includes(p.id)
                            const isHindrance = skill < COOP_CHECK_CONFIG.HINDRANCE_THRESHOLD
                            const isWeak = skill < COOP_CHECK_CONFIG.MIN_SKILL_TO_HELP
                            const bonus = Math.floor(skill * COOP_CHECK_CONFIG.ASSIST_PERCENTAGE)

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => toggleHelper(p.id)}
                                    disabled={!isSelected && selectedHelperIds.length >= COOP_CHECK_CONFIG.MAX_HELPERS}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                                        isSelected
                                            ? isHindrance
                                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                                : 'bg-green-500/20 border-green-500 text-green-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 disabled:opacity-50'
                                    )}
                                >
                                    <span className="font-medium">{p.name}</span>
                                    <span className={cn(
                                        'text-xs px-1.5 py-0.5 rounded',
                                        isHindrance ? 'bg-red-500/30' : isWeak ? 'bg-yellow-500/30' : 'bg-slate-700'
                                    )}>
                                        {skill}
                                    </span>
                                    {isSelected && (
                                        <span className={cn(
                                            'text-xs',
                                            isHindrance ? 'text-red-400' : 'text-green-400'
                                        )}>
                                            {isHindrance ? `+${COOP_CHECK_CONFIG.HINDRANCE_PENALTY} DC` : `-${bonus} DC`}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-sm text-slate-400">Шанс успеха</div>
                        <div className={cn(
                            'text-3xl font-bold',
                            successChance >= 70 ? 'text-green-400' :
                                successChance >= 40 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                            {successChance}%
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-400">Эффективная сложность</div>
                        <div className="text-xl font-bold text-white">
                            DC {baseDC - helpers.reduce((acc, h) => {
                                const skill = getVoiceLevel(h, voiceId)
                                if (skill < COOP_CHECK_CONFIG.HINDRANCE_THRESHOLD) return acc - COOP_CHECK_CONFIG.HINDRANCE_PENALTY
                                if (skill < COOP_CHECK_CONFIG.MIN_SKILL_TO_HELP) return acc
                                return acc + Math.floor(skill * COOP_CHECK_CONFIG.ASSIST_PERCENTAGE)
                            }, 0)}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={executeCheck}
                        disabled={isRolling}
                        className={cn(
                            'flex-1 py-3 px-4 rounded-lg font-bold transition-all',
                            isRolling
                                ? 'bg-slate-700 text-slate-400 cursor-wait'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500'
                        )}
                    >
                        {isRolling ? '🎲 Бросаем...' : helpers.length > 0 ? '🤝 Выполнить вместе' : '🎲 Выполнить'}
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-3 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                        >
                            Отмена
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ================== Вспомогательные компоненты ==================

function getVoiceLevel(participant: CheckParticipant, voiceId: VoiceId): number {
    const base = 30 // Примерное базовое значение
    const modifier = participant.voiceLevels[voiceId] ?? 0
    return base + modifier
}

function getDifficultyFromDC(dc: number): DifficultyLevel {
    if (dc <= 15) return 'trivial'
    if (dc <= 30) return 'easy'
    if (dc <= 50) return 'medium'
    if (dc <= 70) return 'hard'
    if (dc <= 85) return 'very_hard'
    return 'legendary'
}

interface ResultDisplayProps {
    result: SkillCheckResult
    voiceId: VoiceId
    helpers: CheckParticipant[]
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, voiceId, helpers }) => {
    const voice = PARLIAMENT_VOICES[voiceId]

    return (
        <div className="text-center space-y-4">
            {/* Roll Animation */}
            <div className={cn(
                'inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold',
                result.success
                    ? result.isCritical
                        ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white animate-pulse'
                        : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                    : result.isCritical
                        ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white animate-pulse'
                        : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
            )}>
                {result.roll}
            </div>

            {/* Result Text */}
            <div>
                <div className={cn(
                    'text-2xl font-bold',
                    result.success ? 'text-green-400' : 'text-red-400'
                )}>
                    {result.isCritical && (result.success ? '⭐ КРИТИЧЕСКИЙ ' : '💀 КРИТИЧЕСКИЙ ')}
                    {result.success ? 'УСПЕХ!' : 'ПРОВАЛ'}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                    {voice.icon} {voice.nameRu}: {result.effectiveSkill} vs DC {result.effectiveDC}
                </div>
            </div>

            {/* XP Earned */}
            <div className="bg-slate-800/50 rounded-lg p-3 inline-block">
                <span className="text-cyan-400 font-bold">+{result.xpEarned} XP</span>
                {helpers.length > 0 && (
                    <span className="text-slate-500 text-sm ml-2">
                        (лидер: {result.xpEarned}, помощники: {Math.floor(result.xpEarned * 0.5)})
                    </span>
                )}
            </div>

            {/* Details */}
            {result.assistBonus > 0 && (
                <div className="text-sm text-slate-400">
                    Помощь команды снизила DC на {result.assistBonus}
                </div>
            )}

            {result.details.synergy && (
                <div className="text-sm text-purple-400">
                    ✨ Синергия: {result.details.synergy.description}
                </div>
            )}
        </div>
    )
}
