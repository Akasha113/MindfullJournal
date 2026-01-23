import React from 'react';
import { motion } from 'framer-motion';
import { MoodEntry, Mood } from '../types';
import MoodSelector from '../components/mood/MoodSelector';
import MoodChart from '../components/mood/MoodChart';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';
import storage from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const MoodPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [moodEntries, setMoodEntries] = React.useState<MoodEntry[]>([]);
  const [currentMood, setCurrentMood] = React.useState<Mood>('neutral');
  const [optionalThought, setOptionalThought] = React.useState('');
  const [timeframe, setTimeframe] = React.useState<7 | 14 | 30>(7);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);

  // Load mood entries from storage (user-specific) - ONLY after user is loaded
  React.useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    const loadMoods = () => {
      try {
        setLoading(true);
        storage.initializeStorage(); // Ensure storage is initialized with correct user
        const entries = storage.getMoodEntries();
        setMoodEntries(entries);

        // Load today's mood if exists
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

  // Save to storage whenever entries change (user-specific)
  React.useEffect(() => {
    if (loading || authLoading || !user) return; // Don't save while loading or no user
    
    const profile = storage.getUserProfile();
    storage.updateUserProfile({ 
      ...profile, 
      mood: { 
        current: currentMood, 
        history: moodEntries 
      } 
    });
  }, [moodEntries, currentMood, loading, authLoading, user]);

  const hasTrackedToday = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    return moodEntries.some(e => new Date(e.date).toDateString() === todayStr);
  }, [moodEntries]);

  // Track today's mood
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
      // Update existing entry
      const todayStr = new Date().toDateString();
      const updated = moodEntries.map(e => 
        new Date(e.date).toDateString() === todayStr ? newEntry : e
      );
      setMoodEntries(updated);
      setIsEditing(false);
      alert('Mood updated successfully! ✨');
    } else {
      // Create new entry
      setMoodEntries(prev => [...prev, newEntry]);
      alert('Mood tracked successfully! ✨');
    }
    
    setCurrentMood('neutral');
    setOptionalThought('');
  };

  // Edit today's mood
  const handleEditTodayMood = () => {
    const todayStr = new Date().toDateString();
    const todayEntry = moodEntries.find(e => new Date(e.date).toDateString() === todayStr);
    
    if (todayEntry) {
      // Load the mood data into the form
      setCurrentMood(todayEntry.mood);
      setOptionalThought(todayEntry.note || '');
      setIsEditing(true);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentMood('neutral');
    setOptionalThought('');
    
    // Reload today's mood if it exists
    const todayStr = new Date().toDateString();
    const todayEntry = moodEntries.find(e => new Date(e.date).toDateString() === todayStr);
    if (todayEntry) {
      setCurrentMood(todayEntry.mood);
      setOptionalThought(todayEntry.note || '');
    }
  };

  // Delete mood entry
  const handleDeleteMood = (id: string) => {
    if (window.confirm('Delete this mood entry?')) {
      setMoodEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#16213e] py-8 px-4 md:px-8 space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">Loading mood data...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#6E2B8A] mb-2">Mood Tracker</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track your daily mood to see patterns and trends over time
            </p>
          </div>

          {/* Today's Mood Section */}
          <motion.div
            className="bg-white dark:bg-[#16213e] p-6 rounded-lg shadow-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-[#6E2B8A]">
              {hasTrackedToday && !isEditing ? "Today's Mood" : isEditing ? "Edit Today's Mood" : 'How are you feeling today?'}
            </h2>

            <div className="mb-6">
              <MoodSelector
                selectedMood={currentMood}
                onSelectMood={setCurrentMood}
                size="lg"
              />
            </div>

            {/* Track / Edit Buttons */}
            {!hasTrackedToday || isEditing ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#6E2B8A] dark:text-[#a323af] mb-2">
                    Optional thoughts (optional)
                  </label>
                  <textarea
                    value={optionalThought}
                    onChange={e => setOptionalThought(e.target.value)}
                    placeholder="What's on your mind? What triggered this mood?"
                    className="w-full p-3 border-2 border-[#f4e4f5] dark:border-[#6E2B8A] bg-white dark:bg-[#2d1b4e] text-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTrackMood}
                    className="bg-[#6E2B8A] hover:bg-[#5a2270] text-white"
                    icon={<Plus size={18} />}
                  >
                    {isEditing ? 'Update Mood' : "Track Today's Mood"}
                  </Button>
                  {isEditing && (
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="border-[#6E2B8A] text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e]"
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
                  className="border-[#6E2B8A] text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e]"
                >
                  Edit Today's Mood
                </Button>
                {optionalThought && (
                  <div className="mt-4 p-3 bg-[#f4e4f5] dark:bg-[#2d1b4e] rounded-md italic text-[#6E2B8A] dark:text-[#a323af]">
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#6E2B8A]">Mood Trends</h2>
                <div className="flex space-x-2">
                  {[7, 14, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setTimeframe(days as 7 | 14 | 30)}
                      className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
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
            <h2 className="text-xl font-semibold mb-4 text-[#6E2B8A]">Mood History</h2>

            {moodEntries.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#16213e] rounded-lg shadow-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A]">
                <p className="text-[#6E2B8A] dark:text-[#a323af] font-medium">No mood entries yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Start tracking your mood daily to see your history here
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden border-2 border-[#f4e4f5] dark:border-[#6E2B8A]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f4e4f5] dark:bg-[#2d1b4e] text-left">
                        <th className="py-3 px-4 font-medium text-[#6E2B8A] dark:text-[#a323af]">Date</th>
                        <th className="py-3 px-4 font-medium text-[#6E2B8A] dark:text-[#a323af]">Mood</th>
                        <th className="py-3 px-4 font-medium text-[#6E2B8A] dark:text-[#a323af]">Notes</th>
                        <th className="py-3 px-4 font-medium text-[#6E2B8A] dark:text-[#a323af]">Action</th>
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
                              <td className="py-3 px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e] text-gray-700 dark:text-white">
                                {format(new Date(entry.date), 'MMM d, yyyy')}
                              </td>
                              <td className="py-3 px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e] text-gray-700 dark:text-white font-medium">
                                {moodEmojis[entry.mood]} {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                              </td>
                              <td className="py-3 px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e] text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                {entry.note || '-'}
                              </td>
                              <td className="py-3 px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e]">
                                <button
                                  onClick={() => handleDeleteMood(entry.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Delete mood entry"
                                >
                                  <Trash2 size={18} />
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
