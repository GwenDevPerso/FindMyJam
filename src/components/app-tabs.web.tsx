import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Home, Map, User, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';

export default function AppTabs(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const safeAreaStyle = { paddingBottom: Math.max(insets.bottom, Spacing.two) };

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View
          className="flex-row border-t border-border bg-tab-bar px-2 pt-1"
          style={safeAreaStyle}>
          <TabTrigger name="index" href="/" asChild>
            <WebTabButton label="Home" icon={Home} />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <WebTabButton label="Explore" icon={Map} />
          </TabTrigger>
          <TabTrigger name="friends" href="/friends" asChild>
            <WebTabButton label="Friends" icon={Users} />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <WebTabButton label="Profile" icon={User} />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

type WebTabButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: typeof Home;
};

function WebTabButton({ label, icon: Icon, isFocused, ...props }: WebTabButtonProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused === true }}
      accessibilityLabel={label}
      className="flex-1 items-center justify-center py-2">
      <View className="items-center gap-1">
        <Icon
          size={22}
          color={isFocused === true ? theme.primaryText : theme.mutedForeground}
          strokeWidth={1.8}
        />
        <Text
          className={cn(
            'text-xs',
            isFocused === true ? 'font-bold text-primary-text' : 'font-medium text-muted-foreground',
          )}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
});
