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
    <div className="h-[calc(100vh-64px)] flex bg-white dark:bg-[#16213e]">

      {/* Sidebar - Conversations */}
      <div className="hidden md:block w-64 bg-[#FEF3FF] dark:bg-gradient-to-b dark:from-[#2d1b4e] dark:to-[#16213e] border-r border-[#F3E8FF] dark:border-[#2d1b4e] overflow-y-auto m-4 ml-0 rounded-lg">

        {/* New Chat Button */}
        <div className="p-4 border-b border-[#C4B5FD] dark:border-[#2d1b4e]">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#6E2B8A] dark:bg-gradient-to-r dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white rounded-md hover:bg-[#5a2270] dark:hover:shadow-lg transition-all"
          >
            <PlusCircle size={16} />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
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
                className={`border-b border-[#C4B5FD] dark:border-[#2d1b4e] cursor-pointer transition-all duration-200 ${
                  activeConversation?.id === convo.id
                    ? 'bg-gradient-to-r from-[#ba5ac3] to-[#e8c8eb] dark:bg-gradient-to-r dark:from-[#a323af] dark:to-[#ba5ac3] text-white shadow-md'
                    : 'bg-[#E9D5FF] dark:bg-[#16213e] hover:bg-[#EDE9FE] dark:hover:bg-[#2d1b4e] text-black dark:text-white'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-1 p-3">
                    <div className={`flex items-center gap-2 font-semibold ${activeConversation?.id === convo.id ? 'text-white' : 'text-black dark:text-white'}`}>
                      <MessageCircle size={16} className={activeConversation?.id === convo.id ? 'text-white' : 'text-black dark:text-white'} />
                      <span className="truncate">{convo.title}</span>
                    </div>

                    <div className={`flex items-center gap-1 mt-1 text-xs ${activeConversation?.id === convo.id ? 'text-gray-100' : 'text-black dark:text-white'}`}>
                      <Clock size={12} className={activeConversation?.id === convo.id ? 'text-gray-100' : 'text-black dark:text-white'} />
                      <span>{new Date(convo.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteConversation(convo.id, e)}
                    className={`p-2 m-1 rounded transition-all ${
                      activeConversation?.id === convo.id 
                        ? 'hover:bg-[#5a2270]' 
                        : 'hover:bg-[#d8a4e8] dark:hover:bg-[#4C1D95]'
                    }`}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#16213e]">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
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
                className="text-center"
              >
                <Brain size={48} className="mx-auto mb-4 text-[#6E2B8A] dark:text-[#ba5ac3]" />
                <p className="text-xl font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-4">Start a conversation</p>
                <motion.div 
                  className="text-sm text-black dark:text-white italic max-w-md p-4 bg-[#F4E4F5] dark:bg-[#2d1b4e] rounded-lg border border-[#F3E8FF] dark:border-[#4C1D95]"
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

        {/* Chat Input Area */}
        <div className="p-4 border-t border-[#C4B5FD] dark:border-[#2d1b4e] bg-white dark:bg-[#16213e] flex items-center gap-3 m-4 rounded-lg shadow-md">
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
            className="px-4 py-2 bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white rounded-md whitespace-nowrap flex items-center gap-2 hover:shadow-lg transition-all font-semibold"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
