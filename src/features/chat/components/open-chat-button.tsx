import { type Href, router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';

type OpenChatButtonProps = {
  jamId: string;
  isCreator: boolean;
  isParticipant: boolean;
};

/** Entry point of a jam's chat, shown only to the people who can use it: the creator and the participants. */
export function OpenChatButton({ jamId, isCreator, isParticipant }: OpenChatButtonProps): React.JSX.Element | null {
  if (!isCreator && !isParticipant) {
    return null;
  }

  return (
    <Button
      label="Open chat"
      variant="secondary"
      size="lg"
      isLoading={false}
      onPress={() => {
        router.push(Routes.jamChat(jamId) as Href);
      }}
    />
  );
}
