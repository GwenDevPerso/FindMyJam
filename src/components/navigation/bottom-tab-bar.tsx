import { type BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Home, Map, User, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';

type TabConfig = {
  name: string;
  label: string;
  icon: typeof Home;
};

const TAB_CONFIG: TabConfig[] = [
  { name: 'index', label: 'Home', icon: Home },
  { name: 'explore', label: 'Explore', icon: Map },
  { name: 'friends', label: 'Friends', icon: Users },
  { name: 'profile', label: 'Profile', icon: User },
];

type TabItemProps = {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function TabItem({ routeName, label, isFocused, onPress, onLongPress }: TabItemProps): React.JSX.Element {
  const theme = useTheme();
  const config = TAB_CONFIG.find((tab) => tab.name === routeName);
  const Icon = config?.icon ?? Home;
  const iconColor = isFocused ? theme.primaryText : theme.mutedForeground;

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocused ? 1 : 0, { damping: 18, stiffness: 280 }),
    transform: [{ scale: withSpring(isFocused ? 1 : 0.6, { damping: 18, stiffness: 280 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 items-center justify-center py-2">
      <View className="relative items-center gap-1">
        <Animated.View
          className="absolute -top-1 h-0.5 w-5 bg-primary-text"
          style={indicatorStyle}
        />
        <Icon size={20} color={iconColor} strokeWidth={2} />
        <Text
          className={cn(
            'text-xs font-medium uppercase tracking-label',
            isFocused ? 'text-primary-text' : 'text-muted-foreground',
          )}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const safeAreaStyle = { paddingBottom: Math.max(insets.bottom, Spacing.two) };

  return (
    <View
      className="border-t border-border bg-tab-bar"
      style={safeAreaStyle}>
      <View className="flex-row px-2 pt-1">
        {state.routes
          .filter((route) => TAB_CONFIG.some((tab) => tab.name === route.name))
          .map((route, index) => {
            const isFocused = state.routes[state.index]?.key === route.key;
            const descriptor = descriptors[route.key];
            const label =
              descriptor.options.tabBarLabel !== undefined
                ? String(descriptor.options.tabBarLabel)
                : descriptor.options.title !== undefined
                  ? descriptor.options.title
                  : route.name;

            const handlePress = (): void => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const handleLongPress = (): void => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                label={label}
                isFocused={isFocused}
                onPress={handlePress}
                onLongPress={handleLongPress}
              />
            );
          })}
      </View>
    </View>
  );
}
