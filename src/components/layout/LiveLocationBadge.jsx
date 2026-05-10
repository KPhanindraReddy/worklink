import clsx from 'clsx';
import { MapPin } from 'lucide-react';
import {
  buildMapsUrl,
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
  const areaLabel = getLocationLabel(userProfile, {
    preferCurrent: role === 'labour',
    fallback: ''
  });
  const hasSavedCoordinates = hasCoordinates(userProfile?.coordinates);
  const locationLabel = areaLabel || 'Location unavailable';
  const caption =
    areaLabel || hasSavedCoordinates
      ? `${getRoleLabel(role)} saved location`
      : `Add ${getRoleLabel(role).toLowerCase()} location`;
  const mapsUrl = buildMapsUrl(userProfile?.coordinates, areaLabel);
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
        <MapPin size={16} />
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
