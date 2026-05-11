export const InputField = ({ label, hint, className = '', ...props }) => (
  <label className={`block space-y-1.5 ${className}`}>
    {label ? <span className="text-[13px] font-semibold text-slate-700">{label}</span> : null}
    <input
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-500 disabled:shadow-none"
      {...props}
    />
    {hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
  </label>
);
