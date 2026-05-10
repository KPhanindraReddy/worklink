export const SelectField = ({ label, options = [], className = '', ...props }) => (
  <label className={`block space-y-1.5 ${className}`}>
    {label ? <span className="text-[13px] font-semibold text-slate-700">{label}</span> : null}
    <select
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
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
