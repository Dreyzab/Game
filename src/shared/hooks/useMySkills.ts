import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedClient } from "../api/client";

export const useMySkills = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const queryClient = useQueryClient();

    // Fetch Skill Tree
    const treeQuery = useQuery({
        queryKey: ['skillTree'],
        queryFn: async () => {
            const token = await getToken();
            const client = authenticatedClient(token || undefined);
            const { data, error } = await client.skills.tree.get();
            if (error) throw error;
            return data;
        },
        staleTime: Infinity
    });

    // Fetch My Subclasses
    const subclassesQuery = useQuery({
        queryKey: ['mySubclasses'],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return [];
            const client = authenticatedClient(token);
            const { data, error } = await client.skills.subclasses.get();
            if (error) throw error;
            return data;
        },
        enabled: isLoaded && isSignedIn
    });

    // Unlock Subclass
    const unlockSubclass = useMutation({
        mutationFn: async ({ baseSkillId, subclassId }: { baseSkillId: string, subclassId: string }) => {
            const token = await getToken();
            if (!token) throw new Error("No token");
            const client = authenticatedClient(token);
            const { data, error } = await client.skills.unlock.post({ baseSkillId, subclassId });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mySubclasses'] });
        }
    });

    return {
        tree: treeQuery.data,
        subclasses: subclassesQuery.data ?? [],
        isLoading: treeQuery.isLoading || subclassesQuery.isLoading,
        unlockSubclass
    };
};
