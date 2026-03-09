import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, UserRole, AuthState } from './types';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; requiresMfa?: boolean; user?: User }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserRole(userId: string): Promise<{ role: UserRole; companyId?: string }> {
  const { data } = await supabase
    .from('user_roles')
    .select('role, company_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (data) {
    return { role: data.role as UserRole, companyId: data.company_id ?? undefined };
  }
  // Default to 'client' if no role assigned
  return { role: 'client' };
}

async function fetchCompanyName(companyId: string): Promise<string | undefined> {
  const { data } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .maybeSingle();
  return data?.name ?? undefined;
}

async function buildUser(session: Session): Promise<User> {
  const supaUser = session.user;
  const { role, companyId } = await fetchUserRole(supaUser.id);

  let companyName: string | undefined;
  if (companyId) {
    companyName = await fetchCompanyName(companyId);
  }

  return {
    id: supaUser.id,
    email: supaUser.email ?? '',
    name: supaUser.user_metadata?.full_name ?? supaUser.email?.split('@')[0] ?? '',
    role,
    companyId,
    companyName,
    avatar: supaUser.user_metadata?.avatar_url,
    createdAt: supaUser.created_at,
    lastLogin: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  // Ref to resolve pending login promises when auth state changes
  const loginResolverRef = useRef<((user: User) => void) | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const user = await buildUser(session);
          setState({ user, isAuthenticated: true, isLoading: false });
          
          // Resolve any pending login promise
          if (loginResolverRef.current) {
            loginResolverRef.current(user);
            loginResolverRef.current = null;
          }
        } else {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const user = await buildUser(session);
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) return { success: false };
    
    // Check if user has MFA enabled and requires it
    if (data?.session && data.user) {
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (!mfaError && mfaData) {
        if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
          return { success: true, requiresMfa: true };
        }
      }
    }
    
    // Wait for the auth state listener to update state and build user
    const user = await new Promise<User>((resolve) => {
      // If state is already updated (unlikely but possible), resolve immediately
      if (state.isAuthenticated && state.user) {
        resolve(state.user);
        return;
      }
      // Otherwise wait for the auth state change listener
      loginResolverRef.current = resolve;
    });
    
    return { success: true, user };
  }, [state.isAuthenticated, state.user]);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Conta criada! Verifique seu email para confirmar.' };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const hasPermission = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!state.user) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (state.user.role === 'super_admin') return true;
    return roles.includes(state.user.role);
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, hasPermission }}>
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
