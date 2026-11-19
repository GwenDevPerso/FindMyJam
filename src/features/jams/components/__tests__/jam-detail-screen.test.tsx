import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Routes } from '@/constants/routes';
import { JamDetailScreen } from '@/features/jams/components/jam-detail-screen';
import { useJamDetail } from '@/features/jams/hooks/use-jam-detail';
import { useJamParticipants } from '@/features/jams/hooks/use-jam-participants';
import { useJamWaitlist } from '@/features/jams/hooks/use-jam-waitlist';
import type { JamDetail, JamParticipant } from '@/features/jams/types';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { buildJam } from '@/test-utils/jams';
import { formatJamDateTime } from '@/utils/date';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
}));
jest.mock('@/features/jams/hooks/use-jam-detail');
jest.mock('@/features/jams/hooks/use-jam-participants');
jest.mock('@/features/jams/hooks/use-jam-waitlist');
jest.mock('@/features/profile/hooks/use-profile');
jest.mock('@/features/profile/hooks/use-reference-instruments', () => ({
  useReferenceInstruments: () => ({ data: [] }),
}));
jest.mock('@/features/profile/hooks/use-reference-music-styles', () => ({
  useReferenceMusicStyles: () => ({ data: [] }),
}));
// The footer and the delete button have their own tests; the map is native.
jest.mock('@/features/jams/components/jam-detail-footer', () => ({
  JamDetailFooter: () => null,
}));
jest.mock('@/features/jams/components/jam-delete-button', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { JamDeleteButton: () => <Text>Delete jam</Text> };
});
jest.mock('@/features/jams/components/jam-location-map', () => ({
  JamLocationMap: () => null,
}));

const mockedRouter = jest.mocked(router);
const mockedUseJamDetail = jest.mocked(useJamDetail);
const mockedUseJamParticipants = jest.mocked(useJamParticipants);
const mockedUseJamWaitlist = jest.mocked(useJamWaitlist);
const mockedUseProfile = jest.mocked(useProfile);

const JAM_ID = 'jam-1';

function buildJamDetail(overrides: Partial<JamDetail>): JamDetail {
  return {
    ...buildJam({ id: JAM_ID }),
    isCreator: false,
    isParticipant: false,
    recurrence: null,
    recurrenceEndsOn: null,
    ...overrides,
  };
}

function buildParticipant(index: number): JamParticipant {
  return {
    jamId: JAM_ID,
    userId: `user-${index}`,
    username: `musician_${index}`,
    avatarUrl: null,
    joinedAt: '2026-07-10T10:00:00.000Z',
  };
}

function mockDetail(state: Record<string, unknown>): void {
  mockedUseJamDetail.mockReturnValue({
    data: buildJamDetail({}),
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...state,
  } as unknown as ReturnType<typeof useJamDetail>);
}

function mockParticipants(state: Record<string, unknown>): void {
  mockedUseJamParticipants.mockReturnValue({
    data: [buildParticipant(1), buildParticipant(2), buildParticipant(3)],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...state,
  } as unknown as ReturnType<typeof useJamParticipants>);
}

function mockWaitlist(data: { position: number | null; size: number } | undefined): void {
  mockedUseJamWaitlist.mockReturnValue({ data } as unknown as ReturnType<typeof useJamWaitlist>);
}

async function renderScreen(): Promise<void> {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}>
      <JamDetailScreen jamId={JAM_ID} />
    </SafeAreaProvider>,
  );
}

