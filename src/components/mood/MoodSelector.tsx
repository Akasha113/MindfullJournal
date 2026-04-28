import React from 'react';
import { motion } from 'framer-motion';
import { Mood } from '../../types';

interface MoodSelectorProps {
  selectedMood: Mood;
  onSelectMood: (mood: Mood) => void;
  size?: 'sm' | 'md' | 'lg';
}

const moods: { value: Mood; emoji: string; label: string }[] = [
  { value: 'awful',   emoji: '😞', label: 'Awful'   },
  { value: 'bad',     emoji: '🙁', label: 'Bad'     },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'good',    emoji: '🙂', label: 'Good'    },
  { value: 'great',   emoji: '😁', label: 'Great'   },
];

const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onSelectMood,
  size = 'md',
}) => {
  // ✅ Only valid Tailwind sizes used (no xs:, no w-13, no w-18)
  const circleSize = {
    sm: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16',
    md: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-20 xl:h-20',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24',
  };

  const emojiSize = {
    sm: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    md: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    lg: 'text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl',
  };

  const labelSize = {
    sm: 'text-[9px] sm:text-[10px] md:text-xs',
    md: 'text-[9px] sm:text-[10px] md:text-xs lg:text-sm',
    lg: 'text-[10px] sm:text-xs md:text-sm lg:text-base',
  };

  return (
    <div className="flex justify-center items-center w-full
      gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6
      px-2 sm:px-4
      flex-nowrap overflow-x-auto
    ">
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
              ${selectedMood === mood.value
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-300'
              }
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