import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatScreen } from '@/features/chat/components/chat-screen';
import { useChatMessages } from '@/features/chat/hooks/use-chat-messages';
import { useChatRealtime } from '@/features/chat/hooks/use-chat-realtime';
import { useDeleteChatMessage } from '@/features/chat/hooks/use-delete-chat-message';
import { useSendChatMessage } from '@/features/chat/hooks/use-send-chat-message';
import type { ChatMessage } from '@/features/chat/types';
import { useJamDetail } from '@/features/jams/hooks/use-jam-detail';
import type { JamDetail } from '@/features/jams/types';
import { useAuthStore } from '@/store/auth.store';
import { buildJam } from '@/test-utils/jams';

jest.mock('@/features/jams/hooks/use-jam-detail');
jest.mock('@/features/chat/hooks/use-chat-messages');
jest.mock('@/features/chat/hooks/use-chat-realtime');
jest.mock('@/features/chat/hooks/use-send-chat-message');
jest.mock('@/features/chat/hooks/use-delete-chat-message');

const mockedUseJamDetail = jest.mocked(useJamDetail);
const mockedUseChatMessages = jest.mocked(useChatMessages);
const mockedUseChatRealtime = jest.mocked(useChatRealtime);
const mockedUseSendChatMessage = jest.mocked(useSendChatMessage);
const mockedUseDeleteChatMessage = jest.mocked(useDeleteChatMessage);

type JamQuery = ReturnType<typeof useJamDetail>;
type MessagesQuery = ReturnType<typeof useChatMessages>;

const USER_ID = '11111111-1111-4111-8111-111111111111';
const JAM_ID = '33333333-3333-4333-8333-333333333333';
const SERIES_ID = '77777777-7777-4777-8777-777777777777';

function buildJamDetail(overrides: Partial<JamDetail>): JamDetail {
  return {
    ...buildJam({ id: JAM_ID, title: 'Sunday jazz session' }),
    isCreator: false,
    isParticipant: true,
    recurrence: null,
    ...overrides,
  };
}

const MESSAGE: ChatMessage = {
  id: '44444444-4444-4444-8444-444444444444',
  senderId: '22222222-2222-4222-8222-222222222222',
  senderUsername: 'miles',
  senderAvatarUrl: null,
  body: 'Who brings the bass amp?',
  createdAt: '2026-10-24T18:00:00.000Z',
};

function mockJamQuery(overrides: Partial<Record<keyof JamQuery, unknown>>): jest.Mock {
  const refetch = jest.fn();

  mockedUseJamDetail.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
  } as unknown as JamQuery);

  return refetch;
}

function mockMessages(overrides: Partial<MessagesQuery>): jest.Mock {
  const refetch = jest.fn();

  mockedUseChatMessages.mockReturnValue({
    messages: [],
    isLoading: false,
    isError: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    refetch,
    ...overrides,
  });

  return refetch;
}

function mockSend(overrides: Partial<Record<keyof ReturnType<typeof useSendChatMessage>, unknown>>): jest.Mock {
  const mutateAsync = jest.fn().mockResolvedValue(undefined);

  mockedUseSendChatMessage.mockReturnValue({
    mutateAsync,
    isPending: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useSendChatMessage>);

  return mutateAsync;
}

async function renderScreen(jamId: string): Promise<void> {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}>
      <ChatScreen jamId={jamId} />
    </SafeAreaProvider>,
  );
}

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ userId: USER_ID });
    mockMessages({});
    mockSend({});
    mockedUseDeleteChatMessage.mockReturnValue({
      mutate: jest.fn(),
      error: null,
    } as unknown as ReturnType<typeof useDeleteChatMessage>);
  });

  it('shows a loader while the jam loads', async () => {
    mockJamQuery({ isLoading: true });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Loading chat…')).toBeOnTheScreen();
    expect(mockedUseJamDetail).toHaveBeenCalledWith({ jamId: JAM_ID, enabled: true });
  });

  it('offers a retry when the jam fails to load', async () => {
    const refetch = mockJamQuery({ isError: true, error: new Error('Network error') });

    await renderScreen(JAM_ID);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Unable to load chat')).toBeOnTheScreen();
    expect(refetch).toHaveBeenCalled();
  });

  it('says when the jam no longer exists', async () => {
    mockJamQuery({ data: undefined });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Jam not found')).toBeOnTheScreen();
  });

  it('keeps the chat closed to someone who has not joined the jam', async () => {
    mockJamQuery({ data: buildJamDetail({ isCreator: false, isParticipant: false }) });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Join the jam to chat')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Message')).not.toBeOnTheScreen();
    expect(mockedUseChatMessages).not.toHaveBeenCalled();
  });

  it('opens the series room for a date of a series, for its creator', async () => {
    mockJamQuery({ data: buildJamDetail({ isCreator: true, isParticipant: false, seriesId: SERIES_ID }) });

    await renderScreen(JAM_ID);

    const room = { kind: 'series', seriesId: SERIES_ID };
    expect(mockedUseChatMessages).toHaveBeenCalledWith({ room, enabled: true });
    expect(mockedUseChatRealtime).toHaveBeenCalledWith({ room, enabled: true });
  });

  it('shows a loader while the messages load', async () => {
    mockJamQuery({ data: buildJamDetail({}) });
    mockMessages({ isLoading: true });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Loading messages…')).toBeOnTheScreen();
  });

  it('offers a retry when the messages fail to load', async () => {
    mockJamQuery({ data: buildJamDetail({}) });
    const refetch = mockMessages({ isError: true, error: new Error('Network error') });

    await renderScreen(JAM_ID);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Unable to load messages')).toBeOnTheScreen();
    expect(refetch).toHaveBeenCalled();
  });

  it('invites to write the first message when the room is empty', async () => {
    mockJamQuery({ data: buildJamDetail({}) });
    mockMessages({ messages: [] });

    await renderScreen(JAM_ID);

    expect(screen.getByText('No messages yet')).toBeOnTheScreen();
    expect(screen.getByLabelText('Message')).toBeOnTheScreen();
  });

  it('shows the messages of a one-off jam room', async () => {
    mockJamQuery({ data: buildJamDetail({ seriesId: null }) });
    mockMessages({ messages: [MESSAGE] });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Who brings the bass amp?')).toBeOnTheScreen();
    expect(mockedUseChatMessages).toHaveBeenCalledWith({ room: { kind: 'jam', jamId: JAM_ID }, enabled: true });
  });

  it('sends a message', async () => {
    mockJamQuery({ data: buildJamDetail({}) });
    const mutateAsync = mockSend({});
    const user = userEvent.setup();

    await renderScreen(JAM_ID);
    await user.type(screen.getByLabelText('Message'), 'See you at 8');
    await user.press(screen.getByRole('button', { name: 'Send' }));

    expect(mutateAsync).toHaveBeenCalledWith('See you at 8');
  });

  it('shows why a message could not be sent', async () => {
    mockJamQuery({ data: buildJamDetail({}) });
    mockSend({ error: new Error('Network error') });

    await renderScreen(JAM_ID);

    expect(screen.getByText('Network error')).toBeOnTheScreen();
  });
});
