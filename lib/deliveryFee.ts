import api from './api';

export interface RouteInfo {
  delivery_fee: number;
  distance_km: number;
  duration_minutes: number | null;
}

export async function fetchRouteInfo(
  fromLat: number | null | undefined,
  fromLng: number | null | undefined,
  toLat: number | null | undefined,
  toLng: number | null | undefined,
): Promise<RouteInfo | null> {
  if (!fromLat || !fromLng || !toLat || !toLng) return null;
  try {
    const res = await api.get('/delivery-fee', {
      params: { from_lat: fromLat, from_lng: fromLng, to_lat: toLat, to_lng: toLng },
    });
    return res.data.data as RouteInfo;
  } catch {
    return null;
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${Math.round(minutes)} menit`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}
