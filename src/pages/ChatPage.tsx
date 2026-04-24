import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import localChat from '../utils/localChat';
import { Conversation as ConversationType } from '../types';
import { PlusCircle, Trash2, Brain } from 'lucide-react';
import { getRandomQuote } from '../utils/quotes';
import { useAuth } from '../context/AuthContext';

const ChatPage: React.FC = () => {
  const { loading: authLoading, user } = useAuth();
  const [conversations, setConversations] = React.useState<ConversationType[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<ConversationType | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load conversations from localStorage on mount - ONLY after auth loads
  // reload when user changes or auth finishes
  React.useEffect(() => {
    if (authLoading || !activeConversation && !conversations) {
      // allow effect to run after login as well
    }
    if (authLoading || !user) return; // wait for auth and actual user
    
    const loadConversations = async () => {
      try {
        const allConversations = localChat.getAllConversations();
        
        if (allConversations.length === 0) {
          const newConversation = await localChat.createConversation();
          setConversations([newConversation]);
          setActiveConversation(newConversation);
        } else {
          setConversations(allConversations);
          setActiveConversation(allConversations[allConversations.length - 1]);
        }
      } catch (err) {
        console.error('Load failed', err);
      } finally {
        setPageLoading(false);
      }
    };
    
    loadConversations();
  }, [authLoading, user]);

  React.useEffect(() => {
    if (activeConversation?.messages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeConversation?.messages.length]);

  // Send message + get AI reply with proper state updates
  const handleSendMessage = async (message: string) => {
    if (!activeConversation) return;
    
    setIsLoading(true);

    try {
      // Send message and get updated conversation
      const updated = await localChat.sendMessage(activeConversation.id, message);
      
      if (updated) {
        // Update active conversation first for immediate UI feedback
        setActiveConversation(updated);
        
        // Update conversations list
        setConversations(prev =>
          prev.map(c => c.id === updated.id ? updated : c)
        );
        
        // Scroll to bottom after state updates
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    } catch (err: any) {
      console.error('Send failed', err);
      alert('Message failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // New chat
  const handleNewConversation = async () => {
    const newChat = await localChat.createConversation();
    setConversations(prev => [...prev, newChat]);
    setActiveConversation(newChat);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    await localChat.deleteConversation(id);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    setActiveConversation(updated[updated.length - 1] ?? null);
  };

  const getDisplayMessages = (messages: any[] | undefined) =>
    (messages || []).filter(m => m.role !== 'system');

  if (pageLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-white dark:bg-[#16213e]">
        <p className="text-black dark:text-white">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white dark:bg-[#16213e]">
      {/* Sidebar */}
      <div className="hidden md:block w-64 bg-[#FEF3FF] dark:bg-gradient-to-b dark:from-[#2d1b4e] dark:to-[#16213e] border-r border-[#F3E8FF] dark:border-[#2d1b4e] overflow-y-auto m-4 ml-0 rounded-lg">
        <div className="p-4 border-b border-[#C4B5FD] dark:border-[#2d1b4e]">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#6E2B8A] dark:bg-gradient-to-r dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white rounded-md hover:bg-[#5a2270] transition-all"
          >
            <PlusCircle size={16} />
            New Chat
          </button>
        </div>

        <AnimatePresence>
          {conversations.map(convo => (
            <motion.div key={convo.id}>
            <div
              onClick={() => setActiveConversation(convo)}
              className={`cursor-pointer ${
                activeConversation?.id === convo.id
                  ? 'bg-gradient-to-r from-[#ba5ac3] to-[#e8c8eb] text-white'
                  : 'bg-[#E9D5FF] hover:bg-[#EDE9FE] text-black'
              }`}
            >
              <div className="flex items-center justify-between p-3">
                <span>{convo.title}</span>
                <button onClick={(e) => handleDeleteConversation(convo.id, e)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {activeConversation && getDisplayMessages(activeConversation.messages).length > 0 ? (
            <>
              {getDisplayMessages(activeConversation.messages).map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full">
              <Brain size={48} className="mb-4 text-[#6E2B8A]" />
              <p className="text-xl font-semibold text-[#6E2B8A] mb-4">Start a conversation</p>
              <div className="italic">{getRandomQuote().text}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white flex items-center gap-3 m-4 rounded-lg shadow-md dark:bg-[#16213e]">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          <button
            onClick={() => {
              if (!activeConversation) return;
              const cleared = localChat.clearConversation(activeConversation.id);
              if (cleared) {
                setActiveConversation(cleared);
                setConversations(prev =>
                  prev.map(c => c.id === cleared.id ? cleared : c)
                );
              }
            }}
            className="px-4 py-2 bg-[#6E2B8A] text-white rounded-md hover:bg-[#5a2270] transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
