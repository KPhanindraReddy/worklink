import clsx from 'clsx';
import { LoaderCircle, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import {
  buildMapsUrl,
  formatCoordinates,
  getLocationLabel,
  hasCoordinates
} from '../../utils/location';

const getRoleLabel = (role) => {
  if (role === 'labour') {
    return 'Labour';
  }

  if (role === 'client') {
    return 'Client';
  }

  if (role === 'admin') {
    return 'Admin';
  }

  return 'User';
};

export const LiveLocationBadge = ({ currentUser, userProfile, compact = false, className }) => {
  const role = userProfile?.role;
  const geolocation = useGeolocation(Boolean(currentUser && ['client', 'labour'].includes(role)));
  const liveCoordinates = useMemo(
    () =>
      hasCoordinates({
        latitude: geolocation.latitude,
        longitude: geolocation.longitude
      })
        ? {
            latitude: geolocation.latitude,
            longitude: geolocation.longitude
          }
        : null,
    [geolocation.latitude, geolocation.longitude]
  );
  const fallbackLocation = getLocationLabel(userProfile, {
    preferCurrent: role === 'labour',
    fallback: 'Location unavailable'
  });
  const locationLabel = liveCoordinates ? formatCoordinates(liveCoordinates) : fallbackLocation;
  const caption = geolocation.loading
    ? `Finding ${getRoleLabel(role).toLowerCase()} location`
    : liveCoordinates
      ? `${getRoleLabel(role)} live location`
      : `${getRoleLabel(role)} saved location`;
  const mapsUrl = buildMapsUrl(liveCoordinates || userProfile?.coordinates, fallbackLocation);
  const Container = mapsUrl ? 'a' : 'div';

  return (
    <Container
      {...(mapsUrl
        ? {
            href: mapsUrl,
            target: '_blank',
            rel: 'noreferrer'
          }
        : {})}
      className={clsx(
        'min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur',
        compact ? 'flex' : 'flex',
        className
      )}
    >
      <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-slate-950 text-white">
        {geolocation.loading ? <LoaderCircle size={16} className="animate-spin" /> : <MapPin size={16} />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {caption}
        </span>
        <span
          className={clsx(
            'block truncate font-semibold text-slate-950',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {locationLabel}
        </span>
      </span>
    </Container>
  );
};
