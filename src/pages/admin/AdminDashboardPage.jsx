import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, LayoutDashboard, Settings, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageSEO } from '../../components/common/PageSEO';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { AppShell } from '../../components/layout/AppShell';
import { MetricsGrid } from '../../components/dashboard/MetricsGrid';
import { getAdminOverview, verifyLabourAccount, banUser } from '../../services/adminService';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';
import { getLocationLabel } from '../../utils/location';

const sidebarItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Admin Profile', icon: Settings }
];

const AdminDashboardPage = () => {
  const [overview, setOverview] = useState({
    analytics: {},
    categories: [],
    pendingLabours: []
  });

  const loadOverview = async () => {
    const response = await getAdminOverview();
    setOverview(response);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const metrics = useMemo(
    () => [
      { label: 'Users', value: overview.analytics.userCount ?? 0, hint: 'Total users on the platform' },
      { label: 'Labour accounts', value: overview.analytics.labourCount ?? 0, hint: 'Registered labour profiles' },
      { label: 'Active bookings', value: overview.analytics.activeBookings ?? 0, hint: 'Current live booking volume' },
      {
        label: 'Pending verifications',
        value: overview.analytics.pendingVerifications ?? 0,
        hint: 'Manual review queue'
      }
    ],
    [overview.analytics]
  );

  const handleVerify = async (labourId) => {
    try {
      await verifyLabourAccount(labourId);
      toast.success('Labour profile verified.');
      await loadOverview();
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const handleBan = async (userId) => {
    try {
      await banUser(userId);
      toast.success('User status updated to banned.');
      await loadOverview();
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  return (
    <AppShell>
      <PageSEO title="Admin Dashboard" description="Manage WorkLink users, verification, reports, analytics, and marketplace operations." />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[280px_1fr]">
          <DashboardSidebar items={sidebarItems} />

          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[36px]">
              <div className="flex flex-wrap items-start justify-between gap-4 p-8">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="blue">Admin</Badge>
                    <Badge tone="slate">Operations</Badge>
                  </div>
                  <h1 className="mt-4 font-display text-3xl font-bold text-slate-950 md:text-4xl">
                    Marketplace overview
                  </h1>
                </div>
                <Button as={Link} to="/settings" size="sm">
                  <UserRound size={16} />
                  Open admin profile
                </Button>
              </div>
            </Card>

            <MetricsGrid items={metrics} />

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Pending labour verification</h2>
                <div className="mt-5 space-y-4">
                  {overview.pendingLabours.length ? (
                    overview.pendingLabours.map((labour) => (
                      <div key={labour.id} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-950 dark:text-white">{labour.fullName}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {labour.category} - {getLocationLabel(labour, { preferCurrent: true })}
                            </p>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              {labour.experienceYears} years experience - {labour.skills?.join(', ')}
                            </p>
                          </div>
                          <Badge tone="amber">Needs review</Badge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button size="sm" onClick={() => handleVerify(labour.id)}>
                            Approve ID
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBan(labour.id)}>
                            Ban user
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No pending labour verifications right now.
                    </p>
                  )}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Category management</h2>
                <div className="mt-5 space-y-3">
                  {overview.categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50"
                    >
                      <div>
                        <p className="font-medium text-slate-950 dark:text-white">{category.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {category.openRequests} open requests
                        </p>
                      </div>
                      <Badge tone={category.trending ? 'blue' : 'slate'}>
                        {category.trending ? 'Trending' : 'Stable'}
                      </Badge>
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

export default AdminDashboardPage;
