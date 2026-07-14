import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/layout/screen';
import { Routes } from '@/constants/routes';

export default function NotFoundScreen(): React.JSX.Element {
  return (
    <Screen scrollable={false} withTabBarInset={false}>
      <View className="flex-1 items-center justify-center gap-6">
        <View className="items-center gap-2">
          <Text className="text-6xl font-bold text-foreground">404</Text>
          <Text className="text-lg font-semibold text-foreground">Page introuvable</Text>
          <Text className="text-center text-sm text-muted-foreground">
            Cette page n&apos;existe pas ou a été déplacée.
          </Text>
        </View>

        <Link href={Routes.home} asChild>
          <Button label="Retour à l'accueil" variant="primary" size="md" isLoading={false} />
        </Link>
      </View>
    </Screen>
  );
}
