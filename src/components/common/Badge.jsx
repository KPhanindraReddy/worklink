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
      'inline-flex min-w-0 max-w-full items-center break-words rounded-full px-2.5 py-1 text-left text-[11px] font-semibold leading-tight',
      tones[tone],
      className
    )}
  >
    {children}
  </span>
);
