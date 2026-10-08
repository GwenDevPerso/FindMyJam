// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'node_modules/*',
      'ios/*',
      'android/*',
      'web-build/*',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
      // Deno Edge Functions (URL imports), also excluded from tsconfig.json.
      'supabase/functions/*',
    ],
  },
]);
