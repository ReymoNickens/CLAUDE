'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { Coordinates } from '@/types';

// UCC main gate coordinates
const UCC_CENTER: Coordinates = { lat: 5.1054, lng: -1.2834 };

interface RideMapProps {
  pickup: Coordinates | null;
  destination: Coordinates | null;
  driverLocation: Coordinates | null;
  onMapClick?: (coords: Coordinates, address: string) => void;
  pickingMode?: 'pickup' | 'destination' | null;
}

export function RideMap({ pickup, destination, driverLocation, onMapClick, pickingMode }: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{
    pickup?: google.maps.Marker;
    dest?: google.maps.Marker;
    driver?: google.maps.Marker;
  }>({});
  const [mapError, setMapError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load Google Maps once
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError('Google Maps API key not configured');
      return;
    }

    setOptions({ key: apiKey, v: 'weekly' });

    Promise.all([
      importLibrary('maps'),
      importLibrary('geocoding'),
    ]).then(([{ Map }, _]) => {
      if (!mapRef.current) return;
      const map = new Map(mapRef.current, {
        center: UCC_CENTER,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });
      mapInstanceRef.current = map;
      setLoaded(true);
    }).catch(() => setMapError('Failed to load map'));
  }, []);

  // Click handler for picking locations
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current || !onMapClick) return;

    const map = mapInstanceRef.current;
    const listener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      // Reverse geocode
      try {
        const { Geocoder } = await importLibrary('geocoding') as google.maps.GeocodingLibrary;
        const geocoder = new Geocoder();
        const result = await geocoder.geocode({ location: e.latLng });
        if (result.results[0]) address = result.results[0].formatted_address;
      } catch { /* ignore */ }

      onMapClick({ lat, lng }, address);
    });

    return () => google.maps.event.removeListener(listener);
  }, [loaded, onMapClick]);

  // Update pickup/destination markers and fit bounds
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (pickup) {
      if (markersRef.current.pickup) {
        markersRef.current.pickup.setPosition(pickup);
      } else {
        markersRef.current.pickup = new google.maps.Marker({
          map,
          position: pickup,
          title: 'Pickup',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#003087',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      }
      if (!destination) map.panTo(pickup);
    }

    if (destination) {
      if (markersRef.current.dest) {
        markersRef.current.dest.setPosition(destination);
      } else {
        markersRef.current.dest = new google.maps.Marker({
          map,
          position: destination,
          title: 'Destination',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      }
    }

    if (pickup && destination) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickup);
      bounds.extend(destination);
      map.fitBounds(bounds, { top: 60, right: 20, bottom: 20, left: 20 });
    }
  }, [loaded, pickup, destination]);

  // Driver location marker
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current || !driverLocation) return;

    const map = mapInstanceRef.current;
    if (markersRef.current.driver) {
      markersRef.current.driver.setPosition(driverLocation);
    } else {
      markersRef.current.driver = new google.maps.Marker({
        map,
        position: driverLocation,
        title: 'Driver',
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          rotation: 0,
        },
      });
    }
  }, [loaded, driverLocation]);

  if (mapError) {
    return (
      <div className="flex h-full items-center justify-center bg-muted rounded-xl text-center p-4">
        <div>
          <p className="text-2xl mb-2">🗺️</p>
          <p className="text-sm font-medium text-muted-foreground">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {pickingMode && (
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
          <div className="rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            {pickingMode === 'pickup' ? 'Tap map to set pickup' : 'Tap map to set destination'}
          </div>
        </div>
      )}
      {!loaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#003087] border-t-transparent" />
        </div>
      )}
    </div>
  );
}
