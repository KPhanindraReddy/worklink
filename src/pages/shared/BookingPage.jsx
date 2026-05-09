import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  LocateFixed,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  RotateCcw,
  Search,
  Send,
  UserCheck
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { BookingCalendar } from '../../components/booking/BookingCalendar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InputField } from '../../components/common/InputField';
import { PageSEO } from '../../components/common/PageSEO';
import { TextAreaField } from '../../components/common/TextAreaField';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { createBooking, subscribeBookingsForUser } from '../../services/bookingService';
import { ensureConversation } from '../../services/chatService';
import { getLabourById, searchLabours } from '../../services/labourService';
import { createNotification } from '../../services/notificationService';
import { workCategories } from '../../utils/constants';
import { formatCurrency, formatDate, formatDistanceKm } from '../../utils/formatters';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const activeWorkStatuses = ['accepted', 'in_progress'];
const generateStartOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const debugBooking = (message, payload = {}) => {
  console.debug(`[WorkLink booking] ${message}`, payload);
};

const getBookingTime = (booking) =>
  booking.appointmentAt
    ? `${formatDate(booking.appointmentAt, 'dd MMM yyyy')} - ${String(booking.appointmentAt)
        .split(' ')
        .slice(-2)
        .join(' ')}`
    : 'Time not selected';

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const labourId = searchParams.get('labourId');
  const initialService = searchParams.get('service') ?? '';
  const initialCategory = searchParams.get('category') ?? '';
  const initialBudget = searchParams.get('budget') ?? '';
  const { currentUser, userProfile } = useAuth();
  const geolocation = useGeolocation(true);
  const [availableLabours, setAvailableLabours] = useState([]);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookings, setBookings] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoRetriedRejectionId, setAutoRetriedRejectionId] = useState('');
  const [formValues, setFormValues] = useState({
    serviceName: initialService,
    serviceDetails: '',
    address: userProfile?.location ?? '',
    budget: initialBudget
  });

  const clientLocation = useMemo(
    () =>
      geolocation.latitude !== null && geolocation.longitude !== null
        ? { latitude: geolocation.latitude, longitude: geolocation.longitude }
        : null,
    [geolocation.latitude, geolocation.longitude]
  );

  useEffect(() => {
    if (!labourId) {
      return;
    }

    getLabourById(labourId).then((labour) => {
      if (labour) {
        setSelectedLabour(labour);
        setAvailableLabours((prev) =>
          prev.some((item) => item.id === labour.id) ? prev : [labour, ...prev]
        );
        setSearched(true);
      }
    });
  }, [labourId]);

  useEffect(() => {
    if (!currentUser || !userProfile?.role) {
      setBookings([]);
      return undefined;
    }

    return subscribeBookingsForUser(
      { userId: currentUser.uid, role: userProfile.role },
      setBookings,
      (error) => toast.error(getFirebaseErrorMessage(error))
    );
  }, [currentUser?.uid, userProfile?.role]);

  useEffect(() => {
    if (userProfile?.location) {
      setFormValues((prev) => ({ ...prev, address: prev.address || userProfile.location }));
    }
  }, [userProfile?.location]);

  useEffect(() => {
    if (!initialCategory || formValues.serviceName.trim()) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      serviceName: initialCategory
    }));
  }, [formValues.serviceName, initialCategory]);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => activeWorkStatuses.includes(booking.status)),
    [bookings]
  );
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending'),
    [bookings]
  );
  const rejectedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'rejected'),
    [bookings]
  );
  const inProgressBooking = useMemo(
    () => bookings.find((booking) => booking.status === 'in_progress') ?? null,
    [bookings]
  );
  const clientIsBusy = Boolean(inProgressBooking);
  const currentService = formValues.serviceName.trim();
  const serviceBookingIds = useMemo(
    () =>
      new Set(
        bookings
          .filter((booking) => booking.serviceType?.toLowerCase() === currentService.toLowerCase())
          .map((booking) => booking.labourId)
      ),
    [bookings, currentService]
  );
  const sortedAvailableLabours = useMemo(
    () =>
      [...availableLabours].sort((a, b) => {
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
    [availableLabours]
  );
  const alternativeLabours = useMemo(
    () => sortedAvailableLabours.filter((labour) => !serviceBookingIds.has(labour.id)),
    [serviceBookingIds, sortedAvailableLabours]
  );
  const hasPendingRequest = pendingBookings.length > 0;

  const canSearch = Boolean(formValues.serviceName.trim() && formValues.address.trim());
  const canRequest = Boolean(
    !clientIsBusy &&
      !hasPendingRequest &&
      selectedLabour &&
      selectedLabour.availability === 'Available' &&
      formValues.serviceName.trim() &&
      formValues.address.trim() &&
      selectedDate &&
      selectedSlot
  );

  const updateFormValue = (key, value) =>
    setFormValues((prev) => ({
      ...prev,
      [key]: value
    }));

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    debugBooking('client bookings updated', {
      userId: currentUser.uid,
      pending: pendingBookings.length,
      active: activeBookings.length,
      rejected: rejectedBookings.length,
      total: bookings.length
    });
  }, [activeBookings.length, bookings.length, currentUser, pendingBookings.length, rejectedBookings.length]);

  const handleServiceSelect = async (service) => {
    setSelectedLabour(null);
    setAvailableLabours([]);
    setSearched(false);
    updateFormValue('serviceName', service);

    if (!formValues.address.trim()) {
      toast.error('Add your address before checking labour availability.');
      return;
    }

    await handleSearchLabour(service);
  };

  const handleSearchLabour = async (serviceOverride) => {
    if (clientIsBusy) {
      toast.error('Complete your current in-progress work before requesting another labour.');
      return;
    }

    const serviceName = serviceOverride || formValues.serviceName;

    if (!serviceName.trim() || !formValues.address.trim()) {
      toast.error('Add service name and address before searching labour.');
      return;
    }

    setSearching(true);
    setSearched(true);
    debugBooking('search started', {
      serviceName,
      address: formValues.address,
      clientLocation,
      budget: formValues.budget
    });

    try {
      const results = await searchLabours(
        {
          skill: serviceName,
          category: workCategories.includes(serviceName) ? serviceName : initialCategory,
          availability: 'Available',
          maxPrice: formValues.budget
        },
        clientLocation
      );

      setAvailableLabours(results);
      setSelectedLabour((prev) => {
        const previousStillAvailable = results.find(
          (item) => item.id === prev?.id && !serviceBookingIds.has(item.id)
        );
        const nearestUntried = results.find((item) => !serviceBookingIds.has(item.id));

        return previousStillAvailable ?? nearestUntried ?? results[0] ?? null;
      });
      debugBooking('search completed', {
        serviceName,
        resultCount: results.length,
        nearestLabour: results[0]?.fullName ?? null
      });

      if (!results.length) {
        toast.error(`${serviceName} is not available in your locality right now.`);
      }
    } catch (error) {
      console.error('[WorkLink booking] search failed', error);
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const latestRejected = rejectedBookings.find(
      (booking) => booking.serviceType?.toLowerCase() === currentService.toLowerCase()
    );

    if (
      !latestRejected ||
      latestRejected.id === autoRetriedRejectionId ||
      hasPendingRequest ||
      searching ||
      !formValues.address.trim()
    ) {
      return;
    }

    setAutoRetriedRejectionId(latestRejected.id);
    debugBooking('labour rejected request, checking next available labour', {
      rejectedBookingId: latestRejected.id,
      rejectedLabourId: latestRejected.labourId,
      serviceType: latestRejected.serviceType
    });
    handleSearchLabour(latestRejected.serviceType);
  }, [
    autoRetriedRejectionId,
    currentService,
    formValues.address,
    hasPendingRequest,
    rejectedBookings,
    searching
  ]);

  const handleOpenChat = async (labour) => {
    if (!currentUser || !labour?.id) {
      return;
    }

    try {
      await ensureConversation({
        currentUserId: currentUser.uid,
        otherUserId: labour.id,
        metadata: {
          currentUserProfile: {
            fullName: userProfile?.fullName,
            role: 'client',
            phoneNumber: userProfile?.phoneNumber || currentUser.phoneNumber || ''
          },
          otherUserProfile: {
            fullName: labour.fullName,
            role: labour.category || 'labour',
            phoneNumber: labour.phoneNumber || '',
            whatsAppLink: labour.phoneNumber
              ? `https://wa.me/${labour.phoneNumber.replace(/\D/g, '')}`
              : ''
          }
        }
      });
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser || userProfile?.role !== 'client') {
      toast.error('Sign in as a client to confirm a service request.');
      return;
    }

    if (!canRequest) {
      toast.error('Choose service, address, date, time, and an available labour before sending.');
      return;
    }

    setSubmitting(true);
    debugBooking('request submit started', {
      labourId: selectedLabour.id,
      labourName: selectedLabour.fullName,
      serviceType: formValues.serviceName,
      location: formValues.address,
      clientLocation
    });

    try {
      const appointmentAt = `${selectedDate} ${selectedSlot}`;
      const bookingId = await createBooking({
        clientId: currentUser.uid,
        clientName: userProfile.fullName,
        clientPhoneNumber: userProfile.phoneNumber || currentUser.phoneNumber || '',
        clientEmail: userProfile.email || currentUser.email || '',
        labourId: selectedLabour.id,
        labourName: selectedLabour.fullName,
        labourPhoneNumber: selectedLabour.phoneNumber || '',
        serviceType: formValues.serviceName,
        serviceDetails: formValues.serviceDetails,
        location: formValues.address,
        coordinates: clientLocation,
        notes: formValues.serviceDetails,
        amount: Number(formValues.budget) || selectedLabour.dailyWage,
        appointmentAt,
        startOtp: generateStartOtp(),
        requestFlow: 'client_service_map'
      });

      let notificationDelivered = true;

      try {
        await createNotification({
          userId: selectedLabour.id,
          senderId: currentUser.uid,
          title: 'New service request',
          body: `${userProfile.fullName} requested ${formValues.serviceName} at ${formValues.address}.`,
          type: 'booking',
          bookingId
        });
      } catch (notificationError) {
        notificationDelivered = false;
        console.warn('WorkLink notification delivery skipped:', notificationError);
      }

      debugBooking('request submitted', {
        bookingId,
        labourId: selectedLabour.id,
        notificationDelivered
      });

      toast.success(
        notificationDelivered
          ? 'Service request sent. Contact unlocks after labour accepts.'
          : 'Service request sent. Open the labour dashboard and notifications after Firestore rules are deployed.'
      );
    } catch (error) {
      console.error('[WorkLink booking] request submit failed', error);
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageSEO
        title="Request Service"
        description="Request nearby labour with location, service details, budget, and acceptance-based contact access."
      />

      <section className="section-space">
        <div className="page-shell space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <Card className="rounded-[28px] border-slate-300 p-6 shadow-sm md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-700">
                      Client request
                    </p>
                    <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">
                      Request service
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-700">
                      Share the work, set the address, find available labour nearby, and send one clear request.
                    </p>
                  </div>
                  <Badge tone={geolocation.error ? 'amber' : 'emerald'}>
                    {geolocation.loading ? 'Finding location' : geolocation.error ? 'Manual location ready' : 'Location ready'}
                  </Badge>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {workCategories.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => handleServiceSelect(service)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        formValues.serviceName === service
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

              {pendingBookings.length ? (
                <Card className="rounded-[28px] border-brand-200 bg-brand-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                        Requesting
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                        Waiting for labour response
                      </h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                        {pendingBookings[0].labourName} received your {pendingBookings[0].serviceType} request.
                      </p>
                    </div>
                    <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-brand-600 text-white shadow-glow">
                      <LoaderCircle size={30} className="animate-spin" />
                    </div>
                  </div>
                </Card>
              ) : null}

              {rejectedBookings.length && alternativeLabours.length ? (
                <Card className="rounded-[28px] border-amber-200 bg-amber-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-amber-950">Previous labour rejected</h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-amber-900">
                        Pick the next nearest available worker for this service.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSelectedLabour(alternativeLabours[0])}
                    >
                      <RotateCcw size={15} />
                      Try next labour
                    </Button>
                  </div>
                </Card>
              ) : null}

              {selectedLabour ? (
                <Card className="rounded-[28px] border-brand-200 bg-brand-50/60 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                        Selected labour
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                        {selectedLabour.fullName}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
                        <Badge tone="emerald">{selectedLabour.availability}</Badge>
                        <Badge tone="slate">{formatDistanceKm(selectedLabour.distanceKm)}</Badge>
                        <Badge tone="blue">{formatCurrency(selectedLabour.dailyWage)}/day</Badge>
                      </div>
                    </div>
                    <Button as={Link} to={`/labour/${selectedLabour.id}`} variant="outline">
                      View profile
                    </Button>
                  </div>
                </Card>
              ) : null}

              {clientIsBusy ? (
                <Card className="rounded-[28px] border-amber-200 bg-amber-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-amber-950">Work in progress</h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-amber-900">
                        {inProgressBooking.labourName} is working on {inProgressBooking.serviceType}. New
                        requests unlock after this job is completed.
                      </p>
                    </div>
                    <Badge tone="amber">Client busy</Badge>
                  </div>
                </Card>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="rounded-[28px] border-slate-300 p-6 shadow-sm md:p-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="Service name"
                      value={formValues.serviceName}
                      onChange={(event) => updateFormValue('serviceName', event.target.value)}
                      placeholder="Electrician, plumbing, painting..."
                    />
                    <InputField
                      label="Budget / amount you can pay"
                      type="number"
                      value={formValues.budget}
                      onChange={(event) => updateFormValue('budget', event.target.value)}
                      placeholder="2500"
                    />
                    <div className="md:col-span-2">
                      <InputField
                        label="Address"
                        value={formValues.address}
                        onChange={(event) => updateFormValue('address', event.target.value)}
                        placeholder="House no, street, area, city"
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (clientLocation) {
                              toast.success('Live coordinates attached to this request.');
                            } else {
                              toast.error(geolocation.error || 'Allow browser location to attach coordinates.');
                            }
                          }}
                        >
                          <LocateFixed size={15} />
                          Use live location
                        </Button>
                        <p className="text-xs font-medium text-slate-600">
                          {clientLocation
                            ? `${clientLocation.latitude.toFixed(5)}, ${clientLocation.longitude.toFixed(5)}`
                            : 'Manual address will still work if GPS is unavailable.'}
                        </p>
                      </div>
                    </div>
                    <TextAreaField
                      label="What is the service?"
                      value={formValues.serviceDetails}
                      onChange={(event) => updateFormValue('serviceDetails', event.target.value)}
                      placeholder="Describe the issue, tools needed, access notes, urgency, and anything the labour should know."
                      className="md:col-span-2"
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button type="button" onClick={() => handleSearchLabour()} disabled={searching || !canSearch || clientIsBusy}>
                      <Search size={16} />
                      {searching ? 'Checking...' : 'Check available labour'}
                    </Button>
                    {selectedLabour ? (
                      <Badge tone="blue" className="px-4 py-2">
                        Selected: {selectedLabour.fullName}
                      </Badge>
                    ) : null}
                  </div>
                </Card>

                <BookingCalendar
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  onDateChange={setSelectedDate}
                  onSlotChange={setSelectedSlot}
                />

                <Button type="submit" size="lg" className="w-full" disabled={submitting || !canRequest}>
                  <Send size={17} />
                  {submitting ? 'Sending request...' : hasPendingRequest ? 'Waiting for labour response' : 'Send request to selected labour'}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <Card className="rounded-[28px] border-slate-300 p-6 shadow-sm md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Available labour</h2>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      Pick one worker after search.
                    </p>
                  </div>
                  <Badge tone="emerald">{sortedAvailableLabours.length} found</Badge>
                </div>

                <div className="mt-5 space-y-4">
                  {sortedAvailableLabours.length ? (
                    sortedAvailableLabours.map((labour) => (
                      <button
                        key={labour.id}
                        type="button"
                        onClick={() => setSelectedLabour(labour)}
                        disabled={hasPendingRequest}
                        className={`w-full rounded-3xl border p-4 text-left transition ${
                          selectedLabour?.id === labour.id
                            ? 'border-brand-500 bg-brand-50'
                            : serviceBookingIds.has(labour.id)
                              ? 'border-amber-200 bg-amber-50'
                              : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex gap-4">
                          <img
                            src={labour.profilePhoto}
                            alt={labour.fullName}
                            className="h-14 w-14 rounded-2xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-slate-950">{labour.fullName}</p>
                              <Badge tone={serviceBookingIds.has(labour.id) ? 'amber' : 'emerald'}>
                                {serviceBookingIds.has(labour.id) ? 'Tried' : labour.availability}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-700">{labour.category}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                              <span>{formatDistanceKm(labour.distanceKm)}</span>
                              <span>{formatCurrency(labour.dailyWage)}/day</span>
                              <span>{labour.rating} rating</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium leading-7 text-slate-700">
                      {searched
                        ? `${formValues.serviceName || 'This service'} is not available in your locality right now.`
                        : 'Search labour after adding service and address.'}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="rounded-[28px] border-slate-300 p-6 shadow-sm md:p-8">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-600" />
                  <h2 className="text-xl font-semibold text-slate-950">Accepted labour</h2>
                </div>

                <div className="mt-5 space-y-4">
                  {activeBookings.length ? (
                    activeBookings.map((booking) => (
                      <div key={booking.id} className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">{booking.labourName}</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">{booking.serviceType}</p>
                          </div>
                          <Badge tone={booking.status === 'in_progress' ? 'blue' : 'emerald'}>
                            {booking.status === 'in_progress' ? 'Working' : 'Accepted'}
                          </Badge>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                          <span className="inline-flex items-center gap-2">
                            <Clock3 size={15} />
                            {getBookingTime(booking)}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPin size={15} />
                            {booking.location}
                          </span>
                        </div>
                        {booking.status === 'accepted' && booking.startOtp ? (
                          <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                            <p className="text-xs font-bold uppercase text-emerald-700">Start OTP</p>
                            <p className="mt-2 font-display text-3xl font-bold tracking-[0.28em] text-slate-950">
                              {booking.startOtp}
                            </p>
                            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
                              Share this OTP only after the labour reaches your location.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl border border-brand-100 bg-white p-4 text-sm font-semibold text-brand-800">
                            OTP verified. This job is in progress and your account is marked busy.
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            as="a"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location || '')}`}
                            target="_blank"
                            rel="noreferrer"
                            size="sm"
                            variant="outline"
                          >
                            <Navigation size={15} />
                            View route
                          </Button>
                          <Button
                            as="a"
                            href={booking.labourPhoneNumber ? `tel:${booking.labourPhoneNumber}` : undefined}
                            size="sm"
                            className={!booking.labourPhoneNumber ? 'pointer-events-none opacity-60' : ''}
                          >
                            <Phone size={15} />
                            Call
                          </Button>
                          <Button
                            as={Link}
                            to="/chat"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleOpenChat({
                                id: booking.labourId,
                                fullName: booking.labourName,
                                category: booking.serviceType
                              })
                            }
                          >
                            <MessageCircle size={15} />
                            Chat
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium leading-7 text-slate-700">
                      Labour phone and chat actions appear here after a worker accepts your request.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="rounded-[28px] border-slate-300 p-6 shadow-sm md:p-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-brand-600" />
                  <h2 className="text-xl font-semibold text-slate-950">Request history</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {bookings.length ? (
                    bookings.map((booking) => (
                      <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-950">{booking.serviceType}</h3>
                            <p className="text-sm font-medium text-slate-600">
                              {booking.labourName} - {booking.location}
                            </p>
                          </div>
                          <Badge tone={booking.status === 'accepted' ? 'emerald' : booking.status === 'rejected' ? 'rose' : 'amber'}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-700">{getBookingTime(booking)}</p>
                        <p className="mt-2 text-sm font-semibold text-brand-700">
                          Budget: {formatCurrency(booking.amount)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-medium text-slate-600">
                      Your requests will appear here after sending.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default BookingPage;
