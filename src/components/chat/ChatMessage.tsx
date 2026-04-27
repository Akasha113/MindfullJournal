import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Brain, User, AlertCircle, Heart } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Check if this is a crisis resource message
  const isCrisisMessage = !isUser && (
    message.content.includes('IMMEDIATE HELP AVAILABLE') ||
    message.content.includes('National Suicide Prevention Lifeline') ||
    message.content.includes('Call 988') ||
    message.content.includes('Crisis Text Line')
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-2 sm:px-0`}
    >
      <div className={`flex max-w-[90%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`
          flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center
          ${isUser ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}
          ${isUser ? 'bg-[#6E2B8A] dark:bg-[#2d1b4e]' : isCrisisMessage ? 'bg-[#a323af]' : 'bg-[#6E2B8A] dark:bg-[#a323af]'}
        `}>
          {isUser ? (
            <User size={14} className="sm:size-16 text-white dark:text-[#a323af]" />
          ) : isCrisisMessage ? (
            <AlertCircle size={14} className="sm:size-16 text-white" />
          ) : (
            <Brain size={14} className="sm:size-16 text-white" />
          )}
        </div>
        
        <div>
          <div className={`
            rounded-lg p-2 sm:p-3 border-2 text-xs sm:text-sm
            ${isUser 
              ? 'bg-[#E8D5F2] dark:bg-[#2d1b4e] text-black dark:text-white border-[#6E2B8A] dark:border-[#a323af]' 
              : isCrisisMessage
                ? 'bg-[#f4e4f5] dark:bg-[#2d1b4e] text-[#5a2270] dark:text-[#a323af] border-[#6E2B8A] dark:border-[#a323af] shadow-lg'
                : 'bg-[#6E2B8A] dark:bg-[#6E2B8A] text-white dark:text-white border-[#6E2B8A] dark:border-[#6E2B8A]'
            }
          `}>
            {isCrisisMessage && (
              <div className="flex items-center mb-1 sm:mb-2 text-[#6E2B8A] dark:text-[#a323af]">
                <AlertCircle size={14} className="sm:size-16 mr-1 sm:mr-2" />
                <span className="font-semibold text-xs sm:text-sm">Crisis Support Resources</span>
              </div>
            )}
            <p className={`whitespace-pre-wrap break-words ${isUser ? 'text-black dark:text-white' : isCrisisMessage ? 'text-[#5a2270] dark:text-white' : 'text-white'}`}>{message.content}</p>
          </div>
          
          <div className={`text-xs text-black dark:text-white mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;