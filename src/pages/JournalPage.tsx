/**
 * 🔒 JOURNAL PAGE - ENCRYPTED CLOUD SYNC + LOCAL STORAGE
 * 
 * Privacy Guarantee:
 * ✅ Journal entries are stored in browser localStorage AND synced to backend
 * ✅ Data is encrypted before sending to backend
 * ✅ Admins CANNOT view or decrypt your journal entries
 * ✅ Data is user-specific and isolated (indexed by user ID)
 * ✅ Entries persist across sessions and devices
 * ✅ When you login from a new device, your journals sync automatically
 * 
 * How journals work:
 * 1. All entries stored locally with key: MindFul_Journal_journals_${userId}
 * 2. Each entry is encrypted with your password hash before backend sync
 * 3. Backend stores encrypted data but cannot decrypt it
 * 4. When you login from another device, encrypted data is fetched and decrypted
 * 5. Your data is always synced across all your devices
 * 
 * NOTE: Maximum privacy with cross-device sync.
 * See PRIVACY_MODEL.md for full privacy documentation.
 */

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

  const handleDeleteJournal = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      await storage.deleteJournalEntry(id);
      setJournals(journals.filter(journal => journal.id !== id));
    }
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
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#16213e] py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-8 responsive-container">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-black dark:text-white text-sm sm:text-base">Loading journals...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 text-sm sm:text-base">Error loading journals: {error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <JournalForm onSubmit={handleSubmitJournal} onCancel={handleCancelForm} initialValues={editingJournal || undefined} isEditing={!!editingJournal} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">Journal</h1>
                <Button onClick={handleCreateJournal} icon={<Plus size={16} className="sm:size-18 text-white" />} className="bg-[#6E2B8A] hover:bg-[#5a2270] text-white dark:text-white text-sm sm:text-base touch-button w-full sm:w-auto">
                  New Entry
                </Button>
              </div>

              {/* Search and filter */}
              <div className="mb-4 sm:mb-6 flex flex-col gap-2 sm:gap-4">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="sm:size-18 text-black dark:text-white" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search journals..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-10 w-full p-2 sm:p-3 border-2 border-[#6E2B8A] dark:border-[#6E2B8A] bg-white dark:bg-[#2d1b4e] text-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent text-sm sm:text-base touch-button"
                  />
                </div>

                {allTags.length > 0 && (
                  <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
                    <Filter size={16} className="sm:size-18 text-black dark:text-white flex-shrink-0" />

                    <button onClick={() => setActiveTag(null)} className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${!activeTag ? 'bg-[#6E2B8A] text-white' : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white'}`}>
                      All
                    </button>

                    {allTags.map(tag => (
                      <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTag === tag ? 'bg-[#6E2B8A] text-white' : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white'}`}>
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Journal list */}
              {filteredJournals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-black dark:text-white mb-4 text-sm sm:text-base">No journal entries found</p>
                  <Button variant="outline" onClick={handleCreateJournal} icon={<Plus size={16} className="sm:size-18 text-black dark:text-white" />} className="border border-[#6E2B8A] text-black dark:text-white text-sm sm:text-base">
                    Create your first entry
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
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
    </div>
  );
};

export default JournalPage;
