(function registerLegacyCleanupWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registerCleanupWorker = function () {
    navigator.serviceWorker.register('/sw.js').catch(function (error) {
      console.warn('WorkLink legacy service worker replacement skipped:', error);
    });
  };

  if (document.readyState === 'complete') {
    registerCleanupWorker();
    return;
  }

  window.addEventListener('load', registerCleanupWorker, { once: true });
})();
