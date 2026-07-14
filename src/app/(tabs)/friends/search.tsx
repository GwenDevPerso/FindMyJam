import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { UserSearchForm } from '@/features/friends/components/user-search-form';
import { useAuthStore } from '@/store/auth.store';

export default function FriendsSearchScreen(): React.JSX.Element {
  const userId = useAuthStore((state) => state.userId);

  if (userId === null) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Not signed in" message="Sign in to search for musicians." />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} contentClassName="pt-2" withTabBarInset={true}>
      <UserSearchForm />
    </Screen>
  );
}
