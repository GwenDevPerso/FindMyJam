import { Tabs } from 'expo-router';

import { BottomTabBar } from '@/components/navigation/bottom-tab-bar';

export default function AppTabs(): React.JSX.Element {
  return (
    <Tabs
      // Back from a hidden tab (a jam opened from Home, Explore or Profile) returns to the tab it came from.
      backBehavior="history"
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // animation: 'shift',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="jams" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
