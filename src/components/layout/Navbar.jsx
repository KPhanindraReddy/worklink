import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  UserRound,
  X
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { routeByRole } from '../../utils/authFlow';
import { matchesRoutePath } from '../../utils/routeMatching';
import { LiveLocationBadge } from './LiveLocationBadge';
import { BrandLogo } from './BrandLogo';

const linkClassName = ({ isActive }) =>
  clsx(
    'inline-flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition',
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

const ProfileMenu = ({
  compact = false,
  isActive,
  onLogout,
  profileInitial,
  profileLabel,
  profileName
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className={clsx(
          compact
            ? 'grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-glow'
            : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 shadow-sm transition hover:border-brand-200',
          isActive && (compact ? 'ring-2 ring-brand-200 ring-offset-2' : 'border-brand-200 bg-brand-50')
        )}
        onClick={() => setIsProfileOpen((prev) => !prev)}
        aria-label={`Open ${profileLabel.toLowerCase()} menu`}
        aria-expanded={isProfileOpen}
      >
        <span
          className={clsx(
            'grid place-items-center rounded-full bg-brand-600 text-sm font-bold text-white',
            compact ? 'h-10 w-10' : 'h-8 w-8'
          )}
        >
          {profileInitial}
        </span>
        {!compact ? (
          <span className="hidden max-w-[104px] truncate text-sm font-semibold text-slate-700 xl:block">
            {profileName || profileLabel}
          </span>
        ) : null}
      </button>

      {isProfileOpen ? (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-soft">
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            onClick={() => setIsProfileOpen(false)}
          >
            <UserRound size={16} />
            Profile
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
            onClick={async () => {
              setIsProfileOpen(false);
              await onLogout();
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
};

export const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const primaryPath = currentUser ? routeByRole(userProfile?.role) : '/';
  const profileInitial = getProfileInitial(userProfile, currentUser);
  const profileLabel = userProfile?.role === 'admin' ? 'Admin profile' : 'Profile';
  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/auth', { replace: true });
  };

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
        ...(userProfile?.role === 'client'
          ? [
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
              }
            ]
          : []),
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
      <div className="page-shell relative flex items-center justify-between gap-2 py-2.5 sm:gap-3 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 lg:flex-none lg:justify-start sm:gap-3">
          <BrandLogo
            to={primaryPath}
            onClick={() => setIsOpen(false)}
            showTagline
            className="max-w-[9rem] sm:max-w-none"
          />
          {currentUser ? (
            <LiveLocationBadge
              currentUser={currentUser}
              userProfile={userProfile}
              compact
              className="hidden max-w-[18rem] md:flex"
            />
          ) : null}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
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
                <ProfileMenu
                  compact
                  isActive={matchesRoutePath(pathname, ['/settings', '/complete-profile*'])}
                  onLogout={handleLogout}
                  profileInitial={profileInitial}
                  profileLabel={profileLabel}
                  profileName={userProfile?.fullName}
                />
              </>
            ) : (
              <Button
                as={Link}
                to="/auth?role=client&mode=login"
                size="sm"
                className="hidden px-2.5 sm:inline-flex"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 rounded-full p-0 shadow-sm"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
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
              <ProfileMenu
                isActive={matchesRoutePath(pathname, ['/settings', '/complete-profile*'])}
                onLogout={handleLogout}
                profileInitial={profileInitial}
                profileLabel={profileLabel}
                profileName={userProfile?.fullName}
              />
            </>
          ) : (
            <Button as={Link} to="/auth?role=client&mode=login" variant="primary">
              Sign in
            </Button>
          )}
        </div>

      </div>

      {isOpen ? (
        <div className="page-shell max-h-[calc(100dvh-4.25rem)] space-y-3 overflow-y-auto border-t border-slate-200 pb-4 pt-3 lg:hidden">
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
              className="inline-flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2"
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
            <Button
              as={Link}
              to="/auth?role=client&mode=login"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Sign in
            </Button>
          )}
        </div>
      ) : null}
    </header>
  );
};
