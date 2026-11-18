import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/text';
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
  const hasError = error !== undefined && error.length > 0;
  const isEditable = editable !== false;

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label !== undefined ? (
        <Text className="text-xs font-medium uppercase tracking-label text-muted-foreground">{label}</Text>
      ) : null}

      <TextInput
        editable={isEditable}
        placeholderClassName="text-muted-foreground"
        className={cn(
          'h-11 border border-input bg-card px-3 font-mono text-sm text-foreground focus:border-primary-text',
          !isEditable && 'opacity-50',
          hasError && 'border-destructive',
          inputClassName,
        )}
        {...textInputProps}
      />

      {hasError ? <Text className="text-sm text-destructive">{error}</Text> : null}
    </View>
  );
}
