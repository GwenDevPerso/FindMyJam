import { render, screen, userEvent } from '@testing-library/react-native';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('shows its label and calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" variant="primary" size="md" isLoading={false} onPress={onPress} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button label="Save" variant="primary" size="md" isLoading={false} disabled onPress={onPress} />,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    await userEvent.setup().press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('replaces the label with a busy, non-pressable state while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" variant="primary" size="md" isLoading onPress={onPress} />);

    const button = screen.getByRole('button');
    await userEvent.setup().press(button);

    expect(screen.queryByText('Save')).not.toBeOnTheScreen();
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is neither busy nor disabled by default', async () => {
    await render(<Button label="Save" variant="outline" size="sm" isLoading={false} />);

    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).not.toBeBusy();
    expect(button).toBeEnabled();
  });
});
