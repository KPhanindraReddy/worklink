export const SectionHeading = ({ eyebrow, title, description, align = 'left' }) => (
  <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
    {eyebrow ? (
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
      {title}
    </h2>
    {description ? (
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    ) : null}
  </div>
);
