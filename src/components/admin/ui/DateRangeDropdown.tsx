import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRangeDropdownProps {
  dateFrom: string;
  dateTo: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function DateRangeDropdown({
  dateFrom,
  dateTo,
  onChangeFrom,
  onChangeTo,
  onClear,
  isOpen,
  onToggle,
  onClose,
}: DateRangeDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const isFiltered = dateFrom || dateTo;
  const displayLabel = isFiltered
    ? `${dateFrom || '...'} — ${dateTo || '...'}`
    : 'Date Range';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-medium uppercase tracking-wider transition-colors",
          isFiltered
            ? "bg-rose/10 border border-rose/30 text-rose"
            : "bg-ink/5 text-ink/80 hover:bg-ink/10"
        )}
      >
        <Calendar size={10} />
        {displayLabel}
        <ChevronDown size={10} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 z-50 w-[260px] bg-white border border-ink/10 rounded-sm shadow-lg p-3 space-y-3"
          >
            <div>
              <label className="text-[9px] uppercase tracking-widest text-ink/80 mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => onChangeFrom(e.target.value)}
                className="w-full px-1.5 py-1 border border-ink/10 rounded-sm text-[10px] font-medium text-ink focus:outline-none focus:border-rose/50"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-ink/80 mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => onChangeTo(e.target.value)}
                className="w-full px-1.5 py-1 border border-ink/10 rounded-sm text-[10px] font-medium text-ink focus:outline-none focus:border-rose/50"
              />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-ink/5">
              <button
                onClick={() => { onClear(); onClose(); }}
                className="text-[9px] uppercase tracking-wider font-medium text-ink/80 hover:text-ink transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="text-[9px] uppercase tracking-wider font-medium text-rose hover:text-rose/80 transition-colors"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
