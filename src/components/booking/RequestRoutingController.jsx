import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  createBooking,
  subscribeBookingsForUser,
  timeoutPendingBooking
} from '../../services/bookingService';
import { searchLabours } from '../../services/labourService';
import { createNotification } from '../../services/notificationService';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';
import { normalizeCoordinates } from '../../utils/location';
import {
  QUICK_REROUTE_TIMEOUT_MS,
  SINGLE_LABOUR_TIMEOUT_MS,
  activeRouteStatuses,
  createRouteGroupId,
  getAttemptedLabourIds,
  getBookingAgeMs,
  getNextAvailableLabour,
  getRouteGroupBookings,
  isAutoRoutedBooking,
  routeGroupHasFinalBooking
} from '../../utils/requestRouting';

const generateStartOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const buildNextBookingPayload = ({ booking, currentUser, nextLabour, userProfile }) => ({
  clientId: currentUser.uid,
  clientName: booking.clientName || userProfile?.fullName || currentUser.displayName || 'Client',
  clientPhoneNumber: booking.clientPhoneNumber || userProfile?.phoneNumber || currentUser.phoneNumber || '',
  clientEmail: booking.clientEmail || userProfile?.email || currentUser.email || '',
  labourId: nextLabour.id,
  labourName: nextLabour.fullName,
  labourPhoneNumber: nextLabour.phoneNumber || '',
  serviceType: booking.serviceType || nextLabour.category || '',
  serviceDetails: booking.serviceDetails || booking.notes || '',
  location: booking.location || '',
  coordinates: booking.coordinates || null,
  notes: booking.notes || booking.serviceDetails || '',
  amount: Number(booking.amount) || nextLabour.dailyWage || 0,
  appointmentAt: booking.appointmentAt || new Date().toISOString(),
  requestMode: booking.requestMode || 'scheduled',
  startOtp: generateStartOtp(),
  requestFlow: 'quick_book_reroute',
  routeGroupId: booking.routeGroupId || createRouteGroupId(currentUser.uid),
  reroutedFromBookingId: booking.id,
  previousLabourIds: Array.from(
    new Set([booking.labourId, ...(booking.previousLabourIds || [])].filter(Boolean))
  )
});

