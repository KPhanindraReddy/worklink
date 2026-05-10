export const matchesRoutePath = (pathname, matchers = []) =>
  matchers.some((matcher) => {
    if (typeof matcher === 'function') {
      return matcher(pathname);
    }

    if (typeof matcher !== 'string') {
      return false;
    }

    if (matcher.endsWith('*')) {
      return pathname.startsWith(matcher.slice(0, -1));
    }

    return pathname === matcher;
  });
