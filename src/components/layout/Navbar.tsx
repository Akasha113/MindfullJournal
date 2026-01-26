import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Menu, Sun, Moon, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { ThemeContext } from '../../App';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { isDarkMode, toggleDarkMode } = React.useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/home');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowDropdown(false);
  };

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
            
            <Link to="/dashboard" className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
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
            <div onClick={toggleDarkMode} className="cursor-pointer">
              {isDarkMode ? (
                <Sun size={20} className="text-[#a323af]" />
              ) : (
                <Moon size={20} className="text-[#6E2B8A]" />
              )}
            </div>

            <Link
              to="/about"
              className="text-sm font-semibold text-[#6E2B8A] dark:text-[#a323af] hover:text-[#5a2270] dark:hover:text-[#ba5ac3]"
            >
              About
            </Link>

            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white font-semibold hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User size={18} />
                  <span className="text-sm">{user.name}</span>
                  <motion.div
                    animate={{ rotate: showDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </motion.button>

                {/* Dropdown Menu */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ 
                    opacity: showDropdown ? 1 : 0, 
                    y: showDropdown ? 0 : -10,
                    pointerEvents: showDropdown ? 'auto' : 'none'
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1a1a2e] rounded-lg shadow-xl border-2 border-[#f4e4f5] dark:border-[#6E2B8A] z-50"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-[#f4e4f5] dark:border-[#6E2B8A]">
                    <p className="text-sm font-semibold text-black dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-600 dark:text-[#ba5ac3]">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => handleNavigate('/dashboard/profile')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-black dark:text-white bg-gradient-to-r from-white to-[#f9f5fa] dark:from-[#1a1a2e] dark:to-[#2d1b4e] hover:from-[#f4e4f5] hover:to-[#e8c8eb] dark:hover:from-[#2d1b4e] dark:hover:to-[#3a2860] transition-all"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/dashboard/settings')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-black dark:text-white bg-gradient-to-r from-white to-[#f9f5fa] dark:from-[#1a1a2e] dark:to-[#2d1b4e] hover:from-[#f4e4f5] hover:to-[#e8c8eb] dark:hover:from-[#2d1b4e] dark:hover:to-[#3a2860] transition-all"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-[#f4e4f5] dark:border-[#6E2B8A]">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] hover:from-[#5a2270] hover:to-[#892c7e] dark:hover:from-[#a323af] dark:hover:to-[#ba5ac3] transition-all"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;