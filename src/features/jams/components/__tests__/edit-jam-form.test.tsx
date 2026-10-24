import { render, screen, userEvent } from '@testing-library/react-native';

import { EditJamForm } from '@/features/jams/components/edit-jam-form';
import { useUpdateJam } from '@/features/jams/hooks/use-update-jam';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { buildJam } from '@/test-utils/jams';
import type { Jam } from '@/types/domain';

jest.mock('@/features/jams/hooks/use-update-jam');
jest.mock('@/features/profile/hooks/use-reference-instruments');
jest.mock('@/features/profile/hooks/use-reference-music-styles');

// The location children search places and render a native map; replace them with plain controls that
// expose the same callbacks.
jest.mock('@/features/location/components/location-autocomplete-input', () => {
  const { Pressable, TextInput, View } = jest.requireActual<typeof import('react-native')>('react-native');

  type MockLocationInputProps = {
    value: string;
    placeholder?: string;
    onChangeText: (text: string) => void;
    onSelect: (place: { id: string; label: string; latitude: number; longitude: number }) => void;
  };

  return {
    LocationAutocompleteInput: ({ value, placeholder, onChangeText, onSelect }: MockLocationInputProps) => (
      <View>
        <TextInput value={value} placeholder={placeholder} onChangeText={onChangeText} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pick suggested place"
          onPress={() => {
            onSelect({ id: 'place-1', label: 'New Morning, Paris', latitude: 48.8721, longitude: 2.3527 });
          }}
        />
      </View>
    ),
  };
});

jest.mock('@/features/location/components/location-picker-map', () => ({
  LocationPickerMap: () => null,
}));

const mockedUseUpdateJam = jest.mocked(useUpdateJam);

const JAM_ID = '33333333-3333-4333-8333-333333333333';
const GUITAR_ID = '11111111-1111-4111-8111-111111111111';
const DRUMS_ID = '44444444-4444-4444-8444-444444444444';
const JAZZ_ID = '22222222-2222-4222-8222-222222222222';

type UpdateJamMutation = ReturnType<typeof useUpdateJam>;

function mockUpdateJam(overrides: Partial<Record<keyof UpdateJamMutation, unknown>>): jest.Mock {
  const mutateAsync = jest.fn().mockResolvedValue({ id: JAM_ID });

  mockedUseUpdateJam.mockReturnValue({
    mutateAsync,
    isPending: false,
    error: null,
    ...overrides,
  } as unknown as UpdateJamMutation);

  return mutateAsync;
}

// Built from local date parts so the expected field values do not depend on the machine's time zone.
const jam: Jam = buildJam({
  id: JAM_ID,
  title: 'Sunday jazz session',
  description: 'Bring your own amp',
  startsAt: new Date(2026, 7, 1, 20, 30, 0).toISOString(),
  locationName: 'Le Caveau',
  latitude: 48.85,
  longitude: 2.35,
  skillLevel: 'intermediate',
  maxParticipants: 6,
  instrumentIds: [GUITAR_ID],
  styleIds: [JAZZ_ID],
});

