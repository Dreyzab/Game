import { create } from 'zustand';
import { API_BASE_URL, authenticatedClient } from '@/shared/api/client';
import type { CoopCampState, CoopQuestNode } from '@/shared/types/coop';
import { clearLastCoopRoomCode, setLastCoopRoomCode } from './persistence';

// Define the state shape matching the backend response
export interface CoopParticipant {
    id: number;
    name: string;
    role: string | null;
    ready: boolean;
}

export interface CoopQuestScoreState {
    questId: string;
    current: number;
    target: number;
    history: number[];
    modifiers: Record<string, number>;
    playerModifiers: Record<string, Record<string, number>>;
    statuses: Record<string, number>;
    playerStatuses: Record<string, Record<string, number>>;
    stages: number;
    lastStageTotal: number;
    lastStageByPlayer: Record<string, number>;
}

export interface CoopExpeditionState {
    turnCount: number;
    maxTurns: number;
    researchPoints: number;
    waveNodeId?: string;
    wavePending?: boolean;
    deadlineEvents?: Array<{ nodeId: string; kind?: 'enemy' | 'check'; weight?: number }>;
    pendingNodeId?: string;
    pendingKind?: 'enemy' | 'check';
    playerTraits?: Record<string, string[]>;
    injury?: { targetPlayerId: number; needsTreatment: boolean };
    lastEvent?: {
        id: string;
        at: number;
        success: boolean;
        summary: string;
        perPlayer: Record<string, { pass: boolean; traitsAdded: string[] }>;
        targetPlayerId?: number;
        actorPlayerId?: number;
    };
}

export interface CoopRoomState {
    code: string;
    status: string;
    hostId: number;
    sceneId: string | null;
    questNode: CoopQuestNode | null;
    camp?: CoopCampState | null;
    expedition?: CoopExpeditionState | null;
    questScore?: CoopQuestScoreState | null;
    participants: CoopParticipant[];
    votes: any[]; // refine if needed
}

let coopSocket: WebSocket | null = null;

interface CoopStore {
    room: CoopRoomState | null;
    isLoading: boolean;
    isUpdating: boolean;
    error: string | null;

    // Actions
    createRoom: (role?: string) => Promise<void>;
    joinRoom: (code: string, role?: string) => Promise<void>;
    selectRole: (role: string) => Promise<void>;
    leaveRoom: () => Promise<void>;
    setReady: (ready: boolean) => Promise<void>;
    startGame: () => Promise<void>;
    castVote: (choiceId: string, asPlayerId?: number, nodeId?: string) => Promise<void>;
    callReinforcements: (count?: number) => Promise<void>;
    buyCampItem: (templateId: string, quantity?: number) => Promise<void>;
    withdrawCampItem: (templateId: string, quantity?: number) => Promise<void>;
    fetchCampShop: () => Promise<any | null>;
    addBot: () => Promise<void>;
    clearError: () => void;

    // Updates
    updateRoom: (room: CoopRoomState | null) => void;

    // Socket
    connectSocket: (code: string) => void;
}

