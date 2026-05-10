import { Card } from '../common/Card';

export const StatCard = ({ label, value, hint }) => (
  <Card>
    <p className="text-[13px] text-slate-500 dark:text-slate-400">{label}</p>
    <h3 className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">{value}</h3>
    {hint ? <p className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-300">{hint}</p> : null}
  </Card>
);
