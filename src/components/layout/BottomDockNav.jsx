import clsx from 'clsx';
import { Bell, BriefcaseBusiness, History, House, MessageCircle, Search, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { routeByRole } from '../../utils/authFlow';
import { matchesRoutePath } from '../../utils/routeMatching';

export const buildBottomDockItems = ({ currentUser, userProfile }) => {
  const role = userProfile?.role;
  const homeTarget = currentUser ? routeByRole(role) : '/';

  if (role === 'labour') {
    return [
      {
        label: 'Home',
        to: homeTarget,
        icon: House,
        matchers: [homeTarget]
      },
      {
        label: 'Jobs',
        to: '/recent-services',
        icon: History,
        matchers: ['/recent-services']
      },
      {
        label: 'Chat',
        to: '/chat',
        icon: MessageCircle,
        matchers: ['/chat']
      },
      {
        label: 'Profile',
        to: '/settings',
        icon: UserRound,
        matchers: ['/settings', '/complete-profile*']
      }
    ];
  }

  if (role === 'admin') {
    return [
      {
        label: 'Home',
        to: homeTarget,
        icon: House,
        matchers: [homeTarget]
      },
      {
        label: 'Alerts',
        to: '/notifications',
        icon: Bell,
        matchers: ['/notifications']
      },
      {
        label: 'Profile',
        to: '/settings',
        icon: UserRound,
        matchers: ['/settings', '/complete-profile*']
      }
    ];
  }

  return [
    {
      label: 'Home',
      to: homeTarget,
      icon: House,
      matchers: currentUser ? [homeTarget] : ['/']
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
      label: currentUser ? 'Services' : 'Client',
      to: currentUser ? '/recent-services' : '/auth?role=client&mode=login',
      icon: currentUser ? History : UserRound,
      matchers: currentUser ? ['/recent-services'] : ['/auth']
    },
    {
      label: currentUser ? 'Profile' : 'Labour',
      to: currentUser ? '/settings' : '/auth?role=labour&mode=login',
      icon: currentUser ? UserRound : BriefcaseBusiness,
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
    <div className="app-bottom-dock pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 lg:hidden">
      <nav className="pointer-events-auto w-full max-w-[24rem] rounded-[22px] border border-white/80 bg-white/95 p-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
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
                  'min-h-[3.65rem] touch-manipulation rounded-[18px] border px-1 py-2 text-center transition duration-200',
                  isActive
                    ? 'border-slate-950 bg-slate-950 shadow-[0_10px_20px_rgba(15,23,42,0.2)]'
                    : 'border-transparent bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                )}
              >
                <span
                  className={clsx(
                    'mx-auto grid h-7 w-7 place-items-center rounded-lg transition',
                    isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Icon size={15} />
                </span>
                <span
                  className={clsx(
                    'mt-1 block min-h-[1.55rem] text-[10px] font-semibold leading-tight',
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
