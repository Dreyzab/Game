import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scroll, Clock, Trophy, AlertTriangle } from 'lucide-react'
import type { Quest } from '@/shared/types/quest'
import { cn } from '@/shared/lib/utils/cn'

interface QuestDetailsModalProps {
    quest: Quest | null
    onClose: () => void
    onTrack?: (questId: string) => void
    isTracked?: boolean
}

export const QuestDetailsModal: React.FC<QuestDetailsModalProps> = ({
    quest,
    onClose,
    onTrack,
    isTracked
}) => {
    if (!quest) return null

    const isCompleted = quest.status === 'completed'
    const isAbandoned = quest.status === 'abandoned'
    const isActive = quest.status === 'active'

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
                <motion.div
                    className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                >
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>

                    <div className="flex items-start gap-4 mb-6">
                        <div className={cn(
                            "p-3 rounded-xl",
                            isActive && "bg-blue-500/20 text-blue-400",
                            isCompleted && "bg-green-500/20 text-green-400",
                            isAbandoned && "bg-red-500/20 text-red-400"
                        )}>
                            {isActive && <Scroll className="w-8 h-8" />}
                            {isCompleted && <Trophy className="w-8 h-8" />}
                            {isAbandoned && <AlertTriangle className="w-8 h-8" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">{quest.title}</h2>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                {quest.createdAt && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(quest.createdAt).toLocaleDateString()}
                                    </span>
                                )}
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs uppercase tracking-wider font-medium",
                                    isActive && "bg-blue-500/10 text-blue-400",
                                    isCompleted && "bg-green-500/10 text-green-400",
                                    isAbandoned && "bg-red-500/10 text-red-400"
                                )}>
                                    {isActive ? 'Активно' : isCompleted ? 'Завершено' : 'Отменено'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-2">Описание</h3>
                            <p className="text-gray-400 leading-relaxed">
                                {quest.description || 'Описание отсутствует.'}
                            </p>
                        </div>

                        {isActive && typeof quest.progress === 'number' && typeof quest.maxProgress === 'number' && (
                            <div>
                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                    <span>Прогресс выполнения</span>
                                    <span>{Math.round((quest.progress / quest.maxProgress) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, (quest.progress / quest.maxProgress) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {isActive && onTrack && (
                            <div className="pt-4 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={() => onTrack(quest.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isTracked
                                            ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                            : "bg-white/10 text-white hover:bg-white/20"
                                    )}
                                >
                                    {isTracked ? 'Отслеживается' : 'Отслеживать'}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
