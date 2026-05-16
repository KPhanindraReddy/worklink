import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Search as SearchIcon,
  UserRound
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LabourCard } from '../components/cards/LabourCard';
import { ServiceCategoryCard } from '../components/cards/ServiceCategoryCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { PageSEO } from '../components/common/PageSEO';
import { SectionHeading } from '../components/common/SectionHeading';
import { Skeleton } from '../components/common/Skeleton';
import { HeroSearch } from '../components/home/HeroSearch';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { heroStats, serviceCategories } from '../data/mockData';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { resolvePostAuthPath } from '../utils/authFlow';

const featuredCategoryNames = [
  'Electrician',
  'Plumbing',
  'Carpenter',
  'Painting',
  'AC repair',
  'Cleaner'
];

const statLabels = ['Workers', 'Bookings', 'Response'];

const authActions = [
  {
    icon: UserRound,
    label: 'Client login',
    to: '/auth?role=client&mode=login'
  },
  {
    icon: CalendarDays,
    label: 'Client register',
    to: '/auth?role=client&mode=signup'
  },
  {
    icon: BriefcaseBusiness,
    label: 'Labour login',
    to: '/auth?role=labour&mode=login'
  },
  {
    icon: BriefcaseBusiness,
    label: 'Labour register',
    to: '/auth?role=labour&mode=signup'
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
  const homepageCategories = featuredCategoryNames
    .map((name) => serviceCategories.find((category) => category.name === name))
    .filter(Boolean);

  useEffect(() => {
    if (currentUser) {
      return undefined;
    }

    let isActive = true;

    import('../services/labourService')
      .then(({ fetchFeaturedLabours }) => fetchFeaturedLabours())
      .then((labours) => {
        if (isActive) {
          setFeaturedLabours(labours);
        }
      })
      .catch((error) => {
        console.warn('WorkLink featured labour load skipped:', error?.code ?? error?.message ?? error);

        if (isActive) {
          setFeaturedLabours([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentUser]);

  if (currentUser) {
    if (loading) {
      return (
        <AppShell>
          <div className="page-shell py-10">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="mt-4 h-72 w-full" />
          </div>
        </AppShell>
      );
    }

    return <Navigate to={resolvePostAuthPath({ profile: userProfile })} replace />;
  }

  return (
    <AppShell>
      <PageSEO />

      <section className="section-space pt-5 md:pt-6">
        <div className="page-shell grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="surface-card min-w-0 overflow-hidden rounded-2xl p-3 sm:p-5 lg:p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <MapPin size={14} />
              Nearby labour
            </div>
            <h1 className="mt-4 max-w-3xl break-words font-display text-[1.65rem] font-bold leading-[1.15] text-slate-950 sm:text-4xl lg:text-5xl">
              {t('home.title')}
            </h1>
            <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-600 sm:text-base">
              {t('home.subtitle')}
            </p>

            <div className="mt-5">
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

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item, index) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">{statLabels[index]}</p>
                  <p className="mt-1 font-display text-xl font-bold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="surface-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">Start</h2>
              <SearchIcon size={18} className="text-brand-600" />
            </div>
            <div className="mt-4 grid gap-2">
              {authActions.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Icon size={16} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <ArrowRight size={15} />
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <section className="section-space pt-2">
        <div className="page-shell">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading eyebrow="Services" title="Popular services" />
            <Button as={Link} to="/search" variant="outline" size="sm">
              View all
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {homepageCategories.map((category) => (
              <ServiceCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-space pt-2">
        <div className="page-shell">
          <SectionHeading eyebrow="Labour" title="Top rated workers" />
          {featuredLabours.length ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {featuredLabours.slice(0, 4).map((labour) => (
                <LabourCard key={labour.id} labour={labour} compact />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="No worker profiles yet" description="Add labour profiles in Firebase." />
            </div>
          )}
        </div>
      </section>

      <section className="section-space pt-2">
        <div className="page-shell">
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <h2 className="text-xl font-bold">Ready for hiring and work</h2>
            <div className="flex flex-wrap gap-2">
              <Button as={Link} to="/auth?role=client&mode=signup" variant="secondary">
                Client register
              </Button>
              <Button as={Link} to="/auth?role=labour&mode=signup">
                Labour register
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default HomePage;
