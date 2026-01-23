'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, UserRole } from '@/types';
import { authApi, handleApiError } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
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

  // Refresh token function
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('edumanage_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authApi.refreshToken(refreshToken);
      localStorage.setItem('edumanage_token', response.access);
      return response.access;
    } catch (error) {
      // If refresh fails, logout user
      logout();
      throw error;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('edumanage_user');
      const storedToken = localStorage.getItem('edumanage_token');
      const storedRefreshToken = localStorage.getItem('edumanage_refresh_token');

      if (storedUser && storedToken && storedRefreshToken) {
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
          localStorage.removeItem('edumanage_refresh_token');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Call Django API
      const response = await authApi.login(username, password);

      // Convert Django user format to frontend format
      const user: User = {
        id: response.user.id.toString(),
        email: response.user.email,
        firstName: response.user.first_name,
        lastName: response.user.last_name,
        role: response.user.role,
        phone: response.user.phone_number,
        address: response.user.address,
        dateOfBirth: response.user.date_of_birth,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store tokens and user data in localStorage
      localStorage.setItem('edumanage_user', JSON.stringify(user));
      localStorage.setItem('edumanage_token', response.access);
      localStorage.setItem('edumanage_refresh_token', response.refresh);

      // Update state
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, message: 'Login successful' };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('edumanage_user');
    localStorage.removeItem('edumanage_token');
    localStorage.removeItem('edumanage_refresh_token');
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