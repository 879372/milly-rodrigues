import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  must_change_password?: boolean;
  is_bookable?: boolean;
};

type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string, refresh?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token, refresh) => {
        localStorage.setItem('access_token', token);
        if (refresh) localStorage.setItem('refresh_token', refresh);
        set({ user, token });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
