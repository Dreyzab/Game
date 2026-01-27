import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { authenticatedClient } from "../api/client";
import { useEffect, useState } from "react";
import type { BBox, MapPoint, MapPointMetadata } from "../types/map";
import { useAppAuth } from "@/shared/auth";

type ApiPoint = {
  id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  type: string | null;
  phase: number | null;
  isActive: boolean | null;
  metadata: MapPointMetadata;
  status: string;
  discoveredAt: number | undefined;
  researchedAt: number | undefined;
};

type PointsResponse = { points: ApiPoint[] };

type ApiZone = {
  id: number;
  status: 'locked' | 'peace' | 'contested' | null;
  name: string;
  ownerFactionId?: string | null;
  center: { lat: number; lng: number };
  radius: number;
  health?: number | null;
  lastCapturedAt?: number | null;
};

type ApiSafeZone = {
  id: number;
  title: string | null;
  isActive: boolean | null;
  faction: string | null;
  polygon: { lat: number; lng: number }[];
};

type ApiDangerZone = {
  id: number;
  title: string | null;
  isActive: boolean | null;
  polygon: { lat: number; lng: number }[];
  dangerLevel: string | null;
};

type ZonesResponse = { zones: ApiZone[]; safeZones: ApiSafeZone[]; dangerZones: ApiDangerZone[] };

