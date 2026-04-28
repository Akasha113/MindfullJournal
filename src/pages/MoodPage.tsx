/**
 * 🔒 MOOD TRACKING PAGE - ALL ENTRIES STORED LOCALLY, NOT IN DATABASE
 * 
 * Privacy Guarantee:
 * ✅ Mood entries are stored in browser localStorage ONLY
 * ✅ NO mood data is sent to backend servers
 * ✅ Admins CANNOT view your mood history
 * ✅ Data is user-specific and isolated (indexed by user ID)
 * ✅ Mood history persists across sessions (same browser/device)
 * 
 * How mood tracking works:
 * 1. All entries stored with key: MindFul_Journal_mood_entries_${userId}
 * 2. Each user has completely separate storage
 * 3. Deleting an entry removes it permanently from your browser
 * 4. No cloud backup - your data is 100% on your device
 * 5. You can track mood once per day (edit existing entry to update)
 * 
 * NOTE: This is intentional for maximum privacy.
 * See PRIVACY_MODEL.md for full privacy documentation.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoodEntry, Mood } from '../types';
import MoodSelector from '../components/mood/MoodSelector';
import MoodChart from '../components/mood/MoodChart';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import { Trash2, Plus, X } from 'lucide-react';
import storage from '../utils/storage';
import { useAuth } from '../context/AuthContext';

// ✅ Custom Popup Component
const MoodPopup: React.FC<{ message: string; username: string; onClose: () => void }> = ({ message, username, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border-2 border-[#6E2B8A] dark:border-[#a323af] p-6 sm:p-8 max-w-sm w-full mx-4 relative text-center"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-[#6E2B8A] dark:text-[#a323af] hover:text-[#a323af] dark:hover:text-[#e8c8eb] transition-colors"
          >
            <X size={18} />
          </button>
          <div className="text-5xl mb-4">✨</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dear</p>
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent mb-3">
            {username} 💜
          </h2>
          <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base font-medium">
            {message}
          </p>
          <motion.div
            className="mt-5 h-1 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] rounded-full"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const MoodPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [moodEntries, setMoodEntries] = React.useState<MoodEntry[]>([]);
  const [currentMood, setCurrentMood] = React.useState<Mood>('neutral');
  const [optionalThought, setOptionalThought] = React.useState('');
  const [timeframe, setTimeframe] = React.useState<7 | 14 | 30>(7);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [popup, setPopup] = React.useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const showPopup = (message: string) => setPopup({ show: true, message });
  const closePopup = () => setPopup({ show: false, message: '' });

  const username = React.useMemo(() => {
    const profile = storage.getUserProfile();
    return profile?.name || user?.email?.split('@')[0] || 'Friend';
  }, [user]);

  React.useEffect(() => {
    if (authLoading || !user) return;
    const loadMoods = () => {
      try {
        setLoading(true);
        storage.initializeStorage();
        const entries = storage.getMoodEntries();
        setMoodEntries(entries);
        const todayStr = new Date().toDateString();
        const todayEntry = entries.find(
          (e: MoodEntry) => new Date(e.date).toDateString() === todayStr
        );
        if (todayEntry) {
          setCurrentMood(todayEntry.mood);
          setOptionalThought(todayEntry.note || '');
        }
      } catch (err: any) {
        console.error('Failed to load moods:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMoods();
  }, [authLoading, user]);

  React.useEffect(() => {
    if (loading || authLoading || !user) return;
    const profile = storage.getUserProfile();
    storage.updateUserProfile({
      ...profile,
      mood: {
        current: currentMood,
        history: moodEntries,
      },
    });
  }, [moodEntries, currentMood, loading, authLoading, user]);

  const hasTrackedToday = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    return moodEntries.some(e => new Date(e.date).toDateString() === todayStr);
  }, [moodEntries]);

  const handleTrackMood = () => {
    if (hasTrackedToday && !isEditing) {
      alert('You have already tracked your mood today. Edit or delete the existing entry to track again.');
      return;
    }
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      mood: currentMood,
      note: optionalThought,
      date: Date.now(),
    };
    if (isEditing) {
      const todayStr = new Date().toDateString();
      const updated = moodEntries.map(e =>
        new Date(e.date).toDateString() === todayStr ? newEntry : e
      );
      setMoodEntries(updated);
      setIsEditing(false);
      showPopup('Your mood has been updated successfully! 🌟');
    } else {
      setMoodEntries(prev => [...prev, newEntry]);
      showPopup('Your mood has been tracked successfully! Keep it up! 🌈');
    }
    setCurrentMood('neutral');
    setOptionalThought('');
  };

  const handleEditTodayMood = () => {
    const todayStr = new Date().toDateString();
    const todayEntry = moodEntries.find(e => new Date(e.date).toDateString() === todayStr);
    if (todayEntry) {
      setCurrentMood(todayEntry.mood);
      setOptionalThought(todayEntry.note || '');
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentMood('neutral');
    setOptionalThought('');
    const todayStr = new Date().toDateString();
    const todayEntry = moodEntries.find(e => new Date(e.date).toDateString() === todayStr);
    if (todayEntry) {
      setCurrentMood(todayEntry.mood);
      setOptionalThought(todayEntry.note || '');
    }
  };

  const handleDeleteMood = (id: string) => {
    if (window.confirm('Delete this mood entry?')) {
      setMoodEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // ✅ Single shared class for ALL data cells — guarantees identical color everywhere
  const cellClass = "py-1.5 xs:py-2 sm:py-3 px-1.5 xs:px-2.5 sm:px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e] text-gray-700 dark:text-gray-300 text-xs sm:text-sm";

  return (
    <div className="min-h-[calc(100vh-64px)] xs:min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] bg-white dark:bg-[#16213e] py-2 xs:py-3 sm:py-4 md:py-6 lg:py-8 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 space-y-3 xs:space-y-4 sm:space-y-6">

      {popup.show && (
        <MoodPopup
          message={popup.message}
          username={username}
          onClose={closePopup}
        />
      )}

      {loading ? (
        <div className="text-center py-8 xs:py-10 sm:py-12">
          <p className="text-gray-600 dark:text-gray-300 text-xs xs:text-sm sm:text-base">Loading mood data...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-2 xs:mb-3 sm:mb-6">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-[#6E2B8A] mb-0.5 xs:mb-1 sm:mb-2">Mood Tracker</h1>
            <p className="text-xs xs:text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Track daily to see patterns and trends
            </p>
          </div>

          {/* Today's Mood Section */}
          <motion.div
            className="bg-white dark:bg-[#16213e] p-2.5 xs:p-3 sm:p-4 md:p-6 rounded-lg shadow-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold mb-2 xs:mb-3 sm:mb-4 text-[#6E2B8A]">
              {hasTrackedToday && !isEditing ? "Today's Mood" : isEditing ? "Edit Mood" : 'How are you feeling?'}
            </h2>

            <div className="mb-2.5 xs:mb-3 sm:mb-6">
              <MoodSelector
                selectedMood={currentMood}
                onSelectMood={setCurrentMood}
                size="lg"
              />
            </div>

            {!hasTrackedToday || isEditing ? (
              <>
                <div className="mb-2 xs:mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-[#6E2B8A] dark:text-[#a323af] mb-1.5 xs:mb-2">
                    Optional thoughts
                  </label>
                  <textarea
                    value={optionalThought}
                    onChange={e => setOptionalThought(e.target.value)}
                    placeholder="What triggered this mood?"
                    className="w-full p-1.5 xs:p-2 sm:p-3 border-2 border-[#f4e4f5] dark:border-[#6E2B8A] bg-white dark:bg-[#2d1b4e] text-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent resize-none text-xs xs:text-sm sm:text-base min-h-20 xs:min-h-24"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col xs:flex-col sm:flex-row gap-1.5 xs:gap-2 sm:gap-2">
                  <Button
                    onClick={handleTrackMood}
                    className="bg-[#6E2B8A] hover:bg-[#5a2270] text-white text-xs xs:text-sm sm:text-base w-full xs:w-full sm:w-auto py-1.5 xs:py-2 sm:py-2.5 min-h-9 xs:min-h-10 sm:min-h-11 px-2 xs:px-3 sm:px-4"
                    icon={<Plus size={14} />}
                  >
                    {isEditing ? 'Update' : 'Track'}
                  </Button>
                  {isEditing && (
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="border-[#6E2B8A] text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e] text-xs xs:text-sm sm:text-base w-full xs:w-full sm:w-auto py-1.5 xs:py-2 sm:py-2.5 min-h-9 xs:min-h-10 sm:min-h-11"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={handleEditTodayMood}
                  variant="outline"
                  className="border-[#6E2B8A] text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e] text-xs xs:text-sm sm:text-base w-full xs:w-full sm:w-auto py-1.5 xs:py-2 sm:py-2.5 min-h-9 xs:min-h-10 sm:min-h-11"
                >
                  Edit
                </Button>
                {optionalThought && (
                  <div className="mt-2 xs:mt-2.5 sm:mt-4 p-1.5 xs:p-2 sm:p-3 bg-[#f4e4f5] dark:bg-[#2d1b4e] rounded-md italic text-[#6E2B8A] dark:text-[#a323af] text-xs xs:text-sm sm:text-base">
                    "{optionalThought}"
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Mood Chart */}
          {moodEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-col xs:flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-2 sm:gap-4 mb-2 xs:mb-3 sm:mb-4">
                <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-[#6E2B8A]">Mood Trends</h2>
                <div className="flex space-x-1 xs:space-x-1.5 sm:space-x-2 w-full sm:w-auto">
                  {[7, 14, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setTimeframe(days as 7 | 14 | 30)}
                      className={`px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 sm:py-1.5 text-xs sm:text-sm rounded font-medium transition-colors flex-1 sm:flex-none min-h-8 xs:min-h-9 sm:min-h-10 ${
                        timeframe === days
                          ? 'bg-[#6E2B8A] dark:bg-[#a323af] text-white'
                          : 'bg-[#f4e4f5] dark:bg-[#2d1b4e] text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#e8c8eb] dark:hover:bg-[#3a2860]'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
              <MoodChart moodEntries={moodEntries} days={timeframe} />
            </motion.div>
          )}

          {/* Mood History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold mb-2 xs:mb-3 sm:mb-4 text-[#6E2B8A]">Mood History</h2>

            {moodEntries.length === 0 ? (
              <div className="text-center py-6 xs:py-8 sm:py-12 bg-white dark:bg-[#16213e] rounded-lg shadow-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A]">
                <p className="text-[#6E2B8A] dark:text-[#a323af] font-medium text-xs xs:text-sm sm:text-base">No mood entries yet</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 xs:mt-2">
                  Start tracking daily to see history
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden border-2 border-[#f4e4f5] dark:border-[#6E2B8A]">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs xs:text-sm">
                    <thead>
                      <tr className="bg-[#f4e4f5] dark:bg-[#2d1b4e] text-left">
                        <th className="py-1.5 xs:py-2 sm:py-3 px-1.5 xs:px-2.5 sm:px-4 font-medium text-[#6E2B8A] dark:text-[#a323af] text-xs sm:text-sm">Date</th>
                        <th className="py-1.5 xs:py-2 sm:py-3 px-1.5 xs:px-2.5 sm:px-4 font-medium text-[#6E2B8A] dark:text-[#a323af] text-xs sm:text-sm">Mood</th>
                        <th className="hidden sm:table-cell py-1.5 xs:py-2 sm:py-3 px-1.5 xs:px-2.5 sm:px-4 font-medium text-[#6E2B8A] dark:text-[#a323af] text-xs sm:text-sm">Notes</th>
                        <th className="py-1.5 xs:py-2 sm:py-3 px-1.5 xs:px-2.5 sm:px-4 font-medium text-[#6E2B8A] dark:text-[#a323af] text-xs sm:text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...moodEntries]
                        .sort((a, b) => b.date - a.date)
                        .map((entry, index) => {
                          const moodEmojis: Record<Mood, string> = {
                            awful: '😞',
                            bad: '🙁',
                            neutral: '😐',
                            good: '🙂',
                            great: '😁',
                          };
                          return (
                            <motion.tr
                              key={entry.id}
                              className={index % 2 === 0 ? 'bg-white dark:bg-[#16213e]' : 'bg-[#f4e4f5] dark:bg-[#2d1b4e]'}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 + index * 0.02 }}
                            >
                              {/* ✅ Date cell */}
                              <td className={cellClass}>
                                {format(new Date(entry.date), 'MMM d')}
                              </td>
                              {/* ✅ Mood cell — identical color to Date and Notes */}
                              <td className={`${cellClass} font-medium`}>
                                {moodEmojis[entry.mood]}{' '}
                                <span className="hidden sm:inline">
                                  {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                                </span>
                              </td>
                              {/* ✅ Notes cell */}
                              <td className={`hidden sm:table-cell ${cellClass} max-w-xs truncate text-xs`}>
                                {entry.note || '-'}
                              </td>
                              {/* Action cell */}
                              <td className="py-1.5 xs:py-2 sm:py-3 px-1.5 xs:px-2.5 sm:px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e]">
                                <button
                                  onClick={() => handleDeleteMood(entry.id)}
                                  className="p-1 rounded-md bg-[#f4e4f5] dark:bg-[#3a2860] text-[#6E2B8A] dark:text-[#d8a8e8] hover:bg-[#e8c8eb] dark:hover:bg-[#4a3070] transition-colors min-h-7 min-w-7 flex items-center justify-center"
                                  title="Delete mood entry"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MoodPage;