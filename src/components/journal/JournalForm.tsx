import React from 'react';
import { motion } from 'framer-motion';
import { JournalEntry, Mood, Attachment } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import MoodSelector from '../mood/MoodSelector';
import { X, Plus, FileText } from 'lucide-react';

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
  const [title, setTitle]           = React.useState(initialValues?.title || '');
  const [content, setContent]       = React.useState(initialValues?.content || '');
  const [mood, setMood]             = React.useState<Mood>(initialValues?.mood || 'neutral');
  const [tagInput, setTagInput]     = React.useState('');
  const [tags, setTags]             = React.useState<string[]>(initialValues?.tags || []);
  const [attachments, setAttachments] = React.useState<Attachment[]>(
    initialValues?.attachments || []
  );

  // ── tag helpers ────────────────────────────────────────────────────────────
  const handleTagAdd = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) =>
    setTags(tags.filter(t => t !== tagToRemove));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleTagAdd(); }
  };

  // ── file helpers ───────────────────────────────────────────────────────────
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl  = await fileToDataUrl(file);
        const fileType = file.type.split('/')[0];
        newAttachments.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          fileName: file.name,
          fileType,
          dataUrl,
        });
      } catch (err) {
        console.error('Error reading file', file.name, err);
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) =>
    setAttachments(prev => prev.filter(a => a.id !== id));

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title: title.trim(), content: content.trim(), mood, tags, attachments });
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    /*
     * Full-viewport centering wrapper.
     * On phones  : no side padding — form fills the screen edge-to-edge.
     * On tablets+: horizontal padding kicks in; form is centred with max-w.
     */
    <div className="
      min-h-screen w-full
      flex items-start justify-center
      px-0 sm:px-4 md:px-6 lg:px-8
      py-4 sm:py-6 md:py-10
      bg-gray-50 dark:bg-[#0d0d1a]
    ">
      <motion.div
        className="
          w-full
          /* no rounding / shadow on xs so it feels native */
          rounded-none sm:rounded-xl
          shadow-none sm:shadow-xl
          /* border only from sm upward */
          border-0 sm:border-2 sm:border-[#6E2B8A]
          bg-white dark:bg-[#16213e]
          /* generous padding that grows with viewport */
          p-4 sm:p-6 md:p-8 lg:p-10
          /* cap width on large screens */
          max-w-none sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl
          mx-auto
        "
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <h2 className="
            font-bold text-[#6E2B8A] dark:text-[#c060e0]
            mb-4 sm:mb-5 md:mb-6
            text-xl sm:text-2xl md:text-3xl
          ">
            {isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h2>

          {/* ── Title input ─────────────────────────────────────────────── */}
          <div className="mb-3 sm:mb-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title"
              required
            />
          </div>

          {/* ── Content textarea ────────────────────────────────────────── */}
          <TextArea
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts here..."
            /* fewer rows on phones to keep the keyboard from burying the form */
            rows={typeof window !== 'undefined' && window.innerWidth < 480 ? 4 : 6}
            required
            className="mb-3 sm:mb-4"
          />

          {/* ── Mood selector ───────────────────────────────────────────── */}
          <div className="mb-4 sm:mb-5">
            <label className="
              block mb-1.5 sm:mb-2
              text-xs sm:text-sm font-semibold
              text-[#6E2B8A] dark:text-[#a323af]
            ">
              How are you feeling?
            </label>
            {/* size='sm' on phones keeps buttons from overflowing */}
            <div className="sm:hidden">
              <MoodSelector selectedMood={mood} onSelectMood={setMood} size="sm" />
            </div>
            <div className="hidden sm:block md:hidden">
              <MoodSelector selectedMood={mood} onSelectMood={setMood} size="md" />
            </div>
            <div className="hidden md:block">
              <MoodSelector selectedMood={mood} onSelectMood={setMood} size="lg" />
            </div>
          </div>

          {/* ── Tags ────────────────────────────────────────────────────── */}
          <div className="mb-4 sm:mb-5">
            <label className="
              block mb-1.5 sm:mb-2
              text-xs sm:text-sm font-semibold
              text-[#6E2B8A] dark:text-[#a323af]
            ">
              Tags
            </label>

            {/* input row — stacks on ultra-narrow, side-by-side otherwise */}
            <div className="flex items-center gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag, press Enter"
                className="flex-1 min-w-0"
              />
              <Button
                type="button"
                onClick={handleTagAdd}
                disabled={!tagInput.trim()}
                className="shrink-0 text-xs sm:text-sm px-3 sm:px-4"
              >
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="
                      inline-flex items-center gap-1
                      bg-[#f4e4f5] dark:bg-[#2d1b4e]
                      text-[#6E2B8A] dark:text-[#a323af]
                      px-2 sm:px-3 py-0.5 sm:py-1
                      rounded-full
                      text-[11px] sm:text-xs md:text-sm
                      font-medium
                    "
                  >
                    #{tag}
                    <button
                      type="button"
                      aria-label={`Remove tag ${tag}`}
                      onClick={() => handleTagRemove(tag)}
                      className="
                        ml-0.5 rounded-full p-0.5
                        text-[#6E2B8A] dark:text-[#a323af]
                        hover:bg-[#6E2B8A] hover:text-white
                        transition-colors
                      "
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Attachments ─────────────────────────────────────────────── */}
          <div className="
            mb-4 sm:mb-5
            border border-[#6E2B8A] dark:border-[#a323af]
            rounded-lg
            p-3 sm:p-4
          ">
            <label className="
              block mb-2
              text-xs sm:text-sm font-semibold
              text-[#6E2B8A] dark:text-[#a323af]
            ">
              Attachments
            </label>

            {/* file picker trigger */}
            <label className="
              inline-flex items-center gap-1.5 sm:gap-2
              cursor-pointer
              text-[#6E2B8A] dark:text-[#a323af]
              hover:text-[#5a2270] dark:hover:text-[#c060e0]
              transition-colors
              text-xs sm:text-sm font-medium
            ">
              <Plus size={16} className="sm:w-5 sm:h-5" />
              <span>Add files</span>
              <input
                type="file"
                multiple
                accept="*/*"
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>

            {attachments.length > 0 && (
              /*
               * 1 col on phones
               * 2 cols on sm+
               * 3 cols on lg+ (when the form is wider)
               */
              <div className="
                mt-3
                grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                gap-2 sm:gap-3
              ">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className="
                      relative
                      border border-gray-200 dark:border-[#3a2060]
                      rounded-lg p-2 sm:p-3
                      bg-[#faf7ff] dark:bg-[#1f1f2e]
                      overflow-hidden
                    "
                  >
                    {/* remove button */}
                    <button
                      type="button"
                      aria-label="Remove attachment"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="
                        absolute top-1.5 right-1.5
                        rounded-full p-0.5
                        bg-white dark:bg-[#16213e]
                        text-red-400 hover:text-red-600
                        shadow
                        transition-colors z-10
                      "
                    >
                      <X size={13} />
                    </button>

                    {att.fileType === 'image' && (
                      <img
                        src={att.dataUrl}
                        alt={att.fileName}
                        className="
                          w-full object-cover rounded
                          max-h-20 sm:max-h-28 md:max-h-36
                        "
                      />
                    )}
                    {att.fileType === 'video' && (
                      <video
                        src={att.dataUrl}
                        controls
                        className="w-full max-h-28 rounded"
                      />
                    )}
                    {att.fileType === 'audio' && (
                      <audio src={att.dataUrl} controls className="w-full mt-4" />
                    )}
                    {!['image', 'video', 'audio'].includes(att.fileType) && (
                      <a
                        href={att.dataUrl}
                        download={att.fileName}
                        className="
                          flex items-center gap-1.5 mt-1
                          text-[10px] sm:text-xs
                          text-[#6E2B8A] dark:text-[#a323af]
                          underline underline-offset-2
                          break-all
                        "
                      >
                        <FileText size={12} className="shrink-0" />
                        {att.fileName}
                      </a>
                    )}

                    {/* file name caption below media */}
                    {['image', 'video', 'audio'].includes(att.fileType) && (
                      <p className="
                        mt-1 text-[9px] sm:text-[10px]
                        text-gray-400 dark:text-gray-500
                        truncate
                      ">
                        {att.fileName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Action buttons ──────────────────────────────────────────── */}
          <div className="
            flex justify-end gap-2 sm:gap-3
            mt-5 sm:mt-6
            /* on ultra-narrow phones, stack buttons full-width */
            flex-col-reverse xs:flex-row
          ">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full xs:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full xs:w-auto text-sm sm:text-base"
            >
              {isEditing ? 'Update' : 'Save'} Journal
            </Button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};

export default JournalForm;