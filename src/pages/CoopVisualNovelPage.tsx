import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { User, Package, Tent, X, Shield, Users, Info, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCoopStore } from '@/features/coop';
import { useMyPlayer } from '@/shared/hooks/useMyPlayer';
import type { CoopRoleId, SequentialBroadcastState } from '@/shared/types/coop';
import { cn } from '@/shared/lib/utils/cn';
import { authenticatedClient } from '@/shared/api/client';
import { DialogueBox, ChoicePanel } from '@/entities/visual-novel/ui';
import type { VisualNovelChoiceView } from '@/shared/types/visualNovel';
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates';
import { COOP_STATUSES, ROLE_TAG_MULTS } from '@/shared/data/coopScoreConfig';
import { COOP_ROLES } from '@/shared/types/coop';
import { COOP_CHARACTERS, ScoreFeedback, ExpeditionFeedback } from '@/features/coop';

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
    const sequentialBroadcast = (room as any)?.sequentialBroadcast as SequentialBroadcastState | null;

    const myId = (myPlayerQuery.data as any)?.player?.id as number | undefined;
    const myParticipant = myId ? participants.find((p) => p.id === myId) : undefined;
    const isHost = Boolean(myId && room?.hostId === myId);

    const botParticipants = useMemo(() => participants.filter((p) => (p?.name ?? '').startsWith('Bot-')), [participants]);
    const defaultControlledId = myId ?? participants[0]?.id ?? null;
    const [controlledPlayerId, setControlledPlayerId] = useState<number | null>(defaultControlledId);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'character' | 'inventory' | 'camp'>('character');
    const [campShop, setCampShop] = useState<any | null>(null);
    const [shopSelectedTemplateId, setShopSelectedTemplateId] = useState<string>('');

    const shakeControls = useAnimationControls();
    const [screenFlash, setScreenFlash] = useState<null | { id: string; kind: 'damage' | 'heal' }>(null);
    const prevControlledHpRef = useRef<number | null>(null);

    const [eventToast, setEventToast] = useState<null | {
        id: string;
        success: boolean;
        title: string;
        summary: string;
        lines: Array<{ playerId: string; name: string; pass: boolean; traitsAdded: string[] }>;
    }>(null);
    const lastEventAtRef = useRef<number | null>(null);

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

    const encounterPlayers = room?.encounter?.players;
    const myHp = (myPlayerQuery.data as any)?.progress?.hp as number | undefined;

    const controlledHp = useMemo(() => {
        const pid = controlledPlayerId ?? null;
        if (pid !== null && Array.isArray(encounterPlayers)) {
            const entry = encounterPlayers.find((p) => p.playerId === pid);
            if (entry && typeof entry.hp === 'number' && Number.isFinite(entry.hp)) {
                return entry.hp;
            }
        }
        return typeof myHp === 'number' && Number.isFinite(myHp) ? myHp : null;
    }, [controlledPlayerId, encounterPlayers, myHp]);

    useEffect(() => {
        if (typeof controlledHp !== 'number' || !Number.isFinite(controlledHp)) return;
        const prev = prevControlledHpRef.current;
        if (prev === null) {
            prevControlledHpRef.current = controlledHp;
            return;
        }
        if (controlledHp === prev) return;

        const delta = controlledHp - prev;
        prevControlledHpRef.current = controlledHp;

        const id = `coop_hpfx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        if (delta < 0) {
            setScreenFlash({ id, kind: 'damage' });
            shakeControls
                .start({
                    x: [0, -8, 8, -6, 6, 0],
                    y: [0, 2, -2, 1, -1, 0],
                    transition: { duration: 0.35, ease: 'easeOut' },
                })
                .catch(() => { });
        } else {
            setScreenFlash({ id, kind: 'heal' });
        }
    }, [controlledHp, shakeControls]);

    useEffect(() => {
        const ev = expedition?.lastEvent;
        if (!ev?.at) return;
        if (lastEventAtRef.current === ev.at) return;
        lastEventAtRef.current = ev.at;

        const titleById: Record<string, string> = {
            psi_wave: 'Psi-wave',
            injury_roll: 'Injury',
            injury_treat: 'Treatment',
        };

        const lines = Object.entries(ev.perPlayer ?? {}).map(([playerId, result]) => {
            const participant = participants.find((p) => String(p.id) === String(playerId));
            const traitsAddedRaw = (result as any)?.traitsAdded;
            const traitsAdded = Array.isArray(traitsAddedRaw)
                ? traitsAddedRaw.map((t) => String(t)).filter(Boolean)
                : [];
            return {
                playerId: String(playerId),
                name: participant?.name ?? `Player ${playerId}`,
                pass: Boolean((result as any)?.pass),
                traitsAdded,
            };
        });

        setEventToast({
            id: `event_${ev.at}`,
            success: Boolean(ev.success),
            title: titleById[String(ev.id)] ?? String(ev.id),
            summary: String(ev.summary ?? ''),
            lines,
        });

        const t = window.setTimeout(() => setEventToast(null), 4500);
        return () => window.clearTimeout(t);
    }, [expedition?.lastEvent?.at, participants, expedition?.lastEvent, expedition]);

    const agentLog = (hypothesisId: string, location: string, message: string, data: Record<string, unknown>) => {
        const payload = {
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId,
            location,
            message,
            data,
            timestamp: Date.now(),
        };
        // Online-safe: always log to browser console; ingest may be unreachable in prod.
        console.debug('[agent-debug]', payload);
        fetch('http://127.0.0.1:7243/ingest/8d2cfb91-eb32-456b-9d58-3c64b19222af', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch((err) => {
            console.debug('[agent-debug][ingest-failed]', { location, message: String((err as any)?.message ?? err) });
        });
    };

    const isCheckpointNode = (node: any) =>
        node?.interactionType === 'vote' ||
        node?.interactionType === 'contribute' ||
        (node?.interactionType === 'sync' && Array.isArray(node?.choices) && node.choices.length > 1);

    const [localNodeId, setLocalNodeId] = useState<string>(sceneId);
    const [localNode, setLocalNode] = useState<any>(questNode ?? FALLBACK_NODE);
    const nodeCache = useRef<Map<string, any>>(new Map([[sceneId, questNode]]));
    const localNodeIdRef = useRef<string>(localNodeId);
    useEffect(() => {
        localNodeIdRef.current = localNodeId;
    }, [localNodeId]);

    useEffect(() => {
        if (!sceneId) return;
        // #region agent log (debug)
        agentLog('H1', 'src/pages/CoopVisualNovelPage.tsx:scene-sync', 'sync local node to room sceneId/questNode', {
            roomCode: room?.code ?? null,
            prevLocalNodeId: localNodeIdRef.current ?? null,
            sceneId,
            questNodeId: (questNode as any)?.id ?? null,
            participants: Array.isArray(participants) ? participants.length : null,
            controlledPlayerId: controlledPlayerId ?? null,
            controlledRole: controlledRole ?? null,
        });
        // #endregion
        setLocalNodeId(sceneId);
        setLocalNode(questNode);
        nodeCache.current.set(sceneId, questNode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // #region agent log (debug)
        agentLog('H2', 'src/pages/CoopVisualNovelPage.tsx:advanceLocal', 'advanceLocal to nextNodeId', {
            roomCode: room?.code ?? null,
            fromLocalNodeId: localNodeIdRef.current ?? null,
            toLocalNodeId: nextNodeId,
            toInteractionType: (nextNode as any)?.interactionType ?? null,
            willMarkReached: Boolean(isCheckpointNode(nextNode)),
            sceneId,
        });
        // #endregion
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
    const [ephemeralReaction, setEphemeralReaction] = useState<any | null>(null);
    const lastReactionCountRef = useRef<number>(0);

    // Effect: Detect new reactions and show them ephemerally
    useEffect(() => {
        if (!sequentialBroadcast) {
            lastReactionCountRef.current = 0;
            return;
        }
        const currentCount = sequentialBroadcast.reactions.length;
        if (currentCount > lastReactionCountRef.current) {
            // New reaction(s) arrived
            const latest = sequentialBroadcast.reactions[currentCount - 1];
            setEphemeralReaction(latest);

            // Auto-dismiss after 6 seconds
            const timer = setTimeout(() => {
                setEphemeralReaction((prev: any) => (prev === latest ? null : prev));
            }, 6000);

            lastReactionCountRef.current = currentCount;
            return () => clearTimeout(timer);
        }
        // If we just loaded/reloaded, sync the ref without showing
        if (lastReactionCountRef.current === 0 && currentCount > 0) {
            lastReactionCountRef.current = currentCount;
        }
    }, [sequentialBroadcast]);

    // Show choices at key moments:
    // - Shared checkpoints (vote/sync branching) when everyone reached the node
    // - Individual nodes (personal decisions) after narration
    // - Sequential broadcast: only when it's YOUR turn AND no reaction is playing
    const isSequentialMode = localNode.interactionType === 'sequential_broadcast';
    const isMyTurnInSequential = isSequentialMode && sequentialBroadcast?.activePlayerId === controlledPlayerId;

    const shouldShowChoices =
        isNarrationDone &&
        !ephemeralReaction &&
        (
            (isCheckpoint && isAtSharedCheckpoint) ||
            localNode.interactionType === 'individual' ||
            isMyTurnInSequential
        );

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

        // #region agent log (debug)
        agentLog('H3', 'src/pages/CoopVisualNovelPage.tsx:handleChoiceSelect', 'choice selected', {
            roomCode: room?.code ?? null,
            sceneId,
            localNodeId,
            localInteractionType: (localNode as any)?.interactionType ?? null,
            isCheckpointNode: Boolean(isCheckpointNode(localNode)),
            isAtSharedCheckpoint,
            choiceId,
            nextNodeId: (choice as any)?.nextNodeId ?? null,
            controlledPlayerId: controlledPlayerId ?? null,
            controlledRole: controlledRole ?? null,
        });
        // #endregion

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

        if (localNode.interactionType === 'sequential_broadcast') {
            await castVote(choiceId, controlledPlayerId ?? undefined);
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

    const handleSequentialContinue = async () => {
        if (!room?.code) return;
        const client = authenticatedClient() as any;
        try {
            await client.coop.rooms[room.code].advance_sequential.post();
        } catch (err: any) {
            console.error('Failed to advance sequential:', err);
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
        <motion.div className="vn-chronicles relative w-screen h-screen overflow-hidden bg-[#020617]" animate={shakeControls}>
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-cover"
                    style={{ backgroundImage: `url(${backgroundUrl})` }}
                    initial={{ backgroundPosition: '20% 50%' }}
                    animate={{
                        backgroundPosition: ['0% 50%', '100% 50%'],
                    }}
                    transition={{
                        duration: 60,
                        ease: 'linear',
                        repeat: Infinity,
                        repeatType: 'reverse',
                    }}
                />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

            <AnimatePresence>
                {screenFlash ? (
                    <motion.div
                        key={screenFlash.id}
                        className="absolute inset-0 pointer-events-none z-35"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, screenFlash.kind === 'damage' ? 0.55 : 0.35, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: screenFlash.kind === 'damage' ? 0.45 : 0.35, ease: 'easeOut', times: [0, 0.22, 1] }}
                        style={{
                            background:
                                screenFlash.kind === 'damage'
                                    ? 'radial-gradient(circle at 50% 70%, rgba(239, 68, 68, 0.35), rgba(239, 68, 68, 0.08) 55%, rgba(0,0,0,0) 75%)'
                                    : 'radial-gradient(circle at 50% 70%, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.06) 55%, rgba(0,0,0,0) 75%)',
                        }}
                        onAnimationComplete={() => {
                            setScreenFlash((prev) => (prev?.id === screenFlash.id ? null : prev));
                        }}
                    />
                ) : null}
            </AnimatePresence>

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

            <AnimatePresence>
                {eventToast ? (
                    <motion.div
                        key={eventToast.id}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-40 w-[360px] max-w-[92vw] pointer-events-none"
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.22 }}
                    >
                        <div
                            className={cn(
                                "px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl",
                                eventToast.success ? "bg-emerald-950/40 border-emerald-500/30" : "bg-rose-950/40 border-rose-500/30"
                            )}
                        >
                            <div className="flex items-baseline justify-between gap-3">
                                <div className="text-[10px] uppercase tracking-widest text-slate-300">{eventToast.title}</div>
                                <div className={cn("text-[10px] font-bold uppercase tracking-widest", eventToast.success ? "text-emerald-300" : "text-rose-300")}>
                                    {eventToast.success ? "Success" : "Fail"}
                                </div>
                            </div>
                            <div className="mt-1 text-xs text-slate-100 leading-snug">{eventToast.summary}</div>
                            {eventToast.lines.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {eventToast.lines.slice(0, 6).map((line) => (
                                        <div key={line.playerId} className="flex items-center justify-between gap-3 text-[11px]">
                                            <span className="truncate text-slate-200">{line.name}</span>
                                            <span className={cn("font-bold", line.pass ? "text-emerald-300" : "text-rose-300")}>
                                                {line.pass ? "✓" : "✕"}
                                            </span>
                                        </div>
                                    ))}
                                    {eventToast.lines.some((l) => l.traitsAdded.length > 0) && (
                                        <div className="pt-1 text-[10px] text-slate-300">
                                            {eventToast.lines
                                                .filter((l) => l.traitsAdded.length > 0)
                                                .map((l) => `${l.name}: +${l.traitsAdded.join(', +')}`)
                                                .join(' • ')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

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

            {/* Sequential Broadcast: Waiting / Complete message */}
            {isSequentialMode && !isMyTurnInSequential && isNarrationDone && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-6 py-3 rounded-xl bg-black/60 border border-cyan-500/30 backdrop-blur-md text-center max-w-md flex flex-col items-center gap-2"
                    >
                        {sequentialBroadcast?.activePlayerId ? (
                            <>
                                <div className="text-cyan-400 text-sm font-medium">
                                    Ожидаем выбора: {participants.find(p => p.id === sequentialBroadcast.activePlayerId)?.name ?? 'Player ' + sequentialBroadcast.activePlayerId}
                                </div>
                                <div className="text-xs text-slate-400">
                                    Ход передается последовательно. Ваш черед скоро наступит.
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-emerald-400 text-sm font-medium">
                                    Брифинг завершен
                                </div>
                                <div className="text-xs text-slate-400 mb-2">
                                    Группа готова выдвигаться.
                                </div>
                                <button
                                    onClick={handleSequentialContinue}
                                    className="px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded text-xs font-bold text-emerald-300 transition-colors uppercase tracking-wider"
                                >
                                    Продолжить
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Sequential Broadcast: Reaction Overlay (Ephemeral) */}
            {isSequentialMode && ephemeralReaction && (
                <div key={ephemeralReaction.timestamp} className="absolute inset-0 z-60 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="max-w-2xl w-full bg-slate-900/90 border border-white/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                        <div className="text-center mb-6">
                            <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-2">
                                {ephemeralReaction.playerRole ? ephemeralReaction.playerRole.toUpperCase() : 'PLAYER'} ACTION
                            </div>
                            <div className="text-xl font-cinzel text-white">
                                {ephemeralReaction.playerName}
                            </div>
                        </div>

                        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10 text-center italic text-slate-300">
                            "{ephemeralReaction.choiceText}"
                        </div>

                        <div className="text-base leading-relaxed text-slate-200 text-center whitespace-pre-wrap">
                            {ephemeralReaction.effectText}
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMenuOpen(false)}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                        <motion.div
                            className="relative w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header & Tabs */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 bg-white/5">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('character')}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                                            activeTab === 'character' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                        )}
                                    >
                                        <User size={18} />
                                        <span className="text-sm font-cinzel font-bold tracking-wider uppercase">Досье</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('inventory')}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                                            activeTab === 'inventory' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                        )}
                                    >
                                        <Package size={18} />
                                        <span className="text-sm font-cinzel font-bold tracking-wider uppercase">Вещи</span>
                                    </button>
                                    {camp && (
                                        <button
                                            onClick={() => setActiveTab('camp')}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                                                activeTab === 'camp' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                            )}
                                        >
                                            <Tent size={18} />
                                            <span className="text-sm font-cinzel font-bold tracking-wider uppercase">Лагерь</span>
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setMenuOpen(false)}
                                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                {activeTab === 'character' && controlledRole && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-6"
                                    >
                                        {/* Profile Card */}
                                        <div className="flex flex-col sm:flex-row gap-6 p-1 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                            <div className="w-full sm:w-48 h-64 sm:h-auto overflow-hidden rounded-xl border border-white/10 bg-black/40">
                                                <img
                                                    src={COOP_CHARACTERS.find(c => c.id === controlledRole)?.portraitUrl}
                                                    className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                                                    alt="Portrait"
                                                />
                                            </div>
                                            <div className="flex-1 p-4 flex flex-col justify-center">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-2xl font-cinzel font-bold text-white tracking-wide">
                                                        {COOP_ROLES[controlledRole]?.nameRu ?? controlledRole}
                                                    </h3>
                                                    <span className="px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold tracking-widest uppercase">
                                                        {COOP_ROLES[controlledRole]?.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-cyan-400/80 italic font-medium mb-4">
                                                    {COOP_CHARACTERS.find(c => c.id === controlledRole)?.subtitle}
                                                </p>
                                                <div className="space-y-4">
                                                    <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                                                        <p className="text-xs text-slate-300 leading-relaxed italic">
                                                            {COOP_CHARACTERS.find(c => c.id === controlledRole)?.backstory || COOP_ROLES[controlledRole]?.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Voice Modifiers / Stats */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {Object.entries(COOP_CHARACTERS.find(c => c.id === controlledRole)?.voiceModifiers || {}).map(([voiceId, mod]) => (
                                                <div key={voiceId} className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center group hover:border-cyan-500/30 transition-colors">
                                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-cyan-400 transition-colors">{voiceId}</span>
                                                    <span className="text-lg font-mono font-bold text-white">+{Math.round((mod as number - 1) * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex gap-4">
                                            <Info className="text-cyan-400 shrink-0" size={20} />
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                <span className="text-cyan-400 font-bold">Стиль игры:</span> {COOP_ROLES[controlledRole]?.playstyleHint}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'inventory' && controlledRole && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-8"
                                    >
                                        {/* Personal Gear */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-4 bg-cyan-500 rounded-full" />
                                                <h4 className="text-sm font-cinzel font-bold tracking-widest uppercase text-white">Личное снаряжение</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {COOP_CHARACTERS.find(char => char.id === controlledRole)?.loadout.map((entry, idx) => {
                                                    const template = (ITEM_TEMPLATES as any)[entry.itemId];
                                                    return (
                                                        <div key={`${controlledRole}-gear-${idx}`} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10 group hover:border-cyan-500/30 transition-all">
                                                            <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                                {template?.icon || "📦"}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-bold text-white truncate">
                                                                    {template?.name || entry.itemId}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 truncate">
                                                                    {template?.kind || 'Предмет'} • {template?.baseStats?.weight || 0}кг
                                                                </div>
                                                            </div>
                                                            {entry.qty && entry.qty > 1 && (
                                                                <div className="px-2 py-1 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                                                                    x{entry.qty}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Common Inventory */}
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                                    <h4 className="text-sm font-cinzel font-bold tracking-widest uppercase text-white">Общий склад</h4>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-500">Доступно всей группе</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                {Object.entries((camp as any)?.inventory ?? {})
                                                    .filter(([id, qty]) => id !== 'scrap' && Number(qty) > 0)
                                                    .sort(([a], [b]) => a.localeCompare(b))
                                                    .map(([templateId, qty]) => {
                                                        const template = (ITEM_TEMPLATES as any)[templateId];
                                                        return (
                                                            <div key={templateId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xl">{template?.icon || "📦"}</span>
                                                                    <span className="text-xs font-medium text-slate-200">{template?.name || templateId}</span>
                                                                    <span className="text-[10px] font-mono text-slate-500">x{Number(qty)}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => withdrawCampItem(templateId, 1).catch(() => { })}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase transition-all"
                                                                >
                                                                    <span>Взять</span>
                                                                    <ArrowRight size={12} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                {Object.entries((camp as any)?.inventory ?? {}).filter(([id, qty]) => id !== 'scrap' && Number(qty) > 0).length === 0 && (
                                                    <div className="py-8 text-center text-xs text-slate-500 italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                                                        На общем складе пока пусто
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'camp' && camp && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-6"
                                    >
                                        {/* Camp Status Grid */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
                                                <Shield className="text-cyan-400" size={20} />
                                                <span className="text-[10px] uppercase tracking-widest text-slate-500">Защита</span>
                                                <span className="text-xl font-mono font-bold text-white">{Number(camp.security ?? 0)}</span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
                                                <Users className="text-amber-400" size={20} />
                                                <span className="text-[10px] uppercase tracking-widest text-slate-500">Люди</span>
                                                <span className="text-xl font-mono font-bold text-white">{Number(camp.operatives ?? 0)}</span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-[10px] font-bold text-cyan-400">R</div>
                                                <span className="text-[10px] uppercase tracking-widest text-slate-500">{expedition ? 'RP' : 'Scrap'}</span>
                                                <span className="text-xl font-mono font-bold text-white">
                                                    {expedition ? Number(expedition.researchPoints ?? 0) : Number((camp as any)?.inventory?.scrap ?? 0)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                                <h4 className="text-sm font-cinzel font-bold tracking-widest uppercase text-white">Управление ресурсами</h4>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                        <Users size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs font-bold text-white mb-1">Вызов подкрепления</div>
                                                        <p className="text-[10px] text-slate-500 leading-relaxed mb-3">Увеличивает количество оперативников в лагере, что критически важно для защиты и разведки.</p>
                                                        <button
                                                            onClick={() => callReinforcements(1).catch(() => { })}
                                                            className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
                                                        >
                                                            Запросить команду (-25 {expedition ? 'RP' : 'scrap'})
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shop Section */}
                                        {campShop?.stock?.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-4 bg-purple-500 rounded-full" />
                                                    <h4 className="text-sm font-cinzel font-bold tracking-widest uppercase text-white">Снабжение лагеря</h4>
                                                </div>
                                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-5">
                                                    <div className="flex flex-col gap-3">
                                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                            <ShoppingCart size={12} />
                                                            <span>Доступные товары</span>
                                                        </label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {campShop.stock.map((it: any) => (
                                                                <button
                                                                    key={it.templateId}
                                                                    onClick={() => setShopSelectedTemplateId(it.templateId)}
                                                                    className={cn(
                                                                        "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                                                        shopSelectedTemplateId === it.templateId
                                                                            ? "bg-purple-500/20 border-purple-500/40"
                                                                            : "bg-black/20 border-white/10 hover:border-white/20"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xl">{(ITEM_TEMPLATES as any)[it.templateId]?.icon || "📦"}</span>
                                                                        <div>
                                                                            <div className="text-xs font-bold text-slate-200">
                                                                                {(ITEM_TEMPLATES as any)[it.templateId]?.name ?? it.name ?? it.templateId}
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-500">
                                                                                {(ITEM_TEMPLATES as any)[it.templateId]?.kind || "Предмет"}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/10">
                                                                        <span className="text-[10px] font-mono font-bold text-white">{it.price}</span>
                                                                        <span className="text-[9px] text-slate-500 uppercase">{expedition ? 'RP' : 'SCR'}</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => buyCampItem(shopSelectedTemplateId, 1).catch(() => { })}
                                                        disabled={!shopSelectedTemplateId}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 text-xs font-bold transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                                                    >
                                                        <ShoppingCart size={14} />
                                                        <span>Подтвердить закупку</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex justify-end">
                                <button
                                    onClick={() => setMenuOpen(false)}
                                    className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-cinzel font-bold tracking-widest uppercase text-slate-300 transition-all"
                                >
                                    Вернуться в игру
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
