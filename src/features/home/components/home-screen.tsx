import { type Href, router } from 'expo-router';
import { Map, Plus, Search } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedListItem } from '@/components/ui/animated-list-item';
import { AnimatedPressableScale } from '@/components/ui/animated-pressable';
import { BadgeGroup } from '@/components/ui/badge';
import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Screen } from '@/components/layout/screen';
import { InstrumentBadge } from '@/components/ui/instrument-badge';
import { StyleBadge } from '@/components/ui/style-badge';
import { JamCard } from '@/features/jams/components/jam-card';
import { useJams } from '@/features/jams/hooks/use-jams';
import { DEFAULT_RADIUS_METERS } from '@/features/map/constants';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth.store';

type QuickActionProps = {
  label: string;
  icon: typeof Map;
  color: string;
  onPress: () => void;
};

function QuickAction({ label, icon: Icon, color, onPress }: QuickActionProps): React.JSX.Element {
  return (
    <AnimatedPressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleValue={0.95}
      onPress={onPress}
      className="flex-1">
      <View className="items-center gap-2 rounded-xl border border-border/50 bg-card-elevated p-4">
        <View className="rounded-full p-2.5" style={{ backgroundColor: `${color}20` }}>
          <Icon size={22} color={color} strokeWidth={2.5} />
        </View>
        <Text className="text-xs font-semibold text-foreground">{label}</Text>
      </View>
    </AnimatedPressableScale>
  );
}

export function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const userId = useAuthStore((state) => state.userId);

  const profileQuery = useProfile({ userId, enabled: userId !== null });
  const locationQuery = useUserLocation({ enabled: true });

  const latitude = locationQuery.data?.latitude ?? 48.8566;
  const longitude = locationQuery.data?.longitude ?? 2.3522;

  const jamsQuery = useJams({
    filters: {
      latitude,
      longitude,
      radiusMeters: DEFAULT_RADIUS_METERS,
      limit: 5,
    },
    enabled: true,
  });

  const profile = profileQuery.data;
  const jams = jamsQuery.data?.jams ?? [];

  const handleExplorePress = (): void => {
    router.push('/explore');
  };

  const handleSearchPress = (): void => {
    router.push('/friends/search');
  };

  const handleCreateJamPress = (): void => {
    router.push('/jams/create' as Href);
  };

  const handleJamPress = (jamId: string): void => {
    router.push(`/jams/${jamId}` as Href);
  };

  return (
    <Screen scrollable={true} contentClassName="pb-8" withTabBarInset={true}>
      <Animated.View entering={FadeInDown.duration(400).springify()} className="mb-6 pt-2">
        <Text className="text-sm font-medium text-muted-foreground">Welcome back</Text>
        <Text className="text-3xl font-bold text-foreground">
          {profile?.username ?? 'Musician'}
        </Text>
      </Animated.View>

      {profile !== undefined &&
      (profile.instruments.length > 0 || profile.musicStyles.length > 0) ? (
        <Animated.View entering={FadeInDown.delay(80).duration(400).springify()} className="mb-6">
          <BadgeGroup>
            {profile.instruments.slice(0, 3).map((instrument) => (
              <InstrumentBadge
                key={instrument.id}
                name={instrument.name}
                slug={instrument.slug}
                size="sm"
              />
            ))}
            {profile.musicStyles.slice(0, 2).map((style) => (
              <StyleBadge key={style.id} name={style.name} slug={style.slug} size="sm" />
            ))}
          </BadgeGroup>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.delay(120).duration(400).springify()}
        className="mb-8 flex-row gap-3">
        <QuickAction
          label="Explore map"
          icon={Map}
          color={theme.primary}
          onPress={handleExplorePress}
        />
        <QuickAction
          label="Find musicians"
          icon={Search}
          color={theme.accent}
          onPress={handleSearchPress}
        />
        <QuickAction
          label="Create jam"
          icon={Plus}
          color={theme.event}
          onPress={handleCreateJamPress}
        />
      </Animated.View>

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">Nearby jams</Text>
        <Text
          accessibilityRole="button"
          onPress={handleExplorePress}
          className="text-sm font-semibold text-primary">
          See all
        </Text>
      </View>

      {jamsQuery.isLoading ? (
        <Loading message="Loading jams…" size="large" fullScreen={false} className="py-12" />
      ) : null}

      {jamsQuery.isError ? (
        <ErrorState
          title="Unable to load jams"
          message={jamsQuery.error.message}
          onRetry={() => {
            void jamsQuery.refetch();
          }}
        />
      ) : null}

      {!jamsQuery.isLoading && !jamsQuery.isError && jams.length === 0 ? (
        <EmptyState
          title="No jams nearby"
          description="Be the first to organize a session in your area."
        />
      ) : null}

      {jams.map((jam, index) => (
        <AnimatedListItem key={jam.id} index={index}>
          <JamCard jam={jam} onPress={handleJamPress} />
        </AnimatedListItem>
      ))}
    </Screen>
  );
}
