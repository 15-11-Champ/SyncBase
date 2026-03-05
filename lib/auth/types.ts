// lib/auth/types.ts
export type UserRole = 'admin' | 'manager';

export interface User {
  id: string;
  email: string;
  role?: UserRole;
  name?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}