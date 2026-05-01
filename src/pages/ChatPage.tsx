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
    <div className="h-[calc(100vh-64px)] xs:h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] flex bg-white dark:bg-[#16213e]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden top-16 xs:top-14 sm:top-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div 
        className={`fixed lg:relative w-56 xs:w-60 sm:w-64 h-full lg:h-auto bg-[#FEF3FF] dark:bg-gradient-to-b dark:from-[#2d1b4e] dark:to-[#16213e] border-r border-[#F3E8FF] dark:border-[#2d1b4e] overflow-y-auto ${sidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 top-16 xs:top-14 sm:top-16 lg:top-0 lg:m-4 lg:ml-0 lg:rounded-lg`}
      >
        <div className="p-1.5 xs:p-2 sm:p-3 lg:p-4 border-b border-[#C4B5FD] dark:border-[#2d1b4e] flex items-center justify-between lg:block gap-2">
          <button
            onClick={() => {
              handleNewConversation();
              setSidebarOpen(false);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-2 xs:px-3 sm:px-3 lg:px-4 py-1.5 xs:py-2 sm:py-2 bg-[#6E2B8A] dark:bg-[#6E2B8A] text-white rounded-md hover:bg-[#5a2270] transition-all text-xs xs:text-sm sm:text-sm lg:text-base min-h-9 xs:min-h-10"
          >
            <PlusCircle size={16} className="xs:w-4 xs:h-4 flex-shrink-0" />
            <span>New</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 xs:p-2 text-[#6E2B8A] dark:text-[#6E2B8A] bg-[#f4e4f5] dark:bg-[#f4e4f5] rounded-md hover:bg-[#e8c8eb] dark:hover:bg-[#e8c8eb] min-h-9 xs:min-h-10 min-w-9 xs:min-w-10 flex items-center justify-center flex-shrink-0"
          >
            <X size={18} />
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
              className={`cursor-pointer text-xs xs:text-sm sm:text-base transition-all ${
                activeConversation?.id === convo.id
                  ? 'bg-gradient-to-r from-[#ba5ac3] to-[#e8c8eb] text-white'
                  : 'bg-[#E9D5FF] hover:bg-[#EDE9FE] text-black'
              }`}
            >
              <div className="flex items-center justify-between p-1.5 xs:p-2 sm:p-3 gap-2">
                <span className="truncate">{convo.title}</span>
                {/* FIXED: light theme background + dark purple icon, proper small size */}
                <button
                  onClick={(e) => handleDeleteConversation(convo.id, e)}
                  className="flex-shrink-0 p-1 rounded-md bg-[#f4e4f5] dark:bg-[#3a2860] text-[#6E2B8A] dark:text-[#d8a8e8] hover:bg-[#e8c8eb] dark:hover:bg-[#4a3070] transition-colors min-h-7 min-w-7 flex items-center justify-center"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={12} />
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
        <div className="flex items-center justify-between p-1.5 xs:p-2 sm:p-3 md:p-4 border-b bg-white dark:bg-[#16213e] lg:hidden gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 xs:p-2 text-[#6E2B8A] dark:text-[#a323af] bg-[#f4e4f5] dark:bg-[#f4e4f5] hover:bg-[#e8c8eb] dark:hover:bg-[#e8c8eb] rounded-lg min-h-9 xs:min-h-10 min-w-9 xs:min-w-10 flex items-center justify-center"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-xs xs:text-sm sm:text-base font-semibold text-[#6E2B8A] dark:text-white">Chat</h2>
          <div className="w-10 xs:w-11 sm:w-12"></div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-1.5 xs:p-2 sm:p-3 md:p-4 lg:p-6 space-y-3">
          {activeConversation && getDisplayMessages(activeConversation.messages).length > 0 ? (
            <>
              {getDisplayMessages(activeConversation.messages).map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full">
              <Brain size={24} className="xs:w-32 xs:h-32 sm:w-40 sm:h-40 mb-2 xs:mb-4 text-[#6E2B8A]" />
              <p className="text-sm xs:text-base sm:text-lg font-semibold text-[#6E2B8A] mb-2 xs:mb-3 sm:mb-4 text-center px-2">Start a conversation</p>
              <div className="italic text-xs sm:text-sm text-center px-3 text-gray-600 dark:text-gray-300 max-w-sm">{getRandomQuote().text}</div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-1.5 xs:p-2 sm:p-3 md:p-4 border-t bg-white dark:bg-[#16213e] m-1.5 xs:m-2 sm:m-3 md:m-4 rounded-lg shadow-md flex items-center gap-1.5 xs:gap-2 sm:gap-3">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          {/* FIXED: smaller padding, proper icon size, no oversized button */}
          <button
            onClick={async () => {
              if (!activeConversation) return;
              const cleared = await localChat.clearConversation(activeConversation.id);
              if (cleared) {
                setActiveConversation(cleared);
                setConversations(prev =>
                  prev.map(c => c.id === cleared.id ? cleared : c)
                );
              }
            }}
            className="p-1.5 xs:p-2 bg-[#f4e4f5] dark:bg-[#3a2860] text-[#6E2B8A] dark:text-[#d8a8e8] rounded-md hover:bg-[#e8c8eb] dark:hover:bg-[#4a3070] transition-all flex-shrink-0 min-h-9 xs:min-h-10 min-w-9 xs:min-w-10 flex items-center justify-center"
            title="Clear conversation"
          >
            <Trash2 size={14} />
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
              className="bg-white dark:bg-[#16213e] rounded-lg shadow-lg p-4 xs:p-5 sm:p-6 max-w-sm mx-3 xs:mx-4 border-2 border-[#6E2B8A] dark:border-[#a323af]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-base xs:text-lg font-semibold text-black dark:text-white mb-2">
                Delete Chat?
              </h3>
              <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this chat? This action cannot be undone.
              </p>
              <div className="flex gap-2 xs:gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-md bg-gray-200 dark:bg-[#2d1b4e] text-black dark:text-white hover:bg-gray-300 dark:hover:bg-[#3a2860] transition-colors font-medium text-xs xs:text-sm min-h-8 xs:min-h-9"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-md bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors font-medium text-xs xs:text-sm min-h-8 xs:min-h-9"
                >
                  Delete
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