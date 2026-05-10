import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  LayoutDashboard,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Search,
  Settings,
  UserRound
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { AppShell } from '../../components/layout/AppShell';
import { MetricsGrid } from '../../components/dashboard/MetricsGrid';
import {
  banUser,
  getAdminOverview,
  listAdminProfiles,
  verifyLabourAccount
} from '../../services/adminService';
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
  const [labourDirectory, setLabourDirectory] = useState({
    items: [],
    cursor: null,
    hasMore: false,
    loading: false
  });
  const [clientDirectory, setClientDirectory] = useState({
    items: [],
    cursor: null,
    hasMore: false,
    loading: false
  });
  const [filters, setFilters] = useState({
    labour: '',
    client: ''
  });

  const loadOverview = async () => {
    const response = await getAdminOverview();
    setOverview(response);
  };

  const loadDirectory = async (role, { reset = false } = {}) => {
    const state = role === 'client' ? clientDirectory : labourDirectory;
    const setState = role === 'client' ? setClientDirectory : setLabourDirectory;

    setState((prev) => ({
      ...prev,
      loading: true
    }));

    try {
      const response = await listAdminProfiles({
        role,
        cursor: reset ? null : state.cursor
      });

      setState((prev) => ({
        items: reset
          ? response.items
          : [
              ...prev.items,
              ...response.items.filter(
                (item) => !prev.items.some((existingItem) => existingItem.id === item.id)
              )
            ],
        cursor: response.cursor,
        hasMore: response.hasMore,
        loading: false
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false
      }));
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  useEffect(() => {
    loadOverview();
    loadDirectory('labour', { reset: true });
    loadDirectory('client', { reset: true });
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
      setLabourDirectory((prev) => ({
        ...prev,
        items: prev.items.map((labour) =>
          labour.id === labourId
            ? {
                ...labour,
                verified: true
              }
            : labour
        )
      }));
      await loadOverview();
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const handleBan = async (userId, role) => {
    try {
      await banUser({ userId, role });
      toast.success('User status updated to banned.');
      const setState = role === 'client' ? setClientDirectory : setLabourDirectory;
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === userId
            ? {
                ...item,
                accountStatus: 'banned'
              }
            : item
        )
      }));
      await loadOverview();
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const filteredLabours = useMemo(() => {
    const query = filters.labour.trim().toLowerCase();

    if (!query) {
      return labourDirectory.items;
    }

    return labourDirectory.items.filter((labour) =>
      [
        labour.fullName,
        labour.email,
        labour.phoneNumber,
        labour.category,
        getLocationLabel(labour, { preferCurrent: true, fallback: '' })
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [filters.labour, labourDirectory.items]);

  const filteredClients = useMemo(() => {
    const query = filters.client.trim().toLowerCase();

    if (!query) {
      return clientDirectory.items;
    }

    return clientDirectory.items.filter((client) =>
      [
        client.fullName,
        client.email,
        client.phoneNumber,
        getLocationLabel(client, { fallback: '' })
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [clientDirectory.items, filters.client]);

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
                          <VerificationBadge verified={labour.verified} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button size="sm" onClick={() => handleVerify(labour.id)}>
                            Approve ID
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBan(labour.id, 'labour')}>
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

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Labour directory</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Review labour details, verify profiles, and keep moderation hidden inside admin.
                    </p>
                  </div>
                  <Badge tone="blue">{labourDirectory.items.length} loaded</Badge>
                </div>

                <div className="mt-5">
                  <InputField
                    label="Search labour"
                    value={filters.labour}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, labour: event.target.value }))
                    }
                    placeholder="Name, phone, category, area"
                  />
                </div>

                <div className="mt-5 space-y-4">
                  {filteredLabours.length ? (
                    filteredLabours.map((labour) => (
                      <div key={labour.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-950 dark:text-white">{labour.fullName}</h3>
                              <VerificationBadge verified={labour.verified} />
                              <Badge tone={labour.accountStatus === 'banned' ? 'rose' : 'slate'}>
                                {labour.accountStatus || 'active'}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              {labour.category || 'No category'} - {labour.availability || 'Status not set'}
                            </p>
                            <div className="mt-3 grid gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <p className="inline-flex items-center gap-2">
                                <Phone size={14} />
                                {labour.phoneNumber || 'Phone not added'}
                              </p>
                              <p className="inline-flex items-center gap-2">
                                <Mail size={14} />
                                {labour.email || 'Email not added'}
                              </p>
                              <p className="inline-flex items-center gap-2">
                                <MapPin size={14} />
                                {getLocationLabel(labour, { preferCurrent: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {!labour.verified ? (
                            <Button size="sm" onClick={() => handleVerify(labour.id)}>
                              Approve ID
                            </Button>
                          ) : null}
                          <Button as={Link} to={`/labour/${labour.id}`} size="sm" variant="outline">
                            Open profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBan(labour.id, 'labour')}
                          >
                            Ban user
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:text-slate-400">
                      No labour matched this admin search.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Paginated for scale
                  </p>
                  {labourDirectory.hasMore ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => loadDirectory('labour')}
                      disabled={labourDirectory.loading}
                    >
                      {labourDirectory.loading ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />}
                      Load more labour
                    </Button>
                  ) : null}
                </div>
              </Card>

              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Client directory</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Review client contact details and account status without exposing admin routes publicly.
                    </p>
                  </div>
                  <Badge tone="blue">{clientDirectory.items.length} loaded</Badge>
                </div>

                <div className="mt-5">
                  <InputField
                    label="Search clients"
                    value={filters.client}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, client: event.target.value }))
                    }
                    placeholder="Name, phone, area"
                  />
                </div>

                <div className="mt-5 space-y-4">
                  {filteredClients.length ? (
                    filteredClients.map((client) => (
                      <div key={client.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-950 dark:text-white">{client.fullName}</h3>
                              <VerificationBadge verified={client.verified} />
                              <Badge tone={client.accountStatus === 'banned' ? 'rose' : 'slate'}>
                                {client.accountStatus || 'active'}
                              </Badge>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <p className="inline-flex items-center gap-2">
                                <Phone size={14} />
                                {client.phoneNumber || 'Phone not added'}
                              </p>
                              <p className="inline-flex items-center gap-2">
                                <Mail size={14} />
                                {client.email || 'Email not added'}
                              </p>
                              <p className="inline-flex items-center gap-2">
                                <MapPin size={14} />
                                {getLocationLabel(client)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBan(client.id, 'client')}
                          >
                            Ban user
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:text-slate-400">
                      No client matched this admin search.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Paginated for scale
                  </p>
                  {clientDirectory.hasMore ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => loadDirectory('client')}
                      disabled={clientDirectory.loading}
                    >
                      {clientDirectory.loading ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />}
                      Load more clients
                    </Button>
                  ) : null}
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

