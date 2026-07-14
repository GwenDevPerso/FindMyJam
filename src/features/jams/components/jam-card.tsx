import { MapPin, Navigation, Users } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { AnimatedPressableScale } from '@/components/ui/animated-pressable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { JamBadges } from '@/features/jams/components/jam-badges';
import { useTheme } from '@/hooks/use-theme';
import type { Jam } from '@/types/domain';
import { formatJamDateTime } from '@/utils/date';
import { formatDistance, formatParticipantCount, formatSkillLevel } from '@/utils/format';

type JamCardProps = {
  jam: Jam;
  onPress: (jamId: string) => void;
};

export function JamCard({ jam, onPress }: JamCardProps): React.JSX.Element {
  const theme = useTheme();
  const distanceLabel = formatDistance(jam.distanceMeters);
  const participantLabel = formatParticipantCount(jam.participantCount, jam.maxParticipants);

  const handlePress = (): void => {
    onPress(jam.id);
  };

  return (
    <AnimatedPressableScale
      accessibilityRole="button"
      accessibilityLabel={`Jam: ${jam.title}, ${formatJamDateTime(jam.startsAt)}`}
      accessibilityHint="Opens jam details"
      scaleValue={0.97}
      onPress={handlePress}>
      <Card variant="interactive" className="mb-3 overflow-hidden">
        <View className="absolute left-0 top-0 h-full w-1 bg-primary" accessibilityElementsHidden />

        <CardHeader className="pl-2">
          <CardTitle>{jam.title}</CardTitle>
          <CardDescription>{formatJamDateTime(jam.startsAt)}</CardDescription>
        </CardHeader>

        <CardContent className="pl-2">
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color={theme.mutedForeground} strokeWidth={2} />
            <Text className="flex-1 text-sm text-foreground">{jam.locationName}</Text>
          </View>

          {jam.description !== null && jam.description.length > 0 ? (
            <Text className="text-sm leading-5 text-muted-foreground" numberOfLines={2}>
              {jam.description}
            </Text>
          ) : null}

          <JamBadges instrumentIds={jam.instrumentIds} styleIds={jam.styleIds} maxVisible={4} size="sm" />
        </CardContent>

        <CardFooter className="pl-2">
          <View className="flex-1 flex-row flex-wrap items-center gap-2">
            <Badge label={formatSkillLevel(jam.skillLevel)} variant="skill" size="sm" />
            <View className="flex-row items-center gap-1">
              <Users size={12} color={theme.mutedForeground} strokeWidth={2} />
              <Text className="text-xs text-muted-foreground">{participantLabel}</Text>
            </View>
            {distanceLabel !== null ? (
              <View className="flex-row items-center gap-1">
                <Navigation size={12} color={theme.mutedForeground} strokeWidth={2} />
                <Text className="text-xs text-muted-foreground">{distanceLabel}</Text>
              </View>
            ) : null}
          </View>
        </CardFooter>
      </Card>
    </AnimatedPressableScale>
  );
}
