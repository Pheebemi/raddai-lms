'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, UserRole } from '@/types';
import { mockCredentials, getMockUserByRole } from '@/lib/mock-data';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = () => {
      const storedUser = localStorage.getItem('edumanage_user');
      const storedToken = localStorage.getItem('edumanage_token');

      if (storedUser && storedToken) {
        try {
          const user = JSON.parse(storedUser);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Invalid stored data, clear it
          localStorage.removeItem('edumanage_user');
          localStorage.removeItem('edumanage_token');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; message: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate credentials based on role
    const credentials = mockCredentials[role];
    if (!credentials) {
      return { success: false, message: 'Invalid role selected' };
    }

    if (email !== credentials.email || password !== credentials.password) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Get user data
    const user = getMockUserByRole(role);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Create mock token
    const token = `mock_jwt_token_${user.id}_${Date.now()}`;

    // Store in localStorage
    localStorage.setItem('edumanage_user', JSON.stringify(user));
    localStorage.setItem('edumanage_token', token);

    // Update state
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });

    return { success: true, message: 'Login successful' };
  };

  const logout = () => {
    localStorage.removeItem('edumanage_user');
    localStorage.removeItem('edumanage_token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('edumanage_user', JSON.stringify(user));
    setAuthState(prev => ({
      ...prev,
      user,
    }));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};