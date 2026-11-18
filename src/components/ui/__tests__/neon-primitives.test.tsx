import { render, screen, userEvent } from '@testing-library/react-native';

import { AvatarStack } from '@/components/ui/avatar-stack';
import { Chip } from '@/components/ui/chip';
import { CountBadge } from '@/components/ui/count-badge';
import { Horizon } from '@/components/ui/horizon';
import { IconButton } from '@/components/ui/icon-button';

describe('Chip', () => {
  it('exposes its selection and reports presses', async () => {
    const onPress = jest.fn();
    await render(<Chip label="25 km" variant="segment" isSelected={true} onPress={onPress} />);

    await userEvent.setup().press(screen.getByRole('button', { name: '25 km' }));

    expect(screen.getByRole('button', { name: '25 km' })).toBeSelected();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('CountBadge', () => {
  it('renders nothing for a count of 0', async () => {
    await render(<CountBadge count={0} accessibilityLabel="0 unread" />);

    expect(screen.queryByLabelText('0 unread')).not.toBeOnTheScreen();
  });

  it('caps the count at 99+', async () => {
    await render(<CountBadge count={140} accessibilityLabel="140 unread" />);

    expect(screen.getByLabelText('140 unread')).toBeOnTheScreen();
    expect(screen.getByText('99+')).toBeOnTheScreen();
  });
});

describe('AvatarStack', () => {
  it('shows up to max avatars, then counts the rest', async () => {
    const avatars = ['Ana', 'Bo', 'Cy', 'Di'].map((name) => ({ id: name, source: null, fallback: name }));
    await render(<AvatarStack avatars={avatars} max={3} />);

    expect(screen.getByText('A')).toBeOnTheScreen();
    expect(screen.getByText('C')).toBeOnTheScreen();
    expect(screen.queryByText('D')).not.toBeOnTheScreen();
    expect(screen.getByText('+1')).toBeOnTheScreen();
  });
});

describe('IconButton', () => {
  it('is a labelled button', async () => {
    const onPress = jest.fn();
    await render(<IconButton accessibilityLabel="Open my calendar" variant="default" onPress={onPress} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Open my calendar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Horizon', () => {
  it('renders as decoration hidden from screen readers', async () => {
    await render(<Horizon variant="header" />);

    expect(screen.toJSON()).not.toBeNull();
    expect(screen.queryByRole('image')).not.toBeOnTheScreen();
  });
});
