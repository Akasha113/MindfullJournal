
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JournalEntry } from '../types';
import JournalCard from '../components/journal/JournalCard';
import JournalForm from '../components/journal/JournalForm';
import Button from '../components/ui/Button';
import { Plus, Search, Filter } from 'lucide-react';
import storage from '../utils/storage';
import { fetchJournalsFromBackend } from '../utils/cloudSync';
import { useAuth } from '../context/AuthContext';

const JournalPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [journals, setJournals] = React.useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingJournal, setEditingJournal] = React.useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [deleteJournalId, setDeleteJournalId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading || !user) return; // Wait for auth and valid user
    
    const loadJournals = async () => {
      try {
        // Load journals from storage (user-specific)
        storage.initializeStorage(); // Ensure storage is initialized with correct user
        let entries = storage.getJournalEntries();
        
        // Fetch from backend and merge
        const backendResult = await fetchJournalsFromBackend();
        if (backendResult.success && backendResult.journals && backendResult.journals.length > 0) {
          // Merge backend journals into local storage
          let hasNewJournals = false;
          for (const journal of backendResult.journals) {
            const existingJournal = entries.find(e => e.id === journal.entryId);
            if (!existingJournal && journal.data) {
              // Add synced journal to list
              const syncedJournal: JournalEntry = {
                id: journal.entryId,
                title: journal.data.title || 'Untitled',
                content: journal.data.content || '',
                mood: journal.data.mood || 'neutral',
                tags: journal.data.tags || [],
                attachments: journal.data.attachments || [],
                createdAt: journal.data.createdAt || Date.now(),
                updatedAt: journal.data.updatedAt || Date.now(),
                flagged: journal.data.flagged || false,
                flagReason: journal.data.flagReason,
              };
              entries.push(syncedJournal);
              hasNewJournals = true;
            }
          }
          
          // If we added new journals, update storage
          if (hasNewJournals) {
            const profile = storage.getUserProfile();
            storage.updateUserProfile({ ...profile, journals: entries });
          }
        }
        
        setJournals(entries);
      } catch (err) {
        console.error('Failed to load journals:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadJournals();
  }, [authLoading, user]);

  React.useEffect(() => {
    // Update profile with journal entries (user-specific)
    if (!user || loading) return; // Don't save while loading or no user
    
    const profile = storage.getUserProfile();
    storage.updateUserProfile({ ...profile, journals });
  }, [journals, user, loading]);

  const handleCreateJournal = () => {
    setEditingJournal(null);
    setShowForm(true);
  };

  const handleEditJournal = (journal: JournalEntry) => {
    setEditingJournal(journal);
    setShowForm(true);
  };

  const handleDeleteJournal = (id: string) => {
    setDeleteJournalId(id);
  };

  const confirmDeleteJournal = async () => {
    if (!deleteJournalId) return;
    await storage.deleteJournalEntry(deleteJournalId);
    setJournals(journals.filter(journal => journal.id !== deleteJournalId));
    setDeleteJournalId(null);
  };

  const cancelDeleteJournal = () => {
    setDeleteJournalId(null);
  };

  const handleSubmitJournal = async (journalData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingJournal) {
      const updated = {
        ...editingJournal,
        ...journalData,
        updatedAt: Date.now(),
      };
      await storage.updateJournalEntry(updated.id, updated);
      setJournals(journals.map(j => (j.id === updated.id ? updated : j)));
    } else {
      const newJournal: JournalEntry = {
        ...journalData,
        id: Date.now().toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await storage.addJournalEntry(newJournal);
      setJournals([...journals, newJournal]);
    }
    setShowForm(false);
    setEditingJournal(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingJournal(null);
  };

  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    journals.forEach(journal => journal.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet);
  }, [journals]);

  const filteredJournals = React.useMemo(() => {
    return journals
      .filter(journal => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          !searchQuery ||
          journal.title.toLowerCase().includes(searchLower) ||
          journal.content.toLowerCase().includes(searchLower);
        const matchesTag = !activeTag || journal.tags.includes(activeTag);
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [journals, searchQuery, activeTag]);

  return (
    <div className="min-h-[calc(100vh-64px)] xs:min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] bg-white dark:bg-[#16213e] py-2 xs:py-3 sm:py-4 md:py-6 lg:py-8 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
      {loading ? (
        <div className="text-center py-8 xs:py-10 sm:py-12">
          <p className="text-black dark:text-white text-xs xs:text-sm sm:text-base">Loading journals...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 xs:py-10 sm:py-12">
          <p className="text-red-600 text-xs xs:text-sm sm:text-base">Error loading journals: {error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <JournalForm onSubmit={handleSubmitJournal} onCancel={handleCancelForm} initialValues={editingJournal || undefined} isEditing={!!editingJournal} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col xs:flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4 sm:mb-6">
                <h1 className="text-lg xs:text-xl sm:text-2xl font-semibold text-black dark:text-white">Journal</h1>
                <Button onClick={handleCreateJournal} icon={<Plus size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white" />} className="bg-[#6E2B8A] hover:bg-[#5a2270] text-white dark:text-white text-xs xs:text-sm sm:text-base w-full xs:w-full sm:w-auto py-1.5 xs:py-2 sm:py-2.5 min-h-9 xs:min-h-10 sm:min-h-11 px-2 xs:px-3 sm:px-4">
                  New Entry
                </Button>
              </div>

              {/* Search and filter */}
              <div className="mb-3 xs:mb-4 sm:mb-6 flex flex-col gap-2 xs:gap-3 sm:gap-4">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-2 xs:pl-3 sm:pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 xs:pl-9 sm:pl-10 w-full p-1.5 xs:p-2 sm:p-3 border-2 border-[#6E2B8A] dark:border-[#6E2B8A] bg-white dark:bg-[#2d1b4e] text-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent text-xs xs:text-sm sm:text-base min-h-8 xs:min-h-9 sm:min-h-10"
                  />
                </div>

                {allTags.length > 0 && (
                  <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 xs:pb-2 -mx-2 xs:mx-0 px-2 xs:px-0">
                    <Filter size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-black dark:text-white flex-shrink-0" />

                    <button onClick={() => setActiveTag(null)} className={`px-2 xs:px-2.5 sm:px-3 py-0.5 xs:py-1 sm:py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-7 xs:min-h-8 sm:min-h-9 ${!activeTag ? 'bg-[#6E2B8A] text-white' : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white'}`}>
                      All
                    </button>

                    {allTags.map(tag => (
                      <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`px-2 xs:px-2.5 sm:px-3 py-0.5 xs:py-1 sm:py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-7 xs:min-h-8 sm:min-h-9 ${activeTag === tag ? 'bg-[#6E2B8A] text-white' : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white'}`}>
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Journal list */}
              {filteredJournals.length === 0 ? (
                <div className="text-center py-8 xs:py-10 sm:py-12">
                  <p className="text-black dark:text-white mb-3 xs:mb-4 sm:mb-4 text-xs xs:text-sm sm:text-base">No journal entries found</p>
                  <Button variant="outline" onClick={handleCreateJournal} icon={<Plus size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-black dark:text-white" />} className="border border-[#6E2B8A] text-black dark:text-white text-xs xs:text-sm sm:text-base py-1.5 xs:py-2 sm:py-2.5 min-h-9 xs:min-h-10 sm:min-h-11 px-2 xs:px-3 sm:px-4">
                    Create Entry
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                  <AnimatePresence>
                    {filteredJournals.map(journal => (
                      <JournalCard key={journal.id} journal={journal} onEdit={handleEditJournal} onDelete={handleDeleteJournal} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {deleteJournalId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#16213e] border border-[#d8a4e8] dark:border-[#4a3570] p-6 shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <h2 className="text-lg font-bold text-black dark:text-white mb-3">Confirm Delete</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete this journal entry? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDeleteJournal}
                  className="px-4 py-2 rounded-lg bg-[#f4f4f5] dark:bg-[#2d1b4e] text-black dark:text-white border border-[#d8a4e8] dark:border-[#4a3570] hover:bg-[#e8e8e8] dark:hover:bg-[#3a2860] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteJournal}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6E2B8A] to-[#a323af] text-white hover:from-[#5a2270] hover:to-[#892c7e] transition-colors"
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

export default JournalPage;
