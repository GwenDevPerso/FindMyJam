import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!anonKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable',
    );
  }

  return { url, anonKey };
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient === null) {
    const { url, anonKey } = getSupabaseEnv();

    supabaseClient = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseClient;
}

export const supabase = getSupabaseClient();
