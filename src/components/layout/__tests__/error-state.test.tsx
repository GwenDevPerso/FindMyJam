import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ErrorState } from '@/components/layout/error-state';

describe('ErrorState', () => {
  it('shows the title and the message', async () => {
    await render(<ErrorState title="Unable to load jams" message="Network request failed" />);

    expect(screen.getByText('Unable to load jams')).toBeOnTheScreen();
    expect(screen.getByText('Network request failed')).toBeOnTheScreen();
  });

  it('offers no retry button without an onRetry handler', async () => {
    await render(<ErrorState title="Unable to load jams" message="Network request failed" />);

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('calls onRetry when "Try again" is pressed', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState title="Unable to load jams" message="Network request failed" onRetry={onRetry} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses a custom retry label', async () => {
    await render(
      <ErrorState title="Oops" message="Failed" onRetry={jest.fn()} retryLabel="Reload" />,
    );

    expect(screen.getByRole('button', { name: 'Reload' })).toBeOnTheScreen();
    expect(screen.queryByText('Try again')).not.toBeOnTheScreen();
  });

  it('renders the given icon', async () => {
    await render(<ErrorState title="Oops" message="Failed" icon={<Text>warning-icon</Text>} />);

    expect(screen.getByText('warning-icon')).toBeOnTheScreen();
  });
});
