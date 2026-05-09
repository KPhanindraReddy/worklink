export const routeByRole = (role) => {
  if (role === 'labour') {
    return '/labour/dashboard';
  }

  if (role === 'client') {
    return '/client/dashboard';
  }

  if (role === 'admin') {
    return '/admin';
  }

  return '/';
};

export const getCompleteProfilePath = (role) =>
  role ? `/complete-profile?role=${encodeURIComponent(role)}` : '/complete-profile';

export const isProfileComplete = (profile) => {
  if (!profile) {
    return false;
  }

  if (profile.role === 'admin') {
    return true;
  }

  return profile.profileComplete === true;
};

export const resolvePostAuthPath = ({ profile, fallbackRole } = {}) => {
  const resolvedRole = profile?.role || fallbackRole;

  if (!resolvedRole) {
    return getCompleteProfilePath();
  }

  if (!isProfileComplete(profile)) {
    return getCompleteProfilePath(resolvedRole);
  }

  return routeByRole(resolvedRole);
};
