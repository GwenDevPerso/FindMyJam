import { render, screen, userEvent } from '@testing-library/react-native';

import { ParticipantList } from '@/features/jams/components/participant-list';
import { useJamParticipants } from '@/features/jams/hooks/use-jam-participants';
import type { JamParticipant } from '@/types/domain';
import { formatJamDateTime } from '@/utils/date';

jest.mock('@/features/jams/hooks/use-jam-participants');

const mockedUseJamParticipants = jest.mocked(useJamParticipants);

type ParticipantsQuery = ReturnType<typeof useJamParticipants>;

const JAM_ID = '11111111-1111-4111-8111-111111111111';

function buildParticipant(overrides: Partial<JamParticipant>): JamParticipant {
  return {
    jamId: JAM_ID,
    userId: 'user-1',
    username: 'miles',
    avatarUrl: null,
    joinedAt: '2026-07-10T10:00:00.000Z',
    ...overrides,
  };
}

function mockParticipantsQuery(overrides: Partial<Record<keyof ParticipantsQuery, unknown>>): jest.Mock {
  const refetch = jest.fn();

  mockedUseJamParticipants.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isRefetching: false,
    refetch,
    ...overrides,
  } as unknown as ParticipantsQuery);

  return refetch;
}

describe('ParticipantList', () => {
  it('queries the participants of the given jam', async () => {
    mockParticipantsQuery({ isLoading: true });

    await render(<ParticipantList jamId={JAM_ID} enabled />);

    expect(mockedUseJamParticipants).toHaveBeenCalledWith({ jamId: JAM_ID, enabled: true });
  });

  it('shows a loading message while participants load', async () => {
    mockParticipantsQuery({ isLoading: true });

    await render(<ParticipantList jamId={JAM_ID} enabled />);

    expect(screen.getByText('Loading participants…')).toBeOnTheScreen();
  });

  it('shows the error and refetches when "Try again" is pressed', async () => {
    const refetch = mockParticipantsQuery({ isError: true, error: new Error('permission denied') });

    await render(<ParticipantList jamId={JAM_ID} enabled />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Unable to load participants')).toBeOnTheScreen();
    expect(screen.getByText('permission denied')).toBeOnTheScreen();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to a generic message when the error has none', async () => {
    mockParticipantsQuery({ isError: true, error: new Error('') });

    await render(<ParticipantList jamId={JAM_ID} enabled />);

    expect(screen.getByText('Something went wrong while loading participants.')).toBeOnTheScreen();
  });

  it('invites to join when nobody has joined yet', async () => {
    mockParticipantsQuery({ data: [] });

    await render(<ParticipantList jamId={JAM_ID} enabled />);

    expect(screen.getByText('No participants yet')).toBeOnTheScreen();
    expect(screen.getByText('Be the first musician to join this jam.')).toBeOnTheScreen();
  });

  it('lists each participant with an initial and the date they joined', async () => {
    const miles = buildParticipant({});
    const john = buildParticipant({ userId: 'user-2', username: 'john', joinedAt: '2026-07-11T09:30:00.000Z' });
    mockParticipantsQuery({ data: [miles, john] });

    await render(<ParticipantList jamId={JAM_ID} enabled />);

    expect(screen.getByText('miles')).toBeOnTheScreen();
    expect(screen.getByText('M')).toBeOnTheScreen();
    expect(screen.getByText(`Joined ${formatJamDateTime(miles.joinedAt)}`)).toBeOnTheScreen();
    expect(screen.getByText('john')).toBeOnTheScreen();
    expect(screen.getByText(`Joined ${formatJamDateTime(john.joinedAt)}`)).toBeOnTheScreen();
    expect(screen.queryByText('No participants yet')).not.toBeOnTheScreen();
  });
});
