import clsx from 'clsx';
import { History, House, Search, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

const matchesPath = (pathname, matchers) =>
  matchers.some((matcher) => {
    if (typeof matcher === 'function') {
      return matcher(pathname);
    }

    if (matcher.endsWith('*')) {
      return pathname.startsWith(matcher.slice(0, -1));
    }

    return pathname === matcher;
  });

export const buildBottomDockItems = ({ currentUser, userProfile }) => {
  const recentTarget = currentUser
    ? userProfile?.role === 'admin'
      ? '/admin'
      : '/recent-services'
    : '/auth';

  return [
    {
      label: 'Home',
      to: '/',
      icon: House,
      matchers: ['/']
    },
    {
      label: 'Search',
      to: '/search',
      icon: Search,
      matchers: [
        '/search',
        '/booking*',
        (pathname) => pathname.startsWith('/labour/') && pathname !== '/labour/dashboard'
      ]
    },
    {
      label: 'Services',
      to: recentTarget,
      icon: History,
      matchers: ['/recent-services', '/client/dashboard', '/labour/dashboard', '/admin']
    },
    {
      label: 'Profile',
      to: currentUser ? '/settings' : '/auth',
      icon: UserRound,
      matchers: ['/auth', '/settings', '/complete-profile']
    }
  ];
};

export const BottomDockNav = () => {
  const { pathname } = useLocation();
  const { currentUser, userProfile } = useAuth();
  const items = useMemo(
    () => buildBottomDockItems({ currentUser, userProfile }),
    [currentUser, userProfile]
  );

  return (
    <div className="app-bottom-dock pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3">
      <nav className="pointer-events-auto w-full max-w-[21rem] rounded-[22px] border border-white/80 bg-white/94 p-1 shadow-[0_10px_28px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = matchesPath(pathname, item.matchers);

            return (
              <Link
                key={item.label}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'rounded-[18px] border px-0.5 py-1.5 text-center transition duration-200',
                  isActive
                    ? 'border-slate-950 bg-slate-950 shadow-[0_10px_20px_rgba(15,23,42,0.2)]'
                    : 'border-transparent bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                )}
              >
                <span
                  className={clsx(
                    'mx-auto grid h-6 w-6 place-items-center rounded-lg transition',
                    isActive ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Icon size={13} />
                </span>
                <span
                  className={clsx(
                    'mt-1 block text-[9px] font-medium',
                    isActive ? 'text-white' : 'text-slate-500'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
