import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { AuthAPI } from '../services/apiService';
import { getToken, setToken, clearToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string, intendedRole?: Role) => Promise<boolean>;
  logout: () => void;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: Role;
    [key: string]: unknown;
  }) => Promise<boolean>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate user from JWT on mount
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await AuthAPI.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        clearToken();
        setUser(null);
      }
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for token expiry events from the axios interceptor
  useEffect(() => {
    const handleExpiry = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpiry);
    return () => window.removeEventListener('auth:expired', handleExpiry);
  }, []);

  const login = async (
    usernameOrEmail: string,
    password: string,
    intendedRole?: Role,
  ): Promise<boolean> => {
    try {
      const { data } = await AuthAPI.login(usernameOrEmail, password, intendedRole);
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: Role;
    [key: string]: unknown;
  }): Promise<boolean> => {
    try {
      const { data } = await AuthAPI.register(userData);
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    try {
      const { data } = await AuthAPI.updateProfile(updatedData);
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
