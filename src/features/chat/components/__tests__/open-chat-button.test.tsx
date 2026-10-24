import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { Routes } from '@/constants/routes';
import { OpenChatButton } from '@/features/chat/components/open-chat-button';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const mockedRouter = jest.mocked(router);

const JAM_ID = '33333333-3333-4333-8333-333333333333';

describe('OpenChatButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the chat of the jam for a participant', async () => {
    await render(<OpenChatButton jamId={JAM_ID} isCreator={false} isParticipant={true} />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Open chat' }));

    expect(mockedRouter.push).toHaveBeenCalledWith(Routes.jamChat(JAM_ID));
  });

  it('is shown to the creator', async () => {
    await render(<OpenChatButton jamId={JAM_ID} isCreator={true} isParticipant={false} />);

    expect(screen.getByRole('button', { name: 'Open chat' })).toBeOnTheScreen();
  });

  it('is hidden from someone who has not joined the jam', async () => {
    await render(<OpenChatButton jamId={JAM_ID} isCreator={false} isParticipant={false} />);

    expect(screen.queryByRole('button', { name: 'Open chat' })).not.toBeOnTheScreen();
  });
});
