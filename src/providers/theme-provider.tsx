import { type ReactNode } from 'react';
import { View } from 'react-native';

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  return <View className="flex-1 bg-background">{children}</View>;
}
