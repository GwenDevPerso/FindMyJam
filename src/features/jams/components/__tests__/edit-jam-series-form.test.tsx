import { render, screen, userEvent } from '@testing-library/react-native';

import { EditJamSeriesForm } from '@/features/jams/components/edit-jam-series-form';
import { useUpdateJamSeries } from '@/features/jams/hooks/use-update-jam-series';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { buildJam } from '@/test-utils/jams';
import type { Jam } from '@/types/domain';

jest.mock('@/features/jams/hooks/use-update-jam-series');
jest.mock('@/features/profile/hooks/use-reference-instruments');
jest.mock('@/features/profile/hooks/use-reference-music-styles');

// The location children search places and render a native map; they are not what this form decides.
jest.mock('@/features/location/components/location-autocomplete-input', () => ({
  LocationAutocompleteInput: () => null,
}));
jest.mock('@/features/location/components/location-picker-map', () => ({
  LocationPickerMap: () => null,
}));

const mockedUseUpdateJamSeries = jest.mocked(useUpdateJamSeries);

const JAM_ID = '33333333-3333-4333-8333-333333333333';
const SERIES_ID = '77777777-7777-4777-8777-777777777777';
const GUITAR_ID = '11111111-1111-4111-8111-111111111111';
const JAZZ_ID = '22222222-2222-4222-8222-222222222222';

type UpdateJamSeriesMutation = ReturnType<typeof useUpdateJamSeries>;

function mockUpdateJamSeries(overrides: Partial<Record<keyof UpdateJamSeriesMutation, unknown>>): jest.Mock {
  const mutateAsync = jest.fn().mockResolvedValue(undefined);

  mockedUseUpdateJamSeries.mockReturnValue({
    mutateAsync,
    isPending: false,
    error: null,
    ...overrides,
  } as unknown as UpdateJamSeriesMutation);

  return mutateAsync;
}

// Built from local date parts so the expected field values do not depend on the machine's time zone.
const jam: Jam = buildJam({
  id: JAM_ID,
  seriesId: SERIES_ID,
  title: 'Tuesday jazz night',
  description: 'Bring your own amp',
  startsAt: new Date(2026, 9, 13, 20, 30, 0).toISOString(),
  locationName: 'Le Caveau',
  latitude: 48.85,
  longitude: 2.35,
  skillLevel: 'intermediate',
  maxParticipants: 6,
  instrumentIds: [GUITAR_ID],
  styleIds: [JAZZ_ID],
});

async function renderForm(onSuccess: () => void): Promise<void> {
  await render(<EditJamSeriesForm jam={jam} seriesId={SERIES_ID} onSuccess={onSuccess} />);
}

describe('EditJamSeriesForm', () => {
  beforeEach(() => {
    jest.mocked(useReferenceInstruments).mockReturnValue({
      isLoading: false,
      data: [{ id: GUITAR_ID, name: 'Guitar', slug: 'guitar' }],
    } as unknown as ReturnType<typeof useReferenceInstruments>);
    jest.mocked(useReferenceMusicStyles).mockReturnValue({
      isLoading: false,
      data: [{ id: JAZZ_ID, name: 'Jazz', slug: 'jazz' }],
    } as unknown as ReturnType<typeof useReferenceMusicStyles>);
  });

  it('hides the date and explains how to move the series to another day', async () => {
    mockUpdateJamSeries({});
    await renderForm(jest.fn());

    expect(screen.queryByPlaceholderText('YYYY-MM-DD')).not.toBeOnTheScreen();
    expect(screen.queryByText('Repeats')).not.toBeOnTheScreen();
    expect(screen.getByDisplayValue('20:30')).toBeOnTheScreen();
    expect(
      screen.getByText('Changes apply to all upcoming dates. To move the series to another day, delete it and create a new one.'),
    ).toBeOnTheScreen();
  });

  it('saves the template of the series with the edited time of day, then reports success', async () => {
    const mutateAsync = mockUpdateJamSeries({});
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    await renderForm(onSuccess);

    await user.clear(screen.getByDisplayValue('Tuesday jazz night'));
    await user.type(screen.getByPlaceholderText('Sunday jazz session'), 'Wednesday blues');
    await user.clear(screen.getByDisplayValue('20:30'));
    await user.type(screen.getByPlaceholderText('20:00'), '19:00');
    await user.press(screen.getByRole('button', { name: 'Save all upcoming dates' }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      seriesId: SERIES_ID,
      input: {
        title: 'Wednesday blues',
        description: 'Bring your own amp',
        localTime: '19:00',
        locationName: 'Le Caveau',
        latitude: 48.85,
        longitude: 2.35,
        skillLevel: 'intermediate',
        maxParticipants: 6,
        instrumentIds: [GUITAR_ID],
        styleIds: [JAZZ_ID],
      },
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows the validation message and saves nothing when the time is invalid', async () => {
    const mutateAsync = mockUpdateJamSeries({});
    const user = userEvent.setup();
    await renderForm(jest.fn());

    await user.clear(screen.getByDisplayValue('20:30'));
    await user.type(screen.getByPlaceholderText('20:00'), '8pm');
    await user.press(screen.getByRole('button', { name: 'Save all upcoming dates' }));

    expect(await screen.findByText('Use HH:MM format (e.g. 20:00)')).toBeOnTheScreen();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('shows the error returned by the update attempt', async () => {
    mockUpdateJamSeries({ error: new Error('Only the jam creator can perform this action') });
    await renderForm(jest.fn());

    expect(screen.getByText('Only the jam creator can perform this action')).toBeOnTheScreen();
  });
});
