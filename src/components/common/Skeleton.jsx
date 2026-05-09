import clsx from 'clsx';

export const Skeleton = ({ className }) => (
  <div className={clsx('animate-pulse rounded-2xl bg-slate-200', className)} />
);