export const RequestRoutingController = () => {
  const { currentUser, userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const inFlightRoutes = useRef(new Set());
  const seenLabourPendingIds = useRef(new Set());
  const labourFeedReady = useRef(false);
  const clientOrigin = useMemo(
    () => normalizeCoordinates(userProfile?.coordinates) || null,
    [userProfile?.coordinates]
  );

  useEffect(() => {
    if (!currentUser || !userProfile?.role) {
      setBookings([]);
      labourFeedReady.current = false;
      seenLabourPendingIds.current = new Set();
      return undefined;
    }

    return subscribeBookingsForUser(
      { userId: currentUser.uid, role: userProfile.role },
      setBookings,
      (error) => console.warn('WorkLink routing subscription skipped:', error)
    );
  }, [currentUser?.uid, userProfile?.role]);

  useEffect(() => {
    if (userProfile?.role !== 'labour') {
      return;
    }

    const pendingBookings = bookings.filter((booking) => booking.status === 'pending');

    if (!labourFeedReady.current) {
      pendingBookings.forEach((booking) => seenLabourPendingIds.current.add(booking.id));
      labourFeedReady.current = true;
      return;
    }

    pendingBookings.forEach((booking) => {
      if (seenLabourPendingIds.current.has(booking.id)) {
        return;
      }

      seenLabourPendingIds.current.add(booking.id);
      toast.success(`New request from ${booking.clientName || 'a client'}: ${booking.serviceType}`);
    });
  }, [bookings, userProfile?.role]);

  useEffect(() => {
    if (!currentUser || userProfile?.role !== 'client' || !bookings.length) {
      return undefined;
    }

    let isActive = true;

    const routeBooking = async (booking, reason) => {
      const routeKey = `${booking.id}:${reason}`;

      if (inFlightRoutes.current.has(routeKey) || routeGroupHasFinalBooking(bookings, booking)) {
        return;
      }

      inFlightRoutes.current.add(routeKey);

      try {
        const serviceType = String(booking.serviceType || '').trim();
        const labours = await searchLabours(
          {
            skill: serviceType,
            category: serviceType,
            availability: 'Available',
            maxPrice: booking.amount || ''
          },
          normalizeCoordinates(booking.coordinates) || clientOrigin
        );

        if (!isActive) {
          return;
        }

        const nextLabour = getNextAvailableLabour({ labours, bookings, booking });

        if (!nextLabour) {
          if (booking.status === 'pending' && reason === 'single-timeout') {
            await timeoutPendingBooking({
              bookingId: booking.id,
              clientId: currentUser.uid,
              reason: 'single_labour_no_response'
            });
            toast.error(`${booking.labourName || 'The labour'} did not respond. No other labour is available for ${serviceType}.`);
          }
          return;
        }

        if (booking.status === 'pending') {
          await timeoutPendingBooking({
            bookingId: booking.id,
            clientId: currentUser.uid,
            reason: reason === 'timeout' ? 'no_response_30_seconds' : 'rerouted'
          });
        }

        const bookingId = await createBooking(
          buildNextBookingPayload({ booking, currentUser, nextLabour, userProfile })
        );

        try {
          await createNotification({
            userId: nextLabour.id,
            senderId: currentUser.uid,
            title: 'New service request',
            body: `${userProfile?.fullName || 'A client'} requested ${serviceType}.`,
            type: 'booking',
            bookingId
          });
        } catch (notificationError) {
          console.warn('WorkLink notification delivery skipped:', notificationError);
        }

        toast.success(
          booking.status === 'pending'
            ? `${booking.labourName || 'Labour'} did not respond. Request sent to ${nextLabour.fullName}.`
            : `${booking.labourName || 'Labour'} rejected. Request sent to ${nextLabour.fullName}.`
        );
      } catch (error) {
        toast.error(getFirebaseErrorMessage(error));
      } finally {
        inFlightRoutes.current.delete(routeKey);
      }
    };

    const checkRoutes = async () => {
      const now = Date.now();
      const routableBookings = bookings.filter(isAutoRoutedBooking);
      const routeGroupKeys = new Set();

      for (const booking of routableBookings) {
        const groupKey = booking.routeGroupId || booking.id;

        if (routeGroupKeys.has(groupKey) || routeGroupHasFinalBooking(bookings, booking)) {
          continue;
        }

        routeGroupKeys.add(groupKey);
        const groupBookings = getRouteGroupBookings(bookings, booking);
        const activeBooking = groupBookings.find((item) => activeRouteStatuses.has(item.status));
        const latestRejected = groupBookings.find((item) => item.status === 'rejected');

        if (activeBooking?.status === 'pending') {
          const ageMs = getBookingAgeMs(activeBooking, now);
          const attemptedLabourIds = getAttemptedLabourIds(bookings, activeBooking);
          const searchResults = await searchLabours(
            {
              skill: activeBooking.serviceType,
              category: activeBooking.serviceType,
              availability: 'Available',
              maxPrice: activeBooking.amount || ''
            },
            normalizeCoordinates(activeBooking.coordinates) || clientOrigin
          );
          const hasOtherLabour = searchResults.some((labour) => !attemptedLabourIds.has(labour.id));

          if (hasOtherLabour && ageMs >= QUICK_REROUTE_TIMEOUT_MS) {
            await routeBooking(activeBooking, 'timeout');
          } else if (!hasOtherLabour && ageMs >= SINGLE_LABOUR_TIMEOUT_MS) {
            await routeBooking(activeBooking, 'single-timeout');
          }
        } else if (!activeBooking && latestRejected) {
          await routeBooking(latestRejected, 'rejected');
        }
      }
    };

    checkRoutes();
    const intervalId = window.setInterval(checkRoutes, 5000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [bookings, clientOrigin, currentUser, userProfile]);

  return null;
};
