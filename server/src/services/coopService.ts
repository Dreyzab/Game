import { db } from '../db';
import { coopSessions, coopParticipants, coopVotes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { COOP_PROLOGUE_NODES } from '../lib/coopContent';
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

        const currentQuestNode = COOP_PROLOGUE_NODES[session.currentScene || 'prologue_start'];
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

        const state = await this.getRoomState(code);
        broadcastCoopUpdate(code, state);
        return state;
    },

    async castVote(code: string, playerId: number, choiceId: string) {
        const session = await db.query.coopSessions.findFirst({
            where: eq(coopSessions.inviteCode, code),
            with: { participants: true }
        });
        if (!session) throw new Error('Room not found');
        if (session.status !== 'active') throw new Error('Session not active');
        if (!session.currentScene) throw new Error('Invalid scene');

        const currentNode = COOP_PROLOGUE_NODES[session.currentScene];
        if (!currentNode) throw new Error('Invalid scene');

        const participant = session.participants.find((p) => p.playerId === playerId);
        if (!participant) throw new Error('Not a participant');

        // Validate choice exists
        const choice = currentNode.choices.find(c => c.id === choiceId);
        if (!choice) throw new Error('Invalid choice');

        // Validate role restrictions (server-side)
        if (choice.requiredRole && participant.role !== choice.requiredRole) {
            throw new Error('Choice locked to role');
        }

        // Ensure one vote per player per scene (replace if re-voting)
        await db.delete(coopVotes).where(and(
            eq(coopVotes.sessionId, session.id),
            eq(coopVotes.sceneId, session.currentScene),
            eq(coopVotes.voterId, playerId),
        ));

        // Record vote/choice
        await db.insert(coopVotes).values({
            sessionId: session.id,
            sceneId: session.currentScene,
            choiceId,
            voterId: playerId,
            createdAt: Date.now(),
        });

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

        if (relevantVotes.length >= activeParticipants) {
            // Tally votes
            const counts: Record<string, number> = {};
            for (const v of relevantVotes) {
                counts[v.choiceId] = (counts[v.choiceId] || 0) + 1;
            }

            let nextNodeId: string | undefined;

            if (currentNode.interactionType === 'vote') {
                const winnerId = Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
                const winningChoice = currentNode.choices.find(c => c.id === winnerId);
                if (winningChoice?.nextNodeId) {
                    nextNodeId = winningChoice.nextNodeId;
                }
            } else {
                // For sync/individual: advance only if all picks converge to one next node.
                const candidates = new Set<string>();
                for (const v of relevantVotes) {
                    const picked = currentNode.choices.find((c) => c.id === v.choiceId);
                    if (picked?.nextNodeId) candidates.add(picked.nextNodeId);
                }
                if (candidates.size === 1) {
                    nextNodeId = Array.from(candidates)[0];
                }
            }

            if (nextNodeId && nextNodeId !== session.currentScene) {
                await db.update(coopSessions)
                    .set({ currentScene: nextNodeId })
                    .where(eq(coopSessions.id, session.id));
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
};
