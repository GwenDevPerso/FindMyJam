export function formatJamDate(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatJamTime(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatJamDateTime(isoDate: string): string {
  return `${formatJamDate(isoDate)} · ${formatJamTime(isoDate)}`;
}
