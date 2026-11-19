import { router, Stack, useIsFocused } from 'expo-router';
import { HeaderBackButton } from 'expo-router/build/react-navigation/elements';

export default function JamsLayout(): React.JSX.Element | null {
  const isFocused = useIsFocused();

  // Unmounting on blur clears this stack's history, so a jam opened later from Home, Explore or Profile is the
  // first screen again and its back button returns to that tab, not to the jam seen before.
  if (!isFocused) {
    return null;
  }

  return (
    <Stack
      screenOptions={({ route, navigation }) =>
        // The first screen of this stack has no native back button; this one returns to the tab it came from.
        navigation.getState().routes[0]?.key === route.key
          ? {
              headerLeft: ({ tintColor }) => (
                <HeaderBackButton tintColor={tintColor} displayMode="minimal" onPress={() => router.back()} />
              ),
            }
          : {}
      }>
      <Stack.Screen name="create" options={{ title: 'Create jam', headerShown: true }} />
      <Stack.Screen name="all" options={{ title: 'All jams', headerShown: true }} />
      <Stack.Screen name="[id]" options={{ title: 'Jam details', headerShown: true }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit jam', headerShown: true }} />
      <Stack.Screen name="chat/[id]" options={{ title: 'Chat', headerShown: true }} />
    </Stack>
  );
}
