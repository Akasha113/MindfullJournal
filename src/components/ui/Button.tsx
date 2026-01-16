import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseStyles = 'flex items-center justify-center rounded-lg focus:outline-none transition-all duration-200 font-semibold';
  
  const variantStyles = {
    primary: 'bg-[#6E2B8A] text-white hover:bg-[#5a2270] dark:bg-[#a323af] dark:hover:bg-[#ba5ac3] focus:ring-2 focus:ring-[#6E2B8A]',
    secondary: 'bg-[#f4e4f5] text-[#6E2B8A] dark:bg-[#2d1b4e] dark:text-[#a323af] hover:bg-[#e8c8eb] dark:hover:bg-[#3a2860] focus:ring-2 focus:ring-[#6E2B8A]',
    outline: 'border-2 border-[#6E2B8A] text-[#6E2B8A] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e] focus:ring-2 focus:ring-[#6E2B8A]',
    ghost: 'text-[#6E2B8A] dark:text-[#a323af] hover:bg-[#f4e4f5] dark:hover:bg-[#2d1b4e] focus:ring-2 focus:ring-[#6E2B8A]',
    link: 'text-[#6E2B8A] dark:text-[#a323af] underline hover:text-[#5a2270] dark:hover:text-[#ba5ac3] p-0 focus:ring-0',
  };
  
  const sizeStyles = {
    sm: 'text-xs py-1 px-2 space-x-1',
    md: 'text-sm py-2 px-4 space-x-2',
    lg: 'text-base py-3 px-6 space-x-3',
  };
  
  const buttonClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${loading ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <motion.button
      className={buttonClasses}
      disabled={loading || props.disabled}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon && iconPosition === 'left' ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </motion.button>
  );
};

export default Button;