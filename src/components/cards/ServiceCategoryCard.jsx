import clsx from 'clsx';
import {
  AirVent,
  ArrowUpRight,
  Building2,
  Camera,
  Hammer,
  Paintbrush,
  PlugZap,
  Sparkles,
  Wrench
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';

const categoryVisuals = {
  Construction: {
    icon: Building2,
    tone: 'from-slate-100 via-white to-slate-200',
    accent: 'text-slate-700',
    note: 'Project support'
  },
  Carpenter: {
    icon: Hammer,
    tone: 'from-amber-50 via-white to-amber-100',
    accent: 'text-amber-700',
    note: 'Woodwork and fittings'
  },
  'AC repair': {
    icon: AirVent,
    tone: 'from-sky-50 via-white to-sky-100',
    accent: 'text-sky-700',
    note: 'Cooling and servicing'
  },
  'CCTV installation': {
    icon: Camera,
    tone: 'from-violet-50 via-white to-violet-100',
    accent: 'text-violet-700',
    note: 'Home and site security'
  },
  Electrician: {
    icon: PlugZap,
    tone: 'from-yellow-50 via-white to-yellow-100',
    accent: 'text-yellow-700',
    note: 'Power and wiring'
  },
  Plumbing: {
    icon: Wrench,
    tone: 'from-cyan-50 via-white to-cyan-100',
    accent: 'text-cyan-700',
    note: 'Leaks and fittings'
  },
  Painting: {
    icon: Paintbrush,
    tone: 'from-rose-50 via-white to-rose-100',
    accent: 'text-rose-700',
    note: 'Interior refresh'
  },
  Cleaner: {
    icon: Sparkles,
    tone: 'from-emerald-50 via-white to-emerald-100',
    accent: 'text-emerald-700',
    note: 'Deep cleaning'
  }
};

const fallbackVisual = {
  icon: Wrench,
  tone: 'from-slate-100 via-white to-slate-200',
  accent: 'text-slate-700',
  note: 'Trusted service'
};

export const ServiceCategoryCard = ({ category }) => {
  const visual = categoryVisuals[category.name] ?? fallbackVisual;
  const Icon = visual.icon;

  return (
    <Link to={`/search?category=${encodeURIComponent(category.name)}`} className="h-full">
      <Card className="group relative h-full overflow-hidden rounded-[30px] border-slate-200 p-0 transition duration-300 hover:-translate-y-1 hover:shadow-glow">
        <div className={clsx('absolute inset-x-0 top-0 h-24 bg-gradient-to-br', visual.tone)} />
        <div className="relative flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div
              className={clsx(
                'grid h-14 w-14 place-items-center rounded-2xl border border-white/80 bg-white/90 shadow-sm',
                visual.accent
              )}
            >
              <Icon size={24} />
            </div>
            <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
              {category.trending ? 'Popular' : 'Service'}
            </span>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-slate-950">{category.name}</h3>
            <p className="mt-2 text-sm text-slate-500">{visual.note}</p>
          </div>

          <div className="mt-auto flex items-end justify-between gap-4 pt-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Active requests
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{category.openRequests}+</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-brand-600">
              <ArrowUpRight size={18} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
