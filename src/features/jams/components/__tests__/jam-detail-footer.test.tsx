import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { Routes } from '@/constants/routes';
import { JamDetailFooter } from '@/features/jams/components/jam-detail-footer';
import { useJamWaitlist } from '@/features/jams/hooks/use-jam-waitlist';
import { useJoinJam } from '@/features/jams/hooks/use-join-jam';
import { useJoinWaitlist } from '@/features/jams/hooks/use-join-waitlist';
import { useLeaveJam } from '@/features/jams/hooks/use-leave-jam';
import { useLeaveWaitlist } from '@/features/jams/hooks/use-leave-waitlist';
import type { JamDetail } from '@/features/jams/types';
import { buildJam } from '@/test-utils/jams';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));
jest.mock('@/features/jams/hooks/use-jam-waitlist');
jest.mock('@/features/jams/hooks/use-join-jam');
jest.mock('@/features/jams/hooks/use-join-waitlist');
jest.mock('@/features/jams/hooks/use-leave-jam');
jest.mock('@/features/jams/hooks/use-leave-waitlist');

const mockedRouter = jest.mocked(router);
const mockedUseJamWaitlist = jest.mocked(useJamWaitlist);
const mockedUseJoinJam = jest.mocked(useJoinJam);
const mockedUseJoinWaitlist = jest.mocked(useJoinWaitlist);
const mockedUseLeaveJam = jest.mocked(useLeaveJam);
const mockedUseLeaveWaitlist = jest.mocked(useLeaveWaitlist);

const JAM_ID = 'jam-1';
const CHAT_LOCKED_HINT = 'The chat opens to musicians once they join';

function buildJamDetail(overrides: Partial<JamDetail>): JamDetail {
  return {
    ...buildJam({ id: JAM_ID, participantCount: 3, maxParticipants: 6 }),
    isCreator: false,
    isParticipant: false,
    recurrence: null,
    recurrenceEndsOn: null,
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

describe('JamDetailFooter', () => {
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

  describe('for a visitor', () => {
    it('AC9 — joins a jam that has room, without reading the waitlist', async () => {
      await render(<JamDetailFooter jam={buildJamDetail({})} />);

      await userEvent.setup().press(screen.getByRole('button', { name: 'Join' }));

      expect(joinJam).toHaveBeenCalledWith(JAM_ID);
      expect(mockedUseJamWaitlist).not.toHaveBeenCalled();
    });

    it('AC18 — does not offer the chat, and says when it opens', async () => {
      await render(<JamDetailFooter jam={buildJamDetail({})} />);

      expect(screen.queryByRole('button', { name: 'Open chat →' })).not.toBeOnTheScreen();
      expect(screen.getByText(CHAT_LOCKED_HINT)).toBeOnTheScreen();
    });

    it('shows the error of a failed join', async () => {
      mockMutation(mockedUseJoinJam, { error: new Error('This jam is full') });
      await render(<JamDetailFooter jam={buildJamDetail({})} />);

      expect(screen.getByText('This jam is full')).toBeOnTheScreen();
    });
  });

  describe('for a visitor of a full jam', () => {
    it('AC10 — joins the waitlist', async () => {
      await render(<JamDetailFooter jam={FULL_JAM} />);

      await userEvent.setup().press(screen.getByRole('button', { name: 'Join the waitlist' }));

      expect(joinWaitlist).toHaveBeenCalledWith(JAM_ID);
      expect(screen.queryByRole('button', { name: 'Join' })).not.toBeOnTheScreen();
    });

    it('AC10 — leaves the waitlist once on it', async () => {
      mockWaitlist({ data: { position: 2, size: 3 } });
      await render(<JamDetailFooter jam={FULL_JAM} />);

      await userEvent.setup().press(screen.getByRole('button', { name: 'Leave the waitlist' }));

      expect(leaveWaitlist).toHaveBeenCalledWith(JAM_ID);
    });

    it('shows the waitlist button as busy while the waitlist loads', async () => {
      mockWaitlist({ data: undefined, isLoading: true });
      await render(<JamDetailFooter jam={FULL_JAM} />);

      expect(screen.getByRole('button', { name: 'Join the waitlist' })).toBeDisabled();
    });

    it('offers to try again when the waitlist fails to load', async () => {
      const refetch = jest.fn();
      mockWaitlist({ data: undefined, isError: true, error: new Error('Network down'), refetch });
      await render(<JamDetailFooter jam={FULL_JAM} />);

      expect(screen.getByText('Could not load the waitlist.')).toBeOnTheScreen();
      await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));
      expect(refetch).toHaveBeenCalled();
    });

    it('shows the error of a failed waitlist action', async () => {
      mockMutation(mockedUseJoinWaitlist, { error: new Error('Already on the waitlist') });
      await render(<JamDetailFooter jam={FULL_JAM} />);

      expect(screen.getByText('Already on the waitlist')).toBeOnTheScreen();
    });
  });

  describe('for a participant', () => {
    const jam = buildJamDetail({ isParticipant: true, participantCount: 6 });

    it('AC17 — opens the chat of the jam', async () => {
      await render(<JamDetailFooter jam={jam} />);

      await userEvent.setup().press(screen.getByRole('button', { name: 'Open chat →' }));

      expect(mockedRouter.push).toHaveBeenCalledWith(Routes.jamChat(JAM_ID));
      expect(screen.queryByText(CHAT_LOCKED_HINT)).not.toBeOnTheScreen();
    });

    it('AC9 — leaves the jam', async () => {
      await render(<JamDetailFooter jam={jam} />);

      await userEvent.setup().press(screen.getByRole('button', { name: 'Leave' }));

      expect(leaveJam).toHaveBeenCalledWith(JAM_ID);
      expect(screen.queryByRole('button', { name: 'Join the waitlist' })).not.toBeOnTheScreen();
    });

    it('shows the error of a failed leave', async () => {
      mockMutation(mockedUseLeaveJam, { error: new Error('Could not leave') });
      await render(<JamDetailFooter jam={jam} />);

      expect(screen.getByText('Could not leave')).toBeOnTheScreen();
    });
  });

  describe('for the creator', () => {
    const jam = buildJamDetail({ isCreator: true });

    it('AC17 — opens the chat of the jam', async () => {
      await render(<JamDetailFooter jam={jam} />);

      await userEvent.setup().press(screen.getByRole('button', { name: 'Open chat →' }));

      expect(mockedRouter.push).toHaveBeenCalledWith(Routes.jamChat(JAM_ID));
    });

    it('opens the edit screen of the jam', async () => {
      await render(<JamDetailFooter jam={jam} />);

      await userEvent.setup().press(screen.getByRole('button', { name: 'Edit' }));

      expect(mockedRouter.push).toHaveBeenCalledWith(Routes.jamEdit(JAM_ID));
    });

    it('offers neither joining nor leaving', async () => {
      await render(<JamDetailFooter jam={jam} />);

      expect(screen.queryByRole('button', { name: 'Join' })).not.toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: 'Leave' })).not.toBeOnTheScreen();
    });
  });
});
