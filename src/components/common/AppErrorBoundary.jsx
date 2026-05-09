import React from 'react';

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
