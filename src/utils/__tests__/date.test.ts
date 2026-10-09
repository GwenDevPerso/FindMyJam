import { formatJamDate, formatJamDateTime, formatJamTime, formatRelativeTime } from '@/utils/date';

const ISO = '2026-07-21T12:00:00.000Z';
const NOW = new Date(ISO).getTime();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function isoAgo(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(ISO));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    [0, 'Just now'],
    [59_999, 'Just now'],
    [MINUTE, '1m ago'],
    [59 * MINUTE + 59_999, '59m ago'],
    [HOUR, '1h ago'],
    [23 * HOUR + 59 * MINUTE, '23h ago'],
    [DAY, '1d ago'],
    [6 * DAY + 23 * HOUR, '6d ago'],
  ])('formats a date %d ms in the past as "%s"', (elapsedMs, expected) => {
    expect(formatRelativeTime(isoAgo(elapsedMs))).toBe(expected);
  });

  it('falls back to the full date from 7 days on', () => {
    const iso = isoAgo(7 * DAY);

    expect(formatRelativeTime(iso)).toBe(formatJamDate(iso));
    expect(formatRelativeTime(iso)).not.toMatch(/ago$/);
  });

  it('shows a date in the future as "Just now"', () => {
    expect(formatRelativeTime(new Date(NOW + HOUR).toISOString())).toBe('Just now');
  });
});

describe('jam date formatting', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The output depends on the device locale and time zone, so the locale formatters are stubbed.
  it('formats the date in the device locale with short weekday and month', () => {
    const toLocaleDateString = jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Tue, Jul 21, 2026');

    expect(formatJamDate(ISO)).toBe('Tue, Jul 21, 2026');
    expect(toLocaleDateString).toHaveBeenCalledWith(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    expect(toLocaleDateString.mock.instances[0]).toEqual(new Date(ISO));
  });

  it('formats the time in the device locale with two-digit hours and minutes', () => {
    const toLocaleTimeString = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('02:00 PM');

    expect(formatJamTime(ISO)).toBe('02:00 PM');
    expect(toLocaleTimeString).toHaveBeenCalledWith(undefined, { hour: '2-digit', minute: '2-digit' });
    expect(toLocaleTimeString.mock.instances[0]).toEqual(new Date(ISO));
  });

  it('joins date and time with a middle dot', () => {
    jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Tue, Jul 21, 2026');
    jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('02:00 PM');

    expect(formatJamDateTime(ISO)).toBe('Tue, Jul 21, 2026 · 02:00 PM');
  });
});
