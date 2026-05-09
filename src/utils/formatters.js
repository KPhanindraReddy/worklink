import { format, formatDistanceToNow, isValid, parse, parseISO } from 'date-fns';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

const appointmentPatterns = [
  "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  "yyyy-MM-dd'T'HH:mm:ssxxx",
  "yyyy-MM-dd'T'HH:mm:ss",
  'yyyy-MM-dd hh:mm a',
  'yyyy-MM-dd h:mm a',
  'yyyy-MM-dd HH:mm'
];

export const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  if (value?.toDate) {
    const timestampDate = value.toDate();
    return isValid(timestampDate) ? timestampDate : null;
  }

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value === 'number') {
    const numericDate = new Date(value);
    return isValid(numericDate) ? numericDate : null;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const isoDate = parseISO(trimmedValue);
    if (isValid(isoDate)) {
      return isoDate;
    }

    for (const pattern of appointmentPatterns) {
      const parsedDate = parse(trimmedValue, pattern, new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }

    const fallbackDate = new Date(trimmedValue);
    return isValid(fallbackDate) ? fallbackDate : null;
  }

  return null;
};

export const buildAppointmentDateTime = (selectedDate, selectedSlot) => {
  const combinedValue = `${String(selectedDate ?? '').trim()} ${String(selectedSlot ?? '').trim()}`.trim();
  const parsedDate = parseDateValue(combinedValue);

  if (!parsedDate) {
    return combinedValue;
  }

  return parsedDate.toISOString();
};

export const formatDate = (value, pattern = 'dd MMM yyyy, hh:mm a') => {
  if (!value) {
    return 'Not available';
  }

  const date = parseDateValue(value);
  if (!date) {
    return 'Not available';
  }

  return format(date, pattern);
};

export const fromNow = (value) => {
  if (!value) {
    return 'just now';
  }

  const date = parseDateValue(value);
  if (!date) {
    return 'just now';
  }

  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatDistanceKm = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Distance unavailable';
  }

  return `${Number(value).toFixed(1)} km away`;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
