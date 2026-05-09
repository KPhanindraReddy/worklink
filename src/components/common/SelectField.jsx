export const SelectField = ({ label, options = [], className = '', ...props }) => (
  <label className={`block space-y-2 ${className}`}>
    {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
    <select
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      {...props}
    >
      {props.placeholder ? <option value="">{props.placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value ?? option} value={option.value ?? option}>
          {option.label ?? option}
        </option>
      ))}
    </select>
  </label>
);
