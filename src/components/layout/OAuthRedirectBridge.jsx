import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPendingRedirectContext } from '../../services/authService';

const isAuthResumePath = (path) =>
  path === '/auth' || path.startsWith('/auth?') || path.startsWith('/auth#');

const buildAuthResumePath = (context = {}) => {
  if (typeof context.resumePath === 'string' && isAuthResumePath(context.resumePath)) {
    return context.resumePath;
  }

  const params = new URLSearchParams();

  if (context.role) {
    params.set('role', context.role);
  }

  if (context.mode) {
    params.set('mode', context.mode);
  }

  const query = params.toString();
  return query ? `/auth?${query}` : '/auth';
};

export const OAuthRedirectBridge = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pendingContext = getPendingRedirectContext();

    if (!pendingContext || location.pathname === '/auth') {
      return;
    }

    const expectedPath = buildAuthResumePath(pendingContext);
    const currentPath = `${location.pathname}${location.search}${location.hash}`;

    if (currentPath === expectedPath) {
      return;
    }

    navigate(expectedPath, { replace: true });
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
};
