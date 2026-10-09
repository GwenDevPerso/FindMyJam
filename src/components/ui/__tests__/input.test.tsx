import { render, screen, userEvent } from '@testing-library/react-native';

import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('shows its label and reports typed text', async () => {
    const onChangeText = jest.fn();
    await render(<Input label="Title" placeholder="Sunday jazz session" onChangeText={onChangeText} />);

    await userEvent.setup().type(screen.getByPlaceholderText('Sunday jazz session'), 'Jam');

    expect(screen.getByText('Title')).toBeOnTheScreen();
    expect(onChangeText).toHaveBeenLastCalledWith('Jam');
  });

  it('shows the error message under the field', async () => {
    await render(<Input label="Title" placeholder="Title" error="Title is required" />);

    expect(screen.getByText('Title is required')).toBeOnTheScreen();
  });

  it('renders no label when none is given', async () => {
    await render(<Input placeholder="Search by username" value="miles" />);

    expect(screen.getByDisplayValue('miles')).toBeOnTheScreen();
    expect(screen.queryByText('Title')).not.toBeOnTheScreen();
  });

  it('ignores typing when not editable', async () => {
    const onChangeText = jest.fn();
    await render(<Input placeholder="Title" editable={false} onChangeText={onChangeText} />);

    await userEvent.setup().type(screen.getByPlaceholderText('Title'), 'Jam');

    expect(onChangeText).not.toHaveBeenCalled();
  });
});
