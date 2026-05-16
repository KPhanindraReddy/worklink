const OAUTH_REDIRECT_CONTEXT_KEY = 'worklink.oauth.redirect';

const getSessionStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch (error) {
    return null;
  }
};

export const storeRedirectContext = (context) => {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(OAUTH_REDIRECT_CONTEXT_KEY, JSON.stringify(context));
  } catch (error) {
    console.warn('WorkLink OAuth redirect context could not be stored:', error);
  }
};

export const readRedirectContext = () => {
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(OAUTH_REDIRECT_CONTEXT_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.warn('WorkLink OAuth redirect context could not be restored:', error);
    return null;
  }
};

export const clearRedirectContext = () => {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(OAUTH_REDIRECT_CONTEXT_KEY);
  } catch (error) {
    console.warn('WorkLink OAuth redirect context could not be cleared:', error);
  }
};

export const getCurrentAppPath = () => {
  if (typeof window === 'undefined') {
    return '/auth';
  }

  const { hash, pathname, search } = window.location;
  return `${pathname}${search}${hash}`;
};
