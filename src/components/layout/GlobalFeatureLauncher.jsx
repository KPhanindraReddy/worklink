import clsx from 'clsx';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  LayoutGrid,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolvePostAuthPath } from '../../utils/authFlow';

const matchesPath = (pathname, matchers) =>
  matchers.some((matcher) => {
    if (matcher.endsWith('*')) {
      return pathname.startsWith(matcher.slice(0, -1));
    }

    return pathname === matcher;
  });

const buildLauncherConfig = ({ currentUser, userProfile }) => {
  if (!currentUser) {
    return {
      eyebrow: 'Quick access',
      title: 'Explore WorkLink from anywhere',
      description: 'The same feature launcher stays visible across the website and mobile screens.',
      searchTo: '/search',
      searchLabel: 'Find local labour',
      searchMeta: 'Search electricians, plumbers, carpenters, painters, and more',
      actions: [
        {
          label: 'Services',
          detail: 'Browse work categories',
          to: '/search',
          icon: LayoutGrid,
          tone: 'from-slate-100 via-white to-slate-200',
          accent: 'text-slate-700',
          matchers: ['/search']
        },
        {
          label: 'Join client',
          detail: 'Book workers fast',
          to: '/auth?role=client&mode=signup',
          icon: CalendarDays,
          tone: 'from-amber-50 via-white to-amber-100',
          accent: 'text-amber-700',
          matchers: ['/auth']
        },
        {
          label: 'Join labour',
          detail: 'Get customer requests',
          to: '/auth?role=labour&mode=signup',
          icon: BriefcaseBusiness,
          tone: 'from-sky-50 via-white to-sky-100',
          accent: 'text-sky-700',
          matchers: ['/auth']
        },
        {
          label: 'Profile trust',
          detail: 'Verification and settings',
          to: '/auth',
          icon: ShieldCheck,
          tone: 'from-emerald-50 via-white to-emerald-100',
          accent: 'text-emerald-700',
          matchers: ['/complete-profile']
        }
      ]
    };
  }

  if (userProfile?.role === 'labour') {
    return {
      eyebrow: 'WorkLink launcher',
      title: 'Keep labour tools one tap away',
      description: 'Requests, OTP start flow, chat, and profile controls stay easy to reach.',
      searchTo: '/labour/dashboard',
      searchLabel: 'Open labour dashboard',
      searchMeta: 'Review pending jobs, active work, directions, and OTP start',
      actions: [
        {
          label: 'Requests',
          detail: 'Pending and active work',
          to: '/labour/dashboard',
          icon: BriefcaseBusiness,
          tone: 'from-slate-100 via-white to-slate-200',
          accent: 'text-slate-700',
          matchers: ['/labour/dashboard']
        },
        {
          label: 'Chat',
          detail: 'Talk with clients',
          to: '/chat',
          icon: MessageSquare,
          tone: 'from-sky-50 via-white to-sky-100',
          accent: 'text-sky-700',
          matchers: ['/chat']
        },
        {
          label: 'Alerts',
          detail: 'Notifications and updates',
          to: '/notifications',
          icon: CalendarDays,
          tone: 'from-amber-50 via-white to-amber-100',
          accent: 'text-amber-700',
          matchers: ['/notifications']
        },
        {
          label: 'Profile',
          detail: 'Availability and settings',
          to: '/settings',
          icon: UserRound,
          tone: 'from-emerald-50 via-white to-emerald-100',
          accent: 'text-emerald-700',
          matchers: ['/settings', '/complete-profile']
        }
      ]
    };
  }

  if (userProfile?.role === 'admin') {
    return {
      eyebrow: 'Admin launcher',
      title: 'Move through admin controls quickly',
      description: 'Platform oversight, messages, alerts, and account settings stay within reach.',
      searchTo: '/admin',
      searchLabel: 'Open admin overview',
      searchMeta: 'Review marketplace metrics and moderation workflows',
      actions: [
        {
          label: 'Admin',
          detail: 'Platform overview',
          to: '/admin',
          icon: BriefcaseBusiness,
          tone: 'from-slate-100 via-white to-slate-200',
          accent: 'text-slate-700',
          matchers: ['/admin']
        },
        {
          label: 'Chat',
          detail: 'Conversations',
          to: '/chat',
          icon: MessageSquare,
          tone: 'from-sky-50 via-white to-sky-100',
          accent: 'text-sky-700',
          matchers: ['/chat']
        },
        {
          label: 'Alerts',
          detail: 'Notifications',
          to: '/notifications',
          icon: CalendarDays,
          tone: 'from-amber-50 via-white to-amber-100',
          accent: 'text-amber-700',
          matchers: ['/notifications']
        },
        {
          label: 'Account',
          detail: 'Profile settings',
          to: '/settings',
          icon: UserRound,
          tone: 'from-emerald-50 via-white to-emerald-100',
          accent: 'text-emerald-700',
          matchers: ['/settings']
        }
      ]
    };
  }

  return {
    eyebrow: 'WorkLink launcher',
    title: 'Use key hiring features from every screen',
    description: 'Search, bookings, chat, and profile tools now keep the same app-style look on web and mobile.',
    searchTo: '/search',
    searchLabel: 'Search nearby workers',
    searchMeta: 'Explore services, shortlist labour, and start a booking',
    actions: [
      {
        label: 'Services',
        detail: 'Search and discover',
        to: '/search',
        icon: Search,
        tone: 'from-slate-100 via-white to-slate-200',
        accent: 'text-slate-700',
        matchers: ['/search']
      },
      {
        label: 'Bookings',
        detail: 'Track requests and OTP',
        to: '/client/dashboard',
        icon: CalendarDays,
        tone: 'from-amber-50 via-white to-amber-100',
        accent: 'text-amber-700',
        matchers: ['/client/dashboard']
      },
      {
        label: 'Chat',
        detail: 'Talk with workers',
        to: '/chat',
        icon: MessageSquare,
        tone: 'from-sky-50 via-white to-sky-100',
        accent: 'text-sky-700',
        matchers: ['/chat']
      },
      {
        label: 'Profile',
        detail: 'Settings and trust',
        to: '/settings',
        icon: ShieldCheck,
        tone: 'from-emerald-50 via-white to-emerald-100',
        accent: 'text-emerald-700',
        matchers: ['/settings', '/complete-profile']
      }
    ]
  };
};

