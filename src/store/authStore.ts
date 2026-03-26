'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AuthState } from '@/types';

interface AuthStore {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authState: AuthState;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthState: (state: AuthState) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  authState: 'loading' as AuthState,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setAuthState: (authState) => set({ authState }),
      reset: () => set(initialState),
    }),
    { name: 'AuthStore' }
  )
);
