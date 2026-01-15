export type UserRole = 'super_admin' | 'company_admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  planId: string;
  planName: string;
  userLimit: number;
  currentUsers: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  userLimit: number;
  price: number;
  features: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
