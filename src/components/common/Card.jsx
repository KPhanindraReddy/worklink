import clsx from 'clsx';

export const Card = ({ className, children }) => (
  <div className={clsx('surface-card p-3.5 md:p-4', className)}>{children}</div>
);
