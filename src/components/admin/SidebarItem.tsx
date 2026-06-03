import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
  subItems
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
  subItems?: { label: string; id: string; active?: boolean; onClick?: () => void }[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSub = subItems && subItems.length > 0;

  return (
    <div className="w-full">
      <button
        onClick={() => {
          if (hasSub) setIsOpen(prev => !prev);
          else onClick?.();
        }}
        className={cn(
          "w-full flex items-center justify-between px-6 py-3 transition-all duration-200 border-b border-ink/5",
          active ? "bg-rose text-white" : "text-ink/50 hover:bg-ink/5 hover:text-ink"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className={cn(active ? "text-white" : "text-current")} />
          <span className="text-[10px] font-medium uppercase tracking-[0.3em]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge !== undefined && badge > 0 && (
            <span className={cn(
              "text-[8px] px-2 py-0.5 rounded-full",
              active ? "bg-white/20 text-white" : "bg-rose/10 text-rose"
            )}>
              {badge}
            </span>
          )}
          {hasSub && (
            (isOpen || active) ? <ChevronUp size={14} className={cn(active ? "text-white" : "text-ink/50")} /> : <ChevronDown size={14} className={cn(active ? "text-white" : "text-ink/50")} />
          )}
        </div>
      </button>
      {hasSub && (isOpen || active) && (
        <div className="overflow-hidden bg-ink/[0.02]">
          {subItems.map((sub, i) => (
            <button
              key={i}
              onClick={sub.onClick}
              className={cn(
                "w-full text-left pl-[44px] pr-6 py-2.5 text-[9px] font-medium uppercase tracking-[0.2em] transition-colors duration-200",
                sub.active ? "text-rose" : "text-ink/50 hover:text-ink hover:bg-ink/[0.04]"
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
