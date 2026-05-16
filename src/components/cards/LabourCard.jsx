import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Star } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { VerificationBadge } from '../common/VerificationBadge';
import { formatDistanceKm } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const availabilityTone = {
  Available: 'emerald',
  Busy: 'amber',
  Offline: 'slate'
};

export const LabourCard = ({ labour, showMatchScore = false, onQuickBook, compact = false }) => {
  const { userProfile } = useAuth();
  const isClient = userProfile?.role === 'client';
  const isLabour = userProfile?.role === 'labour';
  const isAvailable = labour.availability === 'Available';
  const canQuickBook = Boolean(isClient && isAvailable && onQuickBook);
  const locationLabel = labour.currentLocation || labour.location || 'Location not added';

  if (compact) {
    return (
      <Card className="overflow-hidden rounded-2xl p-2.5 md:p-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <Link
            to={`/labour/${labour.id}`}
            className="flex min-w-0 touch-manipulation items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <img
              src={labour.profilePhoto}
              alt={labour.fullName}
              className="h-12 w-12 flex-none rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                  {labour.fullName}
                </h3>
                <VerificationBadge verified={labour.verified} />
              </div>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="truncate text-slate-700 dark:text-slate-300">{labour.category}</span>
                <span className="inline-flex items-center gap-1">
                  <Star size={11} className="text-amber-500" />
                  {labour.rating || 0}
                </span>
                {labour.distanceKm !== undefined ? <span>{formatDistanceKm(labour.distanceKm)}</span> : null}
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <MapPin size={12} className="flex-none" />
                <span className="truncate">{locationLabel}</span>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] items-stretch gap-2 sm:flex sm:items-center sm:justify-end">
            <Badge
              tone={availabilityTone[labour.availability] ?? 'slate'}
              className="justify-center py-2"
            >
              {labour.availability}
            </Badge>
            {canQuickBook ? (
              <Button
                type="button"
                size="sm"
                className="w-full min-w-0 whitespace-nowrap sm:w-auto sm:min-w-[104px]"
                onClick={() => onQuickBook(labour)}
              >
                <CalendarDays size={14} />
                Send request
              </Button>
            ) : isClient && !isAvailable ? (
              <Button type="button" size="sm" variant="outline" className="w-full min-w-0 whitespace-nowrap sm:w-auto sm:min-w-[104px]" disabled>
                {labour.availability}
              </Button>
            ) : (
              <Button
                as={Link}
                to={isClient ? `/labour/${labour.id}` : '/auth?role=client&mode=signup'}
                size="sm"
                variant="outline"
                className="w-full min-w-0 whitespace-nowrap sm:w-auto sm:min-w-[104px]"
              >
                {isClient ? 'Book now' : 'Book as client'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-4">
        <img
          src={labour.profilePhoto}
          alt={labour.fullName}
          className="h-16 w-16 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-slate-950 dark:text-white">
              {labour.fullName}
            </h3>
            <VerificationBadge verified={labour.verified} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{labour.category}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Star size={12} className="text-amber-500" />
              {labour.rating} ({labour.reviewsCount})
            </span>
            <span>{labour.experienceYears} yrs exp</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone={availabilityTone[labour.availability] ?? 'slate'}>{labour.availability}</Badge>
        {showMatchScore && labour.matchScore ? (
          <Badge tone="blue">{labour.matchScore}% match</Badge>
        ) : null}
        {labour.distanceKm !== undefined ? (
          <Badge tone="slate">{formatDistanceKm(labour.distanceKm)}</Badge>
        ) : null}
      </div>

      <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{labour.about}</p>

      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <MapPin size={15} className="flex-none" />
        <span className="min-w-0 truncate">{locationLabel}</span>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Button as={Link} to={`/labour/${labour.id}`} className="flex-1">
          View profile
        </Button>
        {isLabour ? (
          <Button type="button" variant="outline" className="flex-1" disabled>
            Client only
          </Button>
        ) : isClient && !isAvailable ? (
          <Button type="button" variant="outline" className="flex-1" disabled>
            {labour.availability}
          </Button>
        ) : canQuickBook ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onQuickBook(labour)}
          >
            <CalendarDays size={15} />
            Book now
          </Button>
        ) : (
          <Button
            as={Link}
            to={isClient ? `/labour/${labour.id}` : '/auth?role=client&mode=signup'}
            variant="outline"
            className="flex-1"
          >
            {isClient ? 'Book now' : 'Book as client'}
          </Button>
        )}
      </div>
    </Card>
  );
};
