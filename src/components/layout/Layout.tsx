import React from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

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
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] flex flex-col pt-16 xs:pt-14 sm:pt-16 md:pt-16 safe-top">
      <Navbar toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden top-16 xs:top-14 sm:top-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <motion.div
          className={`
            fixed lg:static inset-y-0 left-0 top-16 xs:top-14 sm:top-16 w-56 sm:w-64 md:w-64 lg:w-64 bg-white dark:bg-gradient-to-b dark:from-[#1a1a2e] dark:to-[#16213e] shadow-lg dark:shadow-xl z-30 safe-top
            transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            transition-transform duration-300 ease-in-out
          `}
        >
          <Sidebar closeSidebar={() => setSidebarOpen(false)} />
        </motion.div>
        
        {/* Main content */}
        <motion.main 
          className="flex-1 overflow-auto px-2 py-3 xs:px-3 xs:py-4 sm:p-4 md:p-6 lg:p-6 xl:p-8 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {children || <Outlet />}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;