import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, type MapMarkerProps } from 'react-native-maps';
import { Music } from 'lucide-react-native';

import { useMarkerTracksViewChanges } from '@/features/map/hooks/use-marker-tracks-view-changes';
import type { MapJamMarker } from '@/features/map/types';
import { useTheme } from '@/hooks/use-theme';
import type { SkillLevel } from '@/types/domain';

type JamMarkerProps = {
  marker: MapJamMarker;
  isSelected: boolean;
  onPress: (markerId: string) => void;
};

const skillLevelColors: Record<SkillLevel, string> = {
  beginner: '#22c55e',
  intermediate: '#3b82f6',
  advanced: '#f97316',
  expert: '#ef4444',
  all_levels: '#7c3aed',
};

function JamMarkerComponent({ marker, isSelected, onPress }: JamMarkerProps): React.JSX.Element {
  const theme = useTheme();
  const coordinateKey = `${marker.id}:${marker.latitude}:${marker.longitude}:${isSelected}`;
  const tracksViewChanges = useMarkerTracksViewChanges(coordinateKey);

  const handlePress: MapMarkerProps['onPress'] = useCallback(() => {
    onPress(marker.id);
  }, [marker.id, onPress]);

  const markerColor = useMemo((): string => {
    if (isSelected) {
      return theme.primary;
    }

    return skillLevelColors[marker.skillLevel];
  }, [isSelected, marker.skillLevel, theme.primary]);

  return (
    <Marker
      identifier={marker.id}
      coordinate={{
        latitude: marker.latitude,
        longitude: marker.longitude,
      }}
      title={marker.title}
      description={marker.locationName}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={handlePress}
      tracksViewChanges={tracksViewChanges}>
      <View
        collapsable={false}
        style={[styles.marker, { backgroundColor: markerColor, borderColor: theme.background }]}>
        <Music size={14} color="#ffffff" strokeWidth={2.5} />
      </View>
    </Marker>
  );
}

export const JamMarker = memo(JamMarkerComponent);

const styles = StyleSheet.create({
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
