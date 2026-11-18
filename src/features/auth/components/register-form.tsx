import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/schemas/register.schema';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

function getErrorMessage(error: Error | null): string | null {
  if (error === null) {
    return null;
  }

  return error.message;
}

export function RegisterForm() {
  const theme = useTheme();
  const { register: registerUser, isRegistering, registerError } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await registerUser(values);
  });

  return (
    <View className="flex-1 justify-center gap-4 bg-background p-6">
      <Text className="text-2xl font-bold tracking-tight text-foreground">Create account</Text>
      <Text className="mb-2 text-sm text-muted-foreground">
        Join the community and start jamming.
      </Text>

      <View className="gap-2">
        <Text className="text-xs font-medium uppercase tracking-label text-muted-foreground">Username</Text>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoCapitalize="none"
              autoComplete="username"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="your_username"
              placeholderTextColor={theme.mutedForeground}
              className="h-11 border border-input bg-card px-4 font-mono text-sm text-foreground"
              value={value}
            />
          )}
        />
        {errors.username !== undefined ? (
          <Text className="text-sm text-destructive">{errors.username.message}</Text>
        ) : null}

        <Text className="mt-2 text-xs font-medium uppercase tracking-label text-muted-foreground">
          Email
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="you@example.com"
              placeholderTextColor={theme.mutedForeground}
              className="h-11 border border-input bg-card px-4 font-mono text-sm text-foreground"
              value={value}
            />
          )}
        />
        {errors.email !== undefined ? (
          <Text className="text-sm text-destructive">{errors.email.message}</Text>
        ) : null}

        <Text className="mt-2 text-xs font-medium uppercase tracking-label text-muted-foreground">
          Password
        </Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoCapitalize="none"
              autoComplete="new-password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="At least 8 characters"
              placeholderTextColor={theme.mutedForeground}
              secureTextEntry
              className="h-11 border border-input bg-card px-4 font-mono text-sm text-foreground"
              value={value}
            />
          )}
        />
        {errors.password !== undefined ? (
          <Text className="text-sm text-destructive">{errors.password.message}</Text>
        ) : null}

        {getErrorMessage(registerError) !== null ? (
          <Text className="text-sm text-destructive">{getErrorMessage(registerError)}</Text>
        ) : null}

        <Button
          label="Create account"
          variant="primary"
          size="lg"
          isLoading={isRegistering}
          onPress={onSubmit}
          className="mt-4"
        />
      </View>

      <Link href="/login">
        <Text className="text-sm font-medium text-primary-text">Already have an account? Sign in</Text>
      </Link>
    </View>
  );
}

