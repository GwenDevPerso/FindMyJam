import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { EmptyState } from '@/components/layout/empty-state';

describe('EmptyState', () => {
  it('shows the title alone when nothing else is given', async () => {
    await render(<EmptyState title="No jams found" />);

    expect(screen.getByText('No jams found')).toBeOnTheScreen();
  });

  it('shows the description', async () => {
    await render(<EmptyState title="No jams found" description="Create one or adjust your filters." />);

    expect(screen.getByText('Create one or adjust your filters.')).toBeOnTheScreen();
  });

  it('renders the icon and the action', async () => {
    await render(
      <EmptyState title="No jams found" icon={<Text>music-icon</Text>} action={<Text>Create a jam</Text>} />,
    );

    expect(screen.getByText('music-icon')).toBeOnTheScreen();
    expect(screen.getByText('Create a jam')).toBeOnTheScreen();
  });
});
