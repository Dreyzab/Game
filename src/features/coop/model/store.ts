import { create } from 'zustand';
import { API_BASE_URL, authenticatedClient } from '@/shared/api/client';
import type { CoopQuestNode } from '@/shared/types/coop';

// Define the state shape matching the backend response
export interface CoopParticipant {
    id: number;
    name: string;
    role: string | null;
    ready: boolean;
}

export interface CoopRoomState {
    code: string;
    status: string;
    hostId: number;
    sceneId: string | null;
    questNode: CoopQuestNode | null;
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
    castVote: (choiceId: string) => Promise<void>;
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
            set({ room: payload.room as any, isLoading: false }); // Type mapping loose for now
            get().connectSocket(payload.room.code);
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
            set({ room: payload.room as any, isLoading: false });
            get().connectSocket(payload.room.code);
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
                set({ room: payload.room as any });
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
            set({ room: payload.room as any });
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
            set({ room: payload.room as any });
        }
    },

    castVote: async (choiceId) => {
        const { room } = get();
        if (!room) return;
        // @ts-expect-error - dynamic route access issue
        const { data, error } = await authenticatedClient().coop.rooms[room.code].quest.post({ choiceId });
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
            set({ room: payload.room as any });
        }
    },

    clearError: () => set({ error: null }),

    updateRoom: (room) => set({ room }),

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
