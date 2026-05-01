import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import storage from '../utils/storage';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import { Check, X, Download, Upload } from 'lucide-react';

// ─── PWA Notification Helpers ────────────────────────────────────────────────

const SW_PATH = '/sw.js'; // must be served at root

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_PATH);
  } catch {
    return null;
  }
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Schedules a repeating daily notification at `timeStr` (e.g. "08:30").
 * Stores the target in localStorage so the SW can reschedule on next visit.
 */
function scheduleDailyNotification(timeStr: string) {
  localStorage.setItem('notificationTime', timeStr);
  localStorage.setItem('notificationsEnabled', 'true');
  fireNotificationAt(timeStr);
}

function cancelDailyNotification() {
  localStorage.setItem('notificationsEnabled', 'false');
  const id = localStorage.getItem('notificationTimerId');
  if (id) clearTimeout(Number(id));
}

let _timerId: ReturnType<typeof setTimeout> | null = null;

function fireNotificationAt(timeStr: string) {
  if (_timerId) clearTimeout(_timerId);

  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1); // tomorrow if past

  const delay = target.getTime() - now.getTime();

  _timerId = setTimeout(async () => {
    if (localStorage.getItem('notificationsEnabled') !== 'true') return;

    const reg = await navigator.serviceWorker?.ready.catch(() => null);
    if (reg) {
      reg.showNotification('Mindful Journal 🌿', {
        body: "It's time for your daily mood check-in. How are you feeling?",
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'daily-checkin',
        renotify: true,
        data: { url: '/' },
      } as NotificationOptions);
    } else {
      // Fallback for non-SW environments
      new Notification('Mindful Journal 🌿', {
        body: "It's time for your daily mood check-in!",
        icon: '/icons/icon-192x192.png',
      });
    }

    // Reschedule for tomorrow
    fireNotificationAt(timeStr);
  }, delay);
}

// On page load, resume scheduling if previously enabled
const storedEnabled = localStorage.getItem('notificationsEnabled');
const storedTime = localStorage.getItem('notificationTime');
if (storedEnabled === 'true' && storedTime && Notification.permission === 'granted') {
  registerSW().then(() => fireNotificationAt(storedTime));
}

