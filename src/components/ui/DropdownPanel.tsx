import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function DropdownPanel({ open, className, children }: {open: boolean;className?: string;children: React.ReactNode;}) {
  return (
    <AnimatePresence>
      {open &&
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -4 }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformOrigin: 'top right' }}
        className={cn('absolute right-0 top-full z-[1060] mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-pop', className)}>
        
          {children}
        </motion.div>
      }
    </AnimatePresence>);

}