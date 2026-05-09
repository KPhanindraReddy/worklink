import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';

export const ServiceCategoryCard = ({ category }) => (
  <Link to={`/search?category=${encodeURIComponent(category.name)}`}>
    <Card className="group h-full transition hover:-translate-y-1 hover:shadow-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            {category.trending ? 'Trending' : 'Service'}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">{category.name}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {category.openRequests}+ active client requests
          </p>
        </div>
        <ArrowUpRight className="text-slate-400 transition group-hover:text-brand-600" />
      </div>
    </Card>
  </Link>
);

