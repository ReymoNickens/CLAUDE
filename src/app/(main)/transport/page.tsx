'use client';

import { useState, useEffect, useCallback } from 'react';
import lazyLoad from 'next/dynamic';
import { MapPin, Navigation } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRideStore } from '@/store/rideStore';
import { useRide } from '@/hooks/useRide';
import { useGeolocation } from '@/hooks/useGeolocation';
import { FareEstimate } from '@/components/transport/FareEstimate';
import { RideStatusBar } from '@/components/transport/RideStatusBar';
import { DriverCard } from '@/components/transport/DriverCard';
import { haversineDistance, calculateFare } from '@/lib/utils/fare';
import type { Profile, Driver, Coordinates } from '@/types';

// Lazy-load map to avoid SSR issues and keep initial bundle small
const RideMap = lazyLoad(
  () => import('@/components/transport/RideMap').then((m) => ({ default: m.RideMap })),
  { ssr: false, loading: () => <div className="w-full h-full bg-muted animate-pulse rounded-xl" /> }
);

type DriverWithProfile = Driver & Pick<Profile, 'full_name' | 'phone'>;

export default function TransportPage() {
  const supabase = createClient();
  const geo = useGeolocation();

  const {
    pickup, pickupAddress, destination, destAddress,
    vehicleType, rideState, currentRide, distanceKm, fareEstimate,
    setPickup, setDestination, setVehicleType, setFareEstimate,
    setRideState, setCurrentRide, resetRide,
  } = useRideStore();

  const [pickingMode, setPickingMode] = useState<'pickup' | 'destination' | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverWithProfile | null>(null);
  const [driverCoords, setDriverCoords] = useState<Coordinates | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set pickup from GPS on first load
  useEffect(() => {
    if (geo.coords && !pickup) {
      setPickup(geo.coords, 'My location');
    }
  }, [geo.coords, pickup, setPickup]);

  // Recalculate fare estimate
  useEffect(() => {
    if (!pickup || !destination) return;
    const dist = haversineDistance(pickup, destination);
    const ratePerKm = vehicleType === 'Car' ? 2.5 : 1.5;
    const base = vehicleType === 'Car' ? 5 : 3;
    setFareEstimate(dist, calculateFare(dist, ratePerKm, base));
  }, [pickup, destination, vehicleType, setFareEstimate]);

  // Subscribe to realtime ride updates
  useRide(currentRide?.id ?? null);

  // Fetch driver info when ride is accepted
  useEffect(() => {
    if (!currentRide?.driver_id) return;

    Promise.all([
      supabase.from('profiles').select('full_name, phone').eq('id', currentRide.driver_id).single(),
      supabase.from('drivers').select('rating, vehicle_type, plate_number, current_lat, current_lng').eq('id', currentRide.driver_id).single(),
    ]).then(([{ data: profile }, { data: driver }]) => {
      if (profile && driver) {
        setDriverInfo({ ...driver, ...profile } as unknown as DriverWithProfile);
        if (driver.current_lat && driver.current_lng) {
          setDriverCoords({ lat: driver.current_lat, lng: driver.current_lng });
        }
      }
    });
  }, [currentRide?.driver_id, supabase]);

  // Poll driver location while ride is active
  useEffect(() => {
    if (!currentRide?.driver_id || !['accepted', 'in_progress'].includes(rideState)) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('drivers')
        .select('current_lat, current_lng')
        .eq('id', currentRide.driver_id!)
        .single();
      if (data?.current_lat && data?.current_lng) {
        setDriverCoords({ lat: data.current_lat, lng: data.current_lng });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentRide?.driver_id, rideState, supabase]);

  const handleMapClick = useCallback(
    (coords: Coordinates, address: string) => {
      if (pickingMode === 'pickup') setPickup(coords, address);
      else if (pickingMode === 'destination') setDestination(coords, address);
      setPickingMode(null);
    },
    [pickingMode, setPickup, setDestination]
  );

  async function requestRide() {
    if (!pickup || !destination) return;
    setRequesting(true);
    setErrorMsg(null);
    setRideState('requesting');

    try {
      const res = await fetch('/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleType,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          pickupAddress: pickupAddress ?? undefined,
          destLat: destination.lat,
          destLng: destination.lng,
          destAddress: destAddress ?? undefined,
        }),
      });
      const json = await res.json() as { rideId?: string; error?: string };
      if (!res.ok || !json.rideId) {
        setErrorMsg(json.error ?? 'Failed to request ride');
        setRideState('idle');
        return;
      }
      setCurrentRide({ id: json.rideId } as never);
      setRideState('waiting_driver');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setRideState('idle');
    } finally {
      setRequesting(false);
    }
  }

  async function cancelRide() {
    if (!currentRide?.id) return;
    await fetch('/api/rides/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId: currentRide.id }),
    });
    resetRide();
    setDriverInfo(null);
    setDriverCoords(null);
  }

  const isActive = !['idle', 'completed', 'cancelled'].includes(rideState);
  const isDone = rideState === 'completed' || rideState === 'cancelled';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Map area */}
      <div className="flex-1 min-h-0 p-2">
        <RideMap
          pickup={pickup}
          destination={destination}
          driverLocation={driverCoords}
          onMapClick={isActive ? undefined : handleMapClick}
          pickingMode={pickingMode}
        />
      </div>

      {/* Bottom sheet */}
      <div className="shrink-0 bg-background border-t border-border px-4 pt-3 pb-4 space-y-3">

        {/* Completed / Cancelled */}
        {isDone && (
          <>
            <RideStatusBar state={rideState} />
            <button
              onClick={() => { resetRide(); setDriverInfo(null); setDriverCoords(null); }}
              className="h-11 w-full rounded-xl bg-[#003087] text-white text-sm font-semibold"
            >
              Book Another Ride
            </button>
          </>
        )}

        {/* Active ride info */}
        {isActive && (
          <>
            <RideStatusBar state={rideState} onCancel={cancelRide} />
            {driverInfo && (
              <DriverCard
                driverName={driverInfo.full_name}
                vehicleType={driverInfo.vehicle_type}
                plateNumber={driverInfo.plate_number}
                rating={driverInfo.rating}
                phone={driverInfo.phone}
              />
            )}
          </>
        )}

        {/* Booking form */}
        {rideState === 'idle' && (
          <>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPickingMode(pickingMode === 'pickup' ? null : 'pickup')}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  pickingMode === 'pickup' ? 'border-[#003087] bg-[#003087]/5' : 'border-border hover:bg-muted'
                }`}
              >
                <Navigation className="h-4 w-4 shrink-0 text-[#003087]" />
                <span className={`flex-1 text-left truncate ${pickupAddress ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {pickupAddress ?? 'Set pickup location'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPickingMode(pickingMode === 'destination' ? null : 'destination')}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  pickingMode === 'destination' ? 'border-[#003087] bg-[#003087]/5' : 'border-border hover:bg-muted'
                }`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-red-500" />
                <span className={`flex-1 text-left truncate ${destAddress ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {destAddress ?? 'Set destination'}
                </span>
              </button>
            </div>

            {pickup && destination && (
              <FareEstimate
                vehicleType={vehicleType}
                onVehicleChange={setVehicleType}
                distanceKm={distanceKm}
                fare={fareEstimate}
              />
            )}

            {errorMsg && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{errorMsg}</p>
            )}

            <button
              type="button"
              disabled={!pickup || !destination || requesting}
              onClick={requestRide}
              className="h-11 w-full rounded-xl bg-[#003087] text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              {requesting ? 'Finding driver…' : 'Request Ride'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
