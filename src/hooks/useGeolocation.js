import { useCallback, useEffect, useState } from 'react';
import { hasCoordinates } from '../utils/location';

const defaultState = {
  latitude: null,
  longitude: null,
  loading: false,
  error: null
};

let sharedState = defaultState;
let requestPromise = null;
const subscribers = new Set();

const broadcast = (nextState) => {
  sharedState = nextState;
  subscribers.forEach((subscriber) => subscriber(nextState));
};

const requestSharedLocation = ({ force = false } = {}) => {
  if (!force && hasCoordinates(sharedState)) {
    return Promise.resolve({
      latitude: sharedState.latitude,
      longitude: sharedState.longitude
    });
  }

  if (typeof navigator === 'undefined') {
    return Promise.resolve(null);
  }

  if (!navigator.geolocation) {
    broadcast({
      ...defaultState,
      error: 'Live location is not supported in this browser.'
    });
    return Promise.resolve(null);
  }

  if (requestPromise) {
    return requestPromise;
  }

  broadcast({
    ...sharedState,
    loading: true,
    error: null
  });

  requestPromise = new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextState = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          error: null
        };

        broadcast(nextState);
        requestPromise = null;
        resolve({
          latitude: nextState.latitude,
          longitude: nextState.longitude
        });
      },
      (error) => {
        broadcast({
          ...sharedState,
          loading: false,
          error: error.message
        });
        requestPromise = null;
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: force ? 0 : 600000,
        timeout: 15000
      }
    );
  });

  return requestPromise;
};

const clearSharedError = () => {
  if (sharedState.error) {
    broadcast({
      ...sharedState,
      error: null
    });
  }
};

export const useGeolocation = (enabled = false) => {
  const [state, setState] = useState(sharedState);

  const requestLocation = useCallback((options = {}) => requestSharedLocation(options), []);
  const clearError = useCallback(() => clearSharedError(), []);

  useEffect(() => {
    subscribers.add(setState);
    setState(sharedState);

    return () => {
      subscribers.delete(setState);
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      requestLocation();
    }
  }, [enabled, requestLocation]);

  return {
    ...state,
    requestLocation,
    clearError,
    hasLocation: hasCoordinates(state)
  };
};
