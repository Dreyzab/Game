import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedClient } from "@/shared/api/client";
import { useAppAuth } from "@/shared/auth";

export const useMyQuests = () => {
    const { getToken, isLoaded, isSignedIn } = useAppAuth();
    const queryClient = useQueryClient();

    // Fetch Quests
    const query = useQuery({
        queryKey: ['myQuests'],
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error("No token");

            const client = authenticatedClient(token);
            const { data, error } = await client.quests.get();
            if (error) throw error;
            return data;
        },
        enabled: isLoaded && isSignedIn,
        refetchInterval: 10000
    });

    // Start Quest Mutation
    const startQuest = useMutation({
        mutationFn: async (questId: string) => {
            const token = await getToken();
            if (!token) throw new Error("No token");
            const client = authenticatedClient(token);

            const { data, error } = await client.quests.start.post({ questId });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myQuests'] });
        }
    });

    // Update/Complete (Generic)
    const updateQuest = useMutation({
        mutationFn: async (payload: { questId: string, status?: string, currentStep?: string, progress?: any }) => {
            const token = await getToken();
            if (!token) throw new Error("No token");
            const client = authenticatedClient(token);

            const { data, error } = await client.quests.update.post(payload);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myQuests'] });
        }
    });

    return {
        active: query.data?.active ?? [],
        completed: query.data?.completed ?? [],
        available: query.data?.available ?? [],
        isLoading: query.isLoading,
        error: query.error,
        startQuest,
        updateQuest
    };
};
