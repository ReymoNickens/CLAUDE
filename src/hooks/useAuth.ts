'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { Profile } from '@/types';

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, authState, setUser, setSession, setProfile, setAuthState, reset } =
    useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setAuthState('authenticated');
        fetchProfile(session.user.id);
      } else {
        setAuthState('unauthenticated');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setAuthState('authenticated');
        fetchProfile(session.user.id);
      } else {
        reset();
        setAuthState('unauthenticated');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    reset();
    router.push('/login');
  }

  return {
    user,
    profile,
    authState,
    isLoading: authState === 'loading',
    isAuthenticated: authState === 'authenticated',
    signOut,
  };
}
