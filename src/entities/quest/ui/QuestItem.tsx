import React from 'react'
import type { Quest } from '@/shared/types/quest'
import { Scroll, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'

interface QuestItemProps {
    quest: Quest
    onClick?: (quest: Quest) => void
}

export const QuestItem: React.FC<QuestItemProps> = ({ quest, onClick }) => {
    const isCompleted = quest.status === 'completed'
    const isFailed = quest.status === 'failed'
    const isAbandoned = quest.status === 'abandoned'
    const isActive = quest.status === 'active'
    const isNegative = isFailed || isAbandoned

    return (
        <div
            onClick={() => onClick?.(quest)}
            className={cn(
                "relative p-4 rounded-lg border transition-all duration-200 cursor-pointer group",
                "bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/50",
                isActive && "border-blue-500/30 hover:border-blue-500/50",
                isCompleted && "border-green-500/30 hover:border-green-500/50 opacity-80",
                isNegative && "border-red-500/30 hover:border-red-500/50 opacity-60"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "p-2 rounded-full shrink-0",
                    isActive && "bg-blue-500/10 text-blue-400",
                    isCompleted && "bg-green-500/10 text-green-400",
                    isNegative && "bg-red-500/10 text-red-400"
                )}>
                    {isActive && <Scroll className="w-5 h-5" />}
                    {isCompleted && <CheckCircle className="w-5 h-5" />}
                    {isNegative && <XCircle className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className={cn(
                            "font-medium truncate pr-2",
                            isCompleted && "text-green-100 line-through decoration-green-500/30",
                            isNegative && "text-red-100 line-through decoration-red-500/30",
                            isActive && "text-blue-100"
                        )}>
                            {quest.title}
                        </h3>
                        {quest.createdAt && (
                            <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3" />
                                {new Date(quest.createdAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {quest.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                            {quest.description}
                        </p>
                    )}

                    {isActive && typeof quest.progress === 'number' && typeof quest.maxProgress === 'number' && (
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Прогресс</span>
                                <span>{Math.round((quest.progress / quest.maxProgress) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, (quest.progress / quest.maxProgress) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
