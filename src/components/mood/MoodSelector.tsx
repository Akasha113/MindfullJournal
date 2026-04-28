import React from 'react';
import { motion } from 'framer-motion';
import { Mood } from '../../types';

interface MoodSelectorProps {
  selectedMood: Mood;
  onSelectMood: (mood: Mood) => void;
  size?: 'sm' | 'md' | 'lg';
}

const moods: { value: Mood; emoji: string; label: string }[] = [
  { value: 'awful', emoji: '😞', label: 'Awful' },
  { value: 'bad', emoji: '🙁', label: 'Bad' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'great', emoji: '😁', label: 'Great' },
];

const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onSelectMood,
  size = 'md',
}) => {
  const circleSize = {
    sm: 'w-12 h-12 sm:w-13 sm:h-13',
    md: 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18',
  };

  const emojiSize = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl md:text-3xl',
    lg: 'text-2xl sm:text-3xl md:text-3xl',
  };

  const labelSize = {
    sm: 'text-[9px]',
    md: 'text-[9px] sm:text-[10px] md:text-xs',
    lg: 'text-[9px] sm:text-[10px] md:text-xs',
  };

  return (
    <div className="flex justify-center items-center w-full gap-12 sm:gap-12 md:gap-13">
      {moods.map((mood) => (
        <motion.button
          key={mood.value}
          type="button"
          onClick={() => onSelectMood(mood.value)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className={`
            ${circleSize[size]}
            flex flex-col items-center justify-center flex-shrink-0
            rounded-full transition-all duration-200
            ${selectedMood === mood.value
              ? 'bg-gradient-to-br from-[#6E2B8A] to-[#a323af] ring-2 ring-[#6E2B8A] ring-offset-2 shadow-md'
              : 'bg-[#E9D5FF] dark:bg-[#2d1b4e] hover:bg-gradient-to-br hover:from-[#6E2B8A] hover:to-[#a323af]'
            }
          `}
        >
          <span className={`leading-none select-none ${emojiSize[size]}`}>
            {mood.emoji}
          </span>
          {size !== 'sm' && (
            <span className={`
              mt-0.5 font-medium leading-tight
              ${labelSize[size]}
              ${selectedMood === mood.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'}
            `}>
              {mood.label}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default MoodSelector;