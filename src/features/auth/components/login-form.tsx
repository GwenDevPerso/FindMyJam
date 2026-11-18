import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login.schema';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

function getErrorMessage(error: Error | null): string | null {
  if (error === null) {
    return null;
  }

  return error.message;
}

export function LoginForm() {
  const theme = useTheme();
  const { login, isLoggingIn, loginError } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await login(values);
  });

  return (
    <View className="flex-1 justify-center gap-4 bg-background p-6">
      <Text className="text-2xl text-foreground">Sign in</Text>
      <Text className="mb-2 text-sm text-muted-foreground">
        Find jams and connect with musicians near you.
      </Text>

      <View className="gap-2">
        <Text className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">Email</Text>
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
              className="h-12 rounded-lg border border-input bg-card px-4 text-base text-foreground focus:border-ring"
              value={value}
            />
          )}
        />
        {errors.email !== undefined ? (
          <Text className="text-sm text-destructive">{errors.email.message}</Text>
        ) : null}

        <Text className="mt-2 font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">
          Password
        </Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Your password"
              placeholderTextColor={theme.mutedForeground}
              secureTextEntry
              className="h-12 rounded-lg border border-input bg-card px-4 text-base text-foreground focus:border-ring"
              value={value}
            />
          )}
        />
        {errors.password !== undefined ? (
          <Text className="text-sm text-destructive">{errors.password.message}</Text>
        ) : null}

        {getErrorMessage(loginError) !== null ? (
          <Text className="text-sm text-destructive">{getErrorMessage(loginError)}</Text>
        ) : null}

        <Button
          label="Sign in"
          variant="primary"
          size="lg"
          isLoading={isLoggingIn}
          onPress={onSubmit}
          className="mt-4"
        />
      </View>

      <Link href="/register">
        <Text className="text-sm font-medium text-primary-text">Create an account</Text>
      </Link>
    </View>
  );
}

