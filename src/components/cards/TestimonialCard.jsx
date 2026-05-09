import { Star } from 'lucide-react';
import { Card } from '../common/Card';

export const TestimonialCard = ({ testimonial }) => (
  <Card className="h-full">
    <div className="flex items-center gap-1 text-amber-500">
      <Star size={16} fill="currentColor" />
      <span className="text-sm font-semibold">{testimonial.rating}</span>
    </div>
    <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-200">“{testimonial.quote}”</p>
    <div className="mt-6">
      <p className="font-semibold text-slate-950 dark:text-white">{testimonial.name}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
    </div>
  </Card>
);

