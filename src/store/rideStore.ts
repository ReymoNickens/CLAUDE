import { create } from 'zustand';
import type { Ride, Coordinates } from '@/types';

export type RideRequestState =
  | 'idle'
  | 'requesting'
  | 'waiting_driver'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface RideStore {
  // Booking inputs
  pickup: Coordinates | null;
  pickupAddress: string | null;
  destination: Coordinates | null;
  destAddress: string | null;
  vehicleType: 'Car' | 'Pragya';

  // Active ride
  rideState: RideRequestState;
  currentRide: Ride | null;
  distanceKm: number | null;
  fareEstimate: number | null;

  // Actions
  setPickup: (coords: Coordinates, address?: string) => void;
  setDestination: (coords: Coordinates, address?: string) => void;
  setVehicleType: (type: 'Car' | 'Pragya') => void;
  setFareEstimate: (distance: number, fare: number) => void;
  setRideState: (state: RideRequestState) => void;
  setCurrentRide: (ride: Ride | null) => void;
  resetRide: () => void;
}

export const useRideStore = create<RideStore>((set) => ({
  pickup: null,
  pickupAddress: null,
  destination: null,
  destAddress: null,
  vehicleType: 'Car',

  rideState: 'idle',
  currentRide: null,
  distanceKm: null,
  fareEstimate: null,

  setPickup: (coords, address) => set({ pickup: coords, pickupAddress: address ?? null }),
  setDestination: (coords, address) => set({ destination: coords, destAddress: address ?? null }),
  setVehicleType: (type) => set({ vehicleType: type }),
  setFareEstimate: (distance, fare) => set({ distanceKm: distance, fareEstimate: fare }),
  setRideState: (state) => set({ rideState: state }),
  setCurrentRide: (ride) => set({ currentRide: ride }),
  resetRide: () =>
    set({
      rideState: 'idle',
      currentRide: null,
      distanceKm: null,
      fareEstimate: null,
      destination: null,
      destAddress: null,
    }),
}));
