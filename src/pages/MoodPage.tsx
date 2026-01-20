import React from 'react';
import { motion } from 'framer-motion';
import { MoodEntry, Mood } from '../types';
import { journalAPI } from '../utils/api';
import MoodSelector from '../components/mood/MoodSelector';
import MoodChart from '../components/mood/MoodChart';
import { format } from 'date-fns';

const MoodPage: React.FC = () => {
  const [moodEntries, setMoodEntries] = React.useState<MoodEntry[]>([]);
  const [currentMood, setCurrentMood] = React.useState<Mood>('neutral');
  const [optionalThought, setOptionalThought] = React.useState('');
  const [timeframe, setTimeframe] = React.useState<7 | 14 | 30>(7);
  const [loading, setLoading] = React.useState(true);

  // Load mood entries from journals with mood data
  React.useEffect(() => {
    const loadMoods = async () => {
      try {
        setLoading(true);
        const data = await journalAPI.getAll(1, 1000);
        const journals = data.journals || [];
        
        // Convert journals with mood to mood entries
        const moodEntries: MoodEntry[] = journals
          .filter(j => j.mood)
          .map(j => ({
            id: j._id || j.id,
            mood: j.mood as Mood,
            note: j.content,
            timestamp: j.createdAt || new Date().toISOString(),
          }));
        
        setMoodEntries(moodEntries);

        // Load today's mood if exists
        const todayStr = new Date().toDateString();
        const todayEntry = moodEntries.find(
          e => new Date(e.timestamp).toDateString() === todayStr
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
  }, []);

  const hasTrackedToday = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    return moodEntries.some(e => new Date(e.timestamp).toDateString() === todayStr);
  }, [moodEntries]);

  // Track today's mood
  const handleTrackMood = async () => {
    if (hasTrackedToday) return;

    try {
      const newJournal = await journalAPI.create({
        title: `Mood: ${currentMood}`,
        content: optionalThought,
        mood: currentMood,
        moodScore: 5,
        tags: ['mood-tracking'],
        isPrivate: true,
      });

      const newEntry: MoodEntry = {
        id: newJournal._id || newJournal.id,
        mood: currentMood,
        note: optionalThought,
        timestamp: newJournal.createdAt || new Date().toISOString(),
      };

      setMoodEntries(prev => [...prev, newEntry]);
      setOptionalThought('');
    } catch (err: any) {
      alert('Failed to track mood: ' + err.message);
    }
  };

  // Edit today's mood
  const handleEditTodayMood = () => {
    const todayStr = new Date().toDateString();
    const filtered = moodEntries.filter(e => new Date(e.timestamp).toDateString() !== todayStr);
    setMoodEntries(filtered);
    setCurrentMood('neutral');
    setOptionalThought('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#1a1a2e] py-8 px-4 md:px-8 space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-black dark:text-white">Loading mood data...</p>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#6E2B8A]">Mood Tracker</h1>
        <p className="text-black dark:text-white">
          Track your mood daily to see patterns over time
        </p>
      </div>

      {/* Today's Mood Section */}
      <motion.div
        className="mb-8 bg-white dark:bg-[#16213e] p-6 rounded-lg shadow-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold mb-4 text-[#6E2B8A]">
          {hasTrackedToday ? "Today's Mood" : 'How are you feeling today?'}
        </h2>

        <div className="mb-4">
          <MoodSelector
            selectedMood={currentMood}
            onSelectMood={setCurrentMood}
            size="lg"
          />
        </div>

        {/* Track / Edit Buttons */}
        {!hasTrackedToday && (
          <>
            <div className="mb-4">
              <textarea
                value={optionalThought}
                onChange={e => setOptionalThought(e.target.value)}
                placeholder="Any optional thoughts? (optional)"
                className="w-full p-3 border-2 border-[#f4e4f5] dark:border-[#6E2B8A] dark:bg-[#16213e] dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent resize-none"
                rows={2}
              />
            </div>
            <button
              onClick={handleTrackMood}
              className="px-4 py-2 bg-[#6E2B8A] dark:bg-[#a323af] text-white rounded-md hover:bg-[#5a2270] dark:hover:bg-[#ba5ac3] transition-colors font-medium"
            >
              Track Today's Mood
            </button>
          </>
        )}

        {hasTrackedToday && (
          <button
            onClick={handleEditTodayMood}
            className="px-4 py-2 mt-2 border border-[#6E2B8A] text-white rounded-md"
          >
            Edit Today's Mood
          </button>
        )}

        {hasTrackedToday && optionalThought && (
          <div className="mt-4 p-3 bg-[#f4e4f5] dark:bg-[#2d1b4e] rounded-md italic text-[#6E2B8A] dark:text-[#a323af]">
            "{optionalThought}"
          </div>
        )}
      </motion.div>

      {/* Mood Chart */}
      <motion.div
        className="mb-8"
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
                {days} days
              </button>
            ))}
          </div>
        </div>
        <MoodChart
          moodEntries={moodEntries.filter(e => e.timestamp && !isNaN(new Date(e.timestamp).getTime()))}
          days={timeframe}
        />
      </motion.div>

      {/* Mood History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4 text-[#6E2B8A]">Mood History</h2>

        {moodEntries.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-[#16213e] rounded-lg shadow-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A]">
            <p className="text-[#6E2B8A] dark:text-[#a323af]">No mood entries yet</p>
            <p className="text-sm text-[#6E2B8A] dark:text-[#ba5ac3] mt-2">
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
                  </tr>
                </thead>
                <tbody>
                  {[...moodEntries]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((entry, index) => (
                      <motion.tr
                        key={entry.id || entry.timestamp}
                        className={index % 2 === 0 ? 'bg-white dark:bg-[#16213e]' : 'bg-[#f4e4f5] dark:bg-[#2d1b4e]'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.03 }}
                      >
                        <td className="py-3 px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e] text-black dark:text-white">
                          {entry.timestamp && !isNaN(new Date(entry.timestamp).getTime())
                            ? format(new Date(entry.timestamp), 'MMM d, yyyy')
                            : 'Invalid date'}
                        </td>
                        <td className="py-3 px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e] text-black dark:text-white">
                          {entry.mood}
                        </td>
                        <td className="py-3 px-4 border-t border-[#f4e4f5] dark:border-[#2d1b4e] italic text-[#6E2B8A] dark:text-[#a323af]">
                          {entry.note || '-'}
                        </td>
                      </motion.tr>
                    ))}
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
