import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Hammer,
  MapPin,
  MessageSquare,
  Search as SearchIcon,
  ShieldCheck,
  Star,
  Wrench
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LabourCard } from '../components/cards/LabourCard';
import { ServiceCategoryCard } from '../components/cards/ServiceCategoryCard';
import { TestimonialCard } from '../components/cards/TestimonialCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { PageSEO } from '../components/common/PageSEO';
import { SectionHeading } from '../components/common/SectionHeading';
import { Skeleton } from '../components/common/Skeleton';
import { AppShell } from '../components/layout/AppShell';
import { buildBottomDockItems } from '../components/layout/BottomDockNav';
import { HeroSearch } from '../components/home/HeroSearch';
import { useAuth } from '../context/AuthContext';
import {
  heroStats,
  howItWorks,
  serviceCategories,
  testimonials
} from '../data/mockData';
import { fetchFeaturedLabours } from '../services/labourService';
import { resolvePostAuthPath } from '../utils/authFlow';
import { appHighlights } from '../utils/constants';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

const previewRequests = [
  {
    title: 'Electrical inspection',
    detail: 'Panel check, wiring support, and backup setup',
    meta: '10 min avg response',
    icon: ShieldCheck,
    to: '/search?query=Electrician'
  },
  {
    title: 'Plumbing repair',
    detail: 'Leak fixing, fittings replacement, and motor checks',
    meta: 'Same-day booking',
    icon: Wrench,
    to: '/search?query=Plumbing'
  },
  {
    title: 'Carpentry request',
    detail: 'Wardrobe fitting, shelves, and door alignment',
    meta: 'Chat before booking',
    icon: Hammer,
    to: '/search?query=Carpenter'
  }
];

