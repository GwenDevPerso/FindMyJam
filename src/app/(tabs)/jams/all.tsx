import { Screen } from '@/components/layout/screen';
import { AllJamsList } from '@/features/jams/components/all-jams-list';

export default function AllJamsScreen(): React.JSX.Element {
  return (
    <Screen scrollable={false} withTabBarInset={false} contentClassName="pt-2">
      <AllJamsList />
    </Screen>
  );
}
