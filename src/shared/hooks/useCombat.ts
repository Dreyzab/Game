import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedClient } from "../api/client";

export const useCombat = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const queryClient = useQueryClient();

    // Active Battle Query
    const battleQuery = useQuery({
        queryKey: ['activeBattle'],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return null;
            const client = authenticatedClient(token);
            const { data, error } = await client.combat.active.get();
            if (error) return null;
            return data;
        },
        enabled: isLoaded && isSignedIn,
        refetchInterval: 1000,
    });

    // Mutations
    const createBattle = useMutation({
        mutationFn: async (payload?: { enemyKey?: string }) => {
            const token = await getToken();
            if (!token) return;
            const client = authenticatedClient(token);
            const { data, error } = await client.combat.create.post(payload);
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activeBattle'] })
    });

    const playCard = useMutation({
        mutationFn: async (payload: { battleId: string, cardId: string, targetId?: string }) => {
            const token = await getToken();
            if (!token) return;
            const client = authenticatedClient(token);
            const { data, error } = await client.combat.play.post(payload);
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activeBattle'] })
    });

    const endTurn = useMutation({
        mutationFn: async (payload: { battleId: string }) => {
            const token = await getToken();
            if (!token) return;
            // Use array access for kebab-case if needed, but I renamed route to endTurn in combat.ts
            const client = authenticatedClient(token);
            // Ensure client definition matches. If I renamed in combat.ts, Eden type inference should pick it up.
            // If not, I might need to regenerate client type or restart TS server.
            const { data, error } = await client.combat.endTurn.post(payload);
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activeBattle'] })
    });

    return {
        battle: battleQuery.data,
        isLoading: battleQuery.isLoading,
        createBattle,
        playCard,
        endTurn
    };
};
