import React from 'react';
import { motion } from 'framer-motion';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    
    textarea.addEventListener('input', adjustHeight);
    adjustHeight();
    
    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, []);

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
        <motion.textarea
          ref={textareaRef}
          className={`
            block w-full rounded-md border-2 border-[#f4e4f5] dark:border-[#6E2B8A] dark:bg-[#16213e] dark:text-white py-1.5 xs:py-2 sm:py-2.5 px-2 xs:px-2.5 sm:px-3
            text-xs xs:text-sm sm:text-sm
            focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent
            transition-all duration-200 min-h-24 xs:min-h-28 sm:min-h-32 resize-none
            ${error ? 'border-red-300 focus:ring-red-400' : ''}
            ${className}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
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

export default TextArea;