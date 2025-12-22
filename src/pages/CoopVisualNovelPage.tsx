import React from 'react';
import { useCoopStore } from '@/features/coop';
import { useMyPlayer } from '@/shared/hooks/useMyPlayer';
import type { CoopRoleId } from '@/shared/types/coop';
import { Heading } from '@/shared/ui/components/Heading';
import { Text } from '@/shared/ui/components/Text';
import { Badge } from '@/shared/ui/components/Badge';
import { cn } from '@/shared/lib/utils/cn';

export const CoopVisualNovelPage: React.FC = () => {
    const { room, castVote } = useCoopStore();
    const myPlayerQuery = useMyPlayer();

    if (!room || !room.questNode) {
        return <div className="p-10 text-center">Loading Scenario...</div>;
    }

    const { questNode, participants, votes, sceneId } = room;

    const myId = (myPlayerQuery.data as any)?.player?.id as number | undefined;
    const myParticipant = myId ? participants.find((p) => p.id === myId) : undefined;
    const myRole = (myParticipant?.role ?? undefined) as CoopRoleId | undefined;

    const myVote = myId ? votes.find((v: any) => v.voterId === myId && v.sceneId === sceneId) : undefined;
    const myChoiceId = myVote?.choiceId as string | undefined;

    const isVoteNode = questNode.interactionType === 'vote';
    const voteCounts: Record<string, number> = {};
    if (isVoteNode) {
        votes.forEach((v: any) => {
            voteCounts[v.choiceId] = (voteCounts[v.choiceId] || 0) + 1;
        });
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col">
            {/* Header: Status & Participants */}
            <div className="border-b border-gray-800 bg-gray-900/50 p-4 flex items-center justify-between">
                <div>
                    <Heading level={4} className="text-cyan-400">{questNode.title}</Heading>
                    <Text size="xs" variant="muted">
                        {sceneId}
                        {myRole ? ` · ${myRole.toUpperCase()}` : ''}
                    </Text>
                </div>
                <div className="flex gap-2">
                    {participants.map((p) => {
                        const hasActed = votes.some((v: any) => v.voterId === p.id && v.sceneId === sceneId);
                        return (
                            <div
                                key={p.id}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1 rounded bg-gray-800 border border-gray-700",
                                    hasActed && "border-green-500/50 bg-green-900/20"
                                )}
                            >
                                <span className="font-bold text-xs">{p.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase">{p.role}</span>
                                {hasActed && <span className="text-green-500 text-[10px]">✓</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content: Narrative */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full space-y-8">
                {/* Description - Render markdown later, for now raw text/lines */}
                <div className="prose prose-invert prose-lg max-w-none">
                    {questNode.description.split('\n').map((line, i) => (
                        <p key={i} className="leading-relaxed text-gray-300">
                            {line.split('**').map((part, j) =>
                                j % 2 === 1 ? (
                                    <strong key={j} className="text-white font-bold">{part}</strong>
                                ) : (
                                    part
                                )
                            )}
                        </p>
                    ))}
                </div>

                {/* Role-private text */}
                {myRole && questNode.privateText?.[myRole] && (
                    <div className="border-l-2 border-cyan-500 pl-4 py-2 bg-cyan-950/30 rounded-r">
                        <div className="text-xs text-cyan-400 font-bold uppercase mb-1">Insight: {myRole}</div>
                        <p className="text-sm text-cyan-100 italic">{questNode.privateText[myRole]}</p>
                    </div>
                )}
            </div>

            {/* Choices Area */}
            <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur p-6 md:p-8">
                <div className="max-w-4xl mx-auto grid gap-4 md:grid-cols-2">
                    {questNode.choices.map((choice) => {
                        const isLocked = Boolean(choice.requiredRole && choice.requiredRole !== myRole);
                        const isSelected = myChoiceId === choice.id;
                        const isChoiceDisabled =
                            isLocked || (questNode.interactionType !== 'vote' && Boolean(myChoiceId));

                        const count = voteCounts[choice.id] || 0;
                        const total = participants.length;
                        const percent = total > 0 ? (count / total) * 100 : 0;

                        const shouldShowEffect = !isVoteNode && isSelected && Boolean(choice.effectText);

                        return (
                            <button
                                key={choice.id}
                                onClick={() => castVote(choice.id)}
                                disabled={isChoiceDisabled}
                                className={cn(
                                    "group relative text-left p-4 rounded-lg bg-gray-800 border transition-all active:scale-[0.99]",
                                    "border-gray-700",
                                    !isChoiceDisabled && "hover:border-cyan-500 hover:bg-gray-800",
                                    isChoiceDisabled && "opacity-60 cursor-not-allowed",
                                    isSelected && "border-cyan-500/80"
                                )}
                            >
                                {isVoteNode && (
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-cyan-900/20 transition-all duration-300 rounded-lg"
                                        style={{ width: `${percent}%` }}
                                    />
                                )}

                                <div className="relative z-10 space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="font-semibold text-gray-200 group-hover:text-white">
                                            {choice.text}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {choice.requiredRole && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] uppercase tracking-wider opacity-70"
                                                >
                                                    {choice.requiredRole} only
                                                </Badge>
                                            )}
                                            {isSelected && <span className="text-cyan-300 text-xs font-bold">✓</span>}
                                        </div>
                                    </div>

                                    {shouldShowEffect && (
                                        <p className="text-xs text-gray-400 italic">
                                            "{choice.effectText}"
                                        </p>
                                    )}

                                    {isVoteNode && (
                                        <div className="text-xs text-cyan-400 font-mono mt-2">
                                            {count} votes ({Math.round(percent)}%)
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
