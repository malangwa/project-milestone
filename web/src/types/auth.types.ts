export type UserRole = 'admin' | 'manager' | 'engineer' | 'viewer' | 'client' | 'subcontractor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginDto { email: string; password: string; }
export interface RegisterDto { name: string; email: string; password: string; role?: UserRole; }
