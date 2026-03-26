'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRideStore } from '@/store/rideStore';
import type { Ride } from '@/types';

/**
 * Subscribes to real-time updates for the current ride.
 * Updates ride state as the driver accepts / completes / cancels.
 */
export function useRide(rideId: string | null) {
  const supabase = createClient();
  const setCurrentRide = useRideStore((s) => s.setCurrentRide);
  const setRideState = useRideStore((s) => s.setRideState);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!rideId) return;

    // Initial fetch
    supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCurrentRide(data as unknown as Ride);
          mapRideStatus(data.status, setRideState);
        }
      });

    // Realtime subscription
    channelRef.current = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
        (payload) => {
          const ride = payload.new as unknown as Ride;
          setCurrentRide(ride);
          mapRideStatus(ride.status, setRideState);
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [rideId, supabase, setCurrentRide, setRideState]);
}

function mapRideStatus(
  status: string,
  setRideState: (s: import('@/store/rideStore').RideRequestState) => void
) {
  switch (status) {
    case 'pending':
      setRideState('waiting_driver');
      break;
    case 'accepted':
      setRideState('accepted');
      break;
    case 'in_progress':
      setRideState('in_progress');
      break;
    case 'completed':
      setRideState('completed');
      break;
    case 'cancelled':
      setRideState('cancelled');
      break;
  }
}