// ─── Component ───────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const [name, setName] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = React.useState<NotificationPermission>('default');

  const {
    darkMode, setDarkMode,
    fontSize, setFontSize,
    notifications, setNotifications,
    notificationTime, setNotificationTime,
  } = useSettings();

  // Initialise
  React.useEffect(() => {
    const profile = storage.getUserProfile();
    setName(profile.name || '');
    if ('Notification' in window) setNotificationPermission(Notification.permission);
    registerSW();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = () => {
    try {
      storage.updateUserProfile({ name });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save settings. Please try again.');
    }
  };

  const handleNotificationToggle = async () => {
    if (!notifications) {
      // Turning ON
      const granted = await requestNotificationPermission();
      setNotificationPermission(Notification.permission);
      if (granted) {
        setNotifications(true);
        scheduleDailyNotification(notificationTime);
      } else {
        setNotificationPermission('denied');
      }
    } else {
      // Turning OFF
      setNotifications(false);
      cancelDailyNotification();
    }
  };

  const handleTimeChange = (newTime: string) => {
    setNotificationTime(newTime);
    if (notifications && Notification.permission === 'granted') {
      scheduleDailyNotification(newTime);
    }
  };

  const exportData = () => {
    try {
      const profile = storage.getUserProfile();
      const dataStr = JSON.stringify(profile, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `Mindful-Journal-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch {
      setError('Failed to export data. Please try again.');
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.settings || !data.mood || !data.journals) throw new Error('Bad format');
        storage.updateUserProfile(data);
        setName(data.name || '');
        setSaved(true);
        setError(null);
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError('Failed to import data. File may be corrupted or in the wrong format.');
      }
    };
    reader.onerror = () => setError('Failed to read the file.');
    reader.readAsText(file);
  };

  // ── Common class strings ───────────────────────────────────────────────────

  const cardCls =
    'bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-lg dark:shadow-2xl border border-[#e8c8eb] dark:border-[#4a3570] p-6 sm:p-8 mb-8 hover:shadow-xl transition-shadow';

  const headingCls =
    'text-2xl font-bold mb-6 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent';

  const toggleTrackCls = (active: boolean) =>
    `relative inline-flex items-center h-7 rounded-full w-12 flex-shrink-0 transition-all duration-300 shadow-md hover:shadow-lg p-1 ${
      active
        ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af]'
        : 'bg-gradient-to-r from-gray-300 to-gray-400'
    }`;

  const toggleThumbCls = (active: boolean) =>
    `inline-block w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
      active ? 'translate-x-5' : 'translate-x-0'
    }`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] py-8 px-4 md:px-8">

      {/* Page Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-200">
          Customize your Mindful Journal experience
        </p>
      </motion.div>

      {/* ── Profile ── */}
      <motion.div className={cardCls} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className={headingCls}>Profile</h2>
        <label className="block text-sm font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-2">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] transition-all"
          placeholder="Enter your name"
        />
      </motion.div>

      {/* ── Appearance ── */}
      <motion.div className={cardCls} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className={headingCls}>Appearance</h2>

        {/* Dark Mode */}
        <div className="mb-8">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#1a1a2e] border-2 border-[#f4e4f5] dark:border-[#2d1b4e]">
            <div>
              <p className="text-base font-semibold text-[#6E2B8A] dark:text-[#ba5ac3]">Dark Mode</p>
              <p className="text-xs text-[#6E2B8A] dark:text-[#ba5ac3] mt-1">
                {darkMode ? '🌙 Dark mode is active' : '☀️ Light mode is active'}
              </p>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={toggleTrackCls(darkMode)} aria-label="Toggle dark mode">
              <span className={toggleThumbCls(darkMode)} />
            </button>
          </div>
        </div>

        {/* Font Size — FIXED: use grid so buttons are equal & responsive */}
        <div>
          <p className="text-base font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-4">
            Font Size: <span className="text-[#a323af] dark:text-white capitalize">{fontSize}</span>
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {(['small', 'medium', 'large'] as const).map((size) => {
              const active = fontSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`
                    py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 text-center
                    ${active
                      ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af] text-white shadow-lg'
                      : 'bg-white dark:bg-[#0f0f1e] text-[#6E2B8A] dark:text-[#e8c8eb] border border-[#e8c8eb] dark:border-[#4a3570] hover:border-[#6E2B8A] dark:hover:border-[#ba5ac3]'
                    }
                  `}
                >
                  <span className={size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div className="p-4 bg-gradient-to-r from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#1a1a2e] rounded-lg border border-[#d8a4e8] dark:border-[#5a2270]">
            <p className="text-[#6E2B8A] dark:text-[#e8c8eb] leading-relaxed text-sm">
              Preview: This is how your text will look with{' '}
              <span className="font-bold text-[#a323af] dark:text-white capitalize">{fontSize}</span>{' '}
              font size across Mindful Journal.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Notifications ── */}
      <motion.div className={cardCls} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className={headingCls}>Notifications</h2>

        {/* Permission badge */}
        <div className={`mb-6 p-3 rounded-lg border-2 text-sm font-semibold ${
          notificationPermission === 'granted'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
            : notificationPermission === 'denied'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
        }`}>
          {notificationPermission === 'granted' && '✅ '}
          {notificationPermission === 'denied' && '🚫 '}
          {notificationPermission === 'default' && '🔔 '}
          Permission: <span className="capitalize font-bold">{notificationPermission}</span>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#1a1a2e] border border-[#e8c8eb] dark:border-[#4a3570] mb-6">
          <div>
            <p className="text-base font-semibold text-[#6E2B8A] dark:text-[#ba5ac3]">Daily Mood Reminders</p>
            <p className="text-xs text-[#6E2B8A] dark:text-[#ba5ac3] mt-1">
              {notifications ? "✓ Enabled — you'll get a daily reminder" : '○ Disabled — no reminders'}
            </p>
          </div>
          <button onClick={handleNotificationToggle} className={toggleTrackCls(notifications)} aria-label="Toggle notifications">
            <span className={toggleThumbCls(notifications)} />
          </button>
        </div>

        {/* Time picker — only shown when enabled & permitted */}
        {notifications && notificationPermission === 'granted' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <label className="block text-base font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-2">
              ⏰ Reminder Time
            </label>
            <input
              type="time"
              value={notificationTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] transition-all"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              📅 You'll get a notification every day at{' '}
              <span className="font-bold text-[#6E2B8A] dark:text-[#ba5ac3]">{notificationTime}</span>
            </p>
          </motion.div>
        )}

        {/* Denied warning */}
        {notificationPermission === 'denied' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-xs text-red-700 dark:text-red-300 font-medium">
            ⚠️ Notifications are blocked in your browser. Please enable them in your browser/OS settings, then reload the page.
          </div>
        )}
      </motion.div>

      {/* ── Data Management ── */}
      <motion.div className={cardCls} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className={headingCls}>Data Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button variant="primary" onClick={exportData} icon={<Download size={16} />}
            className="bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb]">
            📥 Export Data
          </Button>
          <label className="block w-full cursor-pointer">
            <Button variant="primary" className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb]"
              icon={<Upload size={16} />} onClick={() => document.getElementById('import-file')?.click()}>
              📤 Import Data
            </Button>
            <input id="import-file" type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
        </div>
      </motion.div>

      {/* ── Save ── */}
      <motion.div className="flex items-center justify-between flex-wrap gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Button variant="primary" onClick={handleSave}
          className="bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all">
          💾 Save All Settings
        </Button>
        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700">
            <X size={18} className="text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400 font-semibold text-sm">{error}</span>
          </motion.div>
        )}
      </motion.div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {saved && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 max-w-xs rounded-2xl bg-white dark:bg-[#16213e] border border-green-300 dark:border-green-700 shadow-2xl p-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div className="flex items-center gap-3">
              <Check size={20} className="text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">Settings saved!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your preferences have been updated.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;