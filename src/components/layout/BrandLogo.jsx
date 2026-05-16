import { Link } from 'react-router-dom';
import clsx from 'clsx';

export const BrandLogo = ({ className, onClick, to = '/', showTagline = false }) => {
  const content = (
    <>
      <span className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-2xl bg-slate-950 shadow-glow sm:h-10 sm:w-10">
        <img src="/favicon.svg" alt="" className="h-full w-full object-cover" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-bold leading-tight text-slate-950 sm:text-lg">
          WorkLink
        </span>
        {showTagline ? (
          <span className="hidden truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
            Trusted local work
          </span>
        ) : null}
      </span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={clsx('flex min-w-0 items-center gap-2 sm:gap-3', className)}
        onClick={onClick}
        aria-label="WorkLink home"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={clsx('flex min-w-0 items-center gap-2 sm:gap-3', className)}>
      {content}
    </div>
  );
};
