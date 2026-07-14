import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { FriendsScreen } from '@/features/friends/components/friends-screen';
import { useAuthStore } from '@/store/auth.store';

export default function FriendsIndexScreen(): React.JSX.Element {
  const userId = useAuthStore((state) => state.userId);

  if (userId === null) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Not signed in" message="Sign in to manage your friends." />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} contentClassName="pt-2" withTabBarInset={true}>
      <FriendsScreen enabled={true} />
    </Screen>
  );
}
