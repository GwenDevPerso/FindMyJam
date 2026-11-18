import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { FriendList } from '@/features/friends/components/friend-list';
import { FriendRequestList } from '@/features/friends/components/friend-request-list';
import { useFriendRequestsRealtime } from '@/features/friends/hooks/use-friend-requests-realtime';
import type { FriendsTab } from '@/features/friends/types';
import { cn } from '@/utils/cn';

type FriendsScreenProps = {
  enabled: boolean;
};

type FriendsTabsProps = {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
};

function FriendsTabs({ activeTab, onTabChange }: FriendsTabsProps): React.JSX.Element {
  const tabs: { id: FriendsTab; label: string }[] = [
    { id: 'friends', label: 'Friends' },
    { id: 'requests', label: 'Requests' },
  ];

  return (
    <View className="mb-4 flex-row border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={cn(
              '-mb-px flex-1 items-center border-b-2 border-transparent py-3',
              isActive && 'border-primary-text',
            )}
            onPress={() => {
              onTabChange(tab.id);
            }}>
            <Text
              className={cn(
                'text-xs font-medium uppercase tracking-label',
                isActive ? 'text-primary-text' : 'text-muted-foreground',
              )}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FriendsScreen({ enabled }: FriendsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');

  useFriendRequestsRealtime({ enabled });

  const handleSearchPress = (): void => {
    router.push('/friends/search');
  };

  return (
    <View className="flex-1">
      <Animated.View entering={FadeInDown.duration(350).springify()} className="mb-4">
        <Button
          label="Search musicians"
          variant="primary"
          size="md"
          isLoading={false}
          onPress={handleSearchPress}
          className="rounded-full"
        />
      </Animated.View>

      <FriendsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'friends' ? <FriendList enabled={enabled} /> : null}
      {activeTab === 'requests' ? <FriendRequestList enabled={enabled} /> : null}
    </View>
  );
}
