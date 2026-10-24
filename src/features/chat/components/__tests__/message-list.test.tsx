import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { MessageList } from '@/features/chat/components/message-list';
import type { ChatMessage } from '@/features/chat/types';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';

function buildMessage(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    senderId: OTHER_USER_ID,
    senderUsername: 'miles',
    senderAvatarUrl: null,
    body: 'Who brings the bass amp?',
    createdAt: '2026-10-24T18:00:00.000Z',
    ...overrides,
  };
}

const MESSAGES: ChatMessage[] = [
  buildMessage({ id: 'message-2', senderId: USER_ID, senderUsername: 'me', body: 'I do' }),
  buildMessage({ id: 'message-1' }),
];

type ListProps = Parameters<typeof MessageList>[0];

async function renderList(overrides: Partial<ListProps>): Promise<ListProps> {
  const props: ListProps = {
    messages: MESSAGES,
    currentUserId: USER_ID,
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: jest.fn(),
    onDeleteMessage: jest.fn(),
    ...overrides,
  };

  await render(<MessageList {...props} />);

  return props;
}

describe('MessageList', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('shows each message with the name of its sender', async () => {
    await renderList({});

    expect(screen.getByText('Who brings the bass amp?')).toBeOnTheScreen();
    expect(screen.getByText('miles')).toBeOnTheScreen();
    expect(screen.getByText('I do')).toBeOnTheScreen();
  });

  it("does not name the sender of the user's own messages", async () => {
    await renderList({});

    expect(screen.queryByText('me')).not.toBeOnTheScreen();
  });

  it('loads older messages when scrolled to the top', async () => {
    const props = await renderList({ hasNextPage: true });

    fireEvent(screen.getByLabelText('Messages'), 'onEndReached');

    expect(props.onLoadMore).toHaveBeenCalled();
  });

  it('does not load more when there are no older messages', async () => {
    const props = await renderList({ hasNextPage: false });

    fireEvent(screen.getByLabelText('Messages'), 'onEndReached');

    expect(props.onLoadMore).not.toHaveBeenCalled();
  });

  it('does not load the same page twice', async () => {
    const props = await renderList({ hasNextPage: true, isFetchingNextPage: true });

    fireEvent(screen.getByLabelText('Messages'), 'onEndReached');

    expect(props.onLoadMore).not.toHaveBeenCalled();
  });

  it('deletes an own message after confirmation', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const props = await renderList({});

    await userEvent.setup().longPress(screen.getByText('I do'));

    expect(alertSpy).toHaveBeenCalledWith('Delete message?', expect.any(String), expect.any(Array));
    const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
    buttons.find((button) => button.text === 'Delete')?.onPress?.();

    expect(props.onDeleteMessage).toHaveBeenCalledWith('message-2');
  });

  it("cannot delete someone else's message", async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    await renderList({});

    await userEvent.setup().longPress(screen.getByText('Who brings the bass amp?'));

    expect(alertSpy).not.toHaveBeenCalled();
  });
});
