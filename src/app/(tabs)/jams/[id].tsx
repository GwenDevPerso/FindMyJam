import { useLocalSearchParams } from 'expo-router';

import { JamDetailScreen } from '@/features/jams/components/jam-detail-screen';

export default function JamDetailRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <JamDetailScreen jamId={id ?? ''} />;
}
