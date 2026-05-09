import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="border-t border-slate-200 bg-white py-10">
    <div className="page-shell grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
      <div>
        <h3 className="font-display text-2xl font-bold text-slate-950">WorkLink</h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
          A modern labour marketplace for verified professionals, instant hiring, transparent work
          history, and multilingual access across web and mobile screens.
        </p>
      </div>
      <div className="grid gap-3 text-sm text-slate-600">
        <Link to="/about">About WorkLink</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/search">Browse labour</Link>
      </div>
    </div>
  </footer>
);
