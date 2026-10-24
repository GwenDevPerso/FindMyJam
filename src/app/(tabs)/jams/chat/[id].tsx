import { useLocalSearchParams } from 'expo-router';

import { ChatScreen } from '@/features/chat/components/chat-screen';

export default function JamChatRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ChatScreen jamId={id ?? ''} />;
}
