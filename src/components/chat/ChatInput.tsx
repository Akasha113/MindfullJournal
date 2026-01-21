import React from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    };
    
    textarea.addEventListener('input', adjustHeight);
    adjustHeight();
    
    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [message]);

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="relative bg-white dark:bg-[#16213e] rounded-lg shadow-md w-full"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        className="w-full resize-none rounded-lg border-2 border-[#f4e4f5] dark:border-[#6E2B8A] py-3 px-4 pr-12 bg-[#E8D5F2] dark:bg-[#E8D5F2] text-black dark:text-white placeholder-[#999] dark:placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] dark:focus:ring-[#a323af] focus:border-transparent"
        disabled={isLoading}
        rows={1}
      />
      
      <button
        type="submit"
        className={`
          absolute right-2 bottom-2 p-2 rounded-full transition-all duration-200
          ${message.trim() && !isLoading
            ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white hover:shadow-lg'
            : 'bg-gradient-to-r from-[#f4e4f5] to-[#e8c8eb] dark:from-[#2d1b4e] dark:to-[#3a2860] text-[#999] dark:text-[#666] cursor-not-allowed'
          }
        `}
        disabled={!message.trim() || isLoading}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
        ) : (
          <Send size={20} />
        )}
      </button>
    </motion.form>
  );
};

export default ChatInput;