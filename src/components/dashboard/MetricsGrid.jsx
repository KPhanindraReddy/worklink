import { StatCard } from '../cards/StatCard';

export const MetricsGrid = ({ items }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {items.map((item) => (
      <StatCard key={item.label} {...item} />
    ))}
  </div>
);

