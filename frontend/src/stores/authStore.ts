import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ScopePermissionFlags = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export interface User {
  email: string;
  roleName: string;
  employeeId: string;
  /** Only present for hr_admin; set from login/refresh. Super Admin has full access. */
  scopePermissions?: Record<string, ScopePermissionFlags>;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'hrms-auth' }
  )
);
