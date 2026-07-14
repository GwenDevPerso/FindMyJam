import { Text, TextInput, View, type TextInputProps } from 'react-native';

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
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      ) : null}

      <TextInput
        editable={isEditable}
        placeholderClassName="text-muted-foreground"
        className={cn(
          'h-11 rounded-md border border-input bg-background px-3 text-base text-foreground',
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
