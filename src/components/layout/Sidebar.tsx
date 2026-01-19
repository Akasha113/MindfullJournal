import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { MessageCircle, Book, BarChart, Settings, Brain, LogOut } from 'lucide-react';
import { getRandomQuote } from '../../utils/quotes';
import storage from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar }) => {
  const [quote, setQuote] = React.useState(getRandomQuote());
  const [isAdmin, setIsAdmin] = React.useState(false);
  const { logout } = useAuth();
  
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
    { to: '/', label: 'Home', icon: <Brain size={20} /> },
    { to: '/chat', label: 'Chat', icon: <MessageCircle size={20} /> },
    { to: '/journal', label: 'Journal', icon: <Book size={20} /> },
    { to: '/mood', label: 'Mood Tracker', icon: <BarChart size={20} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-[#16213e]">
      <div className="p-6 border-b-2 border-[#f4e4f5] dark:border-[#2d1b4e] bg-gradient-to-r from-white to-[#f4e4f5] dark:from-[#1a1a2e] dark:to-[#2d1b4e]">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-gradient-to-br from-[#6E2B8A] to-[#a323af] rounded-full flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent">
              Mindful Journal
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">Wellness Companion</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => (
          <motion.div 
            key={item.to}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <NavLink
              to={item.to}
              children={({ isActive }) => (
                <div className={`
                  flex items-center px-4 py-3 rounded-lg font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af] text-white shadow-lg' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e]'
                  }
                `}>
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </div>
              )}
              onClick={handleNavClick}
            />
          </motion.div>
        ))}
      </nav>
      
      <motion.div 
        className="p-4 border-t-2 border-[#f4e4f5] dark:border-[#2d1b4e] bg-gradient-to-t from-[#f4e4f5] to-white dark:from-[#2d1b4e] dark:to-[#16213e]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Quote Section */}
        <motion.div 
          className="text-xs text-gray-700 dark:text-gray-300 italic mb-4 p-3 rounded-lg bg-white dark:bg-[#1a1a2e] border border-[#f4e4f5] dark:border-[#2d1b4e]"
          key={quote.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <p>"{quote.text}"</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">— {quote.author}</p>
        </motion.div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </motion.div>
    </aside>
  );
};

export default Sidebar;