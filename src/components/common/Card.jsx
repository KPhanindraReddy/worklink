import clsx from 'clsx';

export const Card = ({ className, children }) => (
  <div className={clsx('surface-card p-4 md:p-5', className)}>{children}</div>
);
