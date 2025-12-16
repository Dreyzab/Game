import React from 'react'
import { useParliament } from '../model/useParliament'
import { ATTRIBUTE_GROUPS, type AttributeGroup } from '@/shared/types/parliament'
import { cn } from '@/shared/lib/utils/cn'
import { MotionContainer } from '@/shared/ui/components/MotionContainer'
import { getVoiceDefinition } from '../lib/voiceDefinitions' // Use local enriched definitions

/**
 * Panel displaying the Internal Parliament (18 voices in 6 groups)
 * Uses the canonical voice system from parliament.ts
 */
export const ParliamentPanel: React.FC<{ className?: string }> = ({ className }) => {
    const { getVoicesByGroup, getVoiceLevel } = useParliament()

    return (
        <div className={cn('space-y-6', className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[color:var(--color-text)]">ВНУТРЕННИЙ ПАРЛАМЕНТ</h3>
                <span className="text-xs text-[color:var(--color-text-muted)]">18 ГОЛОСОВ</span>
            </div>

            {Object.entries(ATTRIBUTE_GROUPS).map(([groupId, group]) => (
                <MotionContainer key={groupId} className="space-y-3" delay={0.1}>
                    <div className="border-b border-[color:var(--color-border)] pb-1">
                        <h4 className="text-xs font-bold text-[color:var(--color-text-secondary)] uppercase tracking-widest">
                            {group.nameRu}
                        </h4>
                        <p className="text-[10px] text-[color:var(--color-text-muted)]">{group.description}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {getVoicesByGroup(groupId as AttributeGroup).map((voice) => {
                            const level = getVoiceLevel(voice.id)
                            const enrichedVoice = getVoiceDefinition(voice.id) // Get icon from lib
                            return (
                                <div
                                    key={voice.id}
                                    className="group flex items-center justify-between p-2 rounded-md bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-hover)] transition-colors border border-transparent hover:border-[color:var(--color-border)]"
                                    title={voice.description}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                            {enrichedVoice?.icon ? (
                                                <img src={enrichedVoice.icon} alt={voice.nameRu} className="w-6 h-6 rounded-full object-cover" />
                                            ) : voice.icon}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[color:var(--color-text)] group-hover:text-[color:var(--color-primary)] transition-colors">
                                                {voice.nameRu}
                                            </span>
                                            <span className="text-[10px] text-[color:var(--color-text-muted)] uppercase tracking-wide">
                                                {voice.alias}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center w-8 h-8 rounded bg-[color:var(--color-background)] border border-[color:var(--color-border)]">
                                        <span className="text-sm font-bold text-[color:var(--color-primary)]">{level}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </MotionContainer>
            ))}
        </div>
    )
}
