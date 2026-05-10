import clsx from 'clsx';
import { Bell, House, LayoutGrid, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resolvePostAuthPath } from '../../utils/authFlow';

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
  const homeTarget = currentUser ? resolvePostAuthPath({ profile: userProfile }) : '/';
  const activityTarget = currentUser ? '/notifications' : '/about';
  const accountTarget = currentUser ? '/settings' : '/auth';

  return [
    {
      label: 'Home',
      to: homeTarget,
      icon: House,
      matchers: ['/', '/client/dashboard', '/labour/dashboard', '/admin']
    },
    {
      label: 'Services',
      to: '/search',
      icon: LayoutGrid,
      matchers: [
        '/search',
        '/booking*',
        (pathname) => pathname.startsWith('/labour/') && pathname !== '/labour/dashboard'
      ]
    },
    {
      label: 'Activity',
      to: activityTarget,
      icon: Bell,
      matchers: currentUser ? ['/notifications', '/chat'] : ['/about']
    },
    {
      label: 'Account',
      to: accountTarget,
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
    <div className="app-bottom-dock pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 md:px-6">
      <nav className="pointer-events-auto w-full max-w-[24rem] rounded-[28px] border border-white/80 bg-white/94 p-1.5 shadow-[0_16px_42px_rgba(15,23,42,0.16)] backdrop-blur-2xl md:max-w-[31rem]">
        <div className="grid grid-cols-4 gap-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = matchesPath(pathname, item.matchers);

            return (
              <Link
                key={item.label}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'rounded-[22px] border px-1.5 py-2 text-center transition duration-200 md:px-2',
                  isActive
                    ? 'border-slate-950 bg-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.24)]'
                    : 'border-transparent bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                )}
              >
                <span
                  className={clsx(
                    'mx-auto grid h-8 w-8 place-items-center rounded-xl transition md:h-9 md:w-9',
                    isActive ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Icon size={16} />
                </span>
                <span
                  className={clsx(
                    'mt-1.5 block text-[11px] font-medium md:text-xs',
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
