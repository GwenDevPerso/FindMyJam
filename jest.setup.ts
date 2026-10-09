// No test talks to Supabase. Repositories are mocked per test with `jest.mock('@/repositories/….repository')`,
// but Jest's automock still loads the real repository module to read its shape, which would build a real
// client (and need AsyncStorage's native module plus the EXPO_PUBLIC_SUPABASE_* env vars). Replace the client
// module with an inert object so that never happens.
jest.mock('@/services/supabase', () => ({
  supabase: {},
  getSupabaseClient: () => ({}),
}));

// react-native-reanimated needs the react-native-worklets native module, which does not exist under Jest.
// Use the mock the library ships; Reanimated's own JavaScript keeps running.
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
