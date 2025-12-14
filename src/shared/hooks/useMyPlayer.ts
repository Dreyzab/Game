import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { authenticatedClient } from "../api/client";

export const useMyPlayer = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['myPlayer'],
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error("No token");

            const client = authenticatedClient(token);
            const { data, error } = await client.player.get();

            if (error) throw error;
            return data;
        },
        enabled: isLoaded && isSignedIn
    });
};
