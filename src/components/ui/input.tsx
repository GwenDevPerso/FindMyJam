import { CircleAlert } from 'lucide-react-native';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
};

export function Input({
  label,
  error,
  editable,
  containerClassName,
  inputClassName,
  ...textInputProps
}: InputProps): React.JSX.Element {
  const theme = useTheme();
  const hasError = error !== undefined && error.length > 0;
  const isEditable = editable !== false;

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label !== undefined ? (
        <Text className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">{label}</Text>
      ) : null}

      <TextInput
        editable={isEditable}
        placeholderTextColor={theme.textMuted}
        className={cn(
          'rounded-lg border border-input bg-card px-4 font-sans text-base text-foreground focus:border-ring',
          // A multiline field sets its own height (fixed or growing); 48 stays the minimum.
          textInputProps.multiline === true ? 'min-h-12' : 'h-12',
          !isEditable && 'opacity-50',
          hasError && 'border-destructive',
          inputClassName,
        )}
        {...textInputProps}
      />

      {hasError ? (
        <View className="flex-row items-center gap-1.5">
          <CircleAlert size={16} color={theme.destructive} strokeWidth={1.8} />
          <Text className="flex-1 text-sm text-destructive">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