export const useCoopStore = create<CoopStore>((set, get) => ({
    room: null,
    isLoading: false,
    isUpdating: false,
    error: null,

    createRoom: async (role) => {
        set({ isLoading: true, error: null });
        const { data, error } = await authenticatedClient().coop.rooms.post({ role });

        if (error) {
            set({ isLoading: false, error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return;
        }

        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ isLoading: false, error: payload.error });
            return;
        }

        if (payload?.room) {
            const nextRoom = payload.room as any;
            setLastCoopRoomCode(String(nextRoom.code ?? ''));
            set({ room: nextRoom, isLoading: false }); // Type mapping loose for now
            get().connectSocket(nextRoom.code);
            return;
        }

        set({ isLoading: false, error: 'Unknown error' });
    },

    joinRoom: async (code, role) => {
        set({ isLoading: true, error: null });
        // @ts-expect-error - dynamic route access issue with Eden
        const { data, error } = await authenticatedClient().coop.rooms[code].join.post({ role });

        if (error) {
            set({ isLoading: false, error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return;
        }

        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ isLoading: false, error: payload.error });
            return;
        }

        if (payload?.room) {
            const nextRoom = payload.room as any;
            setLastCoopRoomCode(String(nextRoom.code ?? code));
            set({ room: nextRoom, isLoading: false });
            get().connectSocket(nextRoom.code ?? code);
            return;
        }

        set({ isLoading: false, error: 'Unknown error' });
    },

    selectRole: async (role) => {
        const { room } = get();
        if (!room) return;

        set({ isUpdating: true, error: null });

        try {
            // @ts-expect-error - dynamic route access issue with Eden
            const { data, error } = await authenticatedClient().coop.rooms[room.code].join.post({ role });
            if (error) {
                set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
                return;
            }

            const payload = data as any;
            if (typeof payload?.error === 'string' && payload.error) {
                set({ error: payload.error });
                return;
            }

            if (payload?.room) {
                const nextRoom = payload.room as any;
                setLastCoopRoomCode(String(nextRoom.code ?? room.code));
                set({ room: nextRoom });
            }
        } finally {
            set({ isUpdating: false });
        }
    },

    leaveRoom: async () => {
        const { room } = get();
        if (!room) return;
        // @ts-expect-error - dynamic route access issue with Eden
        const { data, error } = await authenticatedClient().coop.rooms[room.code].leave.post();
        if (error) {
            set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
        } else if (typeof (data as any)?.error === 'string') {
            set({ error: String((data as any).error) });
        }
        if (coopSocket) {
            try {
                coopSocket.close();
            } catch {
                // ignore
            }
            coopSocket = null;
        }
        clearLastCoopRoomCode();
        set({ room: null });
    },

    setReady: async (ready) => {
        const { room } = get();
        if (!room) return;
        // @ts-expect-error - dynamic route access issue
        const { data, error } = await authenticatedClient().coop.rooms[room.code].ready.post({ ready });
        if (error) {
            set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return;
        }
        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ error: payload.error });
            return;
        }
        if (payload?.room) {
            const nextRoom = payload.room as any;
            setLastCoopRoomCode(String(nextRoom.code ?? room.code));
            set({ room: nextRoom });
        }
    },

    startGame: async () => {
        const { room } = get();
        if (!room) return;
        // @ts-expect-error - dynamic route access issue
        const { data, error } = await authenticatedClient().coop.rooms[room.code].start.post();
        if (error) {
            set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return;
        }
        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ error: payload.error });
            return;
        }
        if (payload?.room) {
            const nextRoom = payload.room as any;
            setLastCoopRoomCode(String(nextRoom.code ?? room.code));
            set({ room: nextRoom });
        }
    },

    castVote: async (choiceId, asPlayerId, nodeId) => {
        const { room } = get();
        if (!room) return;
        // @ts-expect-error - dynamic route access issue
        const { data, error } = await authenticatedClient().coop.rooms[room.code].quest.post({
            choiceId,
            asPlayerId: typeof asPlayerId === 'number' ? asPlayerId : undefined,
            nodeId: typeof nodeId === 'string' && nodeId.trim().length > 0 ? nodeId : undefined,
        });
        if (error) {
            set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return;
        }
        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ error: payload.error });
            return;
        }
        if (payload?.room) {
            const nextRoom = payload.room as any;
            setLastCoopRoomCode(String(nextRoom.code ?? room.code));
            set({ room: nextRoom });
        }
    },

    callReinforcements: async (count) => {
        const { room } = get();
        if (!room) return;

        const client = authenticatedClient() as any;
        const { data, error } = await client.coop.rooms[room.code].camp.reinforce.post({
            count: typeof count === 'number' ? count : undefined,
        });

        if (error) {
            set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return;
        }

        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ error: payload.error });
            return;
        }

        if (payload?.room) {
            const nextRoom = payload.room as any;
            setLastCoopRoomCode(String(nextRoom.code ?? room.code));
            set({ room: nextRoom });
        }
    },

    buyCampItem: async (templateId, quantity) => {
        const { room } = get();
        if (!room) return;

        const client = authenticatedClient() as any;
        const { data, error } = await client.coop.rooms[room.code].camp.purchase.post({
            templateId,
            quantity: typeof quantity === 'number' ? quantity : undefined,
        });

        if (error) {
            set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return;
        }

        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ error: payload.error });
            return;
        }

        if (payload?.room) {
            const nextRoom = payload.room as any;
            setLastCoopRoomCode(String(nextRoom.code ?? room.code));
            set({ room: nextRoom });
        }
    },

    withdrawCampItem: async (templateId, quantity) => {
        const { room } = get();
        if (!room) return;

        const client = authenticatedClient() as any;
        const { data, error } = await client.coop.rooms[room.code].camp.inventory.withdraw.post({
            templateId,
            quantity: typeof quantity === 'number' ? quantity : undefined,
        });

        if (error) {
            set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return;
        }

        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ error: payload.error });
            return;
        }

        if (payload?.room) {
            const nextRoom = payload.room as any;
            setLastCoopRoomCode(String(nextRoom.code ?? room.code));
            set({ room: nextRoom });
        }
    },

    fetchCampShop: async () => {
        const { room } = get();
        if (!room) return null;

        const client = authenticatedClient() as any;
        const { data, error } = await client.coop.rooms[room.code].camp.shop.get();

        if (error) {
            set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
            return null;
        }

        const payload = data as any;
        if (typeof payload?.error === 'string' && payload.error) {
            set({ error: payload.error });
            return null;
        }

        return payload?.shop ?? null;
    },

    addBot: async () => {
        const { room } = get();
        if (!room) return;

        // Manual fetch because Eden type inference might not have picked up the new route yet
        // or it's just easier to use fetch for a debug endpoint

        // We can try to use authenticatedClient if the types are updated, but let's use a safe fallback if needed.
        // Given we just updated the backend, the client types might not be regenerated yet.
        // We'll treat it as 'any' to bypass TS check on the new route.
        const client = authenticatedClient() as any;

        try {
            const { data, error } = await client.coop.rooms[room.code].debug.add_bot.post();

            if (error) {
                set({ error: (error as any)?.value ? String((error as any).value) : 'Unknown error' });
                return;
            }
            const payload = data as any;
            if (payload?.room) {
                const nextRoom = payload.room as any;
                setLastCoopRoomCode(String(nextRoom.code ?? room.code));
                set({ room: nextRoom });
            }
        } catch (e) {
            console.error(e);
            set({ error: 'Failed to add bot' });
        }
    },

    clearError: () => set({ error: null }),

    updateRoom: (room) => {
        if (room?.code) {
            setLastCoopRoomCode(String(room.code));
        } else {
            clearLastCoopRoomCode();
        }
        set({ room });
    },

    connectSocket: (code) => {
        if (coopSocket) {
            try {
                coopSocket.close();
            } catch {
                // ignore
            }
            coopSocket = null;
        }

        let wsUrl = '';
        try {
            if (API_BASE_URL && API_BASE_URL.startsWith('http')) {
                const api = new URL(API_BASE_URL);
                const wsProtocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
                wsUrl = `${wsProtocol}//${api.host}/ws`;
            } else {
                // Fallback to current relative path if no API_BASE_URL
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                wsUrl = `${wsProtocol}//${window.location.host}/ws`;
            }
        } catch {
            // Last resort fallback
            wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws';
        }

        const ws = new WebSocket(wsUrl);
        coopSocket = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'coop_join', payload: { code } }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'coop_update') {
                    get().updateRoom(msg.data);
                }
            } catch (e) {
                console.error('WS Parse error', e);
            }
        };

        ws.onclose = () => {
            if (coopSocket === ws) coopSocket = null;
        };
    }
}));
