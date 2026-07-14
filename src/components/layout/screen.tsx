import { type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { cn } from '@/utils/cn';

type ScreenProps = {
  children: ReactNode;
  scrollable: boolean;
  className?: string;
  contentClassName?: string;
  withTabBarInset: boolean;
  scrollViewProps?: Omit<ScrollViewProps, 'children' | 'className' | 'contentContainerClassName'>;
};

export function Screen({
  children,
  scrollable,
  className,
  contentClassName,
  withTabBarInset,
  scrollViewProps,
}: ScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom + (withTabBarInset ? BottomTabInset : 0);

  if (scrollable) {
    return (
      <ScrollView
        className={cn('flex-1 bg-background', className)}
        contentContainerClassName={cn('grow px-4', contentClassName)}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: bottomPadding,
        }}
        {...scrollViewProps}>
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      className={cn('flex-1 bg-background px-4', className)}
      style={{ paddingTop: insets.top, paddingBottom: bottomPadding }}>
      <View className={cn('flex-1', contentClassName)}>{children}</View>
    </View>
  );
}
