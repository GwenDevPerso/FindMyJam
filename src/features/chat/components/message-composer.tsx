import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/features/chat/schemas/chat-message.schema';

type MessageComposerProps = {
  /** Resolves once the message is posted; the field is cleared only then, so a failed message can be resent. */
  onSend: (body: string) => Promise<void>;
  isSending: boolean;
};

export function MessageComposer({ onSend, isSending }: MessageComposerProps): React.JSX.Element {
  const [body, setBody] = useState('');
  const canSend = body.trim().length > 0 && !isSending;

  const handleSend = async (): Promise<void> => {
    try {
      await onSend(body);
      setBody('');
    } catch {
      // The screen shows the mutation error; the text stays so it can be sent again.
    }
  };

  return (
    <View className="-mx-5 flex-row items-end gap-2.5 border-t border-border bg-card px-5 py-3">
      <Input
        accessibilityLabel="Message"
        placeholder="Write a message…"
        value={body}
        onChangeText={setBody}
        multiline={true}
        maxLength={CHAT_MESSAGE_MAX_LENGTH}
        containerClassName="flex-1"
        inputClassName="max-h-32 py-3"
      />
      <Button
        accessibilityLabel="Send"
        label="Send"
        variant="primary"
        size="md"
        isLoading={isSending}
        disabled={!canSend}
        onPress={() => {
          void handleSend();
        }}
      />
    </View>
  );
}
