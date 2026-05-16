export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const localDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?\s*(AM|PM)?)?$/i;

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());
const pad2 = (value) => String(value).padStart(2, '0');

const parseLocalDateTime = (value) => {
  const match = localDateTimePattern.exec(value);

  if (!match) {
    return null;
  }

  const [
    ,
    yearValue,
    monthValue,
    dayValue,
    hourValue = '0',
    minuteValue = '0',
    secondValue = '0',
    millisecondValue = '0',
    periodValue
  ] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  let hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const millisecond = Number(millisecondValue.padEnd(3, '0'));

  if (periodValue) {
    const period = periodValue.toUpperCase();
    hour %= 12;

    if (period === 'PM') {
      hour += 12;
    }
  }

  const date = new Date(year, month - 1, day, hour, minute, second, millisecond);

  if (
    !isValidDate(date) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
};

const formatWithPattern = (date, pattern) => {
  const hours = date.getHours();
  const hour12 = hours % 12 || 12;
  const tokens = {
    yyyy: String(date.getFullYear()),
    MMM: shortMonths[date.getMonth()],
    MM: pad2(date.getMonth() + 1),
    dd: pad2(date.getDate()),
    HH: pad2(hours),
    hh: pad2(hour12),
    mm: pad2(date.getMinutes()),
    ss: pad2(date.getSeconds()),
    a: hours >= 12 ? 'PM' : 'AM'
  };

  return pattern.replace(/yyyy|MMM|MM|dd|HH|hh|mm|ss|a/g, (token) => tokens[token] ?? token);
};

export const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  if (value?.toDate) {
    const timestampDate = value.toDate();
    return isValidDate(timestampDate) ? timestampDate : null;
  }

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === 'object' && Number.isFinite(value.seconds)) {
    const timestampDate = new Date(
      Number(value.seconds) * 1000 + Math.floor(Number(value.nanoseconds || 0) / 1000000)
    );
    return isValidDate(timestampDate) ? timestampDate : null;
  }

  if (typeof value === 'number') {
    const numericDate = new Date(value);
    return isValidDate(numericDate) ? numericDate : null;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const localDate = parseLocalDateTime(trimmedValue);
    if (localDate) {
      return localDate;
    }

    const fallbackDate = new Date(trimmedValue);
    return isValidDate(fallbackDate) ? fallbackDate : null;
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

  return formatWithPattern(date, pattern);
};

export const fromNow = (value) => {
  if (!value) {
    return 'just now';
  }

  const date = parseDateValue(value);
  if (!date) {
    return 'just now';
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffSeconds);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ];
  const [unit, secondsPerUnit] = units.find(([, seconds]) => absoluteSeconds >= seconds) ?? [
    'second',
    1
  ];
  const valueInUnit = Math.round(diffSeconds / secondsPerUnit);

  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(valueInUnit, unit);
};

export const formatDistanceKm = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Distance unavailable';
  }

  return `${Number(value).toFixed(1)} km away`;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
