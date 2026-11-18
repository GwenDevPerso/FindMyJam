import { buildMonthGrid, formatMonthLabel, getMonthRange, shiftMonth, toMonthKey } from '@/utils/calendar';

describe('buildMonthGrid', () => {
  it('starts weeks on Monday and leaves the days of other months empty', () => {
    // November 2026 starts on a Sunday and ends on a Monday.
    const weeks = buildMonthGrid('2026-11');

    expect(weeks).toHaveLength(6);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks[1]?.[0]).toBe('2026-11-02');
    expect(weeks[5]).toEqual(['2026-11-30', null, null, null, null, null, null]);
  });

  it('fits a February starting on Monday in four weeks', () => {
    const weeks = buildMonthGrid('2027-02');

    expect(weeks).toHaveLength(4);
    expect(weeks[0]?.[0]).toBe('2027-02-01');
    expect(weeks[3]?.[6]).toBe('2027-02-28');
  });

  it('includes the 29th of February of a leap year', () => {
    expect(buildMonthGrid('2028-02').flat()).toContain('2028-02-29');
  });
});

describe('shiftMonth', () => {
  it.each([
    ['2026-11', 1, '2026-12'],
    ['2026-12', 1, '2027-01'],
    ['2026-01', -1, '2025-12'],
  ] as const)('moves %s by %d to %s', (month, delta, expected) => {
    expect(shiftMonth(month, delta)).toBe(expected);
  });
});

describe('formatMonthLabel', () => {
  it('names the month and the year', () => {
    expect(formatMonthLabel('2026-11')).toBe('November 2026');
  });
});

describe('toMonthKey', () => {
  it('reads the local month of a date', () => {
    expect(toMonthKey(new Date(2026, 0, 31, 23, 30))).toBe('2026-01');
  });
});

describe('getMonthRange', () => {
  it('runs from local midnight on the 1st to local midnight on the 1st of the next month', () => {
    expect(getMonthRange('2026-12')).toEqual({
      from: new Date(2026, 11, 1).toISOString(),
      to: new Date(2027, 0, 1).toISOString(),
    });
  });
});
