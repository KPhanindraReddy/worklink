import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  CircleHelp,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Search,
  X
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { routeByRole } from '../../utils/authFlow';
import { matchesRoutePath } from '../../utils/routeMatching';
import { LiveLocationBadge } from './LiveLocationBadge';

const linkClassName = ({ isActive }) =>
  clsx(
    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
  );

const getProfileInitial = (userProfile, currentUser) =>
  (userProfile?.fullName || currentUser?.displayName || 'U').trim().charAt(0).toUpperCase();

const actionButtonClass = (isActive) =>
  clsx(
    'grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700',
    isActive && 'border-brand-200 bg-brand-50 text-brand-700'
  );

export const Navbar = () => {
  const { pathname } = useLocation();
  const { currentUser, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const primaryPath = currentUser ? routeByRole(userProfile?.role) : '/';
  const profileInitial = getProfileInitial(userProfile, currentUser);
  const profileLabel = userProfile?.role === 'admin' ? 'Admin profile' : 'Profile';

  const baseLinks = currentUser
    ? [
        ...(userProfile?.role === 'client'
          ? [
              {
                to: '/client/dashboard',
                label: 'Overview',
                icon: LayoutDashboard,
                matchers: ['/client/dashboard']
              }
            ]
          : []),
        ...(userProfile?.role === 'labour'
          ? [
              {
                to: '/labour/dashboard',
                label: 'Overview',
                icon: LayoutDashboard,
                matchers: ['/labour/dashboard']
              }
            ]
          : []),
        ...(userProfile?.role === 'admin'
          ? [{ to: '/admin', label: 'Overview', icon: LayoutDashboard, matchers: ['/admin'] }]
          : []),
        {
          to: '/search',
          label: 'Search Service',
          icon: Search,
          matchers: [
            '/search',
            '/booking*',
            (nextPathname) =>
              nextPathname.startsWith('/labour/') && nextPathname !== '/labour/dashboard'
          ]
        },
        { to: '/about', label: 'About', icon: CircleHelp, matchers: ['/about'] }
      ]
    : [
        { to: '/', label: 'Home', icon: LayoutDashboard, matchers: ['/'] },
        {
          to: '/search',
          label: 'Search Service',
          icon: Search,
          matchers: [
            '/search',
            '/booking*',
            (nextPathname) =>
              nextPathname.startsWith('/labour/') && nextPathname !== '/labour/dashboard'
          ]
        },
        { to: '/about', label: 'About', icon: CircleHelp, matchers: ['/about'] }
      ];

  const quickLinks = currentUser
    ? [
        { to: '/notifications', label: 'Notifications', icon: Bell, matchers: ['/notifications'] },
        { to: '/chat', label: 'Chat', icon: MessageCircle, matchers: ['/chat'] }
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to={primaryPath} className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
              <BriefcaseBusiness size={20} />
            </div>
            <p className="font-display text-lg font-bold text-slate-950">WorkLink</p>
          </Link>
          {currentUser ? (
            <LiveLocationBadge
              currentUser={currentUser}
              userProfile={userProfile}
              compact
              className="hidden max-w-[18rem] md:flex"
            />
          ) : null}
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {baseLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={linkClassName({ isActive: matchesRoutePath(pathname, link.matchers) })}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {currentUser ? (
            <>
              {quickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={actionButtonClass(matchesRoutePath(pathname, link.matchers))}
                    aria-label={link.label}
                    title={link.label}
                  >
                    <Icon size={16} />
                  </Link>
                );
              })}
              <Link
                to="/settings"
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 shadow-sm transition hover:border-brand-200',
                  matchesRoutePath(pathname, ['/settings', '/complete-profile*']) &&
                    'border-brand-200 bg-brand-50'
                )}
                aria-label="Open profile"
                title={profileLabel}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {profileInitial}
                </span>
                <span className="hidden max-w-[104px] truncate text-sm font-semibold text-slate-700 xl:block">
                  {userProfile?.fullName || profileLabel}
                </span>
              </Link>
            </>
          ) : (
            <Button as={Link} to="/auth" variant="primary">
              Sign in
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {currentUser ? (
            <>
              {quickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={actionButtonClass(matchesRoutePath(pathname, link.matchers))}
                    aria-label={link.label}
                    title={link.label}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={16} />
                  </Link>
                );
              })}
              <Link
                to="/settings"
                className={clsx(
                  'grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-glow',
                  matchesRoutePath(pathname, ['/settings', '/complete-profile*']) &&
                    'ring-2 ring-brand-200 ring-offset-2'
                )}
                onClick={() => setIsOpen(false)}
                aria-label={`Open ${profileLabel.toLowerCase()}`}
              >
                {profileInitial}
              </Link>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="page-shell space-y-3 border-t border-slate-200 pb-4 pt-3 lg:hidden">
          {currentUser ? (
            <LiveLocationBadge
              currentUser={currentUser}
              userProfile={userProfile}
              className="w-full"
            />
          ) : null}
          <div className="flex flex-col gap-1">
            {baseLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={linkClassName({ isActive: matchesRoutePath(pathname, link.matchers) })}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={15} />
                  {link.label}
                </Link>
              );
            })}
          </div>
          {currentUser ? (
            <Link
              to="/settings"
              className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2"
              onClick={() => setIsOpen(false)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {profileInitial}
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-950">
                  {userProfile?.fullName || profileLabel}
                </span>
                <span className="block text-xs text-slate-500">
                  {userProfile?.role === 'admin' ? 'Admin profile & settings' : 'Profile & settings'}
                </span>
              </span>
            </Link>
          ) : (
            <Button as={Link} to="/auth" className="w-full" onClick={() => setIsOpen(false)}>
              Sign in
            </Button>
          )}
        </div>
      ) : null}
    </header>
  );
};
