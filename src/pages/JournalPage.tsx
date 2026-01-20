import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JournalEntry } from '../types';
import { journalAPI } from '../utils/api';
import JournalCard from '../components/journal/JournalCard';
import JournalForm from '../components/journal/JournalForm';
import Button from '../components/ui/Button';
import { Plus, Search, Filter, Loader } from 'lucide-react';

const JournalPage: React.FC = () => {
  const [journals, setJournals] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingJournal, setEditingJournal] = React.useState<any | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  // Load journals from API
  React.useEffect(() => {
    const loadJournals = async () => {
      try {
        setLoading(true);
        const data = await journalAPI.getAll(1, 100);
        setJournals(data.journals || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to load journals:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadJournals();
  }, []);
  
  const handleCreateJournal = () => {
    setEditingJournal(null);
    setShowForm(true);
  };
  
  const handleEditJournal = (journal: any) => {
    setEditingJournal(journal);
    setShowForm(true);
  };
  
  const handleDeleteJournal = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await journalAPI.delete(id);
        setJournals(journals.filter(journal => journal._id !== id));
      } catch (err: any) {
        alert('Failed to delete journal: ' + err.message);
      }
    }
  };
  
  const handleSubmitJournal = async (journalData: any) => {
    try {
      if (editingJournal) {
        await journalAPI.update(editingJournal._id, journalData);
        setJournals(journals.map(journal => 
          journal._id === editingJournal._id ? { ...journal, ...journalData } : journal
        ));
      } else {
        const newJournal = await journalAPI.create(journalData);
        setJournals([...journals, newJournal]);
      }
      
      setShowForm(false);
      setEditingJournal(null);
    } catch (err: any) {
      alert('Failed to save journal: ' + err.message);
    }
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingJournal(null);
  };
  
  // Get all unique tags
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    journals.forEach(journal => {
      (journal.tags || []).forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  }, [journals]);
  
  // Filter journals based on search and tags
  const filteredJournals = React.useMemo(() => {
    return journals
      .filter(journal => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
          journal.title.toLowerCase().includes(searchLower) ||
          journal.content.toLowerCase().includes(searchLower);
        const matchesTag = !activeTag || (journal.tags || []).includes(activeTag);
        return matchesSearch && matchesTag;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [journals, searchQuery, activeTag]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#16213e] py-8 px-4 md:px-8 flex items-center justify-center">
        <Loader className="animate-spin" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#16213e] py-8 px-4 md:px-8 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#16213e] py-8 px-4 md:px-8">
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <JournalForm
              onSubmit={handleSubmitJournal}
              onCancel={handleCancelForm}
              initialValues={editingJournal || undefined}
              isEditing={!!editingJournal}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-black dark:text-white">Journal</h1>
              <Button
                onClick={handleCreateJournal}
                icon={<Plus size={18} className="text-white dark:text-white" />}
                className="bg-[#6E2B8A] hover:bg-[#5a2270] text-white dark:text-white"
              >
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full p-2 border-2 border-[#6E2B8A] dark:border-[#6E2B8A] bg-white dark:bg-[#2d1b4e] text-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:border-transparent"
                />
              </div>
              
              {allTags.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <Filter size={18} className="text-black dark:text-white flex-shrink-0" />
                  
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`px-2 py-1 rounded-full text-sm font-medium transition-colors
                      ${!activeTag
                        ? 'bg-[#6E2B8A] text-white'
                        : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white hover:bg-[#E8D5F2] dark:hover:bg-[#3a2860]'
                      }
                    `}
                  >
                    All
                  </button>
                  
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`px-2 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1
                        ${activeTag === tag
                          ? 'bg-[#6E2B8A] text-white'
                          : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white hover:bg-[#E8D5F2] dark:hover:bg-[#3a2860]'
                        }
                      `}
                    >
                      <Filter size={14} className={`${activeTag === tag ? 'text-white' : 'text-black dark:text-white'}`} />
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
                <Button
                  variant="outline"
                  onClick={handleCreateJournal}
                  icon={<Plus size={18} className="text-black dark:text-white" />}
                  className="border border-[#6E2B8A] dark:border-[#6E2B8A] text-black dark:text-white hover:bg-[#E8D5F2] dark:hover:bg-[#3a2860]"
                >
                  Create your first entry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {filteredJournals.map(journal => (
                    <JournalCard
                      key={journal.id}
                      journal={journal}
                      onEdit={handleEditJournal}
                      onDelete={handleDeleteJournal}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JournalPage;
