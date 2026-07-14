import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login.schema';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Sign in</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Find jams and connect with musicians near you.
      </ThemedText>

      <View style={styles.form}>
        <ThemedText type="smallBold">Email</ThemedText>
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
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              value={value}
            />
          )}
        />
        {errors.email !== undefined ? (
          <ThemedText style={styles.fieldError}>{errors.email.message}</ThemedText>
        ) : null}

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Password
        </ThemedText>
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
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              value={value}
            />
          )}
        />
        {errors.password !== undefined ? (
          <ThemedText style={styles.fieldError}>{errors.password.message}</ThemedText>
        ) : null}

        {getErrorMessage(loginError) !== null ? (
          <ThemedText style={styles.fieldError}>{getErrorMessage(loginError)}</ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isLoggingIn}
          onPress={onSubmit}
          style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          {isLoggingIn ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <ThemedText type="smallBold">Sign in</ThemedText>
          )}
        </Pressable>
      </View>

      <Link href="/register">
        <ThemedText type="linkPrimary">Create an account</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  subtitle: {
    marginBottom: Spacing.two,
  },
  form: {
    gap: Spacing.two,
  },
  fieldLabel: {
    marginTop: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  fieldError: {
    color: '#e5484d',
    fontSize: 14,
  },
  button: {
    marginTop: Spacing.three,
    borderRadius: 8,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
