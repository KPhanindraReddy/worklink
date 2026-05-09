import { Heart, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LabourCard } from '../../components/cards/LabourCard';
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
  { to: '/booking', label: 'Request service' },
  { to: '/search', label: 'Search labour' },
  { to: '/chat', label: 'Chat' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/settings', label: 'Settings' }
];

const ClientDashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [featuredLabours, setFeaturedLabours] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchFeaturedLabours(4).then(setFeaturedLabours);
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
                    Shortlist trusted workers, compare ratings and price, book appointments, and manage the full hiring journey from one dashboard.
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
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Request services by budget</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Choose the work, add your location, set the amount you can pay, and send it to a labour professional.
                    </p>
                  </div>
                  <Badge tone="blue">AI-assisted matching</Badge>
                </div>
                <div className="mt-6 rounded-3xl bg-brand-50 p-5 text-sm leading-7 text-brand-900 dark:bg-brand-500/10 dark:text-brand-100">
                  Clients only: service requests include work type, date, location, notes, and budget so labour can accept or reject with clear money expectations.
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button as={Link} to="/booking">
                    Request service
                  </Button>
                  <Button as={Link} to="/search" variant="outline">
                    <Search size={16} />
                    Search labour
                  </Button>
                  <Button as={Link} to="/chat" variant="outline">
                    Open chat
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Hiring history</h2>
                <div className="mt-5 space-y-4">
                  {bookings.length ? (
                    bookings.map((booking) => (
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
                          <Badge tone={booking.status === 'accepted' ? 'emerald' : 'amber'}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          {formatDate(booking.appointmentAt)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-brand-700 dark:text-brand-200">
                          Budget: {formatCurrency(booking.amount)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Your booking and completion history will show up here.
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
                    <LabourCard key={labour.id} labour={labour} />
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
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default ClientDashboardPage;
