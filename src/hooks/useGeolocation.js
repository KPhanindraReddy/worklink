import { useEffect, useState } from 'react';
import { hasMovedBeyondThreshold } from '../utils/location';

const defaultState = {
  latitude: null,
  longitude: null,
  loading: false,
  error: null
};

let sharedState = defaultState;
let watcherId = null;
const subscribers = new Set();

const broadcast = (nextState) => {
  sharedState = nextState;
  subscribers.forEach((subscriber) => subscriber(nextState));
};

const beginSharedWatch = () => {
  if (watcherId !== null || typeof navigator === 'undefined') {
    return;
  }

  if (!navigator.geolocation) {
    broadcast({
      ...defaultState,
      error: 'Live location is not supported in this browser.'
    });
    return;
  }

  broadcast({
    ...sharedState,
    loading: true,
    error: null
  });

  watcherId = navigator.geolocation.watchPosition(
    (position) => {
      const nextCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      const previousCoordinates = {
        latitude: sharedState.latitude,
        longitude: sharedState.longitude
      };

      if (
        !sharedState.loading &&
        !sharedState.error &&
        !hasMovedBeyondThreshold(previousCoordinates, nextCoordinates)
      ) {
        return;
      }

      broadcast({
        latitude: nextCoordinates.latitude,
        longitude: nextCoordinates.longitude,
        loading: false,
        error: null
      });
    },
    (error) => {
      broadcast({
        ...sharedState,
        loading: false,
        error: error.message
      });
    },
    {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 15000
    }
  );
};

const endSharedWatch = () => {
  if (watcherId === null || typeof navigator === 'undefined' || !navigator.geolocation) {
    return;
  }

  navigator.geolocation.clearWatch(watcherId);
  watcherId = null;
};

export const useGeolocation = (enabled = false) => {
  const [state, setState] = useState(() => (enabled ? sharedState : defaultState));

  useEffect(() => {
    if (!enabled) {
      setState(defaultState);
      return undefined;
    }

    subscribers.add(setState);
    setState(sharedState);
    beginSharedWatch();

    return () => {
      subscribers.delete(setState);

      if (!subscribers.size) {
        endSharedWatch();
      }
    };
  }, [enabled]);

  return state;
};
