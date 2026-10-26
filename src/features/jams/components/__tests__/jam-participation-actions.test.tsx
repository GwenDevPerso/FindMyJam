import { render, screen, userEvent } from '@testing-library/react-native';

import { JamParticipationActions } from '@/features/jams/components/jam-participation-actions';
import { useJamWaitlist } from '@/features/jams/hooks/use-jam-waitlist';
import { useJoinJam } from '@/features/jams/hooks/use-join-jam';
import { useJoinWaitlist } from '@/features/jams/hooks/use-join-waitlist';
import { useLeaveJam } from '@/features/jams/hooks/use-leave-jam';
import { useLeaveWaitlist } from '@/features/jams/hooks/use-leave-waitlist';
import type { JamDetail } from '@/features/jams/types';
import { buildJam } from '@/test-utils/jams';

jest.mock('@/features/jams/hooks/use-jam-waitlist');
jest.mock('@/features/jams/hooks/use-join-jam');
jest.mock('@/features/jams/hooks/use-join-waitlist');
jest.mock('@/features/jams/hooks/use-leave-jam');
jest.mock('@/features/jams/hooks/use-leave-waitlist');

const mockedUseJamWaitlist = jest.mocked(useJamWaitlist);
const mockedUseJoinJam = jest.mocked(useJoinJam);
const mockedUseJoinWaitlist = jest.mocked(useJoinWaitlist);
const mockedUseLeaveJam = jest.mocked(useLeaveJam);
const mockedUseLeaveWaitlist = jest.mocked(useLeaveWaitlist);

const JAM_ID = 'jam-1';

function buildJamDetail(overrides: Partial<JamDetail>): JamDetail {
  return {
    ...buildJam({ id: JAM_ID, participantCount: 3, maxParticipants: 6 }),
    isCreator: false,
    isParticipant: false,
    recurrence: null,
    ...overrides,
  };
}

const FULL_JAM = buildJamDetail({ participantCount: 6, maxParticipants: 6 });

type Mutation = { mutate: jest.Mock; isPending: boolean; error: Error | null };

function mockMutation<T>(hook: jest.MockedFunction<() => T>, overrides: Partial<Mutation>): jest.Mock {
  const mutate = jest.fn();
  hook.mockReturnValue({ mutate, isPending: false, error: null, ...overrides } as unknown as T);
  return mutate;
}

function mockWaitlist(state: Partial<ReturnType<typeof useJamWaitlist>>): void {
  mockedUseJamWaitlist.mockReturnValue({
    data: { position: null, size: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...state,
  } as unknown as ReturnType<typeof useJamWaitlist>);
}

describe('JamParticipationActions', () => {
  let joinJam: jest.Mock;
  let leaveJam: jest.Mock;
  let joinWaitlist: jest.Mock;
  let leaveWaitlist: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    joinJam = mockMutation(mockedUseJoinJam, {});
    leaveJam = mockMutation(mockedUseLeaveJam, {});
    joinWaitlist = mockMutation(mockedUseJoinWaitlist, {});
    leaveWaitlist = mockMutation(mockedUseLeaveWaitlist, {});
    mockWaitlist({});
  });

  it('offers to join a jam that has room, without reading the waitlist', async () => {
    await render(<JamParticipationActions jam={buildJamDetail({})} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Join jam' }));

    expect(joinJam).toHaveBeenCalledWith(JAM_ID);
    expect(screen.queryByRole('button', { name: 'Join waitlist' })).not.toBeOnTheScreen();
    expect(mockedUseJamWaitlist).not.toHaveBeenCalled();
  });

  it('offers a participant to leave', async () => {
    await render(<JamParticipationActions jam={buildJamDetail({ isParticipant: true, participantCount: 6 })} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Leave jam' }));

    expect(leaveJam).toHaveBeenCalledWith(JAM_ID);
    expect(screen.queryByRole('button', { name: 'Join waitlist' })).not.toBeOnTheScreen();
  });

  it('shows nothing to the creator', async () => {
    await render(<JamParticipationActions jam={buildJamDetail({ isCreator: true })} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('offers the waitlist on a full jam', async () => {
    mockWaitlist({ data: { position: null, size: 2 } });
    await render(<JamParticipationActions jam={FULL_JAM} />);

    expect(screen.getByText('This jam is full. 2 people are waiting.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Join jam' })).not.toBeOnTheScreen();
    expect(mockedUseJamWaitlist).toHaveBeenCalledWith({ jamId: JAM_ID, enabled: true });

    await userEvent.setup().press(screen.getByRole('button', { name: 'Join waitlist' }));

    expect(joinWaitlist).toHaveBeenCalledWith(JAM_ID);
  });

  it('says nobody is waiting yet on a full jam with an empty waitlist', async () => {
    await render(<JamParticipationActions jam={FULL_JAM} />);

    expect(screen.getByText('This jam is full. Nobody is waiting yet.')).toBeOnTheScreen();
  });

  it('shows the position of a user on the waitlist and lets them leave it', async () => {
    mockWaitlist({ data: { position: 2, size: 3 } });
    await render(<JamParticipationActions jam={FULL_JAM} />);

    expect(screen.getByText("You're #2 on the waitlist")).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Join waitlist' })).not.toBeOnTheScreen();

    await userEvent.setup().press(screen.getByRole('button', { name: 'Leave waitlist' }));

    expect(leaveWaitlist).toHaveBeenCalledWith(JAM_ID);
  });

  it('shows a loading message while the waitlist loads', async () => {
    mockWaitlist({ data: undefined, isLoading: true });
    await render(<JamParticipationActions jam={FULL_JAM} />);

    expect(screen.getByText('Checking the waitlist…')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Join waitlist' })).not.toBeOnTheScreen();
  });

  it('offers a retry when the waitlist fails to load', async () => {
    const refetch = jest.fn();
    mockWaitlist({ data: undefined, isError: true, error: new Error('boom'), refetch });
    await render(<JamParticipationActions jam={FULL_JAM} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalled();
  });

  it('shows the error of a failed waitlist action', async () => {
    mockMutation(mockedUseJoinWaitlist, { error: new Error('You are already on the waitlist') });
    await render(<JamParticipationActions jam={FULL_JAM} />);

    expect(screen.getByText('You are already on the waitlist')).toBeOnTheScreen();
  });

  it('shows the error of a failed join', async () => {
    mockMutation(mockedUseJoinJam, { error: new Error('This jam is full') });
    await render(<JamParticipationActions jam={buildJamDetail({})} />);

    expect(screen.getByText('This jam is full')).toBeOnTheScreen();
  });
});
