import React from 'react';

const INVALID_TIME_RECOVERY_KEY = 'worklink-invalid-time-recovery';

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('WorkLink runtime error:', error);

    if (
      typeof window === 'undefined' ||
      !/invalid time value/i.test(String(error?.message || error))
    ) {
      return;
    }

    const hasRetried = window.sessionStorage.getItem(INVALID_TIME_RECOVERY_KEY) === 'done';

    if (hasRetried) {
      return;
    }

    window.sessionStorage.setItem(INVALID_TIME_RECOVERY_KEY, 'done');

    const reloadApp = () => {
      window.location.reload();
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.allSettled(registrations.map((registration) => registration.unregister()))
        )
        .finally(reloadApp);
      return;
    }

    reloadApp();
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-white px-6 py-16 text-slate-900">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h1 className="text-3xl font-bold">WorkLink hit a runtime error</h1>
            <p className="mt-4 text-sm text-slate-600">
              The page did not load correctly. The error message is shown below so we can fix it quickly.
            </p>
            {/invalid time value/i.test(String(this.state.error?.message || this.state.error)) ? (
              <p className="mt-3 text-sm text-amber-700">
                WorkLink already tried one automatic refresh for this cached date issue. If this screen stays here, refresh the page once more.
              </p>
            ) : null}
            <pre className="mt-6 overflow-auto rounded-2xl bg-slate-50 p-4 text-sm text-slate-800">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
