import { Modal, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { JamCalendar } from '@/features/jams/components/jam-calendar';

type JamCalendarModalProps = {
  visible: boolean;
  onClose: () => void;
  onJamPress: (jamId: string) => void;
};

/** Popup over a dimmed backdrop holding the user's jam calendar; the backdrop and "Close" dismiss it. */
export function JamCalendarModal({ visible, onClose, onJamPress }: JamCalendarModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center px-4">
        <Pressable
          accessibilityLabel="Close calendar"
          onPress={onClose}
          className="absolute inset-0 bg-background/80"
        />
        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">My jams</Text>
            <Text accessibilityRole="button" onPress={onClose} className="text-xs font-medium uppercase tracking-label text-primary-text">
              Close
            </Text>
          </View>
          {visible ? <JamCalendar onJamPress={onJamPress} /> : null}
        </View>
      </View>
    </Modal>
  );
}
