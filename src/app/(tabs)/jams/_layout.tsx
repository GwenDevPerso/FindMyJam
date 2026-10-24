import { Stack } from 'expo-router';

export default function JamsLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="create" options={{ title: 'Create jam', headerShown: true }} />
      <Stack.Screen name="all" options={{ title: 'All jams', headerShown: true }} />
      <Stack.Screen name="[id]" options={{ title: 'Jam details', headerShown: true }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit jam', headerShown: true }} />
      <Stack.Screen name="chat/[id]" options={{ title: 'Chat', headerShown: true }} />
    </Stack>
  );
}
