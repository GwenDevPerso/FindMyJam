import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
    <View className="mb-4 flex-row rounded-xl bg-secondary p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={cn(
              'flex-1 items-center rounded-lg py-2.5',
              isActive && 'bg-card-elevated',
            )}
            onPress={() => {
              onTabChange(tab.id);
            }}>
            <Text
              className={cn(
                'text-sm font-semibold',
                isActive ? 'text-primary' : 'text-muted-foreground',
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
