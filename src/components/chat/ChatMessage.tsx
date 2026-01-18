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
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`
          flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
          ${isUser ? 'ml-2' : 'mr-2'}
          ${isUser ? 'bg-[#f4e4f5] dark:bg-[#2d1b4e]' : isCrisisMessage ? 'bg-red-600' : 'bg-[#6E2B8A] dark:bg-[#a323af]'}
        `}>
          {isUser ? (
            <User size={16} className="text-[#6E2B8A] dark:text-[#a323af]" />
          ) : isCrisisMessage ? (
            <AlertCircle size={16} className="text-white" />
          ) : (
            <Brain size={16} className="text-white" />
          )}
        </div>
        
        <div>
          <div className={`
            rounded-lg p-3 border-2
            ${isUser 
              ? 'bg-[#f4e4f5] dark:bg-[#2d1b4e] text-[#000] dark:text-[#fff] border-[#6E2B8A] dark:border-[#6E2B8A]' 
              : isCrisisMessage
                ? 'bg-red-50 dark:bg-red-900 text-red-900 dark:text-red-100 border-red-200 dark:border-red-700 shadow-lg'
                : 'bg-[#6E2B8A] dark:bg-[#2d1b4e] text-white dark:text-white border-[#6E2B8A] dark:border-[#a323af]'
            }
          `}>
            {isCrisisMessage && (
              <div className="flex items-center mb-2 text-red-600 dark:text-red-300">
                <Heart size={16} className="mr-2" />
                <span className="font-semibold text-sm">Crisis Support Resources</span>
              </div>
            )}
            <p className="whitespace-pre-wrap text-white">{message.content}</p>
          </div>
          
          <div className={`text-xs text-[#6E2B8A] dark:text-[#ba5ac3] mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;