import { BriefcaseBusiness, MapPin, Mic, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LabourCard } from '../../components/cards/LabourCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { SelectField } from '../../components/common/SelectField';
import { SectionHeading } from '../../components/common/SectionHeading';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import { searchLabours } from '../../services/labourService';
import { resolvePostAuthPath } from '../../utils/authFlow';
import { formatCurrency, formatDistanceKm } from '../../utils/formatters';
import { availabilityOptions, workCategories } from '../../utils/constants';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const { currentUser, userProfile } = useAuth();
  const [filters, setFilters] = useState({
    query: searchParams.get('query') ?? '',
    category: searchParams.get('category') ?? '',
    availability: '',
    minRating: '',
    minExperience: '',
    maxPrice: ''
  });
  const [results, setResults] = useState([]);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [searching, setSearching] = useState(false);
  const debouncedFilters = useDebounce(filters, 300);
  const geolocation = useGeolocation(true);
  const { isListening, startListening } = useVoiceSearch({
    lang: 'en-IN',
    onResult: (value) => setFilters((prev) => ({ ...prev, query: value }))
  });
  const shouldRedirectRole = currentUser && userProfile?.role && userProfile.role !== 'client';

  useEffect(() => {
    if (shouldRedirectRole) {
      return;
    }

    let isActive = true;
    setSearching(true);

    searchLabours(
      {
        skill: debouncedFilters.query,
        category: debouncedFilters.category,
        availability: debouncedFilters.availability,
        minRating: debouncedFilters.minRating,
        minExperience: debouncedFilters.minExperience,
        maxPrice: debouncedFilters.maxPrice
      },
      geolocation
    )
      .then((items) => {
        if (!isActive) {
          return;
        }

        setResults(items);
        setSelectedLabour(
          (prev) =>
            items.find((item) => item.id === prev?.id) ??
            items.find((item) => item.availability === 'Available') ??
            items[0] ??
            null
        );
      })
      .catch(() => {
        if (isActive) {
          setResults([]);
          setSelectedLabour(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setSearching(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [debouncedFilters, geolocation.latitude, geolocation.longitude, shouldRedirectRole]);

  const recommended = useMemo(() => results.slice(0, 3), [results]);
  const availableResults = useMemo(
    () =>
      results
        .filter((labour) => labour.availability === 'Available')
        .sort((a, b) => {
          if (a.distanceKm == null && b.distanceKm == null) {
            return b.rating - a.rating;
          }

          if (a.distanceKm == null) {
            return 1;
          }

          if (b.distanceKm == null) {
            return -1;
          }

          return a.distanceKm - b.distanceKm;
        }),
    [results]
  );
  const visibleServices = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return workCategories.filter((category) => {
      if (!query) {
        return true;
      }

      return category.toLowerCase().includes(query);
    });
  }, [filters.query]);
  const bookingSearchParams = useMemo(() => {
    const nextParams = new URLSearchParams();

    if (selectedLabour?.id) {
      nextParams.set('labourId', selectedLabour.id);
    }

    if (filters.query.trim()) {
      nextParams.set('service', filters.query.trim());
    }

    if (filters.category) {
      nextParams.set('category', filters.category);
    }

    if (filters.maxPrice) {
      nextParams.set('budget', filters.maxPrice);
    }

    return nextParams.toString();
  }, [filters.category, filters.maxPrice, filters.query, selectedLabour?.id]);

  if (shouldRedirectRole) {
    return <Navigate to={resolvePostAuthPath({ profile: userProfile })} replace />;
  }

  return (
    <AppShell>
      <PageSEO
        title="Search labour"
        description="Find skilled labour professionals by category, distance, price, rating, and live availability."
      />

      <section className="section-space">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Discovery"
            title="Search, filter, and shortlist labour in real time"
            description="Use smart filters, voice search, nearby discovery, pricing, and experience sorting to find the right fit quickly."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card className="h-fit space-y-4">
              <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                <SlidersHorizontal size={18} />
                <h3 className="text-lg font-semibold">Filters</h3>
              </div>
              <InputField
                label="Search by skill"
                value={filters.query}
                placeholder="Electrician, painter, plumbing..."
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              />
              <Button type="button" variant="outline" onClick={startListening}>
                <Mic size={16} />
                {isListening ? 'Listening...' : 'Voice search'}
              </Button>
              <SelectField
                label="Category"
                placeholder="All categories"
                options={workCategories}
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              />
              <SelectField
                label="Availability"
                placeholder="Any status"
                options={availabilityOptions}
                value={filters.availability}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, availability: event.target.value }))
                }
              />
              <InputField
                label="Minimum rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(event) => setFilters((prev) => ({ ...prev, minRating: event.target.value }))}
              />
              <InputField
                label="Minimum experience"
                type="number"
                min="0"
                value={filters.minExperience}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, minExperience: event.target.value }))
                }
              />
              <InputField
                label="Maximum daily wage"
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(event) => setFilters((prev) => ({ ...prev, maxPrice: event.target.value }))}
              />
              <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 dark:bg-brand-500/10 dark:text-brand-100">
                <div className="flex items-center gap-2 font-semibold">
                  <MapPin size={16} />
                  Nearby labour
                </div>
                <p className="mt-2">
                  {geolocation.error
                    ? geolocation.error
                    : geolocation.latitude
                      ? 'Location access is active. Results are ranked by distance too.'
                      : 'Allow location in your browser to discover nearby workers faster.'}
                </p>
              </div>
            </Card>

            <div className="space-y-8">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                      Available services
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Choose a service first, then request the nearest available worker.
                    </p>
                  </div>
                  <Badge tone="blue">{visibleServices.length} services</Badge>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleServices.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, category: service, query: service }));
                        setSelectedLabour(null);
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        filters.category === service
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                          <BriefcaseBusiness size={17} />
                        </span>
                        <span className="font-semibold text-slate-950">{service}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {selectedLabour ? (
                <Card className="border-brand-200 bg-brand-50/60">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                        Selected labour
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                        {selectedLabour.fullName}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
                        <Badge tone="emerald">{selectedLabour.availability}</Badge>
                        <Badge tone="slate">{formatDistanceKm(selectedLabour.distanceKm)}</Badge>
                        <Badge tone="blue">{formatCurrency(selectedLabour.dailyWage)}/day</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button as={Link} to={`/booking?${bookingSearchParams}`}>
                        Request this labour
                      </Button>
                      <Button as={Link} to={`/labour/${selectedLabour.id}`} variant="outline">
                        View full profile
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : null}

              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Nearest available labour</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Pick one worker from this service. The closest workers are shown first when GPS is available.
                </p>
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  {availableResults.length ? (
                    availableResults.map((labour) => (
                      <LabourCard key={labour.id} labour={labour} showMatchScore />
                    ))
                  ) : (
                    <div className="xl:col-span-2">
                      <EmptyState
                        title="Service not available in this locality"
                        description="Try another service or allow location access so WorkLink can search nearby labour more accurately."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Recommended profiles</h3>
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  {results.length ? (
                    results.map((labour) => <LabourCard key={labour.id} labour={labour} showMatchScore />)
                  ) : (
                    <div className="xl:col-span-2">
                      <EmptyState
                        title="No labour matched these filters"
                        description="Try widening the price range, removing a category filter, or searching with fewer keywords."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default SearchPage;
