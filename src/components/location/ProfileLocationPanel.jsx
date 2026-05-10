import { LoaderCircle, LocateFixed, MapPin, Navigation } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../common/Button';
import { useGeolocation } from '../../hooks/useGeolocation';
import {
  buildMapsUrl,
  formatCoordinates,
  hasCoordinates,
  normalizeCoordinates
} from '../../utils/location';

export const ProfileLocationPanel = ({
  roleLabel = 'user',
  locationValue = '',
  savedCoordinates = null,
  onApplyLocation
}) => {
  const geolocation = useGeolocation();
  const liveCoordinates = useMemo(
    () =>
      hasCoordinates({
        latitude: geolocation.latitude,
        longitude: geolocation.longitude
      })
        ? normalizeCoordinates({
            latitude: geolocation.latitude,
            longitude: geolocation.longitude
          })
        : null,
    [geolocation.latitude, geolocation.longitude]
  );
  const savedMapsUrl = buildMapsUrl(savedCoordinates, locationValue);
  const savedLabel = String(locationValue ?? '').trim() || formatCoordinates(savedCoordinates);

  const handleApplyLiveLocation = async () => {
    const coordinates = await geolocation.requestLocation({ force: true });

    if (!coordinates) {
      return;
    }

    onApplyLocation?.({
      label: String(locationValue ?? '').trim() || formatCoordinates(coordinates),
      coordinates
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <MapPin size={15} className="text-brand-600" />
            Live location for {roleLabel}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {liveCoordinates
              ? `Updated GPS ready: ${formatCoordinates(liveCoordinates)}`
              : geolocation.loading
                ? 'Updating your GPS coordinates.'
                : savedLabel
                  ? `Saved location: ${savedLabel}`
                  : geolocation.error || 'Save location once, then update it only when you move.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={geolocation.loading}
            onClick={handleApplyLiveLocation}
          >
            {geolocation.loading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <LocateFixed size={15} />
            )}
            {savedCoordinates ? 'Update live location' : 'Use live location'}
          </Button>
          {savedMapsUrl ? (
            <Button
              as="a"
              href={savedMapsUrl}
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="outline"
            >
              <Navigation size={15} />
              Open map
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
