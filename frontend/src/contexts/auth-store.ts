import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 这是一个基本的用户信息接口，后续可根据后端返回进行扩展
interface User {
  id: string;
  username: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage', // 在 localStorage 中的键名
      storage: createJSONStorage(() => localStorage),
    }
  )
);
