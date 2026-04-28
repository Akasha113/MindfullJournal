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
  great: 'bg-[#E9D5FF]',
  good: 'bg-[#E9D5FF]',
  neutral: 'bg-[#E9D5FF]',
  bad: 'bg-[#E9D5FF]',
  awful: 'bg-[#E9D5FF]',
};
const moodEmojis = {
    great: '😁',
    good: '🙂',
    neutral: '😐',
    bad: '🙁',
    awful: '😞',
  };

  const bannerImage = journal.attachments?.find(att => att.fileType === 'image');

  return (
    <motion.div
      className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden border-2 border-[#6E2B8A] dark:border-[#6E2B8A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {bannerImage && (
        <img
          src={bannerImage.dataUrl}
          alt={bannerImage.fileName}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white mb-1 break-words">{journal.title}</h3>
            <div className="text-xs sm:text-sm text-black dark:text-white">
              {format(new Date(journal.createdAt), 'MMM d, yyyy - h:mm a')}
            </div>
          </div>

          <div
            style={{ color: '#3b0764' }}
            className={`px-2 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 font-semibold ${moodColors[journal.mood]}`}
          >
            <span className="hidden sm:inline">{moodEmojis[journal.mood]} {journal.mood.charAt(0).toUpperCase() + journal.mood.slice(1)}</span>
            <span className="sm:hidden">{moodEmojis[journal.mood]}</span>
          </div>
        </div>

        <motion.div
          className="mt-3 text-xs sm:text-sm text-black dark:text-white overflow-hidden"
          animate={{ height: isExpanded ? 'auto' : '80px' }}
        >
          <p className={isExpanded ? '' : 'line-clamp-3'}>{journal.content}</p>
        </motion.div>

        {journal.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs sm:text-sm text-black dark:text-white hover:text-[#6E2B8A] dark:hover:text-[#a323af] focus:outline-none font-medium"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {journal.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {journal.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-[#E9D5FF] dark:bg-[#2d1b4e] text-gray-700 dark:text-white px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {journal.attachments && journal.attachments.length > 0 && (
          <div className="mt-3 grid responsive-grid-2 gap-2">
            {journal.attachments
              .filter(att => !bannerImage || att.id !== bannerImage.id)
              .map(att => (
                <div key={att.id} className="border rounded p-2 bg-[#f9f9f9] dark:bg-[#1f1f2e]">
                {att.fileType === 'image' && (
                  <img src={att.dataUrl} alt={att.fileName} className="max-h-24 mx-auto" />
                )}
                {att.fileType === 'video' && (
                  <video src={att.dataUrl} controls className="max-h-24 w-full" />
                )}
                {att.fileType === 'audio' && (
                  <audio src={att.dataUrl} controls className="w-full" />
                )}
                {(att.fileType !== 'image' && att.fileType !== 'video' && att.fileType !== 'audio') && (
                  <a href={att.dataUrl} download={att.fileName} className="text-xs text-[#6E2B8A] dark:text-[#a323af] underline">
                    {att.fileName}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-4 flex flex-row justify-end gap-2">
          <Button
            size="sm"
            onClick={() => onEdit(journal)}
            icon={<Edit size={14} className="text-white group-hover:text-[#6E2B8A] dark:text-white dark:group-hover:text-[#a323af] transition-colors" />}
            className="bg-[#6E2B8A] dark:bg-[#a323af] text-white dark:text-white hover:bg-gradient-to-r hover:from-white hover:to-[#e8c8eb] dark:hover:bg-gradient-to-r dark:hover:from-[#3d2860] dark:hover:to-[#2d1b4e] hover:text-[#6E2B8A] dark:hover:text-[#a323af] border-2 border-[#6E2B8A] dark:border-[#a323af] transition-all duration-300 group text-xs px-2 sm:px-3 touch-button"
          >
            Edit
          </Button>

          <Button
            size="sm"
            onClick={() => onDelete(journal.id)}
            icon={<Trash size={14} className="text-white group-hover:text-white transition-colors" />}
            className="bg-[#6E2B8A] dark:bg-[#a323af] text-white dark:text-white hover:bg-gradient-to-r hover:from-white hover:to-[#e8c8eb] dark:hover:bg-gradient-to-r dark:hover:from-[#3d2860] dark:hover:to-[#2d1b4e] hover:text-[#6E2B8A] dark:hover:text-[#a323af] border-2 border-[#6E2B8A] dark:border-[#a323af] transition-all duration-300 group text-xs px-2 sm:px-3 touch-button"
          >
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default JournalCard;