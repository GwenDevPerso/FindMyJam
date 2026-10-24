import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { MessageComposer } from '@/features/chat/components/message-composer';

describe('MessageComposer', () => {
  it('cannot send an empty message', async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);

    await render(<MessageComposer onSend={onSend} isSending={false} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('cannot send a message made of spaces only', async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    await render(<MessageComposer onSend={onSend} isSending={false} />);
    await user.type(screen.getByLabelText('Message'), '   ');

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('sends the typed message, then clears the field', async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    await render(<MessageComposer onSend={onSend} isSending={false} />);
    await user.type(screen.getByLabelText('Message'), 'Who brings the bass amp?');
    await user.press(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledWith('Who brings the bass amp?');
    await waitFor(() => {
      expect(screen.getByLabelText('Message')).toHaveDisplayValue('');
    });
  });

  it('keeps the message when sending fails', async () => {
    const onSend = jest.fn().mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();

    await render(<MessageComposer onSend={onSend} isSending={false} />);
    await user.type(screen.getByLabelText('Message'), 'Hello');
    await user.press(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledWith('Hello');
    expect(screen.getByLabelText('Message')).toHaveDisplayValue('Hello');
  });

  it('cannot send while a message is being sent', async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    const { rerender } = await render(<MessageComposer onSend={onSend} isSending={false} />);
    await user.type(screen.getByLabelText('Message'), 'Hello');
    await rerender(<MessageComposer onSend={onSend} isSending={true} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
});
