import React from 'react';
import { motion } from 'framer-motion';
import { JournalEntry } from '../../types';
import { format } from 'date-fns';
import { Edit, Trash } from 'lucide-react';
import Button from '../ui/Button';

interface JournalCardProps {
  journal: JournalEntry;
  onEdit: (journal: JournalEntry) => void;
  onDelete: (id: string) => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ journal, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const moodColors = {
    great: 'bg-[#6E2B8A] dark:bg-[#a323af] text-white',
    good: 'bg-[#8a0a9b] dark:bg-[#ba5ac3] text-white',
    neutral: 'bg-[#a323af] dark:bg-[#d191d7] text-white',
    bad: 'bg-[#d191d7] dark:bg-[#e8c8eb] text-black',
    awful: 'bg-[#e8c8eb] dark:bg-[#f4e4f5] text-black',
  };
  
  const moodEmojis = {
    great: '😁',
    good: '🙂',
    neutral: '😐',
    bad: '🙁',
    awful: '😞',
  };

  return (
    <motion.div
      className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden border-2 border-[#6E2B8A] dark:border-[#6E2B8A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{journal.title}</h3>
            <div className="text-xs text-black dark:text-white">
              {format(new Date(journal.createdAt), 'MMM d, yyyy - h:mm a')}
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs ${moodColors[journal.mood]}`}>
            {moodEmojis[journal.mood]} {journal.mood.charAt(0).toUpperCase() + journal.mood.slice(1)}
          </div>
        </div>
        
        <motion.div
          className="mt-3 text-black dark:text-white overflow-hidden"
          animate={{ height: isExpanded ? 'auto' : '80px' }}
        >
          <p className={isExpanded ? '' : 'line-clamp-3'}>
            {journal.content}
          </p>
        </motion.div>
        
        {journal.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-black dark:text-white hover:text-[#6E2B8A] dark:hover:text-[#a323af] focus:outline-none font-medium"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
        
        {journal.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {journal.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-[#E9D5FF] dark:bg-[#2d1b4e] text-black dark:text-white px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(journal.id)}
            icon={<Trash size={16} />}
          >
            Delete
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(journal)}
            icon={<Edit size={16} />}
          >
            Edit
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default JournalCard;