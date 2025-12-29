import { db } from '../db';
import { coopSessions, coopParticipants, coopVotes, players } from '../db/schema';
import { eq, and, inArray, ne, sql } from 'drizzle-orm';
import { coopGraph } from '../lib/coopGraph';
import type { CoopRoleId } from '../shared/types/coop';
import { broadcastCoopUpdate } from '../lib/bus';

const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
const COOP_ROLE_IDS: CoopRoleId[] = ['valkyrie', 'vorschlag', 'ghost', 'shustrya'];

export const coopService = {
    async createRoom(hostId: number, role?: CoopRoleId) {
        const code = generateCode();

        // Create session
        const [session] = await db.insert(coopSessions).values({
            hostId,
            inviteCode: code,
            status: 'waiting',
            currentScene: 'prologue_start',
            createdAt: Date.now(),
        }).returning();

        // Add host as participant
        const initialRole = role ?? null;
        await db.insert(coopParticipants).values({
            sessionId: session.id,
            playerId: hostId,
            role: initialRole,
            isReady: Boolean(initialRole),
            currentScene: session.currentScene ?? 'prologue_start',
            joinedAt: Date.now(),
        });

        const updatedState = await this.getRoomState(code);
        broadcastCoopUpdate(code, updatedState);
        return updatedState;
    },

    async getRoomState(code: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: {
                participants: {
                    with: {
                        player: true,
                    }
                },
                votes: true,
            }
        });

        if (!session) return null;

        const currentQuestNode = coopGraph.getNode(session.currentScene || 'prologue_start') ?? null;
        const participantIds = new Set(session.participants.map((p) => p.playerId));

        return {
            code: session.inviteCode,
            status: session.status,
            hostId: session.hostId,
            sceneId: session.currentScene,
            questNode: currentQuestNode,
            participants: session.participants.map(p => ({
                id: p.playerId,
                name: p.player.name,
                role: p.role,
                ready: p.isReady,
            })),
            votes: session.votes.filter((v) => v.sceneId === session.currentScene && participantIds.has(v.voterId)),
        };
    },

    async joinRoom(code: string, playerId: number, role?: CoopRoleId) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });

        if (!session) throw new Error('Room not found');
        if (session.status !== 'waiting') throw new Error('Game already started');

        const desiredRole = role ?? null;

        const existing = await db.query.coopParticipants.findFirst({
            where: and(
                eq(coopParticipants.sessionId, session.id),
                eq(coopParticipants.playerId, playerId)
            )
        });

        if (existing) {
            if (role && existing.role !== role) {
                const roleTaken = session.participants.some((p) => p.playerId !== playerId && p.role === role);
                if (roleTaken) throw new Error('Role already taken');

                await db
                    .update(coopParticipants)
                    .set({ role, isReady: true })
                    .where(and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.playerId, playerId)));
            }
            // Keep cursor in sync with current session scene if it was never set.
            if (!(existing as any).currentScene) {
                await db
                    .update(coopParticipants)
                    .set({ currentScene: session.currentScene ?? 'prologue_start' })
                    .where(and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.playerId, playerId)));
            }
            const state = await this.getRoomState(code);
            broadcastCoopUpdate(code, state);
            return state;
        }

        if (session.participants.length >= (session.maxPlayers ?? 4)) throw new Error('Room is full');
        if (desiredRole && session.participants.some((p) => p.role === desiredRole)) throw new Error('Role already taken');

        await db.insert(coopParticipants).values({
            sessionId: session.id,
            playerId,
            role: desiredRole,
            isReady: Boolean(desiredRole),
            currentScene: session.currentScene ?? 'prologue_start',
            joinedAt: Date.now(),
        });

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async setReady(code: string, playerId: number, isReady: boolean) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
        });
        if (!session) return null;

        await db.update(coopParticipants)
            .set({ isReady })
            .where(and(
                eq(coopParticipants.sessionId, session.id),
                eq(coopParticipants.playerId, playerId)
            ));

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async startSession(code: string, hostId: number) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.hostId !== hostId) throw new Error('Only host can start');
        if (session.participants.length < 2) throw new Error('Need at least 2 players');
        if (session.participants.some((p) => !p.isReady)) throw new Error('All players must be ready');
        if (session.participants.some((p) => !p.role)) throw new Error('All players must select a character');

        const pickedRoles = session.participants.map((p) => p.role).filter(Boolean) as string[];
        const uniqueRoles = new Set(pickedRoles);
        if (uniqueRoles.size !== pickedRoles.length) throw new Error('Each character can only be picked once');

        await db.update(coopSessions)
            .set({ status: 'active', startedAt: Date.now() })
            .where(eq(coopSessions.id, session.id));

        // Initialize per-player cursors to the starting scene for async reading.
        const startScene = session.currentScene ?? 'prologue_start';
        const participantIds = session.participants.map((p) => p.playerId);
        if (participantIds.length > 0) {
            await db
                .update(coopParticipants)
                .set({ currentScene: startScene })
                .where(and(eq(coopParticipants.sessionId, session.id), inArray(coopParticipants.playerId, participantIds)));
        }

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async markReached(code: string, playerId: number, nodeId: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');

        const participant = session.participants.find((p) => p.playerId === playerId);
        if (!participant) throw new Error('Not a participant');

        await db.update(coopParticipants)
            .set({ currentScene: nodeId })
            .where(and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.playerId, playerId)));

        // If majority reached this node, promote it to the shared checkpoint.
        const threshold = Math.floor(session.participants.length / 2) + 1;
        const reached = await db.query.coopParticipants.findMany({
            where: and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.currentScene, nodeId)),
            columns: { id: true },
        });

        if (reached.length >= threshold && session.currentScene !== nodeId) {
            await db.update(coopSessions)
                .set({ currentScene: nodeId })
                .where(eq(coopSessions.id, session.id));
        }

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async castVote(code: string, requesterPlayerId: number, choiceId: string, asPlayerId?: number, nodeId?: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: { with: { player: true } } }
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.currentScene) throw new Error('Invalid scene');

        const actorPlayerId = typeof asPlayerId === 'number' ? asPlayerId : requesterPlayerId;

        if (actorPlayerId !== requesterPlayerId) {
            if (session.hostId !== requesterPlayerId) {
                throw new Error('Only host can act for bots');
            }
            const target = session.participants.find((p) => p.playerId === actorPlayerId);
            const targetName = target?.player?.name ?? '';
            if (!target || !targetName.startsWith('Bot-')) {
                throw new Error('Can only act for bots');
            }
        }

        const normalizedNodeId = typeof nodeId === 'string' && nodeId.trim().length > 0 ? nodeId.trim() : undefined;

        let voteSceneId = session.currentScene;
        let currentNode = coopGraph.getNode(session.currentScene);
        if (!currentNode) throw new Error('Invalid scene');

        // Allow voting on "individual" nodes even if the shared session scene is elsewhere.
        // This supports async reading between checkpoints while still recording per-role decisions.
        if (normalizedNodeId && normalizedNodeId !== session.currentScene) {
            const requestedNode = coopGraph.getNode(normalizedNodeId);
            if (!requestedNode) throw new Error('Invalid node');
            if (requestedNode.interactionType !== 'individual') {
                throw new Error('nodeId override only allowed for individual scenes');
            }
            voteSceneId = normalizedNodeId;
            currentNode = requestedNode;
        }

        // --- FLAG / EFFECT HELPERS ---
        const getChoiceFlags = (cId: string): Record<string, any> => {
            // Hardcoded effects for the Crossroads scenario to demonstrate modernization
            // In a full implementation, these would come from c.flags in content
            const deltas: Record<string, number> = {
                // Opening
                opening_diplomacy: 0,
                opening_pragmatism: 0,
                opening_honor: 0,
                // Actions
                action_valkyrie_care: 10,
                action_valkyrie_threat: -10,
                action_valkyrie_observe: 0,
                action_vorschlag_open_hand: 10,
                action_vorschlag_hold_shield: -5,
                action_ghost_deescalate: 10,
                action_ghost_aim: -15,
                action_shustrya_visible_hands: 5,
                action_shustrya_fuse: -15,
                action_generic_still: 0,
                // Final
                final_trust: 20,
                final_neutral: -10,
                final_aggression: -50,
            };

            const nodeChoice = currentNode.choices.find(c => c.id === cId);
            const contentFlags = nodeChoice?.flags ?? {};

            if (cId in deltas) {
                return { ...contentFlags, trust_delta: deltas[cId] };
            }
            return contentFlags;
        };

        const applyFlags = async (flagsToApply: Record<string, any>) => {
            if (Object.keys(flagsToApply).length === 0) return;
            // Fetch latest flags to be safe
            const currentSession = await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            });
            const currentFlags = (currentSession?.flags ?? {}) as Record<string, any>;
            const nextFlags = { ...currentFlags };

            for (const [k, v] of Object.entries(flagsToApply)) {
                if (typeof v === 'number') {
                    nextFlags[k] = (typeof nextFlags[k] === 'number' ? nextFlags[k] : 0) + v;
                } else {
                    nextFlags[k] = v;
                }
            }
            await db.update(coopSessions).set({ flags: nextFlags }).where(eq(coopSessions.id, session.id));
        };

        const updateGraphState = async (
            updater: (graphState: { stack: string[]; sideQuests: Record<string, { startedAt?: number; completedAt?: number }> }) => void
        ) => {
            const currentSession = await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            });

            const flags = (currentSession?.flags ?? {}) as Record<string, any>;
            const rawGraphState = (flags.__graph ?? {}) as any;
            const graphState = {
                stack: Array.isArray(rawGraphState.stack) ? rawGraphState.stack.filter((v: any) => typeof v === 'string') : [],
                sideQuests: typeof rawGraphState.sideQuests === 'object' && rawGraphState.sideQuests ? rawGraphState.sideQuests : {},
            };

            updater(graphState);

            flags.__graph = graphState;
            await db.update(coopSessions).set({ flags }).where(eq(coopSessions.id, session.id));
        };

        const revertFlags = async (flagsToRevert: Record<string, any>) => {
            if (Object.keys(flagsToRevert).length === 0) return;
            const currentSession = await db.query.coopSessions.findFirst({
                where: eq(coopSessions.id, session.id),
                columns: { flags: true }
            });
            const currentFlags = (currentSession?.flags ?? {}) as Record<string, any>;
            const nextFlags = { ...currentFlags };

            for (const [k, v] of Object.entries(flagsToRevert)) {
                if (typeof v === 'number') {
                    nextFlags[k] = (typeof nextFlags[k] === 'number' ? nextFlags[k] : 0) - v;
                } else {
                    // For non-numeric, we can't easily revert without history, so we ignore or reset
                    // For this implementation, we focus on numeric deltas (Trust)
                }
            }
            await db.update(coopSessions).set({ flags: nextFlags }).where(eq(coopSessions.id, session.id));
        };

        const participant = session.participants.find((p) => p.playerId === actorPlayerId);
        if (!participant) throw new Error('Not a participant');

        // Validate choice exists
        const choice = currentNode.choices.find(c => c.id === choiceId);
        if (!choice) throw new Error('Invalid choice');

        // Validate role restrictions (server-side)
        if (choice.requiredRole && participant.role !== choice.requiredRole) {
            throw new Error('Choice locked to role');
        }

        // Check for existing vote to revert flags if needed (for individual nodes)
        const existingVote = await db.query.coopVotes.findFirst({
            where: and(
                eq(coopVotes.sessionId, session.id),
                eq(coopVotes.sceneId, voteSceneId),
                eq(coopVotes.voterId, actorPlayerId),
            )
        });

        if (existingVote) {
            if (currentNode.interactionType === 'individual') {
                const oldFlags = getChoiceFlags(existingVote.choiceId);
                await revertFlags(oldFlags);
            }
            await db.delete(coopVotes).where(eq(coopVotes.id, existingVote.id));
        }

        // Record vote/choice
        await db.insert(coopVotes).values({
            sessionId: session.id,
            sceneId: voteSceneId,
            choiceId,
            voterId: actorPlayerId,
            createdAt: Date.now(),
        });

        const newFlags = getChoiceFlags(choiceId);

        // Individual choices are personal: they should not block others and should not advance the shared checkpoint.
        if (currentNode.interactionType === 'individual') {
            await applyFlags(newFlags);
            const state = await this.getRoomState(code);
            broadcastCoopUpdate(code, state);
            return state;
        }

        // Check if we should advance
        const allVotes = await db.query.coopVotes.findMany({
            where: and(
                eq(coopVotes.sessionId, session.id),
                eq(coopVotes.sceneId, session.currentScene)
            )
        });

        const activeParticipantIds = new Set(session.participants.map((p) => p.playerId));
        const relevantVotes = allVotes.filter((vote) => activeParticipantIds.has(vote.voterId));
        const activeParticipants = session.participants.length;

        // Majority threshold: > half of active participants.
        const threshold = Math.floor(activeParticipants / 2) + 1;
        if (relevantVotes.length >= threshold) {
            // Tally votes
            const counts: Record<string, number> = {};
            for (const v of relevantVotes) {
                counts[v.choiceId] = (counts[v.choiceId] || 0) + 1;
            }

            // Tie breaking: Find max votes, pick random among leaders
            const maxVotes = Math.max(...Object.values(counts));
            const leaders = Object.entries(counts).filter(([_, c]) => c === maxVotes).map(([id]) => id);
            const winnerId = leaders[Math.floor(Math.random() * leaders.length)];
            const winningChoice = currentNode.choices.find(c => c.id === winnerId);

            // Apply winner flags
            if (winningChoice) {
                const winnerFlags = getChoiceFlags(winningChoice.id);
                await applyFlags(winnerFlags);
            }

            let nextNodeId: string | undefined;
            let actionHandled = false;

            // Side-quest graph actions (start/return) are resolved server-side.
            const winningAction = (winningChoice as any)?.action as string | undefined;
            const winningQuestId = (winningChoice as any)?.questId as string | undefined;

            if (winningChoice && winningAction === 'start_side_quest') {
                const entryNodeId = winningChoice.nextNodeId;
                if (!entryNodeId) throw new Error('Side quest entry node is missing nextNodeId');

                await updateGraphState((graph) => {
                    graph.stack.push(session.currentScene as string);
                    if (winningQuestId) {
                        const existing = graph.sideQuests[winningQuestId] ?? {};
                        graph.sideQuests[winningQuestId] = {
                            ...existing,
                            startedAt: existing.startedAt ?? Date.now(),
                        };
                    }
                });

                nextNodeId = entryNodeId;
                actionHandled = true;
            } else if (winningChoice && winningAction === 'return') {
                let returnNodeId: string | undefined;

                await updateGraphState((graph) => {
                    returnNodeId = graph.stack.pop();
                    if (winningQuestId) {
                        const existing = graph.sideQuests[winningQuestId] ?? {};
                        graph.sideQuests[winningQuestId] = {
                            ...existing,
                            completedAt: existing.completedAt ?? Date.now(),
                        };
                    }
                });

                nextNodeId = returnNodeId ?? winningChoice.nextNodeId;
                actionHandled = Boolean(nextNodeId);
            }

            // Special-case branching: in the briefing scene, Ghost can reveal an eavesdropper.
            if (!actionHandled && session.currentScene === 'outpost_tent') {
                const hasIntruderReveal = relevantVotes.some((vote) => vote.choiceId === 'ghost_intruder');
                if (hasIntruderReveal) {
                    nextNodeId = 'briefing_intruder';
                }
            }

            // Special-case branching: negotiation trust meter at the dwarven encounter.
            if (!actionHandled && session.currentScene === 'crossroads_vote') {
                // Fetch updated flags locally to check trust
                const currentSessionCtx = await db.query.coopSessions.findFirst({
                    where: eq(coopSessions.id, session.id),
                    columns: { flags: true }
                });
                const flags = (currentSessionCtx?.flags ?? {}) as Record<string, any>;
                // Base trust 50 + accumulated deltas
                const trustScore = 50 + (Number(flags.trust_delta) || 0);

                if (trustScore > 75) nextNodeId = 'crossroads_peace';
                else if (trustScore < 25) nextNodeId = 'crossroads_massacre';
                else nextNodeId = 'crossroads_coerce';
            }

            if (nextNodeId) {
                // Skip generic resolution below
            } else if ((currentNode.interactionType === 'vote' || currentNode.interactionType === 'sync') && !actionHandled) {
                if (winningChoice?.nextNodeId) {
                    nextNodeId = winningChoice.nextNodeId;
                }
            }

            if (nextNodeId && nextNodeId !== session.currentScene) {
                await db.update(coopSessions)
                    .set({ currentScene: nextNodeId })
                    .where(eq(coopSessions.id, session.id));

                // Cleanup votes from previous scenes to keep the table size manageable
                // We keep votes for the NEW currentScene (if any, though usually none yet)
                await db.delete(coopVotes).where(and(
                    eq(coopVotes.sessionId, session.id),
                    ne(coopVotes.sceneId, nextNodeId)
                ));
            }
        }

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async leaveRoom(code: string, playerId: number) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });
        if (!session) return null;

        await db.delete(coopParticipants).where(and(eq(coopParticipants.sessionId, session.id), eq(coopParticipants.playerId, playerId)));
        await db.delete(coopVotes).where(and(eq(coopVotes.sessionId, session.id), eq(coopVotes.voterId, playerId)));

        const remaining = await db.query.coopParticipants.findMany({
            where: eq(coopParticipants.sessionId, session.id),
        });

        if (remaining.length === 0) {
            await db.delete(coopSessions).where(eq(coopSessions.id, session.id));
            broadcastCoopUpdate(code, null);
            return null;
        }

        if (session.hostId === playerId) {
            await db.update(coopSessions).set({ hostId: remaining[0].playerId }).where(eq(coopSessions.id, session.id));
        }

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    // Debug/Admin force scene
    async forceScene(code: string, nodeId: string) {
        await db.update(coopSessions)
            .set({ currentScene: nodeId })
            .where(eq(coopSessions.inviteCode, code));

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    }
    ,

    async addBotToRoom(code: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true },
        });

        if (!session) throw new Error('Room not found');
        if (session.status !== 'waiting') throw new Error('Game already started');

        if (session.participants.length >= (session.maxPlayers ?? 4)) throw new Error('Room is full');

        const botName = `Bot-${Math.floor(Math.random() * 1000)}`;
        const [dummyPlayer] = await db.insert(players).values({
            name: botName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            deviceId: `bot-${Date.now()}-${Math.random()}`, // Fake device ID
        }).returning();

        // Pick a random available role
        const takenRoles = new Set(session.participants.map(p => p.role).filter(Boolean));
        const availableRoles = COOP_ROLE_IDS.filter(r => !takenRoles.has(r));

        let role: CoopRoleId | null = null;
        if (availableRoles.length > 0) {
            role = availableRoles[Math.floor(Math.random() * availableRoles.length)];
        }

        await db.insert(coopParticipants).values({
            sessionId: session.id,
            playerId: dummyPlayer.id,
            role,
            isReady: true, // Bots are always ready
            joinedAt: Date.now(),
        });

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    }
};
