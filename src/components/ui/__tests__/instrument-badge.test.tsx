import { render, screen } from '@testing-library/react-native';

import { InstrumentBadge } from '@/components/ui/instrument-badge';

describe('InstrumentBadge', () => {
  it('shows the instrument name', async () => {
    await render(<InstrumentBadge name="Guitar" slug="guitar" size="md" />);

    expect(screen.getByText('Guitar')).toBeOnTheScreen();
  });

  it('exposes the instrument through its accessibility label', async () => {
    await render(<InstrumentBadge name="Drums" slug="drums" size="sm" />);

    expect(screen.getByLabelText('Instrument: Drums')).toBeOnTheScreen();
  });

  it('renders an unknown instrument slug without crashing', async () => {
    await render(<InstrumentBadge name="Theremin" slug="not-a-known-slug" size="md" />);

    expect(screen.getByText('Theremin')).toBeOnTheScreen();
  });
});
