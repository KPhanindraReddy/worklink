export const TextAreaField = ({ label, className = '', ...props }) => (
  <label className={`block space-y-2 ${className}`}>
    {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
    <textarea
      className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      {...props}
    />
  </label>
);
