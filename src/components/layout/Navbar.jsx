import { Link, NavLink } from 'react-router-dom';
import { BriefcaseBusiness, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { routeByRole } from '../../utils/authFlow';
import { LanguageSwitcher } from './LanguageSwitcher';

const linkClassName = ({ isActive }) =>
  clsx(
    'rounded-full px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:text-slate-950'
  );

const getProfileInitial = (userProfile, currentUser) =>
  (userProfile?.fullName || currentUser?.displayName || 'U').trim().charAt(0).toUpperCase();

export const Navbar = () => {
  const { t } = useTranslation();
  const { currentUser, userProfile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const primaryPath = currentUser ? routeByRole(userProfile?.role) : '/';
  const profileInitial = getProfileInitial(userProfile, currentUser);

  const baseLinks = currentUser ? [] : [{ to: '/', label: t('nav.home') }];

  if (!currentUser) {
    baseLinks.push({ to: '/search', label: t('nav.search') });
  }

  if (userProfile?.role === 'labour') {
    baseLinks.push({ to: '/labour/dashboard', label: t('nav.labour') });
  }

  if (userProfile?.role === 'client') {
    baseLinks.push({ to: '/search', label: t('nav.search') });
    baseLinks.push({ to: '/client/dashboard', label: t('nav.client') });
  }

  if (userProfile?.role === 'admin') {
    baseLinks.push({ to: '/admin', label: t('nav.admin') });
  }

  if (currentUser) {
    baseLinks.push({ to: '/chat', label: t('nav.chat') });
    baseLinks.push({ to: '/notifications', label: t('nav.notifications') });
  }

  baseLinks.push({ to: '/about', label: t('nav.about') });

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-3 py-4">
        <Link to={primaryPath} className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
            <BriefcaseBusiness size={22} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-slate-950">WorkLink</p>
            <p className="text-xs text-slate-500">Hire locally. Work confidently.</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {baseLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClassName}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {currentUser ? (
            <>
              <Link
                to="/settings"
                className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1 pr-4 shadow-sm transition hover:border-brand-300"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {profileInitial}
                </span>
                <span className="text-left">
                  <span className="block max-w-[140px] truncate text-sm font-semibold text-slate-950">
                    {userProfile?.fullName || 'Profile'}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {userProfile?.role || 'Account'}
                  </span>
                </span>
              </Link>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Button as={Link} to="/auth" variant="primary">
              {t('nav.login')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {currentUser ? (
            <Link
              to="/settings"
              className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-glow"
              onClick={() => setIsOpen(false)}
              aria-label="Open profile"
            >
              {profileInitial}
            </Link>
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
          <div className="flex flex-col gap-1">
            {baseLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClassName}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
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
                  {userProfile?.fullName || 'Profile'}
                </span>
                <span className="block text-xs text-slate-500">{userProfile?.role || 'Account'}</span>
              </span>
            </Link>
          ) : null}
          {currentUser ? (
            <Button variant="outline" className="w-full" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Button as={Link} to="/auth" className="w-full" onClick={() => setIsOpen(false)}>
              {t('nav.login')}
            </Button>
          )}
        </div>
      ) : null}
    </header>
  );
};
