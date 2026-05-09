import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LabourCard } from '../components/cards/LabourCard';
import { ServiceCategoryCard } from '../components/cards/ServiceCategoryCard';
import { StatCard } from '../components/cards/StatCard';
import { TestimonialCard } from '../components/cards/TestimonialCard';
import { Button } from '../components/common/Button';
import { PageSEO } from '../components/common/PageSEO';
import { SectionHeading } from '../components/common/SectionHeading';
import { Skeleton } from '../components/common/Skeleton';
import { AppShell } from '../components/layout/AppShell';
import { HeroSearch } from '../components/home/HeroSearch';
import { useAuth } from '../context/AuthContext';
import {
  heroStats,
  howItWorks,
  mockCategories,
  testimonials
} from '../data/mockData';
import { fetchFeaturedLabours } from '../services/labourService';
import { resolvePostAuthPath } from '../utils/authFlow';
import { appHighlights } from '../utils/constants';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userProfile, loading } = useAuth();
  const [query, setQuery] = useState('');
  const [featuredLabours, setFeaturedLabours] = useState([]);
  const { isListening, startListening } = useVoiceSearch({
    lang: 'en-IN',
    onResult: setQuery
  });

  useEffect(() => {
    if (currentUser) {
      return;
    }

    fetchFeaturedLabours().then(setFeaturedLabours);
  }, [currentUser]);

  if (loading) {
    return (
      <AppShell>
        <div className="page-shell py-16">
          <Skeleton className="h-12 w-56" />
          <Skeleton className="mt-4 h-80 w-full" />
        </div>
      </AppShell>
    );
  }

  if (currentUser) {
    return <Navigate to={resolvePostAuthPath({ profile: userProfile })} replace />;
  }

  return (
    <AppShell>
      <PageSEO />

      <section className="relative overflow-hidden section-space">
        <div className="page-shell grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
              <ShieldCheck size={16} />
              {t('home.badge')}
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-slate-950 dark:text-white md:text-6xl">
              {t('home.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              {t('home.subtitle')}
            </p>
            <div className="mt-8">
              <HeroSearch
                query={query}
                onQueryChange={setQuery}
                onSearch={(event) => {
                  event.preventDefault();
                  navigate(`/search?query=${encodeURIComponent(query)}`);
                }}
                onVoiceSearch={startListening}
                isListening={isListening}
                placeholder={t('home.searchPlaceholder')}
              />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/auth?role=labour&mode=signup" size="lg">
                {t('home.primaryCta')}
                <ArrowRight size={16} />
              </Button>
              <Button as={Link} to="/auth?role=client&mode=signup" variant="outline" size="lg">
                {t('home.secondaryCta')}
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-[36px] p-6"
          >
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              {heroStats.map((item) => (
                <StatCard key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                <TrendingUp size={16} />
                Marketplace pulse
              </div>
              <h3 className="mt-4 font-display text-3xl font-bold text-slate-950">
                Faster hiring with live availability, reviews, and chat.
              </h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {appHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Popular services"
            title={t('home.sectionTitle')}
            description="Explore the categories clients book most often across electrical, plumbing, interiors, cleaning, repairs, and skilled on-site support."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mockCategories.slice(0, 6).map((category) => (
              <ServiceCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Top rated labour"
            title="Verified workers clients keep hiring again"
            description="Rich profiles, transparent pricing, multilingual communication, and work history make shortlisting much easier."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredLabours.map((labour) => (
              <LabourCard key={labour.id} labour={labour} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Simple workflow"
            title={t('home.howTitle')}
            description="From profile verification to bookings and reviews, every workflow is tailored for labour marketplaces."
            align="center"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step.id} className="surface-card p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 font-display text-lg font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                  0{index + 1}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Testimonials"
            title="Built for real local hiring pressure"
            description="Clients need responsive workers. Labour professionals need better visibility and fewer dead leads."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <TestimonialCard key={item.id} testimonial={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell">
          <div className="surface-card overflow-hidden rounded-[36px] p-8 md:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">
                  Launch ready
                </p>
                <h2 className="mt-4 font-display text-4xl font-bold text-slate-950">
                  Production-ready Firebase stack with responsive dashboards and PWA support.
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  WorkLink is structured for hosting, security rules, multilingual UX, profile verification, and real-time updates from day one.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button as={Link} to="/auth?role=labour&mode=signup" size="lg">
                  Become a labour partner
                </Button>
                <Button as={Link} to="/search" variant="outline" size="lg">
                  Explore labour
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default HomePage;
