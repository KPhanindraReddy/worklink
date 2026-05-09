import { Heart, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LabourCard } from '../../components/cards/LabourCard';
import { QuickBookingDialog } from '../../components/booking/QuickBookingDialog';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageSEO } from '../../components/common/PageSEO';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { AppShell } from '../../components/layout/AppShell';
import { MetricsGrid } from '../../components/dashboard/MetricsGrid';
import { useAuth } from '../../context/AuthContext';
import { fetchFeaturedLabours } from '../../services/labourService';
import { subscribeBookingsForUser } from '../../services/bookingService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const sidebarItems = [
  { to: '/client/dashboard', label: 'Overview' },
  { to: '/search', label: 'Search labour' },
  { to: '/chat', label: 'Chat' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/settings', label: 'Settings' }
];

const getBookingTone = (status) => {
  if (status === 'accepted') {
    return 'emerald';
  }

  if (status === 'rejected') {
    return 'rose';
  }

  if (status === 'completed') {
    return 'blue';
  }

  return 'amber';
};

const ClientDashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [featuredLabours, setFeaturedLabours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [quickBookState, setQuickBookState] = useState(null);

  useEffect(() => {
    fetchFeaturedLabours(6).then((items) => {
      const prioritized = [...items].sort((a, b) => {
        if (a.availability === b.availability) {
          return Number(b.rating || 0) - Number(a.rating || 0);
        }

        if (a.availability === 'Available') {
          return -1;
        }

        if (b.availability === 'Available') {
          return 1;
        }

        return Number(b.rating || 0) - Number(a.rating || 0);
      });

      setFeaturedLabours(prioritized.slice(0, 4));
    });
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setBookings([]);
      return undefined;
    }

    return subscribeBookingsForUser(
      { userId: currentUser.uid, role: 'client' },
      setBookings,
      (error) => toast.error(getFirebaseErrorMessage(error))
    );
  }, [currentUser?.uid]);

  const metrics = useMemo(() => {
    const completed = bookings.filter((item) => item.status === 'completed').length;
    const active = bookings.filter((item) => ['pending', 'accepted'].includes(item.status)).length;
    const spend = bookings.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return [
      { label: 'Active bookings', value: active, hint: 'Pending or accepted appointments' },
      { label: 'Completed hires', value: completed, hint: 'Marked as finished jobs' },
      { label: 'Saved favourites', value: featuredLabours.slice(0, 2).length, hint: 'Starter shortlist' },
      { label: 'Budgeted spend', value: formatCurrency(spend), hint: 'Money planned across requests' }
    ];
  }, [bookings, featuredLabours]);
  const trackedBookings = useMemo(() => bookings.slice(0, 4), [bookings]);
  const quickBookDefaults = useMemo(
    () => ({
      defaultService: quickBookState?.labour?.category || '',
      defaultBudget: quickBookState?.labour?.dailyWage || ''
    }),
    [quickBookState?.labour?.category, quickBookState?.labour?.dailyWage]
  );

  const handleQuickBook = (labour) => {
    setQuickBookState({ labour });
  };

  return (
    <AppShell>
      <PageSEO title="Client Dashboard" description="Search labour, manage bookings, track hiring history, and connect with verified workers." />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[280px_1fr]">
          <DashboardSidebar items={sidebarItems} />

          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[36px]">
              <div className="grid gap-6 p-8 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">
                    Client workspace
                  </p>
                  <h1 className="mt-4 font-display text-4xl font-bold text-slate-950">
                    Welcome, {userProfile?.fullName ?? 'Client'}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                    Search nearby labour, send direct requests, and track acceptance, OTP, and work progress in one place.
                  </p>
                </div>
                <div className="rounded-[28px] bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Primary location</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{userProfile?.location ?? 'Not set yet'}</p>
                </div>
              </div>
            </Card>

            <MetricsGrid items={metrics} />

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Search labour</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Enter the service you need and see available labour nearby.
                    </p>
                  </div>
                  <Badge tone="blue">AI-assisted matching</Badge>
                </div>
                <div className="mt-6 rounded-3xl bg-brand-50 p-5 text-sm leading-7 text-brand-900 dark:bg-brand-500/10 dark:text-brand-100">
                  Search now shows matching available labour directly, so clients do not need a separate request page.
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button as={Link} to="/search">
                    <Search size={16} />
                    Search labour
                  </Button>
                  <Button as={Link} to="/chat" variant="outline">
                    Open chat
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Request tracking</h2>
                <div className="mt-5 space-y-4">
                  {trackedBookings.length ? (
                    trackedBookings.map((booking) => (
                      <div key={booking.id} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between gap-3">
                          <div>
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

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card>
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-600" />
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Recommended labour</h2>
                </div>
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  {featuredLabours.map((labour) => (
                    <LabourCard key={labour.id} labour={labour} onQuickBook={handleQuickBook} />
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-rose-500" />
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Favourite-ready shortlist</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {featuredLabours.slice(0, 3).map((labour) => (
                    <div key={labour.id} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{labour.fullName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{labour.category}</p>
                        </div>
                        <Badge tone="blue">{labour.rating} rating</Badge>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        {formatCurrency(labour.dailyWage)}/day - {labour.currentLocation}
                      </p>
                      <div className="mt-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={labour.availability !== 'Available'}
                          onClick={() => handleQuickBook(labour)}
                        >
                          {labour.availability === 'Available' ? 'Book now' : labour.availability}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <QuickBookingDialog
        isOpen={Boolean(quickBookState?.labour)}
        labour={quickBookState?.labour ?? null}
        defaultService={quickBookDefaults.defaultService}
        defaultBudget={quickBookDefaults.defaultBudget}
        onClose={() => setQuickBookState(null)}
      />
    </AppShell>
  );
};

export default ClientDashboardPage;
