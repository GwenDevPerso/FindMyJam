import { countActiveFilters } from '@/features/map/utils/active-filters';

const NO_FILTER = {
  radiusMeters: 25_000,
  instrumentIds: [],
  styleIds: [],
  dateFilter: 'any',
} as const;

describe('countActiveFilters', () => {
  it('is zero with the default filters', () => {
    expect(countActiveFilters(NO_FILTER, { includeRadius: true })).toBe(0);
  });

  it('counts each selected instrument and style', () => {
    expect(
      countActiveFilters({ ...NO_FILTER, instrumentIds: ['a', 'b'], styleIds: ['c'] }, { includeRadius: true }),
    ).toBe(3);
  });

  it('counts a date filter other than any date', () => {
    expect(countActiveFilters({ ...NO_FILTER, dateFilter: 'weekend' }, { includeRadius: true })).toBe(1);
  });

  it('counts a radius other than the default only when asked', () => {
    const filters = { ...NO_FILTER, radiusMeters: 5_000 } as const;

    expect(countActiveFilters(filters, { includeRadius: true })).toBe(1);
    expect(countActiveFilters(filters, { includeRadius: false })).toBe(0);
  });
});
