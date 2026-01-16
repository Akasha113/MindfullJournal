import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import storage from '../utils/storage';
import chatService from '../utils/chat';
import { ChatMessage as ChatMessageType, Conversation } from '../types';
import { MessageCircle, Clock, PlusCircle, Trash2, Brain } from 'lucide-react';

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
      <div className="hidden md:block w-64 bg-[#FEF3FF] border-r border-[#F3E8FF] overflow-y-auto">

        {/* 🔒 New Chat — DARK PURPLE */}
        <div className="p-4 border-b border-[#C4B5FD]">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#6E2B8A] text-white rounded-md hover:bg-[#5A2270]"
          >
            <PlusCircle size={16} />
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
                className={`border-b border-[#C4B5FD] cursor-pointer ${
                  activeConversation?.id === convo.id
                    ? 'bg-[#D8B4FE]'
                    : 'bg-[#E9D5FF] hover:bg-[#EDE9FE]'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-1 p-3">
                    <div className="flex items-center gap-2 text-[#4C1D95]">
                      <MessageCircle size={16} />
                      <span className="truncate font-medium">{convo.title}</span>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-xs text-[#6D28D9]">
                      <Clock size={12} />
                      <span>{new Date(convo.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* 🟣 DELETE BUTTON — EXTRA LIGHT */}
                  <button
                    onClick={(e) => handleDeleteConversation(convo.id, e)}
                    className="p-2 m-1 rounded text-black hover:bg-[#F3E8FF]"
                    title="Delete conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MAIN CHAT — UNCHANGED */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {activeConversation && (
            <>
              {getDisplayMessages(activeConversation.messages).map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-4 border-t flex items-center gap-4">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          <button className="px-4 py-2 bg-[#6E2B8A] text-white rounded-md whitespace-nowrap flex items-center gap-2 hover:bg-[#5A2270] transition-colors">
            <Trash2 size={14} className="text-black" />
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
