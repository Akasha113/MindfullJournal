import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import localChat from '../utils/localChat';
import { fetchChatsFromBackend } from '../utils/cloudSync';
import { Conversation as ConversationType } from '../types';
import { PlusCircle, Trash2, Brain, X, Menu } from 'lucide-react';
import { getRandomQuote } from '../utils/quotes';
import { useAuth } from '../context/AuthContext';

const ChatPage: React.FC = () => {
  const { loading: authLoading, user } = useAuth();
  const [conversations, setConversations] = React.useState<ConversationType[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<ConversationType | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
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
        // First load local conversations
        let allConversations = localChat.getAllConversations();
        
        // Then fetch from backend and merge
        const backendResult = await fetchChatsFromBackend();
        if (backendResult.success && backendResult.chats && backendResult.chats.length > 0) {
          // Merge backend chats into local storage
          for (const chat of backendResult.chats) {
            const existingChat = allConversations.find(c => c.id === chat.conversationId);
            if (!existingChat && chat.data) {
              // Create proper conversation object from backend data
              const conversationToSave = {
                id: chat.conversationId,
                title: chat.data.title || `Chat - ${new Date().toLocaleDateString()}`,
                messages: chat.data.messages || [],
                createdAt: chat.data.createdAt || Date.now(),
                updatedAt: chat.data.updatedAt || Date.now(),
                hasFlaggedContent: chat.data.hasFlaggedContent,
              };
              // Save synced conversation to local storage
              await localChat.saveSyncedConversation(conversationToSave);
            }
          }
          // Reload local conversations after adding backend ones
          allConversations = localChat.getAllConversations();
        }
        
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
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await localChat.deleteConversation(deleteConfirmId);
      const updated = conversations.filter(c => c.id !== deleteConfirmId);
      setConversations(updated);
      setActiveConversation(updated[updated.length - 1] ?? null);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
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
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden top-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div 
        className={`fixed md:relative w-64 h-full md:h-auto bg-[#FEF3FF] dark:bg-gradient-to-b dark:from-[#2d1b4e] dark:to-[#16213e] border-r border-[#F3E8FF] dark:border-[#2d1b4e] overflow-y-auto ${sidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full md:translate-x-0'} transition-transform duration-300 top-16 md:top-0 md:m-4 md:ml-0 md:rounded-lg`}
      >
        <div className="p-2 sm:p-3 md:p-4 border-b border-[#C4B5FD] dark:border-[#2d1b4e] flex items-center justify-between md:block">
          <button
            onClick={() => {
              handleNewConversation();
              setSidebarOpen(false);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-[#6E2B8A] dark:bg-[#6E2B8A] text-white rounded-md hover:bg-[#5a2270] transition-all text-sm sm:text-base"
          >
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-2 p-2 text-[#6E2B8A] dark:text-[#6E2B8A] bg-[#f4e4f5] dark:bg-[#f4e4f5] rounded-md hover:bg-[#e8c8eb] dark:hover:bg-[#e8c8eb]"
          >
            <X size={20} />
          </button>
        </div>

        <AnimatePresence>
          {conversations.map(convo => (
            <motion.div key={convo.id}>
            <div
              onClick={() => {
                setActiveConversation(convo);
                setSidebarOpen(false);
              }}
              className={`cursor-pointer text-sm sm:text-base ${
                activeConversation?.id === convo.id
                  ? 'bg-gradient-to-r from-[#ba5ac3] to-[#e8c8eb] text-white'
                  : 'bg-[#E9D5FF] hover:bg-[#EDE9FE] text-black'
              }`}
            >
              <div className="flex items-center justify-between p-2 sm:p-3">
                <span className="truncate text-xs sm:text-sm">{convo.title}</span>
                {/* FIXED: light theme background + dark purple icon, proper small size */}
                <button
                  onClick={(e) => handleDeleteConversation(convo.id, e)}
                  className="flex-shrink-0 ml-2 p-1 rounded-md bg-[#f4e4f5] dark:bg-[#3a2860] text-[#6E2B8A] dark:text-[#d8a8e8] hover:bg-[#e8c8eb] dark:hover:bg-[#4a3070] transition-colors"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b bg-white dark:bg-[#16213e] md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-[#6E2B8A] dark:text-[#a323af] bg-[#f4e4f5] dark:bg-[#f4e4f5] hover:bg-[#e8c8eb] dark:hover:bg-[#e8c8eb] rounded-lg"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-sm sm:text-base font-semibold text-[#6E2B8A] dark:text-white">Chat</h2>
          <div className="w-10"></div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-6">
          {activeConversation && getDisplayMessages(activeConversation.messages).length > 0 ? (
            <>
              {getDisplayMessages(activeConversation.messages).map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full">
              <Brain size={32} className="sm:size-48 mb-2 sm:mb-4 text-[#6E2B8A]" />
              <p className="text-base sm:text-xl font-semibold text-[#6E2B8A] mb-2 sm:mb-4 text-center px-2">Start a conversation</p>
              <div className="italic text-xs sm:text-base text-center px-4 text-gray-600 dark:text-gray-300">{getRandomQuote().text}</div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-2 sm:p-3 md:p-4 border-t bg-white dark:bg-[#16213e] m-2 sm:m-3 md:m-4 rounded-lg shadow-md flex items-center gap-2 sm:gap-3">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          {/* FIXED: smaller padding, proper icon size, no oversized button */}
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
            className="p-1.5 bg-[#f4e4f5] dark:bg-[#3a2860] text-[#6E2B8A] dark:text-[#d8a8e8] rounded-md hover:bg-[#e8c8eb] dark:hover:bg-[#4a3070] transition-all flex-shrink-0"
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-[#16213e] rounded-lg shadow-lg p-6 max-w-sm mx-4 border-2 border-[#6E2B8A] dark:border-[#a323af]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Delete Chat?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this chat? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 rounded-md bg-gray-200 dark:bg-[#2d1b4e] text-black dark:text-white hover:bg-gray-300 dark:hover:bg-[#3a2860] transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors font-medium text-sm"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;