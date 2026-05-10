import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPendingRedirectContext } from '../../services/authService';

const buildAuthResumePath = (context = {}) => {
  if (typeof context.resumePath === 'string' && context.resumePath.startsWith('/')) {
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
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

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
  }, [loading, location.hash, location.pathname, location.search, navigate]);

  return null;
};
