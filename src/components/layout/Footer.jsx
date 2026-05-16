import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="border-t border-slate-200 bg-white py-5">
    <div className="page-shell grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <h3 className="font-display text-lg font-bold text-slate-950">WorkLink</h3>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-600 md:justify-end">
        <Link to="/about">About WorkLink</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/search">Browse labour</Link>
      </div>
    </div>
  </footer>
);
