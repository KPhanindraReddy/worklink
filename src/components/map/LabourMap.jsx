import clsx from 'clsx';
import { LocateFixed, Navigation, Search, UserCheck } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatDistanceKm } from '../../utils/formatters';

const pinPositions = [
  { left: '18%', top: '28%' },
  { left: '72%', top: '24%' },
  { left: '58%', top: '66%' },
  { left: '33%', top: '72%' },
  { left: '82%', top: '56%' },
  { left: '45%', top: '21%' },
  { left: '16%', top: '58%' },
  { left: '76%', top: '76%' }
];

const hasClientCoordinates = (clientLocation) =>
  clientLocation?.latitude !== null &&
  clientLocation?.latitude !== undefined &&
  clientLocation?.longitude !== null &&
  clientLocation?.longitude !== undefined;

export const LabourMap = ({
  clientLocation,
  labours = [],
  selectedLabourId,
  onSelectLabour,
  searching = false,
  title = 'Available labour map',
  emptyLabel = 'Search to show workers near this request',
  className,
  directionsUrl
}) => (
  <div
    className={clsx(
      'relative min-h-[380px] overflow-hidden rounded-[28px] border border-slate-300 bg-[#f4fbf7] shadow-inner',
      className
    )}
  >
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(203,213,225,0.28)_1px,transparent_1px),linear-gradient(rgba(203,213,225,0.28)_1px,transparent_1px)] bg-[length:56px_56px]" />
    <div className="absolute inset-0 opacity-90">
      <div className="absolute left-[-12%] top-[20%] h-12 w-[128%] rotate-[-10deg] bg-white shadow-sm" />
      <div className="absolute left-[-10%] top-[58%] h-12 w-[120%] rotate-[12deg] bg-white shadow-sm" />
      <div className="absolute left-[44%] top-[-10%] h-[120%] w-12 rotate-[6deg] bg-white shadow-sm" />
      <div className="absolute left-[8%] top-[-10%] h-[120%] w-10 rotate-[-18deg] bg-white/90 shadow-sm" />
      <div className="absolute left-[12%] top-[16%] h-16 w-32 rounded-full bg-emerald-200/70" />
      <div className="absolute right-[10%] top-[38%] h-20 w-36 rounded-full bg-sky-200/70" />
    </div>

    {searching ? (
      <div className="absolute inset-0 z-10 bg-white/20 backdrop-blur-[1px]">
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-400/40" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-brand-500/30" />
        <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-transparent border-t-brand-600" />
        <div className="absolute left-1/2 top-[calc(50%+5.25rem)] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-soft">
          Searching nearby labour
        </div>
      </div>
    ) : null}

    <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
      <div className="relative grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-brand-600 text-white shadow-glow">
        <LocateFixed size={24} />
        <span className="absolute inset-[-10px] rounded-full border border-brand-500/30" />
      </div>
      <div className="mt-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white shadow-soft">
        {hasClientCoordinates(clientLocation) ? 'Your live location' : 'Client area'}
      </div>
    </div>

    {labours.map((labour, index) => {
      const position = pinPositions[index % pinPositions.length];
      const selected = selectedLabourId === labour.id;

      return (
        <button
          key={labour.id}
          type="button"
          onClick={() => onSelectLabour?.(labour)}
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 text-left"
          style={position}
          aria-label={`Select ${labour.fullName}`}
        >
          <div
            className={clsx(
              'grid h-12 w-12 place-items-center rounded-full border-4 bg-white shadow-soft transition',
              selected ? 'scale-110 border-brand-600 text-brand-700' : 'border-emerald-500 text-emerald-700'
            )}
          >
            <UserCheck size={20} />
          </div>
          <div className="mt-2 max-w-[150px] rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-soft">
            <p className="truncate text-xs font-bold text-slate-950">{labour.fullName}</p>
            <p className="truncate text-[11px] font-medium text-slate-600">
              {formatDistanceKm(labour.distanceKm)}
            </p>
          </div>
        </button>
      );
    })}

    <div className="absolute bottom-4 left-4 right-4 z-40 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="text-xs font-medium text-slate-600">
            {labours.length ? `${labours.length} available workers with distance shown` : emptyLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={hasClientCoordinates(clientLocation) ? 'emerald' : 'amber'}>
            {hasClientCoordinates(clientLocation) ? 'GPS active' : 'Manual address'}
          </Badge>
          {directionsUrl ? (
            <Button as="a" href={directionsUrl} target="_blank" rel="noreferrer" size="sm" variant="outline">
              <Navigation size={15} />
              Directions
            </Button>
          ) : (
            <Badge tone="blue" className="gap-1">
              <Search size={12} />
              Live map
            </Badge>
          )}
        </div>
      </div>
    </div>
  </div>
);
