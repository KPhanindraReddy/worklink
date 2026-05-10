import { CalendarDays, LoaderCircle, LocateFixed, MapPin, Send, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { BookingCalendar } from './BookingCalendar';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { TextAreaField } from '../common/TextAreaField';
import { VerificationBadge } from '../common/VerificationBadge';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { createBooking, subscribeBookingsForUser } from '../../services/bookingService';
import { createNotification } from '../../services/notificationService';
import { buildAppointmentDateTime, formatCurrency } from '../../utils/formatters';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';
import { formatCoordinates, getLocationLabel, normalizeCoordinates } from '../../utils/location';

const activeWorkStatuses = ['accepted', 'in_progress'];
const generateStartOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const buildInitialFormValues = ({ labour, userProfile, defaultService, defaultBudget }) => ({
  serviceName: defaultService || labour?.category || '',
  serviceDetails: '',
  address: userProfile?.location || userProfile?.currentLocation || '',
  budget: defaultBudget || labour?.dailyWage || ''
});

export const QuickBookingDialog = ({
  isOpen,
  labour,
  defaultService = '',
  defaultBudget = '',
  onClose
}) => {
  const { currentUser, userProfile } = useAuth();
  const geolocation = useGeolocation();
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState(
    buildInitialFormValues({ labour, userProfile, defaultService, defaultBudget })
  );
  const [requestCoordinates, setRequestCoordinates] = useState(
    () => normalizeCoordinates(userProfile?.coordinates) || null
  );

  const clientLocation = requestCoordinates;
  const isClient = userProfile?.role === 'client';
  const savedLocationLabel = useMemo(
    () => getLocationLabel(userProfile, { fallback: '' }),
    [userProfile]
  );
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending'),
    [bookings]
  );
  const inProgressBooking = useMemo(
    () => bookings.find((booking) => booking.status === 'in_progress') ?? null,
    [bookings]
  );
  const activeBookings = useMemo(
    () => bookings.filter((booking) => activeWorkStatuses.includes(booking.status)),
    [bookings]
  );
  const canSubmit = Boolean(
    isClient &&
      labour &&
      labour.availability === 'Available' &&
      !pendingBookings.length &&
      !inProgressBooking &&
      formValues.serviceName.trim() &&
      formValues.address.trim() &&
      selectedDate &&
      selectedSlot
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setBookings([]);
      setSelectedDate('');
      setSelectedSlot('');
      return;
    }

    setFormValues(buildInitialFormValues({ labour, userProfile, defaultService, defaultBudget }));
    setSelectedDate('');
    setSelectedSlot('');
    setRequestCoordinates(normalizeCoordinates(userProfile?.coordinates) || null);
  }, [
    defaultBudget,
    defaultService,
    isOpen,
    labour,
    userProfile
  ]);

  useEffect(() => {
    if (!isOpen || !currentUser || userProfile?.role !== 'client') {
      setBookings([]);
      return undefined;
    }

    return subscribeBookingsForUser(
      { userId: currentUser.uid, role: 'client' },
      setBookings,
      (error) => toast.error(getFirebaseErrorMessage(error))
    );
  }, [currentUser?.uid, isOpen, userProfile?.role]);

  if (!isOpen || !labour) {
    return null;
  }

  const updateFormValue = (key, value) =>
    setFormValues((prev) => ({
      ...prev,
      [key]: value
    }));

  const handleRefreshLocation = async () => {
    const coordinates = await geolocation.requestLocation({ force: true });

    if (!coordinates) {
      toast.error(geolocation.error || 'Allow browser location to update this request.');
      return;
    }

    setRequestCoordinates(coordinates);
    toast.success('Location updated for this booking.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser || userProfile?.role !== 'client') {
      toast.error('Sign in as a client before sending a booking request.');
      return;
    }

    if (!canSubmit) {
      toast.error('Choose a date, time, service, and address before sending.');
      return;
    }

    setSubmitting(true);

    try {
      const appointmentAt = buildAppointmentDateTime(selectedDate, selectedSlot);
      const bookingId = await createBooking({
        clientId: currentUser.uid,
        clientName: userProfile.fullName || currentUser.displayName || 'Client',
        clientPhoneNumber: userProfile.phoneNumber || currentUser.phoneNumber || '',
        clientEmail: userProfile.email || currentUser.email || '',
        labourId: labour.id,
        labourName: labour.fullName,
        labourPhoneNumber: labour.phoneNumber || '',
        serviceType: formValues.serviceName.trim(),
        serviceDetails: formValues.serviceDetails.trim(),
        location: formValues.address.trim(),
        coordinates: clientLocation,
        notes: formValues.serviceDetails.trim(),
        amount: Number(formValues.budget) || labour.dailyWage || 0,
        appointmentAt,
        startOtp: generateStartOtp(),
        requestFlow: 'quick_book_dialog'
      });

      let notificationDelivered = true;

      try {
        await createNotification({
          userId: labour.id,
          senderId: currentUser.uid,
          title: 'New service request',
          body: `${userProfile.fullName || 'A client'} requested ${formValues.serviceName.trim()} on ${selectedDate} at ${selectedSlot}.`,
          type: 'booking',
          bookingId
        });
      } catch (notificationError) {
        notificationDelivered = false;
        console.warn('WorkLink notification delivery skipped:', notificationError);
      }

      toast.success(
        notificationDelivered
          ? 'Request sent to labour. You will see the OTP after they accept.'
          : 'Request sent. Open labour dashboard and notifications after Firestore rules are deployed.'
      );
      onClose();
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white p-5 shadow-2xl md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-700">Quick booking</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Book {labour.fullName}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Pick a date and time, send the request, and wait for the labour to accept or reject.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close quick booking">
            <X size={18} />
          </Button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-brand-200 bg-brand-50/70 p-5">
              <div className="flex items-start gap-4">
                <img
                  src={labour.profilePhoto}
                  alt={labour.fullName}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-950">{labour.fullName}</p>
                    <VerificationBadge verified={labour.verified} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{labour.category}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge tone="emerald">{labour.availability}</Badge>
                    <Badge tone="blue">{formatCurrency(labour.dailyWage)}/day</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white bg-white/90 p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <MapPin size={15} className="text-brand-600" />
                  Client location
                </div>
                <p className="mt-2 leading-6">
                  The exact route and location are shared on the accepted work card after the labour confirms this request.
                </p>
              </div>
            </div>

            {pendingBookings.length ? (
              <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                You already have a pending request with {pendingBookings[0].labourName}. Wait for that response before sending another one.
              </div>
            ) : null}

            {inProgressBooking ? (
              <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                {inProgressBooking.labourName} is already working on {inProgressBooking.serviceType}. New requests unlock after that job is completed.
              </div>
            ) : null}

            {!currentUser ? (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                Sign in as a client to send a booking request directly from this profile.
                <div className="mt-4">
                  <Button as={Link} to="/auth?role=client&mode=signup" onClick={onClose}>
                    Create client account
                  </Button>
                </div>
              </div>
            ) : null}

            {currentUser && !isClient ? (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                This quick booking flow is only for client accounts.
                <div className="mt-4">
                  <Button as={Link} to="/settings" variant="outline" onClick={onClose}>
                    Open profile
                  </Button>
                </div>
              </div>
            ) : null}

            {labour.availability !== 'Available' ? (
              <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                This labour is currently {labour.availability.toLowerCase()}. Booking will unlock again when the profile becomes available.
              </div>
            ) : null}

            {activeBookings.length ? (
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                Accepted requests and client OTP details stay visible in your client dashboard and request page.
              </div>
            ) : null}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Service"
                value={formValues.serviceName}
                onChange={(event) => updateFormValue('serviceName', event.target.value)}
                placeholder="Electrician, plumbing, painting..."
              />
              <InputField
                label="Budget"
                type="number"
                min="0"
                value={formValues.budget}
                onChange={(event) => updateFormValue('budget', event.target.value)}
                placeholder="2500"
              />
              <InputField
                label="Address"
                value={formValues.address}
                onChange={(event) => updateFormValue('address', event.target.value)}
                placeholder="House no, street, area, city"
                className="md:col-span-2"
              />
              <TextAreaField
                label="Work details"
                value={formValues.serviceDetails}
                onChange={(event) => updateFormValue('serviceDetails', event.target.value)}
                placeholder="Describe the issue, urgency, and any access notes."
                className="md:col-span-2"
              />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <CalendarDays size={16} className="text-brand-600" />
                Request location
              </div>
              <p className="mt-2 leading-6">
                {clientLocation
                  ? `${savedLocationLabel || 'Saved location'} - ${formatCoordinates(clientLocation)}`
                  : geolocation.error || 'Manual address will be used if GPS is unavailable.'}
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshLocation}
                  disabled={geolocation.loading}
                >
                  {geolocation.loading ? <LoaderCircle size={15} className="animate-spin" /> : <LocateFixed size={15} />}
                  {clientLocation ? 'Update live location' : 'Use live location'}
                </Button>
              </div>
            </div>

            <BookingCalendar
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onDateChange={setSelectedDate}
              onSlotChange={setSelectedSlot}
            />

            <Button type="submit" size="lg" className="w-full" disabled={submitting || !canSubmit}>
              {submitting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Sending request...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Send request to labour
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

