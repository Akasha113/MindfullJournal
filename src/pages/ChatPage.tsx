import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import storage from '../utils/storage';
import chatService from '../utils/chat';
import { ChatMessage as ChatMessageType, Conversation } from '../types';
import { MessageCircle, Clock, PlusCircle, Trash2, Brain } from 'lucide-react';
import { getRandomQuote } from '../utils/quotes';

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadedConversations = storage.getConversations();
    setConversations(loadedConversations);

    if (loadedConversations.length === 0) {
      const newConversation = storage.createConversation('New Conversation');
      const initializedConversation = chatService.initializeConversation(newConversation.id);
      setConversations([initializedConversation ?? newConversation]);
      setActiveConversation(initializedConversation ?? newConversation);
    } else {
      setActiveConversation(loadedConversations[loadedConversations.length - 1]);
    }
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSendMessage = async (message: string) => {
    if (!activeConversation) return;
    setIsLoading(true);

    try {
      const updatedConversation = await chatService.sendMessage(activeConversation.id, message);
      if (updatedConversation) {
        setConversations(prev =>
          prev.map(c => (c.id === updatedConversation.id ? updatedConversation : c))
        );
        setActiveConversation(updatedConversation);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const newConversation = storage.createConversation('New Chat');
    const initializedConversation = chatService.initializeConversation(newConversation.id);
    setConversations([...conversations, initializedConversation ?? newConversation]);
    setActiveConversation(initializedConversation ?? newConversation);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;

    storage.deleteConversation(id);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    setActiveConversation(updated[updated.length - 1] ?? null);
  };

  const getDisplayMessages = (messages: ChatMessageType[]) =>
    messages.filter(m => m.role !== 'system');

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white">

      {/* 🟣 LIGHT PURPLE SIDEBAR */}
      <div className="hidden md:block w-64 bg-[#FEF3FF] dark:bg-[#2d1b4e] border-r border-[#F3E8FF] dark:border-[#4C1D95] overflow-y-auto">

        {/* 🔒 New Chat — DARK PURPLE */}
        <div className="p-4 border-b border-[#C4B5FD] dark:border-[#6E2B8A]">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#6E2B8A] text-white rounded-md hover:bg-[#5A2270]"
          >
            <PlusCircle size={16} className="text-white" />
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <AnimatePresence>
          {conversations.map(convo => (
            <motion.div
              key={convo.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div
                onClick={() => setActiveConversation(convo)}
                className={`border-b border-[#C4B5FD] dark:border-[#4C1D95] cursor-pointer transition-colors duration-200 ${
                  activeConversation?.id === convo.id
                    ? 'bg-[#6E2B8A] text-white'
                    : 'bg-[#E9D5FF] dark:bg-[#16213e] hover:bg-[#EDE9FE] dark:hover:bg-[#2d1b4e] text-black dark:text-white'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-1 p-3">
                    <div className={`flex items-center gap-2 ${activeConversation?.id === convo.id ? 'text-white' : 'text-black dark:text-white'}`}>
                      <MessageCircle size={16} className={activeConversation?.id === convo.id ? 'text-white' : 'text-black dark:text-white'} />
                      <span className={`truncate font-medium ${activeConversation?.id === convo.id ? 'text-white' : 'text-black dark:text-white'}`}>{convo.title}</span>
                    </div>

                    <div className={`flex items-center gap-1 mt-1 text-xs ${activeConversation?.id === convo.id ? 'text-gray-100' : 'text-black dark:text-white'}`}>
                      <Clock size={12} className={activeConversation?.id === convo.id ? 'text-white' : 'text-black dark:text-white'} />
                      <span className={activeConversation?.id === convo.id ? 'text-white' : 'text-black dark:text-white'}>{new Date(convo.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* 🟣 DELETE BUTTON — EXTRA LIGHT */}
                  <button
                    onClick={(e) => handleDeleteConversation(convo.id, e)}
                    className={`p-2 m-1 rounded ${activeConversation?.id === convo.id ? 'bg-[#5A2270] text-white hover:bg-[#4A1860]' : 'bg-[#E9D5FF] dark:bg-[#16213e] text-black dark:text-white hover:bg-[#F3E8FF] dark:hover:bg-[#2d1b4e]'}`}
                    title="Delete conversation"
                  >
                    <Trash2 size={16} className={activeConversation?.id === convo.id ? 'text-white' : 'text-black dark:text-white'} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MAIN CHAT — UNCHANGED */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {activeConversation && getDisplayMessages(activeConversation.messages).length > 0 ? (
            <>
              {getDisplayMessages(activeConversation.messages).map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-lg text-gray-500 dark:text-gray-400 mb-6"
              >
                <Brain size={48} className="mx-auto mb-4 text-[#6E2B8A]" />
                <p className="text-xl font-semibold text-[#6E2B8A] dark:text-[#a323af] mb-4">Start a conversation</p>
                <motion.div 
                  className="text-sm text-black dark:text-white italic max-w-md"
                  key={getRandomQuote().text}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                >
                  <p>"{getRandomQuote().text}"</p>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">— {getRandomQuote().author}</p>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center gap-4">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          <button
            onClick={() => {
              if (activeConversation) {
                const updated = { ...activeConversation, messages: [] };
                storage.updateConversation(updated);
                setActiveConversation(updated);
                setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
              }
            }}
            className="px-4 py-2 bg-[#6E2B8A] text-white rounded-md whitespace-nowrap flex items-center gap-2 hover:bg-[#5A2270] transition-colors"
          >
            <Trash2 size={14} className="text-white" />
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
