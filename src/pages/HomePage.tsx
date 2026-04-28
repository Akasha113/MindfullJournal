import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Book, BarChart, Brain, Zap, Shield, Users, TrendingUp, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import { getRandomQuote } from '../utils/quotes';
import storage from '../utils/storage';
import MoodSelector from '../components/mood/MoodSelector';
import { Mood } from '../types';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [quote, setQuote] = React.useState(getRandomQuote());
  const [currentMood, setCurrentMood] = React.useState<Mood>('neutral');
  const [moodNote, setMoodNote] = React.useState('');
  const [hasTrackedMood, setHasTrackedMood] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      try {
        const entries = storage.getMoodEntries();
        const today = new Date().setHours(0, 0, 0, 0);

        const trackedToday = entries.some(entry => {
          const entryDate = new Date(entry.date).setHours(0, 0, 0, 0);
          return entryDate === today;
        });

        setHasTrackedMood(trackedToday);

        if (trackedToday) {
          const todayEntry = entries.find(entry => {
            const entryDate = new Date(entry.date).setHours(0, 0, 0, 0);
            return entryDate === today;
          });

          if (todayEntry) {
            setCurrentMood(todayEntry.mood);
            setMoodNote(todayEntry.note || '');
          }
        }
      } catch (error) {
        console.error('Error loading mood entries:', error);
      }
    }
  }, [isAuthenticated]);

  const trackMood = () => {
    storage.addMoodEntry(currentMood, moodNote);
    setHasTrackedMood(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] flex flex-col items-center justify-center py-4 xs:py-6 sm:py-8 md:py-12 px-2 xs:px-3 sm:px-4">
      
      {/* Hero Section */}
      <motion.div
        className="text-center max-w-4xl mx-auto mb-6 xs:mb-8 sm:mb-12 md:mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="mb-3 xs:mb-4 sm:mb-6 md:mb-8 relative"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative flex justify-center">
            <motion.div
              className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 bg-gradient-to-br from-[#6E2B8A] to-[#a323af] rounded-full flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <Brain size={28} className="xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 xs:mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Welcome to Mindful Journal
        </motion.h1>

        <motion.p
          className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-black dark:text-white mb-3 xs:mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Your personal AI companion for mental wellness and self-reflection
        </motion.p>

        <motion.div
          className="flex flex-col xs:flex-col sm:flex-row flex-wrap justify-center gap-2 xs:gap-2.5 sm:gap-3 md:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {isAuthenticated ? (
            <>
              <Link to="/dashboard/chat" className="w-full xs:w-full sm:w-auto">
                <Button size="lg" className="text-xs xs:text-sm sm:text-base md:text-base px-3 xs:px-4 sm:px-6 md:px-8 w-full py-2 xs:py-2.5 sm:py-3 min-h-10 xs:min-h-11 sm:min-h-12">
                  Start Chatting
                </Button>
              </Link>
              <Link to="/dashboard/mood" className="w-full xs:w-full sm:w-auto">
                <Button size="lg" variant="outline" className="text-xs xs:text-sm sm:text-base md:text-base px-3 xs:px-4 sm:px-6 md:px-8 w-full py-2 xs:py-2.5 sm:py-3 min-h-10 xs:min-h-11 sm:min-h-12">
                  Track Mood
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="w-full xs:w-full sm:w-auto">
                <Button size="lg" className="text-xs xs:text-sm sm:text-base md:text-base px-3 xs:px-4 sm:px-6 md:px-8 w-full py-2 xs:py-2.5 sm:py-3 min-h-10 xs:min-h-11 sm:min-h-12">
                  Get Started
                </Button>
              </Link>
              <Link to="/about" className="w-full xs:w-full sm:w-auto">
                <Button size="lg" variant="outline" className="text-xs xs:text-sm sm:text-base md:text-base px-3 xs:px-4 sm:px-6 md:px-8 w-full py-2 xs:py-2.5 sm:py-3 min-h-10 xs:min-h-11 sm:min-h-12">
                  Learn More
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8 w-full max-w-5xl mx-auto px-2 xs:px-3 sm:px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {[
          {
            icon: <MessageCircle size={20} className="xs:w-6 xs:h-6 sm:w-6 sm:h-6" />,
            title: "AI Therapy Chat",
            description: "Have meaningful conversations with our AI therapist in a safe, judgment-free space."
          },
          {
            icon: <Book size={20} className="xs:w-6 xs:h-6 sm:w-6 sm:h-6" />,
            title: "Digital Journal",
            description: "Document your thoughts and feelings with our intuitive journaling system."
          },
          {
            icon: <BarChart size={20} className="xs:w-6 xs:h-6 sm:w-6 sm:h-6" />,
            title: "Mood Tracking",
            description: "Track your emotional well-being and discover patterns over time."
          }
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl shadow-md dark:shadow-lg border-2 border-[#f4e4f5] dark:border-[#2d1b4e] hover:border-[#6E2B8A] dark:hover:border-[#ba5ac3] transition-all"
            whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(110, 43, 138, 0.15)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
          >
            <div className="h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 bg-gradient-to-br from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#3a2860] rounded-xl flex items-center justify-center mb-2 xs:mb-2.5 sm:mb-3 md:mb-4 text-[#6E2B8A] dark:text-[#ba5ac3] flex-shrink-0">
              {feature.icon}
            </div>
            <h3 className="text-sm xs:text-base sm:text-lg font-bold mb-1 xs:mb-1.5 sm:mb-2 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs xs:text-xs sm:text-sm">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quote Section */}
      <motion.div
        className="mt-6 xs:mt-8 sm:mt-12 md:mt-16 text-center max-w-2xl mx-auto p-3 xs:p-4 sm:p-6 md:p-8 bg-gradient-to-br from-white to-[#f4e4f5] dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-lg dark:shadow-xl border-2 border-[#6E2B8A] dark:border-[#2d1b4e] mx-3 xs:mx-3 sm:mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      >
        <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold mb-2 xs:mb-2.5 sm:mb-3 md:mb-4 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">Thought of the Day</h2>
        <blockquote className="text-xs xs:text-sm sm:text-base md:text-lg italic text-gray-700 dark:text-gray-300">"{quote.text}"</blockquote>
        <p className="mt-2 xs:mt-2.5 sm:mt-3 md:mt-4 text-[#6E2B8A] dark:text-[#ba5ac3] font-semibold text-xs xs:text-sm md:text-base">— {quote.author}</p>
      </motion.div>

      {/* How It Works Section */}
      <motion.div
        className="mt-8 xs:mt-10 sm:mt-14 md:mt-20 w-full max-w-5xl mx-auto px-2 xs:px-3 sm:px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 xs:mb-6 sm:mb-8 md:mb-12 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {[
            { step: 1, title: "Create Account", description: "Sign up in seconds and start your wellness journey today." },
            { step: 2, title: "Share Your Feelings", description: "Chat with AI, journal your thoughts, and track your mood daily." },
            { step: 3, title: "Get Insights", description: "Discover patterns in your emotions and improve your mental health." }
          ].map((item, index) => (
            <motion.div
              key={item.step}
              className="text-center p-3 xs:p-4 sm:p-5 md:p-6 bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl border-2 border-[#f4e4f5] dark:border-[#2d1b4e] transition-all"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + index * 0.1 }}
            >
              <div className="h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 bg-gradient-to-br from-[#6E2B8A] to-[#a323af] text-white rounded-full flex items-center justify-center mx-auto mb-2 xs:mb-2.5 sm:mb-3 md:mb-4 font-bold text-sm xs:text-base sm:text-lg flex-shrink-0">
                {item.step}
              </div>
              <h3 className="text-sm xs:text-base sm:text-lg font-bold text-[#6E2B8A] dark:text-[#ba5ac3] mb-1 xs:mb-1.5 sm:mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs xs:text-xs sm:text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        className="mt-8 xs:mt-10 sm:mt-14 md:mt-20 w-full max-w-5xl mx-auto px-2 xs:px-3 sm:px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.4 }}
      >
        <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 xs:mb-6 sm:mb-8 md:mb-12 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">Why Choose Mindful Journal?</h2>
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-6">
          {[
            { icon: <Shield size={18} className="xs:w-5 xs:h-5" />, title: "100% Private", description: "Your data is encrypted and stored locally. Complete privacy guaranteed." },
            { icon: <Zap size={18} className="xs:w-5 xs:h-5" />, title: "AI-Powered Support", description: "Advanced AI therapy tailored to your personal mental wellness needs." },
            { icon: <TrendingUp size={18} className="xs:w-5 xs:h-5" />, title: "Track Progress", description: "Visualize your emotional growth with detailed mood analytics." },
            { icon: <Users size={18} className="xs:w-5 xs:h-5" />, title: "Community Driven", description: "Built with input from mental health professionals and real users." }
          ].map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="flex gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 p-3 xs:p-3.5 sm:p-4 md:p-6 bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl border-2 border-[#f4e4f5] dark:border-[#2d1b4e] transition-all"
              whileHover={{ x: 5 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + index * 0.1 }}
            >
              <div className="flex-shrink-0 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-[#6E2B8A] to-[#a323af] text-white rounded-lg flex items-center justify-center">
                {benefit.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#6E2B8A] dark:text-[#ba5ac3] mb-0.5 xs:mb-1 text-xs xs:text-sm sm:text-base">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Testimonials Section */}
      <motion.div
        className="mt-8 xs:mt-10 sm:mt-14 md:mt-20 mb-8 xs:mb-10 sm:mb-14 md:mb-20 w-full max-w-5xl mx-auto px-2 xs:px-3 sm:px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.8 }}
      >
        <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 xs:mb-6 sm:mb-8 md:mb-12 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">What Users Say</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {[
            { name: "Sarah M.", text: "Mindful Journal has been transformative for my mental health. The AI conversations feel so natural and helpful." },
            { name: "Ahmed K.", text: "Finally found a tool that helps me understand my emotions better. The mood tracking is incredible!" },
            { name: "Emily R.", text: "This app has become part of my daily routine. It's like having a therapist available 24/7." }
          ].map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="p-3 xs:p-4 sm:p-5 md:p-6 bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl border-2 border-[#f4e4f5] dark:border-[#2d1b4e] transition-all"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9 + index * 0.1 }}
            >
              <div className="flex mb-2 xs:mb-2.5 sm:mb-3 md:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2 xs:mb-2.5 sm:mb-3 md:mb-4 text-xs xs:text-xs sm:text-sm md:text-base">"{testimonial.text}"</p>
              <p className="font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] text-xs xs:text-xs sm:text-sm md:text-base">— {testimonial.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
};

export default HomePage;