import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { formatCurrency, formatDistanceKm } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const availabilityTone = {
  Available: 'emerald',
  Busy: 'amber',
  Offline: 'slate'
};

export const LabourCard = ({ labour, showMatchScore = false, onQuickBook }) => {
  const { userProfile } = useAuth();
  const isClient = userProfile?.role === 'client';
  const isLabour = userProfile?.role === 'labour';
  const isAvailable = labour.availability === 'Available';
  const canQuickBook = Boolean(isClient && isAvailable && onQuickBook);

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
            {labour.verified ? (
              <Badge tone="blue" className="gap-1">
                <ShieldCheck size={12} />
                Verified
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{labour.category}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Star size={12} className="text-amber-500" />
              {labour.rating} ({labour.reviewsCount})
            </span>
            <span>{labour.experienceYears} yrs exp</span>
            <span>{formatCurrency(labour.dailyWage)}/day</span>
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

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <MapPin size={15} />
        <span>{labour.currentLocation}</span>
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
            to={isClient ? `/booking?labourId=${labour.id}` : '/auth?role=client&mode=signup'}
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
