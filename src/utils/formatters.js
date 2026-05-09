import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

export const formatDate = (value, pattern = 'dd MMM yyyy, hh:mm a') => {
  if (!value) {
    return 'Not available';
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  return format(date, pattern);
};

export const fromNow = (value) => {
  if (!value) {
    return 'just now';
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatDistanceKm = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Distance unavailable';
  }

  return `${Number(value).toFixed(1)} km away`;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

