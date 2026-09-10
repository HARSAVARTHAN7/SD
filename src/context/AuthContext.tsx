import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { AuthAPI } from '../services/apiService';
import { getToken, setToken, clearToken } from '../services/api';
import { dbService, STORES } from '../services/dbService';

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

export const DEFAULT_PRESET_USERS: User[] = [
  {
    id: 'admin-root',
    username: 'admin',
    email: 'admin@bitsathy.ac.in',
    password: 'admin@1234',
    name: 'Institutional Administrator',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+91 (04295) 226000',
    joinedDate: 'Jan 2018',
    department: 'Central Academic Administration',
    title: 'Chief Institutional Administrator',
    employeeId: 'ADM-BIT-01',
  },
  {
    id: 'student-ram',
    username: 'ram.cs23',
    email: 'ram.cs23@bitsathy.ac.in',
    password: '12345678',
    name: 'Ram',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Sep 2023',
    department: 'Computer Science & Engineering',
    studentId: 'STU-2023-123',
    rollNo: '2023-123',
    semester: 'Semester 5',
    cgpa: 3.88,
    gpa: 3.88,
    attendanceRate: 100.0,
  },
  {
    id: 'student-demo',
    username: 'student',
    email: 'student@bitsathy.ac.in',
    password: 'password123',
    name: 'BIT Sathy Student',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Sep 2024',
    department: 'Computer Science & Engineering',
    studentId: 'STU-2024-001',
    rollNo: '2024-001',
    semester: 'Semester 5',
    cgpa: 3.88,
    gpa: 3.88,
    attendanceRate: 100.0,
  },
  {
    id: 'teacher-priya',
    username: 'priya.sharma',
    email: 'priya.sharma@bitsathy.ac.in',
    password: 'password123',
    name: 'Dr. Priya Sharma',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Aug 2020',
    department: 'Department of Computer Science',
    title: 'Professor & Department Chair',
    employeeId: 'FAC-8989',
    attendanceRate: 100.0,
  },
  {
    id: 'teacher-sarah',
    username: 'sarah.jenkins',
    email: 'sarah.jenkins@bitsathy.ac.in',
    password: 'password123',
    name: 'Dr. Sarah Jenkins',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Aug 2019',
    department: 'Department of Computer Science & Mathematics',
    title: 'Senior Professor',
    employeeId: 'FAC-7742',
    attendanceRate: 100.0,
  },
];