describe('JamDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRouter.canGoBack.mockReturnValue(true);
    mockDetail({});
    mockParticipants({});
    mockWaitlist(undefined);
    mockedUseProfile.mockReturnValue({
      data: { username: 'marie_keys', instruments: [{ id: 'i-1', name: 'Piano', slug: 'piano' }] },
    } as unknown as ReturnType<typeof useProfile>);
  });

  describe('while the jam loads or fails', () => {
    it('shows a loader', async () => {
      mockDetail({ data: undefined, isLoading: true });
      await renderScreen();

      expect(screen.getByText('Loading jam…')).toBeOnTheScreen();
    });

    it('shows the error and tries again', async () => {
      const refetch = jest.fn();
      mockDetail({ data: undefined, isError: true, error: new Error('Network down'), refetch });
      await renderScreen();

      expect(screen.getByText('Unable to load jam')).toBeOnTheScreen();
      await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));
      expect(refetch).toHaveBeenCalled();
    });

    it('says when the jam no longer exists', async () => {
      mockDetail({ data: undefined });
      await renderScreen();

      expect(screen.getByText('Jam not found')).toBeOnTheScreen();
    });

    it('keeps a way back', async () => {
      mockDetail({ data: undefined, isLoading: true });
      await renderScreen();

      await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }));

      expect(mockedRouter.back).toHaveBeenCalled();
    });
  });

  describe('header', () => {
    it('shows the title and how the series repeats', async () => {
      mockDetail({ data: buildJamDetail({ recurrence: 'weekly', startsAt: '2026-08-02T18:00:00.000Z' }) });
      await renderScreen();

      expect(screen.getByText('Sunday jazz session')).toBeOnTheScreen();
      expect(screen.getByText(/^Repeats every week/)).toBeOnTheScreen();
    });

    it('goes back to where the jam was opened from', async () => {
      await renderScreen();

      await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }));

      expect(mockedRouter.back).toHaveBeenCalled();
    });

    it('goes home when there is no screen to go back to', async () => {
      mockedRouter.canGoBack.mockReturnValue(false);
      await renderScreen();

      await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }));

      expect(mockedRouter.replace).toHaveBeenCalledWith(Routes.home);
    });

    it('AC25 — shares the title, date and time, and place of the jam', async () => {
      const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
      const jam = buildJamDetail({});
      mockDetail({ data: jam });
      await renderScreen();

      await userEvent.setup().press(screen.getByRole('button', { name: 'Share' }));

      expect(shareSpy).toHaveBeenCalledWith({
        message: `Sunday jazz session · ${formatJamDateTime(jam.startsAt)} · Le Caveau`,
      });
      shareSpy.mockRestore();
    });
  });

  describe('info', () => {
    it('shows the date, the level and the place with its distance', async () => {
      const jam = buildJamDetail({});
      mockDetail({ data: jam });
      await renderScreen();

      expect(screen.getByText('Date')).toBeOnTheScreen();
      expect(screen.getByText(formatJamDateTime(jam.startsAt))).toBeOnTheScreen();
      expect(screen.getByText('Level')).toBeOnTheScreen();
      expect(screen.getByText('All Levels')).toBeOnTheScreen();
      expect(screen.getByText('Where')).toBeOnTheScreen();
      expect(screen.getByText('Le Caveau')).toBeOnTheScreen();
      expect(screen.getByText('1.2 km')).toBeOnTheScreen();
    });

    it('calls the date of a series its next date', async () => {
      mockDetail({ data: buildJamDetail({ recurrence: 'weekly' }) });
      await renderScreen();

      expect(screen.getByText('Next date')).toBeOnTheScreen();
    });

    it('shows the description', async () => {
      await renderScreen();

      expect(screen.getByText('Bring your own amp')).toBeOnTheScreen();
    });
  });

  describe('musicians', () => {
    it('shows the seats taken and who hosts the jam', async () => {
      await renderScreen();

      expect(screen.getByText('3 / 6')).toBeOnTheScreen();
      expect(screen.getByText(/Hosted by/)).toHaveTextContent('Hosted by @marie_keys · Piano');
      expect(mockedUseProfile).toHaveBeenCalledWith({ userId: buildJam({}).creatorId, enabled: true });
    });

    it('says a full jam is full, with how many more musicians and how many wait', async () => {
      mockDetail({ data: buildJamDetail({ participantCount: 8, maxParticipants: 8 }) });
      mockParticipants({ data: Array.from({ length: 8 }, (_, index) => buildParticipant(index)) });
      mockWaitlist({ position: null, size: 2 });
      await renderScreen();

      expect(screen.getByText('8 / 8 · Full')).toBeOnTheScreen();
      expect(screen.getByText('+2 more · 2 waiting')).toBeOnTheScreen();
    });

    it('does not read the waitlist of a jam with free seats', async () => {
      await renderScreen();

      expect(mockedUseJamWaitlist).toHaveBeenCalledWith({ jamId: JAM_ID, enabled: false });
    });

    it('says when nobody has joined yet', async () => {
      mockParticipants({ data: [] });
      await renderScreen();

      expect(screen.getByText('No musicians have joined yet.')).toBeOnTheScreen();
    });

    it('offers to try again when the musicians fail to load', async () => {
      const refetch = jest.fn();
      mockParticipants({ data: undefined, isError: true, error: new Error('Network down'), refetch });
      await renderScreen();

      expect(screen.getByText('Could not load the musicians.')).toBeOnTheScreen();
      await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));
      expect(refetch).toHaveBeenCalled();
    });

    it('AC10 — shows the rank of a user on the waitlist', async () => {
      mockDetail({ data: buildJamDetail({ participantCount: 6, maxParticipants: 6 }) });
      mockWaitlist({ position: 3, size: 4 });
      await renderScreen();

      expect(screen.getByText('#3')).toBeOnTheScreen();
      expect(screen.getByText(/You're on the waitlist/)).toBeOnTheScreen();
    });
  });

  it('offers the creator to delete the jam', async () => {
    mockDetail({ data: buildJamDetail({ isCreator: true }) });
    await renderScreen();

    expect(screen.getByText('Delete jam')).toBeOnTheScreen();
  });

  it('hides the delete button from other users', async () => {
    await renderScreen();

    expect(screen.queryByText('Delete jam')).not.toBeOnTheScreen();
  });
});
