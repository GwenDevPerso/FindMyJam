import { render, screen, userEvent } from '@testing-library/react-native';

import { JamCard } from '@/features/jams/components/jam-card';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { buildJam } from '@/test-utils/jams';
import { formatJamDateTime } from '@/utils/date';

jest.mock('@/features/profile/hooks/use-reference-instruments');
jest.mock('@/features/profile/hooks/use-reference-music-styles');

const mockedUseReferenceInstruments = jest.mocked(useReferenceInstruments);
const mockedUseReferenceMusicStyles = jest.mocked(useReferenceMusicStyles);

const GUITAR_ID = '33333333-3333-4333-8333-333333333333';
const DRUMS_ID = '44444444-4444-4444-8444-444444444444';
const JAZZ_ID = '55555555-5555-4555-8555-555555555555';

describe('JamCard', () => {
  beforeEach(() => {
    mockedUseReferenceInstruments.mockReturnValue({
      data: [
        { id: GUITAR_ID, name: 'Guitar', slug: 'guitar' },
        { id: DRUMS_ID, name: 'Drums', slug: 'drums' },
      ],
    } as unknown as ReturnType<typeof useReferenceInstruments>);
    mockedUseReferenceMusicStyles.mockReturnValue({
      data: [{ id: JAZZ_ID, name: 'Jazz', slug: 'jazz' }],
    } as unknown as ReturnType<typeof useReferenceMusicStyles>);
  });

  it('shows the title, date, location, description, level, participants and distance', async () => {
    const jam = buildJam({});
    await render(<JamCard jam={jam} onPress={jest.fn()} />);

    expect(screen.getByText('Sunday jazz session')).toBeOnTheScreen();
    expect(screen.getByText(formatJamDateTime(jam.startsAt))).toBeOnTheScreen();
    expect(screen.getByText('Le Caveau')).toBeOnTheScreen();
    expect(screen.getByText('Bring your own amp')).toBeOnTheScreen();
    expect(screen.getByText('All Levels')).toBeOnTheScreen();
    expect(screen.getByText('3 / 6')).toBeOnTheScreen();
    expect(screen.getByText('1.2 km')).toBeOnTheScreen();
  });

  it('leaves out the distance and the description when they are unknown', async () => {
    await render(<JamCard jam={buildJam({ distanceMeters: null, description: null })} onPress={jest.fn()} />);

    expect(screen.queryByText(/ km$| m$/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Bring your own amp')).not.toBeOnTheScreen();
  });

  it('shows only the instruments and styles the jam is looking for', async () => {
    await render(
      <JamCard jam={buildJam({ instrumentIds: [GUITAR_ID], styleIds: [JAZZ_ID] })} onPress={jest.fn()} />,
    );

    expect(screen.getByText('Guitar')).toBeOnTheScreen();
    expect(screen.getByText('Jazz')).toBeOnTheScreen();
    expect(screen.queryByText('Drums')).not.toBeOnTheScreen();
  });

  it('calls onPress with the jam id when pressed', async () => {
    const onPress = jest.fn();
    const jam = buildJam({ id: 'jam-42' });
    await render(<JamCard jam={jam} onPress={onPress} />);

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: `Jam: Sunday jazz session, ${formatJamDateTime(jam.startsAt)}` }));

    expect(onPress).toHaveBeenCalledWith('jam-42');
  });
});
