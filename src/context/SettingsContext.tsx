import React, { createContext, useContext, useEffect, useState } from 'react';
import storage from '../utils/storage';

export interface SettingsContextType {
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  notificationTime: string;
  setNotificationTime: (time: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(
    'medium'
  );
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationTime, setNotificationTime] = useState('09:00');

  // Load settings from storage
  useEffect(() => {
    const profile = storage.getUserProfile();
    setFontSize(profile.settings.fontSize);
    setNotifications(profile.settings.notifications);
    const isDark = profile.settings.theme === 'dark';
    setDarkMode(isDark);
    setNotificationTime(profile.settings.notificationTime || '09:00');
    
    // Apply dark mode immediately on load
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    switch (fontSize) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'medium':
        root.style.fontSize = '16px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
    }
  }, [fontSize]);

  // Apply dark mode changes
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  }, [darkMode]);

  // Handle font size changes
  const handleSetFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    const profile = storage.getUserProfile();
    storage.updateUserProfile({
      ...profile,
      settings: {
        ...profile.settings,
        fontSize: size,
      },
    });
  };

  // Handle notifications changes
  const handleSetNotifications = (enabled: boolean) => {
    setNotifications(enabled);
    const profile = storage.getUserProfile();
    storage.updateUserProfile({
      ...profile,
      settings: {
        ...profile.settings,
        notifications: enabled,
      },
    });

    // Request notification permission if enabling
    if (
      enabled &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }
  };

  // Handle dark mode changes
  const handleSetDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    const profile = storage.getUserProfile();
    storage.updateUserProfile({
      ...profile,
      settings: {
        ...profile.settings,
        theme: enabled ? 'dark' : 'light',
      },
    });
  };

  // Handle notification time changes
  const handleSetNotificationTime = (time: string) => {
    setNotificationTime(time);
    const profile = storage.getUserProfile();
    storage.updateUserProfile({
      ...profile,
      settings: {
        ...profile.settings,
        notificationTime: time,
      },
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        fontSize,
        setFontSize: handleSetFontSize,
        notifications,
        setNotifications: handleSetNotifications,
        darkMode,
        setDarkMode: handleSetDarkMode,
        notificationTime,
        setNotificationTime: handleSetNotificationTime,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
