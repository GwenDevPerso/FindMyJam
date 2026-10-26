import { render, screen, userEvent } from '@testing-library/react-native';

import { MapFilters } from '@/features/map/components/map-filters';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { useMapFiltersStore } from '@/store/map-filters.store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/features/profile/hooks/use-reference-instruments');
jest.mock('@/features/profile/hooks/use-reference-music-styles');

const mockedUseReferenceInstruments = jest.mocked(useReferenceInstruments);
const mockedUseReferenceMusicStyles = jest.mocked(useReferenceMusicStyles);

const GUITAR = { id: 'guitar-id', name: 'Guitar', slug: 'guitar' };
const JAZZ = { id: 'jazz-id', name: 'Jazz', slug: 'jazz' };

type ReferenceQueryState = {
  data?: { id: string; name: string; slug: string }[];
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => void;
};

function mockReferenceQueries(instruments: ReferenceQueryState, styles: ReferenceQueryState): void {
  mockedUseReferenceInstruments.mockReturnValue({
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...instruments,
  } as unknown as ReturnType<typeof useReferenceInstruments>);
  mockedUseReferenceMusicStyles.mockReturnValue({
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...styles,
  } as unknown as ReturnType<typeof useReferenceMusicStyles>);
}

describe('MapFilters', () => {
  beforeEach(() => {
    useMapFiltersStore.setState(useMapFiltersStore.getInitialState(), true);
    mockReferenceQueries({ data: [GUITAR] }, { data: [JAZZ] });
  });

  it('shows the distance and date choices, and no counter or reset with the default filters', async () => {
    await render(<MapFilters showDistance={true} />);

    expect(screen.getByRole('button', { name: '25 km' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Any date' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Today' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'This weekend' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next 7 days' })).toBeOnTheScreen();
    expect(screen.queryByLabelText(/active filter/)).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeOnTheScreen();
  });

  it('hides the distance choices when asked', async () => {
    await render(<MapFilters showDistance={false} />);

    expect(screen.queryByRole('button', { name: '25 km' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Today' })).toBeOnTheScreen();
  });

  it('selects a date filter', async () => {
    await render(<MapFilters showDistance={true} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'This weekend' }));

    expect(useMapFiltersStore.getState().dateFilter).toBe('weekend');
    expect(screen.getByRole('button', { name: 'This weekend' })).toBeSelected();
  });

  it('shows the instruments and styles once expanded and toggles them', async () => {
    const user = userEvent.setup();
    await render(<MapFilters showDistance={true} />);

    expect(screen.queryByRole('button', { name: 'Guitar' })).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'More filters' }));
    await user.press(screen.getByRole('button', { name: 'Guitar' }));
    await user.press(screen.getByRole('button', { name: 'Jazz' }));

    expect(useMapFiltersStore.getState().instrumentIds).toEqual([GUITAR.id]);
    expect(useMapFiltersStore.getState().styleIds).toEqual([JAZZ.id]);

    await user.press(screen.getByRole('button', { name: 'Fewer filters' }));

    expect(screen.queryByRole('button', { name: 'Guitar' })).not.toBeOnTheScreen();
  });

  it('counts the active filters and resets them', async () => {
    useMapFiltersStore.setState({ instrumentIds: [GUITAR.id], styleIds: [JAZZ.id], dateFilter: 'today', radiusMeters: 5_000 });
    await render(<MapFilters showDistance={true} />);

    expect(screen.getByLabelText('4 active filters')).toBeOnTheScreen();

    await userEvent.setup().press(screen.getByRole('button', { name: 'Reset' }));

    expect(useMapFiltersStore.getState()).toMatchObject({
      instrumentIds: [],
      styleIds: [],
      dateFilter: 'any',
      radiusMeters: 25_000,
    });
    expect(screen.queryByLabelText(/active filter/)).not.toBeOnTheScreen();
  });

  it('leaves the hidden radius out of the count', async () => {
    useMapFiltersStore.setState({ dateFilter: 'week', radiusMeters: 5_000 });
    await render(<MapFilters showDistance={false} />);

    expect(screen.getByLabelText('1 active filter')).toBeOnTheScreen();
  });

  it('shows a loading message while the instruments and styles load', async () => {
    mockReferenceQueries({ isLoading: true }, { isLoading: true });
    await render(<MapFilters showDistance={true} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'More filters' }));

    expect(screen.getByText('Loading instruments and styles…')).toBeOnTheScreen();
  });

  it('offers a retry when the instruments or styles fail to load', async () => {
    const refetchInstruments = jest.fn();
    const refetchStyles = jest.fn();
    mockReferenceQueries({ isError: true, refetch: refetchInstruments }, { data: [JAZZ], refetch: refetchStyles });
    const user = userEvent.setup();
    await render(<MapFilters showDistance={true} />);

    await user.press(screen.getByRole('button', { name: 'More filters' }));
    await user.press(screen.getByRole('button', { name: 'Retry' }));

    expect(refetchInstruments).toHaveBeenCalled();
    expect(refetchStyles).toHaveBeenCalled();
  });

  it('says so when there is no instrument or style to pick', async () => {
    mockReferenceQueries({ data: [] }, { data: [] });
    await render(<MapFilters showDistance={true} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'More filters' }));

    expect(screen.getByText('No instruments or styles available.')).toBeOnTheScreen();
  });
});
