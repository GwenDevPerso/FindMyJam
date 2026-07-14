import { Stack } from 'expo-router';

export default function JamsLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="create" options={{ title: 'Create jam', headerShown: true }} />
      <Stack.Screen name="[id]" options={{ title: 'Jam details', headerShown: true }} />
    </Stack>
  );
}
