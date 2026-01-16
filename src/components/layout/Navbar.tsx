import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, Menu, Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../../App';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { isDarkMode, toggleDarkMode } = React.useContext(ThemeContext);

  return (
    <motion.nav 
      className="bg-white dark:bg-[#16213e] shadow-md border-b-2 border-[#6E2B8A] z-10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e] focus:outline-none"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            
            <Link to="/" className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <motion.div
                className="h-8 w-8 bg-[#6E2B8A] dark:bg-[#a323af] rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Brain size={20} className="text-white" />
              </motion.div>
              <span className="ml-2 text-xl font-semibold text-[#6E2B8A] dark:text-white">Mindful Journal</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full transition-colors"
            >
              {isDarkMode ? (
                <Sun size={20} className="text-[#a323af]" />
              ) : (
                <Moon size={20} className="text-[#6E2B8A]" />
              )}
            </button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/about"
                className="inline-flex items-center px-4 py-2 border-2 border-[#6E2B8A] text-sm font-semibold rounded-lg text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6E2B8A]"
              >
                About
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/profile"
                className="inline-flex items-center px-4 py-2 border-2 border-[#6E2B8A] text-sm font-semibold rounded-lg text-white bg-[#6E2B8A] dark:bg-[#a323af] hover:bg-[#5a2270] dark:hover:bg-[#ba5ac3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6E2B8A]"
              >
                Profile
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;