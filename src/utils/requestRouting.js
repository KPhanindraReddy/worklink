import { parseDateValue } from './formatters';

export const autoRouteRequestFlows = new Set([
  'client_service_map',
  'quick_book_dialog',
  'quick_book_reroute'
]);

export const activeRouteStatuses = new Set(['pending', 'accepted', 'in_progress']);
export const finalRouteStatuses = new Set(['accepted', 'in_progress', 'completed']);
export const QUICK_REROUTE_TIMEOUT_MS = 30000;
export const SINGLE_LABOUR_TIMEOUT_MS = 5 * 60 * 1000;

const normalizeKey = (value) => String(value ?? '').trim().toLowerCase();

export const createRouteGroupId = (clientId) =>
  `${clientId || 'client'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getRouteGroupKey = (booking) =>
  booking?.routeGroupId || `${booking?.clientId || 'client'}-${normalizeKey(booking?.serviceType)}`;

export const isAutoRoutedBooking = (booking) =>
  booking && autoRouteRequestFlows.has(booking.requestFlow);

export const getBookingAgeMs = (booking, now = Date.now()) => {
  const createdAt = parseDateValue(booking?.createdAt);

  if (!createdAt) {
    return 0;
  }

  return Math.max(0, now - createdAt.getTime());
};

export const getRouteGroupBookings = (bookings, booking) => {
  const groupKey = getRouteGroupKey(booking);

  return bookings.filter((item) => getRouteGroupKey(item) === groupKey);
};

export const routeGroupHasFinalBooking = (bookings, booking) =>
  getRouteGroupBookings(bookings, booking).some((item) => finalRouteStatuses.has(item.status));

export const getAttemptedLabourIds = (bookings, booking) =>
  new Set(
    getRouteGroupBookings(bookings, booking)
      .flatMap((item) => [item.labourId, ...(item.previousLabourIds || [])])
      .filter(Boolean)
  );

export const getNextAvailableLabour = ({ labours, bookings, booking }) => {
  const attemptedLabourIds = getAttemptedLabourIds(bookings, booking);

  return labours.find(
    (labour) => labour.availability === 'Available' && !attemptedLabourIds.has(labour.id)
  );
};
