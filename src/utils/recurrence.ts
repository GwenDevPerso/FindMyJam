import type { JamRecurrence } from '@/types/domain';

export type MonthlyWeekdayPosition = {
  /** 0 = Sunday … 6 = Saturday, as `Date.getDay`. */
  weekday: number;
  position: 1 | 2 | 3 | 4 | 'last';
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS = ['1st', '2nd', '3rd', '4th'];

/**
 * Weekday and position of a local date in its month. A 5th weekday maps to "last" so that the series still has a
 * date in months with only four of them; the database (`private.next_occurrence_dates`) applies the same rule.
 */
export function getMonthlyWeekdayPosition(date: Date): MonthlyWeekdayPosition {
  const nth = Math.ceil(date.getDate() / 7);

  return {
    weekday: date.getDay(),
    position: nth >= 5 ? 'last' : (nth as 1 | 2 | 3 | 4),
  };
}

function describeMonthlyWeekday(date: Date): string {
  const { weekday, position } = getMonthlyWeekdayPosition(date);
  const positionLabel = position === 'last' ? 'last' : ORDINALS[position - 1];

  return `Every month on the ${positionLabel} ${WEEKDAY_NAMES[weekday]}`;
}

/** Human description of a series, read from the local date of one of its occurrences. */
export function describeRecurrence(recurrence: JamRecurrence, startsAt: string): string {
  const date = new Date(startsAt);

  switch (recurrence) {
    case 'weekly':
      return `Every week on ${WEEKDAY_NAMES[date.getDay()]}`;
    case 'biweekly':
      return `Every 2 weeks on ${WEEKDAY_NAMES[date.getDay()]}`;
    case 'monthly_weekday':
      return describeMonthlyWeekday(date);
  }
}

/** "Repeats every week on Tuesday", the line shown on a jam's detail. */
export function formatRecurrenceSummary(recurrence: JamRecurrence, startsAt: string): string {
  const description = describeRecurrence(recurrence, startsAt);

  return `Repeats ${description.charAt(0).toLowerCase()}${description.slice(1)}`;
}

/** Reads a `YYYY-MM-DD` form value as local midnight; null when it is not a real date. */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }

  return date;
}

/** Label of a recurrence choice in the jam form; the monthly one follows the date typed in the form. */
export function getRecurrenceOptionLabel(option: JamRecurrence | 'none', date: string): string {
  switch (option) {
    case 'none':
      return 'Does not repeat';
    case 'weekly':
      return 'Every week';
    case 'biweekly':
      return 'Every 2 weeks';
    case 'monthly_weekday': {
      const parsed = parseLocalDate(date);

      return parsed === null ? 'Every month' : describeMonthlyWeekday(parsed);
    }
  }
}
