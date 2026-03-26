'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGeolocation } from './useGeolocation';

/**
 * Continuously watches the device position and publishes it to the drivers table.
 * Only active while the driver is online.
 */
export function useDriverLocation(driverId: string | null, isOnline: boolean) {
  const supabase = createClient();
  const { coords } = useGeolocation(true);
  const lastUpdatedRef = useRef<number>(0);

  useEffect(() => {
    if (!driverId || !isOnline || !coords) return;

    const now = Date.now();
    // Throttle updates to once every 5 seconds
    if (now - lastUpdatedRef.current < 5000) return;
    lastUpdatedRef.current = now;

    supabase
      .from('drivers')
      .update({
        current_lat: coords.lat,
        current_lng: coords.lng,
        location_updated_at: new Date().toISOString(),
      })
      .eq('id', driverId)
      .then(({ error }) => {
        if (error) console.error('Location update failed:', error.message);
      });
  }, [coords, driverId, isOnline, supabase]);

  return coords;
}
