import { type TextProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';

type ThemedTextType = 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
  className?: string;
};

// DESIGN.md §3 variants.
const typeClasses: Record<ThemedTextType, string> = {
  default: 'text-sm',
  title: 'text-3xl font-extrabold tracking-tight',
  small: 'text-sm font-medium',
  smallBold: 'text-sm font-bold',
  subtitle: 'text-2xl font-bold',
  link: 'text-sm',
  linkPrimary: 'text-sm font-medium text-primary-text',
  code: 'text-xs font-mono font-medium',
};

export function ThemedText({ style, type = 'default', themeColor, className, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const colorStyle = type === 'linkPrimary' && themeColor === undefined ? null : { color: theme[themeColor ?? 'text'] };

  return <Text className={cn(typeClasses[type], className)} style={[colorStyle, style]} {...rest} />;
}
