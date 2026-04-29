import React from 'react';
import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mood = 'awful' | 'bad' | 'neutral' | 'good' | 'great';

interface MoodSelectorProps {
  selectedMood: Mood;
  onSelectMood: (mood: Mood) => void;
  size?: 'sm' | 'md' | 'lg';
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const moods: { value: Mood; emoji: string; label: string }[] = [
  { value: 'awful',   emoji: '😞', label: 'Awful'   },
  { value: 'bad',     emoji: '🙁', label: 'Bad'     },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'good',    emoji: '🙂', label: 'Good'    },
  { value: 'great',   emoji: '😁', label: 'Great'   },
];

// ─── Size Maps ────────────────────────────────────────────────────────────────
// FIX: Replaced non-existent Tailwind sizes (w-13, w-15, w-18) with valid ones.
// Tailwind's default scale only includes: w-10, w-11, w-12, w-14, w-16, w-20, w-24, w-28

const circleSize = {
  //           320px          480px          768px          1024px
  sm: 'w-9  h-9  sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-16 lg:h-16',
  md: 'w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-20 xl:h-20',
  lg: 'w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-20 lg:h-20 xl:w-24 xl:h-24 2xl:w-28 2xl:h-28',
};

const emojiSize = {
  sm: 'text-base  sm:text-xl   md:text-2xl  lg:text-3xl',
  md: 'text-xl    sm:text-2xl  md:text-3xl  lg:text-4xl  xl:text-4xl',
  lg: 'text-2xl   sm:text-3xl  md:text-4xl  lg:text-4xl  xl:text-5xl  2xl:text-6xl',
};

const labelSize = {
  sm: 'text-[8px]  sm:text-[10px] md:text-xs',
  md: 'text-[9px]  sm:text-[10px] md:text-xs  lg:text-sm',
  lg: 'text-[10px] sm:text-xs     md:text-sm  lg:text-base',
};

const gapSize = {
  sm: 'gap-1.5 sm:gap-2   md:gap-3   lg:gap-4',
  md: 'gap-2   sm:gap-3   md:gap-4   lg:gap-5   xl:gap-6',
  lg: 'gap-2   sm:gap-3   md:gap-5   lg:gap-6   xl:gap-7   2xl:gap-8',
};

// ─── Component ────────────────────────────────────────────────────────────────
const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onSelectMood,
  size = 'md',
}) => {
  return (
    /**
     * FIX: Replaced `scrollbar-none` (requires external plugin) with inline
     * style `scrollbarWidth: 'none'` which works natively in all modern browsers.
     * Also added WebkitOverflowScrolling for smooth momentum scrolling on iOS.
     */
    <div
      className={`
        flex flex-nowrap justify-center items-end
        w-full min-w-0
        ${gapSize[size]}
        px-1 sm:px-2 md:px-4
        overflow-x-auto
      `}
      style={{
        scrollbarWidth: 'none',           // Firefox
        msOverflowStyle: 'none',          // IE / Edge legacy
        WebkitOverflowScrolling: 'touch', // iOS momentum scroll
      }}
    >
      {moods.map((mood) => {
        const isSelected = selectedMood === mood.value;

        return (
          <motion.button
            key={mood.value}
            type="button"
            onClick={() => onSelectMood(mood.value)}
            whileHover={{ scale: 1.10, y: -2 }}
            whileTap={{ scale: 0.90 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            aria-label={mood.label}
            aria-pressed={isSelected}
            className={`
              /* ── layout ───────────────────────────────── */
              flex flex-col items-center justify-center
              flex-shrink-0
              /* cap max width so buttons don't balloon on 4K */
              max-w-[4.5rem] sm:max-w-[5.5rem] md:max-w-[6rem] lg:max-w-[6rem] xl:max-w-[6rem]

              /* ── sizing per size prop ──────────────────── */
              ${circleSize[size]}

              /* ── shape & transition ────────────────────── */
              rounded-full transition-all duration-100 outline-none aspect-square

              /* ── selected vs idle colours ──────────────── */
              ${isSelected
                ? 'bg-gradient-to-br from-[#6E2B8A] to-[#a323af]  shadow-lg shadow-purple-400/40'
                : `bg-[#E9D5FF] dark:bg-[#2d1b4e]
                   hover:bg-gradient-to-br hover:from-[#6E2B8A] hover:to-[#a323af]
                   focus-visible:ring-2 focus-visible:ring-[#6E2B8A] focus-visible:ring-offset-2`
              }
            `}
          >
            {/* Emoji */}
            <span
              className={`leading-none select-none ${emojiSize[size]}`}
              role="img"
              aria-hidden="true"
            >
              {mood.emoji}
            </span>

            {/* Label — hidden only in 'sm' size */}
            {size !== 'sm' && (
              <span
                className={`
                  mt-0.5 font-semibold leading-tight tracking-wide
                  ${labelSize[size]}
                  ${isSelected
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-300'
                  }
                `}
              >
                {mood.label}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default MoodSelector;