import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('task_manager_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('task_manager_token') || null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('task_manager_theme') || 'dark');

  // Initialize theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('task_manager_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Verify session on mount
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('task_manager_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.auth.getMe();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('task_manager_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('task_manager_token', res.token);
      localStorage.setItem('task_manager_user', JSON.stringify(res.user));
    }
    return res;
  };

  const signup = async (userData) => {
    const res = await api.auth.signup(userData);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('task_manager_token', res.token);
      localStorage.setItem('task_manager_user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('task_manager_token');
    localStorage.removeItem('task_manager_user');
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('task_manager_user', JSON.stringify(updatedUserData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toggleTheme,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user
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

