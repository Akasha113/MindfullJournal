import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import Layout from './components/layout/Layout';
import PublicHeader from './components/layout/PublicHeader';

// Pages
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import JournalPage from './pages/JournalPage';
import MoodPage from './pages/MoodPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerificationPage from './pages/VerificationPage';

// Services
import storage from './utils/storage';
import notificationService from './utils/notificationService';

// Contexts
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Theme Context
export const ThemeContext = React.createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

// Protected Route Component - Redirects to login if not authenticated
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6E2B8A]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Layout Component - For public pages without full Layout
const PublicLayoutWrapper: React.FC<{ children: React.ReactNode; isDarkMode: boolean; toggleDarkMode: () => void }> = ({ children, isDarkMode, toggleDarkMode }) => {
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e]">
        <PublicHeader />
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

function AppContent() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const { isAuthenticated, loading } = useAuth();

  // Initialize storage and theme for authenticated users
  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      storage.initializeStorage();
      const profile = storage.getUserProfile();
      
      setIsDarkMode(profile.settings.theme === 'dark');
      setIsAdmin(profile.isAdmin || false);

      // Initialize notifications
      notificationService.initializeReminders();
    }
  }, [isAuthenticated, loading]);

  // Update theme
  React.useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6E2B8A]"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes - Accessible to everyone */}
        <Route path="/login" element={<PublicLayoutWrapper isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}><LoginPage /></PublicLayoutWrapper>} />
        <Route path="/register" element={<PublicLayoutWrapper isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}><RegisterPage /></PublicLayoutWrapper>} />
        <Route path="/verify" element={<PublicLayoutWrapper isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}><VerificationPage /></PublicLayoutWrapper>} />
        
        {/* About Page - Shows appropriate header based on auth status */}
        <Route
          path="/about"
          element={
            isAuthenticated ? (
              <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
                <Layout>
                  <AboutPage />
                </Layout>
              </ThemeContext.Provider>
            ) : (
              <PublicLayoutWrapper isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}><AboutPage /></PublicLayoutWrapper>
            )
          }
        />
        
        <Route path="/" element={<PublicLayoutWrapper isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}><HomePage /></PublicLayoutWrapper>} />

        {/* Protected Routes - Only for authenticated users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
                <Layout />
              </ThemeContext.Provider>
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="mood" element={<MoodPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {isAdmin && <Route path="admin" element={<AdminPage />} />}
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;