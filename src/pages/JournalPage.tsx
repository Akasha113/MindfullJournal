import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JournalEntry } from '../types';
import JournalCard from '../components/journal/JournalCard';
import JournalForm from '../components/journal/JournalForm';
import Button from '../components/ui/Button';
import { Plus, Search, Filter } from 'lucide-react';

const STORAGE_KEY = 'journals';

const JournalPage: React.FC = () => {
  const [journals, setJournals] = React.useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingJournal, setEditingJournal] = React.useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setJournals(JSON.parse(saved));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
  }, [journals]);

  const handleCreateJournal = () => {
    setEditingJournal(null);
    setShowForm(true);
  };

  const handleEditJournal = (journal: JournalEntry) => {
    setEditingJournal(journal);
    setShowForm(true);
  };

  const handleDeleteJournal = (id: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      setJournals(journals.filter(journal => journal.id !== id));
    }
  };

  const handleSubmitJournal = (journalData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingJournal) {
      const updated = {
        ...editingJournal,
        ...journalData,
        updatedAt: Date.now(),
      };
      setJournals(journals.map(j => (j.id === updated.id ? updated : j)));
    } else {
      const newJournal: JournalEntry = {
        ...journalData,
        id: Date.now().toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
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
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#16213e] py-8 px-4 md:px-8">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-black dark:text-white">Loading journals...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">Error loading journals: {error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <JournalForm onSubmit={handleSubmitJournal} onCancel={handleCancelForm} initialValues={editingJournal || undefined} isEditing={!!editingJournal} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-black dark:text-white">Journal</h1>
                <Button onClick={handleCreateJournal} icon={<Plus size={18} className="text-white dark:text-white" />} className="bg-[#6E2B8A] hover:bg-[#5a2270] text-white dark:text-white">
                  New Entry
                </Button>
              </div>

              {/* Search and filter */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-black dark:text-white" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search journals..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 w-full p-2 border-2 border-[#6E2B8A] dark:border-[#6E2B8A] bg-white dark:bg-[#2d1b4e] text-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent"
                  />
                </div>

                {allTags.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Filter size={18} className="text-black dark:text-white flex-shrink-0" />

                    <button onClick={() => setActiveTag(null)} className={`px-2 py-1 rounded-full text-sm font-medium transition-colors ${!activeTag ? 'bg-[#6E2B8A] text-white' : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white'}`}>
                      All
                    </button>

                    {allTags.map(tag => (
                      <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`px-2 py-1 rounded-full text-sm font-medium transition-colors ${activeTag === tag ? 'bg-[#6E2B8A] text-white' : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white'}`}>
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Journal list */}
              {filteredJournals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-black dark:text-white mb-4">No journal entries found</p>
                  <Button variant="outline" onClick={handleCreateJournal} icon={<Plus size={18} className="text-black dark:text-white" />} className="border border-[#6E2B8A] text-black dark:text-white">
                    Create your first entry
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
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
