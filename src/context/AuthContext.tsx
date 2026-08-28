import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { StorageService, subscribeToStore } from '../services/storage';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  login: (usernameOrEmail: string, password?: string, intendedRole?: Role) => boolean;
  logout: () => void;
  register: (userData: Partial<User>) => boolean;
  switchRole: (role: Role) => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => StorageService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      const current = StorageService.getCurrentUser();
      setUser(current);
    });
    return () => unsubscribe();
  }, []);

  const login = (usernameOrEmail: string, _password?: string, intendedRole?: Role): boolean => {
    const users = StorageService.getUsers();
    const cleanQuery = usernameOrEmail.trim().toLowerCase();
    
    // Find matching user by username or email
    let matched = users.find(
      (u) =>
        u.username.toLowerCase() === cleanQuery ||
        u.email.toLowerCase() === cleanQuery ||
        (intendedRole && u.role === intendedRole && u.name.toLowerCase().includes(cleanQuery))
    );

    // If no exact match found, fall back to intended role default
    if (!matched && intendedRole) {
      matched = users.find((u) => u.role === intendedRole);
    }

    if (matched) {
      StorageService.setCurrentUser(matched);
      setUser(matched);
      return true;
    }

    // Default to student Murat if no match found
    const defaultStudent = users.find((u) => u.role === 'student') || users[0];
    if (defaultStudent) {
      StorageService.setCurrentUser(defaultStudent);
      setUser(defaultStudent);
      return true;
    }

    return false;
  };

  const logout = () => {
    StorageService.setCurrentUser(null);
    setUser(null);
  };

  const register = (userData: Partial<User>): boolean => {
    const users = StorageService.getUsers();
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: userData.username || `user_${Math.floor(Math.random() * 1000)}`,
      email: userData.email || '',
      password: userData.password || 'password123',
      name: userData.name || 'New Member',
      role: userData.role || 'student',
      avatar:
        userData.role === 'teacher'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...userData,
    };

    if (newUser.role === 'student' && !newUser.gpa) {
      newUser.gpa = 3.75;
      newUser.attendanceRate = 96.0;
    }

    StorageService.saveUser(newUser);
    StorageService.setCurrentUser(newUser);
    setUser(newUser);
    return true;
  };

  const switchRole = (targetRole: Role) => {
    const users = StorageService.getUsers();
    const targetUser = users.find((u) => u.role === targetRole);
    if (targetUser) {
      StorageService.setCurrentUser(targetUser);
      setUser(targetUser);
    }
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    StorageService.saveUser(updated);
    StorageService.setCurrentUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        login,
        logout,
        register,
        switchRole,
        updateProfile,
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
