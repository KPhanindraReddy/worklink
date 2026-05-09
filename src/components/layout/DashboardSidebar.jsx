import clsx from 'clsx';
import { NavLink } from 'react-router-dom';

export const DashboardSidebar = ({ items }) => (
  <aside className="surface-card h-fit overflow-x-auto p-2 xl:sticky xl:top-24 xl:p-3">
    <nav className="flex min-w-max gap-1 xl:grid xl:min-w-0">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            clsx(
              'whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);
