import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '../types';
import { authService, SignupPayload, LoginPayload } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdminOrHr: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('dayflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dayflow_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {

          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('dayflow_user', JSON.stringify(profile));
        } catch (err) {
          console.error("Failed to restore auth session:", err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('dayflow_token');
          localStorage.removeItem('dayflow_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const data = await authService.login(payload);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('dayflow_token', data.access_token);
      localStorage.setItem('dayflow_user', JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload: SignupPayload) => {
    setLoading(true);
    try {
      const data = await authService.signup(payload);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('dayflow_token', data.access_token);
      localStorage.setItem('dayflow_user', JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (token) {
      const profile = await authService.getMe();
      setUser(profile);
      localStorage.setItem('dayflow_user', JSON.stringify(profile));
    }
  };

  const isAdminOrHr = user ? (user.role === 'ADMIN' || user.role === 'HR') : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        isAdminOrHr,
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
