import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Routes } from '@/constants/routes';
import { HomeScreen } from '@/features/home/components/home-screen';
import { useJams } from '@/features/jams/hooks/use-jams';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks/use-unread-notifications-count';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { buildJam } from '@/test-utils/jams';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));
jest.mock('@/features/jams/hooks/use-jams');
jest.mock('@/features/map/hooks/use-user-location');
jest.mock('@/features/notifications/hooks/use-unread-notifications-count');
jest.mock('@/features/profile/hooks/use-profile');
jest.mock('@/features/profile/hooks/use-reference-instruments', () => ({
  useReferenceInstruments: () => ({ data: [] }),
}));
jest.mock('@/features/profile/hooks/use-reference-music-styles', () => ({
  useReferenceMusicStyles: () => ({ data: [] }),
}));
jest.mock('@/features/jams/components/jam-calendar-modal', () => ({
  JamCalendarModal: () => null,
}));

const mockedRouter = jest.mocked(router);
const mockedUseJams = jest.mocked(useJams);

function mockJams(overrides: Record<string, unknown>): void {
  mockedUseJams.mockReturnValue({
    data: { jams: [] },
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useJams>);
}

async function renderHome(): Promise<void> {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}>
      <HomeScreen />
    </SafeAreaProvider>,
  );
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useProfile).mockReturnValue({
      data: { username: 'miles', instruments: [], musicStyles: [] },
    } as unknown as ReturnType<typeof useProfile>);
    jest.mocked(useUserLocation).mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useUserLocation>);
    jest
      .mocked(useUnreadNotificationsCount)
      .mockReturnValue({ data: 0 } as unknown as ReturnType<typeof useUnreadNotificationsCount>);
    mockJams({});
  });

  it('shows the username', async () => {
    await renderHome();

    expect(screen.getByText('miles')).toBeOnTheScreen();
  });

  it.each([
    ['Explore map', Routes.explore],
    ['Find musicians', Routes.friendsSearch],
    ['Create jam', Routes.jamsCreate],
  ])('opens %s from its quick action', async (label, route) => {
    await renderHome();

    await userEvent.press(screen.getByRole('button', { name: label }));

    expect(mockedRouter.push).toHaveBeenCalledWith(route);
  });

  it('opens a nearby jam from its card', async () => {
    const jam = buildJam({});
    mockJams({ data: { jams: [jam] } });
    await renderHome();

    await userEvent.press(screen.getByText(jam.title));

    expect(mockedRouter.push).toHaveBeenCalledWith(Routes.jamDetail(jam.id));
  });

  it('shows a loader while the jams load', async () => {
    mockJams({ data: undefined, isLoading: true });
    await renderHome();

    expect(screen.getByText('Loading jams…')).toBeOnTheScreen();
  });

  it('shows an error with a retry when the jams fail to load', async () => {
    const refetch = jest.fn();
    mockJams({ data: undefined, isError: true, error: new Error('Network down'), refetch });
    await renderHome();

    expect(screen.getByText('Unable to load jams')).toBeOnTheScreen();
    await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows an empty state when no jam is nearby', async () => {
    await renderHome();

    expect(screen.getByText('No jams nearby')).toBeOnTheScreen();
  });
});
