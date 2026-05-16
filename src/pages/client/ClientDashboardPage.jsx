import { MessageCircle, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LabourCard } from '../../components/cards/LabourCard';
import { QuickBookingDialog } from '../../components/booking/QuickBookingDialog';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { PageSEO } from '../../components/common/PageSEO';
import { SelectField } from '../../components/common/SelectField';
import { Skeleton } from '../../components/common/Skeleton';
import { AppShell } from '../../components/layout/AppShell';
import { MetricsGrid } from '../../components/dashboard/MetricsGrid';
import { useAuth } from '../../context/AuthContext';
import { searchLabours } from '../../services/labourService';
import { subscribeBookingsForUser } from '../../services/bookingService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';
import { getLocationLabel, normalizeCoordinates } from '../../utils/location';

const getBookingTone = (status) => {
  if (status === 'accepted') {
    return 'emerald';
  }

  if (status === 'rejected') {
    return 'rose';
  }

  if (status === 'timed_out') {
    return 'slate';
  }

  if (status === 'completed') {
    return 'blue';
  }

  return 'amber';
};

const ClientDashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [nearbyLabours, setNearbyLabours] = useState([]);
  const [nearbyLaboursLoading, setNearbyLaboursLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [quickBookState, setQuickBookState] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const clientOrigin = useMemo(
    () => normalizeCoordinates(userProfile?.coordinates) || null,
    [userProfile?.coordinates]
  );

  useEffect(() => {
    setNearbyLaboursLoading(true);
    searchLabours({ availability: 'Available' }, clientOrigin)
      .then((items) => setNearbyLabours(items))
      .catch((error) => toast.error(getFirebaseErrorMessage(error)))
      .finally(() => setNearbyLaboursLoading(false));
  }, [clientOrigin]);

  useEffect(() => {
    if (!currentUser) {
      setBookings([]);
      setBookingsLoading(false);
      return undefined;
    }

    setBookingsLoading(true);
    return subscribeBookingsForUser(
      { userId: currentUser.uid, role: 'client' },
      (nextBookings) => {
        setBookings(nextBookings);
        setBookingsLoading(false);
      },
      (error) => {
        setBookingsLoading(false);
        toast.error(getFirebaseErrorMessage(error));
      }
    );
  }, [currentUser?.uid]);

  const serviceOptions = useMemo(
    () =>
      Array.from(
        new Set(nearbyLabours.map((labour) => labour.category).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [nearbyLabours]
  );
  const filteredNearbyLabours = useMemo(
    () =>
      selectedService
        ? nearbyLabours.filter((labour) => labour.category === selectedService)
        : nearbyLabours,
    [nearbyLabours, selectedService]
  );
  const metrics = useMemo(() => {
    const completed = bookings.filter((item) => item.status === 'completed').length;
    const active = bookings.filter((item) => ['pending', 'accepted'].includes(item.status)).length;
    const spend = bookings.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return [
      { label: 'Active bookings', value: active },
      { label: 'Completed services', value: completed },
      { label: 'Available services', value: serviceOptions.length },
      { label: 'Budgeted spend', value: formatCurrency(spend) }
    ];
  }, [bookings, serviceOptions.length]);
  const metricsLoading = bookingsLoading || nearbyLaboursLoading;
  const trackedBookings = useMemo(() => bookings.slice(0, 4), [bookings]);
  const quickBookDefaults = useMemo(
    () => ({
      defaultService: quickBookState?.labour?.category || '',
      defaultBudget: ''
    }),
    [quickBookState?.labour?.category]
  );
  const clientLocationLabel = useMemo(
    () => getLocationLabel(userProfile, { fallback: 'Location not added' }),
    [userProfile]
  );

  const handleQuickBook = (labour) => {
    setQuickBookState({ labour });
  };

  return (
    <AppShell>
      <PageSEO title="Client Dashboard" description="Search labour, manage bookings, track hiring history, and connect with verified workers." />

      <section className="section-space">
        <div className="page-shell">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[28px] sm:rounded-[36px]">
              <div className="grid gap-5 p-4 sm:p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="blue">Client</Badge>
                    <Badge tone="slate">{clientLocationLabel}</Badge>
                  </div>
                  <h1 className="mt-4 break-words font-display text-2xl font-bold text-slate-950 sm:text-3xl md:text-4xl">
                    Hello, {userProfile?.fullName ?? 'Client'}
                  </h1>
                </div>
                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <Button as={Link} to="/search" size="sm" className="w-full sm:w-auto">
                    <Search size={16} />
                    Search Service
                  </Button>
                  <Button as={Link} to="/chat" variant="outline" size="sm" className="w-full sm:w-auto">
                    <MessageCircle size={16} />
                    Chat
                  </Button>
                </div>
              </div>
            </Card>

            <MetricsGrid items={metrics} loading={metricsLoading} />

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                      Services near your location
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Choose from services that currently have available workers.
                    </p>
                  </div>
                  <Badge tone={serviceOptions.length ? 'emerald' : 'slate'}>
                    {nearbyLaboursLoading ? 'Checking' : `${serviceOptions.length} available`}
                  </Badge>
                </div>
                {nearbyLaboursLoading ? (
                  <Skeleton className="mt-5 h-12 w-full" />
                ) : serviceOptions.length ? (
                  <SelectField
                    label="Available service"
                    placeholder="All available services"
                    options={serviceOptions}
                    value={selectedService}
                    className="mt-5"
                    onChange={(event) => setSelectedService(event.target.value)}
                  />
                ) : (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">
                    No service available in your area right now.
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Request tracking</h2>
                <div className="mt-5 space-y-4">
                  {bookingsLoading ? (
                    <>
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </>
                  ) : trackedBookings.length ? (
                    trackedBookings.map((booking) => (
                      <div key={booking.id} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-950 dark:text-white">
                              {booking.serviceType}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {booking.labourName}
                            </p>
                          </div>
                          <Badge tone={getBookingTone(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          {formatDate(booking.appointmentAt)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-brand-700 dark:text-brand-200">
                          Budget: {formatCurrency(booking.amount)}
                        </p>
                        {booking.status === 'accepted' && booking.startOtp ? (
                          <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                              Labour accepted
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-700">
                              Share this OTP after the labour reaches your location.
                            </p>
                            <p className="mt-3 font-display text-2xl font-bold tracking-[0.24em] text-slate-950">
                              {booking.startOtp}
                            </p>
                          </div>
                        ) : null}
                        {booking.status === 'pending' ? (
                          <p className="mt-4 text-sm text-amber-700">
                            Waiting for {booking.labourName} to accept or reject this request.
                          </p>
                        ) : null}
                        {booking.status === 'in_progress' ? (
                          <p className="mt-4 text-sm text-emerald-700">
                            OTP verified. {booking.labourName} is currently working on this job.
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Your pending, accepted, and completed requests will show up here.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                    {selectedService ? `${selectedService} workers` : 'Available workers nearby'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {clientOrigin
                      ? 'Sorted with your saved location when worker GPS is available.'
                      : 'Add GPS in profile to improve nearby matching.'}
                  </p>
                </div>
                <Button as={Link} to="/search" variant="outline" size="sm" className="w-full sm:w-auto">
                  <Search size={16} />
                  Find another service
                </Button>
              </div>
              <div className="mt-4 space-y-2.5">
                {nearbyLaboursLoading ? (
                  <>
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </>
                ) : filteredNearbyLabours.length ? (
                  filteredNearbyLabours.map((labour) => (
                    <LabourCard
                      key={labour.id}
                      labour={labour}
                      compact
                      onQuickBook={handleQuickBook}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="No service available in this area"
                    description="Try another service or update your profile location."
                    action={
                      <Button as={Link} to="/settings" size="sm">
                        Update location
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuickBookingDialog
        isOpen={Boolean(quickBookState?.labour)}
        labour={quickBookState?.labour ?? null}
        candidateLabours={filteredNearbyLabours}
        defaultService={quickBookDefaults.defaultService}
        defaultBudget={quickBookDefaults.defaultBudget}
        onClose={() => setQuickBookState(null)}
      />
    </AppShell>
  );
};

export default ClientDashboardPage;
