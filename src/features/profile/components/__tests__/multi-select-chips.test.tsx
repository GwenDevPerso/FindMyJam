import { render, screen, userEvent } from '@testing-library/react-native';

import { MultiSelectChips } from '@/features/profile/components/multi-select-chips';

const options = [
  { id: 'guitar-id', name: 'Guitar', slug: 'guitar' },
  { id: 'drums-id', name: 'Drums', slug: 'drums' },
  { id: 'kazoo-id', name: 'Kazoo' },
];

describe('MultiSelectChips', () => {
  it('shows the label and one button per option', async () => {
    await render(
      <MultiSelectChips label="Instruments" options={options} selectedIds={[]} onToggle={jest.fn()} variant="instrument" />,
    );

    expect(screen.getByText('Instruments')).toBeOnTheScreen();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Guitar' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Kazoo' })).toBeOnTheScreen();
  });

  it('marks only the selected options as selected', async () => {
    await render(
      <MultiSelectChips
        label="Instruments"
        options={options}
        selectedIds={['drums-id']}
        onToggle={jest.fn()}
        variant="instrument"
      />,
    );

    expect(screen.getByRole('button', { name: 'Drums' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Guitar' })).not.toBeSelected();
  });

  it('calls onToggle with the id of the pressed option', async () => {
    const onToggle = jest.fn();
    await render(
      <MultiSelectChips label="Instruments" options={options} selectedIds={[]} onToggle={onToggle} variant="instrument" />,
    );

    await userEvent.setup().press(screen.getByRole('button', { name: 'Drums' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('drums-id');
  });

  it('also toggles an already selected option, in the style variant', async () => {
    const onToggle = jest.fn();
    await render(
      <MultiSelectChips
        label="Music styles"
        options={[{ id: 'jazz-id', name: 'Jazz', slug: 'jazz' }]}
        selectedIds={['jazz-id']}
        onToggle={onToggle}
        variant="style"
      />,
    );

    await userEvent.setup().press(screen.getByRole('button', { name: 'Jazz' }));

    expect(screen.getByText('Jazz')).toBeOnTheScreen();
    expect(onToggle).toHaveBeenCalledWith('jazz-id');
  });

  it('renders no button when there are no options', async () => {
    await render(
      <MultiSelectChips label="Instruments" options={[]} selectedIds={[]} onToggle={jest.fn()} variant="instrument" />,
    );

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});
