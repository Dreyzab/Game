import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCoopStore } from '@/features/coop';
import { useMyPlayer } from '@/shared/hooks/useMyPlayer';
import type { CoopRoleId } from '@/shared/types/coop';
import { cn } from '@/shared/lib/utils/cn';
import { authenticatedClient } from '@/shared/api/client';
import { DialogueBox, ChoicePanel } from '@/entities/visual-novel/ui';
import type { VisualNovelChoiceView } from '@/shared/types/visualNovel';
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates';
import { COOP_STATUSES, ROLE_TAG_MULTS } from '@/shared/data/coopScoreConfig';
import { ScoreFeedback, ExpeditionFeedback } from '@/features/coop';

const EMPTY_LIST: any[] = [];
const FALLBACK_NODE: any = {
    id: '',
    title: '',
    description: '',
    background: '/images/backgrounds/default_dark.jpg',
    interactionType: 'sync',
    choices: [],
    privateText: {},
};

export const CoopVisualNovelPage: React.FC = () => {
    const { room, castVote, callReinforcements, buyCampItem, withdrawCampItem, fetchCampShop } = useCoopStore();
    const myPlayerQuery = useMyPlayer();

    const questNode = room?.questNode;
    const participants = room?.participants ?? EMPTY_LIST;
    const votes = room?.votes ?? EMPTY_LIST;
    const sceneId = room?.sceneId ?? '';
    const camp = room?.camp ?? null;
    const questScore = room?.questScore ?? null;
    const expedition = room?.expedition ?? null;

    const myId = (myPlayerQuery.data as any)?.player?.id as number | undefined;
    const myParticipant = myId ? participants.find((p) => p.id === myId) : undefined;
    const isHost = Boolean(myId && room?.hostId === myId);

    const botParticipants = useMemo(() => participants.filter((p) => (p?.name ?? '').startsWith('Bot-')), [participants]);
    const defaultControlledId = myId ?? participants[0]?.id ?? null;
    const [controlledPlayerId, setControlledPlayerId] = useState<number | null>(defaultControlledId);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [campShop, setCampShop] = useState<any | null>(null);
    const [shopSelectedTemplateId, setShopSelectedTemplateId] = useState<string>('');

    useEffect(() => {
        if (defaultControlledId === null) return;
        if (controlledPlayerId === null) {
            setControlledPlayerId(defaultControlledId);
            return;
        }
        if (!participants.some((p) => p.id === controlledPlayerId)) {
            setControlledPlayerId(defaultControlledId);
        }
    }, [controlledPlayerId, defaultControlledId, participants]);

    useEffect(() => {
        if (!isMenuOpen) return;
        if (!camp) {
            setCampShop(null);
            return;
        }

        fetchCampShop()
            .then((shop) => {
                setCampShop(shop);
                const first = shop?.stock?.[0]?.templateId as string | undefined;
                if (first && !shopSelectedTemplateId) setShopSelectedTemplateId(first);
            })
            .catch(() => { });
    }, [camp, fetchCampShop, isMenuOpen, shopSelectedTemplateId]);

    const controlledParticipant = useMemo(
        () => (controlledPlayerId ? participants.find((p) => p.id === controlledPlayerId) : undefined),
        [controlledPlayerId, participants]
    );

    const controlledRole = (controlledParticipant?.role ?? undefined) as CoopRoleId | undefined;

    const isCheckpointNode = (node: any) =>
        node?.interactionType === 'vote' ||
        node?.interactionType === 'contribute' ||
        (node?.interactionType === 'sync' && Array.isArray(node?.choices) && node.choices.length > 1);

    const [localNodeId, setLocalNodeId] = useState<string>(sceneId);
    const [localNode, setLocalNode] = useState<any>(questNode ?? FALLBACK_NODE);
    const nodeCache = useRef<Map<string, any>>(new Map([[sceneId, questNode]]));

    useEffect(() => {
        if (!sceneId) return;
        setLocalNodeId(sceneId);
        setLocalNode(questNode);
        nodeCache.current.set(sceneId, questNode);
    }, [sceneId, questNode]);

    const fetchNode = async (nodeId: string) => {
        const cached = nodeCache.current.get(nodeId);
        if (cached) return cached;
        const client = authenticatedClient() as any;
        const { data, error } = await client.coop.nodes[nodeId].get();
        if (error) throw error;
        const node = (data as any)?.node;
        if (node) nodeCache.current.set(nodeId, node);
        return node;
    };

    const markReached = async (nodeId: string) => {
        if (!room?.code) return;
        const client = authenticatedClient() as any;
        await client.coop.rooms[room.code].reach.post({ nodeId });
    };

    const advanceLocal = async (nextNodeId?: string) => {
        if (!nextNodeId) return;
        const nextNode = await fetchNode(nextNodeId);
        if (!nextNode) return;
        setLocalNodeId(nextNodeId);
        setLocalNode(nextNode);

        if (isCheckpointNode(nextNode)) {
            markReached(nextNodeId).catch(() => { });
        }
    };

    const isCheckpoint = isCheckpointNode(localNode);
    const isAtSharedCheckpoint = isCheckpoint && localNodeId === sceneId;

    const myVote = controlledPlayerId && isAtSharedCheckpoint
        ? votes.find((v: any) => v.voterId === controlledPlayerId && v.sceneId === sceneId)
        : undefined;

    const [localSelections, setLocalSelections] = useState<Record<string, string>>({});

    const selectedChoiceId = isAtSharedCheckpoint
        ? (myVote?.choiceId as string | undefined)
        : localSelections[localNodeId];

    const isGroupVoteNode =
        (localNode.interactionType === 'vote' || localNode.interactionType === 'contribute') && isAtSharedCheckpoint;
    const voteCounts = useMemo<Record<string, number>>(() => {
        if (!isGroupVoteNode) return {};
        const counts: Record<string, number> = {};
        votes
            .filter((v: any) => v.sceneId === sceneId)
            .forEach((v: any) => {
                counts[v.choiceId] = (counts[v.choiceId] || 0) + 1;
            });
        return counts;
    }, [isGroupVoteNode, votes, sceneId]);

    const rawChoices = localNode.choices.filter((choice: any) => !choice.requiredRole || choice.requiredRole === controlledRole);
    const sortedVotes = [...votes].sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    const backgroundUrl = localNode.background ?? '/images/backgrounds/default_dark.jpg';

    // Dynamic background pan based on image aspect ratio (portrait mode only)
    const [bgPanClass, setBgPanClass] = useState<string>('vn-bg-pan');

    useEffect(() => {
        if (!backgroundUrl) {
            setBgPanClass('vn-bg-pan');
            return;
        }

        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;
            // Determine pan class based on aspect ratio
            if (ratio < 1.5) {
                setBgPanClass('vn-bg-pan-narrow');
            } else if (ratio < 2.0) {
                setBgPanClass('vn-bg-pan-normal');
            } else if (ratio < 2.5) {
                setBgPanClass('vn-bg-pan-wide');
            } else {
                setBgPanClass('vn-bg-pan-ultrawide');
            }
        };
        img.onerror = () => {
            setBgPanClass('vn-bg-pan');
        };
        img.src = backgroundUrl;
    }, [backgroundUrl]);

    const narrativeChunks = useMemo(() => {
        const chunks: string[] = [];
        const base = String(localNode.description ?? '').trim();
        if (base) {
            base
                .split(/\n\s*\n+/g)
                .map((p) => p.trim())
                .filter(Boolean)
                .forEach((p) => chunks.push(p));
        }

        const insight = controlledRole ? (localNode.privateText?.[controlledRole] as string | undefined) : undefined;
        if (insight && String(insight).trim().length > 0) {
            chunks.push(`[${String(controlledRole).toUpperCase()} INSIGHT]\n${String(insight).trim()}`);
        }

        return chunks.length > 0 ? chunks : ['...'];
    }, [controlledRole, localNode.description, localNode.privateText]);

    const [chunkIndex, setChunkIndex] = useState(0);
    const [isNarrationDone, setNarrationDone] = useState(false);

    useEffect(() => {
        setChunkIndex(0);
        setNarrationDone(false);
    }, [localNodeId]);

    // Show choices at key moments:
    // - Shared checkpoints (vote/sync branching) when everyone reached the node
    // - Individual nodes (personal decisions) after narration
    const shouldShowChoices =
        isNarrationDone && ((isCheckpoint && isAtSharedCheckpoint) || localNode.interactionType === 'individual');

    // Transform raw choices to VisualNovelChoiceView format for ChoicePanel
    const visibleChoices: VisualNovelChoiceView[] = useMemo(() => {
        if (!shouldShowChoices) return [];

        const inv = (camp as any)?.inventory ?? {};
        const modifiers = questScore?.modifiers ?? {};
        const playerModifiers =
            controlledPlayerId !== null && controlledPlayerId !== undefined
                ? (questScore?.playerModifiers?.[String(controlledPlayerId)] ?? {})
                : {};
        const globalStatuses = questScore?.statuses ?? {};
        const playerStatuses =
            controlledPlayerId !== null && controlledPlayerId !== undefined
                ? (questScore?.playerStatuses?.[String(controlledPlayerId)] ?? {})
                : {};

        const computeClassMult = (choice: any, role?: CoopRoleId) => {
            if (!role) return 1.0;
            const override = choice?.classMultipliers?.[role];
            if (typeof override === 'number' && Number.isFinite(override)) return override;

            let tagMax: number | null = null;
            const tags = Array.isArray(choice?.scoreTags) ? choice.scoreTags : [];
            const roleTable = (ROLE_TAG_MULTS as any)?.[role] as Record<string, number> | undefined;
            if (roleTable) {
                for (const tag of tags) {
                    const mult = roleTable?.[tag];
                    if (typeof mult === 'number' && Number.isFinite(mult)) {
                        tagMax = tagMax === null ? mult : Math.max(tagMax, mult);
                    }
                }
            }

            const resolved = tagMax ?? 1.0;
            if (choice?.requiredRole && choice.requiredRole === role) return Math.max(1.5, resolved);
            return resolved;
        };

        const computeBuffMult = (mods: Record<string, number>, tags: string[] | undefined) => {
            const tagSet = new Set((tags ?? []).filter((t) => typeof t === 'string' && t.length > 0));
            let mult = 1.0;
            for (const [id, raw] of Object.entries(mods)) {
                const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0;
                if (id.startsWith('tag:')) {
                    const tag = id.slice('tag:'.length);
                    if (!tagSet.has(tag)) continue;
                }
                mult *= value;
            }
            return mult;
        };

        const mergeStatusTurns = (base: Record<string, number>, extra: Record<string, number>) => {
            const out: Record<string, number> = { ...(base ?? {}) };
            for (const [statusId, rawTurns] of Object.entries(extra ?? {})) {
                const turns = Math.max(0, Math.floor(Number(rawTurns)));
                if (!statusId || !Number.isFinite(turns) || turns <= 0) continue;
                out[statusId] = Math.max(out[statusId] ?? 0, turns);
            }
            return out;
        };

        const mergedStatuses = mergeStatusTurns(globalStatuses, playerStatuses);

        const computeStatusMult = (statusTurns: Record<string, number>, tags: string[] | undefined) => {
            const tagSet = new Set((tags ?? []).filter((t) => typeof t === 'string' && t.length > 0));
            let mult = 1.0;

            for (const [statusId, rawTurns] of Object.entries(statusTurns)) {
                const turns = Math.max(0, Math.floor(Number(rawTurns)));
                if (!statusId || !Number.isFinite(turns) || turns <= 0) continue;

                const def = (COOP_STATUSES as any)?.[statusId] as { mods?: Record<string, number> } | undefined;
                const mods = def?.mods;
                if (!mods) continue;

                for (const [id, raw] of Object.entries(mods)) {
                    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0;
                    if (id.startsWith('tag:')) {
                        const tag = id.slice('tag:'.length);
                        if (!tagSet.has(tag)) continue;
                    }
                    mult *= value;
                }
            }

            return mult;
        };

        const getItemName = (templateId: string) => ITEM_TEMPLATES[templateId]?.name ?? templateId;

        return rawChoices.map((choice: any) => {
            const count = voteCounts[choice.id] || 0;
            const total = participants.length;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

            const baseLabel = isGroupVoteNode ? `${choice.text} (${count} votes · ${percent}%)` : choice.text;
            const isAlreadyPicked = selectedChoiceId !== undefined && selectedChoiceId !== choice.id;

            let disabled = isAlreadyPicked;
            let lockReason: string | undefined;

            if (choice.requiredItem) {
                const have = Number(inv?.[choice.requiredItem] ?? 0);
                if (have < 1) {
                    disabled = true;
                    lockReason = `Requires ${getItemName(choice.requiredItem)}`;
                }
            }

            if (choice.consumableCost) {
                const templateId = String(choice.consumableCost.templateId ?? '');
                const amount = Math.max(1, Math.floor(Number(choice.consumableCost.amount ?? 1)));
                const have = Number(inv?.[templateId] ?? 0);
                if (have < amount) {
                    disabled = true;
                    lockReason = `Needs ${amount}× ${getItemName(templateId)}`;
                }
            }

            const baseScore = typeof choice.baseScore === 'number' && Number.isFinite(choice.baseScore) ? choice.baseScore : 0;
            const classMult = computeClassMult(choice, controlledRole);
            const buffMult = computeBuffMult(modifiers, choice.scoreTags) * computeBuffMult(playerModifiers, choice.scoreTags);
            const statusMult = computeStatusMult(mergedStatuses, choice.scoreTags);

            let itemBonus = 0;
            if (choice.consumableCost && typeof choice.itemBonus === 'number' && Number.isFinite(choice.itemBonus)) {
                const templateId = String(choice.consumableCost.templateId ?? '');
                const amount = Math.max(1, Math.floor(Number(choice.consumableCost.amount ?? 1)));
                const have = Number(inv?.[templateId] ?? 0);
                if (have >= amount) itemBonus = choice.itemBonus;
            }

            const estimated = (baseScore || itemBonus)
                ? Math.round(baseScore * classMult * buffMult * statusMult + itemBonus)
                : 0;

            const appliedGlobalMods = Object.entries(modifiers)
                .filter(([id]) => {
                    if (!id.startsWith('tag:')) return true;
                    const tag = id.slice('tag:'.length);
                    return Array.isArray(choice.scoreTags) && choice.scoreTags.includes(tag);
                })
                .map(([id, val]) => `${id} x${val}`);

            const appliedSelfMods = Object.entries(playerModifiers)
                .filter(([id]) => {
                    if (!id.startsWith('tag:')) return true;
                    const tag = id.slice('tag:'.length);
                    return Array.isArray(choice.scoreTags) && choice.scoreTags.includes(tag);
                })
                .map(([id, val]) => `self:${id} x${val}`);

            const appliedMods = [...appliedGlobalMods, ...appliedSelfMods];

            const appliedStatuses = Object.entries(mergedStatuses)
                .filter(([statusId, rawTurns]) => {
                    const turns = Math.max(0, Math.floor(Number(rawTurns)));
                    if (!statusId || !Number.isFinite(turns) || turns <= 0) return false;
                    const def = (COOP_STATUSES as any)?.[statusId] as { mods?: Record<string, number> } | undefined;
                    const mods = def?.mods;
                    if (!mods) return true;
                    for (const modId of Object.keys(mods)) {
                        if (!modId.startsWith('tag:')) return true;
                        const tag = modId.slice('tag:'.length);
                        if (Array.isArray(choice.scoreTags) && choice.scoreTags.includes(tag)) return true;
                    }
                    return false;
                })
                .map(([statusId, turns]) => `${statusId}(${Math.max(0, Math.floor(Number(turns)))})`);

            const tooltipLines: string[] = [];
            if (baseScore || itemBonus) {
                tooltipLines.push(`Base: ${baseScore}`);
                tooltipLines.push(`Role (${controlledRole ?? 'unknown'}): x${classMult}`);
                if (appliedMods.length > 0) tooltipLines.push(`Modifiers: ${appliedMods.join(', ')}`);
                if (appliedStatuses.length > 0) tooltipLines.push(`Statuses: ${appliedStatuses.join(', ')} (x${statusMult})`);
                if (choice.consumableCost && typeof choice.itemBonus === 'number') {
                    const templateId = String(choice.consumableCost.templateId ?? '');
                    const amount = Math.max(1, Math.floor(Number(choice.consumableCost.amount ?? 1)));
                    tooltipLines.push(`Item: +${choice.itemBonus} (consume ${getItemName(templateId)} x${amount})`);
                }
                tooltipLines.push(`Total Estimate: ~${estimated} pts`);
            }

            const description =
                (baseScore || itemBonus)
                    ? (choice.consumableCost && typeof choice.itemBonus === 'number'
                        ? `~${estimated} pts · +${choice.itemBonus} if you consume ${getItemName(String(choice.consumableCost.templateId ?? ''))}`
                        : `~${estimated} pts`)
                    : undefined;

            return {
                id: choice.id,
                label: baseLabel,
                description,
                disabled,
                lockReason,
                tooltip: tooltipLines.length > 0 ? tooltipLines.join('\n') : undefined,
                isVisited: selectedChoiceId === choice.id,
            };
        });
    }, [camp, controlledPlayerId, controlledRole, isGroupVoteNode, participants.length, questScore, rawChoices, selectedChoiceId, shouldShowChoices, voteCounts]);

    const handleChoiceSelect = async (choiceId: string) => {
        const choice = rawChoices.find((c: any) => c.id === choiceId);
        if (!choice) return;

        setLocalSelections((prev) => ({ ...prev, [localNodeId]: choiceId }));

        if (isCheckpointNode(localNode)) {
            if (!isAtSharedCheckpoint) {
                markReached(localNodeId).catch(() => { });
                return;
            }
            await castVote(choiceId, controlledPlayerId ?? undefined);
            return;
        }

        if (localNode.interactionType === 'individual') {
            await castVote(choiceId, controlledPlayerId ?? undefined, localNodeId);
            await advanceLocal(choice.nextNodeId);
            return;
        }

        await advanceLocal(choice.nextNodeId);
    };

    // If not at checkpoint, just show a simple "continue" to advance through narrative
    const handleAdvance = async () => {
        if (chunkIndex < narrativeChunks.length - 1) {
            setChunkIndex((v) => v + 1);
            return;
        }

        setNarrationDone(true);

        // If not a checkpoint node, auto-advance to next
        if (!isCheckpoint && rawChoices.length === 1) {
            const singleChoice = rawChoices[0];
            if (singleChoice?.nextNodeId) {
                await advanceLocal(singleChoice.nextNodeId);
            }
        }
    };

    const isScenarioReady = Boolean(room && questNode);
    if (!isScenarioReady) {
        return (
            <div className="vn-chronicles relative w-screen h-screen overflow-hidden bg-[#020617] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="text-2xl font-cinzel tracking-wider mb-2">Loading...</div>
                    <div className="text-sm text-slate-400">Preparing scenario</div>
                </div>
            </div>
        );
    }

    return (
        <div className="vn-chronicles relative w-screen h-screen overflow-hidden bg-[#020617]">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className={`absolute inset-[-8%] bg-cover ${bgPanClass}`}
                    style={{ backgroundImage: `url(${backgroundUrl})`, backgroundPosition: 'center center' }}
                />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Side quest score (top-center) */}
            {questScore && Number(questScore.target ?? 0) > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                    <ScoreFeedback
                        questId={String(questScore.questId ?? '')}
                        current={Number(questScore.current ?? 0)}
                        target={Number(questScore.target ?? 0)}
                    />
                </div>
            )}

            {/* Participants HUD (top-right) */}
            <div className="absolute top-0 right-0 z-30 p-4">
                <div className="flex flex-col items-end gap-2">
                    {expedition && Number(expedition.maxTurns ?? 0) > 0 && (
                        <ExpeditionFeedback
                            turnCount={Number(expedition.turnCount ?? 0)}
                            maxTurns={Number(expedition.maxTurns ?? 0)}
                            researchPoints={Number(expedition.researchPoints ?? 0)}
                            lastEventSummary={expedition.lastEvent?.summary}
                        />
                    )}
                    {participants.map((p) => {
                        const hasActed = votes.some((v: any) => v.voterId === p.id && v.sceneId === sceneId);
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md border transition-all",
                                    hasActed
                                        ? "bg-emerald-500/20 border-emerald-400/50"
                                        : "bg-black/40 border-white/10"
                                )}
                            >
                                <span className="font-bold text-xs text-white">{p.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{p.role}</span>
                                {hasActed && <span className="text-emerald-400 text-xs">✓</span>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Role badge (top-left) */}
            {controlledRole && (
                <div className="absolute top-4 left-4 z-30">
                    <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Playing as</span>
                        <div className="text-sm font-bold text-cyan-400 uppercase tracking-wider">{controlledRole}</div>
                    </div>
                </div>
            )}

            {/* Host bot control (top-left, below role) */}
            {isHost && botParticipants.length > 0 && (
                <div className="absolute top-20 left-4 z-30">
                    <div className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">Control</span>
                        <select
                            className="bg-black/60 border border-white/20 rounded px-2 py-1 text-xs text-white w-full"
                            value={controlledPlayerId ?? ''}
                            onChange={(e) => {
                                const next = Number(e.target.value);
                                setControlledPlayerId(Number.isFinite(next) ? next : null);
                            }}
                        >
                            {myParticipant && <option value={myParticipant.id}>Me: {myParticipant.name}</option>}
                            {botParticipants.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.role?.toUpperCase() ?? 'BOT'}: {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Waiting for checkpoint sync message */}
            {isCheckpoint && !isAtSharedCheckpoint && isNarrationDone && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-6 py-3 rounded-xl bg-black/60 border border-yellow-500/30 backdrop-blur-md text-center max-w-md"
                    >
                        <div className="text-yellow-400 text-sm font-medium">Ожидаем остальных игроков...</div>
                        <div className="text-xs text-slate-400 mt-1">
                            Вы дошли до важного выбора. Голосование откроется, когда большинство игроков достигнет этого момента.
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Votes display (when voting) */}
            {isGroupVoteNode && sortedVotes.length > 0 && (
                <div className="absolute bottom-32 right-4 z-40 max-w-xs">
                    <div className="rounded-xl bg-black/60 border border-white/10 backdrop-blur-md p-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Голоса</div>
                        <div className="space-y-1">
                            {sortedVotes.map((vote: any) => {
                                const participant = participants.find((p) => p.id === vote.voterId);
                                const choice = rawChoices.find((c: any) => c.id === vote.choiceId);
                                if (!participant || !choice) return null;
                                if (typeof vote.sceneId === 'string' && vote.sceneId !== sceneId) return null;
                                return (
                                    <div key={vote.id ?? `${vote.voterId}:${vote.choiceId}`} className="text-xs">
                                        <span className="text-cyan-300 font-semibold">{participant.name}</span>
                                        <span className="text-slate-500 mx-1">→</span>
                                        <span className="text-slate-300">{choice.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Main dialogue area */}
            <div className="absolute inset-0 flex flex-col justify-end items-center z-40 pb-4">
                {/* Scene title (subtle) */}
                {localNode.title && (
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <motion.div
                            key={localNodeId}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 0.6, y: 0 }}
                            className="text-lg font-cinzel tracking-[0.3em] text-white/60 uppercase"
                        >
                            {localNode.title}
                        </motion.div>
                    </div>
                )}

                {/* Dialogue Box */}
                <AnimatePresence mode="wait">
                    <DialogueBox
                        key={`dialogue-${localNodeId}-${chunkIndex}`}
                        text={narrativeChunks[chunkIndex]}
                        disabled={shouldShowChoices}
                        isPending={false}
                        onAdvance={handleAdvance}
                        onRevealComplete={() => { }}
                        onOpenMenu={() => setMenuOpen((v) => !v)}
                    />
                </AnimatePresence>

                {/* Choice Panel (only at checkpoints) */}
                <ChoicePanel
                    choices={visibleChoices}
                    onSelect={handleChoiceSelect}
                />
            </div>

            {/* Menu overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="absolute inset-0 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMenuOpen(false)}
                    >
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
                        <motion.div
                            className="absolute bottom-6 right-6 w-[260px] rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-xl shadow-2xl p-3"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400 px-2 py-1">
                                Меню
                            </div>
                            <div className="grid gap-2 mt-2">
                                {camp && (
                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                                        <div className="text-[10px] uppercase tracking-widest text-slate-400">Лагерь</div>
                                        <div className="flex items-center justify-between text-xs text-slate-200">
                                            <span>Безопасность</span>
                                            <span className="font-mono">{Number(camp.security ?? 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-200">
                                            <span>Оперативники</span>
                                            <span className="font-mono">{Number(camp.operatives ?? 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-200">
                                            <span>{expedition ? 'RP' : 'Scrap'}</span>
                                            <span className="font-mono">
                                                {expedition ? Number(expedition.researchPoints ?? 0) : Number((camp as any)?.inventory?.scrap ?? 0)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 hover:bg-black/30 text-xs text-slate-200 transition"
                                            onClick={() => callReinforcements(1).catch(() => { })}
                                        >
                                            Вызвать подкрепление (-25 {expedition ? 'RP' : 'scrap'})
                                        </button>

                                        {campShop?.stock?.length > 0 && (
                                            <div className="space-y-2 pt-1">
                                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Закупка</div>
                                                <select
                                                    className="w-full bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs text-slate-200"
                                                    value={shopSelectedTemplateId}
                                                    onChange={(e) => setShopSelectedTemplateId(String(e.target.value))}
                                                >
                                                    {campShop.stock.map((it: any) => (
                                                        <option key={it.templateId} value={it.templateId}>
                                                            {(ITEM_TEMPLATES as any)[it.templateId]?.name ?? it.name ?? it.templateId} — {it.price} {expedition ? 'RP' : 'scrap'}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/20 hover:bg-black/30 text-xs text-slate-200 transition"
                                                    disabled={!shopSelectedTemplateId}
                                                    onClick={() => buyCampItem(shopSelectedTemplateId, 1).catch(() => { })}
                                                >
                                                    Купить (x1)
                                                </button>
                                            </div>
                                        )}

                                        <div className="space-y-1 pt-1">
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Общий инвентарь</div>
                                            <div className="max-h-40 overflow-auto space-y-1 pr-1">
                                                {Object.entries((camp as any)?.inventory ?? {})
                                                    .filter(([id, qty]) => id !== 'scrap' && Number(qty) > 0)
                                                    .sort(([a], [b]) => a.localeCompare(b))
                                                    .map(([templateId, qty]) => (
                                                        <div key={templateId} className="flex items-center justify-between gap-2 text-xs text-slate-200">
                                                            <span className="truncate">
                                                                {(ITEM_TEMPLATES as any)[templateId]?.name ?? templateId}
                                                                <span className="text-slate-500"> x{Number(qty)}</span>
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="px-2 py-1 rounded border border-white/10 bg-black/20 hover:bg-black/30 text-[11px]"
                                                                onClick={() => withdrawCampItem(templateId, 1).catch(() => { })}
                                                            >
                                                                Взять
                                                            </button>
                                                        </div>
                                                    ))}
                                                {Object.entries((camp as any)?.inventory ?? {}).filter(([id, qty]) => id !== 'scrap' && Number(qty) > 0).length === 0 && (
                                                    <div className="text-xs text-slate-500">Пусто</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 text-left text-sm text-slate-200 transition"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
