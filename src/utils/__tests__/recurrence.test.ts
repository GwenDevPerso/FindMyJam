import {
  describeRecurrence,
  formatRecurrenceSummary,
  getMonthlyWeekdayPosition,
  getRecurrenceOptionLabel,
  parseLocalDate,
} from '@/utils/recurrence';

// Dates are built in the device's local time, as the jam form does, so the tests do not depend on the time zone.
function localIso(year: number, monthIndex: number, day: number): string {
  return new Date(year, monthIndex, day, 20, 0, 0).toISOString();
}

describe('getMonthlyWeekdayPosition', () => {
  it.each([
    [new Date(2026, 9, 6), 2, 1],
    [new Date(2026, 9, 13), 2, 2],
    [new Date(2026, 9, 20), 2, 3],
    [new Date(2026, 9, 27), 2, 4],
    [new Date(2026, 9, 7), 3, 1],
    [new Date(2026, 9, 1), 4, 1],
  ] as const)('places %s on weekday %d, position %s', (date, weekday, position) => {
    expect(getMonthlyWeekdayPosition(date)).toEqual({ weekday, position });
  });

  it('maps a 5th weekday of the month to "last"', () => {
    // Thursday, October 29th 2026 is the 5th Thursday of the month.
    expect(getMonthlyWeekdayPosition(new Date(2026, 9, 29))).toEqual({ weekday: 4, position: 'last' });
  });

  it('keeps a 4th weekday that is also the last one as the 4th', () => {
    // Tuesday, October 27th 2026 is both the 4th and the last Tuesday.
    expect(getMonthlyWeekdayPosition(new Date(2026, 9, 27)).position).toBe(4);
  });
});

describe('describeRecurrence', () => {
  it('names the weekday of a weekly jam', () => {
    expect(describeRecurrence('weekly', localIso(2026, 9, 13))).toBe('Every week on Tuesday');
  });

  it('names the weekday of a jam every 2 weeks', () => {
    expect(describeRecurrence('biweekly', localIso(2026, 9, 13))).toBe('Every 2 weeks on Tuesday');
  });

  it.each([
    [localIso(2026, 9, 6), 'Every month on the 1st Tuesday'],
    [localIso(2026, 9, 13), 'Every month on the 2nd Tuesday'],
    [localIso(2026, 9, 20), 'Every month on the 3rd Tuesday'],
    [localIso(2026, 9, 27), 'Every month on the 4th Tuesday'],
    [localIso(2026, 9, 29), 'Every month on the last Thursday'],
  ])('describes a monthly jam starting at %s as "%s"', (startsAt, expected) => {
    expect(describeRecurrence('monthly_weekday', startsAt)).toBe(expected);
  });
});

describe('formatRecurrenceSummary', () => {
  it('prefixes the description with "Repeats"', () => {
    expect(formatRecurrenceSummary('weekly', localIso(2026, 9, 13))).toBe('Repeats every week on Tuesday');
  });
});

describe('parseLocalDate', () => {
  it('reads a YYYY-MM-DD date as local midnight', () => {
    expect(parseLocalDate('2026-10-13')).toEqual(new Date(2026, 9, 13));
  });

  it.each(['', 'tomorrow', '2026-1-3', '2026-02-30', '2026-13-01'])('returns null for "%s"', (value) => {
    expect(parseLocalDate(value)).toBeNull();
  });
});

describe('getRecurrenceOptionLabel', () => {
  it.each([
    ['none', 'Does not repeat'],
    ['weekly', 'Every week'],
    ['biweekly', 'Every 2 weeks'],
  ] as const)('labels "%s" as "%s"', (option, expected) => {
    expect(getRecurrenceOptionLabel(option, '2026-10-13')).toBe(expected);
  });

  it('names the weekday position of the chosen date for the monthly option', () => {
    expect(getRecurrenceOptionLabel('monthly_weekday', '2026-10-13')).toBe('Every month on the 2nd Tuesday');
    expect(getRecurrenceOptionLabel('monthly_weekday', '2026-10-29')).toBe('Every month on the last Thursday');
  });

  it('falls back to "Every month" while the date is not a valid date', () => {
    expect(getRecurrenceOptionLabel('monthly_weekday', '2026-10')).toBe('Every month');
  });
});
