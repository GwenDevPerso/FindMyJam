import { getDateFilterRange } from '@/features/map/utils/date-filter';

// Dates are built in local time: the presets follow the device's calendar day, whatever the time zone.
const WEDNESDAY_AFTERNOON = new Date(2026, 9, 28, 15, 30);
const SATURDAY_EVENING = new Date(2026, 9, 31, 20, 0);
const SUNDAY_MORNING = new Date(2026, 10, 1, 10, 0);

function endOfLocalDay(year: number, monthIndex: number, day: number): string {
  return new Date(year, monthIndex, day, 23, 59, 59, 999).toISOString();
}

describe('getDateFilterRange', () => {
  it('starts now with no end for any date', () => {
    expect(getDateFilterRange('any', WEDNESDAY_AFTERNOON)).toEqual({
      startsAfter: WEDNESDAY_AFTERNOON.toISOString(),
      startsBefore: null,
    });
  });

  it('ends at the end of the current day for today', () => {
    expect(getDateFilterRange('today', WEDNESDAY_AFTERNOON)).toEqual({
      startsAfter: WEDNESDAY_AFTERNOON.toISOString(),
      startsBefore: endOfLocalDay(2026, 9, 28),
    });
  });

  it('covers the coming Saturday and Sunday on a weekday', () => {
    expect(getDateFilterRange('weekend', WEDNESDAY_AFTERNOON)).toEqual({
      startsAfter: new Date(2026, 9, 31, 0, 0).toISOString(),
      startsBefore: endOfLocalDay(2026, 10, 1),
    });
  });

  it('covers the rest of the weekend from now on a Saturday', () => {
    expect(getDateFilterRange('weekend', SATURDAY_EVENING)).toEqual({
      startsAfter: SATURDAY_EVENING.toISOString(),
      startsBefore: endOfLocalDay(2026, 10, 1),
    });
  });

  it('covers the rest of Sunday on a Sunday', () => {
    expect(getDateFilterRange('weekend', SUNDAY_MORNING)).toEqual({
      startsAfter: SUNDAY_MORNING.toISOString(),
      startsBefore: endOfLocalDay(2026, 10, 1),
    });
  });

  it('ends seven days from now for the next 7 days', () => {
    expect(getDateFilterRange('week', WEDNESDAY_AFTERNOON)).toEqual({
      startsAfter: WEDNESDAY_AFTERNOON.toISOString(),
      startsBefore: new Date(2026, 10, 4, 15, 30).toISOString(),
    });
  });
});
