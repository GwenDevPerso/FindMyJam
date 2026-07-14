import { Stack } from 'expo-router';

export default function FriendsLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Friends' }} />
      <Stack.Screen name="search" options={{ title: 'Search musicians' }} />
    </Stack>
  );
}
