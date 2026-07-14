import { Pressable, Text, View } from 'react-native';

import { AnimatedListItem } from '@/components/ui/animated-list-item';
import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { JamCard } from '@/features/jams/components/jam-card';
import { useProfileCreatedJams } from '@/features/profile/hooks/use-profile-created-jams';
import { useProfileParticipatedJams } from '@/features/profile/hooks/use-profile-participated-jams';
import type { ProfileJamTab } from '@/features/profile/types';
import { cn } from '@/utils/cn';

type ProfileJamListProps = {
  userId: string;
  activeTab: ProfileJamTab;
  onJamPress: (jamId: string) => void;
};

type ProfileJamTabButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

function ProfileJamTabButton({ label, isActive, onPress }: ProfileJamTabButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      className={cn('flex-1 items-center rounded-lg py-2.5', isActive && 'bg-card-elevated')}>
      <Text
        className={cn(
          'text-sm font-semibold',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProfileJamList({
  userId,
  activeTab,
  onJamPress,
}: ProfileJamListProps): React.JSX.Element {
  const createdJamsQuery = useProfileCreatedJams({
    userId,
    enabled: activeTab === 'created',
  });

  const participatedJamsQuery = useProfileParticipatedJams({
    userId,
    enabled: activeTab === 'participated',
  });

  const activeQuery = activeTab === 'created' ? createdJamsQuery : participatedJamsQuery;

  if (activeQuery.isLoading) {
    return (
      <View className="py-8">
        <Loading size="small" fullScreen={false} />
      </View>
    );
  }

  if (activeQuery.isError) {
    return (
      <ErrorState
        title="Unable to load jams"
        message={activeQuery.error.message}
        onRetry={() => {
          void activeQuery.refetch();
        }}
      />
    );
  }

  const jams = activeQuery.data ?? [];

  if (jams.length === 0) {
    return (
      <EmptyState
        title={activeTab === 'created' ? 'No jams created yet' : 'No jams joined yet'}
        description={
          activeTab === 'created'
            ? 'Create your first jam and invite other musicians.'
            : 'Explore jams near you and join one.'
        }
      />
    );
  }

  return (
    <View className="gap-3 pb-6">
      {jams.map((jam, index) => (
        <AnimatedListItem key={jam.id} index={index}>
          <JamCard jam={jam} onPress={onJamPress} />
        </AnimatedListItem>
      ))}
    </View>
  );
}

export function ProfileJamTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: ProfileJamTab;
  onTabChange: (tab: ProfileJamTab) => void;
}): React.JSX.Element {
  return (
    <View className="mb-4 flex-row rounded-xl bg-secondary p-1">
      <ProfileJamTabButton
        label="Created"
        isActive={activeTab === 'created'}
        onPress={() => {
          onTabChange('created');
        }}
      />
      <ProfileJamTabButton
        label="Participated"
        isActive={activeTab === 'participated'}
        onPress={() => {
          onTabChange('participated');
        }}
      />
    </View>
  );
}
