import type { VehicleType } from '@/types';

/**
 * Haversine formula — straight-line distance in km between two coordinates.
 * Used for fare estimation without a Maps API call.
 */
export function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
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
export function calculateFare(distanceKm: number, pricePerKm: number, baseFare = 0): number {
  const raw = baseFare + distanceKm * pricePerKm;
  return Math.round(raw * 100) / 100;
}
