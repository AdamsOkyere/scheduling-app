export const slugify = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

export const makeBookingReference = () => {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BK-${suffix}`;
};

export const formatDateLabel = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);

export const formatTimeLabel = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
