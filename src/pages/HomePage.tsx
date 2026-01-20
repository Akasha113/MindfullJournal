import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Book, BarChart, Brain } from 'lucide-react';
import Button from '../components/ui/Button';
import { getRandomQuote } from '../utils/quotes';
import storage from '../utils/storage';
import MoodSelector from '../components/mood/MoodSelector';
import { Mood } from '../types';

const HomePage: React.FC = () => {
  const [quote, setQuote] = React.useState(getRandomQuote());
  const [currentMood, setCurrentMood] = React.useState<Mood>('neutral');
  const [moodNote, setMoodNote] = React.useState('');
  const [hasTrackedMood, setHasTrackedMood] = React.useState(false);
  
  // Check if user already tracked mood today
  React.useEffect(() => {
    const entries = storage.getMoodEntries();
    const today = new Date().setHours(0, 0, 0, 0);
    
    const trackedToday = entries.some(entry => {
      const entryDate = new Date(entry.date).setHours(0, 0, 0, 0);
      return entryDate === today;
    });
    
    setHasTrackedMood(trackedToday);
    
    if (trackedToday) {
      // Get today's mood
      const todayEntry = entries.find(entry => {
        const entryDate = new Date(entry.date).setHours(0, 0, 0, 0);
        return entryDate === today;
      });
      
      if (todayEntry) {
        setCurrentMood(todayEntry.mood);
        setMoodNote(todayEntry.note || '');
      }
    }
  }, []);
  
  const trackMood = () => {
    storage.addMoodEntry(currentMood, moodNote);
    setHasTrackedMood(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        className="text-center max-w-4xl mx-auto mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="mb-8 relative"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative flex justify-center">
            <motion.div
              className="h-24 w-24 bg-gradient-to-br from-[#6E2B8A] to-[#a323af] rounded-full flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <Brain size={48} className="text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Welcome to Mindful Journal
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-black dark:text-white mb-8 max-w-2xl mx-auto font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Your personal AI companion for mental wellness and self-reflection
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link to="/chat">
            <Button size="lg" className="text-lg px-8">
              Start Chatting
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {[
          {
            icon: <MessageCircle size={32} />,
            title: "AI Therapy Chat",
            description: "Have meaningful conversations with our AI therapist in a safe, judgment-free space."
          },
          {
            icon: <Book size={32} />,
            title: "Digital Journal",
            description: "Document your thoughts and feelings with our intuitive journaling system."
          },
          {
            icon: <BarChart size={32} />,
            title: "Mood Tracking",
            description: "Track your emotional well-being and discover patterns over time."
          }
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] p-8 rounded-xl shadow-md dark:shadow-lg border-2 border-[#f4e4f5] dark:border-[#2d1b4e] hover:border-[#6E2B8A] dark:hover:border-[#ba5ac3]"
            whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(110, 43, 138, 0.15)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
          >
            <div className="h-16 w-16 bg-gradient-to-br from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#3a2860] rounded-xl flex items-center justify-center mb-6 text-[#6E2B8A] dark:text-[#ba5ac3]">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-16 text-center max-w-2xl mx-auto p-8 bg-gradient-to-br from-white to-[#f4e4f5] dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-lg dark:shadow-xl border-2 border-[#6E2B8A] dark:border-[#2d1b4e]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">Thought of the Day</h2>
        <blockquote className="text-xl italic text-gray-700 dark:text-gray-300">"{quote.text}"</blockquote>
        <p className="mt-4 text-[#6E2B8A] dark:text-[#ba5ac3] font-semibold">— {quote.author}</p>
      </motion.div>
    </div>
  );
};

export default HomePage;