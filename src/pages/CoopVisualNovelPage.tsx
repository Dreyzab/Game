import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useCoopStore } from '@/features/coop';
import { useMyPlayer } from '@/shared/hooks/useMyPlayer';
import type { CoopRoleId, SequentialBroadcastState } from '@/shared/types/coop';
import { cn } from '@/shared/lib/utils/cn';
import { DialogueBox, ChoicePanel } from '@/entities/visual-novel/ui';
import type { VisualNovelChoiceView } from '@/shared/types/visualNovel';
import { ScoreFeedback, ExpeditionFeedback } from '@/features/coop';
import { buildVisibleChoices, SequentialBroadcastOverlay, VoteDisplay, useCoopVNViewModel } from '@/features/coop-visual-novel';
import { CoopMenuSidebar } from '@/widgets/coop-menu';

const EMPTY_LIST: any[] = [];

export const CoopVisualNovelPage: React.FC = () => {
    const { room, castVote, callReinforcements, buyCampItem, withdrawCampItem, contributeItem, fetchCampShop } = useCoopStore();
    const myPlayerQuery = useMyPlayer();

    const questNode = room?.questNode ?? null;
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

    const {
        localNodeId,
        localNode,
        backgroundUrl,
        rawChoices,
        sortedVotes,
        selectedChoiceId,
        isGroupVoteNode,
        voteCounts,
        narrativeChunks,
        chunkIndex,
        isNarrationDone,
        isCheckpoint,
        isAtSharedCheckpoint,
        isSequentialMode,
        isMyTurnInSequential,
        ephemeralReaction,
        shouldShowChoices,
        handleChoiceSelect,
        handleAdvance,
        handleSequentialContinue,
    } = useCoopVNViewModel({
        roomCode: room?.code ?? null,
        sceneId,
        questNode,
        participants,
        votes,
        controlledPlayerId,
        controlledRole,
        sequentialBroadcast,
        castVote,
    });

    // Transform raw choices to VisualNovelChoiceView format for ChoicePanel
    const visibleChoices: VisualNovelChoiceView[] = useMemo(() => {
        return buildVisibleChoices({
            shouldShowChoices,
            rawChoices,
            isGroupVoteNode,
            voteCounts,
            participantCount: participants.length,
             selectedChoiceId,
             controlledRole,
             controlledPlayerId,
            inventory: camp?.inventory ?? {},
             questScore: questScore as any,
         });
    }, [camp, controlledPlayerId, controlledRole, isGroupVoteNode, participants.length, questScore, rawChoices, selectedChoiceId, shouldShowChoices, voteCounts]);

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

            {isSequentialMode && (
                <SequentialBroadcastOverlay
                    isNarrationDone={isNarrationDone}
                    isMyTurn={isMyTurnInSequential}
                    sequentialBroadcast={sequentialBroadcast}
                    participants={participants}
                    ephemeralReaction={ephemeralReaction}
                    onContinue={handleSequentialContinue}
                />
            )}

            {/* Votes display (when voting) */}
            {isGroupVoteNode && sortedVotes.length > 0 && (
                <VoteDisplay votes={sortedVotes} participants={participants} choices={rawChoices} sceneId={sceneId} />
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
            <CoopMenuSidebar
                isOpen={isMenuOpen}
                onClose={() => setMenuOpen(false)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                controlledRole={controlledRole}
                camp={camp}
                expedition={expedition}
                campShop={campShop}
                shopSelectedTemplateId={shopSelectedTemplateId}
                onSelectShopTemplateId={setShopSelectedTemplateId}
                callReinforcements={callReinforcements}
                buyCampItem={buyCampItem}
                withdrawCampItem={withdrawCampItem}
                contributeItem={contributeItem}
            />
        </motion.div>
    );
};
