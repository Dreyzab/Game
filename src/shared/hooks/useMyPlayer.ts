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
            } catch (e: any) {
                // #region agent log (debug)
                fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/shared/hooks/useMyPlayer.ts:queryFn',message:'my_player_query_failed',data:{hasDeviceId:Boolean(deviceId),errorName:e?.name??null,errorMessage:e?.message??String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
                // #endregion agent log (debug)
                throw e;
            }
        },
        enabled: isLoaded
    });
};
