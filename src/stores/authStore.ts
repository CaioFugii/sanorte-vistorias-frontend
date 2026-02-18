import { appRepository } from "@/repositories/AppRepository";
import { User, UserRole } from "@/domain";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

function getStoredUser(): User | null {
  const raw = localStorage.getItem("auth_user");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
}
}

const initialToken = localStorage.getItem("auth_token");
const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken && initialUser),

  login: async (email: string, password: string) => {
    const result = await appRepository.login(email, password);
    set({
      user: result.user,
      token: result.token,
      isAuthenticated: true,
    });
  },

  loadMe: async () => {
    if (!get().token) {
      return;
    }
    const me = await appRepository.me();
    set({ user: me, isAuthenticated: true });
  },

  logout: () => {
    appRepository.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  hasRole: (role: UserRole) => get().user?.role === role,
  hasAnyRole: (roles: UserRole[]) => {
    const role = get().user?.role;
    return !!role && roles.includes(role);
  },
}));
