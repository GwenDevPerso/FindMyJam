import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Routes } from '@/constants/routes';
import { UserProfileScreen } from '@/features/profile/components/user-profile-screen';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useProfileCreatedJams } from '@/features/profile/hooks/use-profile-created-jams';
import { useProfileParticipatedJams } from '@/features/profile/hooks/use-profile-participated-jams';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import type { ProfileDetail } from '@/features/profile/types';
import { buildJam } from '@/test-utils/jams';
import type { Jam } from '@/types/domain';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/profile/hooks/use-profile');
jest.mock('@/features/profile/hooks/use-profile-created-jams');
jest.mock('@/features/profile/hooks/use-profile-participated-jams');
jest.mock('@/features/profile/hooks/use-reference-instruments');
jest.mock('@/features/profile/hooks/use-reference-music-styles');

const mockedUseProfile = jest.mocked(useProfile);
const mockedUseProfileCreatedJams = jest.mocked(useProfileCreatedJams);
const mockedUseProfileParticipatedJams = jest.mocked(useProfileParticipatedJams);
const mockedPush = jest.mocked(router.push);

type ProfileQuery = ReturnType<typeof useProfile>;

const USER_ID = 'user-7';

const profile: ProfileDetail = {
  id: USER_ID,
  username: 'django',
  avatarUrl: null,
  bio: 'Gypsy jazz guitarist',
  skillLevel: 'expert',
  locationName: 'Paris',
  latitude: null,
  longitude: null,
  instrumentIds: ['instrument-1'],
  styleIds: ['style-1'],
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-02T10:00:00.000Z',
  instruments: [{ id: 'instrument-1', name: 'Guitar', slug: 'guitar' }],
  musicStyles: [{ id: 'style-1', name: 'Jazz', slug: 'jazz' }],
};

// `Screen` reads the safe-area insets, so the screen needs a provider with known metrics.
async function renderScreen(userId: string): Promise<void> {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}>
      <UserProfileScreen userId={userId} />
    </SafeAreaProvider>,
  );
}

function mockProfileQuery(overrides: Partial<Record<keyof ProfileQuery, unknown>>): jest.Mock {
  const refetch = jest.fn();

  mockedUseProfile.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
  } as unknown as ProfileQuery);

  return refetch;
}

function mockJamQueries({ created, participated }: { created: Jam[]; participated: Jam[] }): void {
  mockedUseProfileCreatedJams.mockReturnValue({
    data: created,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useProfileCreatedJams>);
  mockedUseProfileParticipatedJams.mockReturnValue({
    data: participated,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useProfileParticipatedJams>);
}

describe('UserProfileScreen', () => {
  beforeEach(() => {
    mockedPush.mockClear();
    mockJamQueries({ created: [], participated: [] });
    jest.mocked(useReferenceInstruments).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useReferenceInstruments>);
    jest.mocked(useReferenceMusicStyles).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useReferenceMusicStyles>);
  });

  it('loads the profile of the given user', async () => {
    mockProfileQuery({ isLoading: true });

    await renderScreen(USER_ID);

    expect(mockedUseProfile).toHaveBeenCalledWith({ userId: USER_ID, enabled: true });
  });

  it('does not query when the user id is missing', async () => {
    mockProfileQuery({});

    await renderScreen('');

    expect(mockedUseProfile).toHaveBeenCalledWith({ userId: '', enabled: false });
    expect(screen.getByText('Profile not found')).toBeOnTheScreen();
  });

  it('shows a loading message while the profile loads', async () => {
    mockProfileQuery({ isLoading: true });

    await renderScreen(USER_ID);

    expect(screen.getByText('Loading profile…')).toBeOnTheScreen();
    expect(screen.queryByText('Jams')).not.toBeOnTheScreen();
  });

  it('shows the error and refetches when "Try again" is pressed', async () => {
    const refetch = mockProfileQuery({ isError: true, error: new Error('Network request failed') });

    await renderScreen(USER_ID);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Unable to load profile')).toBeOnTheScreen();
    expect(screen.getByText('Network request failed')).toBeOnTheScreen();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('says the profile was not found when there is no data', async () => {
    mockProfileQuery({ data: undefined });

    await renderScreen(USER_ID);

    expect(screen.getByText('Profile not found')).toBeOnTheScreen();
    expect(screen.getByText('This musician may no longer be on Jam Finder.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeOnTheScreen();
  });

  it('shows the profile read-only, with no edit or logout button', async () => {
    mockProfileQuery({ data: profile });

    await renderScreen(USER_ID);

    expect(screen.getByText('django')).toBeOnTheScreen();
    expect(screen.getByText('Gypsy jazz guitarist')).toBeOnTheScreen();
    expect(screen.getByText('Guitar')).toBeOnTheScreen();
    expect(screen.getByText('Jams')).toBeOnTheScreen();
    expect(screen.queryByText('My jams')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Edit profile' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Se déconnecter' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /log ?out|sign ?out/i })).not.toBeOnTheScreen();
  });

  it("lists that user's created jams, then the joined ones when the tab changes", async () => {
    mockProfileQuery({ data: profile });
    mockJamQueries({
      created: [buildJam({ id: 'jam-1', title: 'Sunday jazz session' })],
      participated: [buildJam({ id: 'jam-2', title: 'Monday blues' })],
    });

    await renderScreen(USER_ID);

    expect(mockedUseProfileCreatedJams).toHaveBeenCalledWith({ userId: USER_ID, enabled: true });
    expect(screen.getByText('Sunday jazz session')).toBeOnTheScreen();
    expect(screen.queryByText('Monday blues')).not.toBeOnTheScreen();

    await userEvent.setup().press(screen.getByRole('tab', { name: 'Participated' }));

    expect(mockedUseProfileParticipatedJams).toHaveBeenLastCalledWith({ userId: USER_ID, enabled: true });
    expect(screen.getByText('Monday blues')).toBeOnTheScreen();
    expect(screen.queryByText('Sunday jazz session')).not.toBeOnTheScreen();
  });

  it('opens the jam detail when a jam is pressed', async () => {
    mockProfileQuery({ data: profile });
    mockJamQueries({ created: [buildJam({ id: 'jam-1', title: 'Sunday jazz session' })], participated: [] });

    await renderScreen(USER_ID);
    await userEvent.setup().press(screen.getByText('Sunday jazz session'));

    expect(mockedPush).toHaveBeenCalledTimes(1);
    expect(mockedPush).toHaveBeenCalledWith(Routes.jamDetail('jam-1'));
  });
});
