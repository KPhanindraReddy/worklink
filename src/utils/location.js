const isFiniteCoordinate = (value) => Number.isFinite(Number(value));

export const hasCoordinates = (coordinates) =>
  isFiniteCoordinate(coordinates?.latitude) && isFiniteCoordinate(coordinates?.longitude);

export const normalizeCoordinates = (coordinates) =>
  hasCoordinates(coordinates)
    ? {
        latitude: Number(coordinates.latitude),
        longitude: Number(coordinates.longitude)
      }
    : null;

export const formatCoordinates = (coordinates, precision = 5) => {
  const normalized = normalizeCoordinates(coordinates);

  if (!normalized) {
    return '';
  }

  return `${normalized.latitude.toFixed(precision)}, ${normalized.longitude.toFixed(precision)}`;
};

export const getLocationLabel = (
  profile,
  { preferCurrent = false, fallback = 'Location not set' } = {}
) => {
  const primaryLocation = preferCurrent
    ? profile?.currentLocation || profile?.location
    : profile?.location || profile?.currentLocation;
  const trimmedLocation = String(primaryLocation ?? '').trim();

  if (trimmedLocation) {
    return trimmedLocation;
  }

  const coordinateLabel = formatCoordinates(profile?.coordinates);
  return coordinateLabel || fallback;
};

export const buildMapsUrl = (coordinates, label = '') => {
  const normalized = normalizeCoordinates(coordinates);

  if (normalized) {
    return `https://www.google.com/maps/search/?api=1&query=${normalized.latitude},${normalized.longitude}`;
  }

  const trimmedLabel = String(label ?? '').trim();
  return trimmedLabel
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedLabel)}`
    : '';
};

export const buildLocationCacheKey = (origin) => {
  const normalized = normalizeCoordinates(origin);

  if (!normalized) {
    return 'manual-location';
  }

  return `${normalized.latitude.toFixed(3)},${normalized.longitude.toFixed(3)}`;
};

export const hasMovedBeyondThreshold = (previousCoordinates, nextCoordinates, thresholdMeters = 30) => {
  const previous = normalizeCoordinates(previousCoordinates);
  const next = normalizeCoordinates(nextCoordinates);

  if (!previous || !next) {
    return true;
  }

  const toRadians = (degree) => (degree * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const deltaLatitude = toRadians(next.latitude - previous.latitude);
  const deltaLongitude = toRadians(next.longitude - previous.longitude);
  const latitudeA = toRadians(previous.latitude);
  const latitudeB = toRadians(next.latitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;
  const distanceMeters = 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));

  return distanceMeters >= thresholdMeters;
};
