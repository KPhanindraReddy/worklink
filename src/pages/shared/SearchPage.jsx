import { MapPin, Mic, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LabourCard } from '../../components/cards/LabourCard';
import { QuickBookingDialog } from '../../components/booking/QuickBookingDialog';
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
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import { searchLabours } from '../../services/labourService';
import { resolvePostAuthPath } from '../../utils/authFlow';
import { formatDistanceKm } from '../../utils/formatters';
import { getLocationLabel, normalizeCoordinates } from '../../utils/location';
import { availabilityOptions, workCategories } from '../../utils/constants';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const { currentUser, userProfile } = useAuth();
  const [filters, setFilters] = useState({
    query: searchParams.get('query') ?? '',
    category: searchParams.get('category') ?? '',
    availability: 'Available',
    minRating: '',
    minExperience: '',
    maxPrice: ''
  });
  const [results, setResults] = useState([]);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [quickBookState, setQuickBookState] = useState(null);
  const [searching, setSearching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedFilters = useDebounce(filters, 300);
  const { isListening, startListening } = useVoiceSearch({
    lang: 'en-IN',
    onResult: (value) => setFilters((prev) => ({ ...prev, query: value }))
  });
  const shouldRedirectRole = currentUser && userProfile?.role && userProfile.role !== 'client';
  const savedOrigin = useMemo(
    () => normalizeCoordinates(userProfile?.coordinates) || null,
    [userProfile?.coordinates]
  );
  const savedLocationLabel = useMemo(
    () =>
      getLocationLabel(userProfile, {
        fallback: ''
      }),
    [userProfile]
  );

  useEffect(() => {
    if (shouldRedirectRole) {
      return undefined;
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
      savedOrigin
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
  }, [debouncedFilters, savedOrigin, shouldRedirectRole]);

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
  const availableServiceOptions = useMemo(
    () =>
      Array.from(
        new Set(availableResults.map((labour) => labour.category).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [availableResults]
  );
  const defaultQuickBookService = useMemo(
    () => filters.query.trim() || filters.category || selectedLabour?.category || '',
    [filters.category, filters.query, selectedLabour?.category]
  );

  const handleQuickBook = (labour) => {
    setQuickBookState({
      labour,
      defaultService: filters.query.trim() || filters.category || labour.category || '',
      defaultBudget: filters.maxPrice || ''
    });
  };

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
            description="Choose a service, confirm what is available near your saved location, and book a worker."
          />

          <div className="mt-5 grid gap-4 sm:mt-8 lg:grid-cols-[320px_1fr] lg:gap-6">
            <Card className="h-fit space-y-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between gap-3 text-slate-950 dark:text-white">
                <div className="flex min-w-0 items-center gap-2">
                  <SlidersHorizontal size={18} className="flex-none" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <p className="text-xs text-slate-500 lg:hidden">
                      {filters.query || filters.category || filters.maxPrice
                        ? 'Your filters are active'
                        : 'Tap to narrow results'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  aria-expanded={filtersOpen}
                >
                  {filtersOpen ? 'Hide' : 'Show'}
                </Button>
              </div>

              <div className={filtersOpen ? 'space-y-4 lg:block' : 'hidden space-y-4 lg:block'}>
                <InputField
                  label="Search by skill"
                  value={filters.query}
                  placeholder="Electrician, painter, plumbing..."
                  onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                />
                <Button type="button" variant="outline" className="w-full" onClick={startListening}>
                  <Mic size={16} />
                  {isListening ? 'Listening...' : 'Voice search'}
                </Button>
                <SelectField
                  label="Service"
                  placeholder="Choose a service"
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
                    {savedOrigin
                      ? `Using saved location${savedLocationLabel ? `: ${savedLocationLabel}` : ''}. Results are ranked by distance too.`
                      : currentUser
                        ? 'Save your location once in profile to rank workers by distance.'
                        : 'Sign in and save a location if you want distance-based matching.'}
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-5 sm:space-y-8">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                      Services available near you
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Use the menu to narrow the worker list.
                    </p>
                  </div>
                  <Badge tone={availableServiceOptions.length ? 'emerald' : 'slate'}>
                    {searching ? 'Checking' : `${availableServiceOptions.length} available`}
                  </Badge>
                </div>

                {availableServiceOptions.length ? (
                  <SelectField
                    label="Available service"
                    placeholder="All available services"
                    options={availableServiceOptions}
                    value={filters.category}
                    className="mt-5"
                    onChange={(event) => {
                      const service = event.target.value;
                      setFilters((prev) => ({ ...prev, category: service, query: service }));
                      setSelectedLabour(null);
                    }}
                  />
                ) : (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">
                    No service available in your area right now.
                  </div>
                )}
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
                      </div>
                    </div>
                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                      <Button type="button" className="w-full sm:w-auto" onClick={() => handleQuickBook(selectedLabour)}>
                        Send request
                      </Button>
                      <Button as={Link} to={`/labour/${selectedLabour.id}`} variant="outline" className="w-full sm:w-auto">
                        View full profile
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : null}

              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Nearest available labour</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Pick one worker from this service. The closest available profiles are shown first when GPS is active.
                </p>
                <div className="mt-4 space-y-2.5">
                  {availableResults.length ? (
                    availableResults.map((labour) => (
                      <LabourCard
                        key={labour.id}
                        labour={labour}
                        compact
                        showMatchScore
                        onQuickBook={handleQuickBook}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="Service not available in this locality"
                      description="Try another service or allow location access so WorkLink can search nearby labour more accurately."
                    />
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <QuickBookingDialog
        isOpen={Boolean(quickBookState?.labour)}
        labour={quickBookState?.labour ?? null}
        candidateLabours={availableResults}
        defaultService={quickBookState?.defaultService ?? defaultQuickBookService}
        defaultBudget={quickBookState?.defaultBudget ?? ''}
        onClose={() => setQuickBookState(null)}
      />
    </AppShell>
  );
};

export default SearchPage;
