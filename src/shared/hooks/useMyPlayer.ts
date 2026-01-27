import { useQuery } from "@tanstack/react-query";
import { authenticatedClient } from "../api/client";
import { useDeviceId } from "./useDeviceId";
import { useAppAuth } from "@/shared/auth";

export const useMyPlayer = () => {
    const { getToken, isLoaded } = useAppAuth();
    const { deviceId } = useDeviceId();

    return useQuery({
        queryKey: ['myPlayer'],
        queryFn: async () => {
            try {
                const token = await getToken();

                const client = authenticatedClient(token || undefined, deviceId);
                const { data, error } = await client.player.get();

                if (error) throw error;

                const payload = data as any;
                const hasPlayer = Boolean(payload?.player);
                const hasProgress = Boolean(payload?.progress);

                // Ensure a player exists for guests (and legacy records without progress).
                if (!hasPlayer || !hasProgress) {
                    const initResult = await client.player.init.post({});
                    if (initResult.error) throw initResult.error;

                    const refreshed = await client.player.get();
                    if (refreshed.error) throw refreshed.error;
                    return refreshed.data;
                }

                return data;
            } catch (e: any) {                throw e;
            }
        },
        enabled: isLoaded
    });
};
