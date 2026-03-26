export type UserRole = 'admin' | 'manager' | 'engineer' | 'viewer' | 'client' | 'subcontractor';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginDto = { email: string; password: string; };
export type RegisterDto = { name: string; email: string; password: string; role?: UserRole; };
