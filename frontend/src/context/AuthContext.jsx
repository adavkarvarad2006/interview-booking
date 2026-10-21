import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            logout();
          }
        } catch (err) {
          console.error('[AuthContext] Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.data) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('[AuthContext] Refresh failed:', err);
    }
  };

  // Quick switch helper for testing demo credentials
  const loginAsDemo = async (role = 'ADMIN') => {
    if (role === 'ADMIN' || role === 'COUNSELLOR') {
      return await login('parkavi.a@msrit.edu', 'Password123!');
    } else {
      return await login('emily.watson@gmail.com', 'Password123!');
    }
  };

  const sendOtp = async (email) => {
    return await api.sendOtp({ email });
  };

  const loginWithOtp = async (email, otp) => {
    const res = await api.verifyOtp({ email, otp });
    if (res.success && res.data) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      return res.data;
    }
  };

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'COUNSELLOR');
  const isStudent = user && user.role === 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isStudent,
        login,
        register,
        logout,
        refreshUser,
        loginAsDemo,
        sendOtp,
        loginWithOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      isAdmin: false,
      isStudent: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      refreshUser: async () => {},
      loginAsDemo: async () => {}
    };
  }
  return context;
};
