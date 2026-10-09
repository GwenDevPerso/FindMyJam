import { render, screen, userEvent } from '@testing-library/react-native';

import { JamList } from '@/features/jams/components/jam-list';
import { useJams } from '@/features/jams/hooks/use-jams';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { buildJam } from '@/test-utils/jams';

jest.mock('@/features/jams/hooks/use-jams');
jest.mock('@/features/profile/hooks/use-reference-instruments');
jest.mock('@/features/profile/hooks/use-reference-music-styles');

const mockedUseJams = jest.mocked(useJams);

type JamsQuery = ReturnType<typeof useJams>;

function mockJamsQuery(overrides: Partial<Record<keyof JamsQuery, unknown>>): jest.Mock {
  const refetch = jest.fn();

  mockedUseJams.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isRefetching: false,
    refetch,
    ...overrides,
  } as unknown as JamsQuery);

  return refetch;
}

describe('JamList', () => {
  beforeEach(() => {
    jest.mocked(useReferenceInstruments).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useReferenceInstruments>);
    jest.mocked(useReferenceMusicStyles).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useReferenceMusicStyles>);
  });

  it('passes its filters and enabled flag to the jams query', async () => {
    mockJamsQuery({ isLoading: true });
    const filters = { radiusMeters: 5_000 };

    await render(<JamList filters={filters} enabled={false} onJamPress={jest.fn()} />);

    expect(mockedUseJams).toHaveBeenCalledWith({ filters, enabled: false });
  });

  it('shows a loading message while jams load', async () => {
    mockJamsQuery({ isLoading: true });

    await render(<JamList enabled onJamPress={jest.fn()} />);

    expect(screen.getByText('Loading jams…')).toBeOnTheScreen();
    expect(screen.queryByText('No jams found')).not.toBeOnTheScreen();
  });

  it('shows the error and refetches when "Try again" is pressed', async () => {
    const refetch = mockJamsQuery({ isError: true, error: new Error('Network request failed') });

    await render(<JamList enabled onJamPress={jest.fn()} />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Unable to load jams')).toBeOnTheScreen();
    expect(screen.getByText('Network request failed')).toBeOnTheScreen();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to a generic message when the error has none', async () => {
    mockJamsQuery({ isError: true, error: new Error('') });

    await render(<JamList enabled onJamPress={jest.fn()} />);

    expect(screen.getByText('Something went wrong while loading jams.')).toBeOnTheScreen();
  });

  it('shows the default empty state without a create button', async () => {
    mockJamsQuery({ data: { jams: [], nextCursor: null } });

    await render(<JamList enabled onJamPress={jest.fn()} />);

    expect(screen.getByText('No jams found')).toBeOnTheScreen();
    expect(
      screen.getByText('There are no upcoming jams matching your criteria. Create one or adjust your filters.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('shows custom empty texts and a working create button', async () => {
    mockJamsQuery({ data: { jams: [], nextCursor: null } });
    const onCreatePress = jest.fn();

    await render(
      <JamList
        enabled
        onJamPress={jest.fn()}
        onCreatePress={onCreatePress}
        emptyTitle="Nothing nearby"
        emptyDescription="Be the first to host."
      />,
    );
    await userEvent.setup().press(screen.getByRole('button', { name: 'Create a jam' }));

    expect(screen.getByText('Nothing nearby')).toBeOnTheScreen();
    expect(screen.getByText('Be the first to host.')).toBeOnTheScreen();
    expect(onCreatePress).toHaveBeenCalledTimes(1);
  });

  it('lists the jams and reports which one was pressed', async () => {
    mockJamsQuery({
      data: {
        jams: [
          buildJam({ id: 'jam-1', title: 'Sunday jazz session' }),
          buildJam({ id: 'jam-2', title: 'Monday blues' }),
        ],
        nextCursor: null,
      },
    });
    const onJamPress = jest.fn();

    await render(<JamList enabled onJamPress={onJamPress} />);
    await userEvent.setup().press(screen.getByText('Monday blues'));

    expect(screen.getByText('Sunday jazz session')).toBeOnTheScreen();
    expect(screen.queryByText('No jams found')).not.toBeOnTheScreen();
    expect(onJamPress).toHaveBeenCalledWith('jam-2');
  });
});