const workflowShortcuts = [
  {
    title: 'Verified profiles',
    detail: 'Identity checks and work history',
    icon: BriefcaseBusiness,
    tone: 'from-slate-100 via-white to-slate-200',
    accent: 'text-slate-700',
    to: ({ currentUser }) => (currentUser ? '/settings' : '/auth?role=labour&mode=signup')
  },
  {
    title: 'Instant chat',
    detail: 'Talk before you confirm a job',
    icon: MessageSquare,
    tone: 'from-sky-50 via-white to-sky-100',
    accent: 'text-sky-700',
    to: ({ currentUser }) => (currentUser ? '/chat' : '/auth?role=client&mode=signup')
  },
  {
    title: 'Booking calendar',
    detail: 'Plan site visits with clear slots',
    icon: CalendarDays,
    tone: 'from-amber-50 via-white to-amber-100',
    accent: 'text-amber-700',
    to: ({ currentUser, userProfile }) =>
      currentUser
        ? userProfile?.role === 'client'
          ? '/client/dashboard'
          : '/search'
        : '/auth?role=client&mode=signup'
  },
  {
    title: 'Nearby workers',
    detail: 'Discover local labour faster',
    icon: MapPin,
    tone: 'from-rose-50 via-white to-rose-100',
    accent: 'text-rose-700',
    to: () => '/search'
  },
  {
    title: 'Ratings and reviews',
    detail: 'See recent client feedback',
    icon: Star,
    tone: 'from-violet-50 via-white to-violet-100',
    accent: 'text-violet-700',
    to: () => '/search'
  },
  {
    title: 'OTP job start',
    detail: 'Secure work-start confirmation',
    icon: ShieldCheck,
    tone: 'from-emerald-50 via-white to-emerald-100',
    accent: 'text-emerald-700',
    to: ({ currentUser, userProfile }) => {
      if (!currentUser) {
        return '/auth';
      }

      if (userProfile?.role === 'labour') {
        return '/labour/dashboard';
      }

      if (userProfile?.role === 'client') {
        return '/client/dashboard';
      }

      return resolvePostAuthPath({ profile: userProfile });
    }
  }
];

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
  const featuredCategoryNames = [
    'Electrician',
    'Plumbing',
    'Carpenter',
    'Painting',
    'AC repair',
    'Cleaner'
  ];
  const featuredCategories = featuredCategoryNames
    .map((name) => serviceCategories.find((category) => category.name === name))
    .filter(Boolean);
  const homepageCategories =
    featuredCategories.length === featuredCategoryNames.length
      ? featuredCategories
      : serviceCategories.slice(0, 6);
  const dockPreviewItems = buildBottomDockItems({ currentUser, userProfile });
  const workflowShortcutLinks = workflowShortcuts.map((item) => ({
    ...item,
    href: item.to({ currentUser, userProfile })
  }));

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

      <section className="relative overflow-hidden section-space pt-8 md:pt-10">
        <div className="app-hero-backdrop absolute inset-0 -z-20" />
        <div className="absolute left-[-120px] top-24 -z-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute right-[-90px] top-10 -z-10 h-60 w-60 rounded-full bg-sky-200/40 blur-3xl" />
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
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                    {item.value}
                  </h3>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {appHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-full max-w-[430px]"
          >
            <div className="absolute inset-0 rounded-[44px] bg-brand-200/30 blur-3xl" />
            <div className="app-phone-shell relative overflow-hidden rounded-[40px] border border-white/80 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
                <div className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm">
                  Clients
                </div>
                <div className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                  Labour partners
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-slate-950 text-white">
                    <SearchIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Search Service
                    </p>
                    <p className="truncate text-base font-semibold text-slate-950">
                      Find verified local labour
                    </p>
                  </div>
                </div>
                <Link
                  to="/search"
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-600 hover:text-white"
                >
                  Open
                </Link>
              </div>

              <div className="mt-5 rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Recent requests</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Designed for fast local hiring and clear trust signals.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Live
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {previewRequests.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.title}
                        to={item.to}
                        className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-3 transition hover:bg-slate-100"
                      >
                        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {item.detail}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                              {item.meta}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-950">For your workflow</h3>
                  <Link
                    to="/search"
                    className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-brand-600 hover:text-white"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {workflowShortcutLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.title}
                        to={item.href}
                        className={clsx(
                          'rounded-[28px] border border-slate-200 bg-gradient-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                          item.tone
                        )}
                      >
                        <div
                          className={clsx(
                            'grid h-11 w-11 place-items-center rounded-2xl bg-white/90 shadow-sm',
                            item.accent
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[30px] bg-gradient-to-r from-slate-950 via-brand-900 to-brand-700 p-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-100">
                  WorkLink Pro
                </p>
                <h3 className="mt-3 max-w-[14rem] font-display text-3xl font-bold leading-tight">
                  Search, chat, and book with confidence
                </h3>
                <p className="mt-3 max-w-[18rem] text-sm leading-6 text-brand-50/90">
                  Professional discovery for electricians, plumbers, painters, carpenters, and
                  more.
                </p>
                <div className="mt-5 inline-flex rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-950">
                  Faster local hiring
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2 rounded-[28px] bg-slate-50 p-2">
                {dockPreviewItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={clsx('rounded-[22px] px-2 py-3 text-center transition', 'hover:bg-white hover:shadow-sm')}
                    >
                      <div
                        className={clsx(
                          'mx-auto grid h-10 w-10 place-items-center rounded-2xl',
                          item.label === 'Home' ? 'bg-slate-950 text-white' : 'text-slate-500'
                        )}
                      >
                        <Icon size={18} />
                      </div>
                      <p
                        className={clsx(
                          'mt-2 min-h-[1.75rem] text-[10px] font-medium leading-tight',
                          item.label === 'Home' ? 'text-slate-950' : 'text-slate-500'
                        )}
                      >
                        {item.label}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-space pt-2">
        <div className="page-shell">
          <div className="surface-card overflow-hidden rounded-[40px] p-6 md:p-8 lg:p-10">
            <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
              <div>
                <SectionHeading
                  eyebrow="Mobile-first experience"
                  title={t('home.sectionTitle')}
                  description="The WorkLink feature area now feels closer to a polished app: search-led, shortcut-driven, and focused on the trust signals clients need before they book."
                />

                <div className="mt-8 grid gap-3">
                  {workflowShortcutLinks.slice(0, 3).map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.title}
                        to={item.href}
                        className="flex items-start gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div
                          className={clsx(
                            'grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br shadow-sm',
                            item.tone,
                            item.accent
                          )}
                        >
                          <Icon size={19} />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-[32px] bg-slate-950 p-6 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-100">
                    Why it works
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-bold leading-tight">
                    Your strongest marketplace features stay visible on smaller screens.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Verified badges, reviews, quick actions, and booking steps are now easier to
                    scan from the very first screen.
                  </p>
                </div>
              </div>

              <div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {homepageCategories.map((category) => (
                    <ServiceCategoryCard key={category.id} category={category} />
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-brand-700 via-brand-600 to-sky-500 p-6 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-50">
                      Professional flow
                    </p>
                    <h3 className="mt-3 font-display text-3xl font-bold leading-tight">
                      Book trusted labour without leaving the conversation.
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-brand-50/90">
                      Search, shortlist, chat, schedule, and confirm job start with OTP-backed
                      trust.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-brand-700">
                      Client and labour ready
                      <ArrowRight size={16} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                    {heroStats.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                          {item.value}
                        </h3>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
          {featuredLabours.length ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredLabours.map((labour) => (
                <LabourCard key={labour.id} labour={labour} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState
                title="No featured labour profiles yet"
                description="Featured labour will appear here after live profiles are added and verified."
              />
            </div>
          )}
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
