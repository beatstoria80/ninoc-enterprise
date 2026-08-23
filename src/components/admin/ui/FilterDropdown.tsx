import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterDropdownProps {
  label: string;
  icon?: React.ReactNode;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function FilterDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
}: FilterDropdownProps) {
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

  const activeLabel = options.find(o => o.id === value)?.label;
  const isFiltered = value !== 'all';

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
        {icon}
        {isFiltered ? activeLabel : label}
        <ChevronDown size={10} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-white border border-ink/10 rounded-sm shadow-lg"
          >
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); onClose(); }}
                className={cn(
                  "w-full text-left px-1.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors",
                  value === opt.id
                    ? "bg-rose/5 text-rose"
                    : "text-ink/80 hover:bg-ink/5 hover:text-ink"
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
