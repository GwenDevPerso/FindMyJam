import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Routes } from '@/constants/routes';
import { EditJamScreen } from '@/features/jams/components/edit-jam-screen';
import { useJamDetail } from '@/features/jams/hooks/use-jam-detail';
import { useUpdateJam } from '@/features/jams/hooks/use-update-jam';
import type { JamDetail } from '@/features/jams/types';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { buildJam } from '@/test-utils/jams';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
}));
jest.mock('@/features/jams/hooks/use-jam-detail');
jest.mock('@/features/jams/hooks/use-update-jam');
jest.mock('@/features/profile/hooks/use-reference-instruments');
jest.mock('@/features/profile/hooks/use-reference-music-styles');

// The form's location children search places and render a native map; they are not what this screen decides.
jest.mock('@/features/location/components/location-autocomplete-input', () => ({
  LocationAutocompleteInput: () => null,
}));
jest.mock('@/features/location/components/location-picker-map', () => ({
  LocationPickerMap: () => null,
}));

const mockedUseJamDetail = jest.mocked(useJamDetail);
const mockedUseUpdateJam = jest.mocked(useUpdateJam);
const mockedRouter = jest.mocked(router);

type JamQuery = ReturnType<typeof useJamDetail>;

const JAM_ID = '33333333-3333-4333-8333-333333333333';

function buildJamDetail(overrides: Partial<JamDetail>): JamDetail {
  return {
    ...buildJam({ id: JAM_ID, title: 'Sunday jazz session' }),
    isCreator: true,
    isParticipant: false,
    ...overrides,
  };
}

// `Screen` reads the safe-area insets, so the screen needs a provider with known metrics.
async function renderScreen(jamId: string): Promise<void> {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}>
      <EditJamScreen jamId={jamId} />
    </SafeAreaProvider>,
  );
}

function mockJamQuery(overrides: Partial<Record<keyof JamQuery, unknown>>): jest.Mock {
  const refetch = jest.fn();

  mockedUseJamDetail.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
  } as unknown as JamQuery);

  return refetch;
}

function mockUpdateJam(): jest.Mock {
  const mutateAsync = jest.fn().mockResolvedValue({ id: JAM_ID });

  mockedUseUpdateJam.mockReturnValue({
    mutateAsync,
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof useUpdateJam>);

  return mutateAsync;
}

describe('EditJamScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRouter.canGoBack.mockReturnValue(true);
    mockUpdateJam();
    jest.mocked(useReferenceInstruments).mockReturnValue({
      isLoading: false,
      data: [],
    } as unknown as ReturnType<typeof useReferenceInstruments>);
    jest.mocked(useReferenceMusicStyles).mockReturnValue({
      isLoading: false,
      data: [],
    } as unknown as ReturnType<typeof useReferenceMusicStyles>);
  });

  it('loads the jam with the given id', async () => {
    mockJamQuery({ isLoading: true });

    await renderScreen(JAM_ID);

    expect(mockedUseJamDetail).toHaveBeenCalledWith({ jamId: JAM_ID, enabled: true });
  });

  it('does not query when the jam id is missing', async () => {
    mockJamQuery({});

    await renderScreen('');

    expect(mockedUseJamDetail).toHaveBeenCalledWith({ jamId: '', enabled: false });
    expect(screen.getByText('Jam not found')).toBeOnTheScreen();
  });

  it('shows a loading message while the jam loads', async () => {
    mockJamQuery({ isLoading: true });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Loading jam…')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeOnTheScreen();
  });

  it('shows the error and refetches when "Try again" is pressed', async () => {
    const refetch = mockJamQuery({ isError: true, error: new Error('Network request failed') });

    await renderScreen(JAM_ID);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Unable to load jam')).toBeOnTheScreen();
    expect(screen.getByText('Network request failed')).toBeOnTheScreen();
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeOnTheScreen();
  });

  it('says the jam was not found when there is no data', async () => {
    mockJamQuery({ data: undefined });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Jam not found')).toBeOnTheScreen();
    expect(screen.getByText('This jam may have been removed.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeOnTheScreen();
  });

  it('tells a user who is not the creator that they cannot edit, without showing the form', async () => {
    mockJamQuery({ data: buildJamDetail({ isCreator: false, isParticipant: true }) });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Only the creator can edit this jam')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeOnTheScreen();
    expect(screen.queryByDisplayValue('Sunday jazz session')).not.toBeOnTheScreen();
  });

  it('shows the creator the form prefilled with the jam', async () => {
    mockJamQuery({ data: buildJamDetail({ isCreator: true }) });

    await renderScreen(JAM_ID);

    expect(screen.getByDisplayValue('Sunday jazz session')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeOnTheScreen();
    expect(screen.queryByText('Only the creator can edit this jam')).not.toBeOnTheScreen();
  });

  it('goes back to the jam once the changes are saved', async () => {
    mockJamQuery({ data: buildJamDetail({ isCreator: true }) });
    const mutateAsync = mockUpdateJam();

    await renderScreen(JAM_ID);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Save changes' }));

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ jamId: JAM_ID }));
    expect(mockedRouter.back).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  it('opens the jam detail after saving when there is no screen to go back to', async () => {
    mockedRouter.canGoBack.mockReturnValue(false);
    mockJamQuery({ data: buildJamDetail({ isCreator: true }) });

    await renderScreen(JAM_ID);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Save changes' }));

    expect(mockedRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).toHaveBeenCalledWith(Routes.jamDetail(JAM_ID));
    expect(mockedRouter.back).not.toHaveBeenCalled();
  });
});
