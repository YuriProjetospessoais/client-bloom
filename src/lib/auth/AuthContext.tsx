import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, AuthState } from './types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    email: 'admin@lovable.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'super_admin',
    createdAt: '2024-01-01',
    lastLogin: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'empresa@clinica.com',
    password: 'empresa123',
    name: 'Dr. João Silva',
    role: 'company_admin',
    companyId: 'comp-1',
    companyName: 'Clínica Bella Vita',
    createdAt: '2024-01-15',
    lastLogin: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'usuario@clinica.com',
    password: 'usuario123',
    name: 'Maria Santos',
    role: 'user',
    companyId: 'comp-1',
    companyName: 'Clínica Bella Vita',
    createdAt: '2024-02-01',
    lastLogin: new Date().toISOString(),
  },
];

const AUTH_STORAGE_KEY = 'lovable-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...user } = foundUser;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const hasPermission = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!state.user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Super admin has all permissions
    if (state.user.role === 'super_admin') return true;
    
    return roles.includes(state.user.role);
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
