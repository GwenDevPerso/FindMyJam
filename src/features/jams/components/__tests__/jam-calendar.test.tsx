import { render, screen, userEvent } from '@testing-library/react-native';

import { JamCalendar } from '@/features/jams/components/jam-calendar';
import { useMyJamCalendar } from '@/features/jams/hooks/use-my-jam-calendar';
import type { CalendarJam } from '@/features/jams/types';

jest.mock('@/features/jams/hooks/use-my-jam-calendar');

const mockedUseMyJamCalendar = jest.mocked(useMyJamCalendar);

type CalendarQuery = ReturnType<typeof useMyJamCalendar>;

function mockCalendarQuery(overrides: Partial<Record<keyof CalendarQuery, unknown>>): jest.Mock {
  const refetch = jest.fn();

  mockedUseMyJamCalendar.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
  } as unknown as CalendarQuery);

  return refetch;
}

// Built in local time so the day a jam falls on does not depend on the machine's time zone.
const JAMS: CalendarJam[] = [
  { id: 'jam-1', title: 'Blues night', startsAt: new Date(2026, 10, 18, 20, 0).toISOString(), role: 'created' },
  { id: 'jam-2', title: 'Jazz brunch', startsAt: new Date(2026, 10, 18, 11, 30).toISOString(), role: 'participant' },
  { id: 'jam-3', title: 'Funk session', startsAt: new Date(2026, 10, 25, 21, 0).toISOString(), role: 'participant' },
];

async function renderCalendar(onJamPress: (jamId: string) => void): Promise<void> {
  await render(<JamCalendar onJamPress={onJamPress} />);
}

describe('JamCalendar', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 18, 9, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens on the current month', async () => {
    mockCalendarQuery({ data: JAMS });
    await renderCalendar(jest.fn());

    expect(screen.getByText('November 2026')).toBeOnTheScreen();
    expect(mockedUseMyJamCalendar).toHaveBeenLastCalledWith({ month: '2026-11', enabled: true });
  });

  it('marks each day with the jams the user created and joined', async () => {
    mockCalendarQuery({ data: JAMS });
    await renderCalendar(jest.fn());

    expect(screen.getByRole('button', { name: '18 November, 1 created, 1 participating' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '25 November, 1 participating' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '24 November' })).toBeOnTheScreen();
    expect(screen.getByText('Created')).toBeOnTheScreen();
    expect(screen.getByText('Participating')).toBeOnTheScreen();
  });

  it('lists the jams of the pressed day and opens the pressed jam', async () => {
    mockCalendarQuery({ data: JAMS });
    const onJamPress = jest.fn();
    const user = userEvent.setup();
    await renderCalendar(onJamPress);

    await user.press(screen.getByRole('button', { name: '18 November, 1 created, 1 participating' }));

    expect(screen.getByText('Jazz brunch')).toBeOnTheScreen();
    expect(screen.getByText('Blues night')).toBeOnTheScreen();
    expect(screen.queryByText('Funk session')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Blues night, created, 20:00' }));
    expect(onJamPress).toHaveBeenCalledWith('jam-1');
  });

  it('says when the pressed day has no jam', async () => {
    mockCalendarQuery({ data: JAMS });
    const user = userEvent.setup();
    await renderCalendar(jest.fn());

    await user.press(screen.getByRole('button', { name: '24 November' }));

    expect(screen.getByText('No jams on this day')).toBeOnTheScreen();
  });

  it('moves to the next and previous months', async () => {
    mockCalendarQuery({ data: [] });
    const user = userEvent.setup();
    await renderCalendar(jest.fn());

    await user.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('December 2026')).toBeOnTheScreen();
    expect(mockedUseMyJamCalendar).toHaveBeenLastCalledWith({ month: '2026-12', enabled: true });

    await user.press(screen.getByRole('button', { name: 'Previous month' }));
    await user.press(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('October 2026')).toBeOnTheScreen();
  });

  it('says when the month has no jam', async () => {
    mockCalendarQuery({ data: [] });
    await renderCalendar(jest.fn());

    expect(screen.getByText('No jams this month')).toBeOnTheScreen();
  });

  it('shows a loader while the month loads', async () => {
    mockCalendarQuery({ data: undefined, isLoading: true });
    await renderCalendar(jest.fn());

    expect(screen.getByText('Loading your jams…')).toBeOnTheScreen();
  });

  it('shows the error and retries', async () => {
    const refetch = mockCalendarQuery({ data: undefined, isError: true, error: new Error('Network down') });
    await renderCalendar(jest.fn());

    expect(screen.getByText('Network down')).toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
