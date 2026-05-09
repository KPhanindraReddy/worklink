import { useEffect, useState } from 'react';

const defaultState = {
  latitude: null,
  longitude: null,
  loading: false,
  error: null
};

export const useGeolocation = (enabled = false) => {
  const [state, setState] = useState(defaultState);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      return undefined;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const watcherId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          error: null
        });
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 15000
      }
    );

    return () => navigator.geolocation.clearWatch(watcherId);
  }, [enabled]);

  return state;
};

