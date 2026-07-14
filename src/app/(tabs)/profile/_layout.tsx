import { Stack } from 'expo-router';

export default function ProfileLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Profile', headerShown: true }} />
      <Stack.Screen name="edit" options={{ title: 'Edit profile', headerShown: true }} />
    </Stack>
  );
}
