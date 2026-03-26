'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Coordinates } from '@/types';

interface GeolocationState {
  coords: Coordinates | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(watchMode = false) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: true,
  });

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, error: null, loading: false });
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({ ...prev, error: err.message, loading: false }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, error: 'Geolocation not supported', loading: false });
      return;
    }

    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000 };

    if (watchMode) {
      const watchId = navigator.geolocation.watchPosition(onSuccess, onError, opts);
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
    }
  }, [watchMode, onSuccess, onError]);

  return state;
}
