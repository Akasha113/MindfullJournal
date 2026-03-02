import React from 'react';
import { motion } from 'framer-motion';
import { JournalEntry, Mood, Attachment } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import MoodSelector from '../mood/MoodSelector';
import { X, Plus } from 'lucide-react';

interface JournalFormProps {
  onSubmit: (journal: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialValues?: Partial<JournalEntry>;
  isEditing?: boolean;
}

const JournalForm: React.FC<JournalFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  isEditing = false,
}) => {
  const [title, setTitle] = React.useState(initialValues?.title || '');
  const [content, setContent] = React.useState(initialValues?.content || '');
  const [mood, setMood] = React.useState<Mood>(initialValues?.mood || 'neutral');
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState<string[]>(initialValues?.tags || []);
  const [attachments, setAttachments] = React.useState<Attachment[]>(
    initialValues?.attachments || []
  );
  
  const handleTagAdd = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };
  
  // helper to convert a File to a data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        const typeMain = file.type.split('/')[0];
        newAttachments.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          fileName: file.name,
          fileType: typeMain,
          dataUrl,
        });
      } catch (err) {
        console.error('Error reading file', file.name, err);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    // clear input so same file can be selected again if removed
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      mood,
      tags,
      attachments,
    });
  };

  return (
    <motion.div
      className="bg-white dark:bg-[#16213e] rounded-lg shadow-lg border-2 border-[#6E2B8A] p-6 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-semibold text-[#6E2B8A] mb-4">
          {isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
        </h2>
        
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your entry a title"
          required
        />
        
        <TextArea
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts here..."
          rows={6}
          required
          className="mb-4"
        />
        
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-[#6E2B8A] dark:text-[#a323af]">
            How are you feeling?
          </label>
          <MoodSelector selectedMood={mood} onSelectMood={setMood} />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-[#6E2B8A] dark:text-[#a323af]">
            Tags
          </label>
          
          <div className="flex items-center">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add tags (press Enter)"
              className="flex-1"
            />
            <Button
              type="button"
              className="ml-2"
              onClick={handleTagAdd}
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map(tag => (
                <div
                  key={tag}
                  className="bg-[#f4e4f5] dark:bg-[#2d1b4e] text-[#6E2B8A] dark:text-[#a323af] px-2 py-1 rounded-full flex items-center text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={() => handleTagRemove(tag)}
                  >
                    <X size={14} className="text-[#6E2B8A] dark:text-[#a323af] hover:text-[#5a2270] dark:hover:text-[#ba5ac3]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* attachments section */}
        <div className="mb-4 border border-[#6E2B8A] dark:border-[#a323af] rounded-lg p-3">
          <label className="block mb-2 text-sm font-medium text-[#6E2B8A] dark:text-[#a323af]">
            Attachments
          </label>
          <label className="inline-flex items-center cursor-pointer text-[#6E2B8A] dark:text-[#a323af] hover:text-[#5a2270]">
            <Plus size={20} />
            <span className="ml-2 text-sm">Add files</span>
            <input
              type="file"
              multiple
              accept="*/*"
              onChange={handleFilesChange}
              className="hidden"
            />
          </label>

          {attachments.length > 0 && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attachments.map(att => (
                <div
                  key={att.id}
                  className="relative border rounded p-2 bg-[#f9f9f9] dark:bg-[#1f1f2e]"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                  {att.fileType === 'image' && (
                    <img
                      src={att.dataUrl}
                      alt={att.fileName}
                      className="max-h-24 mx-auto"
                    />
                  )}
                  {att.fileType === 'video' && (
                    <video src={att.dataUrl} controls className="max-h-24 w-full" />
                  )}
                  {att.fileType === 'audio' && (
                    <audio src={att.dataUrl} controls className="w-full" />
                  )}
                  {att.fileType !== 'image' && att.fileType !== 'video' && att.fileType !== 'audio' && (
                    <a
                      href={att.dataUrl}
                      download={att.fileName}
                      className="text-xs text-[#6E2B8A] dark:text-[#a323af] underline"
                    >
                      {att.fileName}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
          >
            {isEditing ? 'Update' : 'Save'} Journal
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default JournalForm;