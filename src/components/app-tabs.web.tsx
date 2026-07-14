import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Home, Map, User, Users } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';

export default function AppTabs(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          className="flex-row border-t border-border bg-tab-bar px-2 pt-1"
          style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
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
        {isFocused === true ? <View className="mb-0.5 h-1 w-5 rounded-full bg-primary" /> : null}
        <Icon
          size={22}
          color={isFocused === true ? theme.primary : theme.mutedForeground}
          strokeWidth={isFocused === true ? 2.5 : 2}
        />
        <Text
          className={cn(
            'text-[10px] font-semibold',
            isFocused === true ? 'text-primary' : 'text-muted-foreground',
          )}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
