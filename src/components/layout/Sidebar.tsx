import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { MessageCircle, Book, BarChart, Settings, Brain } from 'lucide-react';
import { getRandomQuote } from '../../utils/quotes';
import storage from '../../utils/storage';

interface SidebarProps {
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar }) => {
  const [quote, setQuote] = React.useState(getRandomQuote());
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  React.useEffect(() => {
    const profile = storage.getUserProfile();
    setIsAdmin(profile.isAdmin || false);
  }, []);
  
  React.useEffect(() => {
    // Change quote every 2 minutes
    const interval = setInterval(() => {
      setQuote(getRandomQuote());
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: <Brain size={18} className="xs:w-5 xs:h-5 sm:w-5 sm:h-5" />, exact: true },
    { to: '/dashboard/chat', label: 'Chat', icon: <MessageCircle size={18} className="xs:w-5 xs:h-5 sm:w-5 sm:h-5" /> },
    { to: '/dashboard/journal', label: 'Journal', icon: <Book size={18} className="xs:w-5 xs:h-5 sm:w-5 sm:h-5" /> },
    { to: '/dashboard/mood', label: 'Mood Tracker', icon: <BarChart size={18} className="xs:w-5 xs:h-5 sm:w-5 sm:h-5" /> },
    { to: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} className="xs:w-5 xs:h-5 sm:w-5 sm:h-5" /> },
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-[#16213e] overflow-hidden">
      <div className="p-2 xs:p-3 sm:p-4 md:p-6 border-b-2 border-[#f4e4f5] dark:border-[#2d1b4e] bg-gradient-to-r from-white to-[#f4e4f5] dark:from-[#1a1a2e] dark:to-[#2d1b4e]">
        <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 mb-2">
          <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-[#6E2B8A] to-[#a323af] rounded-full flex items-center justify-center flex-shrink-0">
           <Brain size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs xs:text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent truncate">
              Mindful Journal
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 hidden xs:block truncate">Wellness companion</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-1.5 xs:p-2 sm:p-3 md:p-4 space-y-0.5 xs:space-y-1 sm:space-y-2 overflow-y-auto">
        {navItems.map((item, index) => (
          <motion.div 
            key={item.to}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <NavLink
              to={item.to}
              end={item.exact}
              children={({ isActive }) => (
                <div className={`
                  flex items-center px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all duration-200 text-xs xs:text-sm sm:text-base gap-1.5 xs:gap-2 sm:gap-3 min-h-10
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af] text-white shadow-lg' 
                    : 'text-gray-700 dark:text-white hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e]'
                  }
                `}>
                  <span className={`${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200'} flex-shrink-0`}>{item.icon}</span>
                  <span className={`${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200'} truncate`}>{item.label}</span>
                </div>
              )}
              onClick={handleNavClick}
            />
          </motion.div>
        ))}
      </nav>
     
      <motion.div 
        className="p-1.5 xs:p-2 sm:p-3 md:p-4 border-t-2 border-[#f4e4f5] dark:border-[#2d1b4e] bg-gradient-to-t from-[#f4e4f5] to-white dark:from-[#2d1b4e] dark:to-[#16213e]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Quote Section */}
        <motion.div 
          className="text-xs sm:text-sm text-gray-700 dark:text-white italic p-1.5 xs:p-2 sm:p-3 rounded-lg bg-white dark:bg-[#1a1a2e] border border-[#f4e4f5] dark:border-[#2d1b4e] line-clamp-3"
          key={quote.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <p>"{quote.text}"</p>
          <p className="mt-1 text-gray-600 dark:text-gray-300 text-xs">— {quote.author}</p>
        </motion.div>
      </motion.div>
    </aside>
  );
};

export default Sidebar;