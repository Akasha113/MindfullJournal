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
    // store token in localStorage (to persist across sessions) but authData in sessionStorage
    localStorage.setItem('authToken', authToken);
    sessionStorage.setItem('authData', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
    
    // conversations are now stored in localStorage keyed by user ID
    // we intentionally do **not** clear them on login so the same user can
    // return later and continue previous chats. Privacy is preserved because
    // each user has a different key, so other accounts never see these messages.

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
    // clear auth and session data; retain conversations in localStorage
    // so the user sees their history when logging back in.
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authData');
    // note: we deliberately do not remove chat data here
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