export const useMapData = (bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
  const { getToken, isLoaded } = useAppAuth();

  // Fetch Points
  const pointsQuery = useQuery<PointsResponse>({
    queryKey: ['mapPoints', bbox],
    queryFn: async (): Promise<PointsResponse> => {
      try {
        const token = await getToken();
        const client = authenticatedClient(token || undefined); // Allowed without token theoretically, but filtered logic changes

        const { data, error } = await client.map.points.get({
          query: bbox ? { ...bbox } : {}
        });
        if (error) throw error;

        const rawPoints = (data as any)?.points;
        const points = (Array.isArray(rawPoints) ? rawPoints.filter(Boolean) : []) as ApiPoint[];
        return { points };
      } catch (e: any) {
        // #region agent log (debug)
        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/shared/hooks/useMapData.ts:pointsQueryFn',message:'map_points_query_failed',data:{bbox:bbox??null,errorName:e?.name??null,errorMessage:e?.message??String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion agent log (debug)
        throw e;
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    enabled: isLoaded, // Can run even if not signed in (guest mode logic in backend?) - backend requires user for progress but maybe base points ok?
    // Actually backend check "if (!user) return unauthorized" for Points was there, might need to relax for Guest mode if that's a requirement.
    // For now assuming player context needed.
    retry: false
  });

  // Fetch Zones
  const zonesQuery = useQuery<ZonesResponse>({
    queryKey: ['mapZones'],
    queryFn: async () => {
      const token = await getToken();
      const client = authenticatedClient(token || undefined);
      const { data, error } = await client.map.zones.get();
      if (error) throw error;
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60000, // Cache zones longer
    refetchOnWindowFocus: false,
  });

  // Discover Mutation
  const discoverMutation = useMutation({
    mutationFn: async (pos: { lat: number; lng: number }) => {
      const token = await getToken();
      if (!token) return; // Silent fail
      const client = authenticatedClient(token);
      const { data, error } = await client.map.discover.post(pos);
      if (error) throw error;
      return data;
    }
  });

  // Transform API response to match frontend types
  const transformedPoints: MapPoint[] = (pointsQuery.data?.points ?? []).map((p) => ({
    ...(p as any),
    id: String(p.id),
    title: p.title ?? '',
    description: p.description ?? '',
    type: (p.type ?? 'poi') as any,
    phase: p.phase ?? undefined,
    isActive: p.isActive ?? true,
    coordinates: { lat: p.lat, lng: p.lng },
    metadata: p.metadata ?? undefined,
    status: (p.status ?? 'not_found') as any,
    discoveredAt: p.discoveredAt,
    researchedAt: p.researchedAt,
  }));

  const transformedZones = (zonesQuery.data?.zones ?? []).map((z: any) => ({
    ...z,
    ownerFactionId: z.ownerFactionId ?? undefined,
    status: z.status ?? undefined,
  }));

  const transformedSafeZones = (zonesQuery.data?.safeZones ?? []).map((z: any) => ({
    ...z,
    _id: z._id ?? String(z.id),
    id: String(z.id),
    name: z.title ?? z.name ?? '',
    isActive: z.isActive ?? true,
  }));

  const transformedDangerZones = (zonesQuery.data?.dangerZones ?? []).map((z: any) => ({
    ...z,
    _id: z._id ?? String(z.id),
    id: String(z.id),
    name: z.title ?? z.name ?? '',
    dangerLevel: z.dangerLevel ?? 'medium',
    enemyTypes: z.enemyTypes ?? [],
    spawnPoints: z.spawnPoints ?? [],
    maxEnemies: z.maxEnemies ?? 0,
    isActive: z.isActive ?? true,
  }));

  return {
    points: transformedPoints,
    zones: transformedZones,
    safeZones: transformedSafeZones,
    dangerZones: transformedDangerZones,
    isLoading: pointsQuery.isLoading || zonesQuery.isLoading,
    discover: discoverMutation.mutateAsync
  };
};

// Compat helper for legacy components (PointsListPanel)
export const useVisibleMapPoints = ({
  bbox,
  limit = 100,
}: {
  bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  limit?: number;
}) => {
  const { points, isLoading } = useMapData(bbox);
  const limited = limit ? points.slice(0, limit) : points;
  return { points: limited, isLoading };
};

// Получение зон (без отдельного запроса, используем кеш useMapData)
export const useSafeZones = ({
  bbox,
  enabled = true,
}: {
  bbox?: BBox;
  enabled?: boolean;
}) => {
  const { safeZones, dangerZones, isLoading } = useMapData(bbox);

  if (!enabled) {
    return { safeZones: [], dangerZones: [], isLoading: false };
  }

  // Здесь можно добавить фильтрацию по bbox, если потребуется
  return { safeZones, dangerZones, isLoading };
};

// --- Helpers for geolocation ---
export const useGeolocation = ({
  enabled = true,
  watch = false,
  accuracy = 'high'
}: {
  enabled?: boolean;
  watch?: boolean;
  accuracy?: 'low' | 'high';
}) => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsLoading(false);
      return;
    }

    const opts: PositionOptions = {
      enableHighAccuracy: accuracy === 'high',
      maximumAge: 5000,
      timeout: 10000,
    };

    const onSuccess = (pos: GeolocationPosition) => {
      setPosition(pos);
      setIsLoading(false);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err);
      setIsLoading(false);
    };

    let watchId: number | null = null;
    if (watch) {
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, opts);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
    }

    return () => {
      if (watch && watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enabled, watch, accuracy]);

  const getCurrentPosition = () =>
    new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator?.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: accuracy === 'high', timeout: 10000 }
      );
    });

  return { position, isLoading, error, getCurrentPosition };
};

export const useCenterOnUser = ({
  position,
  getCurrentPosition,
}: {
  position: GeolocationPosition | null;
  getCurrentPosition: () => Promise<GeolocationPosition | null>;
}) => {
  const [center, setCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!position) return;
    setCenter([position.coords.longitude, position.coords.latitude]);
  }, [position]);

  const handleLocateUser = async () => {
    const pos = position || (await getCurrentPosition());
    if (pos) {
      setCenter([pos.coords.longitude, pos.coords.latitude]);
    }
  };

  return { center, handleLocateUser };
};

/**
 * Конвертация bbox Mapbox в тип BBox (для запросов к API)
 */
export const convertBoundsToBBox = (bounds: {
  getNorthEast: () => { lat: number; lng: number };
  getSouthWest: () => { lat: number; lng: number };
}) => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    minLat: sw.lat,
    maxLat: ne.lat,
    minLng: sw.lng,
    maxLng: ne.lng,
  };
};
