import { render, screen, userEvent } from '@testing-library/react-native';

import { CreateJamForm } from '@/features/jams/components/create-jam-form';
import { useCreateJam } from '@/features/jams/hooks/use-create-jam';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';

jest.mock('@/features/jams/hooks/use-create-jam');
jest.mock('@/features/profile/hooks/use-reference-instruments');
jest.mock('@/features/profile/hooks/use-reference-music-styles');

// The location children search places and render a native map; replace them with plain controls that
// expose the same callbacks.
jest.mock('@/features/location/components/location-autocomplete-input', () => {
  const { Pressable, Text, TextInput, View } = jest.requireActual<typeof import('react-native')>('react-native');

  type MockLocationInputProps = {
    value: string;
    placeholder?: string;
    error?: string;
    onChangeText: (text: string) => void;
    onSelect: (place: { id: string; label: string; latitude: number; longitude: number }) => void;
  };

  return {
    LocationAutocompleteInput: ({ value, placeholder, error, onChangeText, onSelect }: MockLocationInputProps) => (
      <View>
        <TextInput value={value} placeholder={placeholder} onChangeText={onChangeText} />
        {error !== undefined ? <Text>{error}</Text> : null}
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

const mockedUseCreateJam = jest.mocked(useCreateJam);
const mockedUseReferenceInstruments = jest.mocked(useReferenceInstruments);
const mockedUseReferenceMusicStyles = jest.mocked(useReferenceMusicStyles);

const GUITAR_ID = '11111111-1111-4111-8111-111111111111';
const JAZZ_ID = '22222222-2222-4222-8222-222222222222';

type CreateJamMutation = ReturnType<typeof useCreateJam>;

function mockCreateJam(overrides: Partial<Record<keyof CreateJamMutation, unknown>>): jest.Mock {
  const mutateAsync = jest.fn().mockResolvedValue({ id: 'jam-1' });

  mockedUseCreateJam.mockReturnValue({
    mutateAsync,
    isPending: false,
    error: null,
    ...overrides,
  } as unknown as CreateJamMutation);

  return mutateAsync;
}

function mockReferenceData(isLoading: boolean): void {
  mockedUseReferenceInstruments.mockReturnValue({
    isLoading,
    data: isLoading ? undefined : [{ id: GUITAR_ID, name: 'Guitar', slug: 'guitar' }],
  } as unknown as ReturnType<typeof useReferenceInstruments>);
  mockedUseReferenceMusicStyles.mockReturnValue({
    isLoading: false,
    data: [{ id: JAZZ_ID, name: 'Jazz', slug: 'jazz' }],
  } as unknown as ReturnType<typeof useReferenceMusicStyles>);
}

async function renderForm(onSuccess: (jamId: string) => void): Promise<void> {
  await render(<CreateJamForm defaultLatitude={48.8566} defaultLongitude={2.3522} onSuccess={onSuccess} />);
}

describe('CreateJamForm', () => {
  beforeEach(() => {
    mockReferenceData(false);
  });

  it('shows required-field messages and creates nothing when submitted empty', async () => {
    const mutateAsync = mockCreateJam({});
    const onSuccess = jest.fn();
    await renderForm(onSuccess);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Create jam' }));

    expect(await screen.findByText('Title is required')).toBeOnTheScreen();
    expect(screen.getByText('Location is required')).toBeOnTheScreen();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('rejects a time that is not HH:MM', async () => {
    const mutateAsync = mockCreateJam({});
    const user = userEvent.setup();
    await renderForm(jest.fn());

    await user.type(screen.getByPlaceholderText('Sunday jazz session'), 'Monday blues');
    await user.type(screen.getByPlaceholderText('Search for a venue or address'), 'Le Caveau');
    await user.clear(screen.getByPlaceholderText('20:00'));
    await user.type(screen.getByPlaceholderText('20:00'), '8pm');
    await user.press(screen.getByRole('button', { name: 'Create jam' }));

    expect(await screen.findByText('Use HH:MM format (e.g. 20:00)')).toBeOnTheScreen();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('creates the jam with the entered values and the defaults, then reports its id', async () => {
    const mutateAsync = mockCreateJam({});
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    await renderForm(onSuccess);

    await user.type(screen.getByPlaceholderText('Sunday jazz session'), 'Monday blues');
    await user.clear(screen.getByPlaceholderText('YYYY-MM-DD'));
    await user.type(screen.getByPlaceholderText('YYYY-MM-DD'), '2026-08-01');
    await user.type(screen.getByPlaceholderText('Search for a venue or address'), 'Le Caveau');
    await user.press(screen.getByRole('button', { name: 'Create jam' }));

    expect(await screen.findByDisplayValue('Monday blues')).toBeOnTheScreen();
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      title: 'Monday blues',
      description: null,
      startsAt: new Date(2026, 7, 1, 20, 0, 0).toISOString(),
      locationName: 'Le Caveau',
      latitude: 48.8566,
      longitude: 2.3522,
      skillLevel: 'all_levels',
      maxParticipants: 10,
      instrumentIds: [],
      styleIds: [],
    });
    expect(onSuccess).toHaveBeenCalledWith('jam-1');
  });

  it('includes the picked place, skill level, instruments, styles and description', async () => {
    const mutateAsync = mockCreateJam({});
    const user = userEvent.setup();
    await renderForm(jest.fn());

    await user.type(screen.getByPlaceholderText('Sunday jazz session'), 'Monday blues');
    await user.type(screen.getByPlaceholderText('What should musicians know?'), 'Bring your own amp');
    await user.press(screen.getByRole('button', { name: 'Pick suggested place' }));
    await user.press(screen.getByRole('button', { name: 'Beginner' }));
    await user.press(screen.getByRole('button', { name: 'Guitar' }));
    await user.press(screen.getByRole('button', { name: 'Jazz' }));
    await user.press(screen.getByRole('button', { name: 'Create jam' }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Bring your own amp',
        locationName: 'New Morning, Paris',
        latitude: 48.8721,
        longitude: 2.3527,
        skillLevel: 'beginner',
        instrumentIds: [GUITAR_ID],
        styleIds: [JAZZ_ID],
      }),
    );
  });

  it('unselects an instrument pressed a second time', async () => {
    const mutateAsync = mockCreateJam({});
    const user = userEvent.setup();
    await renderForm(jest.fn());

    await user.type(screen.getByPlaceholderText('Sunday jazz session'), 'Monday blues');
    await user.type(screen.getByPlaceholderText('Search for a venue or address'), 'Le Caveau');
    await user.press(screen.getByRole('button', { name: 'Guitar' }));
    expect(screen.getByRole('button', { name: 'Guitar' })).toBeSelected();
    await user.press(screen.getByRole('button', { name: 'Guitar' }));
    await user.press(screen.getByRole('button', { name: 'Create jam' }));

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ instrumentIds: [] }));
  });

  it('shows the error returned by the creation attempt', async () => {
    mockCreateJam({ error: new Error('permission denied') });
    await renderForm(jest.fn());

    expect(screen.getByText('permission denied')).toBeOnTheScreen();
  });

  it('holds the submit button back while instruments and styles load', async () => {
    const mutateAsync = mockCreateJam({});
    mockReferenceData(true);
    await renderForm(jest.fn());

    const button = screen.getByRole('button', { name: 'Create jam' });
    await userEvent.setup().press(button);

    expect(screen.getByText('Loading instruments and styles…')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Jazz' })).not.toBeOnTheScreen();
    expect(button).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('shows the submit button as busy while the jam is being created', async () => {
    mockCreateJam({ isPending: true });
    await renderForm(jest.fn());

    expect(screen.queryByText('Create jam')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { busy: true })).toBeDisabled();
  });

  it.todo(
    'lets the user clear "Max participants" and type a new number (currently an empty field snaps back to 2, so typing 8 gives 28)',
  );
});
