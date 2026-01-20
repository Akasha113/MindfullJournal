import React, { createContext, useContext, useEffect, useState } from 'react';
import storage from '../utils/storage';
import { authAPI } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const authData = localStorage.getItem('authData');
    
    if (authToken && authData) {
      const parsed = JSON.parse(authData);
      setUser(parsed);
      setToken(authToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authData', JSON.stringify(data.user));
      
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);

      // Initialize user profile
      storage.initializeStorage();
      const profile = storage.getUserProfile();
      storage.updateUserProfile({
        ...profile,
        name: data.user.name,
      });
    } catch (error: any) {
      // Fallback to localStorage for backward compatibility
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const foundUser = users.find(
        (u: any) => u.email === email && u.password === password
      );

      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      const userData = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
      };

      localStorage.setItem('authData', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authData');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
