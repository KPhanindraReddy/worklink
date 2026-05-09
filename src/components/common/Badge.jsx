import clsx from 'clsx';

const tones = {
  blue: 'bg-brand-100 text-brand-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  slate: 'bg-slate-200 text-slate-700',
  rose: 'bg-rose-100 text-rose-800'
};

export const Badge = ({ className, tone = 'blue', children }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
      tones[tone],
      className
    )}
  >
    {children}
  </span>
);