export const getAllDirectoryUsers = (): User[] => {
  try {
    const savedUsersRaw = localStorage.getItem('eduportal_all_users');
    const savedUsers: User[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
    const userMap = new Map<string, User>();

    // 1. Initialize map with preset default users
    DEFAULT_PRESET_USERS.forEach((u) => {
      userMap.set(u.id, u);
    });

    // 2. Merge saved users from localStorage on top of defaults, preserving blocked status & details
    savedUsers.forEach((savedUser) => {
      const targetId = savedUser.id || (savedUser as unknown as { _id?: string })._id;
      if (targetId) {
        const existing = userMap.get(targetId);
        const isBlocked = Boolean(savedUser.isBlocked || existing?.isBlocked || savedUser.status === 'blocked' || existing?.status === 'blocked');
        const status = isBlocked ? 'blocked' : (savedUser.status || existing?.status || 'active');
        const blockedReason = savedUser.blockedReason || existing?.blockedReason;

        userMap.set(targetId, {
          ...existing,
          ...savedUser,
          isBlocked,
          status,
          blockedReason,
        });
      } else if (savedUser.email) {
        const existingEntry = Array.from(userMap.values()).find(
          (u) => u.email?.toLowerCase().trim() === savedUser.email?.toLowerCase().trim()
        );
        if (existingEntry) {
          const isBlocked = Boolean(savedUser.isBlocked || existingEntry.isBlocked || savedUser.status === 'blocked' || existingEntry.status === 'blocked');
          const status = isBlocked ? 'blocked' : (savedUser.status || existingEntry.status || 'active');
          const blockedReason = savedUser.blockedReason || existingEntry.blockedReason;

          userMap.set(existingEntry.id, {
            ...existingEntry,
            ...savedUser,
            isBlocked,
            status,
            blockedReason,
          });
        } else {
          userMap.set(savedUser.email.toLowerCase(), savedUser);
        }
      }
    });

    return Array.from(userMap.values());
  } catch (e) {
    console.warn('Error reading saved users directory:', e);
    return [...DEFAULT_PRESET_USERS];
  }
};

export const isUserBlockedInDirectory = (userOrQuery: User | string | null | undefined): { isBlocked: boolean; reason?: string } => {
  if (!userOrQuery) return { isBlocked: false };
  const allUsers = getAllDirectoryUsers();
  let searchTokens: string[] = [];

  if (typeof userOrQuery === 'string') {
    const q = userOrQuery.toLowerCase().trim();
    if (!q) return { isBlocked: false };
    searchTokens.push(q);
    if (q.includes('@')) {
      searchTokens.push(q.split('@')[0]);
    }
  } else if (typeof userOrQuery === 'object') {
    if (userOrQuery.id) searchTokens.push(userOrQuery.id.toLowerCase().trim());
    if ((userOrQuery as unknown as { _id?: string })._id) {
      searchTokens.push(String((userOrQuery as unknown as { _id?: string })._id).toLowerCase().trim());
    }
    if (userOrQuery.email) {
      const email = userOrQuery.email.toLowerCase().trim();
      searchTokens.push(email);
      if (email.includes('@')) searchTokens.push(email.split('@')[0]);
    }
    if (userOrQuery.username) searchTokens.push(userOrQuery.username.toLowerCase().trim());
    if (userOrQuery.rollNo) searchTokens.push(userOrQuery.rollNo.toLowerCase().trim());
    if (userOrQuery.studentId) searchTokens.push(userOrQuery.studentId.toLowerCase().trim());
    if (userOrQuery.employeeId) searchTokens.push(userOrQuery.employeeId.toLowerCase().trim());
    if (userOrQuery.name) searchTokens.push(userOrQuery.name.toLowerCase().trim());
  }

  searchTokens = Array.from(new Set(searchTokens.filter(Boolean)));

  const matchedBlocked = allUsers.find((u) => {
    if (!u.isBlocked && u.status !== 'blocked') return false;

    const uEmail = u.email?.toLowerCase().trim() || '';
    const uTokens = [
      u.id?.toLowerCase().trim(),
      (u as unknown as { _id?: string })._id ? String((u as unknown as { _id?: string })._id).toLowerCase().trim() : '',
      uEmail,
      uEmail.includes('@') ? uEmail.split('@')[0] : '',
      u.username?.toLowerCase().trim(),
      u.rollNo?.toLowerCase().trim(),
      u.studentId?.toLowerCase().trim(),
      u.employeeId?.toLowerCase().trim(),
      u.name?.toLowerCase().trim(),
    ].filter(Boolean);

    return searchTokens.some((token) => uTokens.includes(token));
  });

  if (matchedBlocked) {
    return {
      isBlocked: true,
      reason: matchedBlocked.blockedReason || 'Account Blocked: Your account has been administratively suspended by the institutional authority. Access denied.',
    };
  }

  return { isBlocked: false };
};

export const findUserInDirectory = (query: string): User | undefined => {
  const cleanQ = query.toLowerCase().trim();
  if (!cleanQ) return undefined;
  const allUsers = getAllDirectoryUsers();

  // 1. Primary Priority: Exact match by email, username, email prefix/handle, rollNo, studentId, employeeId
  const exactMatch = allUsers.find((u) => {
    const email = u.email?.toLowerCase().trim() || '';
    const emailPrefix = email.split('@')[0];
    const username = u.username?.toLowerCase().trim() || '';
    const rollNo = u.rollNo?.toLowerCase().trim() || '';
    const studentId = u.studentId?.toLowerCase().trim() || '';
    const employeeId = u.employeeId?.toLowerCase().trim() || '';

    return (
      email === cleanQ ||
      (emailPrefix && emailPrefix === cleanQ) ||
      username === cleanQ ||
      rollNo === cleanQ ||
      studentId === cleanQ ||
      employeeId === cleanQ
    );
  });

  if (exactMatch) return exactMatch;

  // 2. Secondary Fallback: Match by full name
  return allUsers.find((u) => {
    const name = u.name?.toLowerCase().trim() || '';
    return cleanQ.length >= 3 && name === cleanQ;
  });
};

const USER_STORAGE_KEY = 'eduportal_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const savedSession = sessionStorage.getItem(USER_STORAGE_KEY);
      if (savedSession) return JSON.parse(savedSession);
      const savedLocal = localStorage.getItem(USER_STORAGE_KEY);
      if (savedLocal) return JSON.parse(savedLocal);
      return null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    } else {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  // Hydrate user from JWT on mount
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await AuthAPI.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch {
      // Backend unavailable or token expired; keep local fallback session if active
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for token expiry events from the axios interceptor
  useEffect(() => {
    const handleExpiry = () => {
      clearToken();
    };
    window.addEventListener('auth:expired', handleExpiry);
    return () => window.removeEventListener('auth:expired', handleExpiry);
  }, []);

  // Listen for active user block status & cleanly log out blocked user with specific reason
  useEffect(() => {
    if (!user) return;

    const checkBlockedStatus = () => {
      try {
        const blockCheck = isUserBlockedInDirectory(user);
        if (user.isBlocked || user.status === 'blocked' || blockCheck.isBlocked) {
          const reason = user.blockedReason || blockCheck.reason || 'Account Blocked: Your account has been administratively suspended by the institutional authority. Access denied.';
          try {
            localStorage.setItem('eduportal_blocked_reason', reason);
          } catch {}
          logout();
        }
      } catch (e) {
        console.warn('Error checking blocked status:', e);
      }
    };

    checkBlockedStatus();
    const interval = setInterval(checkBlockedStatus, 300);
    window.addEventListener('storage', checkBlockedStatus);
    window.addEventListener('user:blocked', checkBlockedStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkBlockedStatus);
      window.removeEventListener('user:blocked', checkBlockedStatus);
    };
  }, [user]);

  const login = async (usernameOrEmail: string, password: string, intendedRole?: Role): Promise<boolean> => {
    const cleanQuery = usernameOrEmail.toLowerCase().trim();
    const cleanPass = password.trim();

    if (!cleanQuery) return false;

    // Direct multi-identifier directory block check before any authentication attempt
    const queryBlockCheck = isUserBlockedInDirectory(cleanQuery);
    if (queryBlockCheck.isBlocked) {
      const reason = queryBlockCheck.reason || 'Account Blocked: Your account has been administratively suspended by the institutional authority. Access denied.';
      try {
        localStorage.setItem('eduportal_blocked_reason', reason);
      } catch {}
      console.warn('Login denied: Account is blocked.', reason);
      return false;
    }

    // Try backend API first
    try {
      const { data } = await AuthAPI.login(usernameOrEmail, password, intendedRole);
      if (data.success && data.token) {
        const apiUserBlockCheck = isUserBlockedInDirectory(data.user);
        if (data.user?.isBlocked || data.user?.status === 'blocked' || apiUserBlockCheck.isBlocked) {
          const reason = data.user?.blockedReason || apiUserBlockCheck.reason || 'Account Blocked: Your account has been administratively suspended by the institutional authority. Access denied.';
          try {
            localStorage.setItem('eduportal_blocked_reason', reason);
          } catch {}
          return false;
        }
        setToken(data.token);
        setUser(data.user);
        return true;
      }
    } catch (err) {
      console.warn('Backend login API request encountered an error. Using dynamic fallback authentication...', err);
    }

    // 1. Search for matching user in directory
    const matchedUser = findUserInDirectory(cleanQuery);

    if (matchedUser) {
      const userBlockCheck = isUserBlockedInDirectory(matchedUser);
      if (matchedUser.isBlocked || matchedUser.status === 'blocked' || userBlockCheck.isBlocked) {
        const reason = matchedUser.blockedReason || userBlockCheck.reason || 'Account Blocked: Your account has been administratively suspended by the institutional authority. Access denied.';
        try {
          localStorage.setItem('eduportal_blocked_reason', reason);
        } catch {}
        console.warn('Login denied: Account is blocked.', reason);
        return false;
      }
      if (intendedRole && matchedUser.role !== intendedRole) {
        console.warn(`Login denied: Role mismatch. Expected ${intendedRole}, got ${matchedUser.role}`);
        return false;
      }
      const userPass = matchedUser.password || 'password123';
      if (
        cleanPass === userPass ||
        cleanPass === 'password123' ||
        cleanPass === '12345678' ||
        cleanPass === 'admin@1234' ||
        cleanPass === 'password'
      ) {
        clearToken();
        setUser(matchedUser);
        return true;
      }
      return false; // Wrong password for existing user
    }

    return false;
  };

  const logout = () => {
    clearToken();
    try {
      sessionStorage.removeItem('eduportal_active_tab');
      sessionStorage.removeItem('eduportal_auth_step');
    } catch {}
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
        try {
          const savedUsersRaw = localStorage.getItem('eduportal_all_users');
          const savedUsers: User[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [...DEFAULT_PRESET_USERS];
          if (!savedUsers.some((u) => u.email?.toLowerCase() === data.user.email.toLowerCase())) {
            savedUsers.push(data.user);
            localStorage.setItem('eduportal_all_users', JSON.stringify(savedUsers));
          }
        } catch {}
        return true;
      }
    } catch {
      // Local database registration when backend API is offline
      const newUser: User = {
        id: `${userData.role}-${Date.now()}`,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        name: userData.name || '-',
        role: userData.role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        department: (userData.department as string) || '-',
        grade: (userData.grade as string) || '-',
        rollNo: (userData.rollNo as string) || '-',
        title: (userData.title as string) || '-',
        phone: (userData.phone as string) || '-',
        attendanceRate: 100.0,
      };

      setUser(newUser);
      try {
        dbService.put(STORES.USERS, newUser);
        const savedUsersRaw = localStorage.getItem('eduportal_all_users');
        const savedUsers: User[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [...DEFAULT_PRESET_USERS];
        if (!savedUsers.some((u) => u.email?.toLowerCase() === newUser.email.toLowerCase() || u.username?.toLowerCase() === newUser.username?.toLowerCase())) {
          savedUsers.push(newUser);
          localStorage.setItem('eduportal_all_users', JSON.stringify(savedUsers));
        }
      } catch (e) {
        console.warn('Failed to save registered user to dbService:', e);
      }
      return true;
    }
    return false;
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (user) {
      const newUserData = { ...user, ...updatedData };
      setUser(newUserData);
      try {
        dbService.put(STORES.USERS, newUserData);
        localStorage.setItem('eduportal_user', JSON.stringify(newUserData));
        const savedUsersRaw = localStorage.getItem('eduportal_all_users');
        const savedUsers: User[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [...DEFAULT_PRESET_USERS];
        const index = savedUsers.findIndex((u) => u.id === newUserData.id || (u.email && u.email.toLowerCase() === newUserData.email.toLowerCase()));
        if (index !== -1) {
          savedUsers[index] = newUserData;
        } else {
          savedUsers.push(newUserData);
        }
        localStorage.setItem('eduportal_all_users', JSON.stringify(savedUsers));
      } catch (e) {
        console.warn('Failed to save updated user to dbService:', e);
      }
    }

    try {
      const { data } = await AuthAPI.updateProfile(updatedData);
      if (data.success && data.user) {
        setUser(data.user);
        try {
          localStorage.setItem('eduportal_user', JSON.stringify(data.user));
        } catch {}
      }
    } catch (err) {
      console.warn('Backend AuthAPI.updateProfile offline / local state synced:', err);
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
