import React from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <motion.div
          className={`
            fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-gradient-to-b dark:from-[#1a1a2e] dark:to-[#16213e] shadow-lg dark:shadow-xl z-30
            transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            transition-transform duration-300 ease-in-out
          `}
        >
          <div className="lg:hidden absolute right-0 p-2 transform translate-x-full top-0 mt-2">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full bg-gradient-to-r from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#3a2860] shadow-md text-black dark:text-white hover:from-white hover:to-[#f4e4f5] dark:hover:from-[#3a2860] dark:hover:to-[#4a3570] transition-all"
            >
              {sidebarOpen ? <X size={20} className="text-black dark:text-white" /> : <Menu size={20} className="text-black dark:text-white" />}
            </button>
          </div>
          
          <Sidebar closeSidebar={() => setSidebarOpen(false)} />
        </motion.div>
        
        {/* Main content */}
        <motion.main 
          className="flex-1 overflow-auto p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto w-full h-full">
            {children || <Outlet />}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;