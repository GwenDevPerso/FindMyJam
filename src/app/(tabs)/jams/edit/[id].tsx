import { useLocalSearchParams } from 'expo-router';

import { EditJamScreen } from '@/features/jams/components/edit-jam-screen';

export default function EditJamRoute(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditJamScreen jamId={id ?? ''} />;
}
