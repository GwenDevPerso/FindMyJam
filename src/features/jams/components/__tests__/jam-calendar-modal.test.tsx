import { render, screen, userEvent } from '@testing-library/react-native';

import { JamCalendarModal } from '@/features/jams/components/jam-calendar-modal';

// The calendar has its own tests; here only the popup around it matters.
jest.mock('@/features/jams/components/jam-calendar', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return { JamCalendar: () => <Text>Calendar content</Text> };
});

describe('JamCalendarModal', () => {
  it('shows the calendar while visible', async () => {
    await render(<JamCalendarModal visible={true} onClose={jest.fn()} onJamPress={jest.fn()} />);

    expect(screen.getByText('My jams')).toBeOnTheScreen();
    expect(screen.getByText('Calendar content')).toBeOnTheScreen();
  });

  it('renders nothing while hidden', async () => {
    await render(<JamCalendarModal visible={false} onClose={jest.fn()} onJamPress={jest.fn()} />);

    expect(screen.queryByText('Calendar content')).not.toBeOnTheScreen();
  });

  it.each(['Close', 'Close calendar'])('closes from "%s"', async (name) => {
    const onClose = jest.fn();
    await render(<JamCalendarModal visible={true} onClose={onClose} onJamPress={jest.fn()} />);

    await userEvent.setup().press(name === 'Close' ? screen.getByText(name) : screen.getByLabelText(name));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
