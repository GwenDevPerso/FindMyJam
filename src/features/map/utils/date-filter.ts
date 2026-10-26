import type { DateFilterOption } from '@/features/map/constants';

const SATURDAY = 6;
const SUNDAY = 0;
const DAYS_IN_WEEK = 7;

export type DateFilterRange = {
  startsAfter: string;
  startsBefore: string | null;
};

function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addLocalDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Start of the weekend that `now` is in, or of the next one on a weekday (local Saturday 00:00). */
function startOfWeekend(now: Date): Date {
  const day = now.getDay();

  if (day === SATURDAY || day === SUNDAY) {
    return now;
  }

  const saturday = addLocalDays(now, SATURDAY - day);
  return new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate());
}

/** Search window of a date filter, read in the device's time zone; it never starts before `now`. */
export function getDateFilterRange(option: DateFilterOption, now: Date): DateFilterRange {
  const startsAfter = now.toISOString();

  switch (option) {
    case 'any':
      return { startsAfter, startsBefore: null };
    case 'today':
      return { startsAfter, startsBefore: endOfLocalDay(now).toISOString() };
    case 'weekend': {
      const start = startOfWeekend(now);
      const sunday = start.getDay() === SUNDAY ? start : addLocalDays(start, 1);

      return { startsAfter: start.toISOString(), startsBefore: endOfLocalDay(sunday).toISOString() };
    }
    case 'week':
      return { startsAfter, startsBefore: addLocalDays(now, DAYS_IN_WEEK).toISOString() };
  }
}
