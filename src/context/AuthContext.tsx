import React, { createContext, useContext, useState } from 'react';
import storage from '../utils/storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [loading] = useState(false);

  // Login handler
  const login = (authToken: string, userData: any) => {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('authData', JSON.stringify(userData))
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
    
    storage.initializeStorage();
    const profile = storage.getUserProfile();
    storage.updateUserProfile({
      ...profile,
      name: userData.name,
      email: userData.email,
    });
  };

  // Logout handler
  const logout = () => {
    const authData = localStorage.getItem('authData');
    let currentUserId = 'default';
    try {
      if (authData) {
        const parsed = JSON.parse(authData);
        currentUserId = parsed.id || 'default';
      }
    } catch (e) {
      console.error('Failed to parse authData on logout:', e);
    }
    
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authData');
    localStorage.removeItem(`mindful_conversations_${currentUserId}`);
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
