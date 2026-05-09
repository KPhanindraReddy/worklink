export const InputField = ({ label, hint, className = '', ...props }) => (
  <label className={`block space-y-2 ${className}`}>
    {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
    <input
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      {...props}
    />
    {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
  </label>
);
