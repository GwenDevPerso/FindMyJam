import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert, type AlertButton } from 'react-native';

import { Routes } from '@/constants/routes';
import { JamOwnerActions } from '@/features/jams/components/jam-owner-actions';
import { useDeleteJam } from '@/features/jams/hooks/use-delete-jam';
import { useDeleteJamSeries } from '@/features/jams/hooks/use-delete-jam-series';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
}));
jest.mock('@/features/jams/hooks/use-delete-jam');
jest.mock('@/features/jams/hooks/use-delete-jam-series');

const mockedUseDeleteJam = jest.mocked(useDeleteJam);
const mockedUseDeleteJamSeries = jest.mocked(useDeleteJamSeries);
const mockedRouter = jest.mocked(router);

const JAM_ID = 'jam-1';
const SERIES_ID = 'series-1';

type DeleteJamMutation = ReturnType<typeof useDeleteJam>;
type MutateOptions = { onSuccess?: () => void };

/** `succeeds` decides whether the mocked mutation calls the `onSuccess` it was given, as React Query would. */
function mockDeleteJam(
  overrides: Partial<Record<keyof DeleteJamMutation, unknown>>,
  { succeeds }: { succeeds: boolean },
): jest.Mock {
  const mutate = jest.fn((_jamId: string, options?: MutateOptions) => {
    if (succeeds) {
      options?.onSuccess?.();
    }
  });

  mockedUseDeleteJam.mockReturnValue({
    mutate,
    isPending: false,
    error: null,
    ...overrides,
  } as unknown as DeleteJamMutation);

  return mutate;
}

