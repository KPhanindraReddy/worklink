const RECOVERY_PREFIX = 'worklink-runtime-recovery';
const LEGACY_CLEANUP_KEY = 'worklink-legacy-cache-cleanup';
const RECOVERY_SEARCH_PARAM = '__worklink_recovery';
const RECOVERY_TIMESTAMP_PARAM = '__worklink_recovered_at';

const buildRecoveryKey = (reason) => `${RECOVERY_PREFIX}:${reason}`;
const isBrowser = () => typeof window !== 'undefined';

const staleBundlePatterns = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /loading chunk [\w-]+ failed/i,
  /"text\/html" is not a valid javascript mime type/i,
  /'text\/html' is not a valid javascript mime type/i,
  /expected a javascript module script but the server responded/i
];

const invalidTimePatterns = [/invalid time value/i];

const getSafeStorage = (storageName) => {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window[storageName];
  } catch {
    return null;
  }
};

const reloadApp = (reason) => {
  const url = new URL(window.location.href);
  url.searchParams.set(RECOVERY_SEARCH_PARAM, reason);
  url.searchParams.set(RECOVERY_TIMESTAMP_PARAM, String(Date.now()));
  window.location.replace(url.toString());
};

const clearBrowserCaches = async () => {
  if (!('caches' in window)) {
    return;
  }

  const cacheKeys = await window.caches.keys();
  await Promise.allSettled(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
};

const unregisterServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(registrations.map((registration) => registration.unregister()));
};

const cleanupRecoveryParams = () => {
  if (!isBrowser()) {
    return;
  }

  const url = new URL(window.location.href);
  let didChangeUrl = false;

  [RECOVERY_SEARCH_PARAM, RECOVERY_TIMESTAMP_PARAM].forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      didChangeUrl = true;
    }
  });

  if (didChangeUrl) {
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }
};

export const getRuntimeRecoveryReason = (error) => {
  const message = String(error?.message || error || '');

  if (invalidTimePatterns.some((pattern) => pattern.test(message))) {
    return 'invalid-time';
  }

  if (staleBundlePatterns.some((pattern) => pattern.test(message))) {
    return 'stale-bundle';
  }

  return '';
};

export const cleanupLegacyRuntimeState = async () => {
  if (!isBrowser()) {
    return false;
  }

  const storage = getSafeStorage('localStorage');
  const hasCleanedUp = storage?.getItem(LEGACY_CLEANUP_KEY) === 'done';

  if (hasCleanedUp) {
    cleanupRecoveryParams();
    return false;
  }

  cleanupRecoveryParams();

  try {
    await unregisterServiceWorkers();
    await clearBrowserCaches();
    storage?.setItem(LEGACY_CLEANUP_KEY, 'done');
    return true;
  } catch (cleanupError) {
    console.warn('WorkLink legacy cache cleanup skipped:', cleanupError);
    return false;
  }
};

export const recoverRuntimeApp = (reason) => {
  if (!isBrowser() || !reason) {
    return false;
  }

  const recoveryKey = buildRecoveryKey(reason);
  const sessionStorage = getSafeStorage('sessionStorage');
  const hasRetried = sessionStorage?.getItem(recoveryKey) === 'done';

  if (hasRetried) {
    return false;
  }

  sessionStorage?.setItem(recoveryKey, 'done');

  Promise.resolve()
    .then(unregisterServiceWorkers)
    .catch((serviceWorkerError) => {
      console.warn('WorkLink service worker cleanup skipped:', serviceWorkerError);
    })
    .then(clearBrowserCaches)
    .catch((cacheError) => {
      console.warn('WorkLink cache clear skipped:', cacheError);
    })
    .finally(() => {
      reloadApp(reason);
    });

  return true;
};

export const installRuntimeRecovery = () => {
  if (!isBrowser()) {
    return;
  }

  const recoverFrom = (error) => {
    const recoveryReason = getRuntimeRecoveryReason(error);
    return recoverRuntimeApp(recoveryReason);
  };

  cleanupRecoveryParams();
  cleanupLegacyRuntimeState();

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    recoverRuntimeApp('stale-bundle');
  });

  window.addEventListener(
    'error',
    (event) => {
      if (recoverFrom(event.error || event.message)) {
        event.preventDefault?.();
      }
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    if (recoverFrom(event.reason)) {
      event.preventDefault();
    }
  });
};