describe('EditJamForm', () => {
  beforeEach(() => {
    jest.mocked(useReferenceInstruments).mockReturnValue({
      isLoading: false,
      data: [
        { id: GUITAR_ID, name: 'Guitar', slug: 'guitar' },
        { id: DRUMS_ID, name: 'Drums', slug: 'drums' },
      ],
    } as unknown as ReturnType<typeof useReferenceInstruments>);
    jest.mocked(useReferenceMusicStyles).mockReturnValue({
      isLoading: false,
      data: [{ id: JAZZ_ID, name: 'Jazz', slug: 'jazz' }],
    } as unknown as ReturnType<typeof useReferenceMusicStyles>);
  });

  it('prefills every field from the jam', async () => {
    mockUpdateJam({});

    await render(<EditJamForm jam={jam} onSuccess={jest.fn()} />);

    expect(screen.getByDisplayValue('Sunday jazz session')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Bring your own amp')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('2026-08-01')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('20:30')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Le Caveau')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('6')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Intermediate' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'All Levels' })).not.toBeSelected();
    expect(screen.getByRole('button', { name: 'Guitar' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Drums' })).not.toBeSelected();
    expect(screen.getByRole('button', { name: 'Jazz' })).toBeSelected();
  });

  it('shows an empty description when the jam has none', async () => {
    mockUpdateJam({});

    await render(<EditJamForm jam={{ ...jam, description: null }} onSuccess={jest.fn()} />);

    expect(screen.getByPlaceholderText('What should musicians know?')).toHaveDisplayValue('');
  });

  it('does not offer to change the recurrence', async () => {
    mockUpdateJam({});
    await render(<EditJamForm jam={jam} onSuccess={jest.fn()} />);

    expect(screen.queryByText('Repeats')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Does not repeat' })).not.toBeOnTheScreen();
    expect(screen.getByPlaceholderText('YYYY-MM-DD')).toBeOnTheScreen();
  });

  it('saves an untouched form with the values of the jam', async () => {
    const mutateAsync = mockUpdateJam({});
    const onSuccess = jest.fn();
    await render(<EditJamForm jam={jam} onSuccess={onSuccess} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Save changes' }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      jamId: JAM_ID,
      input: {
        title: 'Sunday jazz session',
        description: 'Bring your own amp',
        startsAt: jam.startsAt,
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

  it('updates the jam with the edited values, then reports success', async () => {
    const mutateAsync = mockUpdateJam({});
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    await render(<EditJamForm jam={jam} onSuccess={onSuccess} />);

    await user.clear(screen.getByDisplayValue('Sunday jazz session'));
    await user.type(screen.getByPlaceholderText('Sunday jazz session'), 'Monday blues');
    await user.clear(screen.getByDisplayValue('Bring your own amp'));
    await user.clear(screen.getByDisplayValue('2026-08-01'));
    await user.type(screen.getByPlaceholderText('YYYY-MM-DD'), '2026-09-15');
    await user.clear(screen.getByDisplayValue('20:30'));
    await user.type(screen.getByPlaceholderText('20:00'), '19:00');
    await user.press(screen.getByRole('button', { name: 'Pick suggested place' }));
    await user.press(screen.getByRole('button', { name: 'Expert' }));
    await user.press(screen.getByRole('button', { name: 'Guitar' }));
    await user.press(screen.getByRole('button', { name: 'Drums' }));
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      jamId: JAM_ID,
      input: {
        title: 'Monday blues',
        description: null,
        startsAt: new Date(2026, 8, 15, 19, 0, 0).toISOString(),
        locationName: 'New Morning, Paris',
        latitude: 48.8721,
        longitude: 2.3527,
        skillLevel: 'expert',
        maxParticipants: 6,
        instrumentIds: [DRUMS_ID],
        styleIds: [JAZZ_ID],
      },
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows the validation message and updates nothing when the title is cleared', async () => {
    const mutateAsync = mockUpdateJam({});
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    await render(<EditJamForm jam={jam} onSuccess={onSuccess} />);

    await user.clear(screen.getByDisplayValue('Sunday jazz session'));
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Title is required')).toBeOnTheScreen();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows the error returned by the update attempt', async () => {
    mockUpdateJam({ error: new Error('Only the creator can update this jam') });

    await render(<EditJamForm jam={jam} onSuccess={jest.fn()} />);

    expect(screen.getByText('Only the creator can update this jam')).toBeOnTheScreen();
  });

  it('shows the submit button as busy while the jam is being saved', async () => {
    mockUpdateJam({ isPending: true });

    await render(<EditJamForm jam={jam} onSuccess={jest.fn()} />);

    expect(screen.queryByText('Save changes')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { busy: true })).toBeDisabled();
  });
});
