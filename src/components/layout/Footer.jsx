import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="border-t border-slate-200 bg-white py-6">
    <div className="page-shell grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
      <div>
        <h3 className="font-display text-xl font-bold text-slate-950">WorkLink</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Nearby labour booking with direct requests, OTP start verification, and clear profile trust signals.
        </p>
      </div>
      <div className="grid gap-2 text-sm text-slate-600 md:justify-items-end">
        <Link to="/about">About WorkLink</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/search">Browse labour</Link>
      </div>
    </div>
  </footer>
);
