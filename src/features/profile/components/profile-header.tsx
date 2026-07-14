import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { BadgeGroup } from '@/components/ui/badge';
import { InstrumentBadge } from '@/components/ui/instrument-badge';
import { StyleBadge } from '@/components/ui/style-badge';
import { Badge } from '@/components/ui/badge';
import type { ProfileDetail } from '@/features/profile/types';
import { formatSkillLevel } from '@/utils/format';

type ProfileHeaderProps = {
  profile: ProfileDetail;
};

export function ProfileHeader({ profile }: ProfileHeaderProps): React.JSX.Element {
  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} className="items-center gap-4 py-6">
      <View className="rounded-full border-2 border-primary/30 p-1">
        <Avatar source={profile.avatarUrl} fallback={profile.username} size="xl" />
      </View>

      <View className="items-center gap-1">
        <Text className="text-2xl font-bold text-foreground">{profile.username}</Text>
        {profile.skillLevel !== null ? (
          <Badge label={formatSkillLevel(profile.skillLevel)} variant="primary" size="md" />
        ) : null}
      </View>

      {profile.bio !== null && profile.bio.length > 0 ? (
        <Text className="text-center text-base leading-6 text-muted-foreground">{profile.bio}</Text>
      ) : null}

      {profile.locationName !== null && profile.locationName.length > 0 ? (
        <Text className="text-sm text-muted-foreground">{profile.locationName}</Text>
      ) : null}

      {profile.instruments.length > 0 ? (
        <View className="items-center gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Instruments
          </Text>
          <BadgeGroup className="justify-center">
            {profile.instruments.map((instrument) => (
              <InstrumentBadge
                key={instrument.id}
                name={instrument.name}
                slug={instrument.slug}
                size="md"
              />
            ))}
          </BadgeGroup>
        </View>
      ) : null}

      {profile.musicStyles.length > 0 ? (
        <View className="items-center gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Styles
          </Text>
          <BadgeGroup className="justify-center">
            {profile.musicStyles.map((style) => (
              <StyleBadge key={style.id} name={style.name} slug={style.slug} size="md" />
            ))}
          </BadgeGroup>
        </View>
      ) : null}
    </Animated.View>
  );
}
