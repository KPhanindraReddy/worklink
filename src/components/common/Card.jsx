import clsx from 'clsx';

export const Card = ({ className, children }) => (
  <div className={clsx('surface-card p-5 md:p-6', className)}>{children}</div>
);

