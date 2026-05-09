export const EmptyState = ({ title, description, action }) => (
  <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
    <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">{description}</p>
    {action}
  </div>
);

