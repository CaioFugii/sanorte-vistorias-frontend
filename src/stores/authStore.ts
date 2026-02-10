import { create } from 'zustand';
import { User, UserRole } from '@/domain';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: null,

  login: async (email: string, password: string) => {
    try {
      const { accessToken, user } = await authService.login({ email, password });
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  },

  hasRole: (role: UserRole) => {
    const { user } = get();
    return user?.role === role;
  },

  hasAnyRole: (roles: UserRole[]) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },

  loadUser: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const user = await authService.getMe();
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        // Token inválido, limpar
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));

// Carregar usuário do localStorage ao inicializar
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  if (token) {
    useAuthStore.getState().loadUser();
  }
}
