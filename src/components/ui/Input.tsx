import React from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  return (
    <div className="w-full mb-4">
      {label && (
        <label 
          htmlFor={props.id} 
          className="block mb-1.5 xs:mb-2 text-xs xs:text-sm sm:text-sm font-medium text-black dark:text-white"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-2 xs:pl-2.5 sm:pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <motion.input
          ref={inputRef}
          className={`
            block w-full rounded-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A] dark:bg-[#16213e] dark:text-white py-1.5 xs:py-2 sm:py-2.5 px-2 xs:px-2.5 sm:px-3
            text-xs xs:text-sm sm:text-sm
            focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent
            transition-all duration-200
            min-h-9 xs:min-h-10 sm:min-h-11
            ${icon && iconPosition === 'left' ? 'pl-8 xs:pl-9 sm:pl-10' : ''}
            ${icon && iconPosition === 'right' ? 'pr-8 xs:pr-9 sm:pr-10' : ''}
            ${error ? 'border-red-300 focus:ring-red-400' : ''}
            ${className}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        {isFocused && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6E2B8A] dark:bg-[#a323af]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      
      {error && (
        <p className="mt-1 xs:mt-1.5 sm:mt-2 text-xs xs:text-xs sm:text-sm text-[#6E2B8A] dark:text-[#ba5ac3]">{error}</p>
      )}
    </div>
  );
};

export default Input;