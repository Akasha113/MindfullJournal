import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { MessageCircle, Book, BarChart, Settings, Brain, Shield } from 'lucide-react';
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

  return (
    <aside className="h-full flex flex-col">
      <div className="p-4 border-b-2 border-[#6E2B8A] bg-gradient-to-r from-white to-[#f4e4f5] dark:from-[#16213e] dark:to-[#2d1b4e]">
        <h2 className="text-lg font-semibold text-[#6E2B8A] dark:text-[#a323af]">Mindful Journal</h2>
        <p className="text-sm text-[#6E2B8A] dark:text-[#ba5ac3]">Your AI mental health companion</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item, index) => (
          <motion.div 
            key={item.to}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.to}
              className={({ isActive }) => `
                flex items-center px-4 py-2 rounded-md font-medium transition-colors duration-200
                ${isActive 
                  ? 'bg-[#6E2B8A] text-white shadow-md' 
                  : 'text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e]'
                }
              `}
              onClick={handleNavClick}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>
      
      <motion.div 
        className="p-4 border-t-2 border-[#6E2B8A] mt-auto bg-gradient-to-t from-[#f4e4f5] to-white dark:from-[#2d1b4e] dark:to-[#16213e]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          className="text-xs text-[#6E2B8A] dark:text-[#ba5ac3] italic"
          key={quote.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <p>"{quote.text}"</p>
          <p className="mt-1 text-[#a323af] dark:text-[#8a0a9b]">— {quote.author}</p>
        </motion.div>
      </motion.div>
    </aside>
  );
};

export default Sidebar;