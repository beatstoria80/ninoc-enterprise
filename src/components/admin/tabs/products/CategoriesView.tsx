import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock category data
const MOCK_CATEGORIES = [
  {
    id: '1',
    name: 'Pakaian Pria',
    slug: 'pakaian-pria',
    count: 142,
    children: [
      { id: '1-1', name: 'Atasan', slug: 'pakaian-pria-atasan', count: 85, children: [
        { id: '1-1-1', name: 'Kemeja', slug: 'kemeja-pria', count: 40 },
        { id: '1-1-2', name: 'Kaos', slug: 'kaos-pria', count: 45 },
      ] },
      { id: '1-2', name: 'Bawahan', slug: 'pakaian-pria-bawahan', count: 57 },
    ]
  },
  {
    id: '2',
    name: 'Pakaian Wanita',
    slug: 'pakaian-wanita',
    count: 210,
    children: [
      { id: '2-1', name: 'Atasan', slug: 'pakaian-wanita-atasan', count: 120 },
      { id: '2-2', name: 'Dress', slug: 'dress-wanita', count: 90 },
    ]
  },
  {
    id: '3',
    name: 'Aksesoris',
    slug: 'aksesoris',
    count: 45,
    children: []
  }
];

const CategoryNode = ({ category, level = 0 }: { category: any, level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="w-full">
      <div 
        className={cn(
          "flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg group transition-colors cursor-pointer",
          level > 0 && "ml-6"
        )}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button className="p-0.5 text-gray-400 hover:text-ink hover:bg-gray-100 rounded">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="w-5" /> // spacer
          )}
          <Folder size={14} className={cn("text-gray-400", isExpanded && "text-rose")} />
          <span className="text-xs font-medium text-ink">{category.name}</span>
          <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">/{category.slug}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">{category.count} items</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 text-gray-400 hover:text-rose hover:bg-rose/10 rounded transition-colors" title="Add Subcategory">
              <Plus size={12} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-ink hover:bg-gray-100 rounded transition-colors" title="Edit">
              <Edit2 size={12} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} // Emil's ease-out
            className="overflow-hidden"
          >
            <div className="border-l border-gray-100 ml-5 py-1">
              {category.children.map((child: any) => (
                <CategoryNode key={child.id} category={child} level={level + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function CategoriesView() {
  return (
    <div className="flex flex-col h-full space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium text-ink">Category Hierarchy</h3>
          <p className="text-[10px] text-gray-500">Manage your product taxonomy. Drag and drop to reorder (coming soon).</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded hover:bg-ink/90 transition-colors">
          <Plus size={12} />
          <span className="text-[9px] uppercase tracking-wider">New Category</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto minimal-scroll bg-white border border-gray-100 rounded-xl p-2">
        {MOCK_CATEGORIES.map(category => (
          <CategoryNode key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
