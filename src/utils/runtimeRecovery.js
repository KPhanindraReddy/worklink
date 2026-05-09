const RECOVERY_PREFIX = 'worklink-runtime-recovery';

const buildRecoveryKey = (reason) => `${RECOVERY_PREFIX}:${reason}`;

const staleBundlePatterns = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /loading chunk [\w-]+ failed/i,
  /"text\/html" is not a valid javascript mime type/i,
  /'text\/html' is not a valid javascript mime type/i,
  /expected a javascript module script but the server responded/i
];

const invalidTimePatterns = [/invalid time value/i];

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

export const recoverRuntimeApp = (reason) => {
  if (typeof window === 'undefined' || !reason) {
    return false;
  }

  const recoveryKey = buildRecoveryKey(reason);
  const hasRetried = window.sessionStorage.getItem(recoveryKey) === 'done';

  if (hasRetried) {
    return false;
  }

  window.sessionStorage.setItem(recoveryKey, 'done');

  const reloadApp = () => {
    window.location.reload();
  };

  const clearCachesAndReload = async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.allSettled(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
      }
    } catch (cacheError) {
      console.warn('WorkLink cache clear skipped:', cacheError);
    }

    reloadApp();
  };

  const unregisterAndReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(registrations.map((registration) => registration.unregister()));
      }
    } catch (serviceWorkerError) {
      console.warn('WorkLink service worker cleanup skipped:', serviceWorkerError);
    }

    await clearCachesAndReload();
  };

  unregisterAndReload();
  return true;
};
