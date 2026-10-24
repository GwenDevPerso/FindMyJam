import { render, screen } from '@testing-library/react-native';

import { JamRecurrenceSummary } from '@/features/jams/components/jam-recurrence-summary';

// Built in local time so the weekday does not depend on the machine's time zone (Tuesday, October 13th 2026).
const STARTS_AT = new Date(2026, 9, 13, 20, 0, 0).toISOString();

describe('JamRecurrenceSummary', () => {
  it('says how the series repeats', async () => {
    await render(<JamRecurrenceSummary recurrence="monthly_weekday" startsAt={STARTS_AT} />);

    expect(screen.getByText('Repeats every month on the 2nd Tuesday')).toBeOnTheScreen();
  });

  it('renders nothing for a one-off jam', async () => {
    await render(<JamRecurrenceSummary recurrence={null} startsAt={STARTS_AT} />);

    expect(screen.queryByText(/Repeats/)).not.toBeOnTheScreen();
  });
});
