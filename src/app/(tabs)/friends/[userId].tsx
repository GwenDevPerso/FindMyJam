import { useLocalSearchParams } from 'expo-router';

import { UserProfileScreen } from '@/features/profile/components/user-profile-screen';

export default function FriendProfileScreen(): React.JSX.Element {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return <UserProfileScreen userId={userId ?? ''} />;
}