export const GlobalFeatureLauncher = () => {
  const { pathname } = useLocation();
  const { currentUser, userProfile } = useAuth();
  const launcher = useMemo(
    () => buildLauncherConfig({ currentUser, userProfile }),
    [currentUser, userProfile]
  );
  const primaryPath = currentUser
    ? resolvePostAuthPath({ profile: userProfile })
    : '/';

  return (
    <section className="page-shell pt-4">
      <div className="surface-card overflow-hidden rounded-[34px] border-white/80 bg-white/92 p-4 backdrop-blur-xl md:p-5">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-700">
              {launcher.eyebrow}
            </p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950 md:text-[1.75rem]">
                  {launcher.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {launcher.description}
                </p>
              </div>
              <Link
                to={primaryPath}
                className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-600 hover:text-white md:inline-flex"
              >
                Home
              </Link>
            </div>
          </div>

          <Link
            to={launcher.searchTo}
            className="flex items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-brand-300 hover:bg-white"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-slate-950 text-white">
                <Search size={19} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Open feature
                </span>
                <span className="mt-1 block truncate text-base font-semibold text-slate-950">
                  {launcher.searchLabel}
                </span>
                <span className="mt-1 block text-xs text-slate-500 md:text-sm">
                  {launcher.searchMeta}
                </span>
              </span>
            </div>
            <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-white text-slate-700 shadow-sm">
              <ArrowRight size={18} />
            </span>
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {launcher.actions.map((item) => {
            const Icon = item.icon;
            const isActive = matchesPath(pathname, item.matchers);

            return (
              <Link
                key={item.label}
                to={item.to}
                className={clsx(
                  'rounded-[28px] border border-slate-200 bg-gradient-to-br p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md',
                  item.tone,
                  isActive && 'ring-2 ring-brand-200'
                )}
              >
                <span
                  className={clsx(
                    'grid h-11 w-11 place-items-center rounded-2xl bg-white/92 shadow-sm',
                    item.accent
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="mt-4 block text-sm font-semibold text-slate-950 md:text-base">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 md:text-sm">
                  {item.detail}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
