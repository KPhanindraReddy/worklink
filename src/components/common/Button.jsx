import clsx from 'clsx';

const variants = {
  primary: 'bg-brand-600 text-white shadow-glow hover:bg-brand-700',
  secondary: 'border border-slate-300 bg-white text-slate-900 shadow-sm hover:border-brand-300 hover:text-brand-700',
  outline:
    'border border-slate-300 bg-white text-slate-900 shadow-sm hover:border-brand-300 hover:text-brand-700',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700'
};

export const Button = ({
  as: Component = 'button',
  className,
  children,
  variant = 'primary',
  size = 'md',
  ...props
}) => (
    <Component
      className={clsx(
        'inline-flex min-w-0 max-w-full touch-manipulation items-center justify-center gap-1.5 rounded-xl text-center font-semibold leading-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/15 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' && 'min-h-10 px-3 py-2 text-[13px]',
        size === 'md' && 'min-h-11 px-3.5 py-2.5 text-[13px]',
        size === 'lg' && 'min-h-12 px-4 py-2.5 text-sm sm:min-h-11',
      variants[variant],
      className
    )}
    {...props}
  >
    {children}
  </Component>
);
