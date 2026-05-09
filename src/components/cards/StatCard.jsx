import { Card } from '../common/Card';

export const StatCard = ({ label, value, hint }) => (
  <Card>
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <h3 className="mt-3 font-display text-3xl font-bold text-slate-950 dark:text-white">{value}</h3>
    {hint ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{hint}</p> : null}
  </Card>
);