function mockDeleteJamSeries(
  overrides: Partial<Record<keyof ReturnType<typeof useDeleteJamSeries>, unknown>>,
  { succeeds }: { succeeds: boolean },
): jest.Mock {
  const mutate = jest.fn((_seriesId: string, options?: MutateOptions) => {
    if (succeeds) {
      options?.onSuccess?.();
    }
  });

  mockedUseDeleteJamSeries.mockReturnValue({
    mutate,
    isPending: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useDeleteJamSeries>);

  return mutate;
}

/** Presses "Delete jam" and returns the buttons of the confirmation dialog it opened. */
async function openConfirmation(alertSpy: jest.SpyInstance): Promise<AlertButton[]> {
  await userEvent.setup().press(screen.getByRole('button', { name: 'Delete jam' }));

  expect(alertSpy).toHaveBeenCalledTimes(1);

  return (alertSpy.mock.calls[0][2] ?? []) as AlertButton[];
}

function findButton(buttons: AlertButton[], text: string): AlertButton {
  const button = buttons.find((candidate) => candidate.text === text);

  if (button === undefined) {
    throw new Error(`No "${text}" button in the confirmation dialog`);
  }

  return button;
}

describe('JamOwnerActions', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockedRouter.canGoBack.mockReturnValue(true);
    mockDeleteJamSeries({}, { succeeds: true });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('opens the edit screen of the jam when "Edit jam" is pressed', async () => {
    const mutate = mockDeleteJam({}, { succeeds: true });
    await render(<JamOwnerActions jamId={JAM_ID} seriesId={null} jamTitle="Sunday jazz session" />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Edit jam' }));

    expect(mockedRouter.push).toHaveBeenCalledTimes(1);
    expect(mockedRouter.push).toHaveBeenCalledWith(Routes.jamEdit(JAM_ID));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('asks for confirmation before deleting anything', async () => {
    const mutate = mockDeleteJam({}, { succeeds: true });
    await render(<JamOwnerActions jamId={JAM_ID} seriesId={null} jamTitle="Sunday jazz session" />);

    const buttons = await openConfirmation(alertSpy);

    expect(alertSpy.mock.calls[0][0]).toBe('Delete jam');
    expect(alertSpy.mock.calls[0][1]).toContain('Sunday jazz session');
    expect(buttons.map((button) => button.text)).toEqual(['Cancel', 'Delete']);
    expect(findButton(buttons, 'Cancel').style).toBe('cancel');
    expect(findButton(buttons, 'Delete').style).toBe('destructive');
    expect(mutate).not.toHaveBeenCalled();
    expect(mockedRouter.back).not.toHaveBeenCalled();
  });

  it('deletes the jam and goes back once the deletion is confirmed', async () => {
    const mutate = mockDeleteJam({}, { succeeds: true });
    await render(<JamOwnerActions jamId={JAM_ID} seriesId={null} jamTitle="Sunday jazz session" />);

    const buttons = await openConfirmation(alertSpy);
    findButton(buttons, 'Delete').onPress?.();

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toBe(JAM_ID);
    expect(mockedRouter.back).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  it('goes to the jam list after deleting when there is no screen to go back to', async () => {
    mockedRouter.canGoBack.mockReturnValue(false);
    mockDeleteJam({}, { succeeds: true });
    await render(<JamOwnerActions jamId={JAM_ID} seriesId={null} jamTitle="Sunday jazz session" />);

    const buttons = await openConfirmation(alertSpy);
    findButton(buttons, 'Delete').onPress?.();

    expect(mockedRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).toHaveBeenCalledWith(Routes.jamsAll);
    expect(mockedRouter.back).not.toHaveBeenCalled();
  });

  it('stays on the screen when the deletion does not succeed', async () => {
    const mutate = mockDeleteJam({}, { succeeds: false });
    await render(<JamOwnerActions jamId={JAM_ID} seriesId={null} jamTitle="Sunday jazz session" />);

    const buttons = await openConfirmation(alertSpy);
    findButton(buttons, 'Delete').onPress?.();

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mockedRouter.back).not.toHaveBeenCalled();
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  it('deletes nothing and stays on the screen when the confirmation is cancelled', async () => {
    const mutate = mockDeleteJam({}, { succeeds: true });
    await render(<JamOwnerActions jamId={JAM_ID} seriesId={null} jamTitle="Sunday jazz session" />);

    const buttons = await openConfirmation(alertSpy);
    findButton(buttons, 'Cancel').onPress?.();

    expect(mutate).not.toHaveBeenCalled();
    expect(mockedRouter.back).not.toHaveBeenCalled();
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  it('shows the error returned by the deletion attempt', async () => {
    mockDeleteJam({ error: new Error('Only the creator can delete this jam') }, { succeeds: false });

    await render(<JamOwnerActions jamId={JAM_ID} seriesId={null} jamTitle="Sunday jazz session" />);

    expect(screen.getByText('Only the creator can delete this jam')).toBeOnTheScreen();
  });

  it('shows the delete button as busy while the jam is being deleted', async () => {
    mockDeleteJam({ isPending: true }, { succeeds: false });

    await render(<JamOwnerActions jamId={JAM_ID} seriesId={null} jamTitle="Sunday jazz session" />);

    expect(screen.queryByText('Delete jam')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { busy: true })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit jam' })).toBeOnTheScreen();
  });

  describe('for a date of a series', () => {
    async function renderSeriesActions(): Promise<void> {
      await render(<JamOwnerActions jamId={JAM_ID} seriesId={SERIES_ID} jamTitle="Tuesday jazz night" />);
    }

    it('asks whether to delete this date or all upcoming dates', async () => {
      const mutate = mockDeleteJam({}, { succeeds: true });
      const mutateSeries = mockDeleteJamSeries({}, { succeeds: true });
      await renderSeriesActions();

      const buttons = await openConfirmation(alertSpy);

      expect(alertSpy.mock.calls[0][0]).toBe('Delete jam');
      expect(alertSpy.mock.calls[0][1]).toContain('Tuesday jazz night');
      expect(buttons.map((button) => button.text)).toEqual(['Cancel', 'This date', 'All upcoming dates']);
      expect(findButton(buttons, 'Cancel').style).toBe('cancel');
      expect(findButton(buttons, 'This date').style).toBe('destructive');
      expect(findButton(buttons, 'All upcoming dates').style).toBe('destructive');
      expect(mutate).not.toHaveBeenCalled();
      expect(mutateSeries).not.toHaveBeenCalled();
    });

    it('deletes only this date with "This date"', async () => {
      const mutate = mockDeleteJam({}, { succeeds: true });
      const mutateSeries = mockDeleteJamSeries({}, { succeeds: true });
      await renderSeriesActions();

      const buttons = await openConfirmation(alertSpy);
      findButton(buttons, 'This date').onPress?.();

      expect(mutate).toHaveBeenCalledTimes(1);
      expect(mutate.mock.calls[0][0]).toBe(JAM_ID);
      expect(mutateSeries).not.toHaveBeenCalled();
      expect(mockedRouter.back).toHaveBeenCalledTimes(1);
    });

    it('deletes the series with "All upcoming dates", then leaves the screen', async () => {
      const mutate = mockDeleteJam({}, { succeeds: true });
      const mutateSeries = mockDeleteJamSeries({}, { succeeds: true });
      await renderSeriesActions();

      const buttons = await openConfirmation(alertSpy);
      findButton(buttons, 'All upcoming dates').onPress?.();

      expect(mutateSeries).toHaveBeenCalledTimes(1);
      expect(mutateSeries.mock.calls[0][0]).toBe(SERIES_ID);
      expect(mutate).not.toHaveBeenCalled();
      expect(mockedRouter.back).toHaveBeenCalledTimes(1);
    });

    it('shows the error returned by the series deletion attempt', async () => {
      mockDeleteJam({}, { succeeds: false });
      mockDeleteJamSeries({ error: new Error('Jam series not found') }, { succeeds: false });

      await renderSeriesActions();

      expect(screen.getByText('Jam series not found')).toBeOnTheScreen();
    });

    it('shows the delete button as busy while the series is being deleted', async () => {
      mockDeleteJam({}, { succeeds: false });
      mockDeleteJamSeries({ isPending: true }, { succeeds: false });

      await renderSeriesActions();

      expect(screen.queryByText('Delete jam')).not.toBeOnTheScreen();
      expect(screen.getByRole('button', { busy: true })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Edit jam' })).toBeDisabled();
    });
  });
});
