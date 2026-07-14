import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/schemas/register.schema';
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
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Create account</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Join the community and start jamming.
      </ThemedText>

      <View style={styles.form}>
        <ThemedText type="smallBold">Username</ThemedText>
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
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              value={value}
            />
          )}
        />
        {errors.username !== undefined ? (
          <ThemedText style={styles.fieldError}>{errors.username.message}</ThemedText>
        ) : null}

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Email
        </ThemedText>
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
              autoComplete="new-password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="At least 8 characters"
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

        {getErrorMessage(registerError) !== null ? (
          <ThemedText style={styles.fieldError}>{getErrorMessage(registerError)}</ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isRegistering}
          onPress={onSubmit}
          style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          {isRegistering ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <ThemedText type="smallBold">Create account</ThemedText>
          )}
        </Pressable>
      </View>

      <Link href="/login">
        <ThemedText type="linkPrimary">Already have an account? Sign in</ThemedText>
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
