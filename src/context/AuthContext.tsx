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
    // store token in localStorage so it survives app restarts
    localStorage.setItem('authToken', authToken);
    // store auth data in BOTH sessionStorage and localStorage
    // sessionStorage is still useful during a browser session, but PWAs may
    // clear it when the app is closed or upgraded. using localStorage as a
    // fallback ensures we can re‑associate the user with their chats later.
    const authString = JSON.stringify(userData);
    sessionStorage.setItem('authData', authString);
    localStorage.setItem('authData', authString);

    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
    
    // conversations are stored in localStorage keyed by user ID; we don't
    // clear them on login so the same user sees history across sessions.

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
    localStorage.removeItem('authData');
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
