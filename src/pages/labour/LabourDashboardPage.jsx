import {
  Bell,
  CalendarClock,
  IndianRupee,
  LayoutDashboard,
  MapPinned,
  MessageCircle,
  Navigation,
  Phone,
  Settings,
  Star,
  WalletCards
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { Skeleton } from '../../components/common/Skeleton';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { AppShell } from '../../components/layout/AppShell';
import { AvailabilityToggle } from '../../components/dashboard/AvailabilityToggle';
import { MetricsGrid } from '../../components/dashboard/MetricsGrid';
import { useAuth } from '../../context/AuthContext';
import {
  completeBookingWork,
  startBookingWork,
  subscribeBookingsForUser,
  updateBookingStatus
} from '../../services/bookingService';
import { ensureConversation } from '../../services/chatService';
import { subscribeLabourById, updateAvailability } from '../../services/labourService';
import { createNotification } from '../../services/notificationService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';
import { formatCoordinates, getLocationLabel } from '../../utils/location';

const sidebarItems = [
  { to: '/labour/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/recent-services', label: 'Jobs', icon: MapPinned },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings }
];

const buildAvatarUrl = (fullName) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'WorkLink Labour')}&background=1d4ed8&color=ffffff`;

const buildOwnLabourProfile = ({ currentUser, userProfile }) => {
  const fullName = userProfile?.fullName || currentUser?.displayName || 'Your labour profile';
  const currentLocation = getLocationLabel(userProfile, {
    preferCurrent: true,
    fallback: 'Location not set'
  });

  return {
    id: currentUser?.uid ?? '',
    uid: currentUser?.uid ?? '',
    fullName,
    category: userProfile?.category || 'Labour professional',
    currentLocation,
    coordinates: userProfile?.coordinates || null,
    profilePhoto: userProfile?.profilePhoto || currentUser?.photoURL || buildAvatarUrl(fullName),
    phoneNumber: userProfile?.phoneNumber || currentUser?.phoneNumber || '',
    availability: userProfile?.availability || 'Available',
    rating: Number(userProfile?.rating) || 0,
    reviewsCount: Number(userProfile?.reviewsCount) || 0,
    dailyWage: Number(userProfile?.dailyWage) || 0,
    completedJobs: Number(userProfile?.completedJobs) || 0,
    reviews: []
  };
};

const LabourDashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [otpValues, setOtpValues] = useState({});
  const [startingBookingId, setStartingBookingId] = useState('');
  const [completingBookingId, setCompletingBookingId] = useState('');

  const ownProfile = useMemo(
    () => buildOwnLabourProfile({ currentUser, userProfile }),
    [
      currentUser?.displayName,
      currentUser?.phoneNumber,
      currentUser?.photoURL,
      currentUser?.uid,
      userProfile?.availability,
      userProfile?.category,
      userProfile?.completedJobs,
      userProfile?.currentLocation,
      userProfile?.dailyWage,
      userProfile?.fullName,
      userProfile?.location,
      userProfile?.phoneNumber,
      userProfile?.profilePhoto,
      userProfile?.coordinates,
      userProfile?.rating,
      userProfile?.reviewsCount
    ]
  );
  const dashboardProfile = profile ?? ownProfile;
  const dashboardLocationLabel = useMemo(
    () => getLocationLabel(dashboardProfile, { preferCurrent: true, fallback: 'Location not set' }),
    [dashboardProfile]
  );
  const getBookingDestinationDetails = (booking) => {
    const areaLabel = String(booking?.location ?? '').trim();
    const coordinateLabel = formatCoordinates(booking?.coordinates);

    if (areaLabel && coordinateLabel) {
      return {
        primary: areaLabel,
        secondary: coordinateLabel
      };
    }

    return {
      primary: areaLabel || coordinateLabel || 'Location unavailable',
      secondary: ''
    };
  };
  const isProfileMissing = !dashboardLoading && !profile;
  const activeWorkBookings = useMemo(
    () => bookings.filter((booking) => ['accepted', 'in_progress'].includes(booking.status)),
    [bookings]
  );
  const inProgressBooking = useMemo(
    () => bookings.find((booking) => booking.status === 'in_progress') ?? null,
    [bookings]
  );

  useEffect(() => {
    if (!currentUser?.uid) {
      setProfile(null);
      setBookings([]);
      setDashboardLoading(false);
      return undefined;
    }

    let isActive = true;
    let profileLoaded = false;
    let bookingsLoaded = false;

    const markLoaded = () => {
      if (isActive && profileLoaded && bookingsLoaded) {
        setDashboardLoading(false);
      }
    };

    setDashboardLoading(true);
    setProfile(null);
    setBookings([]);

    const unsubscribeProfile = subscribeLabourById(
      currentUser.uid,
      (nextProfile) => {
        if (!isActive) {
          return;
        }

        profileLoaded = true;
        setProfile(nextProfile);
        markLoaded();
      },
      (error) => {
        if (!isActive) {
          return;
        }

        profileLoaded = true;
        toast.error(getFirebaseErrorMessage(error));
        markLoaded();
      }
    );

    const unsubscribeBookings = subscribeBookingsForUser(
      { userId: currentUser.uid, role: 'labour' },
      (nextBookings) => {
        if (!isActive) {
          return;
        }

        bookingsLoaded = true;
        setBookings(nextBookings);
        markLoaded();
      },
      (error) => {
        if (!isActive) {
          return;
        }

        bookingsLoaded = true;
        toast.error(getFirebaseErrorMessage(error));
        markLoaded();
      }
    );

    return () => {
      isActive = false;
      unsubscribeProfile();
      unsubscribeBookings();
    };
  }, [currentUser?.uid]);

  const metrics = useMemo(() => {
    const completedJobs =
      bookings.filter((item) => item.status === 'completed').length || dashboardProfile.completedJobs;
    const pendingRequests = bookings.filter((item) => item.status === 'pending').length;
    const earnings = bookings
      .filter((item) => ['accepted', 'completed'].includes(item.status))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return [
      { label: 'Completed jobs', value: completedJobs, hint: 'Across all recorded work history' },
      { label: 'Pending requests', value: pendingRequests, hint: 'Awaiting your response' },
      {
        label: 'Average rating',
        value: dashboardProfile.rating,
        hint: `${dashboardProfile.reviewsCount} total reviews`
      },
      { label: 'Tracked earnings', value: formatCurrency(earnings), hint: 'Accepted and completed bookings' }
    ];
  }, [bookings, dashboardProfile]);

  const financialSummary = useMemo(() => {
    const pendingAmount = bookings
      .filter((item) => item.status === 'pending')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const acceptedAmount = bookings
      .filter((item) => item.status === 'accepted')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const completedAmount = bookings
      .filter((item) => item.status === 'completed')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return [
      {
        label: 'Pending request value',
        value: formatCurrency(pendingAmount),
        hint: 'Customer requests waiting for your decision'
      },
      {
        label: 'Accepted work value',
        value: formatCurrency(acceptedAmount),
        hint: 'Money expected from accepted bookings'
      },
      {
        label: 'Completed earnings',
        value: formatCurrency(completedAmount),
        hint: 'Finished work recorded in WorkLink'
      }
    ];
  }, [bookings]);

  const handleAvailabilityChange = async (nextAvailability) => {
    if (!currentUser) {
      return;
    }

    if (inProgressBooking && nextAvailability !== 'Busy') {
      toast.error('Complete the active job before changing availability.');
      return;
    }

    if (!profile) {
      toast.error('Complete your labour profile before changing availability.');
      return;
    }

    setProfile((prev) => ({ ...(prev ?? ownProfile), availability: nextAvailability }));
    setUpdatingAvailability(true);

    try {
      await updateAvailability(currentUser.uid, nextAvailability);
      toast.success('Availability updated.');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const buildDirectionsUrl = (booking) => {
    const coordinates = booking.coordinates;

    if (coordinates?.latitude != null && coordinates?.longitude != null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location || '')}`;
  };

  const handleOpenClientChat = async (booking) => {
    if (!currentUser || !booking?.clientId) {
      return;
    }

    try {
      await ensureConversation({
        currentUserId: currentUser.uid,
        otherUserId: booking.clientId,
        metadata: {
          currentUserProfile: {
            fullName: dashboardProfile.fullName,
            role: 'labour',
            phoneNumber: dashboardProfile.phoneNumber
          },
          otherUserProfile: {
            fullName: booking.clientName,
            role: 'client',
            phoneNumber: booking.clientPhoneNumber
          }
        }
      });
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const handleBookingDecision = async (booking, status) => {
    if (!currentUser || booking.labourId !== currentUser.uid) {
      toast.error('This booking does not belong to your labour account.');
      return;
    }

    if (status === 'accepted' && inProgressBooking) {
      toast.error('Complete your current in-progress work before accepting another job.');
      return;
    }

    try {
      await updateBookingStatus(booking.id, status);
      let notificationDelivered = true;

      if (booking.clientId) {
        try {
          await createNotification({
            userId: booking.clientId,
            senderId: currentUser.uid,
            title: status === 'accepted' ? 'Service request accepted' : 'Service request rejected',
            body:
              status === 'accepted'
                ? `${dashboardProfile.fullName} accepted your ${booking.serviceType} request.`
                : `${dashboardProfile.fullName} rejected your ${booking.serviceType} request.`,
            type: 'booking',
            bookingId: booking.id
          });
        } catch (notificationError) {
          notificationDelivered = false;
          console.warn('WorkLink notification delivery skipped:', notificationError);
        }
      }

      toast.success(notificationDelivered ? `Booking ${status}.` : `Booking ${status}. Client alert will appear after Firestore rules are deployed.`);
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const handleOtpChange = (bookingId, value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpValues((prev) => ({ ...prev, [bookingId]: numericValue }));
  };

  const handleStartWork = async (booking) => {
    if (!currentUser || booking.labourId !== currentUser.uid) {
      toast.error('This booking does not belong to your labour account.');
      return;
    }

    const otp = otpValues[booking.id]?.trim();

    if (!/^\d{6}$/.test(otp || '')) {
      toast.error('Enter the 6-digit OTP from the client.');
      return;
    }

    setStartingBookingId(booking.id);

    try {
      await startBookingWork({ bookingId: booking.id, labourId: currentUser.uid, otp });
      setProfile((prev) => (prev ? { ...prev, availability: 'Busy', activeBookingId: booking.id } : prev));
      setOtpValues((prev) => ({ ...prev, [booking.id]: '' }));
      let notificationDelivered = true;

      if (booking.clientId) {
        try {
          await createNotification({
            userId: booking.clientId,
            senderId: currentUser.uid,
            title: 'Work started',
            body: `${dashboardProfile.fullName} started your ${booking.serviceType} work after OTP verification.`,
            type: 'booking',
            bookingId: booking.id
          });
        } catch (notificationError) {
          notificationDelivered = false;
          console.warn('WorkLink notification delivery skipped:', notificationError);
        }
      }

      toast.success(
        notificationDelivered
          ? 'OTP verified. You are marked Busy until this job is completed.'
          : 'OTP verified and work started. Client alert will appear after Firestore rules are deployed.'
      );
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setStartingBookingId('');
    }
  };

  const handleCompleteWork = async (booking) => {
    if (!currentUser || booking.labourId !== currentUser.uid) {
      toast.error('This booking does not belong to your labour account.');
      return;
    }

    setCompletingBookingId(booking.id);

    try {
      await completeBookingWork({ bookingId: booking.id, labourId: currentUser.uid });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              availability: 'Available',
              activeBookingId: '',
              completedJobs: Number(prev.completedJobs || 0) + 1
            }
          : prev
      );

      let notificationDelivered = true;

      if (booking.clientId) {
        try {
          await createNotification({
            userId: booking.clientId,
            senderId: currentUser.uid,
            title: 'Work completed',
            body: `${dashboardProfile.fullName} marked your ${booking.serviceType} work as completed.`,
            type: 'booking',
            bookingId: booking.id
          });
        } catch (notificationError) {
          notificationDelivered = false;
          console.warn('WorkLink notification delivery skipped:', notificationError);
        }
      }

      toast.success(
        notificationDelivered
          ? 'Work completed. Your profile is available for new requests.'
          : 'Work completed. Client alert will appear after Firestore rules are deployed.'
      );
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setCompletingBookingId('');
    }
  };

  if (dashboardLoading) {
    return (
      <AppShell>
        <PageSEO title="Labour Dashboard" description="Manage your labour profile, availability, bookings, work history, and earnings." />

        <section className="section-space">
          <div className="page-shell grid gap-6 xl:grid-cols-[280px_1fr]">
            <DashboardSidebar items={sidebarItems} />

            <div className="space-y-6">
              <Card className="overflow-hidden rounded-[28px]">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-5 h-12 w-72 max-w-full" />
                <Skeleton className="mt-4 h-20 w-full" />
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {['completed', 'pending', 'rating', 'earnings'].map((item) => (
                  <Card key={item}>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-3 h-8 w-20" />
                    <Skeleton className="mt-3 h-4 w-36" />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageSEO title="Labour Dashboard" description="Manage your labour profile, availability, bookings, work history, and earnings." />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[280px_1fr]">
          <DashboardSidebar items={sidebarItems} />

          <div className="space-y-6">
            {dashboardLoading ? (
              <Card className="overflow-hidden rounded-[28px]">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-5 h-12 w-72 max-w-full" />
                <Skeleton className="mt-4 h-20 w-full" />
              </Card>
            ) : null}

            {isProfileMissing ? (
              <Card className="border-amber-200 bg-amber-50">
                <h2 className="text-lg font-semibold text-amber-950">Labour profile needs completion</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  Your dashboard is using only your signed-in account details because no labour profile document was found for this UID.
                </p>
                <Button as={Link} to="/complete-profile?role=labour" size="sm" className="mt-4">
                  Complete labour profile
                </Button>
              </Card>
            ) : null}

            <Card className="overflow-hidden rounded-[36px]">
              <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="blue">{dashboardProfile.category}</Badge>
                    <Badge tone="slate">{dashboardLocationLabel}</Badge>
                  </div>
                  <h1 className="mt-4 font-display text-3xl font-bold text-slate-950 md:text-4xl">
                    {dashboardProfile.fullName}
                  </h1>
                </div>
                <img
                  src={dashboardProfile.profilePhoto}
                  alt={dashboardProfile.fullName}
                  className="h-24 w-24 rounded-[24px] object-cover md:h-28 md:w-28 md:rounded-[28px]"
                />
              </div>
            </Card>

            <MetricsGrid items={metrics} />

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Availability</h2>
                  </div>
                  <Badge tone={dashboardProfile.availability === 'Available' ? 'emerald' : 'amber'}>
                    {updatingAvailability ? 'Updating...' : dashboardProfile.availability}
                  </Badge>
                </div>
                <div className="mt-5">
                  <AvailabilityToggle value={dashboardProfile.availability} onChange={handleAvailabilityChange} />
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Quick summary</h2>
                <div className="mt-5 grid gap-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-3">
                    <Star size={16} className="text-amber-500" />
                    {dashboardProfile.rating} average rating
                  </div>
                  <div className="flex items-center gap-3">
                    <WalletCards size={16} className="text-brand-600" />
                    {formatCurrency(dashboardProfile.dailyWage)}/day expected wage
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarClock size={16} className="text-brand-600" />
                    {bookings.filter((item) => item.status === 'accepted').length} accepted bookings
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPinned size={16} className="text-emerald-600" />
                    {inProgressBooking ? 'Busy on active work' : 'Ready for OTP start'}
                  </div>
                  <div className="flex items-center gap-3">
                    <IndianRupee size={16} className="text-emerald-600" />
                    {dashboardProfile.completedJobs} lifetime completed jobs
                  </div>
                </div>
              </Card>
            </div>

            {activeWorkBookings.length ? (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Accepted and active work</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                      Directions and OTP stay here.
                    </p>
                  </div>
                  <Badge tone={inProgressBooking ? 'amber' : 'emerald'}>
                    {inProgressBooking ? 'Busy' : 'Awaiting OTP'}
                  </Badge>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {activeWorkBookings.map((booking) => {
                    const destinationDetails = getBookingDestinationDetails(booking);

                    return (
                      <div key={booking.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-950 dark:text-white">{booking.serviceType}</h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {booking.clientName} - {booking.location}
                          </p>
                        </div>
                        <Badge tone={booking.status === 'in_progress' ? 'amber' : 'emerald'}>
                          {booking.status === 'in_progress' ? 'In progress' : 'Accepted'}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock size={15} />
                          {formatDate(booking.appointmentAt)}
                        </span>
                        <span className="inline-flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-200">
                          <WalletCards size={15} />
                          {formatCurrency(booking.amount)}
                        </span>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-300 bg-[#f4fbf7] p-4">
                        <div className="relative h-36 overflow-hidden rounded-2xl bg-white">
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(203,213,225,0.3)_1px,transparent_1px),linear-gradient(rgba(203,213,225,0.3)_1px,transparent_1px)] bg-[length:42px_42px]" />
                          <div className="absolute left-[-10%] top-[42%] h-8 w-[120%] rotate-[-10deg] bg-slate-100 shadow-sm" />
                          <div className="absolute left-[48%] top-[-20%] h-[140%] w-8 rotate-[8deg] bg-slate-100 shadow-sm" />
                          <div className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-emerald-600 text-white shadow-soft">
                            <MapPinned size={20} />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">Client destination</p>
                            <p className="mt-1 text-xs font-medium text-slate-600">
                              {destinationDetails.primary}
                            </p>
                            {destinationDetails.secondary ? (
                              <p className="mt-1 text-[11px] font-medium text-slate-500">
                                GPS: {destinationDetails.secondary}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            as="a"
                            href={buildDirectionsUrl(booking)}
                            target="_blank"
                            rel="noreferrer"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Navigation size={15} />
                            Directions
                          </Button>
                        </div>
                      </div>

                      {booking.status === 'accepted' ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                          <InputField
                            label="Client start OTP"
                            inputMode="numeric"
                            maxLength="6"
                            value={otpValues[booking.id] ?? ''}
                            onChange={(event) => handleOtpChange(booking.id, event.target.value)}
                            placeholder="6-digit OTP"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-11"
                            disabled={startingBookingId === booking.id}
                            onClick={() => handleStartWork(booking)}
                          >
                            {startingBookingId === booking.id ? 'Verifying...' : 'Start work'}
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-amber-950">Labour marked busy</p>
                              <p className="mt-1 text-xs font-medium leading-5 text-amber-900">
                                This profile is hidden from available search until work is completed.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              disabled={completingBookingId === booking.id}
                              onClick={() => handleCompleteWork(booking)}
                            >
                              {completingBookingId === booking.id ? 'Completing...' : 'Complete work'}
                            </Button>
                          </div>
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Incoming job requests</h2>
                <div className="mt-5 space-y-4">
                  {bookings.filter((item) => item.status === 'pending').length ? (
                    bookings
                      .filter((item) => item.status === 'pending')
                      .map((booking) => (
                        <div key={booking.id} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                              <h3 className="font-semibold text-slate-950 dark:text-white">
                                {booking.serviceType}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {booking.clientName}
                              </p>
                            </div>
                            <Badge tone="amber">Pending</Badge>
                          </div>
                          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(booking.appointmentAt)}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-brand-700 dark:text-brand-200">
                            Offered budget: {formatCurrency(booking.amount)}
                          </p>
                          {booking.serviceDetails ? (
                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {booking.serviceDetails}
                            </p>
                          ) : null}
                          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-950">Location unlocks after acceptance</p>
                            <p className="mt-2 text-slate-500">
                              Accept to view the route and start OTP.
                            </p>
                          </div>
                          <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
                            <Button
                              size="sm"
                              className="w-full sm:w-auto"
                              disabled={Boolean(inProgressBooking)}
                              onClick={() => handleBookingDecision(booking, 'accepted')}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto"
                              onClick={() => handleBookingDecision(booking, 'rejected')}
                            >
                              Reject
                            </Button>
                            <Button
                              as="a"
                              href={booking.clientPhoneNumber ? `tel:${booking.clientPhoneNumber}` : undefined}
                              size="sm"
                              variant="outline"
                              className={`w-full sm:w-auto ${
                                !booking.clientPhoneNumber ? 'pointer-events-none opacity-60' : ''
                              }`}
                            >
                              <Phone size={15} />
                              Call client
                            </Button>
                            <Button
                              as={Link}
                              to="/chat"
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto"
                              onClick={() => handleOpenClientChat(booking)}
                            >
                              <MessageCircle size={15} />
                              Chat
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      New client requests will show up here in real time.
                    </p>
                  )}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Financial overview</h2>
                <div className="mt-5 space-y-4">
                  {financialSummary.map((item) => (
                    <div key={item.label} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{item.value}</p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.hint}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Reviews & work proof</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {(dashboardProfile.reviews ?? []).map((review) => (
                  <div key={review.id} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                    <p className="font-semibold text-slate-950 dark:text-white">{review.clientName}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default LabourDashboardPage;
