import React from 'react';
import { motion } from 'framer-motion';
import storage from '../utils/storage';
import notificationService from '../utils/notificationService';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import { Check, X, Download, Upload, Info, Bell, TestTube } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [name, setName] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = React.useState(
    'default'
  );
  const [previewFontSize, setPreviewFontSize] = React.useState<
    'small' | 'medium' | 'large'
  >('medium');

  const {
    darkMode,
    setDarkMode,
    fontSize,
    setFontSize,
    notifications,
    setNotifications,
    notificationTime,
    setNotificationTime,
  } = useSettings();

  // Load settings
  React.useEffect(() => {
    const profile = storage.getUserProfile();
    setName(profile.name || '');
    setPreviewFontSize(profile.settings.fontSize);

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleSave = () => {
    try {
      storage.updateUserProfile({
        name,
      });

      setSaved(true);
      setError(null);

      // Reset saved indicator after 3 seconds
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      setSaved(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setNotificationPermission('granted');
      setNotifications(true);
    } else {
      setNotificationPermission('denied');
    }
  };

  const handleTestNotification = () => {
    notificationService.sendNotification('Test Notification', {
      body: 'This is a test notification from Zenify! Your daily reminders are working.',
    });
  };

  const handleNotificationToggle = () => {
    if (!notifications && notificationPermission !== 'granted') {
      handleRequestNotificationPermission();
    } else {
      setNotifications(!notifications);
      if (!notifications) {
        notificationService.startDailyReminder(notificationTime);
      } else {
        notificationService.stopDailyReminder();
      }
    }
  };

  const handleNotificationTimeChange = (newTime: string) => {
    setNotificationTime(newTime);
    if (notifications) {
      notificationService.startDailyReminder(newTime);
    }
  };
  
  const exportData = () => {
    try {
      const profile = storage.getUserProfile();
      const dataStr = JSON.stringify(profile, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `Zenify-data-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      setError('Failed to export data. Please try again.');
    }
  };
  
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate data structure
        if (!data.settings || !data.mood || !data.journals) {
          throw new Error('Invalid data format');
        }
        
        // Import data
        storage.updateUserProfile(data);
        
        // Update UI
        setName(data.name || '');
        setPreviewFontSize(data.settings.fontSize || 'medium');
        
        setSaved(true);
        setError(null);
        
        // Reset saved indicator after 3 seconds
        setTimeout(() => {
          setSaved(false);
        }, 3000);
      } catch (err) {
        setError('Failed to import data. File may be corrupted or in the wrong format.');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
    };
    
    reader.readAsText(file);
  };
  
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:bg-gradient-to-br dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] py-8 px-4 md:px-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent mb-2">Settings</h1>
        <p className="text-slate-600 dark:text-slate-300">Customize your Zenify experience to match your preferences</p>
      </motion.div>
      
      {/* Profile Settings */}
      <motion.div
        className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-lg dark:shadow-2xl border-2 border-[#f4e4f5] dark:border-[#2d1b4e] p-8 mb-8 hover:shadow-xl dark:hover:shadow-2xl transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">Profile</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-3">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-[#f4e4f5] dark:border-[#2d1b4e] dark:bg-[#0f0f1e] dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:ring-offset-2 dark:focus:ring-offset-[#16213e] transition-all"
            placeholder="Enter your name"
          />
        </div>
      </motion.div>
      
      {/* Appearance Settings */}
      <motion.div
        className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-lg dark:shadow-2xl border-2 border-[#f4e4f5] dark:border-[#2d1b4e] p-8 mb-8 hover:shadow-xl dark:hover:shadow-2xl transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">Appearance</h2>
        
        {/* Dark Mode Toggle */}
        <div className="mb-10">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#1a1a2e] border-2 border-[#f4e4f5] dark:border-[#2d1b4e]">
            <div>
              <label className="text-base font-semibold text-[#6E2B8A] dark:text-[#ba5ac3]">
                Dark Mode
              </label>
              <p className="text-xs text-[#6E2B8A] dark:text-[#8ba5af] mt-2">
                {darkMode ? '🌙 Dark mode is active' : '☀️ Light mode is active'}
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`
                relative inline-flex items-center h-8 rounded-full w-14 flex-shrink-0
                ${darkMode ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af]' : 'bg-gradient-to-r from-gray-300 to-gray-400'}
                transition-all duration-300 shadow-md hover:shadow-lg
              `}
            >
              <span
                className={`
                  inline-block w-6 h-6 transform rounded-full bg-white shadow-md
                  ${darkMode ? 'translate-x-7' : 'translate-x-1'}
                  transition-all duration-300
                `}
              />
            </button>
          </div>
        </div>
        
        {/* Font Size */}
        <div className="mb-6">
          <label className="block text-base font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-4">
            Font Size Preference: <span className="text-[#a323af] dark:text-[#e8c8eb]">{fontSize}</span>
          </label>
          <div className="flex gap-3 mb-6">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`
                  px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105
                  ${fontSize === size 
                    ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white shadow-lg' 
                    : 'bg-white dark:bg-[#0f0f1e] text-[#6E2B8A] dark:text-[#ba5ac3] border-2 border-[#f4e4f5] dark:border-[#2d1b4e] hover:border-[#6E2B8A] dark:hover:border-[#ba5ac3]'
                  }
                `}
              >
                <span className={size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </span>
              </button>
            ))}
          </div>

          {/* Font Size Preview */}
          <div className="p-6 bg-gradient-to-r from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#1a1a2e] rounded-lg border-2 border-[#6E2B8A] dark:border-[#6E2B8A]">
            <p className="text-[#6E2B8A] dark:text-[#ba5ac3] leading-relaxed">
              Preview: This is how your text will look with <span className="font-bold">{fontSize}</span> font size. The interface will automatically adjust all text throughout Zenify.
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Notifications Settings */}
      <motion.div
        className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-lg dark:shadow-2xl border-2 border-[#f4e4f5] dark:border-[#2d1b4e] p-8 mb-8 hover:shadow-xl dark:hover:shadow-2xl transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">Notifications</h2>
        
        {/* Notification Permission Status */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-300 dark:border-blue-700">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            🔔 Permission Status: <span className="capitalize text-blue-600 dark:text-blue-200 font-bold">{notificationPermission}</span>
          </p>
        </div>

        {/* Daily Reminders Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#1a1a2e] border-2 border-[#f4e4f5] dark:border-[#2d1b4e]">
            <div>
              <label className="text-base font-semibold text-[#6E2B8A] dark:text-[#ba5ac3]">
                Daily Mood Reminders
              </label>
              <p className="text-xs text-[#6E2B8A] dark:text-[#8ba5af] mt-2">
                {notifications ? '✓ Enabled - Get daily check-in reminders' : '○ Disabled - No reminders'}
              </p>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`
                relative inline-flex items-center h-8 rounded-full w-14 flex-shrink-0
                ${notifications ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}
                transition-all duration-300 shadow-md hover:shadow-lg
              `}
            >
              <span
                className={`
                  inline-block w-6 h-6 transform rounded-full bg-white shadow-md
                  ${notifications ? 'translate-x-7' : 'translate-x-1'}
                  transition-all duration-300
                `}
              />
            </button>
          </div>
        </div>

        {/* Notification Time */}
        {notifications && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2">
            <label className="block text-base font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-3">
              ⏰ Reminder Time
            </label>
            <input
              type="time"
              value={notificationTime}
              onChange={(e) => handleNotificationTimeChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#f4e4f5] dark:border-[#2d1b4e] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:ring-offset-2 dark:focus:ring-offset-[#16213e] transition-all"
            />
            <p className="text-xs text-[#6E2B8A] dark:text-[#8ba5af] mt-3 flex items-center gap-2">
              <span>📅</span>
              <span>You'll receive a reminder at <span className="font-bold">{notificationTime}</span> daily to check in with your mood</span>
            </p>
          </div>
        )}

        {/* Permission Request */}
        {notificationPermission === 'denied' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>Notifications are blocked in your browser settings. Enable them to receive reminders.</span>
            </p>
          </div>
        )}

        {notificationPermission === 'default' && notifications && (
          <Button
            variant="primary"
            onClick={handleRequestNotificationPermission}
            className="w-full mb-4 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb]"
          >
            Enable Notification Permission
          </Button>
        )}

        {/* Test Notification */}
        {notificationPermission === 'granted' && (
          <Button
            variant="primary"
            onClick={handleTestNotification}
            icon={<TestTube size={16} />}
            className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb]"
          >
            Send Test Notification
          </Button>
        )}
      </motion.div>
      
      {/* Data Management */}
      <motion.div
        className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-lg dark:shadow-2xl border-2 border-[#f4e4f5] dark:border-[#2d1b4e] p-8 mb-8 hover:shadow-xl dark:hover:shadow-2xl transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">Data Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button
            variant="primary"
            onClick={exportData}
            icon={<Download size={16} />}
            className="bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb]"
          >
            📥 Export Data
          </Button>
          
          <div>
            <label className="block w-full">
              <Button
                variant="primary"
                className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb]"
                icon={<Upload size={16} />}
                onClick={() => document.getElementById('import-file')?.click()}
              >
                📤 Import Data
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                className="hidden"
                onChange={importData}
              />
            </label>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border-2 border-amber-300 dark:border-amber-700 flex items-start gap-3">
          <Info size={18} className="text-amber-700 dark:text-amber-300 mt-1 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-200">
            💾 <span className="font-semibold">Backup your data regularly!</span> All your data is stored locally in your browser. Clearing browser data will remove all Zenify information.
          </p>
        </div>
      </motion.div>
      
      {/* Save Button and Status */}
      <motion.div
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          variant="primary" 
          onClick={handleSave}
          className="bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          💾 Save All Settings
        </Button>
        
        {saved && (
          <motion.div
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-300 dark:border-green-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            <Check size={20} className="text-green-600 dark:text-green-400" />
            <span className="text-green-600 dark:text-green-400 font-semibold">✓ Settings saved successfully!</span>
          </motion.div>
        )}
        
        {error && (
          <motion.div
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border-2 border-red-300 dark:border-red-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            <X size={20} className="text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400 font-semibold">{error}</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SettingsPage;