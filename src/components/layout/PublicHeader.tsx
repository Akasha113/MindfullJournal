import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../../App';

const PublicHeader: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = React.useContext(ThemeContext);

  return (
    <nav 
      className="fixed top-0 left-0 right-0 bg-white dark:bg-[#16213e] shadow-md border-b-2 border-[#6E2B8A] z-50"
    >
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <motion.div
              className="h-8 w-8 bg-[#6E2B8A] dark:bg-[#a323af] rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain size={20} className="text-white" />
            </motion.div>
            <span className="ml-2 text-xl font-semibold text-[#6E2B8A] dark:text-white">Mindful Journal</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div onClick={toggleDarkMode} className="cursor-pointer p-2 rounded-lg bg-[#f4e4f5] dark:bg-[#1a1a2e] hover:bg-[#e8e4ef] dark:hover:bg-[#25253b] transition-colors">
              {isDarkMode ? (
                <Sun size={20} className="text-[#a323af]" />
              ) : (
                <Moon size={20} className="text-[#6E2B8A]" />
              )}
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] transition-all"
              >
                Login
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicHeader;
