import type { VehicleType } from '@/types';

/**
 * Haversine formula — straight-line distance in km between two coordinates.
 * Used for fare estimation without a Maps API call.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface FareRateInput {
  vehicle_type: VehicleType;
  price_per_km: number;
  base_fare: number;
}

/**
 * Calculate fare given distance and rate.
 * Returns rounded 2-decimal numeric (store as numeric in DB).
 */
export function calculateFare(distanceKm: number, rate: FareRateInput): number {
  const raw = rate.base_fare + distanceKm * rate.price_per_km;
  return Math.round(raw * 100) / 100;
}
