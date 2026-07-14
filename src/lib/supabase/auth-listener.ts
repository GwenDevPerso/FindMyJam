import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';

export function startAuthListener(): () => void {
  const { setSession, setLoading } = useAuthStore.getState();

  void supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error !== null) {
      setSession(null);
      setLoading(false);
      return;
    }

    setSession(session);
    setLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    setLoading(false);
  });

  return (): void => {
    subscription.unsubscribe();
  };
}
