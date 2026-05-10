import clsx from 'clsx';
import { Bell, History, House, Search, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { routeByRole } from '../../utils/authFlow';
import { matchesRoutePath } from '../../utils/routeMatching';

export const buildBottomDockItems = ({ currentUser, userProfile }) => {
  const role = userProfile?.role;
  const homeTarget = currentUser ? routeByRole(role) : '/';
  const servicesItem =
    role === 'admin'
      ? {
          label: 'Alerts',
          to: '/notifications',
          icon: Bell,
          matchers: ['/notifications']
        }
      : {
          label: 'Services',
          to: currentUser ? '/recent-services' : '/auth',
          icon: History,
          matchers: currentUser ? ['/recent-services'] : ['/auth']
        };

  return [
    {
      label: 'Home',
      to: homeTarget,
      icon: House,
      matchers: currentUser ? [homeTarget] : ['/']
    },
    {
      label: 'Search Service',
      to: '/search',
      icon: Search,
      matchers: [
        '/search',
        '/booking*',
        (pathname) => pathname.startsWith('/labour/') && pathname !== '/labour/dashboard'
      ]
    },
    servicesItem,
    {
      label: role === 'admin' ? 'Admin' : 'Profile',
      to: currentUser ? '/settings' : '/auth',
      icon: UserRound,
      matchers: currentUser ? ['/settings', '/complete-profile*'] : ['/auth']
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
            const isActive = matchesRoutePath(pathname, item.matchers);

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
                    'mt-1 block min-h-[1.7rem] text-[8px] font-medium leading-[0.85rem]',
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
